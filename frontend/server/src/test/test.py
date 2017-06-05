#!/usr/bin/env python
import os, sys
from pprint import pprint, pformat

def test():
  print "Running Test"
  import __main__

  fname = __main__.__file__
  path, name = os.path.split(fname)
  utils = "%s/../webapp/app" % path
  print "Appending %s" % utils
  sys.path.append(utils)
  import ccdp_utils
  logger = ccdp_utils.setup_logging('test')
  logger.info("Made it this far")
  


if __name__ == '__main__':
  test()