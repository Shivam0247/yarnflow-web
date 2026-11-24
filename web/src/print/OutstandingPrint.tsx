/**
 * "PARTY GROUPWISE SALES OUTSTANDING - UNPAID" exactly as the old software printed it (Crystal), with
 * the same page breaks: /print/outstanding?by=group|collector|broker|salesperson&kind=sale|debit|all&from&to&only=<group>
 * Pages are laid out here (fixed row heights) so "Page x of y" and the header repeat as before.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { YF_API } from '@/dc/api';

interface Bill { id: number; com: string; companyId: number; date: string; number: string; broker: string; item: string; partyId: number; rate: number; qty: number; net: number; received: number; pending: number; crDays: number; days: number; group: string }
interface Party { id: number; name: string; contact: string | null; mobile: string | null; address: string | null; collector: string | null; balance: number }
interface Data { title: string; by: string; kind: string; from: string; to: string; company: { name: string; address: string }; companies: { id: number; short: string; name: string; on: boolean }[]; bills: Bill[]; parties: Record<string, Party> }

const GROUP_LABEL: Record<string, string> = { group: 'Group :', collector: 'Coll. Person :', broker: 'Broker :', salesperson: 'Sales Person :', 'broker+party': 'Broker :', 'broker+group': 'Broker / Group :', 'collector+party': 'Coll. Person :', 'collector+group': 'Coll. P / Group :', 'salesperson+party': 'Sales Person :', 'state+party': 'State :', 'city+party': 'City :' };
const slash = (d: string) => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${dd}/${m}/${y}`; };
const short = (d: string) => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${dd}/${m}/${y.slice(2)}`; };
const int = (n: number) => String(Math.round(n));
/** half-up rounding, as the old report printed (5556.735 → 5556.74) */
const fx = (n: number, d: number) => { const k = 10 ** d; return (Math.round(n * k + (n >= 0 ? 1e-6 : -1e-6)) / k).toFixed(d); };
const f2 = (n: number) => fx(n, 2);
const f3 = (n: number) => fx(n, 3);

/* Geometry in points, measured from the old Crystal PDF (A4 595 × 842 pt): every section has its height
   and every field its x position, font and size, so text, rules and page breaks fall where they did. */
const Y0 = 83.3, LIMIT = 817;
const H = { group: 18, party: 13.7, add: 12.2, bill: 12.05, ptotal: 13.7, gtotal: 11.5, grand: 14.7 };

type Line =
  | { k: 'group'; name: string }
  | { k: 'party'; p: Party }
  | { k: 'add'; p: Party }
  | { k: 'bill'; b: Bill }
  | { k: 'ptotal'; qty: number; net: number; os: number }
  | { k: 'gtotal'; qty: number; net: number; rec: number; os: number }
  | { k: 'grand'; qty: number; net: number; os: number };

type Font = 'c' | 'cb' | 't' | 'tb';
const FONT: Record<Font, string> = {
  c: "400 {s}pt Calibri, Carlito, Arial, sans-serif",
  cb: "700 {s}pt Calibri, Carlito, Arial, sans-serif",
  t: "400 {s}pt 'Times New Roman', 'Liberation Serif', Times, serif",
  tb: "700 {s}pt 'Times New Roman', 'Liberation Serif', Times, serif"
};
/** glyph-top correction per font and size (browser text box vs the Crystal PDF), measured */
const DY: Record<string, number> = { 'cb9.85': 2.05, 'cb6.55': 1.25, 'tb7.95': 0.75, 't8': 0.16, 'c8.2': 0.95, 'cb7.35': 0.52, 'cb8.2': 0.65, 'c6.55': 1.3, 't7.05': 0.51, 'c6.15': 1.55, 'c7.35': 1.1 };
/** one text field: x = left edge, or r = right edge (right aligned), or cx = centre; w clips the field */
function T({ y, x, r, cx, w, f = 'c', s = 6.55, blue, children }: { y: number; x?: number; r?: number; cx?: number; w?: number; f?: Font; s?: number; blue?: boolean; children: ReactNode }) {
  const st: CSSProperties = { position: 'absolute', top: y - (DY[f + s] ?? 0) + 'pt', font: FONT[f].replace('{s}', String(s)), lineHeight: s + 'pt', whiteSpace: 'pre', color: blue ? '#0000ff' : '#000' };
  if (r != null) { const ww = w ?? 120; Object.assign(st, { left: r - ww + 'pt', width: ww + 'pt', textAlign: 'right', overflow: 'hidden' }); }
  else if (cx != null) { const ww = w ?? 400; Object.assign(st, { left: cx - ww / 2 + 'pt', width: ww + 'pt', textAlign: 'center' }); }
  else { Object.assign(st, { left: x + 'pt' }); if (w != null) Object.assign(st, { width: w + 'pt', overflow: 'hidden' }); }
  return <div style={st}>{children}</div>;
}
function Rule({ y, x1, x2, dash, thin }: { y: number; x1: number; x2: number; dash?: boolean; thin?: boolean }) {
  // dashes as Crystal drew them: 1 pt rule 12 on / 4 off from x1 + 1, hairline 11.5 on / 4.5 off
  const sx = dash ? (thin ? x1 - 0.1 : x1 + 1) : x1;
  const st: CSSProperties = { position: 'absolute', left: sx + 'pt', width: x2 - sx + 'pt', top: y - 0.7 - (thin ? 0.25 : 0.5) + 'pt', height: (thin ? 0.5 : 1) + 'pt' };
  st.background = dash ? `repeating-linear-gradient(90deg, #000 0 ${thin ? 11.5 : 12}pt, transparent ${thin ? 11.5 : 12}pt 16pt)` : '#000';
  return <div style={st} />;
}

export default function OutstandingPrint() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const by = sp.get('by') ?? 'group';
  const kind = sp.get('kind') ?? 'sale';
  const to = sp.get('to') ?? YF_API.today();
  const from = sp.get('from') ?? '';
  const only = sp.get('only') ?? '';
  const companies = sp.get('companies') ?? '';
  const [printedAt] = useState(() => new Date());

  useEffect(() => {
    setBusy(true); setErr('');
    const extra: Record<string, string> = {}; sp.forEach((v, k) => { if (!['by', 'kind', 'to', 'from', 'only', 'companies'].includes(k)) extra[k] = v; });
    YF_API.get<Data>('/outstanding-print', { ...extra, by, kind, to, from: from || undefined, companies: companies || undefined })
      .then((d) => { setData(d); document.title = d.title; })
      .catch((e) => setErr(YF_API.message(e)))
      .finally(() => setBusy(false));
  }, [by, kind, to, from, companies, sp]);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n); };

  const groups = useMemo(() => [...new Set((data?.bills ?? []).map((b) => b.group))].sort((a, b) => a.localeCompare(b)), [data]);

  const pages = useMemo(() => {
    if (!data) return [] as Line[][];
    const bills = data.bills.filter((b) => !only || b.group === only);
    const byGroup = new Map<string, Bill[]>();
    for (const b of bills) (byGroup.get(b.group) ?? byGroup.set(b.group, []).get(b.group)!).push(b);
    const lines: Line[] = [];
    let gq = 0, gn = 0, go = 0;
    for (const g of [...byGroup.keys()].sort((a, b) => a.localeCompare(b))) {
      if (data.by !== 'party') lines.push({ k: 'group', name: g });
      const gb = byGroup.get(g)!;
      const byParty = new Map<number, Bill[]>();
      for (const b of gb) (byParty.get(b.partyId) ?? byParty.set(b.partyId, []).get(b.partyId)!).push(b);
      const pids = [...byParty.keys()].sort((a, b) => String(data.parties[a]?.name ?? '').localeCompare(String(data.parties[b]?.name ?? '')));
      let tq = 0, tn = 0, tr = 0, to2 = 0;
      for (const pid of pids) {
        const p = data.parties[pid] ?? { id: pid, name: '', contact: '', mobile: '', address: '', collector: '', balance: 0 };
        lines.push({ k: 'party', p }, { k: 'add', p });
        const pb = byParty.get(pid)!.sort((a, b) => a.date.localeCompare(b.date) || a.companyId - b.companyId || a.number.localeCompare(b.number));
        let q = 0, n = 0, o = 0;
        for (const b of pb) { lines.push({ k: 'bill', b }); q += b.qty; n += b.net; o += b.pending; tr += b.received; }
        lines.push({ k: 'ptotal', qty: q, net: n, os: o });
        tq += q; tn += n; to2 += o;
      }
      if (data.by !== 'party') lines.push({ k: 'gtotal', qty: tq, net: tn, rec: tr, os: to2 });
      gq += tq; gn += tn; go += to2;
    }
    if (lines.length) lines.push({ k: 'grand', qty: gq, net: gn, os: go });
    const out: Line[][] = [[]];
    let y = Y0;
    for (const l of lines) {
      const h = H[l.k];
      const brk = sp.get('pergroup') === '1' && l.k === 'group';
      if ((y + h > LIMIT || brk) && out[out.length - 1].length) { out.push([]); y = Y0; }
      out[out.length - 1].push(l); y += h;
    }
    return out;
  }, [data, only, sp]);

  const comp = data?.companies ?? [];
  const toggleCo = (id: number) => {
    const on = comp.filter((c) => c.on).map((c) => c.id);
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    set('companies', next.length === comp.length ? '' : next.join(','));
  };
  const time = printedAt.toTimeString().slice(0, 8);

  return (
    <div className="op-root">
      <style>{CSS}</style>
      <div className="op-bar">
        <select value={by} onChange={(e) => set('by', e.target.value === 'group' ? '' : e.target.value)} aria-label="Group by">
          <option value="group">Party group wise</option>
          <option value="collector">Collection person wise</option>
          <option value="broker">Broker wise</option>
          <option value="salesperson">Sales person wise</option>
        </select>
        <select value={kind} onChange={(e) => set('kind', e.target.value === 'sale' ? '' : e.target.value)} aria-label="Bills">
          <option value="sale">Sale bills</option>
          <option value="debit">Debit notes</option>
          <option value="all">All (sale, general sale, debit notes)</option>
        </select>
        <label>From <input type="date" value={from || data?.from || ''} onChange={(e) => set('from', e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={(e) => set('to', e.target.value)} /></label>
        <select value={only} onChange={(e) => set('only', e.target.value)} aria-label="Only" style={{ maxWidth: 260 }}>
          <option value="">All ({groups.length})</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <details className="op-co">
          <summary>Companies ({comp.filter((c) => c.on).length})</summary>
          <div>{comp.map((c) => <label key={c.id}><input type="checkbox" checked={c.on} onChange={() => toggleCo(c.id)} /> {c.short} — {c.name}</label>)}</div>
        </details>
        <button onClick={() => window.print()} disabled={!data || busy}>Print / Save as PDF</button>
        <span>{busy ? 'Loading…' : data ? `${pages.length} page${pages.length === 1 ? '' : 's'}` : ''}</span>
        {err && <span style={{ color: '#ff8a8a' }}>{err}</span>}
      </div>
      {data && pages.map((lines, i) => {
        let y = Y0;
        return (
          <div className="op-page" key={i}>
            <T cx={290.85} y={16.2} f="cb" s={9.85}>{data.company.name}</T>
            <T cx={291.15} y={29.1} f="cb" s={6.55} w={560}>{data.company.address}</T>
            <T cx={297.75} y={44.0} f="tb" s={7.95}>{data.title.replace(' - ', ' -  ')}</T>
            <Rule y={54.3} x1={19.6} x2={576} dash />
            <T x={23.3} y={58.1} f="t" s={8}>{slash(data.from)} TO {slash(data.to)}</T>
            <T x={365.8} y={58.7} s={7.35}>{slash(YF_API.today())}</T>
            <T x={417.9} y={58.7} s={7.35}>{time}</T>
            <T x={526.8} y={58.3} s={8.2}>Page {i + 1} of {pages.length}</T>
            <Rule y={69.5} x1={15.8} x2={595} />
            {([[24.0, 'Company'], [67.4, 'Date'], [90.1, 'Bill No'], [141.0, 'Broker'], [195.1, 'Item Name'], [269.0, 'Rate'], [305.5, 'Bill Qnty.'],
              [373.2, 'Bill Net.'], [430.2, 'Total Rec.'], [495.4, 'Total O/s'], [529.6, 'C.Days'], [554.6, 'Days']] as [number, string][]).map(([x, t]) => (
              <T key={t} x={x} y={74.2} f="cb">{t}</T>
            ))}
            <Rule y={83.8} x1={15.1} x2={569.3} />
            {lines.map((l, j) => { const top = y; y += H[l.k]; return <Section key={j} l={l} y={top} by={data.by} />; })}
          </div>
        );
      })}
    </div>
  );
}

function Section({ l, y, by }: { l: Line; y: number; by: string }) {
  switch (l.k) {
    case 'group':
      return (
        <>
          <img src="/print/swastik.png" alt="" style={{ position: 'absolute', left: '17.3pt', top: y - 0.7 + 'pt', width: '17.25pt', height: '18pt' }} />
          <img src="/print/swastik.png" alt="" style={{ position: 'absolute', left: '552.05pt', top: y - 0.7 + 'pt', width: '17.25pt', height: '18pt' }} />
          <T x={41.3} y={y + 3.1} f="cb" s={7.35} blue>{GROUP_LABEL[by] ?? 'Group :'}</T>
          <T x={113.3} y={y + 3.5} f="cb" s={8.2} blue>{l.name}</T>
        </>
      );
    case 'party':
      return (
        <>
          <Rule y={y + 0.5} x1={17.3} x2={593.7} />
          <T x={29.3} y={y + 4.6} f="cb" s={7.35}>Party :</T>
          <T x={68.1} y={y + 4.0} f="cb" s={7.35} w={198}>{l.p.name}</T>
          <T x={269.3} y={y + 3.7} f="cb">Name</T>
          <T x={294.8} y={y + 3.6} w={64}>{l.p.contact ?? ''}</T>
          <T x={361.6} y={y + 4.4} f="cb">Mob</T>
          <T x={384.8} y={y + 4.3} w={68}>{l.p.mobile ?? ''}</T>
          <T x={456.1} y={y + 4.4} f="cb">Coll. P :</T>
          <T x={483.8} y={y + 2.8}>{l.p.collector ?? ''}</T>
        </>
      );
    case 'add': {
      const bal = l.p.balance;
      return (
        <>
          <T x={30.5} y={y + 2.9} f="cb">Add:</T>
          <T x={67.3} y={y + 2.8} w={356}>{l.p.address ?? ''}</T>
          <T x={426.1} y={y + 2.9} f="cb">Ledger Balance</T>
          <T r={541.0} y={y + 2.8} w={70}>{' ' + f2(Math.abs(bal))}</T>
          <T x={543.0} y={y + 2.8}>{bal < 0 ? 'CR' : 'DB'}</T>
          <Rule y={y + 9.8} x1={30.8} x2={570.5} dash thin />
        </>
      );
    }
    case 'bill': {
      const b = l.b;
      return (
        <>
          <T x={16.5} y={y + 2.4} f="t" s={7.05} w={30}>{b.com}</T>
          <T r={72.3} y={y + 2.9} w={30}>{short(b.date)}</T>
          <T x={90.0} y={y + 2.9} w={50}>{b.number}</T>
          <T x={141.0} y={y + 2.9} w={47}>{b.broker}</T>
          <T x={189.1} y={y + 2.9} w={74.6}>{b.item}</T>
          <T r={285.1} y={y + 2.9} w={40}>{' ' + f2(b.rate)}</T>
          <T r={330.1} y={y + 2.9} w={42}>{' ' + f2(b.qty)}</T>
          <T r={398.1} y={y + 2.4} f="t" s={7.05} w={60}>{' ' + int(b.net)}</T>
          <T r={457.6} y={y + 2.4} f="t" s={7.05} w={50}>{' ' + f2(b.received)}</T>
          <T r={521.4} y={y + 2.9} w={60}>{' ' + int(b.pending)}</T>
          <T cx={535.15} y={y + 2.7} s={6.15} w={16}>{' ' + b.crDays}</T>
          <T r={570.5} y={y + 2.9} w={28}>{' ' + b.days}</T>
        </>
      );
    }
    case 'ptotal':
      return (
        <>
          <Rule y={y + 1.3} x1={14.3} x2={592.9} />
          <T x={29.3} y={y + 5.8} f="cb" s={8.2}>Party Total :</T>
          {Math.abs(l.qty) > 0.0005 && <T r={329.4} y={y + 5.1} f="cb" w={60}>{' ' + f3(l.qty)}</T>}
          <T r={397.4} y={y + 5.1} f="cb" w={60}>{' ' + int(l.net)}</T>
          <T r={521.4} y={y + 5.1} f="cb" w={60}>{' ' + int(l.os)}</T>
        </>
      );
    case 'gtotal':
      return (
        <>
          <Rule y={y + 0.5} x1={14.8} x2={593.7} />
          <T x={29.3} y={y + 3.6} f="cb" s={8.2}>Group Wise Total :</T>
          <T r={329.5} y={y + 2.8} f="cb" w={60}>{' ' + f3(l.qty)}</T>
          <T r={398.2} y={y + 2.8} f="cb" w={60}>{' ' + int(l.net)}</T>
          <T r={461.7} y={y + 2.8} f="cb" w={60}>{' ' + int(l.rec)}</T>
          <T r={521.4} y={y + 2.8} f="cb" w={60}>{' ' + int(l.os)}</T>
          <Rule y={y + 10.8} x1={14.8} x2={592.9} />
        </>
      );
    case 'grand':
      return (
        <>
          <T x={30.1} y={y + 4.9} f="cb" s={8.2}>Grand Total :</T>
          <T r={329.5} y={y + 4.2} f="cb" w={60}>{' ' + f3(l.qty)}</T>
          <T r={397.4} y={y + 2.6} f="cb" w={60}>{' ' + int(l.net)}</T>
          <T r={521.4} y={y + 2.6} f="cb" w={60}>{' ' + int(l.os)}</T>
          <Rule y={y + 14.7} x1={14.8} x2={592.1} />
        </>
      );
  }
}

const CSS = `
html, body { background: #e9e9e9 !important; }
.op-root { padding: 56px 0 30px; color: #000; font-family: Calibri, Carlito, Arial, sans-serif; }
.op-bar { position: fixed; top: 0; left: 0; right: 0; min-height: 46px; background: #1b1b1b; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 6px 16px; z-index: 5; color: #ddd; font: 13px Arial, sans-serif; box-sizing: border-box; }
.op-bar select, .op-bar input { background: #2a2a2a; color: #eee; border: 1px solid #444; border-radius: 6px; padding: 5px 8px; font-size: 13px; }
.op-bar button { background: #2f6fed; color: #fff; border: 0; border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.op-co { position: relative; } .op-co summary { cursor: pointer; padding: 5px 8px; border: 1px solid #444; border-radius: 6px; }
.op-co > div { position: absolute; top: 34px; left: 0; background: #222; border: 1px solid #444; border-radius: 8px; padding: 8px; max-height: 60vh; overflow: auto; width: 320px; display: grid; gap: 4px; }
.op-page { width: 595.3pt; height: 841.9pt; margin: 0 auto 18px; background: #fff; position: relative; overflow: hidden; break-after: page; }
.op-page * { box-sizing: border-box; }
.op-co-name { text-align: center; font-weight: 700; font-size: 14.5px; margin-left: 30px; }
.op-co-addr { text-align: center; font-weight: 700; font-size: 9px; margin: 3px 0 0 30px; }
.op-title { text-align: center; font: bold 12.5px 'Times New Roman', Times, serif; margin: 12px 0 0 30px; white-space: pre; }
.op-dash { height: 3px; margin: 2px -10px 0 0; background: repeating-linear-gradient(90deg, #000 0 20px, transparent 20px 32px); }
.op-meta { display: flex; font-size: 12px; height: 22px; align-items: flex-end; padding-left: 10px; }
.op-meta .serif { font-size: 12.5px; }
.op-row { display: flex; align-items: center; }
.op-head { height: 30px; font-weight: 700; font-size: 10px; border-top: 1px solid #000; border-bottom: 1px solid #000; margin-top: 4px; }
.op-c { overflow: hidden; white-space: nowrap; flex: none; }
.op-bill { height: 18.3px; font-size: 10px; }
.op-group { height: 22px; border-bottom: 1px solid #000; }
.op-party { height: 16px; font-size: 11px; }
.op-add { height: 17px; font-size: 10.5px; border-bottom: 1px dashed #000; }
.op-tot { font-size: 10.5px; }
.op-ptot { height: 20px; border-top: 1.5px solid #000; }
.op-gtot { height: 18px; border-top: 1.5px solid #000; border-bottom: 1px solid #000; }
.op-grand { height: 22px; border-top: 1px solid #000; border-bottom: 2px solid #000; }
.b { font-weight: 700; } .blue { color: #1414e6; } .u { text-decoration: underline; } .nowrap { white-space: nowrap; overflow: hidden; }
.serif { font-family: 'Times New Roman', Times, serif; } .s9 { font-size: 9px; } .s10 { font-size: 10px; } .s11 { font-size: 11px; }
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  .op-bar { display: none; }
  .op-root { padding: 0; }
  .op-page { margin: 0; }
}
`;
