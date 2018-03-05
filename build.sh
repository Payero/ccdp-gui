#!/bin/sh
pushd frontend
./browserify_cmd
popd
./run_app.sh
