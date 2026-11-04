/* eslint-disable */
// VoucherEntry — converted 1:1 from the YarnFlow design (VoucherEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './VoucherEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { rec: null, saved: false, f: {}, x: {}, lines: null, note: '', err: false, busy: false }; }
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
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  today() { const t = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(t.getDate()) + '-' + z(t.getMonth() + 1) + '-' + t.getFullYear(); }
  kind() { return this.props.kind || 'ds'; }
  meta() { return { ds: { slug: 'dispatch-schedules', type: 'DISPATCH_SCHEDULE', side: 'customer', src: 'sales-orders' }, gs: { slug: 'general-sales', type: 'GENERAL_SALE', side: 'any' }, sr: { slug: 'sale-returns', type: 'SALE_RETURN', side: 'customer', src: 'sale-bills' },
    gp: { slug: 'general-purchases', type: 'GENERAL_PURCHASE', side: 'any' }, pr: { slug: 'purchase-returns', type: 'PURCHASE_RETURN', side: 'supplier', src: 'purchase-bills' } }[this.kind()]; }
  blankLine() { return { itemId: null, name: '', code: '', brand: '', lot: '', grade: '', hsn: '', unit: this.kind() === 'gs' ? 'Nos' : 'Kg', qty: '', rate: '', disp: '', frp: '', gst: this.kind() === 'gs' || this.kind() === 'gp' ? '18' : '5', carton: '', cops: '', remark: '', box: '', lr: '', chno: '', chdt: '' }; }

  componentDidMount() {
    const api = this.api();
    if (api) { this.setState({ f: { date: this.today(), creditDays: '' }, lines: [this.blankLine()] }); this.init(); }
    try { const fl = window.localStorage.getItem('yf-flash'); if (fl) { window.localStorage.removeItem('yf-flash'); this.setState({ note: fl }); } } catch (e) {}
    if (this.props.mode !== 'view') return;
    const key = 'yf-view-' + this.kind();
    const rd = () => { try { const raw = window.localStorage.getItem(key); if (raw && raw !== this._raw) { this._raw = raw; const r = JSON.parse(raw); this.setState({ rec: r, saved: false }); if (api && r.id) this.open(r.id); } } catch (e) {} };
    this._rd = rd; rd(); this._iv = setInterval(rd, 700);
    try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }

  async init() {
    const api = this.api(); if (!api) return; const M = this.meta();
    try {
      const lk = await api.lookups();
      const book = lk.books.find((b) => b.voucherType === M.type && b.isDefault) || lk.books.find((b) => b.voucherType === M.type);
      const gd = lk.godowns.find((g) => g.isDefault) || lk.godowns[0];
      this.setState({ lk, f: { ...this.state.f, bookId: this.state.f.bookId || (book ? String(book.id) : ''), godownId: this.state.f.godownId || (gd ? String(gd.id) : '') } });
      if (this.props.mode !== 'view') { const nx = await api.get('/vouchers/' + M.slug + '/next-number', book ? { bookId: book.id } : undefined); this.setState({ nextNo: nx.number }); }
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async open(id) {
    const api = this.api(); const M = this.meta();
    try { const d = await api.get('/vouchers/' + M.slug + '/' + id); this.fill(d); } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  fill(d) {
    if (d.partyId) this.loadBills(d.partyId);
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    const dmy = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('-') : '');
    const ex = d.extra || {};
    this.setState({ doc: d,
      f: { bookId: s(d.bookId), date: dmy(d.date), refNo: s(d.refNo), refDate: dmy(d.refDate), partyId: s(d.partyId), deliveryPartyId: s(d.deliveryPartyId), millId: s(d.millId), brokerId: s(d.brokerId), salesPersonId: s(d.salesPersonId),
        transporterId: s(d.transporterId), vehicleNo: s(d.vehicleNo), expDeliveryDate: dmy(d.expDeliveryDate), creditDays: s(d.creditDays), reverseCharge: d.reverseCharge ? '1' : '', isTcs: d.isTcs ? '1' : '', doNo: s(d.doNo),
        collectionPersonId: s(d.collectionPersonId), currency: d.currency || 'INR', tdsRate: d.tdsRate ? s(d.tdsRate) : '', sourceId: s(d.sourceId), lrNo: s(d.lrNo), lrDate: dmy(d.lrDate), parcels: d.parcels ? s(d.parcels) : '', driverName: s(d.driverName),
        deliveryAddress: s(d.deliveryAddress), remark: s(d.remark), godownId: s(d.godownId), accountId: s((d.lines.find((l) => l.accountId) || {}).accountId) },
      x: { ...ex },
      lines: d.lines.map((l) => ({ id: l.id, itemId: l.itemId, name: l.itemName || l.description || '', code: l.itemCode || '', brand: s(l.brand), lot: s(l.lotNo), grade: s(l.grade), hsn: s(l.hsn), unit: l.unit === 'KG' ? 'Kg' : s(l.unit), qty: s(l.qty), rate: s(l.rate),
        disp: l.discPct ? s(l.discPct) : '', frp: l.freightPct ? s(l.freightPct) : '', gst: s(l.gstRate), carton: l.pcs ? s(l.pcs) : '', cops: l.cops ? s(l.cops) : '', remark: s(l.remark1), box: s(l.remark2), lr: s(l.lrNo), chno: s(l.challanNo), chdt: dmy(l.challanDate),
        sourceLineId: l.sourceLineId, ordq: l.sourceQty, salq: null, pid: s(l.purchaseRef), pinv: s(l.purchaseInvNo), saved: true, pend: l.pendingQty, src: l.sourceNumber })).concat([this.blankLine()]) });
  }

  /** bring in pending lines from the source document (orders for a schedule, the bill for a return) */
  async loadSource(billId) {
    const api = this.api(); const M = this.meta(); if (!api || !M.src) return;
    const f = this.state.f;
    if (!f.partyId) { this.setState({ note: 'Select the party first', err: true }); return; }
    try {
      const pl = await api.get('/vouchers/' + M.src + '/pending-lines', { for: M.slug, partyId: f.partyId });
      const rows = pl.filter((l) => !billId || String(l.voucherId) === String(billId));
      if (!rows.length) { this.setState({ note: M.src === 'sales-orders' ? 'No pending sales order for this party' : 'Nothing left to return on this bill', err: false }); return; }
      const dmy = (iso) => String(iso).slice(0, 10).split('-').reverse().join('-');
      const lines = rows.map((l) => ({ ...this.blankLine(), itemId: l.itemId, name: l.itemName, code: l.itemCode, brand: l.brand || '', lot: l.lotNo || '', grade: l.grade || '', hsn: l.hsn || '', unit: l.unit === 'KG' ? 'Kg' : l.unit, rate: String(l.rate), gst: String(l.gstRate), disp: l.discPct ? String(l.discPct) : '', frp: l.freightPct ? String(l.freightPct) : '',
        qty: String(l.pendingQty), carton: l.pcs ? String(Math.max(1, Math.round(l.pcs * l.pendingQty / Math.max(l.qty, 0.001)))) : '', cops: l.cops ? String(Math.round(l.cops * l.pendingQty / Math.max(l.qty, 0.001))) : '',
        sourceLineId: l.lineId, ordq: l.qty, salq: l.usedQty, src: l.number, chno: M.src === 'sales-orders' ? '' : l.number.replace(/\/\d{2}-\d{2}$/, ''), chdt: M.src === 'sales-orders' ? '' : dmy(l.date) }));
      const o = rows[0];
      this.setState({ lines: lines.concat([this.blankLine()]), note: lines.length + ' line' + (lines.length === 1 ? '' : 's') + ' brought in from ' + [...new Set(rows.map((r) => r.number))].join(', '), err: false,
        f: { ...f, sourceId: billId ? String(billId) : f.sourceId, refNo: M.src === 'sales-orders' ? (f.refNo || o.number) : f.refNo, refDate: M.src === 'sales-orders' ? (f.refDate || dmy(o.date)) : f.refDate, transporterId: f.transporterId || (o.transporterId ? String(o.transporterId) : ''), vehicleNo: f.vehicleNo || o.vehicleNo || '' } });
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async loadBills(partyId) {
    const api = this.api(); const M = this.meta(); if (!api || !M.src || M.src === 'sales-orders' || !partyId) return;
    try { const r = await api.get('/vouchers/' + M.src, { partyId, pageSize: 200 }); this.setState({ bills: r.data.filter((b) => b.status !== 'CANCELLED') }); } catch (e) {}
  }

  setF(k, v) {
    const f = { ...this.state.f, [k]: v };
    const lk = this.state.lk;
    if (k === 'partyId' && lk) { const p = lk.ledgers.find((a) => String(a.id) === String(v)); if (p) { if (p.creditDays != null) f.creditDays = String(p.creditDays); if (p.brokerId) f.brokerId = String(p.brokerId); if (p.salesPersonId) f.salesPersonId = String(p.salesPersonId); if (p.transporterId) f.transporterId = String(p.transporterId); if (p.collectionPersonId) f.collectionPersonId = String(p.collectionPersonId); }
      f.sourceId = ''; this.setState({ bills: [] }); this.loadBills(v); }
    this.setState({ f, note: this.state.err ? '' : this.state.note, err: false });
    if (k === 'sourceId' && v) this.loadSource(v);
  }
  setLine(i, k, v) {
    const lines = this.state.lines.slice(); const l = { ...lines[i], [k]: v };
    if (k === 'name' || k === 'code') {
      const its = (this.state.lk && this.state.lk.items) || []; const q = String(v).trim().toLowerCase();
      const it = its.find((x) => x.name.toLowerCase() === q || x.code.toLowerCase() === q);
      l.itemId = it ? it.id : null;
      if (it) { l.name = it.name; l.code = it.code; l.hsn = it.hsn; l.gst = String(it.gstRate); l.unit = it.unit === 'KG' ? 'Kg' : it.unit; if (!l.rate && it.rate) l.rate = String(it.rate); if (!l.brand && it.brandId) { const b = (this.state.lk.brands || []).find((x) => x.id === it.brandId); if (b) l.brand = b.name; } }
    }
    if (k === 'cgp' || k === 'sgp') l.gst = String((Number(v) || 0) * 2);
    if (k === 'igp') l.gst = String(Number(v) || 0);
    if (k === 'schq') l.qty = v;
    lines[i] = l;
    const last = lines[lines.length - 1]; if (last.name || last.qty || last.code) lines.push(this.blankLine());
    this.setState({ lines });
  }

  body() {
    const st = this.state, f = st.f, x = st.x, K = this.kind();
    const iso = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const n = (v) => (v === '' || v === null || v === undefined ? null : Number(String(v).replace(/,/g, '')));
    const id = (v) => (v ? Number(v) : null);
    if (!f.partyId) return this.fail('Select the party');
    if (!iso(f.date)) return this.fail('Date must be dd-mm-yyyy');
    const lines = st.lines.filter((l) => l.name || l.qty || l.code);
    if (!lines.length) return this.fail('Add at least one line');
    const general = K === 'gs' || K === 'gp';
    const bad = lines.findIndex((l) => (!general && !l.itemId) || !(n(l.qty) > 0)); if (bad >= 0) return this.fail(!general && !lines[bad].itemId ? 'Pick the item from the list on line ' + (bad + 1) : 'Enter the quantity on line ' + (bad + 1));
    const ex = {}; Object.keys(x).forEach((k) => { if (x[k]) ex[k] = String(x[k]); });
    return {
      bookId: id(f.bookId), date: iso(f.date), partyId: id(f.partyId), deliveryPartyId: id(f.deliveryPartyId), millId: id(f.millId), brokerId: id(f.brokerId), salesPersonId: id(f.salesPersonId), transporterId: id(f.transporterId),
      vehicleNo: f.vehicleNo || null, lrNo: f.lrNo || null, lrDate: iso(f.lrDate), parcels: n(f.parcels), driverName: f.driverName || null, refNo: f.refNo || null, refDate: iso(f.refDate), doNo: f.doNo || null, creditDays: n(f.creditDays),
      expDeliveryDate: iso(f.expDeliveryDate), reverseCharge: !!f.reverseCharge, isTcs: !!f.isTcs, collectionPersonId: id(f.collectionPersonId), currency: f.currency || 'INR', tdsRate: K === 'gp' ? n(f.tdsRate) || 0 : undefined,
      sourceId: id(f.sourceId), deliveryAddress: f.deliveryAddress || null, remark: f.remark || null, godownId: id(f.godownId), extra: ex,
      lines: lines.map((l) => ({ itemId: l.itemId || null, accountId: general && !l.itemId ? id(f.accountId) : null, description: l.itemId ? null : l.name || l.code || null, brand: l.brand || null, lotNo: l.lot || null, grade: l.grade || null, hsn: l.hsn || null,
        unit: /^kg$/i.test(l.unit) ? 'KG' : (l.unit || null), qty: n(l.qty) || 0, rate: n(l.rate) || 0, discPct: n(l.disp) || 0, freightPct: n(l.frp) || 0, gstRate: n(l.gst) ?? 0, pcs: n(l.carton) || 0, cops: n(l.cops) || 0,
        remark1: l.remark || null, remark2: l.box || null, lrNo: l.lr || null, challanNo: l.chno || null, challanDate: iso(l.chdt), purchaseRef: l.pid || null, purchaseInvNo: l.pinv || null, sourceLineId: l.sourceLineId || null }))
    };
  }
  fail(msg) { this.setState({ note: msg, err: true }); return null; }
  async save(print) {
    const api = this.api(); const M = this.meta(); const doc = this.state.doc;
    if (!api) { this.setState({ saved: true }); return; }
    const body = this.body(); if (!body) return;
    this.setState({ busy: true, note: 'Saving…', err: false });
    try {
      const d = doc ? await api.put('/vouchers/' + M.slug + '/' + doc.id, body) : await api.post('/vouchers/' + M.slug, body);
      api.invalidate(); if (print) window.print();
      const msg = (doc ? '✓ Updated ' : '✓ Saved ') + d.number + (d.status === 'PENDING_APPROVAL' ? ' — waiting for approval' : '');
      if (doc) { this.fill(d); this.setState({ busy: false, saved: true, note: msg }); return; }
      const K = this.vd().KINDS[this.kind()]; const sfx = (this.props.theme ?? 'dark') === 'light' ? 'Light' : '';
      try { window.localStorage.setItem('yf-view-' + this.kind(), JSON.stringify({ t: Date.now(), id: d.id, no: d.number })); window.localStorage.setItem('yf-flash', msg); } catch (e) {}
      this.go(K.view + sfx + '.dc.html');
    } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  async remove() {
    const api = this.api(); const M = this.meta(); const doc = this.state.doc;
    if (!doc) { this.setState({ lines: [this.blankLine()], note: 'Cleared', err: false }); return; }
    if (!api || !window.confirm('Delete ' + doc.number + '?')) return;
    const K = this.vd().KINDS[this.kind()]; const sfx = (this.props.theme ?? 'dark') === 'light' ? 'Light' : '';
    this.setState({ busy: true });
    try { await api.del('/vouchers/' + M.slug + '/' + doc.id); api.invalidate(); this.go(K.list + sfx + '.dc.html'); } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  vd() { return this.VD(); }

  renderVals() {
    const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const kind = this.kind(); const view = this.props.mode === 'view';
    const { KINDS, makeRows } = this.VD(); const K = KINDS[kind];
    const st = this.state; const live = !!this.api() && !!st.lk; const lk = st.lk || {};
    const inr = (n, d) => { const s = Number(n || 0).toFixed(d); let [i, f] = s.split('.'); let neg = i[0] === '-'; if (neg) i = i.slice(1); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (neg ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const num = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
    const doc = st.doc;
    const REC = view ? (live ? (doc ? { no: doc.number, dt: (doc.date || '').split('-').reverse().join('-'), p: doc.partyName, st: doc.status } : { no: (st.rec && st.rec.no) || '…', dt: '', p: '' }) : (st.rec || makeRows(kind)[0])) : null;
    const f = st.f; const x = st.x;
    // ---- option lists
    const O = (list, lab) => (list || []).map((o) => ({ v: String(o.id), l: lab ? lab(o) : o.name }));
    const bookOpts = O((lk.books || []).filter((b) => b.voucherType === this.meta().type));
    const partyList = live ? (this.meta().side === 'customer' ? lk.customers : this.meta().side === 'supplier' ? lk.suppliers : lk.ledgers.filter((a) => ['CUSTOMER', 'SUPPLIER', 'BROKER', 'TRANSPORTER', 'OTHER'].indexOf(a.kind) >= 0)) : [];
    const P = live ? partyList.find((a) => String(a.id) === String(f.partyId)) : null;
    const none = (l) => [{ v: '', l }];
    const incomeAcc = live ? lk.ledgers.filter((a) => a.kind === 'INCOME' || a.kind === 'SALES') : [];
    const expenseAcc = live ? lk.ledgers.filter((a) => a.kind === 'EXPENSE' || a.kind === 'PURCHASE' || a.kind === 'ASSET') : [];
    const billOpts = (st.bills || []).map((b) => ({ v: String(b.id), l: b.number + ' · ' + inr(b.netAmount, 0) }));
    const due = (() => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(f.date || ''); if (!m) return ''; const t = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1] + num(f.creditDays))); const z = (q) => String(q).padStart(2, '0'); return z(t.getUTCDate()) + '-' + z(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear(); })();
    // live field map: label -> [key, options | 'ro' value]
    const LV = {
      'Book': ['bookId', bookOpts], 'Party': ['partyId', none('Select party…').concat(O(partyList))], 'Delivery party': ['deliveryPartyId', none('Same as party').concat(O(lk.customers))],
      'Supplier': ['millId', none('—').concat(O(lk.suppliers))], 'Agent': ['brokerId', none('Direct').concat(O(lk.brokers))], 'Sales person': ['salesPersonId', none('Select sales person').concat(O(lk.salesPersons))],
      'Transporter': ['transporterId', none('—').concat(O(lk.transporters))], 'Vehicle no.': ['vehicleNo'], 'Del. date': ['expDeliveryDate'], 'Credit days': ['creditDays'], 'Challan no. · date': ['x.challan'],
      'Order no.': kind === 'ds' ? ['refNo'] : ['x.orderNo'], 'Order date': ['refDate'], 'Inv. no.': ['refNo'], 'Inv. date': ['refDate'], 'Sch. date': ['date'], 'Sale date': ['date'], 'Rec. date': ['date'], 'Bill date': ['date'],
      'Advance settings': ['reverseCharge', [{ v: '', l: 'None' }, { v: '1', l: 'Reverse charge' }]], 'TCS applicability': ['isTcs', [{ v: '', l: 'Not applicable' }, { v: '1', l: 'Applicable 0.1%' }]], 'Is TCS?': ['isTcs', [{ v: '', l: 'No' }, { v: '1', l: 'Yes' }]],
      'D.O. no.': ['doNo'], 'Credit account': ['accountId', none('Sales (general)').concat(O(incomeAcc))], 'Debit account': ['accountId', none('Purchase (general)').concat(O(expenseAcc))],
      'Collection person': ['collectionPersonId', none('—').concat(O(lk.collectionPersons))], 'Currency': ['currency', [{ v: 'INR', l: 'INR' }, { v: 'USD', l: 'USD' }]],
      'T.D.S.': ['tdsRate', [{ v: '', l: 'None' }, { v: '1', l: '194C · 1%' }, { v: '2', l: '194C · 2%' }, { v: '10', l: '194J · 10%' }, { v: '0.1', l: '194Q · 0.1%' }]],
      'Against sale bill': ['sourceId', none('Select bill…').concat(billOpts)], 'Against pur. bill': ['sourceId', none('Select bill…').concat(billOpts)], 'L.R. no.': ['lrNo'], 'Debit note no.': ['x.debitNoteNo'],
      'Party group': ['ro', P ? P.partyGroupName || P.name : ''], 'Due date': ['ro', due], 'Sch. no.': ['ro', REC ? REC.no : st.nextNo || K.no], 'Entry no.': ['ro', REC ? REC.no : st.nextNo || K.no], 'Bill no.': ['ro', REC ? REC.no : st.nextNo || K.no]
    };
    // ---- header fields  [label, value, type, unit / alternative, role]
    const F = (l, v, t, xx, role) => ({ l, v, t: t || 'in', x: xx || '', role: role || '' });
    const FIELDS = {
      ds: [['Schedule', [F('Book', 'Dispatch schedule', 'sel', 'Dispatch schedule · job work'), F('Sch. no.', K.no, 'ro', '', 'no'), F('Sch. date', '24-10-2026', 'in', '', 'dt'), F('Order no.', '', 'in', 'e.g. SAL11838'), F('Order date', '', 'in', 'dd-mm-yyyy')]],
           ['Party', [F('Party', 'Shivam Textiles', 'sel', 'Balaji Textiles', 'party'), F('Delivery party', 'Same as party', 'sel', 'Balaji Textiles · Unit 2'), F('Supplier', 'Shree Durga Syntex', 'sel', 'Reliance Industries'), F('Agent', 'Direct', 'sel', 'Avi M'), F('Sales person', 'Manoj', 'sel', 'Avi M')]],
           ['Dispatch', [F('Transporter', 'Navkar Roadlines', 'sel', 'VRL Logistics'), F('Vehicle no.', '', 'in', 'GJ-05-AB-1234'), F('Del. date', '25-10-2026'), F('Credit days', '15', 'in', 'days'), F('Challan no. · date', '', 'in', 'CH-1181 · 24-10-2026')]]],
      gs: [['Bill', [F('Book', 'Brokerage income (Umiya)', 'sel', 'General sale (Umiya)'), F('Entry no.', K.no, 'ro', '', 'no'), F('Sale date', '24-10-2026', 'in', '', 'dt'), F('Inv. no.', K.no, 'in', '', 'inv'), F('Inv. date', '24-10-2026'), F('Advance settings', 'None', 'sel', 'Reverse charge')]],
           ['Party', [F('Party', 'Reliance Industries Ltd (Bro Silvassa)', 'sel', 'Wellknown Polyesters P Ltd', 'party'), F('Delivery party', 'Same as party', 'sel', 'Other'), F('Agent', 'Direct', 'sel', 'Avi M'), F('Sales person', 'Avi M', 'sel', 'Manoj'), F('Credit days', '30', 'in', 'days'), F('Due date', '23-11-2026', 'ro')]],
           ['Tax & account', [F('TCS applicability', 'Not applicable', 'sel', 'Applicable 0.1%'), F('D.O. no.', '', 'in', 'Delivery order no.'), F('Credit account', 'Brokerage income', 'sel', 'Commission income'), F('Collection person', 'Prakash P. RTGS', 'sel', 'Hitesh B.'), F('Currency', 'INR', 'sel', 'USD')]]],
      gp: [['Bill', [F('Book', 'General purchase (Umiya)', 'sel', 'Expense purchase'), F('Entry no.', K.no, 'ro', '', 'no'), F('Rec. date', '24-10-2026', 'in', '', 'dt'), F('Inv. no.', '', 'in', 'Supplier invoice no.', 'inv'), F('Inv. date', '24-10-2026'), F('Advance settings', 'None', 'sel', 'Reverse charge')]],
           ['Party', [F('Party', 'Swastik Transport Service (Transporter)', 'sel', 'Purohit Hansraj Velaji', 'party'), F('Delivery party', 'Our godown · Sachin GIDC', 'sel', 'Direct'), F('Agent', 'Direct', 'sel', 'Henil'), F('Sales person', '', 'sel', 'Meera Patel'), F('Credit days', '15', 'in', 'days'), F('Due date', '08-11-2026', 'ro')]],
           ['Tax & account', [F('TCS applicability', 'Not applicable', 'sel', 'Applicable'), F('D.O. no.', '', 'in', 'Delivery order no.'), F('Debit account', 'Freight inward', 'sel', 'Packing material'), F('T.D.S.', '194C · 2%', 'sel', 'None'), F('Currency', 'INR', 'sel', 'USD')]]],
      sr: [['Return', [F('Book', 'Sales yarn return', 'sel', 'Sales return · job work'), F('Bill no.', K.no, 'ro', '', 'no'), F('Bill date', '24-10-2026', 'in', '', 'dt'), F('Is TCS?', 'No', 'sel', 'Yes'), F('Credit days', '1', 'in', 'days'), F('Due date', '25-10-2026', 'ro')]],
           ['Party', [F('Party', 'Omly Fashion (34-35)', 'sel', 'Diya Textiles', 'party'), F('Delivery party', 'Same as party', 'sel', 'Other'), F('Agent', 'Direct', 'sel', 'Avi M'), F('Party group', 'Omly Fashion', 'ro'), F('Sales person', 'Manoj', 'sel', 'Aelish')]],
           ['Reference', [F('Against sale bill', 'GU00425/26-27', 'sel', 'GU00830/26-27'), F('Order no.', 'SAL02722', 'in'), F('Transporter', 'Navkar Roadlines', 'sel', 'VRL Logistics'), F('L.R. no.', '', 'in', 'LR no.'), F('Vehicle no.', 'GJ19X-4120')]]],
      pr: [['Return', [F('Book', 'Purchase yarn return', 'sel', 'Purchase return · job work'), F('Entry no.', K.no, 'ro', '', 'no'), F('Rec. date', '24-10-2026', 'in', '', 'dt'), F('Inv. no.', K.no, 'in', '', 'inv'), F('Inv. date', '24-10-2026'), F('TCS applicability', 'Not applicable', 'sel', 'Applicable')]],
           ['Party', [F('Party', 'Shree Durga Syntex Pvt Ltd', 'sel', 'Sanathan Textiles Limited', 'party'), F('Delivery party', 'Same as party', 'sel', 'Other'), F('Agent', 'Direct', 'sel', 'Henil'), F('Sales person', '', 'sel', 'Meera Patel'), F('Credit days', '30', 'in', 'days'), F('Due date', '23-11-2026', 'ro')]],
           ['Reference', [F('Against pur. bill', 'PUR21326/26-27', 'sel', 'PUR21311/26-27'), F('Debit note no.', 'DN-0441', 'in'), F('Transporter', 'Jay Ambe Roadlines', 'sel', 'Navkar Roadlines'), F('L.R. no.', 'LR-4410'), F('Vehicle no.', 'GJ05-CT-1184')]]]
    }[kind];
    const recVal = (fd) => { if (!REC) return fd.role === 'party' ? 'Select party…' : fd.v; if (fd.role === 'no') return REC.no; if (fd.role === 'dt') return REC.dt; if (fd.role === 'party') return REC.p; if (fd.role === 'inv') return REC.inv || REC.no; return fd.v; };
    const groups = FIELDS.map(([t, rows], gi) => ({ t, rows: rows.map((fd) => {
      const unit = fd.t === 'in' && fd.x === 'days' ? 'days' : '';
      if (live) {
        const m = LV[fd.l] || ['x.' + fd.l.replace(/[^a-z]/gi, '')]; const key = m[0];
        if (key === 'ro' || fd.t === 'ro') return { l: fd.l, v: key === 'ro' ? m[1] : '', alt: '', isSel: false, isIn: false, isRo: true, ph: '', u: unit, opts: [], on: () => {} };
        const isX = key.indexOf('x.') === 0; const k2 = isX ? key.slice(2) : key; const val = isX ? x[k2] ?? '' : f[k2] ?? '';
        const on = (e) => (isX ? this.setState({ x: { ...this.state.x, [k2]: e.target.value } }) : this.setF(k2, e.target.value));
        return { l: fd.l, v: val, alt: '', isSel: !!m[1], isIn: !m[1], isRo: false, ph: fd.t === 'in' && fd.x !== 'days' ? fd.x : /date/i.test(fd.l) ? 'dd-mm-yyyy' : '', u: unit, opts: m[1] || [], on };
      }
      const v = (!REC && gi === 1 && fd.t !== 'sel') ? '' : (!REC && gi === 1 && fd.t === 'sel' && /Sales person/.test(fd.l)) ? 'Select sales person' : recVal(fd);
      return { l: fd.l, v, alt: fd.x, isSel: fd.t === 'sel', isIn: fd.t === 'in', isRo: fd.t === 'ro', ph: fd.t === 'in' && fd.x !== 'days' ? fd.x : '', u: unit, opts: [{ v: v, l: v }, { v: fd.x, l: fd.x }], on: () => {} }; }) }));
    // ---- item columns  [key, label, right, total, decimals, input width]
    const C = (k, l, o) => Object.assign({ k, l, r: 0, t: 0, d: 2, w: 0 }, o || {});
    const RT = (d) => ({ r: 1, t: 1, d }), RN = (d) => ({ r: 1, d });
    const GST = [C('basic', 'Basic amt', RT(2)), C('disp', 'Dis %', RN(2)), C('dis', 'Dis ₹', RT(2)), C('frp', 'Freight %', RN(2)), C('fr', 'Freight ₹', RT(2)), C('tax', 'Taxable', RT(2)), C('igp', 'IGST %', RN(2)), C('ig', 'IGST ₹', RT(2)), C('cgp', 'CGST %', RN(2)), C('cg', 'CGST ₹', RT(2)), C('sgp', 'SGST %', RN(2)), C('sg', 'SGST ₹', RT(2))];
    const COLS = {
      ds: [C('name', 'Item name', { w: 150 }), C('brand', 'Brand'), C('lot', 'Lot no.'), C('hsn', 'HSN'), C('pid', 'Purchase id'), C('pinv', 'Pur. inv. no.'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('unit', 'Unit', { w: 56 }), C('grade', 'Grade', { w: 56 }), C('ordq', 'Ord. qty', RT(3)), C('salq', 'Sal. qty', RT(3)), C('rate', 'Rate', RN(2)), C('carton', 'Carton', RT(0)), C('schq', 'Sch. qty', RT(3)), C('pschq', 'Pending sch. qty', RT(3)), C('lr', 'LR no.'), C('remark', 'Remark'), C('box', 'Box / pallet'), C('cops', 'Cops', RT(0)), C('amt', 'Amount', RT(2))],
      gs: [C('code', 'Item code'), C('name', 'Item name', { w: 160 }), C('hsn', 'HSN'), C('unit', 'Unit', { w: 56 }), C('remark', 'Remark'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('qty', 'Qty', RT(2)), C('rate', 'Rate', RN(2))].concat(GST, [C('tcp', 'TCS %', RN(3)), C('tc', 'TCS \u20b9', RT(2)), C('amt', 'Amount', RT(2))]),
      gp: [C('code', 'Item code'), C('name', 'Item name', { w: 160 }), C('brand', 'Brand'), C('grade', 'Grade', { w: 56 }), C('hsn', 'HSN'), C('unit', 'Unit', { w: 56 }), C('lr', 'L.R. no.'), C('remark', 'Remark'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('lot', 'Lot no.'), C('carton', 'Carton', RT(0)), C('cops', 'Cops', RT(0)), C('qty', 'Weight / qty', RT(3)), C('rate', 'Rate', RN(2))].concat(GST, [C('amt', 'Amount', RT(2))]),
      sr: [C('code', 'Item id'), C('name', 'Item name', { w: 150 }), C('pid', 'Purchase id'), C('brand', 'Brand'), C('pinv', 'Pur. inv. no.'), C('hsn', 'HSN'), C('grade', 'Grade', { w: 56 }), C('unit', 'Unit', { w: 56 }), C('remark', 'Remark'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('lot', 'Lot no.'), C('carton', 'Carton', RT(0)), C('cops', 'Cops', RT(0)), C('qty', 'Weight', RT(3)), C('rate', 'Rate', RN(2))].concat(GST, [C('amt', 'Amount', RT(2))]),
      pr: null
    };
    COLS.pr = COLS.gp;
    const cols = COLS[kind];
    const inter = live && P && P.stateCode && lk.companyStateCode ? P.stateCode !== lk.companyStateCode : false;
    const SAMPLE = {
      ds: [{ name: '50/24 FDY', brand: 'Durga', lot: 'SDS3001', hsn: '5402', pid: 'P-2214', pinv: '2526057', chno: 'CH-1181', chdt: '24-10-2026', unit: 'Kg', grade: 'F1', ordq: 5000, salq: 3995.98, rate: 154.5, carton: 24, schq: 1004.02, lr: '', remark: '', box: 'Carton', cops: 96 },
           { name: '55/48 FDY', brand: 'Durga', lot: 'SDS3056', hsn: '5402', pid: 'P-2219', pinv: '2526061', chno: 'CH-1181', chdt: '24-10-2026', unit: 'Kg', grade: 'F1', ordq: 3000, salq: 2018.92, rate: 154.25, carton: 25, schq: 981.08, lr: '', remark: 'Urgent', box: 'Carton', cops: 100 }],
      gs: [{ code: 'BRK-01', name: 'Brokerage · yarn sale', hsn: '996111', unit: 'Nos', remark: 'Oct-26', chno: '', chdt: '', qty: 1, rate: 8220, disp: 0, frp: 0, gst: 18 },
           { code: 'BRK-02', name: 'Brokerage · FDY lots', hsn: '996111', unit: 'Nos', remark: 'Oct-26', chno: '', chdt: '', qty: 1, rate: 32809, disp: 0, frp: 0, gst: 18 }],
      gp: [{ code: 'GP-014', name: 'GTA freight · Surat–Silvassa', brand: '', grade: '', hsn: '996511', unit: 'Trip', lr: 'L13029', remark: '4 trips', chno: '', chdt: '', lot: '', carton: 0, cops: 0, qty: 4, rate: 7341.5, disp: 0, frp: 0, gst: 5 },
           { code: 'GP-022', name: 'Packing cartons · 5 ply', brand: 'Om Pack', grade: '', hsn: '4819', unit: 'Nos', lr: '', remark: '', chno: 'CH-77', chdt: '22-10-2026', lot: '', carton: 0, cops: 0, qty: 400, rate: 21.5, disp: 2, frp: 0, gst: 18 }],
      sr: [{ code: 'I-501', name: '50/48 FDY', pid: 'P-2201', brand: 'Reliance', pinv: 'RIL/88761', hsn: '5402', grade: 'A+', unit: 'Kg', remark: 'Shade issue', chno: 'CH-990', chdt: '09-04-2026', lot: '338C1M', carton: 6, cops: 72, qty: 345.58, rate: 152, disp: 0, frp: 0, gst: 5 },
           { code: 'I-418', name: '75/36 FDY', pid: 'P-2188', brand: 'Reliance', pinv: 'RIL/88540', hsn: '5402', grade: 'A+', unit: 'Kg', remark: 'Weak cops', chno: 'CH-987', chdt: '08-04-2026', lot: '316C1S', carton: 2, cops: 24, qty: 118.4, rate: 138, disp: 0, frp: 0, gst: 5 }],
      pr: [{ code: 'I-705', name: '75/72 Roto', brand: 'Shree Durga', grade: '1ST', hsn: '5402', unit: 'Kg', lr: 'LR-4410', remark: 'Short lot', chno: '', chdt: '', lot: 'TX3545', carton: 34, cops: 408, qty: 1010.34, rate: 142.74, disp: 0, frp: 0, gst: 5 },
           { code: 'I-702', name: '50/24 FDY', brand: 'Shree Durga', grade: 'F1', hsn: '5402', unit: 'Kg', lr: 'LR-4410', remark: '', chno: '', chdt: '', lot: 'SDS3001', carton: 12, cops: 144, qty: 351.22, rate: 154.5, disp: 0, frp: 0, gst: 5 }]
    }[kind];
    const calc = (o) => { if (kind === 'ds') { o.pschq = Math.max(0, Math.round(((o.ordq || 0) - (o.salq || 0) - (o.schq || 0)) * 1000) / 1000); o.amt = (o.schq || 0) * (o.rate || 0); return o; }
      o.basic = o.qty * o.rate; o.dis = o.basic * (o.disp || 0) / 100; o.fr = o.basic * (o.frp || 0) / 100; o.tax = o.basic - o.dis + o.fr;
      o.igp = inter ? o.gst : 0; o.ig = inter ? o.tax * o.gst / 100 : 0; o.cgp = inter ? 0 : o.gst / 2; o.sgp = o.cgp; o.cg = inter ? 0 : o.tax * o.gst / 200; o.sg = o.cg; o.tcp = 0; o.tc = 0; o.amt = o.tax + o.ig + o.cg + o.sg + o.tc; return o; };
    const L = live ? st.lines.filter((l) => l.name || l.qty || l.code).map((l) => calc({ ...l, lot: l.lot, ordq: num(l.ordq), salq: num(l.salq), schq: num(l.qty), qty: num(l.qty), rate: num(l.rate), disp: num(l.disp), frp: num(l.frp), gst: num(l.gst), carton: num(l.carton), cops: num(l.cops) }))
      : SAMPLE.filter(() => view).map((o0) => calc(Object.assign({}, o0)));
    const fmt = (c, v) => (typeof v === 'number' ? inr(v, c.d) : (v === '' || v == null ? '—' : v));
    const ED = { name: 1, code: 1, brand: 1, lot: 1, grade: 1, hsn: 1, unit: 1, remark: 1, chno: 1, chdt: 1, qty: 1, rate: 1, disp: 1, frp: 1, carton: 1, cops: 1, schq: 1, lr: 1, box: 1, pid: 1, pinv: 1, cgp: 1, sgp: 1, igp: 1 };
    const cellCls = (c) => (c.r ? 'r' : '') + (c.k === 'name' ? ' nm' : '') + (['hsn', 'chno', 'chdt', 'pid', 'pinv', 'lr', 'remark', 'code'].indexOf(c.k) >= 0 ? ' t2' : '');
    const colW = (c) => (c.w ? 'width: ' + c.w + 'px' : (c.r ? 'width: 84px' : 'width: 96px'));
    let lines;
    if (live) {
      lines = st.lines.map((l, i) => { const blank = !l.name && !l.qty && !l.code; const o = blank ? {} : calc({ ...l, ordq: num(l.ordq), salq: num(l.salq), schq: num(l.qty), qty: num(l.qty), rate: num(l.rate), disp: num(l.disp), frp: num(l.frp), gst: num(l.gst), carton: num(l.carton), cops: num(l.cops) });
        return { n: String(i + 1), cells: cols.map((c, ci) => { const ed = !!ED[c.k] && !(c.k === 'igp' && !inter) && !((c.k === 'cgp' || c.k === 'sgp') && inter);
          const raw = c.k === 'schq' ? l.qty : c.k === 'cgp' || c.k === 'sgp' ? (blank ? '' : String(num(l.gst) / 2)) : c.k === 'igp' ? (blank ? '' : l.gst) : l[c.k];
          return { ed, ro: !ed, v: ed ? (raw ?? '') : blank ? '' : fmt(c, o[c.k]), cls: cellCls(c), ic: c.r ? 'cin r' : 'cin', w: colW(c), ph: blank ? (ci === 0 ? (kind === 'ds' ? 'Search item' : 'Code') : (ci === 1 && kind !== 'ds' ? 'Search item' : '')) : '', dl: c.k === 'name' || c.k === 'code' ? 've-items' : '', on: (e) => this.setLine(i, c.k, e.target.value) }; }) }; });
    } else {
      lines = L.map((o, i) => ({ n: String(i + 1), cells: cols.map((c) => ({ ed: false, ro: true, v: fmt(c, o[c.k]), cls: cellCls(c), ic: 'cin', w: '', ph: '', dl: '', on: () => {} })) }))
        .concat([{ n: String(L.length + 1), cells: cols.map((c, i) => ({ ed: true, ro: false, v: c.k === 'unit' ? (kind === 'gs' ? 'Nos' : 'Kg') : '', cls: '', ic: 'cin', w: colW(c), ph: i === 0 ? (kind === 'ds' ? 'Search item' : 'Code') : (i === 1 && kind !== 'ds' ? 'Search item' : ''), dl: '', on: () => {} })) }]);
    }
    const tot = (k) => L.reduce((a, o) => a + (Number(o[k]) || 0), 0);
    const foot = cols.map((c, i) => ({ cls: c.r ? 'r' : '', v: i === 0 ? 'Total · ' + L.length + ' lines' : c.t ? inr(tot(c.k), c.d) : '' }));
    // ---- bottom boxes
    const KV = (a, b, big) => ({ a, b, c: big ? 'kv big' : 'kv' });
    const FB = { 'Delivery address': 'deliveryAddress', 'Remarks': 'remark', 'Grade detail': 'x.gradeDetail', 'Transporter': kind === 'gs' || kind === 'gp' ? 'x.transporterName' : 'x.transporterNote', 'L.R. no.': 'lrNo', 'L.R. date': 'lrDate', 'No. of parcel': 'parcels', 'Driver name': 'driverName', 'E-way bill no.': 'x.ewbNo', 'Vehicle no.': 'vehicleNo', 'Godown': 'x.godown', 'IRN no.': 'x.irn' };
    const FL = (a, b, ph) => { const key = FB[a]; if (!live || !key) return { a, b: b || '', ph: ph || '', on: () => {} }; const isX = key.indexOf('x.') === 0; const k2 = isX ? key.slice(2) : key;
      return { a, b: isX ? x[k2] ?? '' : f[k2] ?? '', ph: ph || '', on: (e) => (isX ? this.setState({ x: { ...this.state.x, [k2]: e.target.value } }) : this.setF(k2, e.target.value)) }; };
    let boxes;
    if (kind === 'ds') {
      boxes = [{ t: 'Delivery', kv: [], gs: 'grid-template-columns: 1fr', fl: [FL('Delivery address', live ? '' : '28 Vishal Nagar, Sachin GIDC, Surat'), FL('Remarks', '', 'Shown on schedule print'), FL('Grade detail', live ? '' : 'F1 · 49 cartons')] },
               { t: 'Carton detail', kv: [KV('Cartons', inr(tot('carton'), 0)), KV('Cops', inr(tot('cops'), 0)), KV('Box / pallet', live ? ([...new Set(L.map((o) => o.box).filter(Boolean))].join(', ') || 'Carton') : 'Carton'), KV('Avg kg / carton', inr(tot('schq') / Math.max(tot('carton'), 1), 3))], fl: [], gs: '' },
               { t: 'Schedule summary', kv: [KV('Ordered qty', inr(tot('ordq'), 3) + ' kg'), KV('Already sold', inr(tot('salq'), 3) + ' kg'), KV('Pending after this', inr(tot('pschq'), 3) + ' kg'), KV('Schedule amount', '₹ ' + inr(tot('amt'), 2), 1)], fl: [], gs: '' }];
    } else {
      const g = tot('cg') + tot('sg') + tot('ig'); const tcs = live && f.isTcs ? tot('amt') * 0.001 : 0; const net = Math.round(tot('amt') + tcs); const tdsR = live ? num(f.tdsRate) : 2;
      const taxKV = [KV('Total CGST', '₹ ' + inr(tot('cg'), 2)), KV('Total SGST', '₹ ' + inr(tot('sg'), 2)), KV('Total IGST', '₹ ' + inr(tot('ig'), 2)), KV('Total taxable', '₹ ' + inr(tot('tax'), 2))]
        .concat(kind === 'gp' ? [KV('T.D.S. basic', '₹ ' + inr(tot('tax'), 2)), KV('T.D.S. ' + tdsR + '%', '₹ ' + inr(tot('tax') * tdsR / 100, 2))] : [KV('Total TCS', '₹ ' + inr(tcs, 2))], [KV('Average rate', inr(tot('basic') / Math.max(tot('qty'), 1), 2))]);
      const other = [FL('Transporter', kind === 'gs' || live ? '' : 'Navkar Roadlines'), FL('L.R. no.', '', 'LR no.'), FL('L.R. date', '', 'dd-mm-yyyy'), FL('No. of parcel', ''), FL('Driver name', ''), FL('E-way bill no.', '', '12 digits'), FL('Vehicle no.', '', 'GJ-05-AB-1234'), FL(kind === 'gp' || kind === 'pr' ? 'Godown' : 'IRN no.', (kind === 'gp' || kind === 'pr') && !live ? 'Sachin GIDC' : '')];
      boxes = [{ t: 'Tax summary', kv: taxKV, fl: [], gs: '' }, { t: 'Other details', kv: [], fl: other, gs: '' },
               { t: 'Amount', kv: [KV('Quantity', inr(tot('qty'), kind === 'gs' ? 2 : 3)), KV('Gross amount', '₹ ' + inr(tot('basic'), 2)), KV('Discount', '− ₹ ' + inr(tot('dis'), 2)), KV('GST', '₹ ' + inr(g, 2)), KV('Round off', (net - tot('amt') - tcs >= 0 ? '+ ' : '− ') + inr(Math.abs(net - tot('amt') - tcs), 2)), KV('Net amount', '₹ ' + inr(net, 2), 1)], fl: [], gs: '' }];
    }
    const HB = { ds: ['Pending orders', 'Outstanding group-wise'], gs: ['Pending GRN', 'Order detail'], gp: ['Pending GRN', 'Pending approval'], sr: ['E-invoice', 'Pending challans'], pr: ['Pending GRN', 'Sales detail'] }[kind];
    const hb = HB.map((l, i) => ({ l, on: () => {
      if (!live) return;
      if (i === 0 && (kind === 'ds' || kind === 'pr')) return this.loadSource(f.sourceId || null);
      if (i === 1 && kind === 'sr') return this.loadSource(f.sourceId || null);
      if (i === 1 && kind === 'ds') return this.go('Outstanding' + sfx + '.dc.html');
      if (i === 1 && kind === 'gp') return this.go('Approvals' + sfx + '.dc.html');
      if (i === 0 && kind === 'sr') return doc ? this.setState({ note: 'E-invoice for credit notes is filed from the GST portal export (Reports → GSTR-1)', err: false }) : this.setState({ note: 'Save the return first', err: true });
      if (i === 1 && kind === 'pr') return this.go('Reports' + sfx + '.dc.html');
      this.setState({ note: kind === 'gs' || kind === 'gp' ? 'General bills are entered directly — there is no order or GRN to pull from' : '', err: false }); } }));
    const saved = st.saved;
    const STL = { POSTED: 'Saved', OPEN: 'Open', PARTIAL: 'Part billed', COMPLETED: 'Closed', PENDING_APPROVAL: 'Hold · approval', CANCELLED: 'Cancelled', LOCKED: 'Locked', REJECTED: 'Rejected' };
    const tagL = view ? (live ? (doc ? STL[doc.status] || doc.status : '…') : (REC.st || REC.sign || 'Saved')) : 'New';
    const itemOpts = live ? (lk.items || []).filter((i) => (kind === 'gs' || kind === 'gp') ? true : !i.isGeneral).map((i) => ({ l: i.name, d: i.code })) : [];
    return {
      theme, kind, listHref: K.list + sfx + '.dc.html', aiPage: { ds: 'so', gs: 'disp', sr: 'disp', gp: 'pb', pr: 'pb' }[kind],
      crumb: view ? K.reg : K.mod + ' · ' + K.title, title: view ? REC.no : 'New ' + K.title.charAt(0).toLowerCase() + K.title.slice(1),
      tagL, tagC: 'tag' + (view ? (tagL === 'Cancelled' || tagL === 'Rejected' ? ' t-red' : tagL.indexOf('Hold') === 0 ? ' t-orange' : ' t-blue') : ''),
      hbtn: hb, detailsT: { ds: 'Schedule details', gs: 'Bill details', gp: 'Bill details', sr: 'Return details', pr: 'Return details' }[kind],
      groups, cols: cols.map((c) => ({ l: c.l, cls: c.r ? 'r' : '' })), itemOpts,
      lines, foot: L.length ? foot : cols.map((c2, i) => ({ cls: c2.r ? 'r' : '', v: i === 0 ? 'Total' : (c2.t ? inr(0, c2.d) : '') })), boxes,
      closeL: view ? 'Close' : 'Cancel', printL: view ? 'Print' : 'Save & print', saveL: st.busy ? 'Saving…' : view ? (saved ? '✓ Updated' : 'Update') : (saved ? '✓ Saved' : 'Save'), busy: !!st.busy,
      note: st.note || (view ? (saved ? 'Changes saved to ' + REC.no : 'Editing ' + REC.no) : (saved ? 'Saved as ' + K.no : '')), noteCls: st.err ? 'tag t-red' : 'muted',
      save: () => this.save(false), print: () => (view ? window.print() : this.save(true)), remove: () => this.remove()
    };
  }
}

/* ----- view ----- */
class VoucherEntryView extends Component {
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
              <DcLink className="m" href={v.listHref}>
                {v.crumb}
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                {v.title}
              </span>
              <span className={v.tagC}>
                {v.tagL}
              </span>
            </div>
            <DcLink className="btn" href={v.listHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M8 6h13" />
                <path d="M8 12h13" />
                <path d="M8 18h13" />
                <path d="M3 6h.01" />
                <path d="M3 12h.01" />
                <path d="M3 18h.01" />
              </svg>
              Show record
            </DcLink>
            {' '}
            {(v.hbtn || []).map((b, $index) => (
              <Fragment key={$index}>
                <button className="btn" type="button" onClick={b?.on}>
                  {b?.l}
                </button>
              </Fragment>
            ))}
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Upload
            </button>
          </header>
          <div className="ent">
            <section className="sec">
              <div className="sh">
                <h2>
                  {v.detailsT}
                </h2>
              </div>
              <div className="props">
                {(v.groups || []).map((g, $index) => (
                  <Fragment key={$index}>
                    <div className="pg">
                      <div className="pgt">
                        {g?.t}
                      </div>
                      {(g?.rows || []).map((f, $index) => (
                        <Fragment key={$index}>
                          <div className="pr">
                            <label>
                              {f?.l}
                            </label>
                            {f?.isSel ? (
                              <>
                                <select className="pv" aria-label={f?.l} value={f?.v} onChange={f?.on}>
                                  {(f?.opts || []).map((o, $index) => (
                                    <Fragment key={$index}>
                                      <option value={o?.v}>
                                        {o?.l}
                                      </option>
                                    </Fragment>
                                  ))}
                                </select>
                              </>
                            ) : null}
                            {f?.isIn ? (
                              <>
                                <input className="pv" type="text" value={f?.v} placeholder={f?.ph} aria-label={f?.l} onChange={f?.on} />
                              </>
                            ) : null}
                            {f?.isRo ? (
                              <>
                                <input className="pv" type="text" value={f?.v} readOnly aria-label={f?.l} />
                              </>
                            ) : null}
                            <span className="unit">
                              {f?.u}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>
            </section>
            <section className="sec items">
              <div className="sh">
                <h2>
                  Items
                </h2>
              </div>
              <datalist id="ve-items">
                {(v.itemOpts || []).map((o, $index) => (
                  <Fragment key={$index}>
                    <option value={o?.l}>
                      {o?.d}
                    </option>
                  </Fragment>
                ))}
              </datalist>
              <div className="tw">
                <table className="it">
                  <thead>
                    <tr>
                      <th>
                        #
                      </th>
                      {(v.cols || []).map((c, $index) => (
                        <Fragment key={$index}>
                          <th className={c?.cls}>
                            {c?.l}
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(v.lines || []).map((r, $index) => (
                      <Fragment key={$index}>
                        <tr>
                          <td className="n">
                            {r?.n}
                          </td>
                          {(r?.cells || []).map((x, $index) => (
                            <Fragment key={$index}>
                              {x?.ro ? (
                                <>
                                  <td className={x?.cls}>
                                    {x?.v}
                                  </td>
                                </>
                              ) : null}
                              {x?.ed ? (
                                <>
                                  <td>
                                    <input className={x?.ic} type="text" value={x?.v} placeholder={x?.ph} style={sx(x?.w)} list={x?.dl} onChange={x?.on} />
                                  </td>
                                </>
                              ) : null}
                            </Fragment>
                          ))}
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td />
                      {(v.foot || []).map((x, $index) => (
                        <Fragment key={$index}>
                          <td className={x?.cls}>
                            {x?.v}
                          </td>
                        </Fragment>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
            <section className="sec">
              <div className="cols3">
                {(v.boxes || []).map((b, $index) => (
                  <Fragment key={$index}>
                    <div className="box">
                      <h3>
                        {b?.t}
                      </h3>
                      {(b?.kv || []).map((k, $index) => (
                        <Fragment key={$index}>
                          <div className={k?.c}>
                            <span>
                              {k?.a}
                            </span>
                            <span>
                              {k?.b}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                      <div className="flg" style={sx(b?.gs)}>
                        {(b?.fl || []).map((k, $index) => (
                          <Fragment key={$index}>
                            <div className="fl">
                              <label>
                                {k?.a}
                              </label>
                              <input className="inp" type="text" value={k?.b} placeholder={k?.ph} aria-label={k?.a} onChange={k?.on} />
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </section>
          </div>
          <div className="actbar">
            <select className="inp" aria-label="More actions">
              <option>
                More…
              </option>
              <option>
                Party details
              </option>
              <option>
                Adjustment details
              </option>
            </select>
            {' '}
            <button className="btn no" type="button" onClick={v.remove} disabled={v.busy}>
              Delete
            </button>
            <div style={{"flex":"1"}} />
            <span className={v.noteCls} style={{"fontSize":"13px","maxWidth":"340px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}} role="status" title={v.note}>
              {v.note}
            </span>
            {' '}
            <DcLink className="btn gh" href={v.listHref}>
              {v.closeL}
            </DcLink>
            {' '}
            <button className="btn" type="button" onClick={v.print} disabled={v.busy}>
              {v.printL}
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.save} disabled={v.busy}>
              {v.saveL}
            </button>
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

export default function VoucherEntry(props) {
  const theme = useTheme();
  return <VoucherEntryView {...props} theme={theme} />;
}
