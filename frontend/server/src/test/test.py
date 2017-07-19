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
    

if __name__ == '__main__':
  Test()
  