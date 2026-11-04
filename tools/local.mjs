#!/usr/bin/env node
/**
 * One-command local run: `npm run local`
 * Starts a private PostgreSQL 16 (embedded, no install needed) in ./.local-db,
 * migrates + seeds it on first run, builds the web app if needed, then serves
 * everything at http://localhost:4000. Ctrl+C stops it all.
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, '.local-db');
const PG_PORT = Number(process.env.YF_PG_PORT || 5433);
const PORT = Number(process.env.PORT || 4000);
const fresh = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));

const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: 'yarnflow', password: 'yarnflow', port: PG_PORT, persistent: true, onLog: () => {} });
const step = (m) => console.log('\x1b[36m›\x1b[0m ' + m);

if (fresh) { step('Creating local database (first run only)…'); await pg.initialise(); }
await pg.start();
if (fresh) await pg.createDatabase('yarnflow');

const secretFile = path.join(dataDir, '.jwt-secret');
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString('hex'));
const env = {
  ...process.env,
  DATABASE_URL: `postgres://yarnflow:yarnflow@localhost:${PG_PORT}/yarnflow`,
  JWT_SECRET: fs.readFileSync(secretFile, 'utf8'),
  PORT: String(PORT),
  HOST: '127.0.0.1',
  CORS_ORIGIN: `http://localhost:${PORT}`
};
const run = (args, label) => {
  step(label);
  const r = spawnSync('npm', args, { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) { console.error('✗ ' + label + ' failed'); stop(1); }
};

let child;
async function stop(code = 0) {
  if (child && !child.killed) child.kill('SIGINT');
  try { await pg.stop(); } catch { /* already stopped */ }
  process.exit(code);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

run(['run', 'db:migrate', '-w', 'server'], 'Applying migrations');
if (fresh) run(['run', 'db:seed', '-w', 'server'], 'Loading demo data');
if (!fs.existsSync(path.join(root, 'web/dist/index.html')) || process.argv.includes('--build')) run(['run', 'build', '-w', 'web'], 'Building the web app');

step('Starting YarnFlow…');
child = spawn('npx', ['tsx', 'src/server.ts'], { cwd: path.join(root, 'server'), env, stdio: ['inherit', 'ignore', 'inherit'], shell: process.platform === 'win32' });
child.on('exit', (c) => stop(c ?? 0));

const url = `http://localhost:${PORT}`;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(url + '/api/health').catch(() => fetch(url)); if (r) break; } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 500));
}
console.log(`\n  \x1b[32m✓ YarnFlow is running:\x1b[0m  ${url}\n    Login: admin@yarnflow.in / Admin@123\n    Press Ctrl+C to stop.\n`);
