#!/bin/zsh -l
# Double-click: runs YarnFlow on this Mac AND gives a free https link (Cloudflare) your team can open from anywhere.
# Keep this window open and the Mac awake. Close the window (or Ctrl+C) to stop sharing.
cd "$(dirname "$0")"
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PWD/.tools:$PATH"
say() { print -P "%F{cyan}›%f $1"; }
if ! command -v node >/dev/null; then echo "Node.js 20+ is needed: https://nodejs.org"; read; exit 1; fi

# 1. Cloudflare tunnel program (once)
if ! command -v cloudflared >/dev/null; then
  if command -v brew >/dev/null; then say "Installing cloudflared (once)…"; brew install cloudflared
  else
    say "Downloading cloudflared from Cloudflare's GitHub (once)…"; mkdir -p .tools
    arch=$([ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64)
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-$arch.tgz" | tar -xz -C .tools && chmod +x .tools/cloudflared
  fi
fi
command -v cloudflared >/dev/null || { echo "✗ cloudflared could not be installed"; read; exit 1; }

# 2. YarnFlow itself (unless it is already running)
# install / update packages when the code changed (first run, or after "Update YarnFlow")
if [ ! -d node_modules/@embedded-postgres ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  say "Installing YarnFlow packages (a few minutes)…"; npm install --no-audit --no-fund || { read; exit 1; }
fi
BUILD=""; [ -z "$(find web/dist/index.html -newer package.json 2>/dev/null)" ] || [ -n "$(find web/src design -newer web/dist/index.html -type f 2>/dev/null | head -1)" ] && BUILD="--build"
YF=""
if ! curl -s -o /dev/null http://localhost:4000/api/health; then
  say "Starting YarnFlow${BUILD:+ (building the screens first, about 2 minutes)}…"; npm run local -- $BUILD > .yarnflow.log 2>&1 & YF=$!
  for i in {1..300}; do curl -s -o /dev/null http://localhost:4000/api/health && break; sleep 2; done
fi
curl -s -o /dev/null http://localhost:4000/api/health || { echo "✗ YarnFlow did not start — see .yarnflow.log"; read; exit 1; }

# 3. No login may keep a starting password once it is on the internet
DBURL=$([ -s .cloud-db-url ] && cat .cloud-db-url || echo "postgres://yarnflow:yarnflow@localhost:5433/yarnflow")
(cd server && DATABASE_URL="$DBURL" npx tsx src/tools/lock-default-passwords.ts)

# 4. Free public https link
say "Opening the public link…"
cloudflared tunnel --no-autoupdate --url http://localhost:4000 > .tunnel.log 2>&1 & CF=$!
cleanup() { kill $CF 2>/dev/null; [ -n "$YF" ] && kill -INT $YF 2>/dev/null; wait 2>/dev/null; }
trap cleanup EXIT INT TERM
URL=""; for i in {1..60}; do URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' .tunnel.log | head -1); [ -n "$URL" ] && break; sleep 1; done
[ -n "$URL" ] || { echo "✗ No link from Cloudflare — see .tunnel.log"; read; exit 1; }
print "$URL" | pbcopy
print -P "\n%F{green}════════════════════════════════════════════════════════════%f"
print -P "  YarnFlow is online:  %B$URL%b"
print -P "  (copied — paste it to your team; it works until you close this window)"
print -P "%F{green}════════════════════════════════════════════════════════════%f\n"
print "Keep this window open and the Mac awake (System Settings → Displays/Battery → prevent sleep)."
caffeinate -dimsu -w $$ &
wait $CF
