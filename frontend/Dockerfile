from python:2-onbuild
COPY server/bin/wait-for-it.sh .
COPY server/stomp.py-4.1.17-py2.7.egg .
COPY client /usr/app/src/client

RUN easy_install stomp.py-4.1.17-py2.7.egg
ENV CCDP_GUI /usr/app/src/app/