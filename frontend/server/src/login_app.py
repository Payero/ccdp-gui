#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import (
  Flask, 
  Response, 
  redirect, 
  url_for, 
  request, 
  session, 
  abort, 
  redirect,
  abort,
  g,
  render_template,
  jsonify
)

import webbrowser

from flask_login import LoginManager, UserMixin, \
                                login_required, login_user, logout_user 

import ccdp_utils
from pprint import pprint, pformat
import ccdp_utils.AmqClient as AmqClient
import os, sys
from flask_socketio import SocketIO, emit
import logging, uuid
from logging.handlers import RotatingFileHandler
import time

__users = ['Mark', 'Mindy', 'Oscar']


app = Flask(__name__, root_path=os.environ['CCDP_GUI']+'/../client')
socketio = SocketIO(app, async_mode="threading")

# config
app.config.update(
    DEBUG = True,
    SECRET_KEY = 'secret_xxx'
)

# flask-login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"


# silly user model
class User(UserMixin):

    
    def __init__(self, name):
        print "Creating a new User: %s" % name
        self.id = id
        self.name = str(name)
        self.password = self.name
        
    def __repr__(self):
        return "%d/%s/%s" % (self.id, self.name, self.password)


# create some users with ids 1 to 20       
users = [User(name) for name in __users]


# some protected url
@app.route('/')
@login_required
def home():
    print "Calling home"
    return Response('Hello World')

 
# somewhere to login
@app.route("/login", methods=["GET", "POST"])
def login():
    print "Login in"
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']       
        next_val = request.args.get('next')
        print "User %s next %s" % (username, next_val)

        if password == username:
            print "Valid username"
            user = User(username)
            login_user(user)
            send_start_msg()
            time.sleep(3)
            #return redirect(request.args.get("next"))
            #return redirect('http://localhost:8080/brecky')
            webbrowser.open_new_tab('http://localhost:8080/brecky')

        else:
            return abort(401)
    else:
        print "Login request is not POST"
        return Response('''
        <form action="" method="post">
            <p><input type=text name=username>
            <p><input type=password name=password>
            <p><input type=submit value=Login>
        </form>
        ''')


# somewhere to logout
@app.route("/logout")
@login_required
def logout():
    print "Login Out of here"
    logout_user()
    return Response('<p>Logged out</p>')


# handle login failed
@app.errorhandler(401)
def page_not_found(e):
    return Response('<p>Login failed</p>')
    
    
# callback to reload the user object        
@login_manager.user_loader
def load_user(userid):
    print "Loading user %s" % str(userid)
    return User(userid)
    



def connect_to_amq(onMsg, onErr):
  print "Connecting to ther Server %s:%d" % (app.config["AMQ_IP"], app.config["AMQ_PORT"])
  amq = AmqClient.AmqClient()
  amq.connect(app.config["AMQ_IP"], 
              dest="/queue/CcdpTaskingActivity", 
              on_message=onMsg, 
              on_error=onErr)
  return amq



def send_start_msg():
  app.logger.info("Sending start message")

  def onMessage(msg):
      app.logger.info("Got a message: %s" % msg)
      return str(200)


  def onError(msg):
      app.logger.error("Got an error: %s" % msg)



  amq = connect_to_amq(onMessage, onError)

  req = {}
  req['msg-type'] = 1
  req['reply-to'] = app.config["FROM_CCDP_ENG"]

  req['request'] = {}
  req['request']["name"] = "NiFi Session"
  req['request']['session-id'] = 'oeg-123'
  req['request']["description"] = "Starts a new NiFi Session"
  req['request']["tasks"] = []
  task = {}
  task['name'] = 'NiFi Start'
  task['description'] = "Start NiFi Application"
  task['state'] = "PENDING"
  task['retries'] = 3
  task['command'] = ["/home/oeg/dev/oeg/brecky/app/brecky.py"]
  task['task-id'] = str(uuid.uuid4())
  task['reply-to'] = app.config["FROM_CCDP_ENG"]
  task['node-type'] = "DEFAULT"
  task['submitted'] = False
  task['cpu'] = 100.0
  task['session-id'] = 'oeg-123'
  req['request']["tasks"].append(task)

  amq.send_message(app.config["TO_CCDP_ENG"], req )
  

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
