#!/bin/bash

set -e

echo "Building Docker image for Sunday API..."
docker build --platform=linux/amd64 -f backend/Dockerfile -t hcstephencheung/sunday-api:latest backend
echo "Image built, pushing to Docker Hub..."
docker push hcstephencheung/sunday-api:latest
echo "Docker image built and pushed successfully."
