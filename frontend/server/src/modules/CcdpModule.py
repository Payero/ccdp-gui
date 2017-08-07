#!/usr/bin/env python

import os, sys, time, traceback
from pprint import pprint, pformat
import inspect, json
from __builtin__ import isinstance
import Queue
import logging
import ast, urllib


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
  
              
  def __init__(self, enc_args):
    '''
    Instantiates a new ccdp module object configured to start receiving command
    messages from the ThreadController.  The arguments is a dictionary 
    containing the information necessary to connect to the message broker. The
    task id is used as the queue to receive messages from the ThreadController
  

    Inputs:
      - args['broker_host']:  The message broker's ip address or hostname 
      - args['broker_port']   The message broker's port number
      - args['task_id']:      The UUID used as the queue to receive messages

    '''
    self._logger = ccdp_utils.setup_logging(self.__class__.__name__)
    try:
      dec_str = urllib.base64.standard_b64decode( args )
      args = ast.literal_eval( dec_str )
    except:
      args = enc_args

    self.__broker = args['broker_host']
    self.__port = int(args['broker_port'])
    self.__queue = Queue.Queue()
    self._predecesor_done = False
    self._done_processing =  False
    

    self._task_id = args['task_id']

    # used to send and receive messages 
    self.__amq = AmqClient.AmqClient()
    self._logger.info("Connecting to %s:%d" % (self.__broker, self.__port))
    self._logger.debug("Registering to receive Messages to %s" % self._task_id)

    self.__amq.connect(self.__broker, dest="/queue/%s" % self._task_id, 
                        on_message=self.__add_message, 
                        on_error=self._on_error)


    # Generates a mapping between message types and functions to invoke
    self.__MSGS = {'START':   self.start_module,
                   'PAUSE':   self.pause_module,
                   'STOP':    self.stop_module,
                   'RESULT':  self._on_message,
                   'MESSAGE': self._on_message,
                   'DONE_PROCESSING': self.__end_processing
                  }
    
    self.__timer = TimerTask(start_at=1, interval=1, 
                             function=self.__check_queue)  
    self.__timer.run()  
  

  def _send_results(self, src, result):
    '''
    It looks through all the output ports in order to find all the ports that
    is expecting the results.  If the one of the port-id in the list matches the
    one given as a source then it sends the results to all the queues listed in
    the to-port list.

    Inputs:
      - src:    the id or name of the port-id to locate all the queues
      - result: the data to send to all the queues listed in the to-port field

    JSON Example: 
      if the src is set to port-id-123 then it will send the results to queues
      out1 and out2

      {"output-ports":
        [ {
          "port-id" : "port-id-123",
          "from-port" : [ ],
          "to-port" : [ "out1", "out2" ]
        } ]
      }
    '''
    self._logger.debug("Sending results %s" % result)
    try:
      for port in self._task['output-ports']:
        pid = port['port-id']
        self._logger.debug("Found the port configuration")
        if src == pid:
          to_ports = port['to-port']
          for tgt in to_ports:
            self._logger.debug("Sending message to %s" % tgt)
            body = {'msg-type': 'RESULT', 'data': result}
            self.__amq.send_message(tgt, json.dumps(body))
    except:
      tries = 3
      indx = 0
      done = False
      while not done:
        try:
          time.sleep(0.2)
          self._logger.warn("Could not send message to %s, attempt # %d" % 
                            (tgt, indx) )
          done = True
          if indx >= tries:
            done = True
          indx += 1
        except:
          pass

  
  def __add_message(self, msg):
    '''
    Stores all the incoming messages into a queue so they can be processed as
    necessary.

    <msg> The incoming message from the server
    '''
    msg = ccdp_utils.json_loads(msg)
    self.__queue.put(msg)

  
  def __check_queue(self):
    '''
    Method called by the TimerTask object after each cycle ends.  If the queue 
    is not empty, it passes the message to the module for processing
    '''
    while not self.__queue.empty():
      msg = self.__queue.get_nowait()
      self.__on_message(msg)


  def __on_message(self, json_msg):
    '''
    Receives a message from the ThreadController or the ccdp-engine itself.
    Each message has a msg-type field either as an integer (from the 
    ccdp-engine) or as a string (from the ThreadController).

    The only message we are interested from the ccdp-engine are the TASK_UPDATE
    messages.
    
    Messages:
      - Start:
          {'msg-type': 'COMMAND', 'data':{'action': 'START', 'task': < task >}}
      - Pause:
          {'msg-type': 'COMMAND', 'data':{'action': 'START', 'task': < task >}}
      - Stop:
          {'msg-type': 'COMMAND', 'data':{'action': 'START', 'task': < task >}}
      - TaskUpdate: 
          {'msg-type': 'TASK_UPDATE', 'data':{'task':< task >}}
      - DoneProcessing:
          {'msg-type': 'DONE_PROCESSING', 'data':{'task':< task >}}
      - Error: 
          {'msg-type': 'MESSAGE', 'data':{'type':'ERROR', 'message': < error > }}
      - Message:
          {'msg-type': 'MESSAGE', 'data':{'type':'MESSAGE', 'message': < msg > }}

    Inputs:
      - json_msg: the json message sent by either the ccdp-engine or the 
                  ThreadController

    '''
    try:
      self._logger.debug("Got a message: %s" % pformat(json_msg))
      if json_msg.has_key('msg-type'):
        self._logger.debug("The message type: %s" % json_msg['msg-type'])

        try:
          msg_type = int(json_msg['msg-type'])
          self._logger.debug("Got a message from the engine")
          msg_type = ccdp_utils.MESSAGES[json_msg['msg-type']]
        except:
          self._logger.debug("Got an internal message")
          msg_type = json_msg['msg-type']
        
        if msg_type == 'COMMAND':
          action = json_msg['data']['action']
          if self.__MSGS.has_key(action):
            method = self.__MSGS[action]
            args = inspect.getargspec(method)[0]
            num_args = len( args)
            if num_args == 2 and json_msg.has_key('data'):
              method(json_msg['data']['task'])
            else:
              method()
        
        else:
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
    '''
    Receives error messages from the message broker.  If the reply-to field of
    the task request is set it sends a message to that destination with the
    error message.  

    Inputs:
      - error:  the error message to send back to the task originator
    '''
    self._logger.error("Got some error: %s" % error)
    reply_to = self._task['reply-to']
    if reply_to is not None and len(reply_to) > 0:
      body = {'msg-type': 'MESSAGE', 'data':{'type':'ERROR', 'message': error}}
      self._send_message(reply_to, json.dumps(body) )

  def __end_processing(self):
    """
    This method is invoked when the module that was sending data to it finished 
    processing data
    """
    self._logger.info("Previous Module ended processing")
    self._predecesor_done = True
    if self._done_processing:
      self._logger.info("Predecessor and this module are done")
      self._send_done_processing()
  
  
  def _send_done_processing(self):
    '''
    Sends a signal back to the ThreadController indicating that this module is 
    done processing
    '''
    body = {'msg-type': 'DONE_PROCESSING', 'data':{'task': self._task}}
    dest = self._task['reply-to']
    self._task['state'] = 'SUCCESSFUL'
    self._send_message(dest, json.dumps(body) )
    self.stop_module()
      
  
  def start_module(self, task):
    '''
    Gets a command message with the action set to 'START'.  The task is a JSON
    representation of a CcdpTaskRequest object containing all the information
    needed to execute a task.

    This method invokes the _start_module(task) that is required to be 
    implemented by all the subclasses.  Failing to do this will cause an error
    message to be thrown.

    Inputs:
      - task: the JSON representation of a CcdpTaskRequest

    CcdpTaskRequest Example:

    {
      "name" : "csv-selector",
      "description" : "Selects all entries matching a simple criteria",
      "retries" : 3,
      "command" : ["/home/oeg/dev/oeg/ccdp-gui/frontend/server/src/CcdpModuleLauncher.py", 
                   "-f", "/home/oeg/dev/oeg/ccdp-gui/frontend/server/src/modules/csv_selector.py",
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
    }
    '''
    self._logger.info("Assigning task: %s" % str(task))
    self._task = task
    self._start_module(task)

      
  def pause_module(self):
    '''
    Pauses the execution or processing of the task.

    This method invokes the _pause_module() that is required to be implemented 
    by all the subclasses.  Failing to do this will cause an error message to 
    be thrown.

    '''
    self._logger.info("Pausing module")
    self._pause_module()
    

  def stop_module(self):
    '''
    Stops the execution or processing of the task.  Once this method is invoked
    all the connections are terminated and this module will no longer be 
    available.

    This method invokes the _stop_module() that is required to be implemented 
    by all the subclasses.  Failing to do this will cause an error message to 
    be thrown.

    '''
    self._logger.info("Stopping module")
    
    body = {'msg-type': 4, 'task':self._task}
    self._stop_module()
    dest = self._task['reply-to']
    self._send_message(dest, json.dumps(body) )
    self.__timer.stopTimer()
    self.__amq.stop()

    
  def _send_message(self, dest, msg):
    '''
    Sends a message to the desired destination.  If the message is not a string
    it is assumed to be a JSON object and will be converted to a string prior 
    sending it.

    Inputs:
      - dest: the name of the queue to send the message
      - msg:  the actual message to send
    '''
    if not isinstance(msg, str):
      msg = json.dumps(msg)
    self.__amq.send_message(dest, msg)



  def _on_message(self, message):
    '''
    Empty method that throws an error if is not implemented by each subclass.

    This method is invoked every time a new message is received.
    '''
    raise NotImplementedError("The _on_message method must be implemented")
  

  def _start_module(self, task):
    '''
    Empty method that throws an error if is not implemented by each subclass.

    This method is invoked once all the modules are ready to process.

    Input:
      - task: a CcdpTaskRequest JSON representation containing all the 
              information necessary to execute the process
    '''
    raise NotImplementedError("The _start_module method must be implemented")


  def _pause_module(self):
    '''
    Empty method that throws an error if is not implemented by each subclass.

    This method is invoked when the user requires the data processing to pause.
    '''
    raise NotImplementedError("The _pause_module method must be implemented")
    

  def _stop_module(self):
    '''
    Empty method that throws an error if is not implemented by each subclass.

    This method is invoked when the user requires the data processing to stop.
    Once this method is called, the module is no longer usable as all the 
    connections are terminated.
    '''
    raise NotImplementedError("The _stop_module method must be implemented")


def main():
  '''
  Runs the module from the command line.  This is not actually necessary as the
  modules are instantiated by the CcdpModuleLauncher, but is usefull during
  development.
  '''
  from optparse import OptionParser

  desc = "Cloud Computing Data Processing module.  This a module used \n"
  desc += "to perform a specific task and send and receive results to/from \n"
  desc += "other modules.  It uses the broker host/port to communicate "
  desc += "with other modules"

  parser = OptionParser(usage="usage: %prog [options] args",
            version="%prog 1.0",
            description=desc)
  
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