#!/usr/bin/env python

import sys, os
from pprint import pprint, pformat

__STR_OPS = ['SW', 'EW', 'CN']
__OPS = ['LT', 'LE', 'EQ', 'GT', 'GE', 'SW', 'EW', 'CN']

def runTask(data):
  print "Selecting Data from %s" % pformat(data)

  entry = data['record'].split(",")
  pos = int(data['column-number'])
  op = data['operator']
  value = data['value']
  
  print "Cheking that %s is %s than %s" % (entry[pos], op, value)

  if len(entry) < pos:
    print('ERROR, could not parse the data')
    return None
  
  found = False
  print("Is %s %s %s" % (entry[pos], op, value))

  if op in __STR_OPS:
    val = str(entry[pos])
    if op == 'SW' and val.startswith(value):
      found = True
    elif op == 'EW' and val.endswith(value):
      found = True
    elif op == 'CN' and val.find(value) >= 0:
      found = True
  else:
    val = entry[pos]
    try:
      val = int(val)
    except:
      pass
    if op == 'LT' and val < value:
      found = True
    elif op == 'LE' and val <= value:
      found = True
    elif op == 'EQ' and val == value:
      found = True
    elif op == 'GT' and val > value:
      found = True
    elif op == 'GE' and val >= value:
      found = True
    elif op not in __OPS:
      found = True
    
  if found:
    return entry
  else:
    return None


if __name__ == '__main__':
  
  data = {"column-number":8, "operator": "GE", "value":8, 
          "record":"1,1929,1 - Junior,50,Systems,Issue,2 - Normal,0 - Unassigned,3,1 - Unsatisfied"}
  
  val = runTask(data)
  print val
