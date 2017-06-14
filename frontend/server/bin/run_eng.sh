#!/bin/bash
#
# Runs a Java Application, in this case either the CcdpAgent or the 
# CcdpMainApplication
#

# Backup invocation parameters
COMMANDLINE_ARGS="$@"

## START: Default Configuration
#--------------------------------------------------------------------
#
# CCDP Installation directory
unset CCDP_BASE

if [ -z "$CCDP_GUI" ] ; then
	# Try to find RDD_HOME
	## resolve links - $0 may be a link 
	PRG="$0"
	progname=`basename "$0"`
	saveddir=`pwd`

	# need this for relative symlinks
	dirname_prg=`dirname "$PRG"`
	cd "$dirname_prg"

	while [ -h $"$PRG" ] ; do
		ls=`ls -d "$PRG"`
		link=`expr "$ls" : '.*-> \(.*\)$'`
		if expr "$link" L '.*/.*' > /dev/null; then
			PRG="$link"
		else
			PRG=`dirname "$PRG"`"/$link"
		fi
	done

	CCDP_GUI=`dirname "$PRG"`/..

	cd "$saveddir"
fi
export CCDP_GUI


echo "Running CCDP from: $CCDP_GUI"

# CCDP frontail directory
CCDP_TAIL_DIR="$CCDP_GUI/frontail"

# CCDP Log directory
CCDP_LOG_DIR="$CCDP_GUI/logs"

# if the directory does not exists, create it
if [ ! -d ${CCDP_LOG_DIR} ]; then
	mkdir -p ${CCDP_LOG_DIR}
fi




MY_PID=$$

case $1 in
	start)
	

	SRCH_APP_NAME="TestEngine"
	APP_NAME="TestEngine"

	# location of the pid file
	if [ -z "$CCDP_ENG_PIDFILE" ] ; then
		CCDP_ENG_PIDFILE="$CCDP_LOG_DIR/${APP_NAME}.pid"
	fi

	# Looking for running processes to avoid multiple launches
	#			   Find the app name       avoid grep    and java     and this pid         or the script    get the PID
	pid=`ps aux | grep ${SRCH_APP_NAME} | grep -v grep | grep -v ${MY_PID} | grep -v $0 | awk '{print $2}'`

	if [ "${pid}" != "" ] ; then
		echo ""
		echo "    ${APP_NAME} is already running (PID: $pid)"
		echo ""
	else
		echo ""
		echo "    Starting the $APP_NAME Service"
		echo ""

		echo "Running ${CCDP_GUI}/src/test/TestEngine.py "
		${CCDP_GUI}/src/test/TestEngine.py &
		echo $! > ${CCDP_ENG_PIDFILE}
		echo "."
	fi


	SRCH_APP_NAME="frontail"
	APP_NAME="frontail"

	TST=`which $APP_NAME`
	if [ "$TST" == "" ] ; then
		echo "frontail was not installed, running npm"
		HERE=$PWD 
		cd $CCDP_TAIL_DIR
		npm i frontail -g
	fi

	# location of the pid file
	if [ -z "$CCDP_TAIL_PIDFILE" ] ; then
		CCDP_TAIL_PIDFILE="$CCDP_LOG_DIR/${APP_NAME}.pid"
	fi


	# Looking for running processes to avoid multiple launches
	#			   Find the app name       avoid grep    and java     and this pid         or the script    get the PID
	pid=`ps aux | grep ${SRCH_APP_NAME} | grep -v grep | grep -v ${MY_PID} | grep -v $0 | awk '{print $2}'`

	if [ "${pid}" != "" ] ; then
		echo ""
		echo "    ${APP_NAME} is already running (PID: $pid)"
		echo ""
		exit
	else
		echo ""
		echo "    Starting the $APP_NAME Service"
		echo ""

		LOG_FILE="${CCDP_LOG_DIR}/test_engine.log"
		echo "Running frontail  ${LOG_FILE} "
		frontail  ${LOG_FILE} &
		echo $! > ${CCDP_TAIL_PIDFILE}
		echo "."

	fi

	;;
	stop)
	
	SRCH_APP_NAME="TestEngine"
	APP_NAME="TestEngine"

	# Use pid saved in pidfile to kill the app
	if [ ! -f "${CCDP_ENG_PIDFILE}" ] ; then
		echo "The $CCDP_ENG_PIDFILE does not exists.  Killing apps matching ${SRCH_APP_NAME}"
		pid=`ps aux | grep ${SRCH_APP_NAME} | grep -v grep | grep -v ${MY_PID} | grep -v $0 | awk '{print $2}'`

		if [ "${pid}" != "" ] ; then
			echo "Stopping ${APP_NAME}: $pid"
			kill -9 $pid			
		else
			echo "Could not find ${APP_NAME}"
		fi
	else
		pid=`cat ${CCDP_ENG_PIDFILE}`
		echo "Stopping ${APP_NAME}: $pid"
		kill -9 $pid		
		rm -f ${CCDP_ENG_PIDFILE}	
	fi
	echo "."

	SRCH_APP_NAME="frontail"
	APP_NAME="frontail"

	# Use pid saved in pidfile to kill the app
	if [ ! -f "${CCDP_TAIL_PIDFILE}" ] ; then
		echo "The $CCDP_TAIL_PIDFILE does not exists.  Killing apps matching ${SRCH_APP_NAME}"
		pid=`ps aux | grep ${SRCH_APP_NAME} | grep -v grep | grep -v ${MY_PID} | grep -v $0 | awk '{print $2}'`

		if [ "${pid}" != "" ] ; then
			echo "Stopping ${APP_NAME}: $pid"
			kill -9 $pid			
		else
			echo "Could not find ${APP_NAME}"
		fi
	else
		pid=`cat ${CCDP_TAIL_PIDFILE}`
		echo "Stopping ${APP_NAME}: $pid"
		kill -9 $pid		
		rm -f ${CCDP_TAIL_PIDFILE}	
	fi
	echo "."


	;;

	restart)
	echo "    Restarting ${APP_NAME}"
	/bin/bash ${CCDP_HOME}/bin/run_app.sh stop
	/bin/bash ${CCDP_HOME}/bin/run_app.sh start

	echo "."

	;;
	status)
	SRCH_APP_NAME="TestEngine"
	APP_NAME="TestEngine"
	#			   Find the app name       avoid grep    and java     and this pid         or the script    get the PID
	pid=`ps aux | grep ${SRCH_APP_NAME} | grep -v grep | grep -v ${MY_PID} | grep -v $0 | awk '{print $2}'`


	if [ "${pid}" != "" ] ; then
		echo ""
		echo "    ${APP_NAME} is running (PID: $pid)"
		echo ""
	else
		echo ""
		echo "    ${APP_NAME} is NOT running"
		echo ""
	fi

	SRCH_APP_NAME="frontail"
	APP_NAME="frontail"
	#			   Find the app name       avoid grep    and java     and this pid         or the script    get the PID
	pid=`ps aux | grep ${SRCH_APP_NAME} | grep -v grep | grep -v ${MY_PID} | grep -v $0 | awk '{print $2}'`


	if [ "${pid}" != "" ] ; then
		echo ""
		echo "    ${APP_NAME} is running (PID: $pid)"
		echo ""
	else
		echo ""
		echo "    ${APP_NAME} is NOT running"
		echo ""
	fi

	;;
	
	*)
	echo ""
	echo "    USAGE: $0 { start | stop | restart | status }"
	echo ""
	exit 1
	;;
esac

exit 0

