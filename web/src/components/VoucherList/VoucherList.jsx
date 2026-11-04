/* eslint-disable */
// VoucherList — converted 1:1 from the YarnFlow design (VoucherList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './VoucherList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: 'All', loaded: 22, sel: [], selAll: false, excl: [], focus: null, toast: '', over: {} }; }
  /* live data (app) — on the design canvas window.YF_API is absent and the sample rows are used */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  slug() { return { ds: 'dispatch-schedules', gs: 'general-sales', sr: 'sale-returns', gp: 'general-purchases', pr: 'purchase-returns' }[this.props.kind || 'ds']; }
  async load() {
    const api = this.api(); if (!api) return;
    try { const r = await api.get('/vouchers/' + this.slug(), (this.props.kind || 'ds') === 'ds' ? { view: 'lines', pageSize: 1000 } : { pageSize: 1000 }); this.setState({ live: r.data }); }
    catch (e) { this.setState({ toast: api.message(e) }); }
  }
  async liveBulk(ids, l, fn) {
    const api = this.api(); const errs = [];
    for (const id of [...new Set(ids)]) { try { await fn(api, id); } catch (e) { errs.push(api.message(e)); } }
    this.setState({ sel: [], selAll: false, excl: [], toast: errs.length ? errs.join(' · ') : l + ' \u2014 done for ' + ids.length });
    await this.load();
  }
  componentDidMount() { this.load(); }
  VD() { if (this._vd) return this._vd;
// shared config for the five voucher types (embedded into VoucherEntry + VoucherList)
const KINDS = {
  ds: { mod: 'Sales', title: 'Dispatch schedule', reg: 'Dispatch schedule register', list: 'DispatchScheduleList', entry: 'DispatchScheduleEntry', view: 'DispatchScheduleView', no: 'DS24317/26-27', noun: 'schedule', nouns: 'schedules' },
  gs: { mod: 'Sales', title: 'General sale bill', reg: 'General sale register', list: 'GeneralSaleList', entry: 'GeneralSaleEntry', view: 'GeneralSaleView', no: 'BR51/26-27', noun: 'bill', nouns: 'bills' },
  sr: { mod: 'Sales', title: 'Sale return', reg: 'Sale return register', list: 'SaleReturnList', entry: 'SaleReturnEntry', view: 'SaleReturnView', no: 'R00199/26-27', noun: 'return', nouns: 'returns' },
  gp: { mod: 'Purchase', title: 'General purchase bill', reg: 'General purchase register', list: 'GeneralPurchaseList', entry: 'GeneralPurchaseEntry', view: 'GeneralPurchaseView', no: 'GENU00221/26-27', noun: 'bill', nouns: 'bills' },
  pr: { mod: 'Purchase', title: 'Purchase return', reg: 'Purchase return register', list: 'PurchaseReturnList', entry: 'PurchaseReturnEntry', view: 'PurchaseReturnView', no: 'PRT00056/26-27', noun: 'return', nouns: 'returns' }
};
const TITLE = (s) => String(s).toLowerCase().replace(/(^|[\s(.\-/&])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(Llp|Pvt|Ltd|P)\b/g, (w) => w.toUpperCase()).replace(/\bLtd\b/gi, 'Ltd');
const PARTIES = {
  ds: ['VSRK TEXTILES', 'SHIVAM TEXTILES', 'VIJAY ENTERPRISE', 'KIRTI TEXTILES', 'MAHESH TEXTILES', 'LALIT TEXTILES', 'SHREE SAI MARKETING', 'PARMESHWAR TEXTILES', 'KHAYATI TEX', 'BALAJI TEXTILES', 'RAMDEV FASHION', 'SIYA CORPORATION', 'HARSH TEXTILES', 'KUBER BHANDARI', 'KRISHNA FILAMENT', 'BAFNA TRADERS'],
  gs: ['RELIANCE INDUSTRIES LIMITED', 'WELLKNOWN POLYESTERS P LTD', 'FILATEX INDIA LTD', 'GARDEN SILK MILLS PRIVATE LIMITED', 'GOKULANAND PETROFIBRES', 'GTX PRIVATE LIMITED'],
  sr: ['OMLY FASHION', 'DIYA TEXTILES', 'ANKIT ENTERPRISE', 'JAY VEER ENTERPRISE', 'DABHI EMPIRE', 'MANGLUM TEXTILES', 'WIZARD WEAVES', 'SILICATE YARN', 'SUNSTAR NARROW FAB', 'SHREE BHAGWATI FABRICS', 'SHLOK FASHION', 'S V TEX FAB', 'BRAHMANI SILK HOUSE', 'DHANHARI TEXTILE', 'VRUNDAVAN ALLURE', 'MAHALAXMI TEXO FAB', 'KRISHNA FASHION', 'SIYA CORPORATION', 'SHOBHNA TEXTILES', 'BAFNA TRADERS'],
  gp: ['PUROHIT HANSRAJ VELAJI', 'DISHA TEXTECH & GENERAL TRADING', 'SHEKHAWATI ROAD CARRIER', 'DURGA KANWAR', 'SWASTIK TRANSPORT SERVICE', 'UNITED GUJARAT YARN DEALERS ASSOCIATION', 'SHAURYA TEMPO SERVICE', 'MAA ROADLINES', 'LALIT ROAD CARRIER', 'TRI WORLD EXIM SERVICES LLP', 'COMMERCIAL GOODS CARRIERS'],
  pr: ['SHREE DURGA SYNTEX PVT LTD', 'VINEET SYNTHETICS PVT LTD', 'SHREE RAM YARN TRADING CO', 'GLOBAL SIZER', 'DEVIKA FIBRES (P) LTD', 'SANATHAN TEXTILES LIMITED']
};
const ITEMS = [['50/24 FDY', 'Durga', 'F1', 'SDS3001', 154.5], ['55/48 FDY', 'Durga', 'F1', 'SDS3056', 154.25], ['50/48 FDY LBS', 'Durga', 'F1', 'SDS3011', 155.5], ['75/72 Roto', 'Durga', 'A1', 'TX3545', 161.75], ['50/48 FDY NLBS', 'Durga', 'F1', 'SDS3004', 154.5], ['75/36 FDY', 'Reliance', 'A+', '316C1S', 136], ['50/36 Bright', 'Sanathan', '1ST', 'D723A2', 176.25]];
const TRANS = ['Navkar Roadlines', 'Jay Ambe Roadlines', 'Shree Maruti Cargo', 'VRL Logistics', 'Shivam Transport Services', 'Kalptaru Transport'];
const AGENTS = ['Avi M', 'Aelish', 'Henil', 'Jeki R', 'Direct', 'Pranav'];
const COLP = ['Prakash P. RTGS', 'H.M (Umta)', 'Shaileshbhai', 'Hitesh B.', 'Ajay Joshi (Bhanu)', 'Urvarshibhai'];
const CITY = [['Surat', 'Palsana'], ['Surat', 'Kamrej'], ['Surat', 'Pandesara'], ['Surat', 'Sayan'], ['Surat', 'Varachha'], ['Surat', 'Pardi']];
const rnd = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
const z2 = (n) => String(n).padStart(2, '0');
const dstr = (d) => z2(d.getUTCDate()) + '-' + z2(d.getUTCMonth() + 1) + '-' + d.getUTCFullYear();
const gstin = (r) => ['24', '26', '27'][Math.floor(r() * 3)] + 'AA' + 'ABCDFGHJKLMPR'[Math.floor(r() * 13)] + 'C' + String(1000 + Math.floor(r() * 9000)) + 'K1Z' + 'ABCDEFGH'[Math.floor(r() * 8)];

function makeRows(kind) {
  const r = rnd({ ds: 11, gs: 23, sr: 37, gp: 41, pr: 53 }[kind]);
  const P = PARTIES[kind]; const out = [];
  const N = { ds: 52, gs: 50, sr: 48, gp: 46, pr: 40 }[kind];
  const start = Date.UTC(2026, 3, 6);
  for (let i = 0; i < N; i++) {
    const dt = new Date(start + Math.floor((i / N) * 200 + r() * 3) * 864e5);
    const p = TITLE(P[Math.floor(r() * P.length)]);
    if (kind === 'ds') {
      const it = ITEMS[Math.floor(r() * 5)]; const ct = [12, 16, 24, 25, 26, 32][Math.floor(r() * 6)]; const q = Math.round(ct * (38 + r() * 4) * 1000) / 1000;
      const st = ['Open', 'Open', 'Hold', 'Close', 'Close', 'Close', 'Cancel'][Math.floor(r() * 7)];
      out.push({ no: 'DS' + (24265 - N + i + 1) + '/26-27', dt: dstr(dt), p, dp: TITLE(P[Math.floor(r() * P.length)]), sup: 'Shree Durga Syntex', it: it[0], br: it[1], gr: it[2], lot: it[3], ct, q, rate: it[4], pch: '2326057' + String(100 + i), pinv: '2526057' + String(300 + i), st, appr: st === 'Hold' ? 'Pending' : 'Approved', lr: r() > 0.6 ? 'LR-' + (41000 + i * 7) : '', addr: ['15 to 20, Sahjanand Ind.', '6-7 Raj Ind. Estate', '28 Vishal Nagar', '42 Tirupati Ind.', '138 Harikrupa Ind.', 'Block C, Laxmi Ind.'][Math.floor(r() * 6)], amt: q * it[4] });
    } else if (kind === 'gs') {
      const amt = Math.round(800 + r() * (r() > 0.85 ? 2600000 : 380000));
      const st = r() > 0.7 ? 'Paid' : r() > 0.2 ? 'Unpaid' : 'Part paid';
      out.push({ no: 'BR' + z2(i + 1) + '/26-27', dt: dstr(dt), inv: 'BR' + z2(i + 1) + '/26-27', p: p + ' (Bro)', gst: gstin(r), pcs: 0, wt: 0, meter: Math.round(amt * (6 + r() * 900)) / 1000, amt, st, rcm: 'No', so: '', adj: '', einv: 'No', lock: r() > 0.9 ? 'Yes' : 'No', veh: '', tr: '' });
    } else if (kind === 'gp') {
      const svc = r() > 0.4; const amt = Math.round(800 + r() * (svc ? 120000 : 260000)); const wt = svc ? Math.round(amt * (0.4 + r())) : Math.round(r() * 4000);
      out.push({ no: 'GENU' + String(i + 1).padStart(5, '0') + '/26-27', dt: dstr(dt), inv: r() > 0.5 ? 'L' + (13000 + Math.floor(r() * 900)) : String(Math.floor(r() * 500)), p: TITLE(P[Math.floor(r() * P.length)]) + (svc ? ' (Transporter)' : ''), gst: gstin(r), pcs: svc ? 0 : Math.round(r() * 4000), wt, meter: wt, amt, st: r() > 0.6 ? 'Paid' : 'Unpaid', rcm: svc ? 'Yes' : 'No', so: '', adj: '', lock: r() > 0.85 ? 'Yes' : 'No' });
    } else if (kind === 'sr') {
      const it = ITEMS[Math.floor(r() * ITEMS.length)]; const pcs = [1, 2, 6, 12, 22, 24, 32, 34, 36, 52, 72][Math.floor(r() * 11)]; const wt = Math.round(pcs * (26 + r() * 20) * 1000) / 1000; const rate = Math.round((110 + r() * 75) * 100) / 100;
      const c = CITY[Math.floor(r() * CITY.length)]; const ag = AGENTS[Math.floor(r() * AGENTS.length)];
      out.push({ no: 'R' + String(i + 1).padStart(5, '0') + '/26-27', dt: dstr(dt), p, it: it[0], pcs, wt, amt: Math.round(wt * rate), rate, remark: r() > 0.85 ? 'Shade variation' : '', colp: COLP[Math.floor(r() * COLP.length)], adj: r() > 0.25 ? 'GU' + String(400 + Math.floor(r() * 40000)).padStart(5, '0') + '/26-27' : '', adjdt: dstr(new Date(dt.getTime() - Math.floor(r() * 40) * 864e5)), lr: r() > 0.8 ? String(11000 + Math.floor(r() * 900)) : '', veh: 'GJ' + ['19X', '16', '05B', '03B', '19Y'][Math.floor(r() * 5)] + '-' + (1000 + Math.floor(r() * 8999)), bk: ag, city: c[0], area: c[1], state: 'Gujarat', sp: ['Manoj', 'Aelish', 'Avi M'][Math.floor(r() * 3)], tr: TRANS[Math.floor(r() * TRANS.length)], irn: Math.floor(r() * 0xffffff).toString(16) + '…', sign: r() > 0.78 ? 'Received' : 'Pending' });
    } else {
      const it = ITEMS[Math.floor(r() * ITEMS.length)]; const pcs = [1, 2, 8, 13, 16, 22, 24, 31, 34, 35, 60, 69][Math.floor(r() * 12)]; const wt = Math.round(pcs * (28 + r() * 6) * 1000) / 1000; const rate = Math.round((120 + r() * 45) * 100) / 100;
      out.push({ no: 'PRT' + String(i + 1).padStart(5, '0') + '/26-27', dt: dstr(dt), inv: 'R' + String(i + 1).padStart(5, '0') + '/26-27', p, it: it[0], pcs, wt, amt: Math.round(wt * rate * 1.05), adj: r() > 0.55 ? 'DO26' + String(11031000 + Math.floor(r() * 9000)) : '', adjdt: r() > 0.5 ? dstr(new Date(dt.getTime() - Math.floor(r() * 30) * 864e5)) : '', gst: gstin(r), tr: TRANS[Math.floor(r() * TRANS.length)], st: r() > 0.5 ? 'Adjusted' : 'Pending' });
    }
  }
  return out.reverse();
}

    this._vd = { KINDS, makeRows, TITLE }; return this._vd; }
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
    const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const kind = this.props.kind || 'ds';
    const { KINDS, makeRows } = this.VD(); const K = KINDS[kind];
    const inr = (n, d) => { const s = Number(n || 0).toFixed(d); let [i, f] = s.split('.'); let neg = i[0] === '-'; if (neg) i = i.slice(1); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (neg ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    if (!this._rows || this._rk !== kind) { this._rows = makeRows(kind); this._rk = kind; }
    const over = this.state.over;
    const LIVE = this.state.live;
    const dmy = (x) => (x ? String(x).slice(0, 10).split('-').reverse().join('-') : '');
    const DS = { OPEN: 'Open', PARTIAL: 'Open', PENDING_APPROVAL: 'Hold', LOCKED: 'Hold', COMPLETED: 'Close', CANCELLED: 'Cancel', REJECTED: 'Cancel' };
    const fromLive = (b) => { const ex = b.extra || {};
      if (kind === 'ds') return { id: b.id, no: b.number, dt: dmy(b.date), p: b.partyName, dp: b.deliveryPartyName || b.partyName, sup: b.millName || '\u2014', it: b.itemName || '', br: b.brand || '', gr: b.grade || '', lot: b.lotNo || '', ct: b.pcs, q: b.qty, rate: b.rate, pch: '', pinv: '', st: DS[b.status] || 'Open', appr: b.status === 'PENDING_APPROVAL' ? 'Pending' : 'Approved', lr: b.lrNo || '', addr: b.deliveryAddress || b.partyCity || '', status: b.status };
      const paidSt = b.status === 'CANCELLED' ? 'Cancelled' : b.pending <= 0.5 ? 'Paid' : b.pending < b.netAmount - (b.tdsAmount || 0) - 0.5 ? 'Part paid' : 'Unpaid';
      if (kind === 'gs' || kind === 'gp') return { id: b.id, no: b.number, dt: dmy(b.date), inv: b.refNo || '', p: b.partyName, gst: b.partyGstin || '', pcs: b.totalPcs, wt: b.totalQty, meter: b.totalQty, amt: b.netAmount, st: paidSt, rcm: b.reverseCharge ? 'Yes' : 'No', so: ex.orderNo || '', adj: ex.adjBillNo || '', lock: b.status === 'LOCKED' ? 'Yes' : 'No' };
      if (kind === 'sr') return { id: b.id, no: b.number, dt: dmy(b.date), p: b.partyName, it: b.itemNames || '', pcs: b.totalPcs, wt: b.totalQty, amt: b.netAmount, rate: b.totalQty ? b.taxableAmount / b.totalQty : 0, remark: b.reason || b.remark || '', colp: b.collectionPersonName || '', adj: b.sourceNumber || '', adjdt: dmy(b.sourceDate), lr: b.lrNo || '', veh: b.vehicleNo || '',
        bk: b.brokerName || 'Direct', city: b.partyCity || '', area: b.partyArea || '', state: b.partyState || '', sp: b.salesPersonName || '', tr: b.transporterName || '', irn: b.irn ? b.irn.slice(0, 6) + '\u2026' : '', sign: ex.signCopy || 'Pending' };
      return { id: b.id, no: b.number, dt: dmy(b.date), inv: b.refNo || '', p: b.partyName, it: b.itemNames || '', pcs: b.totalPcs, wt: b.totalQty, amt: b.netAmount, adj: b.sourceNumber || ex.debitNoteNo || '', adjdt: dmy(b.sourceDate), gst: b.partyGstin || '', tr: b.transporterName || '', st: ex.adjusted || (b.sourceNumber ? 'Adjusted' : 'Pending') }; };
    const D = LIVE ? LIVE.map(fromLive) : this._rows.map((r) => (over[r.no] ? Object.assign({}, r, over[r.no]) : r));
    const SPLIT = (s) => { const m = String(s).match(/(\d+(?:\/\d+){1,2}|\b\d{2,3}\b)/); if (!m) return ['\u2014', s]; return [m[1], String(s).replace(m[1], '').replace(/\s+/g, ' ').trim() || s]; };
    // ---- per-kind columns, tabs, totals
    const T = (k, l, o) => Object.assign({ k, l }, o || {});
    const num = (d) => ({ num: 1, r: 1, fmt: (v) => inr(v, d) });
    const TAGS = { Open: 'tag t-blue', Hold: 'tag t-orange', Close: 'tag t-green', Cancel: 'tag t-red', Approved: 'tag t-green', Pending: 'tag t-orange', Paid: 'tag t-green', Unpaid: 'tag t-gray', 'Part paid': 'tag t-orange', Received: 'tag t-green', Adjusted: 'tag t-green', Yes: 'tag t-purple' };
    let COLS, TABS, tabOf, totals, bulk, note;
    if (kind === 'ds') {
      COLS = [T('no', 'Schedule no.'), T('dt', 'Date', { date: 1 }), T('p', 'Party'), T('dp', 'Delivery party'), T('sup', 'Supplier'), T('itn', 'Item', { get: (r) => SPLIT(r.it)[1] }), T('den', 'Denier', { get: (r) => SPLIT(r.it)[0] }), T('br', 'Brand'), T('gr', 'Grade'), T('lot', 'Lot no.'),
        T('ct', 'Cartons', num(0)), T('q', 'Qty kg', num(3)), T('rate', 'Rate', num(2)), T('pch', 'Pur. ch. no.'), T('pinv', 'Pur. inv. no.'), T('st', 'Sch. status', { tag: 1 }), T('appr', 'Approval', { tag: 1, rt: 1 }), T('lr', 'LR no.', { rt: 1 }), T('addr', 'Delivery address', { rt: 1 })];
      TABS = [['All', 'All', '#8F8F8F'], ['Open', 'Open', '#3B82F6'], ['Hold', 'On hold', '#F97316'], ['Close', 'Closed', '#22C55E'], ['Cancel', 'Cancelled', '#EF4444']]; tabOf = (r) => r.st;
      totals = ['ct', 'q'];
      bulk = [['Approve', 'btn sm ok', { st: 'Open', appr: 'Approved' }], ['Hold', 'btn sm', { st: 'Hold', appr: 'Pending' }], ['Close', 'btn sm', { st: 'Close' }], ['Cancel', 'btn sm no', { st: 'Cancel' }]]; note = 'Change status of the selected schedules';
    } else if (kind === 'gs' || kind === 'gp') {
      COLS = [T('no', 'Entry no.'), T('dt', kind === 'gs' ? 'Sale date' : 'Purchase date', { date: 1 }), T('inv', 'Invoice no.'), T('p', 'Party'), T('gst', 'GSTIN'), T('pcs', 'Pcs', num(0)), T('wt', 'Weight', num(3)), T('meter', 'Meter', num(3)), T('amt', 'Amount \u20b9', num(2)), T('st', 'Status', { tag: 1 }), T('rcm', 'RCM', { tag: 1 }), T('so', 'Supp. ord. no.'), T('adj', 'Adj. bill no.', { rt: 1 }), T('lock', 'Locked', { tag: 1, rt: 1 })];
      TABS = kind === 'gs' ? [['All', 'All', '#8F8F8F'], ['Unpaid', 'Unpaid', '#3B82F6'], ['Part paid', 'Part paid', '#F97316'], ['Paid', 'Paid', '#22C55E']] : [['All', 'All', '#8F8F8F'], ['Unpaid', 'Unpaid', '#3B82F6'], ['Paid', 'Paid', '#22C55E']]; tabOf = (r) => r.st;
      totals = ['pcs', 'wt', 'meter', 'amt'];
      bulk = [['Print', 'btn sm', null], ['Export', 'btn sm', null], ['Lock', 'btn sm', { lock: 'Yes' }]]; note = '';
    } else if (kind === 'sr') {
      COLS = [T('no', 'Sale no.'), T('dt', 'Date', { date: 1 }), T('p', 'Party'), T('itn', 'Item', { get: (r) => SPLIT(r.it)[1] }), T('den', 'Denier', { get: (r) => SPLIT(r.it)[0] }), T('pcs', 'Pcs', num(0)), T('wt', 'Weight', num(3)), T('amt', 'Amount \u20b9', num(2)), T('rate', 'Avg rate', num(2)), T('remark', 'Remark'), T('colp', 'Collection person'), T('adj', 'Adj. bill no.'), T('adjdt', 'Adj. bill date', { date: 1 }), T('lr', 'LR no.'), T('veh', 'Vehicle'),
        T('bk', 'Broker'), T('city', 'City'), T('area', 'Area'), T('state', 'State'), T('sp', 'Sales person'), T('tr', 'Transporter', { rt: 1 }), T('irn', 'IRN no.', { rt: 1 }), T('sign', 'Sign copy', { tag: 1, rt: 1 })];
      TABS = [['All', 'All', '#8F8F8F'], ['Pending', 'Sign copy pending', '#F97316'], ['Received', 'Sign copy received', '#22C55E']]; tabOf = (r) => r.sign;
      totals = ['pcs', 'wt', 'amt'];
      bulk = [['Mark sign copy received', 'btn sm ok', { sign: 'Received' }], ['Print e-way bill', 'btn sm', null], ['Print', 'btn sm', null]]; note = '';
    } else {
      COLS = [T('no', 'Entry no.'), T('dt', 'Return date', { date: 1 }), T('inv', 'Invoice no.'), T('p', 'Party'), T('itn', 'Item', { get: (r) => SPLIT(r.it)[1] }), T('den', 'Denier', { get: (r) => SPLIT(r.it)[0] }), T('pcs', 'Pcs', num(0)), T('wt', 'Weight', num(3)), T('amt', 'Amount \u20b9', num(2)), T('adj', 'Adj. bill no.'), T('adjdt', 'Adj. bill date', { date: 1 }), T('gst', 'GSTIN', { rt: 1 }), T('tr', 'Transporter', { rt: 1 }), T('st', 'Debit note', { tag: 1, rt: 1 })];
      TABS = [['All', 'All', '#8F8F8F'], ['Pending', 'Not adjusted', '#F97316'], ['Adjusted', 'Adjusted', '#22C55E']]; tabOf = (r) => r.st;
      totals = ['pcs', 'wt', 'amt'];
      bulk = [['Mark adjusted', 'btn sm ok', { st: 'Adjusted' }], ['Print', 'btn sm', null]]; note = '';
    }
    const tab = this.state.tab;
    const vis0 = D.filter((r) => tab === 'All' || tabOf(r) === tab);
    const cf = this.cf(vis0, COLS); const vis = cf.list;
    const loaded = this.state.loaded;
    const shown = vis.slice(0, loaded);
    this._more = shown.length < vis.length;
    const SA = !!this.state.selAll; const EX = this.state.excl || [];
    const isSel = (no) => SA ? EX.indexOf(no) < 0 : this.state.sel.indexOf(no) >= 0;
    const val = (r, c) => { const v = c.get ? c.get(r) : r[c.k]; return v == null || v === '' ? '\u2014' : v; };
    const SKIP = (e) => !!(e && e.target && e.target.closest && e.target.closest('input,button,a,label,select'));
    const open = (r) => { try { window.localStorage.setItem('yf-view-' + kind, JSON.stringify(Object.assign({ t: Date.now() }, r, LIVE ? { id: r.id } : {}))); } catch (err) {} this.go(K.view + sfx + '.dc.html'); };
    const rows = shown.map((r) => { const on = isSel(r.no);
      return { on, rc: on || this.state.focus === r.no ? 'sel' : '',
        tog: () => SA ? this.setState({ excl: on ? EX.concat([r.no]) : EX.filter((x) => x !== r.no) }) : this.setState({ sel: on ? this.state.sel.filter((x) => x !== r.no) : this.state.sel.concat([r.no]) }),
        rowClick: (e) => { if (SKIP(e)) return; this.setState({ focus: r.no }); }, open: (e) => { if (SKIP(e)) return; open(r); },
        cells: COLS.map((c, i) => { const v = val(r, c); const t = c.tag && v !== '\u2014'; return { v: c.fmt && v !== '\u2014' ? c.fmt(v) : v, isTag: !!t, isTxt: !t, tc: TAGS[v] || 'tag t-gray', cls: (c.r ? 'r ' : '') + (i === 0 ? 'lnk' : (c.k === 'dt' || c.k === 'gst' || c.k === 'lot' || c.k === 'pch' || c.k === 'pinv' || c.k === 'adjdt') ? 't2' : '') }; }) }; });
    const sum = (k) => vis.reduce((a, r) => a + (Number(r[k]) || 0), 0);
    const foot = COLS.map((c, i) => ({ cls: c.r ? 'r' : '', v: i === 0 ? inr(vis.length, 0) + ' ' + K.nouns : (totals.indexOf(c.k) >= 0 ? c.fmt(sum(c.k)) : (c.k === 'rate' && kind !== 'sr' ? '' : '')) }));
    const selRows = SA ? vis.filter((r) => EX.indexOf(r.no) < 0) : vis.filter((r) => this.state.sel.indexOf(r.no) >= 0);
    const allOn = SA ? EX.length === 0 && vis.length > 0 : (shown.length > 0 && shown.every((r) => this.state.sel.indexOf(r.no) >= 0));
    const counts = {}; D.forEach((r) => { const k2 = tabOf(r); counts[k2] = (counts[k2] || 0) + 1; });
    return {
      theme, kind, k: K, cf, rows, foot, span: String(COLS.length + 1), aiPage: { ds: 'so', gs: 'disp', sr: 'disp', gp: 'pb', pr: 'pb' }[kind],
      newHref: K.entry + sfx + '.dc.html', newLabel: { ds: 'New schedule', gs: 'New bill', sr: 'New return', gp: 'New bill', pr: 'New return' }[kind],
      tabs: TABS.map(([k2, l, c]) => ({ l, n: inr(k2 === 'All' ? D.length : (counts[k2] || 0), 0), c: '--c: ' + c, cls: k2 === tab ? 'tab on' : 'tab', pick: () => this.setState({ tab: k2, loaded: 22, sel: [], selAll: false, excl: [] }) })),
      allOn, hasSel: selRows.length > 0, selCount: SA ? inr(selRows.length, 0) + ' (all)' : selRows.length, selNote: note,
      toggleAll: () => this.setState(allOn || SA ? { selAll: false, excl: [], sel: [] } : { selAll: true, excl: [], sel: [] }),
      clearSel: () => this.setState({ sel: [], selAll: false, excl: [] }),
      bulk: bulk.map(([l, cls, patch]) => ({ l, cls, go: () => {
        if (LIVE) { const ids = selRows.map((r) => r.id); const sl = '/vouchers/' + this.slug() + '/';
          const ACT = { Approve: 'approve', Hold: 'lock', Close: 'close', Cancel: 'cancel', Lock: 'lock' };
          if (ACT[l]) return this.liveBulk(ids, l, (api, id) => (l === 'Approve' && D.find((r) => r.id === id).status !== 'PENDING_APPROVAL' ? Promise.resolve() : api.post(sl + id + '/actions/' + ACT[l], l === 'Approve' ? { reason: 'Bulk approval' } : l === 'Cancel' ? { reason: 'Cancelled from register' } : {})));
          if (l === 'Mark sign copy received') return this.liveBulk(ids, l, (api, id) => api.patch(sl + id + '/extra', { signCopy: 'Received' }));
          if (l === 'Mark adjusted') return this.liveBulk(ids, l, (api, id) => api.patch(sl + id + '/extra', { adjusted: 'Adjusted' }));
          if (/Print/.test(l)) { window.print(); return; }
          if (l === 'Export') { const head = COLS.map((c) => c.l); const lines = [head].concat(selRows.map((r) => COLS.map((c) => { const v = c.get ? c.get(r) : r[c.k]; return v == null ? '' : String(v); }))); const csv = lines.map((a) => a.map((v) => '"' + v.replace(/"/g, '""') + '"').join(',')).join('\n');
            try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = K.list + '.csv'; a.click(); } catch (e) {} this.setState({ toast: 'Exported ' + selRows.length + ' ' + K.nouns }); return; }
        } if (patch) { const o = Object.assign({}, this.state.over); selRows.forEach((r) => { o[r.no] = Object.assign({}, o[r.no] || {}, patch); }); this.setState({ over: o, sel: [], selAll: false, excl: [], toast: l + ' \u2014 done for ' + selRows.length + ' ' + (selRows.length === 1 ? K.noun : K.nouns) }); } else this.setState({ toast: l + ' \u2014 ' + selRows.length + ' ' + (selRows.length === 1 ? K.noun : K.nouns) + ' sent' }); } })),
      hasToast: !!this.state.toast, toast: this.state.toast, hideToast: () => this.setState({ toast: '' }),
      onScroll: (e) => { const el = e.currentTarget || e.target; if (!el || this._ld || !this._more) return; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 160) { this._ld = true; setTimeout(() => { this._ld = false; this.setState({ loaded: this.state.loaded + 20 }); }, 350); } },
      moreLeft: shown.length < vis.length, allLoaded: vis.length > 0 && shown.length >= vis.length, loadedLabel: shown.length + ' of ' + vis.length + ' loaded', countLabel: vis.length + ' ' + K.nouns
    };
  }
}

/* ----- view ----- */
class VoucherListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active={v.kind} />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                {v.k?.mod}
              </span>
              <span className="m">
                /
              </span>
              <span>
                {v.k?.reg}
              </span>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              {v.newLabel}
            </DcLink>
          </header>
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
            <input className="inp" type="text" defaultValue="24-10-2026" aria-label="To date" style={{"maxWidth":"120px"}} />
          </div>
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
          {' '}
          {v.hasSel ? (
            <>
              <div className="bulk" role="toolbar" aria-label="Bulk actions">
                <b style={{"fontWeight":"600"}}>
                  {v.selCount}{" selected"}
                </b>
                <span className="muted" style={{"flex":"1"}}>
                  {v.selNote}
                </span>
                {(v.bulk || []).map((b, $index) => (
                  <Fragment key={$index}>
                    <button className={b?.cls} type="button" onClick={b?.go}>
                      {b?.l}
                    </button>
                  </Fragment>
                ))}
                <button className="btn sm gh" type="button" onClick={v.clearSel}>
                  Clear
                </button>
              </div>
            </>
          ) : null}
          {' '}
          {v.hasToast ? (
            <>
              <div className="okbar" role="status">
                <span>
                  ✓
                </span>
                <span>
                  {v.toast}
                </span>
                <button type="button" onClick={v.hideToast} aria-label="Dismiss">
                  ✕
                </button>
              </div>
            </>
          ) : null}
          <div className="reg" onScroll={v.onScroll}>
            <table className="cft">
              <thead>
                <tr>
                  <th style={{"width":"34px"}}>
                    <input className="cbx" type="checkbox" aria-label="Select all" checked={v.allOn} onChange={v.toggleAll} />
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
                </tr>
              </thead>
              <tbody>
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr className={x?.rc} onClick={x?.rowClick} onDoubleClick={x?.open} title="Click to select · double-click to open">
                      <td>
                        <input className="cbx" type="checkbox" aria-label="Select record" checked={x?.on} onChange={x?.tog} />
                      </td>
                      {(x?.cells || []).map((c, $index) => (
                        <Fragment key={$index}>
                          <td className={c?.cls}>
                            {c?.isTag ? (
                              <>
                                <span className={c?.tc}>
                                  {c?.v}
                                </span>
                              </>
                            ) : null}
                            {c?.isTxt ? (
                              <>
                                {c?.v}
                              </>
                            ) : null}
                          </td>
                        </Fragment>
                      ))}
                    </tr>
                  </Fragment>
                ))}
                {v.moreLeft ? (
                  <>
                    <tr className="more">
                      <td colSpan={v.span}>
                        <span className="spin" aria-hidden="true" />
                        {"Loading more as you scroll · "}{v.loadedLabel}
                      </td>
                    </tr>
                  </>
                ) : null}
                {v.allLoaded ? (
                  <>
                    <tr className="more">
                      <td colSpan={v.span}>
                        {"All "}{v.countLabel}{" shown"}
                      </td>
                    </tr>
                  </>
                ) : null}
                <tr className="fillr" aria-hidden="true">
                  <td colSpan={v.span} />
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  {(v.foot || []).map((f, $index) => (
                    <Fragment key={$index}>
                      <td className={f?.cls}>
                        {f?.v}
                      </td>
                    </Fragment>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="aiw">
          <Assistant page={v.aiPage} />
        </div>
      </div>
      </>
    );
  }
}

export default function VoucherList(props) {
  const theme = useTheme();
  return <VoucherListView {...props} theme={theme} />;
}
