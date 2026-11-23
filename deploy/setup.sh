#!/usr/bin/env bash
# One-time setup of YarnFlow on a fresh Ubuntu server (22.04 / 24.04). Run as root:
#   git clone https://github.com/Shivam0247/yarnflow-web.git && cd yarnflow-web/deploy && sudo bash setup.sh erp.yourcompany.in
# With no domain it serves plain http on the server's IP (use a domain for HTTPS).
set -euo pipefail
cd "$(dirname "$0")"
DOMAIN="${1:-}"
if ! command -v docker >/dev/null; then
  echo "› Installing Docker…"; curl -fsSL https://get.docker.com | sh
fi
if [ ! -f .env ]; then
  rnd() { openssl rand -hex 24; }
  ADMIN_PASSWORD="Yf-$(openssl rand -hex 6)"
  cat > .env <<ENV
DOMAIN=${DOMAIN:-:80}
DB_PASSWORD=$(rnd)
JWT_SECRET=$(rnd)
ADMIN_PASSWORD=$ADMIN_PASSWORD
EXPORT_DIR=./export
ENV
  chmod 600 .env
  echo "› Administrator login: admin@yarnflow.in / $ADMIN_PASSWORD   (saved in deploy/.env — change it after first login)"
fi
mkdir -p export reports backups
# firewall: only ssh + web
if [ -f /etc/iptables/rules.v4 ] && command -v netfilter-persistent >/dev/null; then
  # Oracle Cloud's Ubuntu images block everything but ssh with iptables: open 80 and 443 there
  for p in 80 443; do iptables -C INPUT -p tcp --dport $p -m state --state NEW -j ACCEPT 2>/dev/null || iptables -I INPUT 5 -p tcp --dport $p -m state --state NEW -j ACCEPT; done
  netfilter-persistent save >/dev/null
elif command -v ufw >/dev/null; then ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable >/dev/null; fi
echo "› Building and starting YarnFlow…"
docker compose up -d --build
# nightly database backup at 02:30, keeping 14 days
( crontab -l 2>/dev/null | grep -v yarnflow-backup; echo "30 2 * * * bash $(pwd)/backup.sh >> $(pwd)/backups/backup.log 2>&1 # yarnflow-backup" ) | crontab -
if [ -n "$DOMAIN" ]; then URL="https://$DOMAIN"; else URL="http://$(curl -s https://api.ipify.org || echo SERVER-IP)"; fi
echo "✓ YarnFlow is running: $URL"
echo "  Next: copy the old software's export folder to $(pwd)/export and run: bash load-data.sh"
