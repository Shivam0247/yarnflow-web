#!/usr/bin/env bash
# Nightly compressed backup of the YarnFlow database; keeps the last KEEP (default 5).
# Skips the night (and says so in backups/backup.log) when the disk is too full, instead of filling it.
set -euo pipefail
cd "$(dirname "$0")"
KEEP="${KEEP:-5}"
last=$(ls -1t backups/yarnflow-*.dump 2>/dev/null | head -1 || true)
need=$(( ${last:+$(du -k "$last" | cut -f1)}0 / 10 * 2 + 1048576 ))   # twice the last backup + 1 GB, in kB
free=$(df -k --output=avail . | tail -1)
if [ "$free" -lt "$need" ]; then echo "$(date) ✗ backup skipped: only $((free/1048576)) GB free"; exit 1; fi
f="backups/yarnflow-$(date +%Y%m%d-%H%M).dump"
docker compose exec -T db pg_dump -U yarnflow -d yarnflow -Fc > "$f.part" && mv "$f.part" "$f"
ls -1t backups/yarnflow-*.dump | tail -n +$((KEEP + 1)) | xargs -r rm --
echo "$(date) backup $f $(du -h "$f" | cut -f1)"
