#!/usr/bin/env python

from Queue import Queue
from threading import Thread
import traceback

# To support callbacks on task completion you can just add the callback to the task tuple
class Worker(Thread):
    """Thread executing tasks from a given tasks queue"""
    def __init__(self, tasks, name):
        Thread.__init__(self)
        self.tasks = tasks
        self.name = name
        self.daemon = True
        self.start()

    def run(self):
        while True:
            func, args, kargs = self.tasks.get()
            try:
                print "Thread %s is running" % self.name

                func(*args, **kargs)
            except Exception, e:
                traceback.print_exc()
                print e
            finally:
                self.tasks.task_done()

class ThreadPool:
    """Pool of threads consuming tasks from a queue"""
    def __init__(self, num_threads):
        self.tasks = Queue(num_threads)
        for i in range(num_threads): 
            name = "Thread-%d" % i
            Worker(self.tasks, name)

    def add_task(self, func, *args, **kargs):
        """Add a task to the queue"""
        self.tasks.put((func, args, kargs))

    def wait_completion(self):
        """Wait for completion of all the tasks in the queue"""
        self.tasks.join()

if __name__ == '__main__':
    from random import randrange
    from time import sleep
    from datetime import datetime

    def add(a, b, callback=None):
        if callback is not None and callable(callback):
            callback(a + b)
        else:
            return a + b

    def get_result(res):
        pass
        #print "Got result: %s" % res

    start = datetime.now()
    t = ThreadPool(50)
    for n in range(20000):
        t.add_task(add, *[n, n+10], callback=get_result)
    
    t.wait_completion()
    end = datetime.now()
    print "Done, time: %s" % ( end - start )
