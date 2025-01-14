#!/bin/bash
source .env

set -e

# Check if ngrok is installed
if ! command -v ngrok 2>&1 >/dev/null
then
    echo "ngrok could not be found. Please install it from https://download.ngrok.com."
    exit 1
fi

# Add ngrok's auth token
ngrok config add-authtoken $NGROK_AUTH_TOKEN

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..