#!/bin/bash
cd frontend
npm run build
cd ..

# bash scripts/run.sh

source .env

set -e

# ngrok http --url=$BASE_URL http://127.0.0.1:8000 > /dev/null &

cd backend
# python main.py --local_dev
python main.py