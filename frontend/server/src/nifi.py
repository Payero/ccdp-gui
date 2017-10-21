#!/usr/bin/env python

from flask import Flask
from flask import Flask, flash, redirect, render_template, request, session, abort
from flask_login import LoginManager, UserMixin, \
                                login_required, login_user, logout_user 


import ccdp_utils, os, sys, time, logging, uuid, webbrowser, threading, json
from pprint import pprint, pformat
import ccdp_utils.AmqClient as AmqClient
from flask_socketio import SocketIO, emit
from logging.handlers import RotatingFileHandler


app = Flask(__name__, root_path=os.environ['CCDP_GUI']+'/../client')
socketio = SocketIO(app, async_mode="threading")

# config
app.config.update(
    DEBUG = True,
    SECRET_KEY = os.urandom(12),
    WAIT_FOR_MSG=False,
    NIFI_URL='http://localhost:8080/brecky',
    SESSION_NUMBER=1
)

__users = ['Mark', 'Mindy', 'Oscar']
__session_keys = ['user', 'session-id', 'task-id', 'open-nifi', 'logged_in']


# silly user model
class User(UserMixin):

    
  def __init__(self, name):
    print "Creating a new User: %s" % name
    #self.id = id
    self.name = str(name)
    self.password = self.name
  
  def __repr__(self):
    return "%s/%s" % (self.name, self.password)


  def get_name(self):
    return self.name

  def get_password(self):
    return self.password


# create some users with ids 1 to 20       
users = [User(name) for name in __users]


@app.route('/')
def home():
  print "At Home"
  if not session.get('logged_in'):
    return render_template('nifi_login.html')
  else:
    user = session['user']
    
    if session['open-nifi']:
      webbrowser.open_new_tab( app.config['NIFI_URL'] )
    
    return render_template('nifi_logout.html', username=user)





@app.route('/login', methods=['POST'])
def do_admin_login():
  print "Doing Admin Login"
  username = request.form['username']
  password = request.form['password']       
  next_val = request.args.get('next')
  print "User %s next %s" % (username, next_val)

  if password == username:
    print "Valid username"
    user = User(username)

    session['logged_in'] = True
    session['user'] = username
    send_start_msg()

  else:
    flash('wrong password!')
  
  return home()
 

def connect_to_amq(onMsg=None, onErr=None):
  print "Connecting to ther Server %s:%d" % (app.config["AMQ_IP"], app.config["AMQ_PORT"])
  amq = AmqClient.AmqClient()

  amq.connect(app.config["AMQ_IP"], 
              dest="/queue/" + app.config["FROM_CCDP_ENG"], 
              on_message=onMsg, 
              on_error=onErr)
  return amq



def send_start_msg():
  app.logger.info("Sending start message")

  event = threading.Event()
  session['open-nifi'] = False

  def onMessage(msg):
    app.logger.debug("Got a message: %s" % msg)
    print "**********************************\nGot a message: %s\n\n" % msg
    json_msg = json.loads(msg)
    if json_msg['msg-type'] == 4:
      app.logger.info("Got a Task Update Message")
      task = json_msg['task']
      if task['task-id'] == session['task-id']:
        app.logger.info("And is my task")
        if task['state'] == 'RUNNING':
          app.logger.info("And is RUNNING")
          session['open-nifi'] = True


        event.set()


  def onError(msg):
      app.logger.error("Got an error: %s" % msg)


  amq = connect_to_amq(onMessage, onError)
  amq.send_message(app.config["TO_CCDP_ENG"], get_request() )
  
  if app.config['WAIT_FOR_MSG']:
    while not event.isSet():
      print "Waiting a little"
      time.sleep(0.5)

  amq.stop()



@app.route("/logout", methods=["POST"])
def logout():
  print "Loging out"
  session['logged_in'] = False
  
  amq = connect_to_amq()
  amq.send_message(app.config["TO_CCDP_ENG"], get_request() )
  amq.stop()

  for key in __session_keys:
    if session.has_key(key):
      session.pop(key)


  return home()
 


def get_request():
  app.logger.debug("Getting request for %s" %  session['user'] )

  req = {}
  req['request'] = {}
  task = {}

  if not session.has_key('task-id'):
    app.logger.debug("Did not found task id so it must me a start request")
    
    sid = "%s-%03d" % ( session['user'], app.config['SESSION_NUMBER'] )
    app.config['SESSION_NUMBER'] += 1

    tid = str(uuid.uuid4())
    session['session-id'] = sid
    session['task-id'] = tid


    req['msg-type'] = 1
    req['request']['session-id'] = sid
    req['request']["description"] = "Starts a new NiFi Session"
    

    task['task-id'] = tid
    task['session-id'] = sid
    task['name'] = 'NiFi Start'
    task['description'] = "Starts NiFi Application"


  else:
    app.logger.debug("Found a task id so it must me a stop request")
    req['msg-type'] = 3
    req['request']['session-id'] = session['session-id']
    req['request']["description"] = "Stops a new NiFi Session"

    task['task-id'] = session['task-id'] 
    task['session-id'] = session['session-id'] 
    task['name'] = 'NiFi Stop'
    task['description'] = "Stops NiFi Application"

  
  
  req['reply-to'] = app.config["FROM_CCDP_ENG"]

  
  req['request']["name"] = "NiFi Session"
  req['request']["tasks"] = []
  
  
  task['state'] = "PENDING"
  task['retries'] = 3
  task['command'] = ["/home/oeg/dev/oeg/brecky/app//brecky.py"]
  task['reply-to'] = app.config["FROM_CCDP_ENG"]
  task['node-type'] = "NIFI"
  task['submitted'] = False
  task['cpu'] = 100.0
  req['request']["tasks"].append(task)

  return req



if __name__ == '__main__':
  import argparse

  parser = argparse.ArgumentParser()
  parser.add_argument("-i", "--ip", default="localhost", help="ip on which the webserver will run")
  parser.add_argument("-p", "--port", type=int, default=5000, help="port on which the webserver will run")
  parser.add_argument("-l", "--logfile", default="/tmp/login.log", help="path where the logfile will be written to")
  parser.add_argument("--amq-ip", default="localhost", help="ip on which the engine will run")
  parser.add_argument("--amq-port", default="5672", help="port on which the engine will run")


  args = parser.parse_args()

  file_handler = RotatingFileHandler(args.logfile, maxBytes=10000, backupCount=1)
  formatter = logging.Formatter(
          "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
  file_handler.setFormatter(formatter)

  app.logger.addHandler(file_handler)
  app.config["AMQ_IP"] = args.amq_ip
  app.config["AMQ_PORT"] = int(args.amq_port)
  app.config["TO_CCDP_ENG"] = ccdp_utils.ENG_QUEUE
  app.config["FROM_CCDP_ENG"] = ccdp_utils.WEB_QUEUE
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


  socketio.run(app, host=args.ip, port=int(args.port), debug=True)
