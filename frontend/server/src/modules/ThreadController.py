#!/usr/bin/env python

import os, sys, time, traceback, json
from pprint import pprint, pformat

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
  a CcdpThreadRequest json object such as:
  
  {
  "name" : null,
  "description" : null,
  "tasks" : [ {
    "name" : null,
    "description" : null,
    "state" : "PENDING",
    "retries" : 3,
    "command" : [ ],
    "configuration" : { },
    "task-id" : "081f5127-7bbc-4801-a809-e252402fddf3",
    "class-name" : null,
    "node-type" : "DEFAULT",
    "reply-to" : "",
    "host-id" : null,
    "submitted" : false,
    "cpu" : 0.0,
    "mem" : 0.0,
    "input-ports" : [ ],
    "output-ports" : [ {
      "port-id" : "port-id-123",
      "from-port" : [ ],
      "to-port" : [ "out1", "out2" ]
    } ],
    "session-id" : null,
    "launched-time" : 0
  } ],
  "nextTask" : {
    "name" : null,
    "description" : null,
    "state" : "PENDING",
    "retries" : 3,
    "command" : [ ],
    "configuration" : { },
    "task-id" : "081f5127-7bbc-4801-a809-e252402fddf3",
    "class-name" : null,
    "node-type" : "DEFAULT",
    "reply-to" : "",
    "host-id" : null,
    "submitted" : false,
    "cpu" : 0.0,
    "mem" : 0.0,
    "input-ports" : [ ],
    "output-ports" : [ {
      "port-id" : "port-id-123",
      "from-port" : [ ],
      "to-port" : [ "out1", "out2" ]
    } ],
    "session-id" : null,
    "launched-time" : 0
  },
  "pendingTasks" : 1,
  "thread-id" : "ec51b58f-ec06-4bf3-84db-4ca71813fcf5",
  "session-id" : null,
  "reply-to" : "",
  "node-type" : "DEFAULT",
  "tasks-submitted" : false,
  "use-single-node" : false,
  "tasks-running-mode" : "PARALLEL"
}
  
  '''
  def __init__(self, thread_req):
    self.__logger = ccdp_utils.setup_logging('ThreadController')
    self.__amq_ip = args.amq_ip
    self.__amq_port = int(args.amq_port)
    self.__amq = AmqClient.AmqClient()
    self.__request = thread_req
    self.__tasks = self.__request['tasks']
    if self.__request['reply-to'] != None and self.__request['reply-to'] != "":
      self.__reply = self.__request['reply-to']
    else:
      self.__reply = None
      
    self.__amq.register("/queue/%s" % self.__request['thread-id'], 
                        on_message=self.__on_message, 
                        on_error=self._on_error)
    self.__logger.info("Connecting to %s:%d" % (self.__amq_ip, self.__amq_port))
    self.__amq.connect(self.__amq_ip)


  def start_thread(self):
    self.__logger.info("Starting Thread")
    if self.__request["tasks-running-mode"] == "PARALLEL":
      all_running = True
      for task in self.__request['tasks']:
        if task['state'] != 'RUNNING':
          self.__logger.info("Task %s is not running, is %s" % (task['task-id'],
                                                                task['state']))
          all_running = False
          break
      
      if all_running:
        body = {'msg-type': 'COMMAND', 'data':{'action': 'START'}} 
        self.__send_msg_to_all_tasks(body)
        
      else:
        self.__logger.info("Not all the tasks are running, waiting 1 second")
        time.sleep(1)
        self.start_thread()
  
    else:
      self.__logger.warn("Need to add when running ins SEQUENCE")
  
  
  def _send_results(self, src, result):
    '''
    [ {
    "port-id" : "port-id-123",
    "from-port" : [ ],
    "to-port" : [ "out1", "out2" ]
  } ],
    '''
    self.__logger.info("Sending results %s" % result)
    msg = {'msg-type': 'RESULT', 'data': result}
    for port in self.__task['out-ports']:
      pid = port['port-id']
      if src == pid:
        to_ports = port['to-port']
        for tgt in to_ports:
          self.__logger.debug("Sending message to %s" % tgt)
          self.__amp.send_message(tgt, msg)
  
  
  def __on_message(self, msg):
    self.__logger.debug("Got results")
    try:
      json_msg = ccdp_utils.json_loads(msg)
      self.__logger.info("Got a message: %s" % pformat(json_msg))
      if json_msg.has_key['msg-type']:
        try:
          msg_type = int(json_msg['msg-type'])
          self.__logger.info("Got a message from the engine")
          msg_type = ccdp_utils.MESSAGES[json_msg['msg-type']]
        except:
          self.__logger.info("Got an internal message")
          msg_type = json_msg['msg-type']
        
        
        
          
      
      
      
      
    except Exception, e:
      self.__logger.error("Got an exception: %s" % str(e))
      
  def _on_error(self, error):
    self.__logger.error("Got some error: %s" % error)
      
  def pause_module(self):
    self.__logger.info("Pausing module")
    body = {'msg-type': 'COMMAND', 'data':{'action': 'PAUSE'}}
    self.__send_msg_to_all_tasks(body)
    
  def stop_module(self):
    self.__logger.info("Stopping module")
    body = {'msg-type': 'COMMAND', 'data':{'action': 'STOP'}}
    self.__send_msg_to_all_tasks(body)
    self.__amq.stop()


  def __send_msg_to_all_tasks(self, body):
    for task in self.__request['tasks']:
      self.__amq.send_message(task['task-id'], body)
  
  def __send_to_gui(self, msg):
    self.__logger.info("Sending message back to GUI")
    if self.__reply != None:
      self.__amq.send_message(self.__reply, msg)
  
  
  
if __name__ == '__main__':
  import argparse, signal

  # engine = None
  # def signal_handler(signal, frame):
  #   print "Got a signal %s" % signal
  #   if engine is not None:
  #     engine.stop()

  #   sys.exit(-1)

  # signal.signal(signal.SIGINT, signal_handler)

  parser = argparse.ArgumentParser()
  parser.add_argument("--amq-ip", default="localhost", 
    help="IP address of the AMQ server")
  parser.add_argument("--amq-port", default="61616", 
    help="Port number of the AMQ server")

  parser.add_argument("--my-queue", default=None, 
    help="The name of the queue to receive data from other modules")
  parser.add_argument("--to-queues", default=None, 
    help="The name of the queues to send data to other modules")
  
  args = parser.parse_args()
  module = CcdpModule(args)
  
  