#!/bin/bash

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main || { echo "Git pull failed"; exit 1; }

# Cleanup Docker resources to free up space
echo "Cleaning up unused Docker resources..."
docker image prune -f
docker builder prune -f

# Remove accidental directory created by Docker if it exists
if [ -d "traefik.yml" ]; then
    echo "Removing accidental traefik.yml directory..."
    rm -rf traefik.yml
fi

# Stop containers
echo "Stopping containers..."
docker-compose down --remove-orphans || true

# Force remove containers to ensure ports are freed
echo "Force removing containers..."
docker rm -f dockermanager-traefik dockermanager-frontend dockermanager-backend dockermanager-redis dockermanager-postgres || true

# Remove frontend volume to prevent stale node_modules
echo "Cleaning up frontend volumes..."
docker volume rm docker-manager_frontend_node_modules 2>/dev/null || true
# Also try to remove anonymous volumes attached to the frontend service if possible
# Since we can't easily guess the hash, we rely on the build to overwrite if we can, 
# but docker-compose up --build should handle image updates. 
# The issue is the anonymous volume mounting over the image.
# We will force remove the frontend container and its volumes specifically.
docker-compose rm -s -f -v frontend || true

# 4. Start the application
echo "Building and starting application..."
docker-compose up -d --build

echo "Deployment complete!"

