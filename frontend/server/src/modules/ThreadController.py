#!/usr/bin/env python

import os, sys, time, traceback, json
from pprint import pprint, pformat
from optparse import OptionParser
import traceback

# Attempting to use centralized logging for python and AmqClient
try:
  if os.environ.has_key("CCDP_GUI"):
    print "Found CCDP_GUI"
    path = "%s/src" % os.environ["CCDP_GUI"]
    sys.path.append(path)
    import ccdp_utils
    import ccdp_utils.AmqClient as AmqClient

  else:
    print "Could not find CCDP_GUI"
    import __main__
    fname = __main__.__file__
    path, name = os.path.split(fname)
    utils = "%s/../webapp/app" % path
    if os.path.isdir(utils):
      print "Appending %s" % utils
      sys.path.append(utils)
      import ccdp_utils
      import ccdp_utils.AmqClient as AmqClient

    else:
      print "ERROR: Could not find ccdp_utils, exiting"
      sys.exit(-1)

except Exception, e:
  print e
  print "Could not import ccdp_utils"
  sys.exit(-1)


class ThreadController():
  '''
  Controls a single thread.  It is responsible for sending start, pause, stop
  messages as well as to provide feedback about the tasks.  Each object uses 
  a CcdpThreadRequest json object such as the one shown below.
  
  {
  "name" : "CSV Test Thread",
  "description" : "CSV Reading and filtering demo",
  "tasks" : [ {
    "name" : "csv-reader",
    "description" : "Opens a single csv file and process line by line",
    "retries" : 3,
    "command" : ["/nishome/frontend/server/src/CcdpModuleLauncher.py", 
                 "-f", "/nishome/mcbowman/Documents/project/ccdp/webapp/ccdp-gui/frontend/server/src/modules/csv_reader.py",
                 "-c", "CsvReader", 
                 "-a", "broker_host=localhost,task_id=csv-reader,broker_port=61616" ],
    "configuration" : { "filename": "/nishome/mcbowman/Documents/project/ccdp/webapp/frontend/server/data/it_help_desk.csv", 
                        "send-header": "True", 
                        "number-entries": 1},
    "task-id" : "csv-reader",
    "session-id" : "oeg-test",
    "node-type" : "DEFAULT",
    "reply-to" : "CCDP-WebServer",
    "input-ports" : [ ],
    "output-ports" : [ {
      "port-id" : "csv-reader",
      "from-port" : [ ],
      "to-port" : [ "csv-selector" ]
    } ]
  },
  {
    "name" : "csv-selector",
    "description" : "Selects all entries matching a simple criteria",
    "retries" : 3,
    "command" : ["/nishome/mcbowma/Documents/project/ccdp/webapp/frontend/server/src/CcdpModuleLauncher.py", 
                 "-f", "/nishome/mcbowma/Documents/project/ccdp/webapp/frontend/server/src/modules/csv_selector.py",
                 "-c", "CsvSelector", 
                 "-a", "broker_host=localhost,task_id=csv-selector,broker_port=61616" ],
    "configuration" : { "field": "daysOpen", 
                        "operator": "GT", 
                        "value": 1},
    "task-id" : "csv-selector",
    "session-id" : "oeg-test",
    "node-type" : "DEFAULT",
    "reply-to" : "CCDP-WebServer",
    "input-ports" : [ ],
    "output-ports" : [ {
      "port-id" : "csv-selector",
      "from-port" : [ ],
      "to-port" : [ "csv-display" ]
    } ]
  },
  {
    "name" : "csv-display",
    "description" : "Displays filtered entries",
    "retries" : 3,
    "command" : ["/nishome/mcbowma/Documents/project/ccdp/webapp/frontend/server/src/CcdpModuleLauncher.py", 
                 "-f", "/nishome/mcbowma/Documents/project/ccdp/webapp/frontend/server/src/modules/csv_display.py",
                 "-c", "CsvDisplay", 
                 "-a", "broker_host=localhost,task_id=csv-display,broker_port=61616" ],
    "configuration" : { "output-url": "file:///tmp/results.csv"},
    "task-id" : "csv-display",
    "session-id" : "oeg-test",
    "node-type" : "DEFAULT",
    "reply-to" : "CCDP-WebServer",
    "input-ports" : [ ],
    "output-ports" : [ ]
  } ],  
  "thread-id" : "csv-reader-thread-1",
  "session-id" : "oeg-test",
  "reply-to" : "CCDP-WebServer",
  "node-type" : "DEFAULT",
  "tasks-running-mode" : "PARALLEL"
}
  
  '''
  def __init__(self, queue_name, engine_queue, thread_req, 
               broker_host='localhost', broker_port=61616, 
               auto_start=False, callback_fn=None, skip_req=False):
    '''
    Instantiates a new ThreadController object that will send and receive 
    messages as well as coordinate activities between the modules.  

    Inputs:
      - queue_name:   the name of the queue to receive messages from the modules
                      as well as from the ccdp-engine (reply-to field) 
      - engine_queue: the name of the queue to send messages to the ccdp-engine
      - thread_req:   the JSON object containing the thread to run
      - broker_host:  the ip address or hostname where the msg broker is running
      - broker_port:  the port number where the broker is listening for msgs
      - auto_start:   it invokes the start_module method if set to True
      - callback_fn:  a method to pass updates back to the instantiating object
      - skip_req:     it does not send the thread request if set to True.  This
                      is mostly used for testing and development purposes     
    '''
    self.__logger = ccdp_utils.setup_logging(self.__class__.__name__)
    self.__amq_ip = broker_host
    self.__amq_port = int(broker_port)
    self.__amq = AmqClient.AmqClient()
    self.__to_engine = engine_queue
    
    # is set, it is used to update the caller
    if callable(callback_fn):
      self.__callback_fn = callback_fn
    else:
      self.__callback_fn = None
   

    # if is a file or string get the json object
    if os.path.isfile(thread_req):
      with open(thread_req, 'r') as infile:
        self.__request = ccdp_utils.json_load(infile)
    else:
      self.__request = ccdp_utils.json_loads(thread_req)


    self.__tasks = self.__request['tasks']

    #Test the callback function MB
    #self.__callback_fn('test data')
        
    # registering to receive messages    
    self.__amq.connect(self.__amq_ip, 
                       dest="/queue/%s" % queue_name, 
                       on_msg=self.__on_message, 
                       on_error=self.__on_error)

    self.__logger.debug("Done setting up, sending request to %s" % 
                        self.__to_engine)
    
    if not skip_req:
      self.__amq.send_message(self.__to_engine,  self.__request )
    else:
      self.__logger.info("Skipping sending request")

    if auto_start:
      if skip_req:
        self.__logger.info("Starting all modules automatically")
        self.__send_msg_to_all_tasks( 'START' )
      else:
        self.start_thread()

    #Can test just sending a reply in the thread controller if I can't get a response from the test engine MB
    '''
    update_msg = {}
    update_msg['msg-type'] = 4
    update_msg['ccdp-task'] = task
    #self.__logger.debug("Sending Running Message: %s " % pformat(update_msg))
    #self.__amq.send_message(reply_to, json.dumps(update_msg))
    self.__on_message(reply_to, json.dumps(update_msg))  
    wait = randint(0,5)
    self.__logger.debug("Waiting for %d for task %s" % (wait, tid))
    time.sleep(wait)
    update_msg['ccdp-task']['state'] = "SUCCESSFUL"
    self.__logger.debug("Sending Successful Message: %s " % pformat(update_msg))
    self.__amq.send_message(reply_to, json.dumps(update_msg))
    ''' 

  def start_thread(self):
    '''
    It waits for all the tasks to have the state set to 'RUNNING' indicating
    that the ccdp-engine has launched them all and they are ready to start
    processing data.  Once the modules are up and running, it sends a 'START'
    command to each one of the modules and passes the ccdp-task so the modules
    would have all the information they need
    '''
    self.__logger.info("Starting Thread")

    # the thread can run in parallel or sequentially
    if self.__request["tasks-running-mode"] == "PARALLEL":
      all_running = True
      for task in self.__tasks:
        if task.has_key('state') and task['state'] != 'RUNNING':
          self.__logger.info("Task %s is not running, is %s" % (task['task-id'],
                                                                task['state']))
          all_running = False
          break
      
      # if all the modules are running then send a 'START' command to them
      if all_running:
        self.__send_msg_to_all_tasks( 'START' )
        
      else:
        self.__logger.info("Not all the tasks are running, waiting 1 second")
        time.sleep(1)
        self.start_thread()
  
    else:
      txt = "Running in SEQUENCE mode, tasks will be started after receiving "
      txt += "status update from the ccdp-engine"
      self.__logger.warn(txt)

  
  
  def stop_thread(self):
    '''
    Sends a 'STOP' command to all the modules running on this thread and then
    closes all the connections.
    '''
    self.__logger.info("Stopping Thread")
    self.__send_msg_to_all_tasks( 'STOP' )
    self.__amq.stop()
    self.__logger.debug("Done!!")

    

  def __on_message(self, msg):
    '''
    If the reply-to field is set, then it sends the results back to the GUI.

    Inputs
      - msg: the update message received from the ccdp-engine
    '''
    self.__logger.info("Got results: %s" % msg)
    try:
      json_msg = ccdp_utils.json_loads(msg)
      self.__logger.info("Got a message: %s" % pformat(json_msg))
      if json_msg.has_key('msg-type'):
        try:
          msg_type = int(json_msg['msg-type'])
          self.__logger.info("Got a message from the engine")
          msg_type = ccdp_utils.MESSAGES[json_msg['msg-type']]
        except:
          self.__logger.info("Got an internal message")
          msg_type = json_msg['msg-type']
        
        # if is an update, send it to the GUI and check running mode
        if msg_type == 'TASK_UPDATE':
          self.__logger.debug("Got a task update message")
          if self.__callback_fn is not None:
            body = {'msg-type': msg_type, 'data':{'task':json_msg['task']}}
            self.__callback_fn(body)

          # if we are running sequentially, then the next 'RUNNING' status 
          # update should be the one we want
          if self.__request["tasks-running-mode"] == "SEQUENTIAL":
            upd_task = msg['task']
            self.__logger.debug("Looking for task: %s" % upd_task['task-id'])
            if upd_task['state'] == 'RUNNING':
              for task in self.__tasks:
                if upd_task['task-id'] == task['task-id']:
                  self.__logger.debug("Found the task, sending start command")
                  self.__send_msg_to_task('START', task)
            elif upd_task['state'] == 'FAILED':
              self.__logger.warn("Task %s failed" % upd_task['task-id'])
            elif upd_task['state'] == 'KILLED':
              self.__logger.warn("Task %s was killed " % upd_task['task-id'])


    except Exception, e:
      self.__logger.error("Got an exception: %s" % str(e))
      traceback.print_exc()
      

  def __on_error(self, error):
    '''
    This method is invoked if there is an error message sending and receiving
    data from the AMQ client.  If the GUI provided a callback_fn function to the
    ThreadController, then this error message is passed to the GUI.

    Inputs:
      - error: the error message from the AMQ client
    '''
    self.__logger.error("Got some error: %s" % error)
    if callable(self.__callback_fn):
      body = {'msg-type': 'MESSAGE', 'data':{'type':'ERROR', 'message': error}}
      self.__callback_fn(body)

      
  def pause_module(self):
    '''
    Sends a pause request to all the modules, but does not provide any sort of 
    assurance the modules will do as such.
    '''
    self.__logger.info("Pausing module")
    self.__send_msg_to_all_tasks( 'PAUSE' )
    
  def stop_module(self):
    '''
    Sends a stop request to all the modules, but does not provide any sort of 
    assurance the modules will do as such.  

    IMPORTANT: Once the messages are sent, the ThreadController cleans up all 
               the coneections and is no longer usable
    '''
    self.__logger.info("Stopping module")
    self.__send_msg_to_all_tasks( 'STOP' )
    self.__amq.stop()


  def __send_msg_to_task(self, action, task):
    '''
    Private method to send information to a single task.  The messages are
    all the same with the exception of the action to perform.  The structure
    of the message is as follow:
    
      {'msg-type': 'COMMAND', 'data':{'action': <action>, 'task': <ccdp-task>}}

    Where action is one of the following options:
      - START
      - PAUSE
      - STOP
    and the ccdp-task is the json information given for this particular task
    when launching the thread

    Inputs:
      - action: the action to perform by the module
      - task:   the JSON information about this particular task

    '''
    body = {'msg-type': 'COMMAND', 'data':{'action': action, 'task': task}}
    #Commented command sends the message to a queue labeled with the task-id, don't think this is correct MB
    #self.__amq.send_message(task['task-id'],  json.dumps(body) )
    self.__amq.send_message(self.__to_engine,  json.dumps(body) )

  def __send_msg_to_all_tasks(self, action):
    '''
    Sends the same message to all the tasks in the thread.  For specific 
    information regarding the message, look at the __send_msg_to_task method.

    Inputs:
      - action: the action to perform either START, PAUSE, or STOP
    '''
    for task in self.__request['tasks']:
      self.__logger.info('Sending %s message to %s' % (action, task['task-id']))
      self.__send_msg_to_task(action, task)
  

  
if __name__ == '__main__':

  parser = OptionParser()
  parser.add_option('-b', "--broker-ip", 
                default="localhost",
                dest='broker_host', 
                help="IP address of the broker server")
  parser.add_option('-p', "--broker-port", 
                default=61616,
                dest='broker_port', 
                help="The port number the broker server")

  parser.add_option('-q', "--my-queue", 
                default=ccdp_utils.WEB_QUEUE,
                dest='my_queue', 
                help="The name of the queue to receive data from other modules")
  
  parser.add_option('-t', "--thread-req", 
                default=None,
                dest='thread_req', 
                help="Either the name of the file or the string with the req.")

  parser.add_option('-e', "--engine-queue", 
                default=ccdp_utils.ENG_QUEUE,
                dest='eng_queue', 
                help="The name of the queue to send requests to the engine")

  parser.add_option('-s', "--skip-request", 
                action='store_true',
                default=False,
                dest='skip_req', 
                help="Skips sending the request if present")
  
  parser.add_option('-a', "--auto-start", 
                action='store_true',
                default=False,
                dest='auto_start', 
                help="Sends a 'start module as soon as they are running")


  (options, args) = parser.parse_args()
  # it expects a dictionary 
  opts = vars(options)

  tc = ThreadController(queue_name=opts['my_queue'], 
                        engine_queue=opts['eng_queue'],
                        thread_req=opts['thread_req'],
                        broker_host=opts['broker_host'], 
                        broker_port=opts['broker_port'],
                        skip_req=opts['skip_req'],
                        auto_start=opts['auto_start'])


  time.sleep(15)
  print("Stopping all threads")
  tc.stop_thread() 
