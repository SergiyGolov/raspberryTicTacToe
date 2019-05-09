#!/bin/bash

PROJECT_ROOT=$(grep PROJECT_ROOT .env | cut -d '=' -f2)

ngrok http 8080 -log=stdout > /dev/null &
sleep 1
node $PROJECT_ROOT/server.js > /dev/null &
