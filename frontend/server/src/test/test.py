#!/usr/bin/env python
import os, sys
from pprint import pprint, pformat
import ccdp_utils, logging

class Test():
  def __init__(self):
    print "This is a test: %s" % self.__class__.__name__ 
    self.__logger = ccdp_utils.setup_logging('root')
    self.__logger.info("Made it: %s" % pformat(dir(logging)))
  

if __name__ == '__main__':
  Test()