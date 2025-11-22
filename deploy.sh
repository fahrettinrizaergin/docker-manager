#!/bin/bash

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main || { echo "Git pull failed"; exit 1; }

# Stop containers
echo "Stopping containers..."
docker-compose down --remove-orphans || true

# 4. Start the application
echo "Building and starting application..."
docker-compose up -d --build

echo "Deployment complete!"

