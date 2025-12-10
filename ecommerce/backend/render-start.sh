#!/bin/bash

echo "Starting backend server on Render..."

# Install dependencies
npm install

# Create .env file for production
if [ ! -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL=$DATABASE_URL" > .env
  echo "JWT_SECRET=$JWT_SECRET" >> .env
  echo "NODE_ENV=production" >> .env
  echo "FRONTEND_URL=$RENDER_EXTERNAL_URL" >> .env
  echo "Environment variables set"
fi

# Start the server
npm start