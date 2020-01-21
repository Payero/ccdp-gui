#!/usr/bin/env python
# ~*~ coding: utf-8 ~*~
from flask import (
        Flask,
        request,
        session,
        url_for,
        abort,
        g,
        render_template,
        jsonify
)
import pymongo
import logging
from logging.handlers import RotatingFileHandler
import os
import sys
import json
import ccdp_utils
from pprint import pprint, pformat
import ccdp_utils.AmqClient as AmqClient
from flask_socketio import SocketIO, emit
import eventlet
from modules.ThreadController import ThreadController
from numpy import broadcast
import urllib


class InvalidRequest(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


root_path = '/nishome/oegante/workspace/ccdp-gui/frontend/client'
template_dir = root_path + '/templates'

app = Flask(__name__, root_path=root_path, template_folder=template_dir)
socketio = SocketIO(app, async_mode="threading")

#####################################################################
# View Functions
#####################################################################
@app.route("/")
def home():
    modules = _get_available_modules(g.db)
    threads = _get_available_threads(g.db)
    return render_template('index.html',
                           modules=modules,
                           threads=threads,
                           async_mode=socketio.async_mode)

#####################################################################
# API
#####################################################################
@app.route("/<version>/modules")
def get_modules(version):
    """Retrieves the available modules from the database"""
    return jsonify(_get_available_modules(g.db)), 200

@app.route("/<version>/modules/<module>/properties")
def get_module_properties(version, module):
    """Retrieves the properties of the provided module"""
    return jsonify(_get_module_properties(g.db, module)), 200

@app.route("/<version>/threads/<thread>/properties")
def get_thread_properties(version, thread):
    """Retrieves the properties of the provided thread"""
    return jsonify(_get_thread_properties(g.db, thread)), 200

@app.route("/<version>/status")
def get_status(version):
    """Asks for status from the engine"""
    raise NotImplementedError

@app.route("/<version>/run", methods=["POST"])
def start_processing(version):
    """Sends a thread request to the thread controller"""
    run_json = request.json['body']
#     run_json['configuration'] = urllib.base64.standard_b64encode(str(run_json['configuration']))
    reply_queue = run_json['request']['reply-to']

    run_json = json.dumps(run_json)

    app.config["tc"] = ThreadController(queue_name=reply_queue, # required
                            engine_queue=ccdp_utils.ENG_QUEUE,  # required
                            thread_req=run_json,                # required
                            callback_fn=update_task,            # optional
                            auto_start=True,                    # optional
                            #define broker host and broker port to send to something other than localhost
                            #broker_host="ax-ccdp.com",          # optional
                            #broker_port=61616,                  # optional
                            skip_req=False)                     # optional

    return str(200)

@app.route("/<version>/pause", methods=["POST"])
def pause_processing(version):
    """Sends a pause request to the engine"""
    data = request.json
    print data
    pause_json = json.loads(data)
    print pause_json

    g.amq.send_message(app.config["TO_SERVER_QUEUE_NAME"], pause_json)
    return str(200)

@app.route("/<version>/cancel", methods=["POST"])
def cancel_processing(version):
    """Sends a cancel processing request to the engine"""
    data = request.json
    print data
    cancel_json = json.loads(data)
    print cancel_json

    g.amq.send_message(app.config["TO_SERVER_QUEUE_NAME"], cancel_json)
    return str(200)

@app.route("/<version>/threads")
def get_threads(version):
    """Retrieves the available threads from the database"""
    return jsonify(_get_available_threads(g.db))

@app.route("/<version>/threads/save", methods=["POST"])
def save_thread(version):
    """Saves thread to database"""
    thread = request.json
    return str(_save_thread(g.db, thread)["n"])

@app.route("/<version>/threads/delete/<thread_id>", methods=["DELETE"])
def delete_thread(version, thread_id):
    """Deletes thread from database"""
    return str(_delete_thread(g.db, thread_id).deleted_count)

@app.route("/<version>/projects")
def get_projects(version):
    """Retrieves the available projects from the database"""
    return jsonify(_get_available_projects(g.db))

@app.route("/<version>/projects/save", methods=["POST"])
def save_project(version):
    """Saves project to database"""
    project = request.json
    return str(_save_project(g.db, project)["n"])

@app.route("/<version>/projects/delete/<project_id>", methods=["DELETE"])
def delete_project(version, project_id):
    """Deletes project from database"""
    return str(_delete_thread(g.db, project_id).deleted_count)

@app.route("/<version>/modules/saveFile", methods=["POST"])
def save_module_file(version):
    """Uploads module file to cloud storage"""
    f = request.files['file'];
    if f:
        task = f.read();
        try:
            task_json = json.loads(task)
        except ValueError as e:
            raise InvalidRequest(e.message, status_code=410)
        return str(_save_task(g.db, task_json)["n"])
    raise InvalidRequest("No file received", status_code=410)

@app.route("/<version>/modules/save", methods=["POST"])
def save_module(version):
    """Saves module JSON to database"""
    module = request.json
    print "Received JSON " + json.dumps(request.json)
    return str(_save_module(g.db, module)["n"])




@app.before_request
def before_request():
    g.db = get_db()
    g.amq = get_amq()

@app.teardown_appcontext
def teardown_db(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

#####################################################################
# Helper/Private-ish Functions
#####################################################################
def _get_available_modules(db):
    return list(db["modules"].find({}, {'_id': False}))

def _get_module_properties(db, module):
    return db["modules"].find({"module_name": module}, {'_id': False})

def _get_available_threads(db):
    return list(db["threads"].find({}, {'_id': False}))

def _get_thread_properties(db, thread_name):
    return db["threads"].find({"thread_name": thread_name}, {'_id': False})

def _save_thread(db, thread):
    thread_name = thread["name"]
    thread_query = {"name": thread_name}
    result = db["threads"].update(thread_query, thread, upsert=True)
    return result

def _save_module(db, task):
    print "Saving module " + json.dumps(task)
    task_name = task["name"]
    task_query = {"name": task_name}
    result = db["modules"].update(task_query, task, upsert=True)
    return result

def _delete_thread(db, thread_id):
    result =  db["threads"].delete_one({"name": thread_id})
    return result

def _get_available_projects(db):
    return list(db["projects"].find({}, {'_id': False}))

def _get_project_properties(db, project_name):
    return db["projects"].find({"project_name": project_name}, {'_id': False})

def _save_project(db, project):
    project_name = project["name"]
    project_query = {"name": project_name}
    result = db["projects"].update(project_query, project, upsert=True)
    return result

def _delete_project(db, project_id):
    result =  db["projects"].delete_one({"name": project_id})
    return result

#Callback function to handle forwarding task updates to the client via socketio
def update_task(data):
    data = json.dumps(data)
    app.logger.info('Inside the callback manager')
    app.logger.info(type(data))
    app.logger.info(data)
    #TODO change this from broadcast
    socketio.emit('message', data, broadcast=True)

def connect_to_database():
    return pymongo.MongoClient(app.config["DB_IP"], app.config["DB_PORT"])

#Handler for receiving a socketio msg from the client (currently unused on client end)
@socketio.on("msg")
def onMessage(msg):
    app.logger.info("Got a message: %s" % msg)

def onError(msg):
    app.logger.error("Got an error: %s" % msg)

def connect_to_amq():
    amq = AmqClient.AmqClient()
    amq.register(app.config["TO_SERVER_QUEUE_NAME"], on_message=onMessage, on_error=onError)
    amq.connect(app.config["AMQ_IP"])

    return amq

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = connect_to_database()
    return db[app.config["DB_NAME"]]

def get_amq():
    broker = getattr(g, "amq", None)
    if broker is None:
        broker = g.amq = connect_to_amq()
    return broker


#Triggers when the socketio succesfully connects to a client
@socketio.on("connect")
def connected():
    app.logger.info("USER CONNECTED")

#Triggers when a client disconnects from the socketio
@socketio.on("disconnect")
def disconnected():
    app.logger.info("USER DISCONNECTED")
    socketio = None

@app.errorhandler(InvalidRequest)
def handle_invalid_request(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--ip", default="localhost", help="ip on which the webserver will run")
    parser.add_argument("-p", "--port", type=int, default=5000, help="port on which the webserver will run")
    parser.add_argument("-l", "--logfile", default="/out/ccdp.log", help="path where the logfile will be written to")
    parser.add_argument("-d", "--db", default="", help="database name")
    parser.add_argument("-c", "--collection", default="", help="collection name")
    parser.add_argument("--db-ip", default=os.environ["DB_PORT_27017_TCP_ADDR"], help="ip on which the properties db will run")
    parser.add_argument("--db-port", default=27017, help="port on which the properties db will run")
    parser.add_argument("--amq-ip", default=os.environ["AMQ_PORT_61616_TCP_ADDR"], help="ip on which the engine will run")
    parser.add_argument("--amq-port", default="5672", help="port on which the engine will run")
    parser.add_argument("--seed-db", help="JSON file with which to seed the DB")


    args = parser.parse_args()

    file_handler = RotatingFileHandler(args.logfile, maxBytes=10000, backupCount=1)
    formatter = logging.Formatter(
            "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)

    app.logger.addHandler(file_handler)
    app.config["DB_NAME"] = args.db
    app.config["COLLECTION_NAME"] = args.collection
    app.config["DB_IP"] = args.db_ip
    app.config["DB_PORT"] = int(args.db_port)
    app.config["AMQ_IP"] = args.amq_ip
    app.config["AMQ_PORT"] = int(args.amq_port)
    app.config["FROM_SERVER_QUEUE_NAME"] = ccdp_utils.ENG_QUEUE
    app.config["TO_SERVER_QUEUE_NAME"] = ccdp_utils.WEB_QUEUE
    app.config["DEBUG"] = True
    if os.environ.has_key('CCDP_GUI'):
        path = os.environ['CCDP_GUI']
        if path.endswith('/'):
            path = path[:-1]
        base, name = os.path.split(path)
        client = os.path.join(base, 'client')
        app.config["CLIENT_URL"] = client
    else:
        print "ERROR: The CCDP_GUI needs to be set"
        print "Running from %s" % os.getcwd()
        pprint( os.listdir( os.getcwd() ) )
        sys.exit(-1)


    if args.seed_db:
        with open(args.seed_db) as f:
            parsed_seed_file = json.load(f)
            mongo_db = connect_to_database()[args.db]
            mongo_db.drop_collection(args.collection)
            mongo_db[args.collection].insert_many(parsed_seed_file)
    
    print "Runnning on %s:%s" % (args.ip, args.port)
    socketio.run(app, host=args.ip, port=int(args.port), debug=True)    
