#!/usr/bin/env python
import os, sys
from pprint import pprint, pformat
import ccdp_utils, logging
from docutils.nodes import entry

class Test():
  
  __STR_OPS = ['SW', 'EW', 'CN']
  __OPS = ['LT', 'LE', 'EQ', 'GT', 'GE', 'SW', 'EW', 'CN']
   
  def __init__(self):
    print "This is a test: %s" % self.__class__.__name__ 
    self._logger = ccdp_utils.setup_logging('root')
    self.__header = ["ticket","requestor","RequestorSeniority","ITOwner",
                     "FiledAgainst","TicketType","Severity","Priority",
                     "daysOpen","Satisfaction"]
    
    self.__config = {'field':'RequestorSeniority', 
                     'operator':'CN', 
                     'value':'Bozo'}
    
    entry = [6,858,'4 - Management',38,'Access/Login','Request','2 - Normal','3 - High',0,'0 - Unknown']
    
    data = self.__filter_data(entry)
    if data:
      self._logger.info("Got some data")
      
    
  def __filter_data(self, entry):
    name = self.__config['field']
    pos = self.__header.index(name)
    op = self.__config['operator']
    value = self.__config['value']
    
    self._logger.info("Checking for '%s' being '%s' than '%s'" % (name, op, value))
    if len(entry) < pos:
      self._logger.error('ERROR, could not parse the data')
      return None
    
    found = False
    if op in self.__STR_OPS:
      val = str(entry[pos])
      if op == 'SW' and val.startswith(value):
        self._logger.info("It starts with %s" % value)
        found = True
      elif op == 'EW' and val.endswith(value):
        self._logger.info("It Ends with %s" % value)
        found = True
      elif op == 'CN' and val.find(value) >= 0:
        self._logger.info("It Contains %s" % value)
        found = True
    else:
      val = entry[pos]
      if op == 'LT' and val < value:
        self._logger.info("Is less than %s" % value)
        found = True
      elif op == 'LE' and val <= value:
        self._logger.info("Is less or equal than %s" % value)
        found = True
      elif op == 'EQ' and val == value:
        self._logger.info("Is equal than %s" % value)
        found = True
      elif op == 'GT' and val > value:
        self._logger.info("Is greater than %s" % value)
        found = True
      elif op == 'GE' and val >= value:
        self._logger.info("Is greater or equal than %s" % value)
        found = True
      elif op not in self.__OPS:
        self._logger.error('Do not recognize operation %s' % op)
        found = True
      
    if found:
      self._logger.info("returning %s" % pformat(entry))
      return entry
    else:
      return None
    
    
    
        
  

if __name__ == '__main__':
  Test()