#!/usr/bin/env bash
# Load (or re-load) the old software's data into YarnFlow on this server.
# Put the export folder's contents (UMIYA20/, UMIYA24/) in deploy/export first. The export is only read.
# The archive is rebuilt and the conversion re-run from scratch; the report goes to deploy/reports/.
set -euo pipefail
cd "$(dirname "$0")"
ls export/*/summary.txt >/dev/null 2>&1 || { echo "✗ No database folders in deploy/export (expected export/UMIYA20/summary.txt …)"; exit 1; }
DBS=$(for f in export/*/summary.txt; do basename "$(dirname "$f")"; done | paste -sd, -)
# bash load-data.sh            → everything from scratch
# bash load-data.sh 09 10      → only re-run those conversion steps (after a fix), keeping the rest
if [ $# -eq 0 ]; then
  echo "› Archiving $DBS exactly as exported…"
  docker compose run --rm app npm run migrate:archive -w server -- /export "$DBS"
  echo "› Converting to YarnFlow (about 45–60 minutes)…"
  docker compose run --rm app npm run migrate:convert -w server
else
  echo "› Re-running conversion steps: $*"
  docker compose run --rm app npm run migrate:convert -w server -- "$@"
fi
echo "› Checking old vs new…"
docker compose run --rm app npm run migrate:report -w server -- /reports/migration-report.html
docker compose restart app
echo "✓ Done. Report: $(pwd)/reports/migration-report.html"
