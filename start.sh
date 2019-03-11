#!/bin/bash

ngrok -log=stdout http 8080 > /dev/null &
sleep 1
node server.js
