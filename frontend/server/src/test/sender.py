'''
Created on Jun 19, 2017

@author: oeg
'''
from modules.CcdpModule import CcdpModule
from ccdp_utils.AmqClient import AmqClient
import ccdp_utils as utils
import sys, os, json, time
from pprint import pprint, pformat

class MsgSender():

  def __init__(self, params):
    '''
    Constructor
    '''
    host = params.amq_ip
    port = int(params.amq_port)
    
    amq = AmqClient();
    print("Connecting to %s:%d" % (host, port))
    amq.connect(host)
    
    if params.destination == None:
      print("ERROR: The destination is required")
      sys.exit(-1)
    else:
      dest = params.destination
      
    if params.message != None:
      amq.send_message(dest, params.message)
    
    if params.filename != None:
      fname = params.filename
      if os.path.isfile(fname):
        handle = open(fname, 'r')
        body = utils.json_load(handle)
        amq.send_message(dest, json.dumps(body))
    
    amq.stop()

    
if __name__ == '__main__':
  print "Running"
  
  import argparse
  
  parser = argparse.ArgumentParser()
  parser.add_argument('-i', "--amq-ip", default="localhost", 
    help="IP address of the AMQ server")
  parser.add_argument('-p', "--amq-port", default="61616", 
    help="Port number of the AMQ server")

  parser.add_argument('-d', "--destination", default=None, 
    help="The name of the queue to receive data from other modules")
  
  parser.add_argument('-m', "--message", default=None, 
    help="The message to send")
  
  parser.add_argument('-f', "--filename", default=None, 
    help="The name of the file with the message to send")
  
  args = parser.parse_args()
  MsgSender(args)
  
  
