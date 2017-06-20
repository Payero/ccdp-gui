'''
Created on Jun 19, 2017

@author: oeg
'''
from modules.CcdpModule import CcdpModule

class CsvReader(CcdpModule):
  '''
  classdocs
  '''


  def __init__(self, params):
    '''
    Constructor
    '''
    super(CsvReader, self).__init__(params)
    self._logger.info("Starting the new class")
  
  def _on_result(self, result):
    self._logger.info("Got some results")
    
  def _start_module(self, task):
    self._logger.info("Starting module")
    config = task['configuration']
    self._logger.debug("Config " + str(config))
    
  def _pause_module(self):
    self._logger.info("Starting module")
  
  def _stop_module(self):
    self._logger.info("Starting module")
    
if __name__ == '__main__':
  print "Running"
  
  import argparse
  import time
  
  # engine = None
  # def signal_handler(signal, frame):
  #   print "Got a signal %s" % signal
  #   if engine is not None:
  #     engine.stop()

  #   sys.exit(-1)

  # signal.signal(signal.SIGINT, signal_handler)

  parser = argparse.ArgumentParser()
  parser.add_argument('-i', "--amq-ip", default="localhost", 
    help="IP address of the AMQ server")
  parser.add_argument('-p', "--amq-port", default="61616", 
    help="Port number of the AMQ server")

  parser.add_argument('-t', "--task-id", default=None, 
    help="The name of the queue to receive data from other modules")
  
  args = parser.parse_args()
  module = CcdpModule(args)
  
  args = parser.parse_args()
  cr = CsvReader(args)
  
  
