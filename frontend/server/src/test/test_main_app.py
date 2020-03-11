#!/usr/bin/env python

import os, sys, time, ast, urllib

# Attempting to use centralized logging for python and AmqClient
try:
  if os.environ.has_key("CCDP_GUI"):
    print "Found CCDP_GUI"
    path = "%s/src" % os.environ["CCDP_GUI"]
    sys.path.append(path)
    import ccdp_utils
    import ccdp_utils.AmqClient as AmqClient

  else:
    print "Could not find CCDP_GUI"
    import __main__
    fname = __main__.__file__
    path, name = os.path.split(fname)
    utils = "%s/../webapp/app" % path
    if os.path.isdir(utils):
      print "Appending %s" % utils
      sys.path.append(utils)
      import ccdp_utils
      import ccdp_utils.AmqClient as AmqClient

    else:
      print "ERROR: Could not find ccdp_utils, exiting"
      sys.exit(-1)

except Exception, e:
  print e
  print "Could not import ccdp_utils"
  sys.exit(-1)

from modules.ThreadController import ThreadController


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

def decode(value):
  print "Decoding %s" % value
  dec = urllib.base64.b64decode(value)
  print dec

def encode(value):
  print "Encoding %s" % value
  dec = urllib.base64.b64encode(value)
  print dec


def callback_fn(msg):
  print("*********************************************************************")
  print("Got a message: %s" % msg)
  print("*********************************************************************")

if __name__ == '__main__':
  print("Running the main function")
  thread_req = os.path.expandvars("${CCDP_GUI}/data/rand_thread_req.json")
  tc = ThreadController(queue_name=ccdp_utils.WEB_QUEUE,    # required 
                        engine_queue=ccdp_utils.ENG_QUEUE,  # required
                        thread_req=thread_req,              # required
                        callback_fn=callback_fn,            # optional
                        auto_start=True,                    # optional
                        broker_host="ax-ccdp.com",
                        broker_port=61616,
                        skip_req=False)                     # optional

  # because we set the auto_start to True, then we do not ned to invoke
  # tc.start_thread()
  # if is set to false, we need to invoke it to start processing data

  # sleeping enough time to let the modules finish
  #time.sleep(10)                    
  #print("Done waiting, stopping the modules")
  #tc.stop_thread()
