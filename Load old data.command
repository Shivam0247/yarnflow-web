#!/bin/zsh -l
# Double-click to load the old software's data (an export folder made by Export-OldDatabase.ps1)
# into YarnFlow on this Mac, then start YarnFlow. The export folder is only READ, never changed.
cd "$(dirname "$0")"
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null; then echo "Node.js 20+ is needed: https://nodejs.org"; read; exit 1; fi
DIR=$(osascript -e 'POSIX path of (choose folder with prompt "Choose the export folder (YarnFlowExport_…) that has UMIYA20 and UMIYA24 inside")' 2>/dev/null)
[ -z "$DIR" ] && { echo "No folder chosen."; read; exit 1; }
echo "Export folder: $DIR"
echo "This reads the export (never changes it), converts it and checks every figure. It takes about 1–1½ hours."
echo "Free disk space needed on this Mac: about 25 GB."
if [ ! -d node_modules/@embedded-postgres ]; then echo "Installing (first run, a few minutes)…"; npm install --no-audit --no-fund || { read; exit 1; }; fi
( for i in {1..3000}; do curl -s -o /dev/null http://localhost:4000 && { open http://localhost:4000; open migration-report.html 2>/dev/null; break; }; sleep 3; done ) &
npm run local -- --import "${DIR%/}" --build
