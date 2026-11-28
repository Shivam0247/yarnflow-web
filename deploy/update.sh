#!/usr/bin/env bash
# Update YarnFlow's program from GitHub and restart it. The database is never touched
# (new versions only add to it). Runs nightly from cron; can also be run by hand: bash update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
old=$(git rev-parse HEAD)
git fetch -q origin main && git reset -q --hard origin/main
new=$(git rev-parse HEAD)
if [ "$old" = "$new" ] && [ "${1:-}" != "--force" ]; then echo "$(date) up to date ($new)"; exit 0; fi
cd deploy
# old build layers are not needed: free the space before building (data volumes are never touched)
docker builder prune -af >/dev/null 2>&1 || true
if ! docker compose up -d --build; then
  echo "$(date) ✗ update to $new FAILED — the previous version keeps running. Free space: $(df -h / --output=avail | tail -1)"
  exit 1
fi
docker image prune -f >/dev/null
echo "$(date) ✓ updated $old → $new"
