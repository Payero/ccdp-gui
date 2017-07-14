'''
Created on Jun 19, 2017

@author: oeg
'''
from modules.CcdpModule import CcdpModule

class ChildModule(CcdpModule):
  '''
  classdocs
  '''


  def __init__(self, params):
    '''
    Constructor
    '''
    super(self.__class__, self).__init__(params)
    self._logger.info("Starting the new class")
  
  def _on_message(self, msg):
    self._logger.info("Got some message")
    
  def _start_module(self, task):
    self._logger.info("Starting module")
    config = task['configuration']
    self._logger.debug("Config " + str(config))
    
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
  cr = CsvReader(args)
  
  
