#!/bin/sh
pushd client > /dev/null
./browserify_cmd
popd > /dev/null
#start the server if it's not already running
#running=$(netstat -tuplen 2>/dev/null | grep 5000)
#[[ -z "${running// }" ]] &&

export DB_PORT_9200_TCP_ADDR=db
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export CCDP_VI=$DIR/server

#Display mongo and amq IP addresses so server.py args can be entered into a PyDev launch config to enable PyDev debugging

echo COMAMND LINE: python ./server/server.py --ip=0.0.0.0 --port=5000 --db=ccdp --logfile=../ccdp.log --db-ip=52.205.26.225 --db-port=9200

echo CCDP_VI $CCDP_VI

python ./server/server.py --ip=0.0.0.0 --port=5000 --db=ccdp --logfile=../ccdp_vi.log --db-ip=52.205.26.225 --db-port=9200
