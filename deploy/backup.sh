#!/usr/bin/env bash
# Nightly compressed backup of the YarnFlow database; keeps the last 14.
set -euo pipefail
cd "$(dirname "$0")"
f="backups/yarnflow-$(date +%Y%m%d-%H%M).dump"
docker compose exec -T db pg_dump -U yarnflow -d yarnflow -Fc > "$f"
ls -1t backups/yarnflow-*.dump | tail -n +15 | xargs -r rm --
echo "$(date) backup $f $(du -h "$f" | cut -f1)"
