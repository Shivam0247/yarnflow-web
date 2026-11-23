/**
 * Writes the migration report (HTML) from mig.recon: every check with old value, new value
 * and difference; checks with a difference are listed first.
 * Usage: npm run migrate:report -w server -- <out.html>
 */
import fs from 'node:fs';
import pg from 'pg';
import { config } from '../config.js';

type Row = { area: string; check_name: string; scope: string; old_value: string | null; new_value: string | null; diff: string; ok: boolean };

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const num = (v: string | null) => {
  if (v === null || v === undefined) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return esc(v);
  const isInt = /^-?\d+$/.test(v);
  return isInt ? n.toLocaleString('en-IN') : v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
};

export async function report(out: string, url = config.databaseUrl) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const { rows } = await c.query<Row>('SELECT area, check_name, scope, old_value::text, new_value::text, diff::text, ok FROM mig.recon ORDER BY ok, id');
  const meta = await c.query(`SELECT db, max(export) AS export, max(loaded_at) AS at, sum(rows) AS rows FROM legacy_meta.loads GROUP BY db ORDER BY db`);
  await c.end();
  const failed = rows.filter((r) => !r.ok);
  const areas = [...new Set(rows.map((r) => r.area))];
  const table = (list: Row[]) => `<table><thead><tr><th>Area</th><th>Check</th><th>Scope</th><th class="r">Old software</th><th class="r">YarnFlow</th><th class="r">Difference</th><th></th></tr></thead><tbody>${list
    .map((r) => `<tr class="${r.ok ? '' : 'bad'}"><td>${esc(r.area)}</td><td>${esc(r.check_name)}</td><td>${esc(r.scope)}</td><td class="r">${num(r.old_value)}</td><td class="r">${num(r.new_value)}</td><td class="r">${r.ok ? '0' : num(r.diff)}</td><td>${r.ok ? '✓' : '✗'}</td></tr>`)
    .join('')}</tbody></table>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Migration report</title>
<style>
:root{--bg:#fff;--fg:#171717;--mut:#6b6b6b;--bd:#ececec;--s1:#f7f7f7;--bad:#fdecec;--badfg:#b91c1c;--ok:#15803d}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#ededed;--mut:#8f8f8f;--bd:#262626;--s1:#1e1e1e;--bad:#3a1717;--badfg:#f87171;--ok:#4ade80}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/20px Inter,system-ui,sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px}
.mut{color:var(--mut)}.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0}
.tile{border:1px solid var(--bd);border-radius:12px;padding:14px}.tile b{display:block;font-size:22px;line-height:30px}
.okc{color:var(--ok)}.badc{color:var(--badfg)}
.tw{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px}
th{background:var(--s1);text-align:left;font-weight:500;color:var(--mut);padding:7px 8px;white-space:nowrap}
td{padding:6px 8px;border-bottom:1px solid var(--bd);vertical-align:top}.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
tr.bad td{background:var(--bad)}
</style></head><body><main>
<h1>YarnFlow migration report</h1>
<div class="mut">${meta.rows.map((m) => `${esc(m.db)}: export ${esc(m.export)}, ${Number(m.rows).toLocaleString('en-IN')} rows archived`).join(' · ')} · generated ${esc(new Date().toISOString().slice(0, 16).replace('T', ' '))} UTC</div>
<div class="tiles">
<div class="tile"><span class="mut">Checks</span><b>${rows.length.toLocaleString('en-IN')}</b></div>
<div class="tile"><span class="mut">Exactly equal</span><b class="okc">${(rows.length - failed.length).toLocaleString('en-IN')}</b></div>
<div class="tile"><span class="mut">With a difference</span><b class="${failed.length ? 'badc' : 'okc'}">${failed.length.toLocaleString('en-IN')}</b></div>
</div>
${failed.length ? `<h2 class="badc">Checks with a difference (${failed.length})</h2><div class="tw">${table(failed)}</div>` : '<h2 class="okc">Every check is exactly equal.</h2>'}
${areas.map((a) => `<h2>${esc(a)}</h2><div class="tw">${table(rows.filter((r) => r.area === a))}</div>`).join('')}
</main></body></html>`;
  fs.writeFileSync(out, html);
  return { checks: rows.length, failed: failed.length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!)) {
  report(process.argv[2] ?? 'migration-report.html').then((r) => console.log(`✓ report: ${r.checks} checks, ${r.failed} with a difference`)).catch((e) => { console.error(e); process.exit(1); });
}
