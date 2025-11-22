#!/bin/bash

echo "Starting deployment with LOCAL changes..."

# Stop containers
echo "Stopping containers..."
docker-compose down --remove-orphans || true

# 4. Start the application
echo "Building and starting application..."
docker-compose up -d --build

echo "Deployment complete!"

