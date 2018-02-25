#!/bin/sh

#Runs the python server (webapp/frontend/server/src/server.py) directly, i.e. not in
#a docker container. The amq and mongo services in the docker-compose project webapp/services
#must be running.

export AMQ_PORT_61616_TCP_ADDR=amq
export DB_PORT_27017_TCP_ADDR=db
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export CCDP_GUI=$DIR/frontend/server

amq=`docker ps | grep  amq | awk '{print $1}' | xargs docker inspect | grep -E "IPAddress\"\: \"[[:digit:]]{1,3}(\.[[:digit:]]{1,3}){3}" | awk '{print $2}' | sed s/[\"\,]//g`

mongo=`docker ps | grep  mongo | awk '{print $1}' | xargs docker inspect | grep -E "IPAddress\"\: \"[[:digit:]]{1,3}(\.[[:digit:]]{1,3}){3}" | awk '{print $2}' | sed s/[\"\,]//g`

amq=localhost
mongo=localhost
#Display mongo and amq IP addresses so server.py args can be entered into a PyDev launch config to enable PyDev debugging
echo AMQ IP: $amq
echo MONGO IP: $mongo
echo COMAMND LINE: python ./frontend/server/src/server.py --ip=0.0.0.0 --port=5000 --db=ccdp --collection=modules --logfile=../ccdp.log --amq-ip=$amq --amq-port=61616 --db-ip=$mongo --db-port=27017

echo CCDP_GUI $CCDP_GUI

python ./frontend/server/src/server.py --ip=0.0.0.0 --port=5000 --db=ccdp --collection=modules --logfile=../ccdp.log --amq-ip=$amq --amq-port=61616 --db-ip=$mongo --db-port=27017


