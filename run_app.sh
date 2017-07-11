#!/bin/sh

#Runs the python server (webapp/frontend/server/src/server.py) directly, i.e. not in
#a docker container. The amq and mongo services in the docker-compose project webapp/services
#must be running.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export CCDP_GUI=$DIR/frontend/server

amq=`docker ps | grep  amq | awk '{print $1}' | xargs docker inspect | grep -E "IPAddress\"\: \"[[:digit:]]{1,3}(\.[[:digit:]]{1,3}){3}" | awk '{print $2}' | sed s/[\"\,]//g`

mongo=`docker ps | grep  mongo | awk '{print $1}' | xargs docker inspect | grep -E "IPAddress\"\: \"[[:digit:]]{1,3}(\.[[:digit:]]{1,3}){3}" | awk '{print $2}' | sed s/[\"\,]//g`

python ./frontend/server/src/server.py --ip=0.0.0.0 --port=5000 --db=ccdp --collection=modules --logfile=../ccdp.log --amq-ip=$amq --amq-port=61616 --db-ip=$mongo --db-port=27017


