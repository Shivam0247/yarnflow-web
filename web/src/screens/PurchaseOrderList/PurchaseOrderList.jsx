/* eslint-disable */
// PurchaseOrderList — converted 1:1 from the YarnFlow design (PurchaseOrderList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './PurchaseOrderList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: null, sel: [], focus: 'PUR0080', bill: null, top: 690, bot: 300, over: {} }; }
  componentDidMount() { try { const h = window.innerHeight; if (h >= 560 && h <= 1600) { const t = h - 60; const top = Math.round(t * 0.7); this.setState({ top, bot: t - top }); } } catch (e) {} }

  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  cf(base, COLS) {
    const st = this.state; const flt = st.flt || {}; const sk = st.sk || null; const sd = st.sd || 1; const pop = st.pop || null; const pq = String(st.pq || '').toLowerCase();
    const val = (r, c) => { const v = c.get ? c.get(r) : r[c.k]; return v == null || v === '' ? '—' : v; };
    const dk = (s) => { const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/); return m ? Number(m[3] + m[2] + m[1]) : 0; };
    const cmp = (c) => (a, b) => { const x = val(a, c), y = val(b, c); const r = c.num ? (Number(x) || 0) - (Number(y) || 0) : c.date ? dk(x) - dk(y) : String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' }); return r * sd; };
    const pass = (r, skip) => COLS.every((c) => c.k === skip || !flt[c.k] || flt[c.k].indexOf(String(val(r, c))) >= 0);
    const list = base.filter((r) => pass(r));
    const sc = sk ? COLS.find((x) => x.k === sk) : null;
    const sorter = sc ? cmp(sc) : null;
    if (sorter) list.sort(sorter);
    const set = (patch) => this.setState(Object.assign({ loaded: 20 }, patch));
    const fmtV = (c, v) => (c.fmt && v !== '—' ? c.fmt(v) : v);
    const heads = COLS.map((c) => {
      const on = !!flt[c.k]; const open = pop === c.k; const sorted = sk === c.k;
      let opts = []; let all = [];
      if (open) {
        const cnt = {}; base.filter((r) => pass(r, c.k)).forEach((r) => { const v = String(val(r, c)); cnt[v] = (cnt[v] || 0) + 1; });
        all = Object.keys(cnt).sort((a, b) => c.num ? (Number(a) || 0) - (Number(b) || 0) : c.date ? dk(a) - dk(b) : a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
        opts = all.filter((v) => !pq || String(fmtV(c, v)).toLowerCase().indexOf(pq) >= 0).map((v) => {
          const ck = !on || flt[c.k].indexOf(v) >= 0;
          return { v: fmtV(c, v), n: cnt[v], ck, tog: () => { let cur = on ? flt[c.k].slice() : all.slice(); const i = cur.indexOf(v); if (i >= 0) cur.splice(i, 1); else cur.push(v); const nf = Object.assign({}, flt); if (cur.length === all.length) delete nf[c.k]; else nf[c.k] = cur; set({ flt: nf }); } };
        });
      }
      const allCk = !on || (all.length > 0 && all.every((v) => flt[c.k].indexOf(v) >= 0));
      return {
        l: c.l, open, thc: 'fh' + (c.r ? ' r' : ''), btn: 'fb' + (on || sorted ? ' on' : '') + (open ? ' op' : ''),
        ic: sorted ? (sd > 0 ? '↑' : '↓') : '',
        toggle: () => this.setState({ pop: open ? null : c.k, pq: '' }), close: () => this.setState({ pop: null, pq: '' }),
        popCls: 'fp' + (c.rt ? ' rt' : ''),
        ascL: c.num ? 'Smallest to largest' : c.date ? 'Oldest to newest' : 'Sort A to Z', descL: c.num ? 'Largest to smallest' : c.date ? 'Newest to oldest' : 'Sort Z to A',
        ascC: sorted && sd > 0 ? 'fpi on' : 'fpi', descC: sorted && sd < 0 ? 'fpi on' : 'fpi',
        asc: () => set({ sk: c.k, sd: 1, pop: null }), desc: () => set({ sk: c.k, sd: -1, pop: null }),
        q: st.pq || '', setQ: (e) => this.setState({ pq: e.target.value }),
        opts, nOpts: String(all.length), noOpts: open && opts.length === 0, allCk,
        selAll: () => { const nf = Object.assign({}, flt); if (allCk) nf[c.k] = []; else delete nf[c.k]; set({ flt: nf }); },
        clear: () => { const nf = Object.assign({}, flt); delete nf[c.k]; set({ flt: nf, pop: null }); }
      };
    });
    const chips = COLS.filter((c) => flt[c.k]).map((c) => { const vs = flt[c.k].map((v) => fmtV(c, v)); return { l: c.l, v: vs.length === 0 ? 'none' : vs.slice(0, 2).join(', ') + (vs.length > 2 ? ' +' + (vs.length - 2) : ''), x: () => { const nf = Object.assign({}, flt); delete nf[c.k]; set({ flt: nf }); } }; });
    if (sc) chips.push({ l: 'Sorted by ' + sc.l, v: sd > 0 ? (sc.num ? 'smallest first' : sc.date ? 'oldest first' : 'A to Z') : (sc.num ? 'largest first' : sc.date ? 'newest first' : 'Z to A'), x: () => set({ sk: null, sd: 1 }) });
    const active = Object.keys(flt).length > 0 || !!sc;
    return { list, sorter, heads, chips, hasChips: chips.length > 0, active, filtered: Object.keys(flt).length > 0, clearAll: () => set({ flt: {}, sk: null, sd: 1, pop: null }) };
  }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const inr = (n, d) => { const s = Number(n).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return rest + l3 + (f ? '.' + f : ''); };
    const pd = (s) => { const [d, m, y] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
    const fd = (t) => { const z = (n) => String(n).padStart(2, '0'); return z(t.getUTCDate()) + '-' + z(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear(); };
    const addD = (t, n) => new Date(t.getTime() + n * 864e5);
    const TODAY = pd('23-10-2026');
    const hsh = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 99991, 7);
    const gstOf = (s) => { const h = hsh(s); return '24AA' + 'BCDFGHJKLM'[h % 10] + 'FS' + String(1000 + h % 9000) + 'K1Z' + (h % 9 + 1); };
    const TR = [['Navkar Roadlines', 'NR'], ['Jay Ambe Roadlines', 'JAR'], ['Shree Maruti Cargo', 'SMC'], ['VRL Logistics', 'VRL']];
    const ewbF = (n) => String(n).replace(/(\d{4})(?=\d)/g, '$1 ');
    const mkBills = (r, q, pre, step, lag) => {
      const out = []; if (q <= 0) return out;
      const chunk = r.oq <= 12000 ? 1000 : Math.ceil(r.oq / 10 / 500) * 500;
      const n = Math.ceil(q / chunk - 1e-9); const seq = parseInt(r.no.slice(3), 10); const od = pd(r.dt);
      let left = q;
      for (let i = 0; i < n; i++) {
        const kg = Math.round(Math.min(chunk, left) * 1000) / 1000; left = Math.round((left - kg) * 1000) / 1000;
        const dt = addD(od, lag + i * step); const due = addD(dt, r.cr || 1);
        const tx = kg * r.rate; const g = tx * 0.025; const tot = Math.round(tx + 2 * g); const ro = tot - (tx + 2 * g);
        const age = Math.round((TODAY - due) / 864e5); const paid = age > 20 && i < n - 2;
        const t = TR[(seq + i) % 4];
        out.push({ key: r.no + '#' + i, i, inv: pre + (seq % 5000 + 2000 + i * 37), dt: fd(dt), due: fd(due), bx: Math.max(1, Math.round(kg / 62)), kgN: kg, txN: tx, totN: tot, paid,
          kg: inr(kg, 3), rate: inr(r.rate, 2), tx: '₹ ' + inr(tx, 2), cg: '₹ ' + inr(g, 2), gst: '₹ ' + inr(2 * g, 2), amt: '₹ ' + inr(tot, 2), ro: (ro >= 0 ? '+ ' : '− ') + inr(Math.abs(ro), 2),
          pay: paid ? 'Paid' : age > 0 ? 'Overdue ' + age + ' days' : 'Due ' + fd(due), pc: paid ? 'tag t-green' : age > 0 ? 'tag t-red' : 'tag t-gray',
          recv: paid ? '₹ ' + inr(tot, 2) : '₹ 0.00', bal: paid ? '₹ 0.00' : '₹ ' + inr(tot, 2),
          tr: t[0], lr: t[1] + '-' + (41000 + seq % 900 + i * 13), veh: 'GJ-05-' + ['BX', 'AV', 'CT', 'UU'][i % 4] + '-' + (4100 + (seq * 7 + i * 53) % 5800),
          ewb: ewbF(481000000000 + seq * 1000 + i * 17), mill: 'MI/' + (seq % 900 + 100) + '/' + (i + 1) });
      }
      return out;
    };
    const SC = { Pending: '#3B82F6', Hold: '#F97316', Clear: '#22C55E', Cancelled: '#EF4444' };
    const D = [
      ['PUR2210', '23-10-2026', 45, 'Garden Silk Mills', 'Direct', '75/36 FDY +1 item', 'Garden', 'FD002I4', 'A1', 119, 8400, 0, '—', 'Hold', 'Above ₹ 10 L'],
      ['PUR0123', '23-10-2026', 60, 'Reliance Industries', 'Direct', 'PFY 75/36 SD +1 item', 'Reliance', 'L-2231', 'AA', 131.5, 10800, 0, '—', 'Hold', 'Above ₹ 10 L'],
      ['PUR2208', '22-10-2026', 30, 'Shree Ram Yarn Trading', 'Henil', '50/36 Bright Catonic', 'AYM Syntex', 'FG7C14', '1ST', 158, 3000, 0, '—', 'Hold', 'Rate up ₹ 2.28'],
      ['PUR2923', '13-12-2025', 1, 'Daya Tex Industries', 'Direct', '75/72 Roto Lim', 'Daya', '014850', '1ST', 105, 11000, 8113.77, '—', 'Pending'],
      ['PUR0080', '08-04-2026', 1, 'Reliance Industries', 'Direct', '75/72 FDY', 'Reliance', '336C1M', 'A+', 122.5, 31000, 28332.69, '28136714', 'Pending'],
      ['PUR0473', '16-05-2026', 1, 'Reliance Industries', 'Direct', '75/36 FDY', 'Reliance', '316C1S', 'A+', 120.5, 25000, 23650.755, '28147520', 'Pending'],
      ['PUR0570', '28-05-2026', 1, 'Shree Ram Yarn Trading', 'Direct', '50/36 Bright Catonic', 'AYM Syntex', 'FG7C13', '1ST', 155.72, 10000, 4999.2, '—', 'Pending'],
      ['PUR0573', '29-05-2026', 0, 'Radiant Polyester', 'Direct', '80/48 BSY', 'Radiant', 'R80/48', '1ST', 155, 31000, 21326.55, '—', 'Pending'],
      ['PUR0576', '29-05-2026', 1, 'BRB Industries', 'Direct', '20/1 SD Mono Yarn', 'Durga', 'B123', 'F1', 171.39, 2404, 508.27, '—', 'Pending'],
      ['PUR0602', '02-06-2026', 1, 'Sanathan Textiles', 'Direct', '1/150/48 BRT Raw White', 'Sanathan', '323F159', '—', 144, 7000, 1208.73, '4000109467', 'Pending'],
      ['PUR0639', '08-06-2026', 1, 'GTX Private Limited', 'Direct', '150 Limaya', 'GTPL', 'LMY222', '1ST', 149, 5000, 3948.162, '—', 'Pending'],
      ['PUR0640', '08-06-2026', 1, 'GTX Private Limited', 'Direct', '180SD Creo Tex', 'GTPL', 'AG5000', '1ST', 170, 5000, 3695.704, '—', 'Pending'],
      ['PUR0724', '13-06-2026', 1, 'Garden Silk Mills', 'Direct', '67/72 FDY', 'Garden', 'FD002I4', '1ST', 119, 850, 0, '—', 'Hold', 'New PO'],
      ['PUR0747', '17-06-2026', 1, 'Radiant Polyester', 'Direct', '80/48 BSY', 'Radiant', 'R80/48', '1ST', 170, 2500, 1499.62, '—', 'Pending'],
      ['PUR2207', '18-06-2026', 1, 'Shree Durga Syntex', 'Direct', '50/12 BRT', 'Durga', 'SIBS1008', '1ST', 178, 10196, 0, '—', 'Pending'],
      ['PUR0782', '22-06-2026', 1, 'Reliance Industries', 'Direct', '75/36 FDY', 'Reliance', '316C1S', 'A+', 125.5, 25000, 25000, '28152391', 'Clear'],
      ['PUR0796', '23-06-2026', 1, 'J.J. Industries', 'Henil', 'Muskan Gold', 'J.J. Industries', 'MG123', '1ST', 550, 2000, 1771.99, '—', 'Pending']
    ].map((r) => ({ no: r[0], dt: r[1], cr: r[2], p: r[3], ag: r[4], it: r[5], br: r[6], lot: r[7], gr: r[8], rate: r[9], oq: r[10], rq: r[11], ref: r[12], st: this.state.over[r[0]] || r[13], why: r[14] || '' }));
    const splitIt = (s) => { const m = String(s).match(/(\d+(?:\/\d+){1,2}|\b\d{2,3}\b)/); if (!m) return { den: '\u2014', itn: s }; const rest = String(s).replace(m[1], '').replace(/\s+/g, ' ').trim(); return { den: m[1], itn: rest || s }; };
    D.forEach((r) => { const z = splitIt(r.it); r.den = z.den; r.itn = z.itn; });
    const tabDefs = [['Pending', 'Pending receipt', 139], ['Hold', 'On hold · approval', 9], ['Clear', 'Clear', 842], ['Cancelled', 'Cancelled', 9], ['All', 'All', 999]];
    const tab = this.state.tab ?? this.props.startTab ?? 'Pending';
    const vis0 = D.filter((r) => tab === 'All' || r.st === tab);
    const COLS = [{ k: 'no', l: 'Order no.' }, { k: 'dt', l: 'Date', date: 1 }, { k: 'p', l: 'Mill / party' }, { k: 'itn', l: 'Item' }, { k: 'den', l: 'Denier' }, { k: 'br', l: 'Brand' }, { k: 'lot', l: 'Lot no.' }, { k: 'gr', l: 'Grade' }, { k: 'rate', l: 'Rate', num: 1, r: 1, fmt: (v) => inr(v, 2) }, { k: 'oq', l: 'Ordered kg', num: 1, r: 1, fmt: (v) => inr(v, 3) }, { k: 'rq', l: 'Received', num: 1, r: 1, fmt: (v) => inr(v, 3) }, { k: 'pq', l: 'Pending kg', num: 1, r: 1, rt: 1, get: (r) => Math.max(r.oq - r.rq, 0), fmt: (v) => inr(v, 3) }, { k: 'ref', l: 'Mill ref.', rt: 1 }, { k: 'stL', l: 'Status', rt: 1, get: (r) => ({ Pending: 'Pending receipt', Hold: 'On hold', Clear: 'Clear', Cancelled: 'Cancelled' })[r.st] || r.st }];
    const cf = this.cf(vis0, COLS); const vis = cf.list;
    const tabTotal0 = (tabDefs.find((t) => t[0] === tab) || [0, 0, 0])[2];
    const tabTotal = cf.filtered ? vis.length : tabTotal0;
    const loaded = this.state.loaded ?? 20;
    const shown = [];
    while (vis.length && shown.length < Math.min(loaded, tabTotal)) { const r = vis[shown.length % vis.length]; const kk = Math.floor(shown.length / vis.length); const len = r.no.length - 3;
      let num = parseInt(r.no.slice(3), 10) - kk * 1009; let no = r.no; if (kk > 0) { do { num = num > 50 ? num - 3 : num + 9973; no = r.no.slice(0, 3) + String(num).padStart(len, '0'); } while (D.some((x) => x.no === no) || shown.some((x) => x.no === no)); }
      shown.push(kk === 0 ? r : { ...r, no }); }
    if (cf.sorter) shown.sort(cf.sorter);
    const SA = !!this.state.selAll; const EX = this.state.excl || [];
    const isSel = (no) => SA ? EX.indexOf(no) < 0 : this.state.sel.indexOf(no) >= 0;
    const sel = SA ? vis.map((r) => r.no).filter((n) => EX.indexOf(n) < 0) : this.state.sel;
    const setOver = (nos, s) => { const o = { ...this.state.over }; nos.forEach((n) => { o[n] = s; }); this.setState({ over: o, sel: [], selAll: false, excl: [] }); };
    const rows = shown.map((r) => {
      const pq = Math.max(r.oq - r.rq, 0); const pct = r.oq ? Math.round(r.rq / r.oq * 100) : 0; const on = isSel(r.no); const ask = r.st === 'Hold'; const exp = r.no === this.state.focus; const nb = mkBills(r, r.rq, 'GRN-', 6, 8).length;
      return { ...r, rate: inr(r.rate, 2), oq: inr(r.oq, 3), rq: inr(r.rq, 3), pq: inr(pq, 3), bw: 'width: ' + pct + '%', sc: '--c: ' + (SC[r.st] || '#8F8F8F'), on, ask, show: !ask,
        rc: on || r.no === this.state.focus ? 'sel' : '',
        tog: () => SA ? this.setState({ excl: on ? EX.concat([r.no]) : EX.filter((x) => x !== r.no) }) : this.setState({ sel: on ? sel.filter((s) => s !== r.no) : sel.concat([r.no]) }),
        exp, bn: nb ? nb + (nb > 1 ? ' bills' : ' bill') : 'No bills', cc: exp ? 'cnt on' : 'cnt', chev: '',
        focus: () => this.setState({ focus: r.no, bill: null }), rowClick: (e) => { if (e && e.target && e.target.closest && e.target.closest('input,button,a,label,select')) return; this.setState({ focus: r.no, bill: null }); }, open: (e) => { if (e && e.target && e.target.closest && e.target.closest('input,button,a,label,select')) return; try { window.localStorage.setItem('yf-view-po', JSON.stringify({ t: Date.now(), no: r.no, dt: r.dt, p: r.p, g: r.g || r.ag || '', it: r.it, br: r.br, lot: r.lot, gr: r.gr, rate: r.rate, oq: r.oq, dq: (r.dq ?? r.rq ?? 0), bk: r.bk || r.ref || '', stL: ({ Pending: 'Pending receipt', Hold: 'On hold', Clear: 'Clear', Cancelled: 'Cancelled' })[r.st] || r.st })); } catch (err) {} try { window.localStorage.setItem('yf-back', JSON.stringify({ href: 'PurchaseOrderList' + sfx + '.dc.html', label: 'Purchase order register' })); } catch (err) {} this.go('PurchaseOrderView' + sfx + '.dc.html'); }, ok: () => setOver([r.no], 'Pending'), no2: () => setOver([r.no], 'Cancelled') };
    });
    const sum = (arr, k) => arr.reduce((a, r) => a + r[k], 0);
    const tot = { oq: inr(sum(vis, 'oq'), 3), rq: inr(sum(vis, 'rq'), 3), pq: inr(sum(vis, 'oq') - sum(vis, 'rq'), 3) };
    const STK = {'75/36 FDY +1 item': 14200, 'PFY 75/36 SD +1 item': 5200, '50/36 Bright Catonic': 1800, '75/72 Roto Lim': 3800, '75/72 FDY': 9100, '75/36 FDY': 2550, '80/48 BSY': 2100, '20/1 SD Mono Yarn': 260, '1/150/48 BRT Raw White': 980, '150 Limaya': 640, '180SD Creo Tex': 410, '67/72 FDY': 850, '50/12 BRT': 3100, 'Muskan Gold': 410};
    const byIt = {}; vis.forEach((r) => { byIt[r.it] = (byIt[r.it] || 0) + Math.max(r.oq - r.rq, 0); });
    let stk = 0, short = 0; Object.keys(byIt).forEach((k) => { const st = STK[k] ?? 0; stk += st; short += Math.max(0, byIt[k] - st); });
    const pv = vis.reduce((a, r) => a + Math.max(r.oq - r.rq, 0) * r.rate, 0); const oqS = sum(vis, 'oq'); const pqS = Math.max(oqS - sum(vis, 'rq'), 0);
    const F = vis.length ? tabTotal / vis.length : 0; const stkA = stk * Math.min(F, 6); const pqA = pqS * F;
    const sm = { n: inr(tabTotal, 0), oq: inr(oqS * F, 3), dq: inr(sum(vis, 'rq') * F, 3), pq: inr(pqA, 3), pv: inr(pv * F, 0), stk: inr(stkA, 3), short: inr(Math.max(0, pqA - stkA), 3), after: inr(stkA + pqA, 3), avg: oqS ? inr(vis.reduce((a, r) => a + r.oq * r.rate, 0) / oqS, 2) : '0.00' };
    const fr = shown.concat(D).find((r) => r.no === this.state.focus);
    let f = { no: '', p: '', it: '', lot: '', ds: [], none: false, some: false, pq: '' };
    if (fr) {
      const GD = ['Sachin GIDC', 'Pandesara', 'Kadodara'];
      const bs = mkBills(fr, fr.rq, 'GRN-', 6, 8).map((b) => ({ ...b, inv: 'GRN-0' + (b.i * 29 + parseInt(fr.no.slice(3), 10) % 400 + 100) + ' · PB-0' + (b.i * 29 + parseInt(fr.no.slice(3), 10) % 400 + 120), gd: GD[b.i % 3] }));
      const ds = bs.map((b) => { const open = this.state.bill === b.key; return { ...b, open, rc: open ? 'on' : '', act: open ? 'Hide' : 'View', pick: () => this.setState({ bill: open ? null : b.key }) }; });
      const val = bs.reduce((a, b) => a + b.totN, 0); const pd2 = bs.filter((b) => b.paid).reduce((a, b) => a + b.totN, 0); const tx = bs.reduce((a, b) => a + b.txN, 0);
      f = { no: fr.no, odt: fr.dt, p: fr.p, it: fr.it, lot: fr.lot, gr: fr.gr, br: fr.br, ag: fr.ag, ref: fr.ref, gstin: gstOf(fr.p), ds, none: ds.length === 0, some: ds.length > 0, n: ds.length,
        oq: inr(fr.oq, 3), rq: inr(fr.rq, 3), pq: inr(Math.max(fr.oq - fr.rq, 0), 3), val: '₹ ' + inr(val, 2), tx: '₹ ' + inr(tx, 2), gst: '₹ ' + inr(val - tx, 2), recv: '₹ ' + inr(pd2, 2), bal: '₹ ' + inr(val - pd2, 2) };
    }
    const bulk = {};
    ['Pending', 'Hold', 'Clear', 'Cancelled'].forEach((s) => { bulk[s] = () => setOver(sel, s); });
    const selRows = shown.filter((r) => sel.indexOf(r.no) >= 0);
    const allOn = SA ? EX.length === 0 : (shown.length > 0 && shown.every((r) => sel.indexOf(r.no) >= 0));
    const td = tabDefs.find((t) => t[0] === tab);
    return {
      moreLeft: shown.length < tabTotal, allLoaded: tabTotal > 0 && shown.length >= tabTotal, loadedLabel: shown.length + ' of ' + inr(tabTotal, 0) + ' loaded',
      onScroll: (e) => { const el = e.currentTarget || e.target; if (!el || this._ld || shown.length >= tabTotal) return; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 140) { this._ld = true; setTimeout(() => { this._ld = false; this.setState({ loaded: (this.state.loaded ?? 20) + 20 }); }, 400); } },
      cf, sm, theme, rows, tot, f, bulk, allOn,
      tabs: tabDefs.map(([k, l, n]) => ({ l, n: inr(n, 0), c: '--c: ' + (SC[k] || '#8F8F8F'), cls: k === tab ? 'tab on' : 'tab', pick: () => this.setState({ tab: k, sel: [], selAll: false, excl: [], loaded: 20 }) })),
      sideKey: 'po',
      isAppr: tab === 'Hold', lastCol: tab === 'Hold' ? 'Approve / reject' : 'Status',
      hasSel: SA ? tabTotal - EX.length > 0 : sel.length > 0, selCount: SA ? inr(tabTotal - EX.length, 0) + ' (all)' : sel.length, selQty: SA ? inr(pqA, 3) : inr(selRows.reduce((a, r) => a + Math.max(r.oq - r.rq, 0), 0), 3),
      clearSel: () => this.setState({ sel: [], selAll: false, excl: [] }), toggleAll: () => this.setState(allOn || SA ? { selAll: false, excl: [], sel: [] } : { selAll: true, excl: [], sel: [] }),
      showBills: tab !== 'Hold',
      topH: 'height: ' + (tab === 'Hold' ? this.state.top + this.state.bot + 10 : this.state.top) + 'px', botH: 'height: ' + this.state.bot + 'px',
      sz: (() => { const r = this.state.bot / (this.state.top + this.state.bot); return { s: r < 0.2 ? 'on' : '', m: r >= 0.2 && r <= 0.45 ? 'on' : '', l: r > 0.45 ? 'on' : '' }; })(),
      setS: () => { const t = this.state.top + this.state.bot; this.setState({ top: t - 150, bot: 150 }); },
      setM: () => { const t = this.state.top + this.state.bot; const top = Math.round(t * 0.7); this.setState({ top, bot: t - top }); },
      setL: () => { const t = this.state.top + this.state.bot; const top = Math.round(t * 0.3); this.setState({ top, bot: t - top }); },
      startDrag: (e) => { if (e && e.preventDefault) e.preventDefault(); const y0 = e.clientY; const t0 = this.state.top; const tot = this.state.top + this.state.bot;
        const mv = (ev) => { const top = Math.round(Math.max(120, Math.min(tot - 100, t0 + (ev.clientY - y0)))); this.setState({ top, bot: tot - top }); };
        const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); },
      hasFocus: !!fr && tab !== 'Hold',
      unfocus: () => this.setState({ focus: null }),
      countLabel: vis.length + ' of ' + (td ? td[2] : 0) + ' orders',
      markBack: () => { try { window.localStorage.setItem('yf-back', JSON.stringify({ href: 'PurchaseOrderList' + sfx + '.dc.html', label: 'Purchase order register' })); } catch (err) {} },
      openFocus: () => { try { window.localStorage.setItem('yf-back', JSON.stringify({ href: 'PurchaseOrderList' + sfx + '.dc.html', label: 'Purchase order register' })); } catch (err) {} if (fr) { try { window.localStorage.setItem('yf-view-po', JSON.stringify({ t: Date.now(), no: fr.no, dt: fr.dt, p: fr.p, g: fr.g || fr.ag || '', it: fr.it, br: fr.br, lot: fr.lot, gr: fr.gr, rate: fr.rate, oq: fr.oq, dq: (fr.dq ?? fr.rq ?? 0), stL: ({ Pending: 'Pending receipt', Hold: 'On hold', Clear: 'Clear', Cancelled: 'Cancelled' })[fr.st] || fr.st })); } catch (err) {} } },
      newHref: 'PurchaseOrderEntry' + sfx + '.dc.html', billHref: 'PurchaseBill' + sfx + '.dc.html', recHref: 'PurchaseOrderView' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class PurchaseOrderListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active={v.sideKey} />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Purchase Orders
              </span>
              <span className="m">
                /
              </span>
              <span>
                Register
              </span>
            </div>
            <button className="btn" type="button">
              Mill-wise pending
            </button>
            {' '}
            <button className="btn" type="button">
              Stock check
            </button>
            {' '}
            <button className="btn" type="button">
              Excel
            </button>
            {' '}
            <DcLink className="btn pr" href={v.newHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New order
            </DcLink>
          </header>
          <div className="split">
            <div className="scr" style={sx(v.topH)}>
              <div className="tabs" role="tablist" aria-label="Status">
                {(v.tabs || []).map((t, $index) => (
                  <Fragment key={$index}>
                    <button className={t?.cls} type="button" role="tab" onClick={t?.pick}>
                      <span className="dot" style={sx(t?.c)}>
                        {t?.l}
                      </span>
                      <span className="n">
                        {t?.n}
                      </span>
                    </button>
                  </Fragment>
                ))}
              </div>
              <div className="fbar">
                <input className="inp" type="text" defaultValue="01-04-2026" aria-label="From date" style={{"maxWidth":"120px"}} />
                <span className="muted">
                  to
                </span>
                <input className="inp" type="text" defaultValue="31-03-2027" aria-label="To date" style={{"maxWidth":"120px"}} />
                <div style={{"flex":"1"}} />
              </div>
              {v.hasSel ? (
                <>
                  <div className="bulk" role="toolbar" aria-label="Bulk actions">
                    <b style={{"fontWeight":"600"}}>
                      {v.selCount}{" selected"}
                    </b>
                    <span className="muted" style={{"flex":"1"}}>
                      {v.selQty}{" kg pending"}
                    </span>
                    {' '}
                    {v.isAppr ? (
                      <>
                        <button className="btn sm ok" type="button" onClick={v.bulk?.Pending}>
                          Approve → Pending
                        </button>
                      </>
                    ) : null}
                    {' '}
                    <button className="btn sm" type="button" onClick={v.bulk?.Hold}>
                      Hold
                    </button>
                    {' '}
                    <button className="btn sm" type="button" onClick={v.bulk?.Clear}>
                      Close
                    </button>
                    {' '}
                    <button className="btn sm" type="button" onClick={v.bulk?.Pending}>
                      Reopen
                    </button>
                    {' '}
                    <button className="btn sm no" type="button" onClick={v.bulk?.Cancelled}>
                      Cancel
                    </button>
                    {' '}
                    <button className="btn sm gh" type="button" onClick={v.clearSel}>
                      Clear
                    </button>
                  </div>
                </>
              ) : null}
              {' '}
              {v.cf?.hasChips ? (
                <>
                  <div className="fchips" role="status">
                    <span className="lbl">
                      Showing
                    </span>
                    {(v.cf?.chips || []).map((c, $index) => (
                      <Fragment key={$index}>
                        <span className="fchip">
                          {c?.l}{": "}
                          <b>
                            {c?.v}
                          </b>
                          <button type="button" onClick={c?.x} aria-label="Remove filter">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </span>
                      </Fragment>
                    ))}
                    <button className="fclr" type="button" onClick={v.cf?.clearAll}>
                      Clear all
                    </button>
                  </div>
                </>
              ) : null}
              <div className="tw" onScroll={v.onScroll}>
                <table className="cft">
                  <thead>
                    <tr>
                      <th style={{"width":"36px"}}>
                        <input className="cb" type="checkbox" aria-label="Select all" checked={v.allOn} onChange={v.toggleAll} />
                      </th>
                      {(v.cf?.heads || []).map((h, $index) => (
                        <Fragment key={$index}>
                          <th className={h?.thc}>
                            <button className={h?.btn} type="button" onClick={h?.toggle} aria-haspopup="dialog" aria-expanded={h?.open} title="Sort and filter">
                              {h?.l}
                              <span className="si">
                                {h?.ic}
                              </span>
                              <svg className="fi" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 5h18l-7 8v6l-4 2v-8z" />
                              </svg>
                            </button>
                            {h?.open ? (
                              <>
                                <div className="fpbk" onClick={h?.close} />
                                <div className={h?.popCls} role="dialog" aria-label="Sort and filter">
                                  <button className={h?.ascC} type="button" onClick={h?.asc}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M12 19V5" />
                                      <path d="m5 12 7-7 7 7" />
                                    </svg>
                                    {h?.ascL}
                                  </button>
                                  <button className={h?.descC} type="button" onClick={h?.desc}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M12 5v14" />
                                      <path d="m19 12-7 7-7-7" />
                                    </svg>
                                    {h?.descL}
                                  </button>
                                  <div className="fpsep" />
                                  <div className="fpt">
                                    {"Filter "}{h?.l}
                                  </div>
                                  <input className="fps" type="search" value={h?.q} onChange={h?.setQ} placeholder="Search values" aria-label="Search values" autoFocus={true} />
                                  <label className="fpo all">
                                    <input type="checkbox" checked={h?.allCk} onChange={h?.selAll} />
                                    <span className="v">
                                      Select all
                                    </span>
                                    <span className="n">
                                      {h?.nOpts}
                                    </span>
                                  </label>
                                  <div className="fpl">
                                    {(h?.opts || []).map((o, $index) => (
                                      <Fragment key={$index}>
                                        <label className="fpo">
                                          <input type="checkbox" checked={o?.ck} onChange={o?.tog} />
                                          <span className="v">
                                            {o?.v}
                                          </span>
                                          <span className="n">
                                            {o?.n}
                                          </span>
                                        </label>
                                      </Fragment>
                                    ))}
                                    {h?.noOpts ? (
                                      <>
                                        <div className="fpe">
                                          No matching values
                                        </div>
                                      </>
                                    ) : null}
                                  </div>
                                  <div className="fpf">
                                    <button className="btn sm gh" type="button" onClick={h?.clear}>
                                      Clear filter
                                    </button>
                                    <button className="btn sm pr" type="button" onClick={h?.close}>
                                      Done
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </th>
                        </Fragment>
                      ))}
                      {v.showBills ? (
                        <>
                          <th className="r">
                            Bills
                          </th>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {(v.rows || []).map((x, $index) => (
                      <Fragment key={$index}>
                        <tr className={x?.rc} onClick={x?.rowClick} onDoubleClick={x?.open} title="Click to select · double-click to open">
                          <td>
                            <input className="cb" type="checkbox" aria-label="Select order" checked={x?.on} onChange={x?.tog} />
                          </td>
                          <td>
                            <button className="link" type="button" onClick={x?.focus}>
                              {x?.no}
                            </button>
                          </td>
                          <td className="t2">
                            {x?.dt}
                          </td>
                          <td>
                            <div>
                              {x?.p}
                            </div>
                            <div className="sub">
                              {"Agent · "}{x?.ag}
                            </div>
                          </td>
                          <td className="it">
                            {x?.itn}
                          </td>
                          <td className="den">
                            {x?.den}
                          </td>
                          <td className="t2">
                            {x?.br}
                          </td>
                          <td className="t2">
                            {x?.lot}
                          </td>
                          <td>
                            {x?.gr}
                          </td>
                          <td className="r">
                            {x?.rate}
                          </td>
                          <td className="r">
                            {x?.oq}
                          </td>
                          <td className="r t2">
                            {x?.rq}
                          </td>
                          <td className="r" style={{"fontWeight":"500"}}>
                            {x?.pq}
                            <span className="bar" aria-hidden="true">
                              <i style={sx(x?.bw)} />
                            </span>
                          </td>
                          <td className="t2">
                            {x?.ref}
                          </td>
                          <td>
                            {x?.ask ? (
                              <>
                                <span style={{"display":"inline-flex","alignItems":"center","gap":"6px"}}>
                                  <span className="tag t-orange">
                                    On hold
                                  </span>
                                  <button className="ib ok" type="button" aria-label="Approve" onClick={x?.ok} title="Approve → Pending receipt">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                  </button>
                                  <button className="ib no" type="button" aria-label="Reject" onClick={x?.no2}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                                      <path d="M18 6 6 18" />
                                      <path d="m6 6 12 12" />
                                    </svg>
                                  </button>
                                </span>
                              </>
                            ) : null}
                            {x?.show ? (
                              <>
                                <span className="dot" style={sx(x?.sc)}>
                                  {x?.st}
                                </span>
                              </>
                            ) : null}
                          </td>
                          {v.showBills ? (
                            <>
                              <td className="r">
                                <button className={x?.cc} type="button" onClick={x?.focus} aria-label="Show bills of this order">
                                  {x?.bn}{" "}{x?.chev}
                                </button>
                              </td>
                            </>
                          ) : null}
                        </tr>
                      </Fragment>
                    ))}
                    {v.moreLeft ? (
                      <>
                        <tr className="more">
                          <td colSpan="16">
                            <span className="spin" aria-hidden="true" />
                            {"Loading more orders as you scroll · "}{v.loadedLabel}
                          </td>
                        </tr>
                      </>
                    ) : null}
                    {v.allLoaded ? (
                      <>
                        <tr className="more">
                          <td colSpan="16">
                            {"All "}{v.sm?.n}{" orders shown"}
                          </td>
                        </tr>
                      </>
                    ) : null}
                    <tr className="fillr" aria-hidden="true">
                      <td colSpan="16" />
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td />
                      <td>
                        {v.sm?.n}{" orders"}
                      </td>
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                      <td className="r">
                        {v.sm?.avg}
                      </td>
                      <td className="r">
                        {v.sm?.oq}
                      </td>
                      <td className="r">
                        {v.sm?.dq}
                      </td>
                      <td className="r">
                        {v.sm?.pq}
                      </td>
                      <td />
                      <td />
                      {v.showBills ? (
                        <>
                          <td />
                        </>
                      ) : null}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            {v.hasFocus ? (
              <>
                <section className="dock" style={sx(v.botH)} aria-label="Bills of selected order">
                  <div className="grip" onPointerDown={v.startDrag} role="separator" aria-orientation="horizontal" aria-label="Drag to resize bills panel" title="Drag to make bigger or smaller">
                    <span />
                  </div>
                  <div className="xh">
                    <b>
                      {"Purchase bills against order "}{v.f?.no}
                    </b>
                    <span className="muted">
                      {v.f?.p}{" · "}{v.f?.it}{" · Lot "}{v.f?.lot}
                    </span>
                    <div style={{"flex":"1"}} />
                    <DcLink className="btn sm" href={v.billHref} onClick={v.markBack}>
                      Receive goods / bill
                    </DcLink>
                    <DcLink className="btn sm" href={v.recHref} onClick={v.openFocus}>
                      Open order
                    </DcLink>
                  </div>
                  <div className="dbody">
                    <div className="xs">
                      <div>
                        <span className="k">
                          Ordered
                        </span>
                        <b>
                          {v.f?.oq}{" kg"}
                        </b>
                      </div>
                      <div>
                        <span className="k">
                          {"Received · "}{v.f?.n}{" bills"}
                        </span>
                        <b>
                          {v.f?.rq}{" kg"}
                        </b>
                      </div>
                      <div>
                        <span className="k">
                          Pending
                        </span>
                        <b>
                          {v.f?.pq}{" kg"}
                        </b>
                      </div>
                      <div>
                        <span className="k">
                          Billed value
                        </span>
                        <b>
                          {v.f?.val}
                        </b>
                      </div>
                      <div>
                        <span className="k">
                          Paid to mill
                        </span>
                        <b>
                          {v.f?.recv}
                        </b>
                      </div>
                      <div>
                        <span className="k">
                          Balance payable
                        </span>
                        <b>
                          {v.f?.bal}
                        </b>
                      </div>
                    </div>
                    <div style={{"overflowX":"auto"}}>
                      <table className="bt">
                        <thead>
                          <tr>
                            <th>
                              GRN · bill no.
                            </th>
                            <th>
                              Mill invoice
                            </th>
                            <th>
                              Date
                            </th>
                            <th className="r">
                              Boxes
                            </th>
                            <th className="r">
                              Net kg
                            </th>
                            <th className="r">
                              Taxable
                            </th>
                            <th className="r">
                              GST 5%
                            </th>
                            <th className="r">
                              Bill amount
                            </th>
                            <th>
                              Godown
                            </th>
                            <th>
                              Payment
                            </th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {(v.f?.ds || []).map((d, $index) => (
                            <Fragment key={$index}>
                              <tr className={d?.rc}>
                                <td>
                                  <button className="link" type="button" onClick={d?.pick}>
                                    {d?.inv}
                                  </button>
                                </td>
                                <td className="t2">
                                  {d?.mill}
                                </td>
                                <td className="t2">
                                  {d?.dt}
                                </td>
                                <td className="r">
                                  {d?.bx}
                                </td>
                                <td className="r">
                                  {d?.kg}
                                </td>
                                <td className="r">
                                  {d?.tx}
                                </td>
                                <td className="r t2">
                                  {d?.gst}
                                </td>
                                <td className="r" style={{"fontWeight":"500"}}>
                                  {d?.amt}
                                </td>
                                <td className="t2">
                                  {d?.gd}
                                </td>
                                <td>
                                  <span className={d?.pc}>
                                    {d?.pay}
                                  </span>
                                </td>
                                <td className="r">
                                  <button className="btn sm gh" type="button" onClick={d?.pick}>
                                    {d?.act}
                                  </button>
                                </td>
                              </tr>
                              {d?.open ? (
                                <>
                                  <tr className="bd">
                                    <td colSpan="16">
                                      <div className="bill">
                                        <div className="bh">
                                          <b>
                                            {"Purchase bill "}{d?.inv}
                                          </b>
                                          <span className={d?.pc}>
                                            {d?.pay}
                                          </span>
                                          <span className="muted">
                                            {"Received "}{d?.dt}{" · Due "}{d?.due}
                                          </span>
                                          <div style={{"flex":"1"}} />
                                          <button className="btn sm" type="button">
                                            Print GRN
                                          </button>
                                          <button className="btn sm" type="button">
                                            Make payment
                                          </button>
                                          <DcLink className="btn sm" href={v.billHref} onClick={v.markBack}>
                                            Open full bill
                                          </DcLink>
                                          <button className="btn sm gh" type="button" onClick={d?.pick} aria-label="Close bill">
                                            ✕
                                          </button>
                                        </div>
                                        <div className="bgr">
                                          <div>
                                            <div className="k">
                                              Supplier / mill
                                            </div>
                                            <div style={{"fontWeight":"500"}}>
                                              {v.f?.p}
                                            </div>
                                            <div className="sub">
                                              {"GSTIN "}{v.f?.gstin}{" · Mill invoice "}{d?.mill}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="k">
                                              Against order
                                            </div>
                                            <div>
                                              {v.f?.no}{" · "}{v.f?.odt}
                                            </div>
                                            <div className="sub">
                                              {"Mill ref. "}{v.f?.ref}{" · Agent "}{v.f?.ag}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="k">
                                              Received at
                                            </div>
                                            <div>
                                              {d?.gd}{" godown"}
                                            </div>
                                            <div className="sub">
                                              {d?.tr}{" · LR "}{d?.lr}{" · "}{d?.veh}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="k">
                                              E-way bill
                                            </div>
                                            <div>
                                              {d?.ewb}
                                            </div>
                                            <div className="sub">
                                              ITC eligible · GSTR-2B matched
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bl">
                                          <div className="it">
                                            <table>
                                              <thead>
                                                <tr>
                                                  <th>
                                                    Item
                                                  </th>
                                                  <th>
                                                    Lot
                                                  </th>
                                                  <th>
                                                    Grade
                                                  </th>
                                                  <th className="r">
                                                    Boxes
                                                  </th>
                                                  <th className="r">
                                                    Net kg
                                                  </th>
                                                  <th className="r">
                                                    Rate
                                                  </th>
                                                  <th className="r">
                                                    Taxable
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                <tr>
                                                  <td>
                                                    <div>
                                                      {v.f?.it}
                                                    </div>
                                                    <div className="sub">
                                                      {"HSN 5402 · "}{v.f?.br}
                                                    </div>
                                                  </td>
                                                  <td className="t2">
                                                    {v.f?.lot}
                                                  </td>
                                                  <td className="t2">
                                                    {v.f?.gr}
                                                  </td>
                                                  <td className="r">
                                                    {d?.bx}
                                                  </td>
                                                  <td className="r">
                                                    {d?.kg}
                                                  </td>
                                                  <td className="r">
                                                    {d?.rate}
                                                  </td>
                                                  <td className="r">
                                                    {d?.tx}
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                          <div className="tt">
                                            <span className="muted">
                                              Taxable value
                                            </span>
                                            <span>
                                              {d?.tx}
                                            </span>
                                            <span className="muted">
                                              CGST 2.5%
                                            </span>
                                            <span>
                                              {d?.cg}
                                            </span>
                                            <span className="muted">
                                              SGST 2.5%
                                            </span>
                                            <span>
                                              {d?.cg}
                                            </span>
                                            <span className="muted">
                                              Round off
                                            </span>
                                            <span>
                                              {d?.ro}
                                            </span>
                                            <span className="g">
                                              Bill total
                                            </span>
                                            <span className="g">
                                              {d?.amt}
                                            </span>
                                            <span className="muted">
                                              Paid
                                            </span>
                                            <span>
                                              {d?.recv}
                                            </span>
                                            <span className="muted">
                                              Balance
                                            </span>
                                            <span style={{"fontWeight":"600"}}>
                                              {d?.bal}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </>
                              ) : null}
                            </Fragment>
                          ))}
                          {v.f?.none ? (
                            <>
                              <tr>
                                <td colSpan="11" className="muted" style={{"textAlign":"center"}}>
                                  {"No goods received yet · "}{v.f?.pq}{" kg pending from mill"}
                                </td>
                              </tr>
                            </>
                          ) : null}
                        </tbody>
                        {v.f?.some ? (
                          <>
                            <tfoot>
                              <tr>
                                <td>
                                  {v.f?.n}{" bills"}
                                </td>
                                <td />
                                <td />
                                <td />
                                <td className="r">
                                  {v.f?.rq}
                                </td>
                                <td className="r">
                                  {v.f?.tx}
                                </td>
                                <td className="r">
                                  {v.f?.gst}
                                </td>
                                <td className="r">
                                  {v.f?.val}
                                </td>
                                <td />
                                <td />
                                <td />
                              </tr>
                            </tfoot>
                          </>
                        ) : null}
                      </table>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
        <div className="aiw">
          <Assistant page={v.sideKey} />
        </div>
      </div>
      </>
    );
  }
}

export default function PurchaseOrderList(props) {
  const theme = useTheme();
  return <PurchaseOrderListView {...props} theme={theme} />;
}
