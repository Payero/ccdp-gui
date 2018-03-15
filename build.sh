#!/bin/sh
pushd frontend > /dev/null
./browserify_cmd
if [[ $? != 0 ]];then
	echo browserify failed
	exit
fi
popd > /dev/null
#start the server if it's not already running
running=$(netstat -tuplen 2>/dev/null | grep 5000)
[[ -z "${running// }" ]] && ./run_app.sh
