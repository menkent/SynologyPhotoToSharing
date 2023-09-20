# SynologyPhotoToSharing

# This App needs for Copying personal contidional albums (it need be shared for passpharase) to common photo folders
# 1 - Share your albums and save it ids (from url for example)
# 2 - Create folders in common photo folder - it folders will be destinations for copying files
# 3 - Add docker-compose to your Synology
# 4 - Create Work Folder for App
# 5 - Copy to work folder files:
- build/synology-photo-copying-tool.js
- settings.local.json  ( copy from example)
- start.sh - you can set some VARS from this file

# 6 - Create container and Run it
