#!/usr/bin/env python

'''
Created on Jun 19, 2017

@author: oeg
'''
from modules.CcdpModule import CcdpModule
import time

class CsvReader(CcdpModule):
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
    with open(config['filename']) as infile:
      lines = infile.readlines()
      
      self._logger.info("Sending Header")
      data = {'is-header': True, 'entries': lines[0]}
      self._send_results('csv-reader', data)
      
      # now sending all the lines in pack of 'increment' size
      total_lines = len(lines) - 1
      start = 1
      inc = config['number-entries']
      end = start + inc
      while start < total_lines:
        
        self._logger.debug("Loading %d lines from %d to %d" % (end, start, end ))
        entries = lines[start: end]
        data = {'is-header': False, 'entries': entries}
        self._send_results('csv-reader', data )

        start = end

        if end + inc <= total_lines:
          end += inc
        else:
          end = total_lines
    
    self._logger.info("%s done Processing " % self._task['name'])
    self._send_done_processing()

      
  def _pause_module(self):
    self._logger.info("Starting module")
  
  
  def _stop_module(self):
    self._logger.info("Stopping module")


    
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
  CsvReader(opts)
   
  
