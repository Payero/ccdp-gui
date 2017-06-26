'''
Created on Jul 10, 2016

@author: oeg
'''
from threading import Thread, Event
import time

class TimerTask(Thread):
  """
  Simple class that invokes a method every time the interval time elapses.  It 
  uses an initial time wait prior start executing the action
  """
  def __init__(self, start_at, interval, function, is_daemon=True):
    """
    Initializes the new TimerTask thread.  If the initial time or the interval 
    is less than zero it is set to zero and no time will be waited.  If the 
    function is set to None the TimerTask prints an error message and quits
    
    Inputs:
      <start_at>    The initial time to wait prior invoking the method
      <interval>    The time to wait between invocations
      <function>    The method or function to invoke
      <is_daemon>   Wether or not the thread runs as a daemon
    """
    Thread.__init__(self)
    # if the thread is a daemon it quits when then main thread quits
    self.setDaemon(is_daemon)
    self.__stop = Event()
    
    self.__setStart(start_at)
    self.__setInterval(interval)
    self.__setFunction(function)
    
    
  def __setStart(self, start_at):
    """
    Sets the initial time to wait.  If the time is less than zero it sets it 
    zero to indicate no waiting time
    
    Inputs:
      <start_at>:  The initial time to wait
    """
    if start_at < 0:
      self.__start_at = 0
    else:
      self.__start_at = float(start_at)
      
  def __setInterval(self, interval):
    """
    Sets the time to wait between function calls.  If the time is less than 
    zero it sets it zero to indicate no waiting time
    
    Inputs:
      <interval>:  The time to wait between function calls
    """
    if interval < 0:
      self.__interval = 0
    else:
      self.__interval = float(interval)    
  
  def __setFunction(self, function):
    """
    Sets the method or function to be invoked.  If the function is None the
    TimerTask object prints and error message and does not start
    
    Input:
      <function>  The function to invoke every interval of time
    """
    if function == None:
      print "ERROR: The function cannot be None, TimerTask will not start"
      self.__stop.set()
    
    if hasattr(function, '__call__'):  
      self.__function = function
    else:
      print "ERROR: The function is not callable, TimerTask will not start"
      self.__stop.set()
  
  def run(self):
    """
    Starts the thread and hence the timer
    """
    Thread.run(self)
    
    # waiting for the initial time to elapse
    time.sleep(self.__start_at)
    if self.__function != None:
      # making continuous calls until the thread is stopped
      while not self.__stop.isSet():
        self.__function()
        time.sleep(self.__interval)
  
  def stopTimer(self):
    """
    Indicates the object to stop the thread
    """
    self.__stop.set()
    