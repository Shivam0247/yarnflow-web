#!/usr/bin/env bash
# YarnFlow on a fresh Ubuntu server, one line (as root):
#   curl -fsSL https://raw.githubusercontent.com/Shivam0247/yarnflow-web/main/deploy/install.sh | bash
# Optional: your own domain →  … | bash -s -- erp.yourcompany.in
set -euo pipefail
command -v git >/dev/null || { apt-get update -qq && apt-get install -y -qq git >/dev/null; }
[ -d /opt/yarnflow-web/.git ] || git clone -q https://github.com/Shivam0247/yarnflow-web.git /opt/yarnflow-web
cd /opt/yarnflow-web/deploy && bash setup.sh "${1:-}"
