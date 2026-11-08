#!/bin/bash

set -e

# Load ENV from .env if not already set
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

PROFILE_ARGS=()

if [ "$ENV" = "prod" ]; then
    echo "Running in production mode..."
    COMPOSE_FILE="docker-compose.prod.yml"
else
    echo "Running in development mode..."
    COMPOSE_FILE="docker-compose.dev.yml"

    # Remote access over the tailnet (dev only, see README.md). Start the
    # tailscale container when an auth key is configured or the device has
    # already joined (its state volume exists). Never print the key.
    PROJECT_NAME="$(docker compose -f "$COMPOSE_FILE" config --no-interpolate 2>/dev/null | sed -n 's/^name: //p' | head -n 1)"
    if [ -n "${TS_AUTHKEY:-}" ] || \
        { [ -n "$PROJECT_NAME" ] && docker volume inspect "${PROJECT_NAME}_tailscale_state" >/dev/null 2>&1; }; then
        echo "Tailscale remote access enabled (profile: tailnet)."
        PROFILE_ARGS=(--profile tailnet)
    fi
fi

if [[ "$@" =~ (^--down) ]]; then
    if [ "$ENV" = "prod" ]; then
        docker compose -f "$COMPOSE_FILE" down
    else
        # Always include the profile so a running tailscale container stops too.
        docker compose -f "$COMPOSE_FILE" --profile tailnet down
    fi
else
    if [ "$ENV" = "prod" ]; then
        docker compose -f "$COMPOSE_FILE" pull backend
    fi
    docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" up --build -d
    if [ "$ENV" != "prod" ]; then
        echo "Sunday is at https://sunday.localhost:28001"
    fi
fi
