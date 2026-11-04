#!/bin/zsh -l
# Double-click to run YarnFlow on this Mac. Close this window (or Ctrl+C) to stop.
cd "$(dirname "$0")"
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null; then echo "Node.js 20+ is needed: https://nodejs.org"; read; exit 1; fi
echo "Node $(node -v)"
if [ ! -d node_modules/@embedded-postgres ]; then echo "Installing (first run, a few minutes)…"; npm install --no-audit --no-fund || { read; exit 1; }; fi
( for i in {1..240}; do curl -s -o /dev/null http://localhost:4000 && { open http://localhost:4000; break; }; sleep 2; done ) &
npm run local
