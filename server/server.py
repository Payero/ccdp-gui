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
import re

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

@app.route("/<version>/Settings/Default", methods=["Get"])
def getApplicationSettings(version):
    ID = request.args.get("id")
    return jsonify(_get_default_settings(g.db, ID))

@app.route("/<version>/Settings/Update", methods=["POST"])
def saveApplicationNewSetting(version):
    data = request.json
    ID = data["username"]
    return jsonify(_save_updated_Settings(g.db,data, ID))

@app.route("/<version>/signIn", methods=["POST"])
def signIn(version):
    data = request.json
    return jsonify(_signIn(g.db, data))

@app.route("/<version>/existUSer", methods=["GET"])
def searchUser(version):
    user= request.args.get("username")
    return jsonify(_search_username(g.db,user))

@app.route("/<version>/RegisterUser", methods=["POST"])
def registerNewUser(version):
    data = request.json
    ID = data["Username"]
    del data["Username"]
    return jsonify(_add_new_User(g.db,ID, data))

@app.route("/<version>/changeUserPassword", methods=["POST"])
def changePassword(version):
    data = request.json
    ID = data["Username"]
    del data["Username"]
    return jsonify(_reset_password(g.db,ID, data))

@app.route("/<version>/SysViewTable", methods=["GET"])
def getSystemInitialData(version):
    size = request.args.get("size")
    gte = request.args.get("gte")
    lte = request.args.get("lte")
    return jsonify(_get_system_data(g.db, size, gte, lte))


@app.route("/<version>/SysViewGraph", methods=["GET"])
def getSystemData(version):
    size = request.args.get("size")
    gte = request.args.get("gte")
    lte = request.args.get("lte")
    time_zone = request.args.get("time_zone")
    interval =  request.args.get("interval")
    return jsonify(_get_system_graph_data(g.db, size, gte, lte, time_zone, interval))


@app.route("/<version>/SessionViewTable", methods=["GET"])
def getSessionData(version):
    sid = " "
    if(request.args.has_key("session")):
        sid = request.args.get("session")
    size = request.args.get("size")
    gte = request.args.get("gte")
    lte = request.args.get("lte")
    from_results = request.args.get("from")
    Data = _get_session_data(g.db, sid,size,gte,lte,from_results)
    if("hits" in Data):
        dicData= Data["hits"]["hits"]
        i = 0
        for source in dicData :
            vm = source["_source"]["instance-id"]
            Runn= _get_VM_numOfTask_perState(g.db,vm, "RUNNING")
            Succ = _get_VM_numOfTask_perState(g.db,vm,"SUCCESSFUL")
            Fail = _get_VM_numOfTask_perState(g.db,vm, "FAILED")
            Data["hits"]["hits"][i]["_source"]["Task-RUNNING"]=Runn["hits"]["total"]
            Data["hits"]["hits"][i]["_source"]["Task-SUCCESSFUL"]=Succ["hits"]["total"]
            Data["hits"]["hits"][i]["_source"]["Task-FAILED"]=Fail["hits"]["total"]
            i= i +1
    dataToSend = {"page": from_results, "results":Data, "gte":gte}
    return jsonify(dataToSend)

    #return jsonify(_get_session_data(g.db,sid,size,gte,lte))

@app.route("/<version>/SessionViewGraph", methods=["GET"])
def getSessionGraphData(version):
    sid = " "
    if(request.args.has_key("session")):
        sid = request.args.get("session")
    size = request.args.get("size")
    gte = request.args.get("gte")
    lte = request.args.get("lte")
    time_zone = request.args.get("time_zone")
    interval =  request.args.get("interval")
    return jsonify(_get_session_graph_data(g.db, sid,size,gte,lte, time_zone,interval))

@app.route("/<version>/TaskStatus", methods=["GET"])
def getTaskStatus(version):
    vm = " "
    if(request.args.has_key("vmId")):
        vm = request.args.get("vmId")
    Runn= _get_VM_numOfTask_perState(g.db,vm, request.args.get("state1"))
    Succ = _get_VM_numOfTask_perState(g.db,vm, request.args.get("state2"))
    Fail = _get_VM_numOfTask_perState(g.db,vm, request.args.get("state3"))
    return jsonify([Runn["hits"]["total"],Succ["hits"]["total"], Fail["hits"]["total"]])


@app.route("/<version>/VMviewTable", methods=["GET"])
def getTask_for_VM(version):
    vm = " "
    if(request.args.has_key("vmId")):
        vm = request.args.get("vmId")
    size = request.args.get("size")
    gte = request.args.get("gte")
    lte = request.args.get("lte")
    return jsonify(_get_taskInfo_forVM(g.db,vm, size,gte,lte))

#####################################################################
# View Functions
#####################################################################
@app.route("/", defaults={'path': ''})
@app.route('/<path:path>')
def home(path):
    return render_template('index.html',  async_mode=socketio.async_mode)

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

def _get_default_settings(db, ID):
    return db.get(index='status-app-settings', doc_type='settings', id=ID)

def _save_updated_Settings(db,data,ID):
    return db.index(index='status-app-settings', doc_type='settings', id=ID, body=data)

def _signIn(db, data):
    print data
    try:
        resutls= db.get(index='status-app-settings',doc_type='settings', id=data["Username"])
        if(resutls["_source"]["Password"] == data["Password"]):
            return ({"validPassword":True})
        else:
            return ({"validPassword":False})
    except:
        return({"found":False})

def _search_username(db,username):
    try:
        resutls= db.get(index='status-app-settings',doc_type='settings', id=username)
        return ({"found":True})
    except:
        return({"found":False})

def _add_new_User(db,ID, data):
    addUser = db.index(index='status-app-settings', doc_type='settings', id=ID, body=data)
    return ({"result": addUser["result"]})

def _reset_password(db,ID, data):
    username_exist = _search_username(db,ID)
    if(username_exist["found"]):
        passChanged = db.index(index='status-app-settings', doc_type='settings', id=ID, body=data)
        return({"result": passChanged["result"]})
    else:
        return({"result": "Username not found"})

def _get_system_data(db, size, gte,lte):
    return  db.search(index='current-resources-index', filter_path=['hits.hits._source'], body={
        "size":size,
        "query":{
            "range":{
              "@timestamp": {
                "gte": gte,
                "lte": lte
               }
            }
        },
        "sort" : [{ "@timestamp" : {"order" : "desc"}}]
    })
def _get_system_graph_data(db,size,gte,lte, time_zone, interval):
    return  db.search(index='engineresources-index', filter_path=['aggregations.2.buckets'], body={
        "size": 0,
        "_source": {
            "excludes": []
        },
        "aggs": {
            "2": {
              "date_histogram": {
                "field": "@timestamp",
                "interval": interval,
                "time_zone": time_zone,
                "min_doc_count": 1
              },
              "aggs": {
                "3": {
                  "terms": {
                    "field": "session-id.keyword",
                    "size": size,
                    "order": {
                      "1": "desc"
                    }
                  },
                  "aggs": {
                    "1": {
                      "max": {
                        "field": "curAvgCPU"
                      }
                    },
                    "5": {
                      "max": {
                        "field": "curAvgMem"
                      }
                    }
                  }
                }
              }
            }
        },
        "stored_fields": [
            "*"
        ],
        "script_fields": {},
        "docvalue_fields": [
            "@timestamp"
        ],
        "query": {
            "bool": {
                "must": [
                    {
                      "match_all": {}
                    },
                    {
                      "range": {
                        "@timestamp": {
                          "gte": gte,
                          "lte": lte,
                        }
                      }
                    }
                ],
              "filter": [],
              "should": [],
              "must_not": []
            }
        }
    })

def _get_session_graph_data(db,sid, size,gte,lte,time_zone,interval):
    if(sid == " "):
        match = {"match_all":{}}
    else:
        match = {"match": {"session-id": sid }}
    return  db.search(index='heartbeats-index', filter_path=['aggregations.2.buckets'], body={
        "size": 0,
        "_source": {
            "excludes": []
        },
        "aggs": {
            "2": {
              "date_histogram": {
                "field": "@timestamp",
                "interval": interval,
                "time_zone": time_zone,
                "min_doc_count": 1
              },
              "aggs": {
                "3": {
                  "terms": {
                    "field": "instance-id.keyword",
                    "size": 200,
                    "order": {
                      "1": "desc"
                    }
                  },
                  "aggs": {
                    "1": {
                      "max": {
                        "field": "system-cpu-load"
                      }
                    },
                    "5": {
                      "max": {
                        "field": "system-mem-load"
                      }
                    }
                  }
                }
              }
            }
        },
        "stored_fields": [
            "*"
        ],
        "script_fields": {},
        "docvalue_fields": [
            "@timestamp"
        ],
        "query": {
            "bool": {
                "must": [
                    match,
                    {
                      "range": {
                        "@timestamp": {
                          "gte": gte,
                          "lte": lte,
                        }
                      }
                    }
                ],
              "filter": [],
              "should": [],
              "must_not": []
            }
        }
    })
def _get_session_data(db, sid,size,gte,lte, from_hits ):
    if(sid == " "):
        match = {"match_all":{}}
    else:
        match = {"match": {"session-id": sid }}
    return  db.search(index='current-heartbeats-index', filter_path=['hits'], body={
        "_source":["instance-id", "@timestamp", "system-cpu-load","system-mem-load","status","last-assignment", "assigned-mem", "assigned-disk", "free-mem","free-disk-space"],
        "from": from_hits,
        "size":size,
        "query": {
            "bool":{
                "must":[
                    match,
                    {
                        "range":{
                          "@timestamp": {
                            "gte": gte,
                            "lte": lte
                           }
                        }
                    }
                ]
            }
        },
        "sort" : [{ "@timestamp" : {"order" : "desc"}}]
    })


def _get_VM_numOfTask_perState(db,vm, state):
    return db.search(index='task-index',filter_path=['hits.total'], sort='@timestamp:desc',body={
      "query": {
        "bool": {
          "must":[
            {
              "match_phrase": {"host-id": vm}
            },
            {
              "match" :{"state" : state}
            }
          ]
        }
      }
    })

def _get_taskInfo_forVM(db,vm, size,gte,lte):
    if(vm == " "):
        match = {"match_all":{}}
    else:
        match = {"match_phrase": {"host-id": vm}}
    return  db.search(index='task-index', filter_path=['hits.hits._source'], body={
        "size":size,
        "query": {
            "bool":{
                "must":[
                    match,
                    {
                        "range":{
                          "@timestamp": {
                            "gte": gte,
                            "lte": lte
                           }
                        }
                    }
                ]
            }
        },
        "sort" : [{ "@timestamp" : {"order" : "desc"}}]
    })

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
