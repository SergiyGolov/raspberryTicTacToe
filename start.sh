#!/bin/bash

ngrok http 8080 -log=stdout > /dev/null &
sleep 1
node /home/pi/raspberryTicTacToe/server.js > /dev/null &
