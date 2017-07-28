#!/usr/bin/env python

'''
Created on Jun 19, 2017

@author: oeg
'''
from modules.CcdpModule import CcdpModule
from ccdp_utils.thread_pool import ThreadPool
import time
import boto3, botocore
from pprint import pprint, pformat
import urllib, ast

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
    self.__config = task['configuration']
    self.__thread_pool = ThreadPool(10)
    self.__gateway = boto3.client('apigateway')
    self.__header = None

    self._logger.debug("Config " + str(self.__config))
    with open(self.__config['filename']) as infile:
      lines = infile.readlines()
      
      self.__header = lines[0].split(',')
      self._logger.info("Sending Header: %s" % self.__header)
      name = self.__config['field']
      self.__config['column-number'] = self.__header.index(name) 


      data = {'is-header': True, 'entries': self.__header}
      self._send_results('csv-reader', data)
      
      # now sending all the lines in pack of 'increment' size
      total_lines = len(lines) - 1
      start = 1
      inc = self.__config['number-entries']
      end = start + inc
      while start < total_lines:
        
        self._logger.debug("Loading %d lines from %d to %d" % (end, start, end ))
        entries = lines[start: end]
        
        self.__thread_pool.add_task(self.__send_request, entries)
        print ("Done with that")

        start = end

        if end + inc <= total_lines:
          end += inc
        else:
          end = total_lines
    
      self.__thread_pool.wait_completion()

    self._logger.info("%s done Processing " % self._task['name'])
    self._send_done_processing()


  def __send_request(self, data, callback=None):
    print ("In the Send Request: %s" % pformat(data) )
    self._logger.debug("Sending Request: %s" % pformat(data) )


    args = {"column-number":  self.__config['column-number'], 
            "operator":       self.__config['operator'], 
            "value":          self.__config['value'], 
            "entries":        data
          }
    req = {'arguments':   args, 
           'bkt_name':    'ccdp-tasks', 
           'keep_files':  False, 
           'mod_name':    'csv_selector_lambda', 
           'verb_level':  'debug', 
           'zip_file':    'csv_selector_lambda.py'
          }

    body = urllib.base64.standard_b64encode( str(req) )
    
    response = self.__gateway.test_invoke_method(
          restApiId='cx62aa0x70',
          resourceId='3jpl8x',
          httpMethod='POST',
          pathWithQueryString='string',
          body="\"%s\"" % str(body),
        )
  
    result = ast.literal_eval(response['body'])
    self._logger.info("Status: %d ==> Result: %s" % (response['status'], pformat(result)))

    if result != 'None':
      self._logger.debug("Got results: %s" % pformat(result) )
      data = {'is-header': False, 'entries': result}
      self._send_results('csv-reader', data)

    else:
      self._logger.debug("Got None, skipping" )


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
  cr = CsvReader(opts)
  