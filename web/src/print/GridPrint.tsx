/**
 * The old Pending Order form's grid prints (DevExpress grid → Print), laid out exactly as the old PDFs:
 *   /print/grid/stock?mode=pending|all|clear|lock&from&to   "Purchase Report - Pending" grouped by Brand
 *   /print/grid/brand?from&to                               "Purchase Report - All" brandwise sold / unsold
 * Letter landscape (792 × 612 pt). Cells, fonts and row heights measured from the old prints.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { YF_API } from '@/dc/api';

type R = Record<string, unknown>;
interface Col { cap: string; x0: number; x1: number; f: string; num?: boolean; center?: boolean; foot?: 'sum' | 'count' }
interface Layout { cols: Col[]; group?: { f: string; cap: string; indent: number }; head: { h: number; s: number }; row: { h: number; s: number } }

const LAYOUT: Record<string, Layout> = {
  stock: {
    group: { f: 'brand', cap: 'Brand', indent: 14.2 },
    head: { h: 18, s: 8.75 },
    row: { h: 17.25, s: 9 },
    cols: [
      { cap: 'Item Name', x0: 14.4, x1: 137.4, f: 'item' },
      { cap: 'Lot Number', x0: 137.4, x1: 221.4, f: 'lot' },
      { cap: 'Grade', x0: 221.4, x1: 258.1, f: 'grade' },
      { cap: 'Pur Qty', x0: 258.1, x1: 332.4, f: 'w', num: true, foot: 'sum' },
      { cap: 'Disp Qty', x0: 332.4, x1: 397.6, f: 'd', num: true, foot: 'sum' },
      { cap: 'Pending Qty', x0: 397.6, x1: 471.9, f: 'p', num: true, foot: 'sum' },
      { cap: 'Status', x0: 471.9, x1: 528.1, f: 'status', center: true }
    ]
  },
  brand: {
    head: { h: 17.25, s: 8 },
    row: { h: 17.25, s: 8.25 },
    cols: [
      { cap: 'Item Name', x0: 14.4, x1: 165.9, f: 'name', foot: 'count' },
      { cap: 'Brand', x0: 165.9, x1: 301.6, f: 'brand' },
      { cap: 'Sale Order Qty', x0: 301.6, x1: 387.1, f: 'so', num: true, foot: 'sum' },
      { cap: 'Stock Qty', x0: 387.1, x1: 464.4, f: 'stock', num: true, foot: 'sum' },
      { cap: 'LockQty', x0: 464.4, x1: 541.6, f: 'lock', num: true, foot: 'sum' },
      { cap: 'Pur Order Qty', x0: 541.6, x1: 622.6, f: 'po', num: true, foot: 'sum' },
      { cap: 'Balance Qty', x0: 622.6, x1: 699.9, f: 'bal', num: true, foot: 'sum' }
    ]
  }
};
const H_GROUP = 13.5, H_GFOOT = 14.2, H_FOOT = 12.8, Y0 = 72, LIMIT = 540;
const BORDER = '#a9a9a9', GROUP_BG = '#add6ff', GFOOT_BG = '#d3d3d3', FOOT_BG = '#a9a9a9';
const STATUS: Record<string, string> = { pending: 'Pending', all: 'All', clear: 'Clear', lock: 'Lock' };

const n2 = (v: unknown) => (Math.round((Number(v) || 0) * 100 + 1e-7) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dmy = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const fyStart = (today: string) => { const [y, m] = today.split('-').map(Number); return `${m >= 4 ? y : y - 1}-04-01`; };

/** glyph-top correction per font and size (browser text box vs the old PDF), measured */
const DY: Record<string, number> = { vb15: 1.07, 'vb8.75': -0.25, vb8: -0.35, 'vb8.25': 0.62, v9: 0.78, 'v8.25': 0.31, 't8.25': 0.34 };
type Font = 'v' | 'vb' | 't';
const FAM: Record<Font, string> = { v: "400 {s}pt Verdana, 'DejaVu Sans', sans-serif", vb: "700 {s}pt Verdana, 'DejaVu Sans', sans-serif", t: "400 {s}pt Tahoma, 'DejaVu Sans', sans-serif" };
function T({ y, x, r, cx, w, f, s, children }: { y: number; x?: number; r?: number; cx?: number; w?: number; f: Font; s: number; children: ReactNode }) {
  const st: CSSProperties = { position: 'absolute', top: y - (DY[f + s] ?? 0) + 'pt', font: FAM[f].replace('{s}', String(s)), lineHeight: s + 'pt', whiteSpace: 'pre', color: '#000' };
  if (r != null) Object.assign(st, { left: r - (w ?? 200) + 'pt', width: (w ?? 200) + 'pt', textAlign: 'right', overflow: 'hidden' });
  else if (cx != null) { const ww = w ?? 760; Object.assign(st, { left: cx - ww / 2 + 'pt', width: ww + 'pt', textAlign: 'center' }); }
  else Object.assign(st, { left: x + 'pt', width: w != null ? w + 'pt' : undefined, overflow: 'hidden' });
  return <div style={st}>{children}</div>;
}
/** a grid cell: 0.75 pt grey border centred on the cell edges, optional fill */
function Cell({ x0, x1, y, h, bg, lines = 'box' }: { x0: number; x1: number; y: number; h: number; bg?: string; lines?: 'box' | 'h' | 'none' }) {
  const b = `0.75pt solid ${BORDER}`;
  const edge = lines === 'box' ? { border: b } : lines === 'h' ? { borderTop: b, borderBottom: b } : {};
  return <div style={{ position: 'absolute', left: x0 - 0.375 + 'pt', top: y - 0.375 + 'pt', width: x1 - x0 + 0.75 + 'pt', height: h + 0.75 + 'pt', background: bg ?? 'transparent', boxSizing: 'border-box', ...edge }} />;
}

type Line = { k: 'group'; v: string } | { k: 'row'; r: R } | { k: 'gfoot'; rows: R[] } | { k: 'foot'; rows: R[] };

export default function GridPrint() {
  const { kind = 'stock' } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const L = LAYOUT[kind] ?? LAYOUT.stock;
  const today = YF_API.today();
  const mode = kind === 'brand' ? 'all' : sp.get('mode') ?? 'pending';
  const from = sp.get('from') ?? (kind === 'brand' ? fyStart(today) : '2000-04-01');
  const to = sp.get('to') ?? today;
  const [rows, setRows] = useState<R[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setRows(null); setErr('');
    const pass: Record<string, string> = {};
    sp.forEach((v, k) => { pass[k] = v; });
    const req = kind === 'brand'
      ? YF_API.get<R[]>('/reports/sold-unsold-brand', pass)
      : YF_API.get<{ rows: R[] }>('/reports/purchase-stock-summary', { ...pass, mode, from: sp.get('from') ?? undefined, to }).then((d) => d.rows);
    req.then(setRows).catch((e) => setErr(YF_API.message(e)));
  }, [kind, sp, mode, to]);

  const title = `Purchase Report - ${STATUS[mode] ?? 'All'} - From Date:${dmy(from)} To Date : ${dmy(to)}`;
  useEffect(() => { document.title = title; }, [title]);

  /** lines → pages: the header repeats on every page, a line goes over when it would pass the bottom */
  const pages = useMemo(() => {
    if (!rows) return [];
    const lines: Line[] = [];
    if (L.group) {
      let cur: string | null = null; let gr: R[] = [];
      for (const r of rows) {
        const g = String(r[L.group.f] ?? '');
        if (g !== cur) { if (cur != null) lines.push({ k: 'gfoot', rows: gr }); lines.push({ k: 'group', v: g }); cur = g; gr = []; }
        lines.push({ k: 'row', r }); gr.push(r);
      }
      if (cur != null) lines.push({ k: 'gfoot', rows: gr });
    } else for (const r of rows) lines.push({ k: 'row', r });
    lines.push({ k: 'foot', rows });
    const hOf = (l: Line) => (l.k === 'group' ? H_GROUP : l.k === 'gfoot' ? H_GFOOT : l.k === 'foot' ? H_FOOT : L.row.h);
    const out: { y: number; l: Line }[][] = [];
    let page: { y: number; l: Line }[] = []; let y = Y0 + L.head.h;
    for (const l of lines) {
      const h = hOf(l);
      if (y + h > LIMIT && page.length) { out.push(page); page = []; y = Y0 + L.head.h; }
      page.push({ y, l }); y += h;
    }
    out.push(page);
    return out;
  }, [rows, L]);

  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n); };
  const last = L.cols[L.cols.length - 1].x1;
  const ind = L.group?.indent ?? 0;
  const foot = (rs: R[], c: Col) => (c.foot === 'sum' ? n2(rs.reduce((s, r) => s + (Number(r[c.f]) || 0), 0)) : c.foot === 'count' ? String(rs.length) : '');

  return (
    <div className="gp-root">
      <style>{CSS}</style>
      <div className="gp-bar">
        <select value={kind} onChange={(e) => nav(`/print/grid/${e.target.value}?${sp.toString()}`)} aria-label="Format">
          <option value="stock">Purchase stock summary (brand wise)</option>
          <option value="brand">Brandwise sold / unsold</option>
        </select>
        {kind !== 'brand' && (
          <select value={mode} onChange={(e) => set('mode', e.target.value)} aria-label="Status">
            {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
        <label>From <input type="date" value={from} onChange={(e) => set('from', e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={(e) => set('to', e.target.value)} /></label>
        <button onClick={() => window.print()} disabled={!rows}>Print / Save as PDF</button>
        <span>{rows ? `${rows.length} rows · ${pages.length} pages` : err ? '' : 'Loading…'}</span>
        {err && <span style={{ color: '#ff8a8a' }}>{err}</span>}
      </div>
      {pages.map((pg, pi) => (
        <div className="gp-page" key={pi}>
          <T y={36.4} cx={384.3} f="vb" s={15}>{title}</T>
          {L.cols.map((c) => <Cell key={c.f} x0={c.x0} x1={c.x1} y={Y0} h={L.head.h} />)}
          {L.cols.map((c) => <T key={'h' + c.f} y={Y0 + 5.5} x={c.x0 + 1.9} w={c.x1 - c.x0 - 2} f="vb" s={L.head.s}>{c.cap}</T>)}
          {pg.map(({ y, l }, i) => {
            if (l.k === 'group') return (
              <div key={i}>
                <Cell x0={L.cols[0].x0} x1={last} y={y} h={H_GROUP} bg={GROUP_BG} lines="none" />
                <T y={y + 3.5} x={L.cols[0].x0 + 1.9} f="vb" s={8.25}>{`${L.group!.cap}: ${l.v}`}</T>
              </div>
            );
            if (l.k === 'row') return (
              <div key={i}>
                <Cell x0={L.cols[0].x0 + ind} x1={last} y={y} h={L.row.h} lines="h" />
                {L.cols.map((c, ci) => c.center
                  ? <T key={'t' + c.f} y={y + 5.25} cx={(c.x0 + c.x1) / 2} f="v" s={L.row.s}>{String(l.r[c.f] ?? '')}</T>
                  : c.num
                  ? <T key={'t' + c.f} y={y + 5.25} r={c.x1 - 0.7} w={c.x1 - c.x0 - 1} f="v" s={L.row.s}>{n2(l.r[c.f])}</T>
                  : <T key={'t' + c.f} y={y + 5.25} x={(ci === 0 ? c.x0 + ind : c.x0) + 1.5} w={c.x1 - (ci === 0 ? c.x0 + ind : c.x0) - 2} f="v" s={L.row.s}>{String(l.r[c.f] ?? '')}</T>)}
              </div>
            );
            const g = l.k === 'gfoot';
            const h = g ? H_GFOOT : H_FOOT;
            return (
              <div key={i}>
                <Cell x0={L.cols[0].x0 + (g ? ind : 0)} x1={last} y={y} h={h} bg={g ? GFOOT_BG : FOOT_BG} lines={g ? 'h' : 'box'} />
                {!g && L.cols.filter((c) => c.foot).map((c) => <Cell key={'b' + c.f} x0={c.x0} x1={c.x1} y={y} h={h} />)}
                {L.cols.filter((c) => c.foot).map((c) => <T key={c.f} y={y + (g ? 3.8 : 3.1)} r={c.x1 - (g ? 0 : 0.4)} w={c.x1 - c.x0} f="t" s={8.25}>{foot(l.rows, c)}</T>)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const CSS = `
html, body { background: #e9e9e9 !important; }
.gp-root { padding: 56px 0 30px; color: #000; }
.gp-bar { position: fixed; top: 0; left: 0; right: 0; min-height: 46px; background: #1b1b1b; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 6px 16px; z-index: 5; color: #ddd; font: 13px Arial, sans-serif; box-sizing: border-box; }
.gp-bar select, .gp-bar input { background: #2a2a2a; color: #eee; border: 1px solid #444; border-radius: 6px; padding: 5px 8px; font-size: 13px; }
.gp-bar button { background: #2f6fed; color: #fff; border: 0; border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.gp-page { width: 792pt; height: 612pt; margin: 0 auto 18px; background: #fff; position: relative; overflow: hidden; break-after: page; }
@page { size: 792pt 612pt; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  .gp-bar { display: none; }
  .gp-root { padding: 0; }
  .gp-page { margin: 0; }
}
`;
