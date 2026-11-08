# Sunday, the budgeting day

This is a budgeting helper tool that simply uses AI to categorize credit card line items based on their description. The prompt inherently depends on a static location which is Vancouver, BC.

# Run instructions
`bash run.sh` - this should run the docker-compose based on the `.env`. In prod mode, the backend will pull a docker image from my docker hub, and the frontend will be built and served as static files on vite.

Copy `.env.example` to `.env` to start; `.env` is git-ignored and must never be committed.

## Local URL (dev)

**In dev mode, open Sunday at <https://sunday.localhost:28001>.** It's no longer at `https://sunday.localhost`.

The dev stack uses Sunday's fixed local ports, bound to `127.0.0.1` only, so it can run next to other local stacks:

| What | Host port |
| --- | --- |
| Caddy, HTTPS (`sunday.localhost`) | `127.0.0.1:28001` |
| Caddy, HTTP (redirects to HTTPS on 28001) | `127.0.0.1:18001` |
| Frontend (Vite, 3000) and backend (uvicorn, 9000) | not published. Caddy reaches them over the Compose network |

Caddy listens on the same port numbers inside its container (`http_port`/`https_port` in `network/Caddyfile.dev`), so its HTTP→HTTPS redirect points at 28001, not 443.

Nothing in the dev stack listens on `0.0.0.0` or a LAN address. To reach the backend or frontend directly, use `docker compose -f docker-compose.dev.yml exec backend …` (or `exec frontend …`).

`bash run.sh --down` stops the stack, including the Tailscale container if it's running.

# Remote access (Tailscale, dev only)

The dev stack can join the owner's tailnet as its own device, `sunday`, served at `https://sunday.<tailnet>.ts.net`. Tailscale terminates HTTPS on port 443 inside a `tailscale` container (Compose profile `tailnet`), which forwards to a plain-HTTP Caddy listener (`:8480`). That listener is reachable only on the Compose network and answers only for `TAILNET_HOST`. No host port is opened, nothing is exposed to the internet, and the device can be shared with other provisioned users through Tailscale.

This is for the dev stack on the host only. The production deploy (`docker-compose.prod.yml`, `network/Caddyfile.prod`) is unchanged.

## One-time setup

1. In the Tailscale admin console, under **DNS**, turn on **MagicDNS** and **HTTPS Certificates**.
2. Under **Settings → Keys**, generate an auth key that is **not reusable**, **not ephemeral**, **pre-approved** (if offered) and has **no tags**.
3. In `.env`:
   ```
   TS_AUTHKEY=<the new key>
   TAILNET_HOST=sunday.<tailnet>.ts.net
   ```
   Leave `TS_HOSTNAME` empty to use `sunday`.
4. Start the stack: `bash run.sh`. It adds `--profile tailnet` whenever `TS_AUTHKEY` is set or the device has already joined (the `sunday_tailscale_state` volume exists).
5. In the admin console, find the `sunday` machine and **Share** it with each other provisioned user. They accept the invite with their own Tailscale account and then open `https://sunday.<tailnet>.ts.net`.

The key is used only for the first login (`TS_AUTH_ONCE=true`). The node's state is kept in the `tailscale_state` volume, so restarts need no new key. After the device joins, you can clear `TS_AUTHKEY` in `.env`.

## Checking it

```
docker compose -f docker-compose.dev.yml --profile tailnet logs tailscale
docker compose -f docker-compose.dev.yml --profile tailnet exec tailscale tailscale status --self --peers=false
docker compose -f docker-compose.dev.yml --profile tailnet exec tailscale tailscale serve status
```

## Turning it off

`bash run.sh --down` stops everything. To keep the app running without remote access:

```
docker compose -f docker-compose.dev.yml --profile tailnet stop tailscale
```

While the state volume exists, `run.sh` starts the container again. To remove the device for good, see "Resetting" below and delete the machine in the admin console.

## Rotating the auth key

Generate a new key with the same settings, put it in `TS_AUTHKEY` in `.env`, then run:

```
bash network/tailscale-rejoin.sh
```

It rejoins with the new key and keeps the device's name, address and shares. Never run `tailscale up --force-reauth` or `tailscale logout` inside the running container. The container exits as soon as the node leaves the Running state, the command fails with `EOF`, and the container restarts on its old, spent key. The script avoids this by recreating the container once with `TS_AUTH_ONCE=false TS_EXTRA_ARGS=--force-reauth`, so it re-authenticates at boot. It then recreates the container again with the defaults and prints `tailscale status` and `tailscale serve status`. The script never prints the key.

If the container is just stuck, recreating it is usually enough:

```
docker compose -f docker-compose.dev.yml --profile tailnet up -d --force-recreate tailscale
```

## When the device's key expires

Tailscale node keys expire (by default after 180 days). When this one expires, the node leaves the Running state and the container crash-loops on the spent auth key. Remote access stays down until you put a new auth key in `.env` and run `bash network/tailscale-rejoin.sh`. To avoid this, open the `sunday` machine in the admin console and choose **Disable key expiry**.

## Resetting

```
bash network/tailscale-rejoin.sh --reset
```

This asks for confirmation, deletes the `sunday_tailscale_state` volume and joins as a **new** device with the key in `.env`, so it needs a new key. First remove the old device in the admin console, so the new one can take the name `sunday`. Afterwards, share the new device again with each provisioned user.

## Limits

- Never use `tailscale funnel`. Funnel is disabled in `network/tailscale-serve.json` (`AllowFunnel: false`), and Sunday must stay private to the tailnet.
- Remote access works only while the host is awake and the stack is up.
