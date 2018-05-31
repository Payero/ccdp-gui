#!/usr/bin/env python

from flask import Flask
from flask import Flask, flash, redirect, render_template, request, session, abort
from flask_login import LoginManager, UserMixin, \
                                login_required, login_user, logout_user 


import ccdp_utils, os, sys, time, logging, uuid, webbrowser, threading, json, urllib
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
    WAIT_FOR_MSG=True,
    REQ_MSG_FILE= os.environ['CCDP_GUI'] + "/data/start_task.json",
    ADD_MSG_FILE= os.environ['CCDP_GUI'] + "/data/additional_task.json",
    KILL_MSG_FILE= os.environ['CCDP_GUI'] + "/data/kill_task.json",
    NIFI_URL='http://%s:8080/nifi',
    NIFI_CMD=["/opt/nifi/bin/nifi.sh", "run"],
    SESSION_NUMBER=1
)

__users = ['Mark', 'Mindy', 'Oscar']
__SESSIONS = {}


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


@app.route('/test',  methods=['GET', 'POST'])
def test():
  app.logger.debug("Testing Page")

  time.sleep(5)
  app.logger.debug("Done waiting")

  return render_template('test.html')



@app.route('/')
def home():
  app.logger.debug("At Home EndPoint")

  if not session.get('logged_in'):
    return render_template('nifi_login.html')
  else:
    user = session['user']
    user_session = __SESSIONS[app.session_id]
    if user_session['open-nifi']:
      url = app.config['NIFI_URL'] % user_session['hostname']
      webbrowser.open_new_tab( url )
    
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
    sid = "%s-%03d" % ( username , app.config['SESSION_NUMBER'] )
    app.config['SESSION_NUMBER'] += 1
    
    app.session_id = sid
    __SESSIONS[sid] = {'session-id': sid}

    send_start_msg()

  else:
    flash('wrong password!')
  
  return home()
 

def connect_to_amq(onMsg=None, onErr=None):
  app.logger.debug("Connecting to ther Server %s:%d" % 
                   (app.config["AMQ_IP"], app.config["AMQ_PORT"]) )
  amq = AmqClient.AmqClient()
  amq.connect(app.config["AMQ_IP"], 
              dest="/queue/" + app.config["FROM_CCDP_ENG"], 
              on_message=onMsg, 
              on_error=onErr)
  return amq



def send_start_msg():
  app.logger.info("Sending start message")

  sid = app.session_id
  user_session = __SESSIONS[ sid ]
  user_session['open-nifi'] = False

  def onMessage(msg):
    app.logger.debug("Got a message: %s" % msg)

    json_msg = json.loads(msg)
    if json_msg['msg-type'] == ccdp_utils.MSG_TYPE.TASK_UPDATE:
      app.logger.info("Got a Task Update Message")
      task = json_msg['task']
      if task['task-id'] == user_session['task-id']:
        app.logger.info("And is my task")
        if task['state'] == 'RUNNING':
          app.logger.info("And is RUNNING")
          user_session['hostname'] = task['hostname']
          __SESSIONS[sid] = user_session
          

  def onError(msg):
      app.logger.error("Got an error: %s" % msg)


  amq = connect_to_amq(onMessage, onError)
  amq.send_message(app.config["TO_CCDP_ENG"], get_request(sid, 'START') )
  
  app.logger.info("User Session: %s" % pformat(user_session) )

  if app.config['WAIT_FOR_MSG']:
    is_open = False
    while not is_open:
      try:
        if user_session.has_key('hostname'):
          url = app.config['NIFI_URL'] % user_session['hostname']
          app.logger.debug("NiFi URL: %s" % url)

          code = urllib.urlopen( url ).getcode()
          if code == 200:
            app.logger.info("NiFi is up and running")
            is_open = True
            user_session['open-nifi'] = True
            __SESSIONS[sid] = user_session
        else:
          app.logger.debug("Waiting for NiFi to open")
          time.sleep(0.5)
      except:
        time.sleep(0.5)

  else:
    app.logger.debug("Simulating activity...")
    time.sleep(3)
    

  amq.stop()



@app.route("/logout", methods=["POST"])
def logout():

  session['logged_in'] = False
  sid = app.session_id
  app.logger.info("Ending Session %s" % sid)
  amq = connect_to_amq()
  amq.send_message(app.config["TO_CCDP_ENG"], get_request(sid, 'STOP') )
  amq.stop()

  if __SESSIONS.has_key( sid ):
    __SESSIONS.pop( sid )
  else:
    app.logger.error("The Session %s was not found" % sid)


  return home()
 
@app.route("/send_additional_task", methods=["POST"])
def additional_task():

  sid = app.session_id
  app.logger.info("Sending additional Task to %s" % sid)
  amq = connect_to_amq()
  amq.send_message(app.config["TO_CCDP_ENG"], get_request(sid, 'TASK') )
  amq.stop()


  return home()
 


def get_request( sid, action ):
  app.logger.debug("Getting request for %s" %  session['user'] )

  if action == 'START':
    app.logger.debug("Generating a Start Request")
    fname = app.config['REQ_MSG_FILE'] 
    app.logger.info("Using template file %s" % fname)
    
    req = json.load( open( fname, 'r') )
    task = req['request']['tasks'][0]
    task['reply-to'] = app.config["FROM_CCDP_ENG"]
    req['reply-to'] = app.config["FROM_CCDP_ENG"]

    tid = str(uuid.uuid4())
    user_session = __SESSIONS[ sid ]
    user_session['task-id'] = tid
    __SESSIONS[sid] = user_session

    req['request']['session-id'] = sid

    task['task-id'] = tid
    task['session-id'] = sid
    
    req['request']["tasks"][0] = task

  elif action == 'TASK':
    app.logger.debug("Generating a Task Request")
    fname = app.config['ADD_MSG_FILE'] 
    app.logger.info("Using template file %s" % fname)
    
    req = json.load( open( fname, 'r') )
    task = req['request']['tasks'][0]
    task['reply-to'] = app.config["FROM_CCDP_ENG"]
    req['reply-to'] = app.config["FROM_CCDP_ENG"]

    tid = str(uuid.uuid4())
    user_session = __SESSIONS[ sid ]
    user_session['open-nifi'] = False
    user_session['task-id'] = tid
    __SESSIONS[sid] = user_session

    req['request']['session-id'] = sid

    task['task-id'] = tid
    task['session-id'] = sid
    
    req['request']["tasks"][0] = task

  else:
    app.logger.debug("Generating a Stop Request")
    
    fname = app.config['KILL_MSG_FILE']
    app.logger.info("Using template file %s" % fname)
    
    req = json.load( open( fname, 'r') )
    task = req['task']

    user_session = __SESSIONS[sid]
    task['reply-to'] = app.config["FROM_CCDP_ENG"]
    task['task-id'] = user_session['task-id'] 
    task['session-id'] = sid 
    req["task"] = task
  

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
