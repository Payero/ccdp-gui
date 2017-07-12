#!/usr/bin/env python
from modules.ThreadController import ThreadController
import ccdp_utils
import os, sys, time

def generate_module(params):
  '''
  Uses a template to create a Python module using three simple parameters:

    - date: when this module is created
    - user: who is creating this module
    - classname: the name of the class to exist in this module
    - module_name: the name of the module to generate.

  For instance, if a dictinary is passed with the following information:
    {'date':'07/07/17', 
     'user':'jdoe', 
     'classname':'TestModule',
     'module_name':'/tmp/test_module.py'
    }

  Will create a new python module called /tmp/test_module.py with a new class
  inside called TestModule that will be a subclass of the CcdpModule using a
  template located in ${CCDP_GUI}/data/cc_module.template
  '''
  import Template
  fname = os.path.expandvars("${CCDP_GUI}/data/ccdp_module.template")
  if os.path.isfile( fname ):
    if not params.has_key('classname') or not params.has_key('module_name'):
      print("ERROR: The classname and the module_name are required")
      sys.exit() 

    filein = open( fname )
    src = Template( filein.read() )
    mod_file = src.substitute( params )
    out_file = file( params['module_name'], 'w' )
    out_file.write( mod_file )
    out_file.close()


def callback_fn(msg):
  print("*********************************************************************")
  print("Got a message: %s" % msg)
  print("*********************************************************************")

if __name__ == '__main__':
  print("Running the main function")
  thread_req = os.path.expandvars("${CCDP_GUI}/data/csv_thread_req.json")
  tc = ThreadController(queue_name=ccdp_utils.WEB_QUEUE,    # required 
                        engine_queue=ccdp_utils.ENG_QUEUE,  # required
                        thread_req=thread_req,              # required
                        callback_fn=callback_fn,            # optional
                        auto_start=True,                    # optional
                        skip_req=True)                     # optional

  # because we set the auto_start to True, then we do not ned to invoke
  # tc.start_thread()
  # if is set to false, we need to invoke it to start processing data

  # sleeping enough time to let the modules finish
#   time.sleep(30)                    
#   print("Done waiting, stopping the modules")
#   tc.stop_thread()

