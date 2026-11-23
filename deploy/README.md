# YarnFlow on a cloud server (Docker)

Everything runs in Docker on one Ubuntu server: PostgreSQL 16, the YarnFlow app, and Caddy (automatic HTTPS).
The database is never exposed to the internet; nightly backups go to `deploy/backups/` (last 14 kept).

**Server:** Ubuntu 22.04/24.04, 4 vCPU, 8 GB RAM, 100 GB disk, in India (Mumbai / Bangalore / Hyderabad).

## 1. Copy the code and the export to the server (from the Mac)
```
rsync -av --exclude node_modules --exclude .local-db --exclude .cloud-db-url ~/Documents/YarnFlow/ root@SERVER_IP:/opt/yarnflow/
rsync -av --progress --exclude '._*' /Volumes/SanDisk/YarnFlowExport_20261123_1735/ root@SERVER_IP:/opt/yarnflow/deploy/export/
```
(The SanDisk is only read.)

## 2. Start YarnFlow (on the server)
```
ssh root@SERVER_IP
cd /opt/yarnflow/deploy && bash setup.sh erp.yourcompany.in     # or bash setup.sh with no domain → http on the IP
```
It prints the administrator password (also kept in `deploy/.env`).
For HTTPS, point the domain's DNS A record at SERVER_IP first.

## 3. Load the old software's data
```
cd /opt/yarnflow/deploy && bash load-data.sh
```
About 1–1½ hours. Report: `deploy/reports/migration-report.html`. Run it again later with a fresh export to re-load.

## Everyday
- Update the app: copy the new code (step 1, first command) then `docker compose up -d --build`
- Logs: `docker compose logs -f app`
- Backup now: `bash backup.sh` · Restore: `docker compose exec -T db pg_restore -U yarnflow -d yarnflow --clean < backups/FILE.dump`
