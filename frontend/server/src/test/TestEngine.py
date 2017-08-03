#!/usr/bin/env python

import json
import os, sys, time, traceback
from pprint import pprint, pformat
from random import randint

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


class TestEngine():

  def __init__(self, args):
    self.__logger = ccdp_utils.setup_logging('TestEngine')
    queue = ccdp_utils.ENG_QUEUE
    amq_ip = args.amq_ip
    amq_port = int(args.amq_port)

    self.__logger.info("Registering to receive Messages to %s" % queue)
    self.__amq = AmqClient.AmqClient()
    self.__amq.register("/queue/%s" % queue, 
                        on_message=self.__on_message, 
                        on_error=self.__on_error)
    self.__logger.info("Connectiong to %s:%d" % (amq_ip, amq_port))
    self.__amq.connect(amq_ip)
 

  def __on_message(self, msg):
    """
    Gets a message from the GUI and prints it out to the log file.  If the 
    message is a request message it randomly waits and sends a response back to
    the sender
    """
    self.__logger.debug("Got a message: %s" % msg)
    try:
      json_msg = ccdp_utils.json_loads(msg)
      self.__logger.info("Got a message: %s" % pformat(json_msg))
      if 'msg-type' in json_msg:
        #msg_type = ccdp_utils.MESSAGES[json_msg['msg-type']] #Use this format to pass the msg-type as a number
        msg_type = json_msg['msg-type']
        if msg_type == "COMMAND":
          self.__logger.debug("Got a COMMAND")
          task = json_msg['data']['task']
          tid = task['task-id']
          reply_to = task['reply-to']
          #if reply_to == None:
            #reply_to = req_dest
          if reply_to != None:
            self.__logger.info("Sending a reply message!") #MB - checking if a reply message is being sent
            task['state'] = 'RUNNING'
            task['status'] = 'SUCCESS'
            update_msg = {}
            update_msg['msg-type'] = 4
            update_msg['task'] = task
            self.__logger.debug("Sending Running Message: %s " % pformat(update_msg))
            self.__amq.send_message(reply_to, json.dumps(update_msg))
            wait = randint(5,10)
            self.__logger.debug("Waiting for %d for task %s" % (wait, tid))
            time.sleep(wait)
            update_msg['status'] = 'SUCCESS'
            update_msg['task']['state'] = "SUCCESSFUL"
            self.__logger.debug("Sending Successful Message: %s " % pformat(update_msg))
            self.__amq.send_message(reply_to, json.dumps(update_msg))

    except Exception, e:
      self.__logger.error("Got an error while processing a message: %s" % e)
      traceback.print_exc()              



  def __on_error(self, msg):
    self.__logger.error("Got an error message: %s" % msg)


  def stop(self):
    self.__logger.info("Stopping Engine")
    if self.__amq is not None:
      self.__amq.stop()


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

  args = parser.parse_args()
  engine = TestEngine(args)
