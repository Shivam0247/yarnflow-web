/* eslint-disable */
// SalesOrderList — converted 1:1 from the YarnFlow design (SalesOrderList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './SalesOrderList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: 'Pending', view: 'order', sel: [], focus: 'SAL02722', bill: null, top: 690, bot: 300, over: {} }; }
  /* live data (app) — on the design canvas window.YF_API is absent and the sample data below is used */
  api() { return typeof window !== 'undefined' ? window.YF_API : null; }
  async load() {
    const api = this.api(); if (!api || !api.session) return;
    try {
      const [reg, stock] = await Promise.all([api.get('/vouchers/sales-orders', { view: 'lines', pageSize: 1000 }), api.get('/reports/stock')]);
      const stk = {}; stock.rows.forEach((r) => { stk[r.itemName] = (stk[r.itemName] || 0) + r.qty; });
      this.setState({ live: reg.data, liveStock: stk, err: null });
      if (this.state.focus && !reg.data.some((r) => r.number === this.state.focus)) this.setState({ focus: reg.data[0] ? reg.data[0].number : null });
    } catch (e) { this.setState({ err: api.message(e) }); }
  }
  async loadBills(id) {
    const api = this.api(); if (!api || !id || (this.state.rel || {})[id]) return;
    try { const rel = await api.get('/vouchers/sales-orders/' + id + '/related'); this.setState({ rel: { ...(this.state.rel || {}), [id]: rel.filter((b) => b.type === 'SALE_BILL') } }); } catch (e) {}
  }
  async act(ids, action, reason) {
    const api = this.api(); if (!api) return;
    const errs = [];
    for (const id of [...new Set(ids)]) { try { await api.post('/vouchers/sales-orders/' + id + '/actions/' + action, reason ? { reason } : {}); } catch (e) { errs.push(api.message(e)); } }
    if (errs.length) window.alert(errs.join('\n'));
    this.setState({ sel: [], selAll: false, excl: [], rel: {} });
    await this.load();
  }
  componentDidMount() { this.load(); try { const h = window.innerHeight; if (h >= 560 && h <= 1600) { const t = h - 60; const top = Math.round(t * 0.7); this.setState({ top, bot: t - top }); } } catch (e) {} }

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
    const SC = { Pending: '#3B82F6', Hold: '#F97316', Clear: '#22C55E', Cancelled: '#EF4444', Locked: '#A855F7' };
    const SN = { Pending: 'Pending dispatch', Hold: 'On hold · approval', Clear: 'Closed', Cancelled: 'Cancelled', Locked: 'Locked' };
    const LIVE = this.state.live;
    const LST = { PENDING_APPROVAL: 'Hold', OPEN: 'Pending', PARTIAL: 'Pending', COMPLETED: 'Clear', CANCELLED: 'Cancelled', REJECTED: 'Cancelled', LOCKED: 'Locked', DRAFT: 'Hold' };
    const fromLive = (r) => ({ id: r.id, lineId: r.lineId, no: r.number.replace(/\/\d{2}-\d{2}$/, ''), dt: r.date.split('-').reverse().join('-'), cr: r.creditDays, p: r.partyName, g: r.partyGroupName || r.partyName,
      it: r.itemName || '', br: r.brand || '—', lot: r.lotNo || '—', gr: r.grade || '—', rate: r.rate, oq: r.qty, dq: r.doneQty, bk: r.brokerName || 'Direct', st: LST[r.status] || 'Pending', bc: r.doneCount });
    const DEMO = [
      ['SAL11834', '23-10-2026', 45, 'Krishna Textiles', 'Krishna Textiles', '75/36 FDY', 'Reliance', 'L-2231', 'A+', 136, 2400, 0, 'Direct', 'Hold'],
      ['SAL11829', '22-10-2026', 30, 'Navrang Prints', 'Navrang Prints', 'DTY 80/36 SIM', 'Filatex', 'D-552', 'A', 128, 1500, 0, 'Kiran', 'Hold'],
      ['SAL02722', '21-05-2026', 4, 'Bhagwati Filaments', 'Bhagwati Filaments', '50/24 SD CAT', 'Reliance', '356C9S', 'A+', 179.6, 10050, 9335.8, 'Avi M', 'Pending'],
      ['SAL02933', '26-05-2026', 15, 'Riddhi Dharmesh Patel', 'Meghna Yogeshbhai', '100/36 TEX', 'GTPL', '16100', 'CLQ', 115, 130, 0, 'Manoj', 'Pending'],
      ['SAL02934', '26-05-2026', 15, 'Riddhi Dharmesh Patel', 'Meghna Yogeshbhai', '108/36 TEX', 'GTPL', 'G108', 'PQ', 115, 130, 0, 'Manoj', 'Pending'],
      ['SAL02970', '27-05-2026', 1, 'A P N Corporation', 'A P N Corporation', '75/144 SIM', 'Reliance', 'P6075459P', 'A+', 95, 785.81, 0, 'Aelish', 'Pending'],
      ['SAL03514', '05-06-2026', 1, 'Bansam Fabrics', 'Bansam Fabrics', '50/48 FDY', 'Reliance', '338C1M', 'A+', 140, 36050, 34827.45, 'Ramji', 'Pending'],
      ['SAL04254', '19-06-2026', 4, 'Shree Rudraksha Poly', 'Shree Rudraksha Poly', '50/12 BRT', 'Durga', 'SIBS1008', 'F1', 185.14, 15050, 14526.4, 'Direct', 'Pending'],
      ['SAL04424', '23-06-2026', 15, 'Jigita Fab LLP', 'Jigita Fab LLP', 'Muskan Bright', 'J.J. Industries', 'MB123', '1ST', 370, 2050, 1478.26, 'Direct', 'Pending'],
      ['SAL04425', '23-06-2026', 15, 'Jigita Fab LLP', 'Jigita Fab LLP', 'Muskan Gold', 'J.J. Industries', 'MG123', '1ST', 580, 2050, 1771.99, 'Direct', 'Pending'],
      ['SAL04614', '25-06-2026', 4, 'Shree Rudraksha Poly', 'Shree Rudraksha Poly', '50/12 BRT', 'Durga', 'SIBS1008', 'F1', 185.14, 15050, 10252.42, 'Direct', 'Pending'],
      ['SAL05058', '02-07-2026', 15, 'Ganpati Silk Mill', 'Kanvi Corporation', '50/24 SD CAT', 'Reliance', '356C9S', 'PQ', 151, 5050, 4453.69, 'Krish J', 'Pending'],
      ['SAL05360', '06-07-2026', 1, 'Maa Ashapura Textile', 'Maa Madhawali Fabrics', '110 Vichitra', 'GTPL', '5024', 'A+', 154.71, 850, 0, 'Babul', 'Pending'],
      ['SAL05773', '10-07-2026', 1, 'Shree Rudraksha Poly', 'Shree Rudraksha Poly', '50/48 FDY NLBS', 'Garden', 'FD002I4', '1ST', 134.12, 31050, 27058.727, 'Direct', 'Pending'],
      ['SAL05802', '11-07-2026', 1, 'Sujal Synthetics', 'Sujal Synthetics', '50/48 FDY', 'Reliance', '338C1M', 'A+', 132.71, 5550, 4967.78, 'Direct', 'Pending'],
      ['SAL05863', '11-07-2026', 1, 'Veer Enterprise', 'Binaka Textiles', '50/24 SD CAT', 'Reliance', 'FX85', 'PQ', 151, 2450, 2012.1, 'Direct', 'Pending'],
      ['SAL06126', '16-07-2026', 15, 'Badra Fabrics', 'Ajit Textiles', '50/48 Crep', 'Roscco', 'NEW LOT', 'A1', 259.61, 1550, 1550, 'Direct', 'Pending'],
      ['SAL06373', '20-07-2026', 15, 'OM Fabrics', 'Poonam Silk Corporation', '75/72 Roto', 'Saanika', '0001', '1ST', 138.5, 5050, 0, 'Direct', 'Hold'],
      ['SAL06398', '20-07-2026', 17, 'Yogeshwar Textiles', 'Mahadev Textile', '75/36 Crimp', 'Saanika', 'CR7523', '1ST', 136.76, 1050, 496.48, 'Nilka', 'Locked'],
      ['SAL06551', '22-07-2026', 1, 'Chetna Textiles', 'Yami Textiles', '75/72 Roto SIM', 'Durga', 'TX3113', 'A1', 139.75, 10050, 10050, 'Direct', 'Clear'],
      ['SAL06932', '27-07-2026', 15, 'Geeta Fab', 'Ved Textiles', '110 Vichitra', 'Wellknown', '57460', 'PQ', 152, 3050, 2595.73, 'Direct', 'Pending'],
      ['SAL06939', '27-07-2026', 10, 'Omkar Synthetics', 'Omkar Filaments', '50/36 Bright', 'Sanathan', 'D723A2', '1ST', 176.25, 2050, 0, 'Direct', 'Cancelled']
    ].map((r) => { const base = r[13] === 'Pending' && r[11] >= r[10] ? 'Clear' : r[13]; return { no: r[0], dt: r[1], cr: r[2], p: r[3], g: r[4], it: r[5], br: r[6], lot: r[7], gr: r[8], rate: r[9], oq: r[10], dq: r[11], bk: r[12], st: this.state.over[r[0]] || base }; });
    const D = LIVE ? LIVE.map(fromLive) : DEMO;
    const splitIt = (s) => { const m = String(s).match(/(\d+(?:\/\d+){1,2}|\b\d{2,3}\b)/); if (!m) return { den: '\u2014', itn: s }; const rest = String(s).replace(m[1], '').replace(/\s+/g, ' ').trim(); return { den: m[1], itn: rest || s }; };
    D.forEach((r) => { const z = splitIt(r.it); r.den = z.den; r.itn = z.itn; });
    const nOrd = (st) => new Set(D.filter((r) => !st || r.st === st).map((r) => r.no)).size;
    const tabDefs = LIVE ? [['Pending', 'Pending dispatch', nOrd('Pending')], ['Hold', 'On hold · approval', nOrd('Hold')], ['Clear', 'Closed', nOrd('Clear')], ['Cancelled', 'Cancelled', nOrd('Cancelled')], ['Locked', 'Locked', nOrd('Locked')], ['All', 'All', nOrd(null)]]
      : [['Pending', 'Pending dispatch', 356], ['Hold', 'On hold · approval', 11], ['Clear', 'Closed', 1208], ['Cancelled', 'Cancelled', 12], ['Locked', 'Locked', 3], ['All', 'All', 1590]];
    const tab = this.state.tab;
    const vis0 = D.filter((r) => tab === 'All' || r.st === tab);
    const COLS = [{ k: 'no', l: 'Order no.' }, { k: 'dt', l: 'Date', date: 1 }, { k: 'p', l: 'Party' }, { k: 'itn', l: 'Item' }, { k: 'den', l: 'Denier' }, { k: 'br', l: 'Brand' }, { k: 'lot', l: 'Lot no.' }, { k: 'gr', l: 'Grade' }, { k: 'rate', l: 'Rate', num: 1, r: 1, fmt: (v) => inr(v, 2) }, { k: 'oq', l: 'Ordered kg', num: 1, r: 1, fmt: (v) => inr(v, 3) }, { k: 'dq', l: 'Dispatched', num: 1, r: 1, fmt: (v) => inr(v, 3) }, { k: 'pq', l: 'Pending kg', num: 1, r: 1, rt: 1, get: (r) => Math.max(r.oq - r.dq, 0), fmt: (v) => inr(v, 3) }, { k: 'bk', l: 'Broker', rt: 1 }, { k: 'stL', l: 'Status', rt: 1, get: (r) => SN[r.st] || r.st }];
    const cf = this.cf(vis0, COLS); const vis = cf.list;
    const tabTotal0 = (tabDefs.find((t) => t[0] === tab) || [0, 0, 0])[2];
    const tabTotal = cf.filtered || LIVE ? vis.length : tabTotal0;
    const loaded = this.state.loaded ?? 20;
    const shown = [];
    if (LIVE) shown.push(...vis.slice(0, loaded));
    else while (vis.length && shown.length < Math.min(loaded, tabTotal)) { const r = vis[shown.length % vis.length]; const kk = Math.floor(shown.length / vis.length); const len = r.no.length - 3;
      let num = parseInt(r.no.slice(3), 10) - kk * 1009; let no = r.no; if (kk > 0) { do { num = num > 50 ? num - 3 : num + 9973; no = r.no.slice(0, 3) + String(num).padStart(len, '0'); } while (D.some((x) => x.no === no) || shown.some((x) => x.no === no)); }
      shown.push(kk === 0 ? r : { ...r, no }); }
    if (cf.sorter) shown.sort(cf.sorter);
    const SA = !!this.state.selAll; const EX = this.state.excl || [];
    const isSel = (no) => SA ? EX.indexOf(no) < 0 : this.state.sel.indexOf(no) >= 0;
    const sel = SA ? vis.map((r) => r.no).filter((n) => EX.indexOf(n) < 0) : this.state.sel;
    const setSel = (s) => this.setState({ sel: s });
    const rows = shown.map((r) => {
      const pq = Math.max(r.oq - r.dq, 0); const pct = r.oq ? Math.round(r.dq / r.oq * 100) : 0; const on = isSel(r.no); const exp = r.no === this.state.focus; const nb = LIVE ? r.bc : mkBills(r, r.dq, 'SI-', 4, 3).length;
      return { ...r, st: SN[r.st] || r.st, rate: inr(r.rate, 2), oq: inr(r.oq, 3), dq: inr(r.dq, 3), pq: inr(pq, 3), bw: 'width: ' + pct + '%', sc: '--c: ' + (SC[r.st] || '#8F8F8F'), on, rc: on || r.no === this.state.focus ? 'sel' : '',
        exp, bn: nb ? nb + (nb > 1 ? ' bills' : ' bill') : 'No bills', cc: exp ? 'cnt on' : 'cnt', chev: '',
        ask: r.st === 'Hold', show: r.st !== 'Hold', ok: () => (LIVE ? this.act([r.id], 'approve', 'Approved from register') : this.setState({ over: { ...this.state.over, [r.no]: 'Pending' } })),
        no2: () => { if (!LIVE) return this.setState({ over: { ...this.state.over, [r.no]: 'Cancelled' } }); const why = window.prompt('Reason for rejecting ' + r.no + '?'); if (why) this.act([r.id], 'reject', why); },
        tog: () => SA ? this.setState({ excl: on ? EX.concat([r.no]) : EX.filter((x) => x !== r.no) }) : setSel(on ? sel.filter((s) => s !== r.no) : sel.concat([r.no])), focus: () => this.setState({ focus: r.no, bill: null }), rowClick: (e) => { if (e && e.target && e.target.closest && e.target.closest('input,button,a,label,select')) return; this.setState({ focus: r.no, bill: null }); }, open: (e) => { if (e && e.target && e.target.closest && e.target.closest('input,button,a,label,select')) return; try { window.localStorage.setItem('yf-view-so', JSON.stringify({ t: Date.now(), id: r.id, no: r.no, dt: r.dt, p: r.p, g: r.g || r.ag || '', it: r.it, br: r.br, lot: r.lot, gr: r.gr, rate: r.rate, oq: r.oq, dq: (r.dq ?? r.rq ?? 0), bk: r.bk || r.ref || '', stL: SN[r.st] || r.st })); } catch (err) {} try { window.localStorage.setItem('yf-back', JSON.stringify({ href: 'SalesOrderList' + sfx + '.dc.html', label: 'Sales order register' })); } catch (err) {} this.go('SalesOrderView' + sfx + '.dc.html'); } };
    });
    const sum = (arr, k) => arr.reduce((a, r) => a + r[k], 0);
    const tot = { oq: inr(sum(vis, 'oq'), 3), dq: inr(sum(vis, 'dq'), 3), pq: inr(sum(vis, 'oq') - sum(vis, 'dq'), 3) };
    const STK = {'50/24 SD CAT': 1850.5, '100/36 TEX': 0, '108/36 TEX': 40, '75/144 SIM': 900, '50/48 FDY': 2400.25, '50/12 BRT': 3100, 'Muskan Bright': 620, 'Muskan Gold': 410, '110 Vichitra': 1200.4, '50/48 FDY NLBS': 4212.6, '75/36 FDY': 2550, '75/72 Roto': 3800, 'DTY 80/36 SIM': 900, '75/36 Crimp': 300, '75/72 Roto SIM': 0, '50/48 Crep': 0, '50/36 Bright': 520};
    const byIt = {}; vis.forEach((r) => { byIt[r.it] = (byIt[r.it] || 0) + Math.max(r.oq - r.dq, 0); });
    const STKU = LIVE ? (this.state.liveStock || {}) : STK;
    let stk = 0, short = 0; Object.keys(byIt).forEach((k) => { const st = STKU[k] ?? 0; stk += st; short += Math.max(0, byIt[k] - st); });
    const pv = vis.reduce((a, r) => a + Math.max(r.oq - r.dq, 0) * r.rate, 0); const oqS = sum(vis, 'oq'); const pqS = Math.max(oqS - sum(vis, 'dq'), 0);
    const F = LIVE ? (vis.length ? 1 : 0) : vis.length ? tabTotal / vis.length : 0; const stkA = stk * Math.min(F, 6); const pqA = pqS * F;
    const sm = { n: inr(tabTotal, 0), oq: inr(oqS * F, 3), dq: inr(sum(vis, 'dq') * F, 3), pq: inr(pqA, 3), pv: inr(pv * F, 0), stk: inr(stkA, 3), short: inr(Math.max(0, pqA - stkA), 3), after: inr(stkA + pqA, 3), avg: oqS ? inr(vis.reduce((a, r) => a + r.oq * r.rate, 0) / oqS, 2) : '0.00' };
    const view = this.state.view;
    const key = view === 'broker' ? 'bk' : 'g';
    const gm = {};
    vis.forEach((r) => { const k = r[key]; gm[k] = gm[k] || { n: 0, oq: 0, dq: 0 }; gm[k].n += 1; gm[k].oq += r.oq; gm[k].dq += r.dq; });
    const groups = Object.keys(gm).sort((a, b) => (gm[b].oq - gm[b].dq) - (gm[a].oq - gm[a].dq)).map((k) => { const v = gm[k]; const pct = v.oq ? Math.round(v.dq / v.oq * 100) : 0; return { k, n: v.n, oq: inr(v.oq, 3), dq: inr(v.dq, 3), pq: inr(v.oq - v.dq, 3), bw: 'width: ' + pct + '%', pc: pct + '% dispatched', open: () => this.setState({ view: 'order' }) }; });
    const fr = shown.concat(D).find((r) => r.no === this.state.focus);
    let f = null;
    if (fr && LIVE) this.loadBills(fr.id);
    const liveBills = (o) => ((this.state.rel || {})[o.id] || []).map((b, i) => {
      const due = b.dueDate || b.date; const age = Math.round((Date.now() - new Date(due + 'T00:00:00').getTime()) / 864e5); const paid = b.pending <= 0.5;
      const half = b.cgst; return { key: 'b' + b.id, i, id: b.id, inv: b.number.replace(/\/\d{2}-\d{2}$/, ''), dt: b.date.split('-').reverse().join('-'), due: due.split('-').reverse().join('-'), bx: b.pcs, kgN: b.qty, txN: b.lineTaxable, totN: b.net, paid,
        kg: inr(b.qty, 3), rate: inr(b.rate, 2), tx: '₹ ' + inr(b.lineTaxable, 2), cg: '₹ ' + inr(half, 2), gst: '₹ ' + inr(b.gst, 2), amt: '₹ ' + inr(b.net, 2), ro: (b.roundOff >= 0 ? '+ ' : '− ') + inr(Math.abs(b.roundOff), 2),
        pay: paid ? 'Paid' : age > 0 ? 'Overdue ' + age + ' days' : 'Due ' + due.split('-').reverse().join('-'), pc: paid ? 'tag t-green' : age > 0 ? 'tag t-red' : 'tag t-gray',
        recv: '₹ ' + inr(b.net - b.tds - b.pending, 2), bal: '₹ ' + inr(b.pending, 2), tr: b.transporterName || '—', lr: b.lrNo || '—', veh: b.vehicleNo || '—', ewb: b.ewbNo ? ewbF(b.ewbNo) : 'Not generated', mill: b.refNo || '—' };
    });
    if (fr) {
      const bs = LIVE ? liveBills(fr) : mkBills(fr, fr.dq, 'SI-', 4, 3);
      const ds = bs.map((b) => { const open = this.state.bill === b.key; return { ...b, open, rc: open ? 'on' : '', act: open ? 'Hide' : 'View', pick: () => this.setState({ bill: open ? null : b.key }) }; });
      const val = bs.reduce((a, b) => a + b.totN, 0); const rc = LIVE ? ((this.state.rel || {})[fr.id] || []).reduce((a, b) => a + (b.net - b.tds - b.pending), 0) : bs.filter((b) => b.paid).reduce((a, b) => a + b.totN, 0); const tx = bs.reduce((a, b) => a + b.txN, 0);
      f = { no: fr.no, odt: fr.dt, p: fr.p, it: fr.it, lot: fr.lot, gr: fr.gr, bk: fr.bk, gstin: LIVE ? '' : gstOf(fr.p), ds, none: ds.length === 0, some: ds.length > 0, n: ds.length,
        oq: inr(fr.oq, 3), dq: inr(fr.dq, 3), pq: inr(Math.max(fr.oq - fr.dq, 0), 3), val: '₹ ' + inr(val, 2), tx: '₹ ' + inr(tx, 2), gst: '₹ ' + inr(val - tx, 2), recv: '₹ ' + inr(rc, 2), bal: '₹ ' + inr(val - rc, 2) };
    }
    const bulk = {};
    const LACT = { Approve: 'approve', Clear: 'close', Pending: 'reopen', Locked: 'lock', Cancelled: 'cancel' };
    ['Approve', 'Hold', 'Clear', 'Pending', 'Locked', 'Cancelled'].forEach((s) => { bulk[s] = () => {
      if (LIVE) { const ids = D.filter((r) => sel.indexOf(r.no) >= 0).map((r) => r.id); if (!LACT[s]) { window.alert('Use Lock to put orders on hold'); return; } this.act(ids, LACT[s], s === 'Approve' ? 'Bulk approval' : undefined); return; } const o = { ...this.state.over }; sel.forEach((n) => { o[n] = s === 'Approve' ? 'Pending' : s; }); this.setState({ over: o, sel: [], selAll: false, excl: [] }); }; });
    const selRows = shown.filter((r) => sel.indexOf(r.no) >= 0);
    const allOn = SA ? EX.length === 0 : (shown.length > 0 && shown.every((r) => sel.indexOf(r.no) >= 0));
    return {
      moreLeft: shown.length < tabTotal, allLoaded: tabTotal > 0 && shown.length >= tabTotal, loadedLabel: shown.length + ' of ' + inr(tabTotal, 0) + ' loaded',
      onScroll: (e) => { const el = e.currentTarget || e.target; if (!el || this._ld || shown.length >= tabTotal) return; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 140) { this._ld = true; setTimeout(() => { this._ld = false; this.setState({ loaded: (this.state.loaded ?? 20) + 20 }); }, 400); } },
      cf, sm, theme, rows, groups, tot, f: f || { no: '', p: '', it: '', lot: '', ds: [], none: false, some: false, pq: '' },
      tabs: tabDefs.map(([k, l, n]) => ({ l, n: inr(n, 0), c: '--c: ' + (SC[k] || '#8F8F8F'), cls: k === tab ? 'tab on' : 'tab', pick: () => this.setState({ tab: k, sel: [], selAll: false, excl: [], loaded: 20 }) })),
      isHoldTab: tab === 'Hold', lastCol: tab === 'Hold' ? 'Approve / reject' : 'Status',
      vw: { order: view === 'order' ? 'on' : '', group: view === 'group' ? 'on' : '', broker: view === 'broker' ? 'on' : '' },
      setView: { order: () => this.setState({ view: 'order' }), group: () => this.setState({ view: 'group' }), broker: () => this.setState({ view: 'broker' }) },
      isOrder: view === 'order', isGroup: view !== 'order', groupLabel: view === 'broker' ? 'Broker' : 'Party group',
      hasSel: SA ? tabTotal - EX.length > 0 : sel.length > 0, selCount: SA ? inr(tabTotal - EX.length, 0) + ' (all)' : sel.length, selQty: SA ? inr(pqA, 3) : inr(selRows.reduce((a, r) => a + Math.max(r.oq - r.dq, 0), 0), 3),
      bulk, clearSel: () => this.setState({ sel: [], selAll: false, excl: [] }), allOn,
      toggleAll: () => this.setState(allOn || SA ? { selAll: false, excl: [], sel: [] } : { selAll: true, excl: [], sel: [] }),
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
      countLabel: vis.length + ' of ' + (tabDefs.find((t) => t[0] === tab) || [0, 0, 0])[2] + ' orders',
      markBack: () => { try { if (fr) window.localStorage.setItem('yf-new-from', JSON.stringify({ type: 'so', id: fr.id, no: fr.no })); } catch (err) {} try { window.localStorage.setItem('yf-back', JSON.stringify({ href: 'SalesOrderList' + sfx + '.dc.html', label: 'Sales order register' })); } catch (err) {} },
      openFocus: () => { try { window.localStorage.setItem('yf-back', JSON.stringify({ href: 'SalesOrderList' + sfx + '.dc.html', label: 'Sales order register' })); } catch (err) {} if (fr) { try { window.localStorage.setItem('yf-view-so', JSON.stringify({ t: Date.now(), id: fr.id, no: fr.no, dt: fr.dt, p: fr.p, g: fr.g || fr.ag || '', it: fr.it, br: fr.br, lot: fr.lot, gr: fr.gr, rate: fr.rate, oq: fr.oq, dq: (fr.dq ?? fr.rq ?? 0), stL: SN[fr.st] || fr.st })); } catch (err) {} } },
      newHref: 'SalesOrderEntry' + sfx + '.dc.html', dispHref: 'Dispatch' + sfx + '.dc.html', recHref: 'SalesOrderView' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class SalesOrderListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="so" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Sales Orders
              </span>
              <span className="m">
                /
              </span>
              <span>
                Register
              </span>
            </div>
            <div className="seg" role="group" aria-label="View">
              <button type="button" className={v.vw?.order} onClick={v.setView?.order}>
                Order-wise
              </button>
              <button type="button" className={v.vw?.group} onClick={v.setView?.group}>
                Party group-wise
              </button>
              <button type="button" className={v.vw?.broker} onClick={v.setView?.broker}>
                Broker-wise
              </button>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
              Print
            </button>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
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
                    <button className="btn sm ok" type="button" onClick={v.bulk?.Approve}>
                      Approve → Pending
                    </button>
                    {' '}
                    <button className="btn sm" type="button" onClick={v.bulk?.Hold}>
                      Put on hold
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
                    <button className="btn sm" type="button" onClick={v.bulk?.Locked}>
                      Lock
                    </button>
                    {' '}
                    <button className="btn sm no" type="button" onClick={v.bulk?.Cancelled}>
                      Cancel order
                    </button>
                    {' '}
                    <button className="btn sm gh" type="button" onClick={v.clearSel}>
                      Clear
                    </button>
                  </div>
                </>
              ) : null}
              {' '}
              {v.isOrder ? (
                <>
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
                                {x?.dq}
                              </td>
                              <td className="r" style={{"fontWeight":"500"}}>
                                {x?.pq}
                                <span className="bar" aria-hidden="true">
                                  <i style={sx(x?.bw)} />
                                </span>
                              </td>
                              <td className="t2">
                                {x?.bk}
                              </td>
                              <td>
                                {x?.ask ? (
                                  <>
                                    <span style={{"display":"inline-flex","alignItems":"center","gap":"6px"}}>
                                      <span className="tag t-orange">
                                        On hold
                                      </span>
                                      <button className="ib ok" type="button" aria-label="Approve" onClick={x?.ok} title="Approve → Pending">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                                          <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                      </button>
                                      <button className="ib no" type="button" aria-label="Reject" onClick={x?.no2} title="Reject → Cancelled">
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
                </>
              ) : null}
              {' '}
              {v.isGroup ? (
                <>
                  <div className="tw">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            {v.groupLabel}
                          </th>
                          <th className="r">
                            Orders
                          </th>
                          <th className="r">
                            Ordered kg
                          </th>
                          <th className="r">
                            Dispatched
                          </th>
                          <th className="r">
                            Pending
                          </th>
                          <th>
                            Progress
                          </th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {(v.groups || []).map((g, $index) => (
                          <Fragment key={$index}>
                            <tr className="grp">
                              <td style={{"fontWeight":"500"}}>
                                {g?.k}
                              </td>
                              <td className="r">
                                {g?.n}
                              </td>
                              <td className="r">
                                {g?.oq}
                              </td>
                              <td className="r t2">
                                {g?.dq}
                              </td>
                              <td className="r" style={{"fontWeight":"500"}}>
                                {g?.pq}
                              </td>
                              <td>
                                <span className="bar" style={{"width":"140px","margin":"0"}} aria-hidden="true">
                                  <i style={sx(g?.bw)} />
                                </span>
                                {' '}
                                <span className="sub">
                                  {g?.pc}
                                </span>
                              </td>
                              <td className="r">
                                <button className="btn sm" type="button" onClick={g?.open}>
                                  Open orders
                                </button>
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
            {v.hasFocus ? (
              <>
                <section className="dock" style={sx(v.botH)} aria-label="Bills of selected order">
                  <div className="grip" onPointerDown={v.startDrag} role="separator" aria-orientation="horizontal" aria-label="Drag to resize bills panel" title="Drag to make bigger or smaller">
                    <span />
                  </div>
                  <div className="xh">
                    <b>
                      {"Bills against order "}{v.f?.no}
                    </b>
                    <span className="muted">
                      {v.f?.p}{" · "}{v.f?.it}{" · Lot "}{v.f?.lot}
                    </span>
                    <div style={{"flex":"1"}} />
                    <DcLink className="btn sm" href={v.dispHref} onClick={v.markBack}>
                      Create dispatch
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
                          {"Dispatched · "}{v.f?.n}{" bills"}
                        </span>
                        <b>
                          {v.f?.dq}{" kg"}
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
                          Received
                        </span>
                        <b>
                          {v.f?.recv}
                        </b>
                      </div>
                      <div>
                        <span className="k">
                          Balance
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
                              Bill no.
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
                              Rate
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
                              Transporter · LR
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
                                  {d?.dt}
                                </td>
                                <td className="r">
                                  {d?.bx}
                                </td>
                                <td className="r">
                                  {d?.kg}
                                </td>
                                <td className="r t2">
                                  {d?.rate}
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
                                  {d?.tr}{" · "}{d?.lr}
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
                                            {"Sale bill "}{d?.inv}
                                          </b>
                                          <span className={d?.pc}>
                                            {d?.pay}
                                          </span>
                                          <span className="muted">
                                            {"Bill date "}{d?.dt}{" · Due "}{d?.due}
                                          </span>
                                          <div style={{"flex":"1"}} />
                                          <button className="btn sm" type="button">
                                            Print
                                          </button>
                                          <button className="btn sm" type="button">
                                            Send on WhatsApp
                                          </button>
                                          <DcLink className="btn sm" href={v.dispHref} onClick={v.markBack}>
                                            Open full bill
                                          </DcLink>
                                          <button className="btn sm gh" type="button" onClick={d?.pick} aria-label="Close bill">
                                            ✕
                                          </button>
                                        </div>
                                        <div className="bgr">
                                          <div>
                                            <div className="k">
                                              Bill to
                                            </div>
                                            <div style={{"fontWeight":"500"}}>
                                              {v.f?.p}
                                            </div>
                                            <div className="sub">
                                              {"GSTIN "}{v.f?.gstin}{" · Surat, Gujarat"}
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
                                              {"Broker · "}{v.f?.bk}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="k">
                                              Transport
                                            </div>
                                            <div>
                                              {d?.tr}
                                            </div>
                                            <div className="sub">
                                              {"LR "}{d?.lr}{" · "}{d?.veh}
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
                                              IRN generated · e-invoice
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
                                                      HSN 5402
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
                                              Received
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
                                  {"No bill made yet · "}{v.f?.pq}{" kg pending dispatch"}
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
                                <td className="r">
                                  {v.f?.dq}
                                </td>
                                <td />
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
          <Assistant page="so" />
        </div>
      </div>
      </>
    );
  }
}

export default function SalesOrderList(props) {
  const theme = useTheme();
  return <SalesOrderListView {...props} theme={theme} />;
}
