#!/bin/bash

echo "Starting deployment based on DEPLOYMENT.md steps..."

# Stop containers
echo "Stopping containers..."
docker-compose down --rmi local --volumes --remove-orphans || true

# Go to parent directory to re-clone
cd ..

# Remove existing directory
echo "Removing existing directory..."
rm -rf docker-manager

# 1. Clone the repository
echo "1. Cloning repository..."
git clone https://github.com/fahrettinrizaergin/docker-manager.git
cd docker-manager

# 2. Copy environment file
echo "2. Copying .env file..."
cp .env.example .env

# 3. Create Traefik network
echo "3. Creating 'web' network..."
docker network create web || true

# 4. Start the application
echo "4. Starting application..."
docker-compose up -d --build

echo "Deployment complete!"
