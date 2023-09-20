#!/bin/sh
export MAX_PHOTO_COPIED="1000"
export data='data.local.json'
export config=settings.local.json

while true; do
node build/synology-photo-copying-tool.js >>stdout.log 2>>stderr.log  || true
sleep 43200; done;