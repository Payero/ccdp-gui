#!/usr/bin/env python
import os, sys
from pprint import pprint, pformat
import ccdp_utils, logging
from docutils.nodes import entry
import ccdp_utils.AmqClient as AmqClient

import shutil

class Test():
  
  __STR_OPS = ['SW', 'EW', 'CN']
  __OPS = ['LT', 'LE', 'EQ', 'GT', 'GE', 'SW', 'EW', 'CN']
   
  def __init__(self):
    self.__logger = ccdp_utils.setup_logging('root')
    self.__logger.debug("Running Test")
    queue_name = 'CCDP-WebServer'
    amq = AmqClient.AmqClient()
    amq.connect('localhost', dest="/queue/%s" % queue_name, 
                        on_msg=self.__on_message, 
                        on_error=self.__on_error)

    self.__logger.debug("done with setting up")

  def __on_message(self, msg):
    self.__logger.info("Got a message: %s" % msg)


  def __on_error(self, msg):
    self.__logger.info("Got an error message: %s" % msg)

if __name__ == '__main__':
  Test()
  