'''
Created on Jul 15, 2016

@author: oeg
'''
import ccdp_utils
import pika
import time
import json
import socket
from pprint import pformat

class RMQClient(object):
  """ 
  Provides a simple class to interact with RabbitMQ.  The class allows you to 
  send and/or receive a message.  
  """
  
  def __init__(self, broker=None):
    '''
    instantiates a new object responsible for communication with an RabitMQ
    broker
    
    Inputs:
      <broker>  The IP address or hostname of the RabbitMQ broker to connect
    '''
    self.__logger = ccdp_utils.setup_logging(RMQClient.__name__)
    
    if broker == None:
      fqdn = socket.getfqdn()
      ip = socket.gethostbyname(socket.gethostname())
      if ( ( fqdn is not None and fqdn.endswith('ccdp') ) and 
         ( ip is not None and ip.startswith('10.0.') ) ):
        broker = ccdp_utils.PRIV_RMQ_BROKER
        self.__logger.debug("Using private IP Address")
      else:
        self.__logger.debug("Using public IP Address")
        broker = ccdp_utils.PUB_RMQ_BROKER

    if socket.gethostname() == 'Zeus':
      self.__logger.warning("Overwriting RMQ location to localhost")
      broker = 'localhost'  
    
    if broker == None:
      self.__logger.error("The broker needs to be provided, exiting")
      return
    
    self.__broker = broker
    self.__receivers = {}
    self.__logger.info("Connecting to %s" % self.__broker)
    self.__connect()
  
  
  def __connect(self):
    """
    Attempts to connect to the Rabbit MQ broker.  If it fails it throws an 
    error message and returns False otherwise it returns True
    
    """
    self.__logger.debug("Connection to RMQ Broker")
    try:
      params = pika.ConnectionParameters(self.__broker)
      self.__connection = pika.BlockingConnection(params)
      self.__channel = self.__connection.channel()
    except Exception as e:
      self.__logger.error("Could not connect to broker: %s" % self.__broker)
      self.__logger.exception(e)
      return False
    
    return True
  
  def send_message(self, queue_name, message):
    """
    Sends a single message to the given queue.  The message argument is the 
    actual body of the message.
    
    Inputs:
      <queue_name>  The name of the routing_key or queue to use
      <message>     The message body
    """
    self.__logger.debug("Sending message %s to %s" % (message, queue_name))
    # makes sure the channel still open
    if self.__channel.is_closed:
      self.__logger.info("Re-Connecting")
      time.sleep(2)
      self.__connect()
    
    self.__connect()
    # if a message is not a string make it
    if not isinstance(message, str):  
      self.__logger.debug("Translating message to string")
      message = json.dumps(message, ensure_ascii=True)
      
      
    self.__logger.debug("Sending Message: %s of type %s to %s" % 
                       (message, type(message), queue_name) ) 
    self.__channel.basic_publish(exchange='', 
                                 routing_key=queue_name, 
                                 body=message)
  
  def register_queue(self, queue_name, callback_fn):
    """
    Registers a queue to start receiving messages.  If the queue name does not 
    exists it creates it.  The callback argument must be callable otherwise it
    will not register to receive messages from the given queue.  The callback 
    function must contain the following arguments:
    
      channel
      method_frame (pika.spec.Basic.Deliver)
      header_frame (pika.spec.BasicProperties)
      body:        The actual message
    
    Inputs:
      <queue_name>  The name of the queue to receive messages
      <callback_fn> A callable object that will be invoked every time a message 
                    is received
    """
    self.__logger.info("Registering Queue: %s" % queue_name)
    if not callable(callback_fn):
      self.__logger.error("The callback argument must be callable")
      return
    
    receiver = ReceiverThread(self.__broker, queue_name, callback_fn)
    receiver.start()
    self.__receivers[queue_name] = receiver
    
  
  def unregister_queue(self, queue_name):
    """
    Un-registers a queue and stops listening to it
    
    Inputs:
      <queue_name>  The name of the queue to stop receiving messages
    """  
    if self.__receivers.has_key(queue_name):
      self.__logger.debug("Unregistering Queue: %s" % queue_name)
      receiver = self.__receivers[queue_name]
      receiver.stop_receiver()
    else:
      self.__logger.warn("Queue (%s) was not found" % queue_name)
    
  def stop(self):
    """
    Closes all the connections and quits
    """
    self.__logger.info("Stopping the RMQClient")
    
    for key in self.__receivers.iterkeys():
      self.__logger.info("Unregistering: %s" % key)
      self.unregister_queue(key)
    
    self.__channel.cancel()
    self.__connection.close()
    
    
    
    
from threading import Thread
    
class ReceiverThread( Thread ):    
  """
  Class used to register to listen for incoming messages from a particular 
  queue.  It uses a callback function to let the interested party know of new
  messages.  The function must have the following arguments:
  
    channel:      The channel used to receive the message
    method_frame: (pika.spec.Basic.Deliver)
    header_frame: (pika.spec.BasicProperties)
    body:         The actual message
    
  """
  def __init__(self, broker, queue, callback_fn):
    """
    Instantiates a new object responsible for receiving messages from the given
    queue.

      channel:      The channel used to receive the message
      method_frame: (pika.spec.Basic.Deliver)
      header_frame: (pika.spec.BasicProperties)
      body:         The actual message

    Inputs:
      <broker>    The hostname or IP Address of the AMQP server
      <queue>     The name of the queue to receive messages from
      <callback_fn>  The callback function to invoke when a message is received
    """
    Thread.__init__(self)
    
    self.__logger = ccdp_utils.setup_logging(RMQClient.__name__)
    self.__logger.debug("Creating a new Receiver Thread")
    self.__broker = broker
    self.__queue = queue
    self.__callback = callback_fn
    
    self.__connection = None
    self.__channel = None
    
  def run(self):
    """
    Runs continuously listening for incoming messages from a specific queue.  
    If the callback_fn is not callable the thread returns and never even starts
    """
    # Making sure the function can be called
    if not callable(self.__callback):
      self.__logger.error("The callback function is not callable")
      return
    
    self.__logger.debug("Starting Receiver Thread")
    self.__connection = pika.BlockingConnection(pika.ConnectionParameters(
             host=self.__broker))
    
    self.__channel = self.__connection.channel()
    
    self.__channel.queue_declare(queue=self.__queue, durable=True)
    self.__channel.basic_qos(prefetch_count=1)
    self.__channel.basic_consume(self.__on_rmq_message, queue=self.__queue)
    # NOTE:
    #     rather than calling self.__channel.start_consuming()
    #     Apparently the start_consuming calls the function below with a 
    #     time_limit=None which causes a problem stopping it.  The workaround is
    #     the one shown below
    while self.__channel._consumer_infos:
      self.__channel.connection.process_data_events(time_limit=1) # 1 second

    
  def __on_rmq_message(self, channel, method_frame, header_frame, body):
    """
    Gets all the messages from RMQ and acknowledges them after passing the
    message body to the client
    """
    self.__callback(body)
    channel.basic_ack(delivery_tag = method_frame.delivery_tag)
    
  def stop_receiver(self):
    """
    Stops the thread after closing all the connections
    """
    self.__logger.info("Stopping Receiver: %s" % self.__queue)  
    if self.__channel:
      self.__logger.info("Stopping the Channel")
      self.__channel.stop_consuming(self.__queue)
      self.__channel.cancel()
    
    if self.__connection:
      self.__logger.info("Closing Connection")
      if not self.__connection.is_closed:
        self.__connection.close()
    
