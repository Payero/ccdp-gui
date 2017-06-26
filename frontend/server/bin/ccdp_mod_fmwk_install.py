#!/usr/bin/env python
# encoding: utf-8

from optparse import OptionParser
import logging
from pprint import pformat
import boto3, botocore
import os, sys, traceback
import tarfile, json
from subprocess import call
import shutil
import glob

class CcdpInstaller:
  
  __CCDP_BKT = 'ccdp-tasks'
  __CCDP_FMWK = 'ccdp-mod-fmwk'

  
  __LEVELS = {"debug":    logging.DEBUG, 
              "info":     logging.INFO, 
              "warning":  logging.WARN,
              "error":    logging.ERROR}
  

  def __init__(self, cli_args):
    self.__logger = logging.getLogger('CcdpInstaller')
    handler = logging.StreamHandler()
    if not os.environ.has_key('CCDP_GUI'):
      print( "Error: The CCDP_GUI env. var. is required")
      sys.exit(-1)

    self.__root = os.environ['CCDP_GUI']

    log_dir = os.path.join(self.__root, 'logs')
    filelog = logging.FileHandler('%s/ccdp_install.log' % log_dir)

    formatter = logging.Formatter(
            '%(asctime)s %(name)-12s %(lineno)d %(levelname)-8s %(message)s')
    handler.setFormatter(formatter)
    filelog.setFormatter(formatter)

    self.__logger.addHandler(handler)
    self.__logger.addHandler(filelog)
    
    # Setting root level to warning and THEN set the level for this module
    self.__logger.setLevel(self.__LEVELS['warning'])
    logging.getLogger('CcdpInstaller').setLevel(self.__LEVELS[cli_args.verb_level])
    
    self.__logger.debug("Logging Done")
    
    self.__s3 = boto3.resource('s3')
    self.__perform_upload( cli_args )


  def __perform_upload(self, params):
    """
    First it attempt to create the ccdp-tasks bucket in case this is the 
    first time the distributions are created.  Once is done it uploads the 
    fmwk zip file into it:
    """
    self.__logger.debug("Performing Upload using %s" % pformat(str(params)))
  
    bkt_name = self.__CCDP_BKT
      # Creating a bucket
    try:
#       self.__s3.create_bucket(Bucket=bkt_name, CreateBucketConfiguration={
#                               'LocationConstraint': 'us-east-1'})  
      self.__s3.create_bucket(Bucket=bkt_name)
      self.__logger.info("Bucket %s was created" % bkt_name)
    except:
      self.__logger.info("Bucket (%s) already exists" % bkt_name) 
    
    path = os.getenv('CCDP_GUI')
    if path == None:
      self.__logger.error("Need to set the CCDP_HOME env variable, exiting!!")
      sys.exit(-1)
    
    
    src_dir = os.path.join(self.__root, 'src')
    zip_file = os.path.join(self.__root, 'logs', self.__CCDP_FMWK)
    shutil.make_archive(zip_file, format='zip', root_dir=src_dir, 
                        logger=self.__logger)

    zip_file += '.zip'
    if os.path.isfile('%s' % zip_file):
      zip_name = "%s.zip" % self.__CCDP_FMWK

      self.__logger.debug("File (%s) created successfully" % zip_name)
      # Storing data
      self.__s3.Object(bkt_name, zip_name).put(
                        Body=open(zip_file, 'rb'))
      self.__logger.debug("File %s was uploaded successfully" % zip_name)

      if not params.keep_file:
        self.__logger.info("removing %s" % zip_file)
        os.remove(zip_file)
    else:
      self.__logger.error("Could not find %s" % zip_file)

      
    
    bkt = self.__s3.Bucket(bkt_name)
    acl = bkt.Acl()
    bkt.Acl().put(ACL='public-read')   
    

"""
  Runs the application by instantiating a new Test object and passing all the
  command line arguments
"""  
if __name__ == '__main__':
  
    
  desc = "Sets the environment for a new machine so it can run a CCDP \n"
  desc += "module.  It zips and uploads the necessary directories into a \n"
  desc += "S3 bucket"
  parser = OptionParser(usage="usage: %prog [options] args",
                        version="%prog 1.0",
                        description=desc)
  
  parser.add_option('-v', '--verbosity-level',
        type='choice',
        action='store',
        dest='verb_level',
        choices=['debug', 'info', 'warning','error',],
        default='debug',
        help='The verbosity level of the logging',)
    
  # parser.add_option("-b", "--s3-bucket",
  #       dest="bkt_name",
  #       default='ccdp-tasks',
  #       help="The name of the bucket containing the modules files")
  
  # parser.add_option("-f", "--fmwk-zipfile",
  #       dest="file_name",
  #       default='ccdp-mod-fmwk.zip',
  #       help="The name of the zipped files containing the fmwk files")

  parser.add_option("-k", "--keep-file",
        action="store_true", dest="keep_file", default=False,
        help="It does not delete the ccdp-engine-dist.tar file after upload")


  (options, args) = parser.parse_args()
  
  CcdpInstaller(options)
      
