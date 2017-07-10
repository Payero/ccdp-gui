from python:2-onbuild
COPY server/bin/wait-for-it.sh .
COPY server/stomp.py-4.1.17-py2.7.egg .
COPY client /usr/app/src/client

RUN easy_install stomp.py-4.1.17-py2.7.egg
RUN pip install --upgrade pip
RUN pip install --upgrade flask

ENV CCDP_GUI /usr/src/app/server
