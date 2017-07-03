'''
Created on Jun 19, 2017

@author: oeg
'''
from modules.CcdpModule import CcdpModule
import ccdp_utils
from pprint import pprint, pformat

class CsvDisplay(CcdpModule):
  '''
  classdocs
  '''
  
  def __init__(self, params):
    '''
    Constructor
    '''
    super(self.__class__, self).__init__(params)
    self._logger.info("Starting the new class")
    self.__handle = None
    
  def _on_message(self, msg):
    self._logger.info("Got some message: %s" % msg)
    self.__handle.write(",".join(msg))

    
  def _start_module(self, task):
    self._logger.info("Starting module")
    url = task['configuration']['output-url']
    if url.startswith('file://'):
      self.__fname = url[len('file://'):]
      self._logger.info("Saving results in %s" % self.__fname)
      self.__handle = file(self.__fname, 'w')  
      
  def _pause_module(self):
    self._logger.info("Starting module")
  
  def _stop_module(self):
    self._logger.info("Starting module")
    if self.__handle != None:
      self.__handle.close()


    
if __name__ == '__main__':
  from optparse import OptionParser
  
  desc = "Cloud Computing Data Processing module.  This a module used \n"
  desc += "to perform a specific task and send and receive results to/from \n"
  desc += "other modules.  It uses the broker host/port to communicate "
  desc += "with other modules"

  parser = OptionParser(usage="usage: %prog [options] args",
            version="%prog 1.0",
            description=desc)
  
  parser.add_option('-v', '--verbosity-level',
            type='choice',
            action='store',
            dest='verb_level',
            choices=['debug', 'info', 'warning','error',],
            default='debug',
            help='The verbosity level of the logging',)
  
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
  CsvDisplay(opts)
   
  
