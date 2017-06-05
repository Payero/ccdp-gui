#!/usr/bin/env python
import os, sys
from pprint import pprint, pformat

# Attempting to use centralized logging for python and AmqClient
try:
  if os.environ.has_key("CCDP_GUI"):
    path = os.environ["CCDP_GUI"]
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

except:
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
    self.__amq.connect('172.31.20.84')

  def __on_message(self, msg):
    self.__logger.info("Got a message: %s" % msg)

  def __on_error(self, msg):
    self.__logger.error("Got an error message: %s" % msg)

  def stop(self):
    self.__logger.info("Stopping Engine")
    if self.__amq is not None:
      self.__amq.stop()


if __name__ == '__main__':
  import argparse, signal

  engine = None
  def signal_handler(signal, frame):
    print "Got a signal %s" % signal
    if engine is not None:
      engine.stop()

    sys.exit(-1)

  signal.signal(signal.SIGINT, signal_handler)

  parser = argparse.ArgumentParser()
  parser.add_argument("--amq-ip", default="localhost", 
    help="IP address of the AMQ server")
  parser.add_argument("--amq-port", default="61616", 
    help="Port number of the AMQ server")

  args = parser.parse_args()
  engine = TestEngine(args)