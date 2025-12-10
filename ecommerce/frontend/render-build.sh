#!/bin/bash

# Build script for Render.com
echo "Starting frontend build..."

# Install dependencies
npm install

# Create production environment file
if [ ! -z "$VITE_BACKEND_URL" ]; then
  echo "VITE_BACKEND_URL=$VITE_BACKEND_URL" > .env.production
  echo "Using backend URL: $VITE_BACKEND_URL"
fi

# Build the application
npm run build

echo "Build completed successfully!"