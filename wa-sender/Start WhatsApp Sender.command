#!/bin/bash
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
while true; do node sender.mjs; echo "Sender stopped, restarting in 10 seconds..."; sleep 10; done
