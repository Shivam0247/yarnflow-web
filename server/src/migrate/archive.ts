/**
 * Step 1 of the migration — the permanent, exact archive.
 *
 * Loads every table of every database in an export folder (made by
 * tools/export-old-db/Export-OldDatabase.ps1) into PostgreSQL schema
 * `legacy_<db>` (e.g. legacy_umiya24), UNCHANGED:
 *   - every column is `text` holding exactly the exported characters
 *     (numbers, dates, codes — no parsing, no rounding);
 *   - NULL stays NULL and empty text stays empty text (CSV: unquoted empty vs "");
 *   - binary values stay as the exported "base64:…" text, byte-exact;
 *   - _row  = row position in the export, _sha = sha256 fingerprint of the row.
 * Then every table's row count is checked against the export's summary.txt.
 * Any difference throws — nothing downstream runs on an incomplete archive.
 *
 * Re-runnable: the schema is rebuilt from scratch on every run, and the run is
 * recorded in legacy_meta.loads (which export, when, counts).
 *
 * Usage: npm run migrate:archive -w server -- <exportFolder> [DB1,DB2]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import { config } from '../config.js';

const q = (id: string) => '"' + id.replace(/"/g, '""') + '"';

/** Split a CSV header line into column names (header cells are always quoted). */
function headerCols(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] !== '"') throw new Error('Unexpected header format: ' + line.slice(0, 80));
    let j = i + 1, s = '';
    for (;;) {
      if (line[j] === '"' && line[j + 1] === '"') { s += '"'; j += 2; continue; }
      if (line[j] === '"') break;
      s += line[j++];
    }
    out.push(s);
    i = j + 2; // skip closing quote and comma
  }
  return out;
}

function firstLine(file: string): string {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1 << 20);
  const n = fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  let s = buf.subarray(0, n).toString('utf8');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  const end = s.indexOf('\n');
  return (end >= 0 ? s.slice(0, end) : s).replace(/\r$/, '');
}

function readSummary(dir: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of fs.readFileSync(path.join(dir, 'summary.txt'), 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const p = l.trim().split(/\s+/);
    if (p.length >= 2) m.set(p[0], Number(p[p.length - 1]));
  }
  return m;
}

/** files for one table: <t>.csv then <t>.part002.csv … in order */
function tableFiles(dataDir: string, full: string): string[] {
  const all = fs.readdirSync(dataDir);
  const parts = all.filter((f) => f.startsWith(full + '.part') && f.endsWith('.csv')).sort();
  const main = full + '.csv';
  return [...(all.includes(main) ? [main] : []), ...parts].map((f) => path.join(dataDir, f));
}

export async function archive(exportDir: string, onlyDbs?: string[], url = config.databaseUrl) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const label = path.basename(path.resolve(exportDir));
  const dbs = fs.readdirSync(exportDir).filter((d) => fs.existsSync(path.join(exportDir, d, 'summary.txt')) && (!onlyDbs || onlyDbs.includes(d)));
  await client.query(`CREATE SCHEMA IF NOT EXISTS legacy_meta;
    CREATE TABLE IF NOT EXISTS legacy_meta.loads (id serial PRIMARY KEY, export text NOT NULL, db text NOT NULL, loaded_at timestamptz NOT NULL DEFAULT now(), tables int, rows bigint, ok boolean);
    -- UTF-8 bytes of a text (database encoding is fixed, so this is immutable — needed for generated columns)
    CREATE OR REPLACE FUNCTION legacy_meta.utf8(t text) RETURNS bytea LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $f$ SELECT convert_to(t, 'UTF8') $f$;
    CREATE TABLE IF NOT EXISTS legacy_meta.tables (db text, tbl text, expected bigint, loaded bigint, files int, columns int, PRIMARY KEY (db, tbl));`);
  const result: { db: string; tables: number; rows: number }[] = [];
  for (const db of dbs) {
    const dir = path.join(exportDir, db);
    const dataDir = path.join(dir, 'data');
    const schema = 'legacy_' + db.toLowerCase();
    const summary = readSummary(dir);
    const design = JSON.parse(fs.readFileSync(path.join(dir, 'schema.json'), 'utf8').replace(/^﻿/, '')) as {
      tables: { schema: string; name: string; kind: string; columns: { name: string }[] }[];
    };
    await client.query(`DROP SCHEMA IF EXISTS ${q(schema)} CASCADE; CREATE SCHEMA ${q(schema)};`);
    await client.query(`DELETE FROM legacy_meta.tables WHERE db = $1`, [db]);
    // keep the original design and report logic beside the data
    await client.query(`CREATE TABLE ${q(schema)}._schema (doc jsonb); CREATE TABLE ${q(schema)}._modules (sql text);`);
    await client.query(`INSERT INTO ${q(schema)}._schema VALUES ($1::jsonb)`, [fs.readFileSync(path.join(dir, 'schema.json'), 'utf8').replace(/^﻿/, '')]);
    await client.query(`INSERT INTO ${q(schema)}._modules VALUES ($1)`, [fs.readFileSync(path.join(dir, 'modules.sql'), 'utf8').replace(/^﻿/, '')]);
    let total = 0, n = 0;
    for (const [full, expected] of summary) {
      const tbl = full.replace(/^dbo\./, '');
      const files = tableFiles(dataDir, full);
      let cols: string[];
      if (files.length) cols = headerCols(firstLine(files[0]));
      else if (expected === 0) {
        // an empty table may come without its (header-only) file: take the columns from schema.json
        const t = design.tables.find((x) => x.kind === 'USER_TABLE' && `${x.schema}.${x.name}` === full);
        if (!t) throw new Error(`${db}.${tbl}: not in schema.json`);
        cols = t.columns.map((c) => c.name);
      } else throw new Error(`${db}.${tbl}: no data file in export but ${expected} rows expected`);
      // _sha is computed while each row is loaded (no second pass, no extra disk):
      // every value is length-prefixed and NULL has its own marker, so the fingerprint is unambiguous.
      const shaExpr = cols.map((c) => `CASE WHEN ${q(c)} IS NULL THEN 'N' ELSE 'V' || length(${q(c)}) || ':' || ${q(c)} END`).join(` || '|' || `);
      await client.query(`CREATE TABLE ${q(schema)}.${q(tbl)} (${cols.map((c) => q(c) + ' text').join(', ')}, _row bigserial, _sha text GENERATED ALWAYS AS (encode(sha256(legacy_meta.utf8(${shaExpr})), 'hex')) STORED)`);
      for (const f of files) {
        if (headerCols(firstLine(f)).join('\u0001') !== cols.join('\u0001')) throw new Error(`${f}: header differs from first part`);
        const stream = client.query(copyFrom(`COPY ${q(schema)}.${q(tbl)} (${cols.map(q).join(', ')}) FROM STDIN WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')`));
        await pipeline(fs.createReadStream(f), stream);
      }
      const { rows } = await client.query(`SELECT count(*)::bigint AS n FROM ${q(schema)}.${q(tbl)}`);
      const loaded = Number(rows[0].n);
      await client.query(`INSERT INTO legacy_meta.tables VALUES ($1,$2,$3,$4,$5,$6)`, [db, tbl, expected, loaded, files.length, cols.length]);
      if (loaded !== expected) throw new Error(`${db}.${tbl}: export says ${expected} rows, archive has ${loaded}`);
      total += loaded; n++;
      if (loaded > 100000) console.log(`  ${db}.${tbl}: ${loaded.toLocaleString('en-IN')} rows`);
    }
    await client.query(`INSERT INTO legacy_meta.loads (export, db, tables, rows, ok) VALUES ($1,$2,$3,$4,true)`, [label, db, n, total]);
    console.log(`✓ ${db}: ${n} tables, ${total.toLocaleString('en-IN')} rows archived and counted`);
    result.push({ db, tables: n, rows: total });
  }
  await client.end();
  return result;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [dir, dbs] = process.argv.slice(2);
  if (!dir) { console.error('Usage: archive <exportFolder> [DB1,DB2]'); process.exit(1); }
  archive(dir, dbs ? dbs.split(',') : undefined).catch((e) => { console.error('✗', e.message); process.exit(1); });
}
