#!/usr/bin/env python

import os, sys, time, traceback
from pprint import pprint, pformat
import inspect, json
from __builtin__ import isinstance
import Queue

# Attempting to use centralized logging for python and AmqClient
try:
  if os.environ.has_key("CCDP_GUI"):
    print "Found CCDP_GUI"
    path = "%s/src" % os.environ["CCDP_GUI"]
    sys.path.append(path)
    import ccdp_utils
    import ccdp_utils.AmqClient as AmqClient
    from ccdp_utils.TimerTask import TimerTask

  else:
    print "Could not find CCDP_GUI"
    import __main__
    fname = __main__.__file__
    path, name = os.path.split(fname)
    utils = "%s/../" % path
    if os.path.isdir(utils):
      print "Appending %s" % utils
      sys.path.append(utils)
      import ccdp_utils
      import ccdp_utils.AmqClient as AmqClient
      from ccdp_utils.TimerTask import TimerTask

    else:
      print "ERROR: Could not find ccdp_utils, exiting"
      sys.exit(-1)

except Exception, e:
  print e
  print "Could not import ccdp_utils"
  sys.exit(-1)


class CcdpModule(object):
  '''
  Class used as the parent class for all the python modules written for CCDP.
  It is intented to simplify the module development.  The configuration passed 
  to this module should be a valid CcdpTaskRequest such as:
  
  {
    "name" :          the human readable name
    "description" :   some text describing what the module does
    "state" :         the current processing state of the task
    "retries" :       how many times to retry before failing the task
    "command" :       a list of entries to build the command
    "configuration" : additional information to pass to the task
    "task-id" :       a unique identifier for this task
    "class-name" :    the class or module to load
    "node-type" :     the type of resource to use to run this task
    "reply-to" :      a destination to send updates with the task progress
    "host-id" :       if assigned to a particular host, what is the id
    "submitted" :     whether or not this task has been submitted
    "cpu" :           the amount of CPU this task requires
    "mem" :           the amount of memory this task requires
    "input-ports" :   a list of tasks ids that will send data to this task
    "output-ports" :  a list of task ids that this task will send data to
    "session-id" :    the session used to run this task
    "launched-time" : when was this task launched
  }
  '''
  
              
  def __init__(self, args):
    pprint(args)
    self._logger = ccdp_utils.setup_logging(self.__class__.__name__)
    self.__broker = args['broker_host']
    self.__port = int(args['broker_port'])
    self.__queue = Queue.Queue()

    self._task_id = args['task_id']
    
    self.__amq = AmqClient.AmqClient()
    self._logger.info("Registering to receive Messages to %s" % self._task_id)
#     self.__amq.register("/queue/%s" % self._task_id, 
#                         on_message=self.__on_message, 
#                         on_error=self._on_error)
    self._logger.info("Connecting to %s:%d" % (self.__broker, self.__port))
    self.__amq.connect(self.__broker, dest="/queue/%s" % self._task_id, 
                        on_msg=self.__add_message, 
                        on_error=self._on_error)

    self.__MSGS = {'START':   self.start_module,
                   'PAUSE':   self.pause_module,
                   'STOP':    self.stop_module,
                   'RESULT':  self._on_message,
                   'MESSAGE': self._on_message,
                  }
    
    self.__timer = TimerTask(start_at=1, interval=1, 
                             function=self.__check_queue)    
  
  def _send_results(self, src, result):
    '''
    [ {
    "port-id" : "port-id-123",
    "from-port" : [ ],
    "to-port" : [ "out1", "out2" ]
  } ],
    '''
    self._logger.info("Sending results %s" % result)
    for port in self._task['output-ports']:
      pid = port['port-id']
      self._logger.info("Found the port configuration")
      if src == pid:
        to_ports = port['to-port']
        for tgt in to_ports:
          self._logger.debug("Sending message to %s" % tgt)
          if not isinstance(result, str):
            result = json.dumps(result)
          self.__amq.send_message(tgt, result)
  
  
  def __add_message(self, msg):
    '''
    Stores all the incoming messages into a queue so they can be processed as
    necessary.

    <msg> The incoming message from the server
    '''
    self.__queue.put(msg)

  def __check_queue(self):
    '''
    Method called by the TimerTask object after each cycle ends.  If the queue 
    is not empty, it passes the message to the module for processing
    '''
    while not self.__queue.empty():
      msg = self.__queue.get_nowait()
      self.__on_message(msg)


  def __on_message(self, msg):
    self._logger.debug("Got a message")
    try:
      json_msg = ccdp_utils.json_loads(msg)
      self._logger.info("Got a message: %s" % pformat(json_msg))
      if json_msg.has_key('msg-type'):
        try:
          msg_type = int(json_msg['msg-type'])
          self._logger.info("Got a message from the engine")
          msg_type = ccdp_utils.MESSAGES[json_msg['msg-type']]
        except:
          self._logger.info("Got an internal message")
          msg_type = json_msg['msg-type']
        
        
        if self.__MSGS.has_key(msg_type):
          method = self.__MSGS[msg_type]
          args = inspect.getargspec(method)[0]
          num_args = len( args)
          if num_args == 2 and json_msg.has_key('data'):
            method(json_msg['data'])
          else:
            method()
      
    except Exception, e:
      self._logger.error("Got an exception: %s" % str(e))
      traceback.print_exc()
    
    
  def _on_error(self, error):
    self._logger.error("Got some error: %s" % error)


  def start_module(self, task):
    self._logger.info("Assigning task: %s" % str(task))
    self._task = task
    self._start_module(task)

      
  def pause_module(self):
    self._logger.info("Pausing module")
    self._pause_module()
    
  def stop_module(self):
    self._logger.info("Stopping module")
    self.__amq.stop()
    self._stop_module()
    
    
  def _send_message(self, dest, msg):
    if not isinstance(msg, str):
      msg = json.dumps(msg)
    self.__amq.send_message(dest, msg)



  def _on_message(self, result):
    raise NotImplementedError("The _on_message method needs to be implemented ")
  
  def _start_module(self, task):
    raise NotImplementedError("The _start_module method needs to be implemented ")

  def _pause_module(self):
    raise NotImplementedError("The _pause_module method needs to be implemented ")
    
  def _stop_module(self):
    raise NotImplementedError("The _stop_module method needs to be implemented ")


def main():
  from optparse import OptionParser

  desc = "Cloud Computing Data Processing module.  This a module used \n"
  desc += "to perform a specific task and send and receive results to/from \n"
  desc += "other modules.  It uses the broker host/port to communicate "
  desc += "with other modules"

  parser = OptionParser(usage="usage: %prog [options] args",
            version="%prog 1.0",
            description=desc)
  
  parser.add_option('-v', '--verbosity-level',
            type='choice',
            action='store',
            dest='verb_level',
            choices=['debug', 'info', 'warning','error',],
            default='debug',
            help='The verbosity level of the logging',)
  
  parser.add_option('-b', '--broker-host',
            dest='broker_host',
            default='localhost',
            help='IP address of the messaging broker if required',)

  parser.add_option('-p', '--broker-port',
            dest='broker_port',
            default=61616,
            action='store',
            help='Port number of the messaging broker if necessary',)

  parser.add_option('-t', '--task-id',
            dest='task_id',
            default=None,
            help='The unique task-id which is also used as the channel to receive messages',)

 
   
  (options, args) = parser.parse_args()
  # it expects a dictionary 
  opts = vars(options)
  module = CcdpModule(opts)
  
if __name__ == '__main__':
  main()  