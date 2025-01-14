#!/bin/bash
source .env

set -e

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..