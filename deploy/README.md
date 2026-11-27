# YarnFlow on a cloud server (Hostinger KVM 2, or any Ubuntu server)

Everything runs in Docker on one Ubuntu server: PostgreSQL 16, the YarnFlow app, and Caddy (automatic HTTPS).
The database is never exposed to the internet. Every night: a database backup (last 14 kept), then the program
updates itself from GitHub — the data is never re-loaded or touched by an update.

**Server:** Ubuntu 24.04, 2+ vCPU, 8 GB RAM, 100 GB disk (Hostinger KVM 2), India or Singapore.

## 1. Install (on the server, once)
In Hostinger: VPS → your server → **Browser terminal** (or `ssh root@SERVER_IP` from the Mac's Terminal), then:
```
curl -fsSL https://raw.githubusercontent.com/Shivam0247/yarnflow-web/main/deploy/install.sh | bash
```
About 10 minutes. It prints the YarnFlow address (`https://<ip-with-dashes>.sslip.io`) and the administrator password —
write the password down (also kept in `/opt/yarnflow-web/deploy/.env`).
Own domain instead: `… | bash -s -- erp.yourcompany.in` (point the domain's DNS A record at the server IP first).

## 2. Copy the old software's export (from the Mac, once — the SanDisk is only read)
```
rsync -av --progress --exclude '._*' /Volumes/SanDisk/YarnFlowExport_20261123_1735/ root@SERVER_IP:/opt/yarnflow-web/deploy/export/
```
7.1 GB — the time depends on the internet upload speed. If it stops, run the same line again; it continues.

## 3. Load the data (on the server, once)
```
cd /opt/yarnflow-web/deploy && bash load-data.sh
```
About 1½–3 hours. Report: `deploy/reports/migration-report.html` (every old = new check).
Keep the browser terminal open while it runs, or start it with `nohup bash load-data.sh > reports/load.log 2>&1 &` and close it.

## Everyday
- Nothing to do: backups 02:30, program update 03:30 (`deploy/backups/*.log`).
- Update now: `bash /opt/yarnflow-web/deploy/update.sh`
- Logs: `cd /opt/yarnflow-web/deploy && docker compose logs -f app`
- Backup now: `bash backup.sh` · Restore: `docker compose exec -T db pg_restore -U yarnflow -d yarnflow --clean < backups/FILE.dump`
- Switching over for real: take a fresh export from the old software, copy it (step 2, new folder name), and run step 3 once more.
