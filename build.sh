#!/bin/sh
pushd frontend > /dev/null
./browserify_cmd
popd > /dev/null
#start the server if it's not already running
running=$(netstat -tuplen 2>/dev/null | grep 5000)
[[ -z "${running// }" ]] && ./run_app.sh
