#!/usr/bin/env python

import time
import sys
import json
import stomp
from threading import Event, Thread
import logging
from pprint import pformat
import os

# Attempting to use centralized logging for python
try:
  if os.environ.has_key("CCDP_GUI"):
    path = os.environ["CCDP_GUI"]
    sys.path.append(path)
    import ccdp_utils
  else:
    print "Could not find CCDP_GUI, skipping adding ccdp_utils"
except:
  print "Could not import ccdp_utils"


__LEVELS = {"debug":    logging.DEBUG, 
            "info":     logging.INFO, 
            "warning":  logging.WARN,
            "error":    logging.ERROR}


def get_logger(name, level="info", out_file=None):
  logger = logging.getLogger(name)
  handler = logging.StreamHandler()
  formatter = logging.Formatter(
          '%(asctime)s %(name)-12s %(lineno)d %(levelname)-8s %(message)s')

  handler.setFormatter(formatter)
  logger.addHandler(handler)
  
  if out_file != None:
    filelog = logging.FileHandler('/tmp/amq_msgr.log')
    filelog.setFormatter(formatter)
    logger.addHandler(filelog)
  
  # Setting root level to warning and THEN set the level for this module
  logger.setLevel(__LEVELS['warning'])
  logging.getLogger(name).setLevel(__LEVELS[level])

  return logger

class AmqClient(stomp.ConnectionListener):
  __onMessage     = None
  __onError       = None
  __destinantion  = None
  __connection    = None
  __event         = Event()
  __thread        = None

  def __init__(self):
    #
    try:
      self.__logger = ccdp_utils.setup_logging("AmqClient")
    except:
      self.__logger = get_logger("AmqClient")
       
    self.__logger.info("Done creating object")


  def connect(self, broker, port=61616):
    self.__logger.info("Connecting to AMQ: %s:%d" % (broker, port)) 
    self.__connection = stomp.Connection(auto_content_length=False)
    self.__logger.info("Setting The listener")
    self.__connection.set_listener('', self)
    self.__logger.info("Starting the connection")
    self.__connection.start()
    self.__connection.connect([(broker, port)], wait=False)
    self.__logger.info("Connection done")

    if self.__destination != None:
      self.__connection.subscribe(destination=self.__destination, id=1, ack='auto')
    else:
      self.__logger.error("Please register first")
      sys.exit(-1)

    self.__thread = Thread(target=self.__run)
    self.__thread.start()
    self.__logger.info("Connected!!")


  def register(self, dest, on_message=None, on_error=None):
    if callable(on_message):
      self.__onMessage = on_message
    else:
      print "Error: the on_message is not a callable object"

    if callable(on_message):
      self.__onError = on_error
    else:
      print "Error: the on_error is not a callable object"  
    
    self.__logger.info("Registering to %s" % dest)
    self.__destination = dest
    

  def unregister(self, dest):
    self.__connection.subscribe(self.__destination)

  def __run(self):
    self.__logger.info("Running main function")
    while not self.__event.isSet():
      time.sleep(0.5)


  def send_message(self, dest, body):
    self.__logger.info("Sending Message %s to %s" % (body, dest))
    self.__connection.send(body=json.dumps(body), destination=dest)



  def on_message(self, headers, message):
    if self.__onMessage:
      self.__onMessage(message)

  def on_error(self, headers, message):
    if self.__onError:
      self.__onError(message)

  def stop(self):
    self.__logger.info("Stopping Receiver")
    if self.__event is not None:
      self.__event.set()
    if self.__connection is not None:
      self.__connection.disconnect()


if __name__ == '__main__':
  print "Running from main"

  def onMessage(msg):
    print "Got a message %s" % msg

  def onError(msg):
    print "Got an error message %s" % msg

  import signal

  def signal_handler(signal, frame):
    print "Got a signal %s" % signal
    if msgr is not None:
      msgr.stop()

    sys.exit(-1)

  signal.signal(signal.SIGINT, signal_handler)

  msgr =  AmqClient()
  msgr.register("/queue/CcdpTaskingActivity", on_message=onMessage, on_error=onError)
  msgr.connect('172.31.20.84')
  msgr.send_message('/queue/CcdpTaskingActivity', "This is a test message")
  time.sleep(2)
  msgr.stop()
