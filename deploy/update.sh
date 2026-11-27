#!/usr/bin/env bash
# Update YarnFlow's program from GitHub and restart it. The database is never touched
# (new versions only add to it). Runs nightly from cron; can also be run by hand: bash update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
old=$(git rev-parse HEAD)
git fetch -q origin main && git reset -q --hard origin/main
new=$(git rev-parse HEAD)
if [ "$old" = "$new" ] && [ "${1:-}" != "--force" ]; then echo "$(date) up to date ($new)"; exit 0; fi
cd deploy && docker compose up -d --build && docker image prune -f >/dev/null
echo "$(date) updated $old → $new"
