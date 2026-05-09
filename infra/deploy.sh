#!/usr/bin/env bash
# Pull latest changes and re-deploy the okiyo stack on the production host.
# Run on the server as the `nano` user from /srv/okiyo.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> git pull"
git pull --ff-only

echo "==> rebuild image"
docker compose build web

echo "==> apply"
docker compose up -d --remove-orphans

echo "==> done"
docker compose ps
