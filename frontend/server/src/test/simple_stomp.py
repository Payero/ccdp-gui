#!/usr/bin/env python

import time
import sys
from pprint import pprint, pformat
import stomp

class MyListener(stomp.ConnectionListener):
    def on_error(self, headers, message):
        print('received an error "%s"' % message)
    def on_message(self, headers, message):
        print('received a message "%s"' % message)

conn = stomp.Connection(host_and_ports=[('ax-ccdp.com', 61613)])
conn.set_listener('', MyListener())
conn.start()
#conn.connect('admin', 'password', wait=True)
conn.connect([('ax-ccdp.com', 61613)], wait=True)

#print("Connection %s" % pformat(dir(conn)))

conn.subscribe(destination='/queue/test', id=1, ack='auto')

conn.send(body=' '.join(sys.argv[1:]), destination='/queue/test')

time.sleep(2)
conn.disconnect()