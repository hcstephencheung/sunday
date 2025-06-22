#!/bin/bash

set -e

# Load ENV from .env if not already set
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ "$ENV" = "prod" ]; then
    echo "Running in production mode..."
    COMPOSE_FILE="docker-compose.prod.yml"
    docker compose -f "$COMPOSE_FILE" pull backend
else
    echo "Running in development mode..."
    COMPOSE_FILE="docker-compose.dev.yml"
fi

if [[ "$@" =~ (^--down) ]]; then
    docker compose -f "$COMPOSE_FILE" down
else
    docker compose -f "$COMPOSE_FILE" up --build -d
fi