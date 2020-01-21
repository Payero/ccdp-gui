#!/bin/sh

export CCDP_GUI=/nishome/oegante/workspace/ccdp-gui/
export AMQ_IP=10.215.34.55
export AMQ_PORT=61616
export MONGO_IP=52.205.26.225
export MONGO_PORT=27017

./server.py --ip=0.0.0.0 --port=5000 --db=ccdp --collection=modules --logfile=/tmp/ccdp.log --amq-ip=${AMQ_IP} --amq-port=${AMQ_PORT} --db-ip=${MONGO_IP} --db-port=${MONGO_PORT}
