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
from elasticsearch import Elasticsearch
import logging
from logging.handlers import RotatingFileHandler
import os
import sys
import json
from pprint import pprint, pformat
from flask_socketio import SocketIO, emit
import eventlet
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

#Instatiate the flask object
app = Flask(__name__,root_path=os.environ['CCDP_VI']+'/../client')

#Used for low latency bi-directional communications
socketio = SocketIO(app, async_mode="threading")

#####################################################################
# View Functions
#####################################################################
@app.route("/")
def home():
    return render_template('index.html',  async_mode=socketio.async_mode)

#####################################################################
# API
#####################################################################

#registers a function to run before each request
@app.before_request
def before_request():
    g.db = get_db()

#Function to be called when the application context end
@app.teardown_appcontext
def teardown_db(exception):
    db = getattr(g, "_database", None)
    #if db is not None:
        #not a way to close Elasticsearch

@app.route("/<version>/SysViewTable", methods=["GET"])
def getSystemData(version):
    return jsonify(_get_system_data(g.db))

@app.route("/<version>/SessionViewTable", methods=["GET"])
def getSessionData(version):
    return jsonify(_get_session_data(g.db))

#####################################################################
# Helper/Private-ish Functions
#####################################################################
#function used to create a Elasticsearch client
def connect_to_database():
    return Elasticsearch('http://'+ str(app.config["DB_IP"])+ ':' + str(app.config["DB_PORT"]) )

#Function the creates resource db if it does not exist yet
def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = connect_to_database()
    return db

def _get_system_data(db):
    return  db.search(index='engineres-index', filter_path=['hits.hits._source'], size=300, sort='@timestamp:desc')

def _get_session_data(db):
    SessionData = db.search(index='heartbeats-index', filter_path=['hits.hits._source'], size=90, sort='@timestamp:desc')
    i = 0
    for data in SessionData["hits"]["hits"]:
        vmID =  data["_source"]["instance-id"]
        AvgCPU = data["_source"]["assigned-cpu"]
        if AvgCPU != 0:
            AvgCPU = (AvgCPU/data["_source"]["total-cpu"])*100
        SessionData["hits"]["hits"][i]["_source"]["AvgCPU"] = AvgCPU
        AvgMem = data["_source"]["assigned-mem"]
        if AvgMem != 0:
            AvgMem = (AvgMem/data["_source"]["total-mem"])*100
        SessionData["hits"]["hits"][i]["_source"]["AvgMem"] = AvgMem
        Succ = get_VM_numOfTask_perState(db,vmID, "SUCCESSFUL")
        Runn = get_VM_numOfTask_perState(db,vmID, "RUNNING")
        Fail = get_VM_numOfTask_perState(db,vmID, "FAILED")
        SessionData["hits"]["hits"][i]["_source"]["Task-completed"] = Succ["hits"]["total"]
        SessionData["hits"]["hits"][i]["_source"]["Task-running"] = Runn["hits"]["total"]
        SessionData["hits"]["hits"][i]["_source"]["Task-failed"] = Fail["hits"]["total"]
        i = i+1
    return  SessionData

def get_VM_numOfTask_perState(db,vm, state):
    return db.search(index='task-index',filter_path=['hits.total'], body={
      "query": {
        "bool": {
          "must":[
            {
              "match_phrase": {
              "host-id": vm
              }
            },
            {
              "match" :{
                "state" : state
              }
            }
          ]
        }
      }})
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

#####################################################################
# Main function
#####################################################################
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--ip", default="localhost", help="ip on which the webserver will run")
    parser.add_argument("-p", "--port", type=int, default=5000, help="port on which the webserver will run")
    parser.add_argument("-l", "--logfile", default="/out/ccdp_visualization.log", help="path where the logfile will be written to")
    parser.add_argument("-d", "--db", default="", help="database name")
    parser.add_argument("--db-ip", default=os.environ["DB_PORT_9200_TCP_ADDR"], help="ip on which the properties db will run")
    parser.add_argument("--db-port", default=27017, help="port on which the properties db will run")

    args = parser.parse_args()

    file_handler = RotatingFileHandler(args.logfile, maxBytes=10000, backupCount=1)
    formatter = logging.Formatter(
            "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)

    app.logger.addHandler(file_handler)
    app.config["DB_NAME"] = args.db
    app.config["DB_IP"] = args.db_ip
    app.config["DB_PORT"] = int(args.db_port)
    app.config["DEBUG"] = True
    if os.environ.has_key('CCDP_VI'):
        path = os.environ['CCDP_VI']
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

    #run the server
    socketio.run(app,  host=args.ip, port=int(args.port), debug=True)
