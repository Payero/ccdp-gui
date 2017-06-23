'''
Created on Jun 19, 2017

@author: oeg
'''
from modules.CcdpModule import CcdpModule
import ccdp_utils
from pprint import pprint, pformat

class CsvSelector(CcdpModule):
  '''
  classdocs
  '''
  
  __OPS = ['LT', 'LE', 'EQ', 'GT', 'GE', 'SW', 'EW', 'CN']
  
  def __init__(self, params):
    '''
    Constructor
    '''
    super(self.__class__, self).__init__(params)
    self._logger.info("Starting the new class")
    self.__header = []
    
  def _on_message(self, msg):
    self._logger.info("Got some message: %s" % msg)
    entries = ccdp_utils.json_loads(msg)
    if entries.has_key('is-header'):
      self._logger.info("is header: %s" % pformat(entries) )
      self.__header = entries
    else:
      for entry in entries:
        self.__logger.debug("Processing entry: %s" % entry)
        data = self.__filter_data(entry)
        if data:
          self._logger.info("Found a match")
          self._send_results('display', data )
        

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
        found = True
      elif op == 'EW' and val.endswith(value):
        found = True
      elif op == 'CN' and val.find(value) >= 0:
        found = True
    else:
      val = entry[pos]
      if op == 'LT' and val < value:
        found = True
      elif op == 'LE' and val <= value:
        found = True
      elif op == 'EQ' and val == value:
        found = True
      elif op == 'GT' and val > value:
        found = True
      elif op == 'GE' and val >= value:
        found = True
      elif op not in self.__OPS:
        found = True
      
    if found:
      return entry
    else:
      return None
    
    

    
  def _start_module(self, task):
    self._logger.info("Starting module")
    self.__config = task['configuration']
    #RequestorSeniority,FiledAgainst,TicketType,Severity,Priority,daysOpen,Satisfaction
      
      
      
  def _pause_module(self):
    self._logger.info("Starting module")
  
  def _stop_module(self):
    self._logger.info("Starting module")


    
if __name__ == '__main__':
  import argparse
   
  parser = argparse.ArgumentParser()
   
  parser.add_argument('-b', "--broker-host", default="localhost", 
    help="IP address of the messaging broker if required")
  parser.add_argument('-p', "--broker-port", default="61616", 
    help="Port number of the messaging broker if necessary")
 
  parser.add_argument('-t', "--task-id", default=None, 
    help="The name of the queue to receive data from other modules")
   
  args = parser.parse_args()
  CsvSelector(args)
   
  
