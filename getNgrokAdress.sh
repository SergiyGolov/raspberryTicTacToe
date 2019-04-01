#!/bin/bash
# source: https://stackoverflow.com/questions/39471457/ngrok-retrieve-assigned-subdomain/40144313
curl --silent --show-error http://127.0.0.1:4040/api/tunnels | sed -nE 's/.*public_url":"https:..([^"]*).*/\1/p'
