import logging.config, os, json, re

# Stores the default verbosity level to use
__DEF_LEVEL = logging.DEBUG
# stores the default configuration file
__DEF_CFG_FILE = "${CCDP_GUI}/config/logging.json"

##############################################################################
# Reference for all the constants, need to figure out where to put it
#
#  state:    IDLE | STARTING | RUNNING | PAUSED | STOPPED | CANCELED | FINISHED
#  action:   START | PROCESS| STOP | PAUSE | CONTINUE | CANCEL
#  status:   SUCCESS | FAILURE
#  type:     STATUS | RESULTS
#
###############################################################################


class Bunch:
  """
  Allows the use of attributes to get its values.  For instance;

    b = Bunch(ONE=1, TWO=2, THREE=3)
    b.ONE returns 1
    b.TWO returns 2 and 
    b.THREE returns 3

  """
  def __init__(self, **kwds):
      self.__dict__.update(kwds)

MSG_TYPE = Bunch( ASSIGN_SESSION=0,
                  END_SESSION=1,
                  ERROR_MSG=2,
                  KILL_TASK=3,
                  PAUSE_THREAD=4,
                  RESOURCE_UPDATE=5,
                  RUN_TASK=6,
                  SHUTDOWN=7,
                  START_SESSION=8,
                  START_THREAD=9,
                  STOP_THREAD=10,
                  TASK_UPDATE=11,
                  THREAD_REQUEST=12,
                  UNDEFINED=13)

MESSAGES = ["ASSIGN_SESSION",
    "END_SESSION",
    "ERROR_MSG",
    "KILL_TASK",
    "PAUSE_THREAD",
    "RESOURCE_UPDATE",
    "RUN_TASK",
    "SHUTDOWN",
    "START_SESSION",
    "START_THREAD",
    "STOP_THREAD",
    "TASK_UPDATE",
    "THREAD_REQUEST",
    "UNDEFINED"]

ENG_QUEUE    = 'CCDP-Engine'
WEB_QUEUE    = 'CCDP-WebServer'
WORK_QUEUE   = 'CCDP-WorkTask'
THREAD_QUEUE = 'CCDP-Thread'

# the ip address or hostname of the host running RabbitMQ

PUB_RMQ_BROKER = '52.205.26.225'
PRIV_RMQ_BROKER = '172.31.20.84'

# used when launching AWS resources in order to ssh to it if needed
KEY_NAME='aws_serv_server_key'
# The owner Id is used to get all images based on the account
OWNER_ID = '451796069025'
# The security group to use when launching EC2 Nodes
EC2_SEC_GRP = 'sg-386c5b43'
# The security group to use when launching EMR Nodes
EMR_SEC_GRP = 'sg-386c5b43'


def setup_logging( name="root",
                   default_cfg_file=__DEF_CFG_FILE,
                   default_level=__DEF_LEVEL,
                   cfg_file=None
                 ):
  """
  Creates a logger object configured using a configuration file.  The order
  in which searches for the configuration file to evaluate is as follow:
     - First checks if the cfg_file is set, if is and the file exists then
       it uses the cfg_file
     - If the cfg_file is not provided it uses the CCDP_HOME environment
       variable to look for ${CCDP_HOME}/config/logging.json, if the file
       exists then it uses it
     - If none of the two options above are valid, then it uses a basic
       configuration

  Arguments:

    name:              The name of the logger as defined in the configuration
                       file
    cfg_file:          The name of the configuration file to use
    default_level:     The default verbosity level to use if no configuration
                       file is provided
    default_cfg_file:  The absolute path of the configuration file using the
                       CCDP_HOME environment variable.

  """
  filename = None

  # is the configuration file not provided
  if cfg_file == None:
    cfg_filename = os.path.expandvars(default_cfg_file)
    print "Using file %s" % cfg_filename

    if os.path.exists(cfg_filename):
      filename = cfg_filename
    else:
      print "The file %s cannot be found" % cfg_filename

  elif os.path.exists(cfg_file):
    if os.path.exists(cfg_file):
      filename = cfg_file

  if filename is not None:
    with open(filename, 'rt') as f:
        config = json.load(f)

    regex = re.compile(r'\$(\w+|\{[^}]*\})')
    def os_expandvar(match):
        v = match.group(1)
        if v.startswith('{') and v.endswith('}'):
            v = v[1:-1]
        return json.dumps(os.environ.get(v, ''))[1:-1]
    logging.config.dictConfig(json.loads(regex.sub(os_expandvar, json.dumps(config))))

  else:
    logging.basicConfig(level=default_level)

  logger = logging.getLogger(name)
  logger.propagate = False

  return logger


def json_load(file_handle):
  """
  Returns the contents of a file in the form of a python dictionary.  It
  eliminates the unicode symbol '\uKey' from all the strings.

  <file_handle>  The handle to the file containing the Python dictionary string
  """
  return __byteify(

      json.load(file_handle, object_hook=__byteify),
      ignore_dicts=True
  )

def json_loads(json_text):
  """
  Returns the contents of the string in the form of a python dictionary.  It
  eliminates the unicode symbol '\uKey' from all the strings.

  <json_text>  The string containing the Python structure
  """
  return __byteify(
      json.loads(json_text, object_hook=__byteify),
      ignore_dicts=True
  )

def __byteify(data, ignore_dicts = False):
  """
  Eliminates all the unicode symbols for all the string variables when
  constructing a Python Dictionary

  <data>  The data to convert
  """
  # if this is a unicode string, return its string representation
  if isinstance(data, unicode):
      return data.encode('utf-8')
  # if this is a list of values, return list of byteified values
  if isinstance(data, list):
      return [ __byteify(item, ignore_dicts=True) for item in data ]
  # if this is a dictionary, return dictionary of byteified keys and values
  # but only if we haven't already byteified it
  if isinstance(data, dict) and not ignore_dicts:
      return {
          __byteify(key, ignore_dicts=True): __byteify(value, ignore_dicts=True)
          for key, value in data.iteritems()
      }
  # if it's anything else, return it in its original form
  return data


def get_class( kls ):
  """
  Gets a class that can be used to instantiate objects based on the contents
  of the string.  The string needs to be the fully qualified package and module
  name up to the name of the class name to use.  For instance if a module bar
  is in the package foo and it has a class called FooBar, then the arguments
  needs to be foo.bar.FooBar.

  <kls> The fully qualified class name to use to create objects

  """
  parts = kls.split('.')
  module = ".".join(parts[:-1])
  m = __import__( module )
  for comp in parts[1:]:
      m = getattr(m, comp)
  return m


from logging.handlers import RotatingFileHandler

class EnvVarRotatingFileHandler(RotatingFileHandler):
  '''
  Rotating File Handler that evaluates the given filename for environment
  variables used to define the path.  It expands them if present and checks
  for the path to exist.  If the directory does not exists it creates it

  '''
  def __init__(self, filename, mode='a', maxBytes=0, backupCount=0, encoding=None, delay=0):
    '''
    Instantiates a new file rotating object that takes into account environment
    variables as part of the path
    '''
    filename = os.path.expandvars(filename)
    path = os.path.split(filename)
    if not os.path.isdir(path[0]):
      os.makedirs(path[0])

    RotatingFileHandler.__init__(self, filename, mode, maxBytes, backupCount, encoding, delay)

