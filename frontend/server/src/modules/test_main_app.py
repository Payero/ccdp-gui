#!/usr/bin/env python
from ThreadController import ThreadController
import ccdp_utils
import os, sys, time


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
                        skip_req=False)                     # optional

  # because we set the auto_start to True, then we do not ned to invoke
  # tc.start_thread()
  # if is set to false, we need to invoke it to start processing data

  # sleeping enough time to let the modules finish
  time.sleep(30)                    
  print("Done waiting, stopping the modules")
  tc.stop_thread()

