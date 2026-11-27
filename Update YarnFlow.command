#!/bin/zsh -l
# Double-click: downloads the latest YarnFlow code from GitHub into this folder.
# Your data (.local-db), settings and installed packages are kept. Then start it again as usual.
cd "$(dirname "$0")"
if curl -s -o /dev/null http://localhost:4000/api/health; then echo "Close YarnFlow first (close its window), then run this again."; read; exit 1; fi
echo "› Downloading the latest YarnFlow…"
curl -fsSL https://github.com/Shivam0247/yarnflow-web/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1 || { echo "✗ Download failed — check the internet connection"; read; exit 1; }
chmod +x *.command
echo "✓ Updated. Now double-click “Share YarnFlow online” (or “Start YarnFlow”)."
read -k1 "?Press any key to close"
