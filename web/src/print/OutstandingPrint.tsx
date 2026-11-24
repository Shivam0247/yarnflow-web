/**
 * "PARTY GROUPWISE SALES OUTSTANDING - UNPAID" exactly as the old software printed it (Crystal), with
 * the same page breaks: /print/outstanding?by=group|collector|broker|salesperson&kind=sale|debit|all&from&to&only=<group>
 * Pages are laid out here (fixed row heights) so "Page x of y" and the header repeat as before.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { YF_API } from '@/dc/api';

interface Bill { id: number; com: string; companyId: number; date: string; number: string; broker: string; item: string; partyId: number; rate: number; qty: number; net: number; received: number; pending: number; crDays: number; days: number; group: string }
interface Party { id: number; name: string; contact: string | null; mobile: string | null; address: string | null; collector: string | null; balance: number }
interface Data { title: string; by: string; kind: string; from: string; to: string; company: { name: string; address: string }; companies: { id: number; short: string; name: string; on: boolean }[]; bills: Bill[]; parties: Record<string, Party> }

const GROUP_LABEL: Record<string, string> = { group: 'Group :', collector: 'Coll. Person :', broker: 'Broker :', salesperson: 'Sales Person :' };
const slash = (d: string) => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${dd}/${m}/${y}`; };
const short = (d: string) => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${dd}/${m}/${y.slice(2)}`; };
const int = (n: number) => String(Math.round(n));
const f2 = (n: number) => n.toFixed(2);
const f3 = (n: number) => n.toFixed(3);

/* page geometry (old print at 110 dpi): rows are fixed height, so pages break where the old ones did */
const PAGE_H = 1300, TOP = 158, BOTTOM = 42;
const H = { bill: 18.3, group: 22, party: 16, add: 17, ptotal: 20, gtotal: 18, grand: 22, gap: 2 };

type Line =
  | { k: 'group'; name: string }
  | { k: 'party'; p: Party }
  | { k: 'add'; p: Party }
  | { k: 'bill'; b: Bill }
  | { k: 'ptotal'; qty: number; net: number; os: number }
  | { k: 'gtotal'; qty: number; net: number; rec: number; os: number }
  | { k: 'grand'; qty: number; net: number; os: number };

function Swastik() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden style={{ display: 'block' }}>
      <rect x="2.5" y="3.5" width="17" height="17" fill="#d8d8d8" />
      <g stroke="#000" strokeWidth="2.4" fill="none" strokeLinecap="square">
        <path d="M10 2v16M2 10h16M10 2h6M18 10v6M10 18H4M2 10V4" />
      </g>
      <g fill="#000"><circle cx="5.5" cy="6" r="1.2" /><circle cx="14.5" cy="6" r="1.2" /><circle cx="5.5" cy="14.5" r="1.2" /><circle cx="14.5" cy="14.5" r="1.2" /></g>
    </svg>
  );
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
    YF_API.get<Data>('/outstanding-print', { by, kind, to, from: from || undefined, companies: companies || undefined })
      .then((d) => { setData(d); document.title = d.title; })
      .catch((e) => setErr(YF_API.message(e)))
      .finally(() => setBusy(false));
  }, [by, kind, to, from, companies]);
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
      lines.push({ k: 'group', name: g });
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
      lines.push({ k: 'gtotal', qty: tq, net: tn, rec: tr, os: to2 });
      gq += tq; gn += tn; go += to2;
    }
    if (lines.length) lines.push({ k: 'grand', qty: gq, net: gn, os: go });
    const out: Line[][] = [[]];
    let y = TOP;
    for (const l of lines) {
      const h = H[l.k];
      if (y + h > PAGE_H - BOTTOM && out[out.length - 1].length) { out.push([]); y = TOP; }
      out[out.length - 1].push(l); y += h;
    }
    return out;
  }, [data, only]);

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
      {data && pages.map((lines, i) => (
        <div className="op-page" key={i}>
          <div className="op-co-name">{data.company.name}</div>
          <div className="op-co-addr">{data.company.address}</div>
          <div className="op-title">{data.title.replace(' - ', ' -  ')}</div>
          <div className="op-dash" />
          <div className="op-meta">
            <span className="serif" style={{ width: 520 }}>{slash(data.from)} TO {slash(data.to)}</span>
            <span style={{ width: 80 }}>{slash(YF_API.today())}</span>
            <span style={{ width: 170 }}>{time}</span>
            <span style={{ flex: 1, textAlign: 'right', paddingRight: 22, whiteSpace: 'nowrap' }}>Page {i + 1} of {pages.length}</span>
          </div>
          <div className="op-row op-head">
            <C w={43} a="c">Company</C><C w={67} a="r" pr={22}>Date</C><C w={78}>Bill No</C><C w={72}>Broker</C><C w={120} pl={12}>Item Name</C>
            <C w={40} a="r">Rate</C><C w={60} a="r">Bill Qnty.</C><C w={115} a="r" pr={22}>Bill Net.</C><C w={110} a="c">Total Rec.</C>
            <C w={65} a="r">Total O/s</C><C w={40} a="c">C.Days</C><C w={30} a="r">Days</C>
          </div>
          {lines.map((l, j) => <LineView key={j} l={l} by={data.by} />)}
        </div>
      ))}
    </div>
  );
}

function C({ w, a, pl, pr, children, className }: { w: number; a?: 'r' | 'c'; pl?: number; pr?: number; children?: ReactNode; className?: string }) {
  return <div className={'op-c ' + (className ?? '')} style={{ width: w, textAlign: a === 'r' ? 'right' : a === 'c' ? 'center' : 'left', paddingLeft: pl, paddingRight: pr }}>{children}</div>;
}

function LineView({ l, by }: { l: Line; by: string }) {
  switch (l.k) {
    case 'group':
      return (
        <div className="op-row op-group">
          <div style={{ width: 30 }}><Swastik /></div>
          <div className="b blue" style={{ width: 118, fontSize: 11, paddingLeft: 8 }}>{GROUP_LABEL[by] ?? 'Group :'}</div>
          <div className="b blue" style={{ flex: 1, fontSize: 12.5 }}>{l.name}</div>
          <div style={{ width: 24 }}><Swastik /></div>
        </div>
      );
    case 'party':
      return (
        <div className="op-row op-party">
          <div className="b" style={{ width: 79, paddingLeft: 20 }}>Party :</div>
          <div className="b nowrap" style={{ width: 316 }}>{l.p.name}</div>
          <div className="b" style={{ width: 42 }}>Name</div>
          <div className="nowrap s10" style={{ width: 113 }}>{l.p.contact ?? ''}</div>
          <div className="b" style={{ width: 30 }}>Mob</div>
          <div className="nowrap s10" style={{ width: 120 }}>{l.p.mobile ?? ''}</div>
          <div className="b" style={{ width: 50, textAlign: 'right', paddingRight: 8 }}>Coll. P :</div>
          <div className="nowrap s10" style={{ flex: 1 }}>{l.p.collector ?? ''}</div>
        </div>
      );
    case 'add': {
      const bal = l.p.balance;
      return (
        <div className="op-row op-add">
          <div className="b u" style={{ width: 79, paddingLeft: 20 }}>Add:</div>
          <div className="nowrap u s9" style={{ width: 518 }}>{l.p.address ?? ''}</div>
          <div className="b u" style={{ width: 120, textAlign: 'center' }}>Ledger Balance</div>
          <div className="s10" style={{ flex: 1, textAlign: 'right', paddingRight: 30 }}>{f2(Math.abs(bal))} {bal < 0 ? 'CR' : 'DB'}</div>
        </div>
      );
    }
    case 'bill': {
      const b = l.b;
      return (
        <div className="op-row op-bill">
          <C w={43} className="serif s11">{b.com}</C><C w={67} a="r" pr={6}>{short(b.date)}</C><C w={78} pl={10}>{b.number}</C>
          <C w={72} pl={6} className="nowrap">{b.broker}</C><C w={120} pl={4} className="nowrap">{b.item}</C>
          <C w={40} a="r">{f2(b.rate)}</C><C w={60} a="r">{f2(b.qty)}</C><C w={115} a="r" pr={22} className="serif s11">{int(b.net)}</C>
          <C w={110} a="c" className="serif s11">{f2(b.received)}</C><C w={65} a="r">{int(b.pending)}</C>
          <C w={40} a="c">{b.crDays}</C><C w={30} a="r">{b.days}</C>
        </div>
      );
    }
    case 'ptotal':
      return (
        <div className="op-row op-tot op-ptot">
          <C w={430} pl={20} className="b s11">Party Total :</C><C w={60} a="r" className="b">{f3(l.qty)}</C>
          <C w={115} a="r" pr={22} className="b">{int(l.net)}</C><C w={110} /><C w={65} a="r" className="b">{int(l.os)}</C>
        </div>
      );
    case 'gtotal':
      return (
        <div className="op-row op-tot op-gtot">
          <C w={430} pl={20} className="b s11">Group Wise Total :</C><C w={60} a="r" className="b">{f3(l.qty)}</C>
          <C w={115} a="r" pr={22} className="b">{int(l.net)}</C><C w={110} a="c" className="b">{int(l.rec)}</C><C w={65} a="r" className="b">{int(l.os)}</C>
        </div>
      );
    case 'grand':
      return (
        <div className="op-row op-tot op-grand">
          <C w={430} pl={20} className="b s11">Grand Total :</C><C w={60} a="r" className="b">{f3(l.qty)}</C>
          <C w={115} a="r" pr={22} className="b">{int(l.net)}</C><C w={110} /><C w={65} a="r" className="b">{int(l.os)}</C>
        </div>
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
.op-page { width: 920px; height: 1300px; margin: 0 auto 18px; background: #fff; box-sizing: border-box; padding: 18px 35px 0 25px; position: relative; overflow: hidden; break-after: page; }
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
  .op-page { zoom: 0.8627; margin: 0; }
}
`;
