#!/usr/bin/env python
import os, sys, shutil, traceback
from pprint import pprint, pformat
import ccdp_utils, logging
#============= Required Modules  =========================

import boto3, botocore, urllib, ast
from ccdp_utils.thread_pool import ThreadPool

class Test():
  
  __STR_OPS = ['SW', 'EW', 'CN']
  __OPS = ['LT', 'LE', 'EQ', 'GT', 'GE', 'SW', 'EW', 'CN']
   
  def __init__(self):
    self.__logger = ccdp_utils.setup_logging('root')
    self.__logger.debug("Running Test")

    self.__run_lambda_test()


  def __run_lambda_test(self):
    self.__logger.debug("Running Lambda Test")
    self.__client = boto3.client('apigateway')
    self.__thread_pool = ThreadPool(2)

    args = {"column-number":1, 
            "operator": "GE",  
            "value":5, 
            "entries":
                ["1,1929,1 - Junior,50,Systems,Issue,2 - Normal,0 - Unassigned,3,1 - Unsatisfied"]
          }
    data = {'arguments': args, 'bkt_name':'ccdp-tasks', 'keep_files':False, 'mod_name':'csv_selector_lambda', 'verb_level':'debug', 'zip_file':'csv_selector_lambda.py'}

    self.__logger.debug("The Request: %s " % pformat(data))
    return


    body = urllib.base64.standard_b64encode( str(data) )
    
    response = self.__client.test_invoke_method(
        restApiId='cx62aa0x70',
        resourceId='3jpl8x',
        httpMethod='POST',
        pathWithQueryString='string',
        body="\"%s\"" % str(body),
    )
  
    res = ast.literal_eval(response['body'])
    
    self.__logger.info("Status: %d ==> Result: %s" % (response['status'], res))
    
    if res == 'None':
      print("Not a good entry")
    else:
      print("We got some valid results: %s" % res)


if __name__ == '__main__':
  Test()
  