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
    
    fname = os.path.expandvars("${CCDP_GUI}/data/it_help_desk_less.csv")
    #entries = lines[1: 1 + config['number-entries']]

    with open(fname) as infile:
      lines = infile.readlines()
      self.__logger.info("Got %d lines " % len(lines))
      header = lines[0]

      self.__logger.info("All Lines: \n%s" % pformat(lines))
      self.__logger.info("-------------------------------------------------------------------------")
      total_lines = len(lines) - 1
      start = 1
      inc = 3
      end = start + inc
      while start < total_lines:
        
        self.__logger.info("Loading %d lines from %d to %d" % (end, start, end ))
        entries = lines[start: end]
        self.__logger.info(pformat(entries))
        start = end

        if end + inc <= total_lines:
          end += inc
        else:
          end = total_lines


if __name__ == '__main__':
  Test()
  