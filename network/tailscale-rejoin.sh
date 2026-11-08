#!/usr/bin/env bash
# Rejoin the tailnet with a new auth key from .env, keeping the device's name,
# address and shares (dev stack only, see "Remote access" in README.md).
#
#   bash network/tailscale-rejoin.sh           # rotate to the key in .env
#   bash network/tailscale-rejoin.sh --reset   # forget the device, join as new
#
# Never runs `tailscale up --force-reauth` or `tailscale logout` inside the
# running container: containerboot exits as soon as the node leaves the Running
# state, so the CLI gets EOF and the container restarts on its old, spent key.
# Instead the container is recreated with TS_AUTH_ONCE=false and
# TS_EXTRA_ARGS=--force-reauth, so containerboot re-authenticates at boot.
#
# The key is read by docker compose from .env. This script only checks that it
# is set; it never puts it in argv, output or logs.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE=(docker compose -f docker-compose.dev.yml --profile tailnet)
SERVICE=tailscale
WAIT_SECONDS=120

die() {
    echo "error: $*" >&2
    exit 1
}

usage() {
    sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

reset=false
case "${1:-}" in
    "") ;;
    --reset) reset=true ;;
    -h | --help)
        usage
        exit 0
        ;;
    *)
        usage >&2
        exit 2
        ;;
esac

[ -f .env ] || die "no .env file. Copy .env.example to .env and set TS_AUTHKEY."

# Check the key is set without printing it.
key_line="$(grep -E '^[[:space:]]*TS_AUTHKEY=' .env | tail -n 1 || true)"
key_value="${key_line#*=}"
key_value="${key_value//[[:space:]\"\']/}"
unset key_line
if [ -z "$key_value" ]; then
    die "TS_AUTHKEY is empty in .env. Generate a new auth key in the Tailscale admin console (Settings -> Keys), put it in .env and run this again."
fi
unset key_value

# A key exported in this shell would override .env; make sure .env wins.
unset TS_AUTHKEY TS_AUTH_ONCE TS_EXTRA_ARGS

backend_state() {
    # Prints the node's BackendState, or nothing if the container isn't up.
    "${COMPOSE[@]}" exec -T "$SERVICE" tailscale status --json 2>/dev/null |
        sed -n 's/^[[:space:]]*"BackendState":[[:space:]]*"\([A-Za-z]*\)".*/\1/p' |
        head -n 1 || true
}

wait_running() {
    # Waits for containerboot's "Startup complete" and BackendState Running.
    local waited=0 logs
    echo "Waiting for the node to come up (up to ${WAIT_SECONDS}s)..."
    while [ "$waited" -lt "$WAIT_SECONDS" ]; do
        logs="$("${COMPOSE[@]}" logs --no-log-prefix "$SERVICE" 2>/dev/null || true)"
        if [[ "$logs" == *"Startup complete"* ]] &&
            [ "$(backend_state)" = "Running" ]; then
            echo "Node is Running."
            return 0
        fi
        sleep 3
        waited=$((waited + 3))
    done
    echo "The node did not reach Running. Last log lines:" >&2
    "${COMPOSE[@]}" logs --no-log-prefix --tail 20 "$SERVICE" >&2 || true
    return 1
}

if [ "$reset" = true ]; then
    cat <<'MSG'
--reset deletes the tailscale state volume and joins the tailnet as a NEW
device with the key in .env. Before you continue:
  1. Remove the old device from the Tailscale admin console (Machines), so the
     new one can take the same name instead of getting a "-1" suffix.
  2. After it joins, share the new device again with each provisioned user;
     the old shares do not carry over.
MSG
    read -r -p "Type 'reset' to continue: " answer
    [ "$answer" = "reset" ] || die "aborted, nothing changed."

    project="$(docker compose -f docker-compose.dev.yml config --no-interpolate |
        sed -n 's/^name: //p' | head -n 1)"
    [ -n "$project" ] || die "could not work out the compose project name."

    "${COMPOSE[@]}" rm --stop --force "$SERVICE"
    docker volume rm "${project}_tailscale_state" >/dev/null 2>&1 || true
    "${COMPOSE[@]}" up -d "$SERVICE"
    wait_running || die "the new device did not join. Check that the key in .env is valid and unused."
elif [ "$(backend_state)" = "Running" ]; then
    echo "Node is Running: re-authenticating with the new key at boot..."
    TS_AUTH_ONCE=false TS_EXTRA_ARGS=--force-reauth \
        "${COMPOSE[@]}" up -d --force-recreate "$SERVICE"
    wait_running || die "re-authentication failed. Check that the key in .env is valid and unused, then run this again."

    echo "Recreating the container with the default settings..."
    "${COMPOSE[@]}" up -d --force-recreate "$SERVICE"
    wait_running || die "the node did not come back after the restart."
else
    echo "Node is not Running: recreating the container so it logs in with the key in .env..."
    "${COMPOSE[@]}" up -d --force-recreate "$SERVICE"
    wait_running || die "the node did not join. Check that the key in .env is valid and unused."
fi

echo
"${COMPOSE[@]}" exec -T "$SERVICE" tailscale status --self --peers=false
echo
"${COMPOSE[@]}" exec -T "$SERVICE" tailscale serve status
