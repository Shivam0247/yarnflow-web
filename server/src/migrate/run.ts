/**
 * Runs the conversion steps (src/migrate/sql/NN_*.sql) against the archive, in order,
 * each step in one transaction (a failing step changes nothing).
 *
 * Usage: npm run migrate:convert -w server [-- 01 02 …]   (no args = all steps)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { config } from '../config.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sql');

export async function convert(only: string[] = [], url = config.databaseUrl) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  client.on('notice', (n) => console.log('   ', n.message));
  // the YarnFlow administrator (access to every company is given in step 08)
  const adminEmail = process.env.YF_ADMIN_EMAIL ?? 'admin@yarnflow.in';
  await client.query(`INSERT INTO public.users (name, email, password_hash, role, is_active) VALUES ('Administrator', $1, $2, 'ADMIN', true)
    ON CONFLICT (email) DO NOTHING`, [adminEmail, await bcrypt.hash(process.env.YF_ADMIN_PASSWORD ?? 'Admin@123', 10)]);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
    .filter((f) => !only.length || f.startsWith('00_') || only.some((o) => f.startsWith(o)));
  for (const f of files) {
    const t0 = Date.now();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL work_mem = '512MB'`);
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await client.query('COMMIT');
      await client.query('DISCARD TEMP');
      console.log(`✓ ${f} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      await client.query('ROLLBACK');
      const err = e as { message: string; where?: string; position?: string };
      console.error(`✗ ${f}: ${err.message}${err.where ? '\n  ' + err.where : ''}`);
      await client.end();
      process.exit(1);
    }
  }
  // fresh statistics and visibility maps after a full load, so screens are fast straight away
  if (!only.length) {
    const t0 = Date.now();
    await client.query('VACUUM (ANALYZE) public.ledger_entries, public.vouchers, public.voucher_lines, public.bill_allocations, public.accounts, public.legacy_refs, public.persons');
    console.log(`✓ statistics refreshed (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  await client.end();
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  convert(process.argv.slice(2)).catch((e) => { console.error(e); process.exit(1); });
}
