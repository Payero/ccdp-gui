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
  __STR_OPS = ['SW', 'EW', 'CN']
  __OPS = ['LT', 'LE', 'EQ', 'GT', 'GE', 'SW', 'EW', 'CN']

  def __init__(self, params):
    '''
    Constructor
    '''
    super(self.__class__, self).__init__(params)
    self._logger.info("Starting the new class")
    self.__header = []
    
  def _on_message(self, msg):
    self._logger.debug("Got some message: %s" % msg)
    # entries = ccdp_utils.json_loads(msg)
    if msg.has_key('is-header') and msg['is-header']:
      self._logger.debug("is header: %s" % pformat(msg) )
      self.__header = msg['entries'].split(',')
      self._send_results('csv-selector', self.__header )
    else:
      for entry in msg['entries']:
        entry = entry.strip()
        data = self.__filter_data(entry)
        if data:
          self._logger.info("Found a match: %s " % str(data))
          self._send_results('csv-selector', data )
        

  def __filter_data(self, entry_str):
    self._logger.debug("filtering entry <--%s-->" % entry_str)
    entry = entry_str.split(",")
    name = self.__config['field']
    pos = self.__header.index(name)
    op = self.__config['operator']
    value = self.__config['value']
    
    if len(entry) < pos:
      self._logger.error('ERROR, could not parse the data')
      return None
    
    found = False
    self._logger.debug("Is %s %s %s" % (entry[pos], op, value))

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
      try:
        val = int(val)
      except:
        pass
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
            help='Port number of the messaging broker if necessary',)

  parser.add_option('-t', '--task-id',
            dest='task_id',
            default=None,
            help='The unique task-id which is also used as the channel to receive messages',)

 
   
  (options, args) = parser.parse_args()
  # it expects a dictionary 
  opts = vars(options)
  CsvSelector(opts)
   
  
