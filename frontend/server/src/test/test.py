#!/usr/bin/env python
import os, sys
from pprint import pprint, pformat
import ccdp_utils, logging
from docutils.nodes import entry

import shutil

class Test():
  
  __STR_OPS = ['SW', 'EW', 'CN']
  __OPS = ['LT', 'LE', 'EQ', 'GT', 'GE', 'SW', 'EW', 'CN']
   
  def __init__(self):
    print "This is a test: %s" % self.__class__.__name__ 
    self._logger = ccdp_utils.setup_logging('root')

    ccdp_root = os.environ['CCDP_GUI']
    src_dir = os.path.join(ccdp_root, 'src')

    shutil.make_archive('/tmp/Python', format='zip', root_dir=src_dir, dry_run=False, logger=self._logger)


if __name__ == '__main__':
  Test()
  