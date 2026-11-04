/* eslint-disable */
// Dispatch — converted 1:1 from the YarnFlow design (Dispatch.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Dispatch.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) {
    super(p);
    this.state = { z: 1, more: false, hist: true, tcs: false, tab: 'sum', pick: null, sel: p.startPicker ? [] : ['SAL11842'], qty: p.startPicker ? {} : { SAL11842: '619.430' }, draft: null, dqty: null,
      f: {}, x: {}, note: '', err: false, busy: false, mq: '', mp: '', mt: '' };
  }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  today() { const t = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(t.getDate()) + '-' + z(t.getMonth() + 1) + '-' + t.getFullYear(); }
  sfx() { return (this.props.theme ?? 'dark') === 'light' ? 'Light' : ''; }

  componentDidMount() {
    const api = this.api();
    if (api) { this.setState({ sel: [], qty: {}, f: { date: this.today() } }); this.init(); }
    if (!this.props.startPicker) {
      const rd = () => { try { const raw = window.localStorage.getItem('yf-open-sb'); if (raw && raw !== this._raw) { this._raw = raw; const r = JSON.parse(raw); this.setState({ brec: r, upd: false }); if (api && r.id) this.openBill(r.id); } } catch (e) {} };
      this._rd = rd; rd(); this._iv = setInterval(rd, 700); try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {}
    }
    try { const b = JSON.parse(window.localStorage.getItem('yf-back') || 'null'); if (b && b.href) this.setState({ back: b }); } catch (e) {}
    try { const fl = window.localStorage.getItem('yf-flash'); if (fl) { window.localStorage.removeItem('yf-flash'); this.setState({ note: fl }); } } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }

  async init() {
    const api = this.api(); if (!api) return;
    try {
      const [lk, pl, co, list] = await Promise.all([api.lookups(), api.get('/vouchers/dispatch-schedules/pending-lines', { for: 'sale-bills' }), api.get('/company'), api.get('/vouchers/sale-bills', { pageSize: 1000 })]);
      const book = lk.books.find((b) => b.voucherType === 'SALE_BILL' && b.isDefault) || lk.books.find((b) => b.voucherType === 'SALE_BILL');
      this.setState({ lk, pl, co, bills: list.data, f: { ...this.state.f, bookId: this.state.f.bookId || (book ? String(book.id) : '') } });
      if (!this.state.doc) { const nx = await api.get('/vouchers/sale-bills/next-number', book ? { bookId: book.id } : undefined); this.setState({ nextNo: nx.number }); }
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async reloadPending() { const api = this.api(); if (!api) return; try { this.setState({ pl: await api.get('/vouchers/dispatch-schedules/pending-lines', { for: 'sale-bills' }) }); } catch (e) {} }

  async openBill(id) {
    const api = this.api(); if (!api) return;
    try { const d = await api.get('/vouchers/sale-bills/' + id); this.fill(d); this.loadParty(d.partyId); } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  fill(d) {
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    const dmy = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('-') : '');
    const rows = d.lines.map((l) => ({ key: 'L' + l.id, lineId: l.id, sourceLineId: l.sourceLineId, no: (l.orderNumber || '—').replace(/\/\d{2}-\d{2}$/, ''), ch: l.sourceNumber || l.challanNo || '—', dt: dmy(d.date), dsdt: dmy(l.challanDate || d.date),
      p: d.partyName, partyId: d.partyId, it: l.itemName || l.description || '', itemId: l.itemId, iid: l.itemCode || '—', br: l.brand || '—', lot: l.lotNo || '—', gr: l.grade || '—', hsn: l.hsn || '—', unit: l.unit, rate: Number(l.rate),
      oq: Number(l.qty), dq: 0, sq: Number(l.qty), ctn: Number(l.pcs) || 0, cops: Number(l.cops) || 0, gstRate: Number(l.gstRate), discPct: Number(l.discPct) || 0, freightPct: Number(l.freightPct) || 0, insPct: Number(l.insurancePct) || 0,
      pid: l.purchaseRef || '—', pinv: l.purchaseInvNo || '—', rem: l.remark1 || '—', godownId: l.godownId }));
    const qty = {}; rows.forEach((r) => { qty[r.key] = String(r.sq); });
    this.setState({ doc: d, docRows: rows, sel: rows.map((r) => r.key), qty, tcs: !!d.isTcs,
      f: { bookId: s(d.bookId), date: dmy(d.date), addLess: d.addLess ? s(d.addLess) : '', remark: s(d.remark), opportunityNo: s(d.opportunityNo), transporterId: s(d.transporterId), lrNo: s(d.lrNo), lrDate: dmy(d.lrDate), vehicleNo: s(d.vehicleNo),
        driverName: s(d.driverName), parcels: d.parcels ? s(d.parcels) : '', refNo: s(d.refNo), collectionPersonId: s(d.collectionPersonId), deliveryPartyId: s(d.deliveryPartyId), distanceKm: s(d.distanceKm) },
      x: { ...(d.extra || {}) } });
  }
  async loadParty(id) {
    const api = this.api(); if (!api || !id || (this.state.ps || {})[id]) return;
    try { const sm = await api.get('/accounts/' + id + '/summary'); this.setState({ ps: { ...(this.state.ps || {}), [id]: sm } }); } catch (e) {}
  }

  /** rows the user can pick: pending dispatch-schedule lines (app) or the sample orders (canvas) */
  rowsLive() {
    const st = this.state; const lk = st.lk; if (!lk) return [];
    const cust = new Map(lk.customers.map((c) => [c.id, c]));
    const dmy = (iso) => String(iso).slice(0, 10).split('-').reverse().join('-');
    const days = (iso) => Math.max(0, Math.round((Date.now() - new Date(String(iso).slice(0, 10) + 'T00:00:00').getTime()) / 864e5));
    const out = (st.pl || []).map((l) => { const c = cust.get(l.partyId) || {}; const d = days(l.date); const ctn = l.pcs ? Math.max(1, Math.round(l.pcs * l.pendingQty / Math.max(l.qty, 0.001))) : 0;
      return { key: String(l.lineId), sourceLineId: l.lineId, no: (l.orderNumber || '—').replace(/\/\d{2}-\d{2}$/, ''), ch: l.number.replace(/\/\d{2}-\d{2}$/, ''), dt: dmy(l.date), dsdt: dmy(l.date), age: d === 0 ? 'today' : d === 1 ? '1 day' : d + ' days',
        p: l.partyName, partyId: l.partyId, g: c.partyGroupName || l.partyName, dp: l.deliveryPartyName || l.partyName, it: l.itemName, itemId: l.itemId, iid: l.itemCode, br: l.brand || '—', lot: l.lotNo || '—', gr: l.grade || '—', hsn: l.hsn || '—', unit: l.unit,
        rate: l.rate, oq: l.qty, dq: l.usedQty, sq: l.pendingQty, ctn, cops: l.cops ? Math.round(l.cops * l.pendingQty / Math.max(l.qty, 0.001)) : ctn * 4, tr: l.transporterName || '—', trId: l.transporterId, veh: l.vehicleNo || '—',
        gstRate: l.gstRate, discPct: l.discPct || 0, freightPct: l.freightPct || 0, insPct: 0, pid: '—', pinv: '—', rem: '—', godownId: l.godownId }; });
    return (st.docRows || []).concat(out);
  }

  body() {
    const st = this.state, f = st.f, x = st.x;
    const iso = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const n = (v) => (v === '' || v === null || v === undefined ? null : Number(String(v).replace(/,/g, '')));
    const id = (v) => (v ? Number(v) : null);
    const all = this.rowsLive(); const rows = st.sel.map((k) => all.find((r) => r.key === k)).filter(Boolean);
    if (!rows.length) return this.fail('Select a dispatch schedule first');
    if (!iso(f.date)) return this.fail('Bill date must be dd-mm-yyyy');
    const bad = rows.findIndex((r) => !(n(st.qty[r.key] ?? r.sq) > 0)); if (bad >= 0) return this.fail('Enter the weight to bill on line ' + (bad + 1));
    const c = st.lk.customers.find((p) => p.id === rows[0].partyId) || {};
    const ex = {}; Object.keys(x).forEach((k) => { if (x[k]) ex[k] = String(x[k]); });
    return {
      bookId: id(f.bookId), date: iso(f.date), partyId: rows[0].partyId, brokerId: c.brokerId || null, salesPersonId: c.salesPersonId || null, isTcs: !!st.tcs,
      transporterId: id(f.transporterId) || rows[0].trId || null, vehicleNo: f.vehicleNo || (rows[0].veh !== '—' ? rows[0].veh : null), lrNo: f.lrNo || null, lrDate: iso(f.lrDate), driverName: f.driverName || null, parcels: n(f.parcels),
      refNo: f.refNo || null, opportunityNo: f.opportunityNo || null, remark: f.remark || null, addLess: n(f.addLess) || 0, collectionPersonId: id(f.collectionPersonId), distanceKm: n(f.distanceKm), extra: ex,
      lines: rows.map((r) => { const q = n(st.qty[r.key] ?? r.sq); const ctn = Math.abs(q - r.sq) < 0.001 ? r.ctn : r.ctn ? Math.max(1, Math.round(q / (r.sq / r.ctn))) : 0;
        return { itemId: r.itemId, brand: r.br === '—' ? null : r.br, lotNo: r.lot === '—' ? null : r.lot, grade: r.gr === '—' ? null : r.gr, unit: r.unit, pcs: ctn, cops: r.cops && r.ctn ? Math.round(r.cops / r.ctn * ctn) : 0, qty: q, rate: r.rate,
          discPct: r.discPct, freightPct: r.freightPct, gstRate: r.gstRate, challanNo: r.ch === '—' ? null : r.ch, godownId: r.godownId || null, sourceLineId: r.sourceLineId || null }; })
    };
  }
  fail(msg) { this.setState({ note: msg, err: true }); return null; }

  async save(print) {
    const api = this.api(); const BR = this.state.brec;
    if (!api) { if (BR) this.setState({ upd: true }); return; }
    const doc = this.state.doc;
    const body = this.body(); if (!body) return;
    this.setState({ busy: true, note: 'Saving…', err: false });
    try {
      const d = doc ? await api.put('/vouchers/sale-bills/' + doc.id, body) : await api.post('/vouchers/sale-bills', body);
      api.invalidate();
      if (print) window.print();
      const msg = (doc ? '✓ Updated ' : '✓ Saved ') + d.number + (d.ewbStatus === 'PENDING' ? ' — e-way bill due' : '');
      if (doc) { this.fill(d); this.setState({ busy: false, note: msg, err: false, upd: true }); this.reloadPending(); return; }
      try { window.localStorage.setItem('yf-open-sb', JSON.stringify({ t: Date.now(), id: d.id, no: d.number })); window.localStorage.setItem('yf-flash', msg); } catch (e) {}
      if (this.props.startPicker) { this.go('Dispatch' + this.sfx() + '.dc.html'); return; }
      this._raw = null; this.setState({ busy: false }); this._rd && this._rd();
    } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  async remove() {
    const api = this.api(); const doc = this.state.doc;
    if (!doc) { this.setState({ sel: [], qty: {}, note: 'Cleared', err: false }); return; }
    if (!window.confirm('Delete sale bill ' + doc.number + '? Stock and the party ledger are reversed.')) return;
    this.setState({ busy: true });
    try { await api.del('/vouchers/sale-bills/' + doc.id); api.invalidate(); this.go('SaleBillList' + this.sfx() + '.dc.html'); }
    catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  async ewb(action) {
    const api = this.api(); const doc = this.state.doc; if (!api || !doc) return;
    let body = {};
    if (action === 'cancel') { const why = window.prompt('Reason for cancelling e-way bill ' + doc.ewbNo + '?'); if (!why) return; body = { reason: why }; }
    if (action === 'part-b') { const v = this.state.f.vehicleNo || window.prompt('Vehicle number for Part B?'); if (!v) return; body = { vehicleNo: v }; }
    if (action === 'generate') body = { vehicleNo: this.state.f.vehicleNo || undefined, distanceKm: Number(this.state.f.distanceKm) || undefined };
    this.setState({ busy: true, note: 'Talking to the portal…', err: false });
    try { if (action !== 'refresh') await api.post('/eway-bills/' + doc.id + '/' + action, body); await this.openBill(doc.id); this.setState({ busy: false, note: action === 'refresh' ? 'Up to date' : '✓ Done', err: false }); }
    catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }

  renderVals() {
    const st = this.state;
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const tab = st.tab;
    const live = !!this.api() && !!st.lk; const lk = st.lk || {};
    const inr = (n, d) => { const neg = n < 0; const s = Math.abs(Number(n) || 0).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (neg ? '− ' : '') + rest + l3 + (f ? '.' + f : ''); };
    const words = (n) => { const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']; const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const two = (x) => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''); const three = (x) => x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + two(x % 100) : '') : two(x);
      let s = ''; const cr = Math.floor(n / 1e7); n %= 1e7; const l = Math.floor(n / 1e5); n %= 1e5; const t = Math.floor(n / 1000); n %= 1000;
      if (cr) s += three(cr) + ' Crore '; if (l) s += two(l) + ' Lakh '; if (t) s += two(t) + ' Thousand '; if (n) s += three(n); return 'Rupees ' + (s.trim() || 'Zero') + ' Only'; };
    const num = (s) => parseFloat(String(s ?? '').replace(/,/g, '')) || 0;
    const dmyNow = this.today();
    let PO, PT;
    if (live) {
      PO = this.rowsLive();
      PT = {};
      const cust = new Map(lk.customers.map((c) => [c.id, c])); const nm = new Map(lk.ledgers.map((a) => [a.id, a.name])); const spn = new Map(lk.salesPersons.map((x) => [x.id, x.name]));
      PO.forEach((r) => { if (PT[r.p]) return; const c = cust.get(r.partyId) || {}; const sm = (st.ps || {})[r.partyId]; const fy = sm ? sm.fyTotals.find((t) => t.type === 'SALE_BILL') : null;
        PT[r.p] = { id: r.partyId, g: c.partyGroupName || r.p, agent: c.brokerId ? nm.get(c.brokerId) || '—' : 'Direct', sp: c.salesPersonId ? spn.get(c.salesPersonId) || '—' : '—', cr: c.creditDays || 0, gstin: c.gstin || '—', pan: c.pan || '—',
          out: '₹ ' + inr(sm ? sm.outstanding : Math.max(0, c.balance || 0), 0), total: fy ? '₹ ' + inr(fy.amount, 0) : '—', bills: fy ? String(fy.count) : '—', del: (st.doc && st.doc.deliveryPartyName) || r.dp || r.p, lim: c.creditLimit || 0, used: Math.max(0, c.balance || 0), sm, stateCode: c.stateCode, tcsRate: c.tcsRate }; });
    } else {
      PO = [{"no": "SAL11842", "dt": "23-10-2026", "p": "Rannade Textile", "g": "Rannade Textile", "it": "50/48 FDY NLBS", "br": "Wellknown", "lot": "R0484", "rate": 152.25, "oq": 1800, "dq": 0, "age": "today", "gr": "1ST", "iid": "263-I", "hsn": "54024700", "pid": "PUR20413/26-27", "pinv": "RV0020024097", "ch": "DS24248/26-27"}, {"no": "SAL11840", "dt": "22-10-2026", "p": "Rannade Textile", "g": "Rannade Textile", "it": "75/36 FDY", "br": "Reliance", "lot": "316C1S", "rate": 128, "oq": 1200, "dq": 0, "age": "1 day", "gr": "A+", "iid": "118-F", "hsn": "54024700", "pid": "PUR20398/26-27", "pinv": "RIL/88120", "ch": "DS24250/26-27"}, {"no": "SAL02722", "dt": "21-05-2026", "p": "Bhagwati Filaments", "g": "Bhagwati Filaments", "it": "50/24 SD CAT", "br": "Reliance", "lot": "356C9S", "rate": 179.6, "oq": 10050, "dq": 9335.8, "age": "155 days", "gr": "A+", "iid": "204-C", "hsn": "54024700", "pid": "PUR19022/26-27", "pinv": "RIL/80211", "ch": "DS24251/26-27"}, {"no": "SAL03514", "dt": "05-06-2026", "p": "Bansam Fabrics", "g": "Bansam Fabrics", "it": "50/48 FDY", "br": "Reliance", "lot": "338C1M", "rate": 140, "oq": 36050, "dq": 34827.45, "age": "140 days", "gr": "A+", "iid": "261-F", "hsn": "54024700", "pid": "PUR19310/26-27", "pinv": "RIL/81877", "ch": "DS24252/26-27"}, {"no": "SAL04254", "dt": "19-06-2026", "p": "Shree Rudraksha Poly", "g": "Shree Rudraksha Poly", "it": "50/12 BRT", "br": "Durga", "lot": "SIBS1008", "rate": 185.14, "oq": 15050, "dq": 14526.4, "age": "126 days", "gr": "F1", "iid": "091-B", "hsn": "54024700", "pid": "PUR19550/26-27", "pinv": "DS/2231", "ch": "DS24253/26-27"}, {"no": "SAL04424", "dt": "23-06-2026", "p": "Jigita Fab LLP", "g": "Jigita Fab LLP", "it": "Muskan Bright", "br": "J.J. Industries", "lot": "MB123", "rate": 370, "oq": 2050, "dq": 1478.26, "age": "122 days", "gr": "1ST", "iid": "310-M", "hsn": "54023300", "pid": "PUR19601/26-27", "pinv": "JJ/1180", "ch": "DS24254/26-27"}, {"no": "SAL05058", "dt": "02-07-2026", "p": "Ganpati Silk Mill", "g": "Kanvi Corporation", "it": "50/24 SD CAT", "br": "Reliance", "lot": "356C9S", "rate": 151, "oq": 5050, "dq": 4453.69, "age": "113 days", "gr": "PQ", "iid": "204-C", "hsn": "54024700", "pid": "PUR19702/26-27", "pinv": "RIL/83390", "ch": "DS24255/26-27"}];
      PT = {"Rannade Textile": {"g": "Rannade Textile", "agent": "Nilkanthbhai Ghariwala", "sp": "Manoj Bhai", "cr": 15, "gstin": "24AARFR5521K1Z4", "pan": "AARFR5521K", "out": "₹ 2,87,050", "total": "₹ 2,87,050", "bills": "14", "del": "Rannade Textile"}, "Bhagwati Filaments": {"g": "Bhagwati Filaments", "agent": "Avi M", "sp": "Avi M", "cr": 4, "gstin": "24AABCB4410K1Z3", "pan": "AABCB4410K", "out": "₹ 8,12,540", "total": "₹ 42,18,900", "bills": "38", "del": "Bhagwati Filaments · Unit 2"}, "Bansam Fabrics": {"g": "Bansam Fabrics", "agent": "Ramji", "sp": "Rajesh Shah", "cr": 1, "gstin": "24AADFB7781M1Z9", "pan": "AADFB7781M", "out": "₹ 18,60,000", "total": "₹ 50,47,000", "bills": "61", "del": "Bansam Fabrics"}, "Shree Rudraksha Poly": {"g": "Shree Rudraksha Poly", "agent": "Direct", "sp": "Avi M", "cr": 4, "gstin": "24AAHFS3302P1Z1", "pan": "AAHFS3302P", "out": "₹ 6,40,210", "total": "₹ 27,86,300", "bills": "29", "del": "Shree Rudraksha Poly"}, "Jigita Fab LLP": {"g": "Jigita Fab LLP", "agent": "Direct", "sp": "Avi M", "cr": 15, "gstin": "24AAKFJ9910R1Z7", "pan": "AAKFJ9910R", "out": "₹ 2,10,000", "total": "₹ 12,46,500", "bills": "11", "del": "Jigita Fab LLP"}, "Ganpati Silk Mill": {"g": "Kanvi Corporation", "agent": "Krish J", "sp": "Rajesh Shah", "cr": 15, "gstin": "24AAEFG4471C1Z2", "pan": "AAEFG4471C", "out": "₹ 3,95,600", "total": "₹ 14,02,800", "bills": "17", "del": "Ganpati Silk Mill"}};
      const TRS = ['Shivam Transport Services', 'Navkar Roadlines', 'Jay Ambe Roadlines', 'VRL Logistics'];
      PO.forEach((r, i) => { const pend = r.oq - r.dq; r.key = r.no; r.ctn = r.no === 'SAL11842' ? 24 : Math.max(6, Math.min(32, Math.round(pend / 60))); r.sq = r.no === 'SAL11842' ? 619.43 : Math.min(pend, Math.round(r.ctn * 38.71 * 1000) / 1000); r.cops = r.ctn * 4; r.dsdt = r.dt; r.tr = TRS[i % TRS.length]; r.veh = 'GJ-05-' + ['BX', 'AV', 'CT', 'UU'][i % 4] + '-' + (4120 + i * 377); r.dp = r.g; r.gstRate = 5; r.discPct = 0; r.freightPct = 0; r.insPct = 0; r.rem = '—'; });
    }
    const find = (k) => PO.find((r) => r.key === k);
    const pick = st.pick ?? (this.props.startPicker ?? false);
    const sel = st.sel; const qty = st.qty;
    const draft = st.draft ?? sel; const dqty = st.dqty ?? qty;
    const dRows = PO.filter((r) => draft.indexOf(r.key) >= 0);
    const dParty = dRows.length ? dRows[0].p : null;
    const mq = (st.mq || '').toLowerCase();
    const pickable = PO.filter((r) => !String(r.key).startsWith('L'));
    const poVis = pickable.filter((r) => (!mq || [r.ch, r.no, r.p, r.it, r.lot, r.br].join(' ').toLowerCase().indexOf(mq) >= 0) && (!st.mp || r.p === st.mp) && (!st.mt || r.tr === st.mt));
    const po = poVis.map((r) => { const on = draft.indexOf(r.key) >= 0; const other = dParty && r.p !== dParty; const pend = r.oq - r.dq;
      return { no: r.no, dt: r.dt, p: r.p, g: r.g, it: r.it, br: r.br, lot: r.lot, gr: r.gr, age: r.age, rate: inr(r.rate, 2), oq: inr(r.oq, 3), dq: inr(r.dq, 3), pq: inr(pend, 3),
        ds: r.ch, dsdt: r.dsdt, dp: r.dp, ctn: String(r.ctn), sq: inr(r.sq, 3), tr: r.tr, veh: r.veh, bq: dqty[r.key] ?? inr(r.sq, 3), on, rc: on ? 'on' : (other ? 'off' : ''),
        setQ: (e) => this.setState({ draft, dqty: { ...dqty, [r.key]: e.target.value } }),
        tog: () => this.setState({ draft: on ? draft.filter((x) => x !== r.key) : (other ? [r.key] : draft.concat([r.key])), dqty }) }; });
    const dQty = dRows.reduce((a, r) => a + num(dqty[r.key] ?? r.sq), 0);
    const rows = sel.map(find).filter(Boolean);
    const party = rows.length ? rows[0].p : null; const pt = party ? PT[party] : null;
    if (live && pt && pt.id && !(st.ps || {})[pt.id]) this.loadParty(pt.id);
    const inter = live && pt && pt.stateCode && lk.companyStateCode ? pt.stateCode !== lk.companyStateCode : false;
    let T = { q: 0, ctn: 0, cops: 0, basic: 0, dr: 0, fr: 0, ir: 0, tx: 0, gst: 0 }; const rates = new Set(); const hsns = new Set();
    const items = rows.map((r, i) => { const q = num(qty[r.key] ?? r.sq); const basic = q * r.rate; const dr = basic * (r.discPct || 0) / 100; const fr = (basic - dr) * (r.freightPct || 0) / 100; const ir = (basic - dr) * (r.insPct || 0) / 100;
      const tx = basic - dr + fr + ir; const g = tx * (r.gstRate ?? 5) / 100; const ctn = q > 0 ? (Math.abs(q - r.sq) < 0.001 ? r.ctn : r.ctn ? Math.max(1, Math.round(q / (r.sq / r.ctn))) : 0) : 0; const cops = r.ctn ? Math.round((r.cops || r.ctn * 4) / r.ctn * ctn) : 0;
      T.q += q; T.ctn += ctn; T.cops += cops; T.basic += basic; T.dr += dr; T.fr += fr; T.ir += ir; T.tx += tx; T.gst += g; rates.add(r.gstRate ?? 5); if (r.hsn && r.hsn !== '—') hsns.add(r.hsn);
      return { n: i + 1, iid: r.iid, code: r.iid, it: r.it, pid: r.pid || '—', br: r.br, pinv: r.pinv || '—', hsn: r.hsn, gr: r.gr, unit: /^kg$/i.test(r.unit || 'Kg') ? 'Kg' : r.unit, rem: r.rem || '—', lr: '—', ch: r.ch, chd: r.dsdt || dmyNow, lot: r.lot,
        ctn, cops, q: qty[r.key] ?? inr(r.sq, 3), rate: inr(r.rate, 2), basic: inr(basic, 2), dp: String(r.discPct || 0), dr: inr(dr, 2), fp: String(r.freightPct || 0), fr: inr(fr, 2), ins: inr(ir, 2), ip: String(r.insPct || 0), ir: inr(ir, 2), tx: inr(tx, 2), gst: inr(g, 2), amt: inr(tx + g, 2),
        setQ: (e) => this.setState({ qty: { ...qty, [r.key]: e.target.value } }) }; });
    const gst = T.gst; const gross = T.tx + gst; const al = num(st.f.addLess);
    const tcs = st.tcs ? (gross + al) * Number(pt && pt.tcsRate ? pt.tcsRate : 0.1) / 100 : 0;
    const net = Math.round(gross + al + tcs); const tds = 0;
    const pendAfter = rows.reduce((a, r) => a + (r.oq - r.dq) - num(qty[r.key] ?? (r.oq - r.dq)), 0);
    const addDays = (s, n) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(s || '')); if (!m) return '—'; const t = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]) + n * 864e5); const z = (x) => String(x).padStart(2, '0'); return z(t.getUTCDate()) + '-' + z(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear(); };
    const ordLabel = rows.length === 0 ? 'Select dispatch schedule…' : rows.length === 1 ? rows[0].ch + ' · order ' + rows[0].no + ' · ' + rows[0].it : rows.length + ' schedules · ' + [...new Set(rows.map((r) => r.ch))].join(', ');
    const P0 = pt || { g: '—', del: '—', agent: '—', sp: '—', cr: 0, gstin: '—', pan: '—', out: '—', total: '—', bills: '—' };
    const BK = st.back;
    const BR = st.brec || null;
    const doc = st.doc;
    const isRec = live ? !!doc : !!BR;
    const recNo = live ? (doc ? doc.number : st.nextNo || '…') : BR ? BR.no : 'GU22854/26-27';
    const billDt = live ? st.f.date || dmyNow : BR ? BR.dt : '23-10-2026';
    const billV = { billNo: recNo, billDt, regLabel: isRec ? 'Sale bill register' : 'Sale bills', billTag: isRec ? (doc && doc.status === 'CANCELLED' ? 'Cancelled' : 'Saved') : '', billTagC: isRec ? (doc && doc.status === 'CANCELLED' ? 'tag t-red' : 'tag') : '',
      closeLabel: isRec ? 'Close' : 'Cancel', saveLabel: st.busy ? 'Saving…' : isRec ? (st.upd ? '✓ Updated' : 'Update bill') : 'Save bill',
      updNote: st.note || (isRec ? (st.upd ? 'Changes saved to ' + recNo : 'Editing ' + recNo) : ''), noteCls: st.err ? 'tag t-red' : 'muted', busy: !!st.busy,
      doUpdate: () => this.save(false), savePrint: () => this.save(true), remove: () => this.remove() };
    // previous / next bill
    const BL = st.bills || []; const bi = doc ? BL.findIndex((b) => b.id === doc.id) : -1;
    const openId = (b) => { if (!b) return; try { window.localStorage.setItem('yf-open-sb', JSON.stringify({ t: Date.now(), id: b.id, no: b.number })); } catch (e) {} if (this.props.startPicker) this.go('Dispatch' + sfx + '.dc.html'); };
    // form bindings
    const f = { ...st.f, transporterId: st.f.transporterId || (rows[0] && rows[0].trId ? String(rows[0].trId) : ''), vehicleNo: st.f.vehicleNo ?? (live ? (rows[0] && rows[0].veh !== '—' ? rows[0].veh : '') : rows.length ? rows[0].veh : ''), lrNo: st.f.lrNo ?? (live ? '' : '8675'), lrDate: st.f.lrDate ?? (live ? '' : '23-10-2026') };
    const set = {}; ['bookId', 'date', 'addLess', 'remark', 'opportunityNo', 'transporterId', 'lrNo', 'lrDate', 'vehicleNo', 'driverName', 'parcels', 'refNo', 'collectionPersonId', 'distanceKm'].forEach((k) => { set[k] = (e) => this.setState({ f: { ...this.state.f, [k]: e.target.value }, note: this.state.err ? '' : this.state.note, err: false }); });
    const X0 = live ? {} : { godown: 'Shivam Transport Services', supplier: 'Wellknown Polyesters Ltd' }; const x = { ...X0, ...st.x };
    const xset = {}; ['tranDocNo', 'tranDocDate', 'driverLicense', 'parcelNo', 'godown', 'haste', 'policyNo', 'supplier', 'adjBillNo', 'adjBillDate'].forEach((k) => { xset[k] = (e) => this.setState({ x: { ...x, [k]: e.target.value } }); });
    const opts = (list) => (list || []).map((o) => ({ v: String(o.id), l: o.name }));
    const opt = live ? { books: opts(lk.books.filter((b) => b.voucherType === 'SALE_BILL')), transporters: opts(lk.transporters), collectors: opts(lk.collectionPersons) }
      : { books: [{ v: '', l: 'Yarn sales tax A/c (Umiya)' }, { v: 'e', l: 'Yarn sales A/c · export' }, { v: 'g', l: 'General sales A/c' }], transporters: [{ v: '', l: rows.length ? rows[0].tr : 'Shivam Transport Services' }, { v: 'n', l: 'Navkar Roadlines' }], collectors: [{ v: 'a', l: 'Ajay Joshi (Bhanu)' }] };
    if (!live) f.collectionPersonId = st.f.collectionPersonId ?? 'a';
    // e-way bill & e-invoice
    const co = st.co || {};
    const fdt = (t) => { if (!t) return '—'; const d = new Date(t); const z = (n) => String(n).padStart(2, '0'); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return z(d.getDate()) + '-' + z(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + z(h) + ':' + z(d.getMinutes()) + ' ' + ap; };
    const trO = live ? lk.transporters.find((t) => String(t.id) === String(f.transporterId)) : null;
    const ES = { GENERATED: ['Active', 'tag t-green'], PARTB_PENDING: ['Part B pending', 'tag t-orange'], PENDING: ['Not generated', 'tag t-orange'], NOT_REQUIRED: ['Not required', 'tag'], CANCELLED: ['Cancelled', 'tag t-red'], DELIVERED: ['Delivered', 'tag t-blue'], EXPIRED: ['Expired', 'tag t-red'] };
    let ew, ei;
    if (live) {
      const s0 = doc ? doc.ewbStatus : 'PENDING'; const es = ES[s0] || [s0, 'tag'];
      const hasNo = !!(doc && doc.ewbNo);
      ew = { no: hasNo ? String(doc.ewbNo).replace(/(\d{4})(?=\d)/g, '$1 ') : '—', tag: es[0], tc: es[1], valid: doc && doc.ewbValidTill ? 'Valid till ' + fdt(doc.ewbValidTill) : doc ? '' : 'Save the bill first',
        mainL: !doc ? 'Generate EWB' : s0 === 'PARTB_PENDING' ? 'Update Part B' : hasNo ? 'Refresh from portal' : 'Generate EWB', main: () => (!doc ? this.setState({ note: 'Save the bill first', err: true }) : this.ewb(s0 === 'PARTB_PENDING' ? 'part-b' : hasNo ? 'refresh' : 'generate')),
        print: () => window.print(), cancel: () => this.ewb('cancel'), noCancel: !hasNo || s0 === 'CANCELLED',
        sup: (co.gstin || '—') + ' · ' + (co.name || ''), from: [co.address1, co.city].filter(Boolean).join(', ') + (co.pincode ? ' · ' + co.pincode : ''), to: P0.del, doc: 'Tax invoice · ' + recNo + ' · ' + billDt, hsn: [...hsns].join(', ') || '—',
        tr: trO ? trO.name + (trO.gstin ? ' · ' + trO.gstin : '') : '—', km: f.distanceKm ? f.distanceKm + ' km' : doc && doc.distanceKm ? doc.distanceKm + ' km' : '—',
        pbT: f.vehicleNo ? 'Vehicle entered' : 'Part B pending', pbC: f.vehicleNo ? 'tag t-green' : 'tag t-orange', by: trO ? trO.name : '—', tid: trO && trO.gstin ? trO.gstin : '—', veh: f.vehicleNo || '—', lr: (f.lrNo || '—') + (f.lrDate ? ' · ' + f.lrDate : ''), place: co.city ? co.city + ', ' + (co.state || '') : '—',
        on: doc && doc.ewbDate ? fdt(doc.ewbDate) : '—', hist: f.vehicleNo ? [{ a: f.vehicleNo, b: (co.city || '') + ' · ' + (doc && doc.ewbDate ? fdt(doc.ewbDate) : '—'), st: '' }] : [{ a: 'Part B pending', b: 'Vehicle not entered yet', st: 'opacity: .6' }],
        sync: hasNo ? 'Synced from e-way bill portal' : 'Not filed on the portal yet' };
      ei = doc && doc.irn ? { irn: doc.irn.slice(0, 28) + '…', ack: doc.ackNo || '—', dt: fdt(doc.ackDate), st: 'IRN generated', tc: 'tag t-green' } : { irn: '—', ack: '—', dt: '—', st: 'Not generated', tc: 'tag t-orange' };
    } else {
      ew = { no: '3210 8812 4401', tag: 'Active', tc: 'tag t-green', valid: 'Valid till 24-10-2026 11:59 PM', mainL: 'Refresh from portal', main: () => {}, print: () => {}, cancel: () => {}, noCancel: false,
        sup: '24AAKCS7781M1Z2 · Shree Umiya Yarn', from: 'Ring Road, Surat · 395002', to: P0.del + ' · Surat 395010', doc: 'Tax invoice · GU22854/26-27 · 23-10-2026', hsn: '54024700 · Synthetic filament yarn', tr: 'Shivam Transport Services · 24AAJFS4412Q1Z8', km: '12 km',
        pbT: 'Filled by transporter', pbC: 'tag t-green', by: 'Shivam Transport Services', tid: '24AAJFS4412Q1Z8', veh: 'GJ-05-BX-4120', lr: '8675 · 23-10-2026', place: 'Surat, Gujarat', on: '23-10-2026 06:42 PM',
        hist: [{ a: 'GJ-05-BX-4120', b: 'Surat · 23-10-2026 06:42 PM', st: '' }, { a: 'Part B pending', b: 'Part A filed by us · 23-10-2026 05:18 PM', st: 'opacity: .6' }], sync: 'Synced from e-way bill portal · 2 min ago' };
      ei = { irn: 'b29ad0e9925749231cb2186657ce…', ack: '1626 2640 6867 1', dt: '23-10-2026 05:16 PM', st: 'IRN generated', tc: 'tag t-green' };
    }
    // credit pills
    const kp = (() => {
      if (live) { const sm = pt && pt.sm; const lim = pt ? pt.lim : 0; const used = pt ? pt.used : 0; const pct = lim ? Math.min(100, Math.round(used / lim * 100)) : 0; const due = sm && sm.overdue > 0 ? '₹ ' + inr(sm.overdue, 0) + ' · ' + sm.maxOverdueDays + ' d late' : 'None';
        return { out: P0.out, lim: lim ? '₹ ' + inr(lim, 0) : 'No limit', pct: lim ? pct + '% used' : '—', bar: 'width: ' + pct + '%' + (pct >= 80 ? '; background: #EF4444' : ''), due, dc: due === 'None' ? 'kp ok' : 'kp due' }; }
      const n = (x) => parseFloat(String(x || '').replace(/[^0-9.]/g, '')) || 0; const LIM = { 'Bhagwati Filaments': 3000000, 'Rannade Textile': 1500000, 'Jigita Fab LLP': 1000000, 'Bansam Fabrics': 2500000, 'Shree Rudraksha Poly': 1500000, 'Ganpati Silk Mill': 1200000 };
      const DUE = { 'Bhagwati Filaments': '₹ 1,04,200 · 6 d late', 'Jigita Fab LLP': '₹ 9,60,000 · 41 d late', 'Ganpati Silk Mill': '₹ 1,74,405 · 4 d late' };
      const used = n(P0.out); const lim = LIM[party] || 2000000; const pct = Math.min(100, Math.round(used / lim * 100)); const due = DUE[party] || 'None';
      return { out: P0.out, lim: '₹ ' + inr(lim, 0), pct: pct + '% used', bar: 'width: ' + pct + '%' + (pct >= 80 ? '; background: #EF4444' : ''), due, dc: due === 'None' ? 'kp ok' : 'kp due' }; })();
    const dueDt = pt ? addDays(billDt, Number(P0.cr) || 0) : '—';
    const recv = live && doc && doc.pending != null ? doc.netAmount - (doc.tdsAmount || 0) - doc.pending : 0;
    const bal = live && doc && doc.pending != null ? doc.pending : net;
    const rate1 = rates.size === 1 ? [...rates][0] : null;
    const parties = [...new Set(pickable.map((r) => r.p))].sort(); const trs = [...new Set(pickable.map((r) => r.tr).filter((t) => t && t !== '—'))].sort();
    return { ...billV, backHref: BK ? BK.href : 'SaleBillList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Sale bill register',
      fitStyle: 'height: 100vh',
      theme, more: st.more, hist: st.hist, pick, po, poNone: live && po.length === 0, poEmpty: pickable.length ? 'No schedule matches the filters' : 'Every approved dispatch schedule is billed. Make a dispatch schedule first.',
      mq: st.mq, setMq: (e) => this.setState({ mq: e.target.value }), mp: st.mp, setMp: (e) => this.setState({ mp: e.target.value }), mt: st.mt, setMt: (e) => this.setState({ mt: e.target.value }), mParties: live ? parties : ['Rannade Textile', 'Bhagwati Filaments'], mTrs: live ? trs : ['Shivam Transport Services', 'Navkar Roadlines'],
      navNo: live ? (doc ? doc.number : (BL[0] ? BL[0].number : '—')) : 'GU22854/26-27',
      prevBill: () => (live ? openId(bi >= 0 ? BL[bi + 1] : BL[0]) : null), nextBill: () => (live && bi > 0 ? openId(BL[bi - 1]) : null),
      colsLabel: st.more ? 'Fewer columns' : 'All columns',
      toggleCols: () => this.setState({ more: !st.more }),
      toggleHist: () => this.setState({ hist: !st.hist }),
      tcsY: st.tcs ? 'on' : '', tcsN: st.tcs ? '' : 'on',
      setTcsY: () => this.setState({ tcs: true }), setTcsN: () => this.setState({ tcs: false }),
      tabCls: { sum: tab === 'sum' ? 'on' : '', tr: tab === 'tr' ? 'on' : '', ei: tab === 'ei' ? 'on' : '', ref: tab === 'ref' ? 'on' : '' },
      setTab: { sum: () => this.setState({ tab: 'sum' }), tr: () => this.setState({ tab: 'tr' }), ei: () => this.setState({ tab: 'ei' }), ref: () => this.setState({ tab: 'ref' }) },
      showTr: () => this.setState({ tab: 'tr' }), showEi: () => { this.setState({ tab: 'ei' }); if (live && doc && !doc.irn && window.confirm('Generate e-invoice (IRN) for ' + doc.number + '?')) this.ewb('einvoice'); },
      isSum: tab === 'sum', isTr: tab === 'tr', isEi: tab === 'ei', isRef: tab === 'ref',
      openPick: () => { if (live && doc) { this.setState({ note: 'A saved bill keeps its schedules — delete it to bill again', err: true }); return; } this.setState({ pick: true, draft: sel.slice(), dqty: { ...qty } }); },
      cancelPick: () => this.setState({ pick: false, draft: null, dqty: null }),
      applyPick: () => { const q = {}; draft.forEach((k) => { const r = find(k); q[k] = dqty[k] ?? inr(r.sq, 3); }); const r0 = find(draft[0]); this.setState({ pick: false, sel: draft.slice(), qty: q, draft: null, dqty: null, f: { ...st.f, transporterId: r0 && r0.trId ? String(r0.trId) : st.f.transporterId, vehicleNo: undefined } }); },
      noDraft: dRows.length === 0,
      selText: dRows.length ? dRows.length + (dRows.length > 1 ? ' schedules' : ' schedule') + ' selected · ' + dParty + ' · ' + inr(dQty, 3) + ' kg to bill' : 'Tick one or more dispatch schedules of the same party',
      kp, f, set, x, xset, opt, ew, ei, togNoHsn: () => this.setState({ f: { ...st.f, noHsnQty: !st.f.noHsnQty } }),
      trName: rows.length ? rows[0].tr : 'Shivam Transport Services', trVeh: f.vehicleNo,
      items, hasItems: rows.length > 0, noItems: rows.length === 0, ordLabel, ordTag: rows.length ? 'From ' + [...new Set(rows.map((r) => r.ch))].join(', ') : 'No schedule selected',
      party: party || '—', pt: { ...P0, cr: String(P0.cr), due: dueDt, recv: '₹ ' + inr(recv, 2), bal: '₹ ' + inr(bal, 2), dueT: live && doc && doc.pending != null && doc.pending <= 0.5 ? 'Paid' : 'Due ' + dueDt, dueC: live && doc && doc.pending != null && doc.pending <= 0.5 ? 'tag t-green' : 'tag t-orange' },
      tot: { ctn: String(T.ctn), cops: String(T.cops), wt: inr(T.q, 3), basic: inr(T.basic, 2), dr: inr(T.dr, 2), fr: inr(T.fr, 2), ir: inr(T.ir, 2), tx: inr(T.tx, 2), gst: inr(gst, 2), amt: inr(gross, 2) },
      sum: { qty: inr(T.q, 3) + ' kg · ' + T.ctn + ' cartons', basic: '₹ ' + inr(T.tx, 2), half: '₹ ' + inr(inter ? 0 : gst / 2, 2), igst: '₹ ' + inr(inter ? gst : 0, 2), tcs: '₹ ' + inr(tcs, 2),
        l1: 'CGST' + (rate1 != null ? ' ' + rate1 / 2 + '%' : ''), l2: 'SGST' + (rate1 != null ? ' ' + rate1 / 2 + '%' : ''), gst: '₹ ' + inr(gst, 2), gross: '₹ ' + inr(gross, 2), ro: '₹ ' + inr(net - gross - al - tcs, 2), net: '₹ ' + inr(net, 2),
        words: words(net), avg: T.q ? inr(gross / T.q, 2) : '0.00', bavg: T.q ? inr(T.basic / T.q, 2) : '0.00', tds: '− ₹ ' + inr(tds, 2), pay: '₹ ' + inr(net - tds, 2), pend: inr(Math.max(pendAfter, 0), 3) + ' kg',
        first: rows.length ? (/\//.test(rows[0].no) || rows[0].no === '—' ? rows[0].no : rows[0].no + '/26-27') : '—', firstDt: rows.length ? rows[0].dt : '—', firstIt: rows.length ? rows[0].it : '—', firstRate: rows.length ? inr(rows[0].rate, 2) : '—' },
      listHref: 'SaleBillList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class DispatchView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""} fit`} style={sx(v.fitStyle)}>
        <div className="sbw">
          <Sidebar active="disp" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href={v.listHref}>
                {v.regLabel}
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                {v.billNo}
              </span>
              <span className={v.billTagC}>
                {v.billTag}
              </span>
            </div>
            <DcLink className="btn" href={v.listHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
              Show record
            </DcLink>
            {' '}
            <button className="btn" type="button" onClick={v.showTr}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
              Dispatch details
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.showEi}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              E-invoice
            </button>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Upload
            </button>
            <div className="nav" role="group" aria-label="Previous or next bill">
              <button type="button" aria-label="Previous bill" onClick={v.prevBill}>
                ‹
              </button>
              <span>
                {v.navNo}
              </span>
              <button type="button" aria-label="Next bill" onClick={v.nextBill}>
                ›
              </button>
            </div>
            <button className="btn" type="button" onClick={v.toggleHist} aria-pressed={v.hist}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              History
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.openPick}>
              + New bill
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <section className="sec">
                <div className="sh">
                  <h2>
                    Bill details
                  </h2>
                  <span className="tag">
                    {v.ordTag}
                  </span>
                  <div className="kps">
                    <span className="kp">
                      <span>
                        Outstanding
                      </span>
                      <b>
                        {v.kp?.out}
                      </b>
                    </span>
                    <span className="kp">
                      <span>
                        Credit limit
                      </span>
                      <b>
                        {v.kp?.lim}
                      </b>
                      <span className="mt" aria-hidden="true">
                        <i style={sx(v.kp?.bar)} />
                      </span>
                      <span>
                        {v.kp?.pct}
                      </span>
                    </span>
                    <span className={v.kp?.dc}>
                      <span>
                        Due payment
                      </span>
                      <b>
                        {v.kp?.due}
                      </b>
                    </span>
                  </div>
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="b1">
                      Book
                    </label>
                    <select id="b1" className="inp" value={v.f?.bookId} onChange={v.set?.bookId}>
                      {(v.opt?.books || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <option value={o?.v}>
                            {o?.l}
                          </option>
                        </Fragment>
                      ))}
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="b2">
                      Bill no.
                    </label>
                    <input id="b2" className="inp" type="text" value={v.billNo} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b3">
                      Bill date
                    </label>
                    <input id="b3" className="inp" type="text" value={v.billDt} onChange={v.set?.date} placeholder="dd-mm-yyyy" />
                  </div>
                  <div className="fld">
                    <label>
                      TCS applicable?
                    </label>
                    <div className="yn" role="group" aria-label="TCS applicable?">
                      <button type="button" className={v.tcsN} onClick={v.setTcsN}>
                        No
                      </button>
                      <button type="button" className={v.tcsY} onClick={v.setTcsY}>
                        Yes
                      </button>
                    </div>
                  </div>
                  <div className="fld span2">
                    <label>
                      {"Against dispatch schedule "}
                      <span className="req">
                        *
                      </span>
                    </label>
                    <button className="inp pickf" type="button" onClick={v.openPick}>
                      <b>
                        {v.ordLabel}
                      </b>
                      <span>
                        Change
                      </span>
                    </button>
                  </div>
                  <div className="fld">
                    <label htmlFor="b5">
                      Party · from schedule
                    </label>
                    <input id="b5" className="inp" type="text" value={v.party} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b6">
                      Party group
                    </label>
                    <input id="b6" className="inp" type="text" value={v.pt?.g} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b7">
                      Delivery party
                    </label>
                    <input id="b7" className="inp" type="text" value={v.pt?.del} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b8">
                      Agent / broker
                    </label>
                    <input id="b8" className="inp" type="text" value={v.pt?.agent} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b9">
                      Salesperson
                    </label>
                    <input id="b9" className="inp" type="text" value={v.pt?.sp} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b10">
                      Credit days
                    </label>
                    <input id="b10" className="inp" type="text" value={v.pt?.cr} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b11">
                      Due date
                    </label>
                    <input id="b11" className="inp" type="text" value={v.pt?.due} readOnly />
                  </div>
                </div>
              </section>
              <section className="sec items">
                <div className="sh">
                  <h2>
                    Items
                  </h2>
                  <button className="btn sm gh" type="button" onClick={v.toggleCols}>
                    {v.colsLabel}
                  </button>
                  <button className="btn sm" type="button" onClick={v.openPick}>
                    Change order
                  </button>
                  <button className="btn sm" type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                    Pending challans
                  </button>
                </div>
                {v.hasItems ? (
                  <>
                    <div className="tw">
                      <table>
                        <thead>
                          <tr>
                            <th>
                              #
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Item id
                                </th>
                              </>
                            ) : null}
                            <th>
                              Item
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Purchase id
                                </th>
                              </>
                            ) : null}
                            <th>
                              Brand
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Pur. inv. no.
                                </th>
                                <th>
                                  HSN
                                </th>
                              </>
                            ) : null}
                            <th>
                              Grade
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Unit
                                </th>
                                <th>
                                  Remark
                                </th>
                                <th>
                                  Challan no.
                                </th>
                                <th>
                                  Challan date
                                </th>
                              </>
                            ) : null}
                            <th>
                              Lot no.
                            </th>
                            <th className="r">
                              Cartons
                            </th>
                            {v.more ? (
                              <>
                                <th className="r">
                                  Cops
                                </th>
                              </>
                            ) : null}
                            <th className="r">
                              Weight kg
                            </th>
                            <th className="r">
                              Rate
                            </th>
                            <th className="r">
                              Basic amt
                            </th>
                            {v.more ? (
                              <>
                                <th className="r">
                                  Disc %
                                </th>
                                <th className="r">
                                  Disc ₹
                                </th>
                                <th className="r">
                                  Freight %
                                </th>
                                <th className="r">
                                  Freight ₹
                                </th>
                                <th className="r">
                                  Insurance
                                </th>
                                <th className="r">
                                  GST 5%
                                </th>
                              </>
                            ) : null}
                            <th className="r">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(v.items || []).map((it, $index) => (
                            <Fragment key={$index}>
                              <tr>
                                <td>
                                  {it?.n}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.iid}
                                    </td>
                                  </>
                                ) : null}
                                <td>
                                  {it?.it}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.pid}
                                    </td>
                                  </>
                                ) : null}
                                <td className="t2">
                                  {it?.br}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.pinv}
                                    </td>
                                    <td className="t2">
                                      {it?.hsn}
                                    </td>
                                  </>
                                ) : null}
                                <td className="t2">
                                  {it?.gr}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.unit}
                                    </td>
                                    <td className="t2">
                                      {it?.rem}
                                    </td>
                                    <td className="t2">
                                      {it?.ch}
                                    </td>
                                    <td className="t2">
                                      {it?.chd}
                                    </td>
                                  </>
                                ) : null}
                                <td className="t2">
                                  {it?.lot}
                                </td>
                                <td className="r">
                                  {it?.ctn}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="r">
                                      {it?.cops}
                                    </td>
                                  </>
                                ) : null}
                                <td className="r">
                                  <input className="cin r w" type="text" value={it?.q} onChange={it?.setQ} aria-label="Weight kg to bill" />
                                </td>
                                <td className="r">
                                  {it?.rate}
                                </td>
                                <td className="r">
                                  {it?.basic}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="r">
                                      {it?.dp}
                                    </td>
                                    <td className="r">
                                      {it?.dr}
                                    </td>
                                    <td className="r">
                                      {it?.fp}
                                    </td>
                                    <td className="r">
                                      {it?.fr}
                                    </td>
                                    <td className="r">
                                      {it?.ins}
                                    </td>
                                    <td className="r">
                                      {it?.gst}
                                    </td>
                                  </>
                                ) : null}
                                <td className="r">
                                  {it?.amt}
                                </td>
                              </tr>
                            </Fragment>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td />
                            {v.more ? (
                              <>
                                <td />
                              </>
                            ) : null}
                            <td>
                              Total
                            </td>
                            {v.more ? (
                              <>
                                <td />
                              </>
                            ) : null}
                            <td />
                            {v.more ? (
                              <>
                                <td />
                                <td />
                              </>
                            ) : null}
                            <td />
                            {v.more ? (
                              <>
                                <td />
                                <td />
                                <td />
                                <td />
                              </>
                            ) : null}
                            <td />
                            <td className="r">
                              {v.tot?.ctn}
                            </td>
                            {v.more ? (
                              <>
                                <td className="r">
                                  {v.tot?.cops}
                                </td>
                              </>
                            ) : null}
                            <td className="r">
                              {v.tot?.wt}
                            </td>
                            <td />
                            <td className="r">
                              {v.tot?.basic}
                            </td>
                            {v.more ? (
                              <>
                                <td />
                                <td className="r">
                                  {v.tot?.dr}
                                </td>
                                <td />
                                <td className="r">
                                  {v.tot?.fr}
                                </td>
                                <td />
                                <td className="r">
                                  {v.tot?.gst}
                                </td>
                              </>
                            ) : null}
                            <td className="r">
                              {v.tot?.amt}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.noItems ? (
                  <>
                    <div className="tw">
                      <div className="empty">
                        <b style={{"color":"var(--t1)","fontWeight":"600"}}>
                          No order selected yet
                        </b>
                        <span>
                          Pick the order you are billing — party, items, rate and taxes fill in automatically.
                        </span>
                        <button className="btn pr" type="button" onClick={v.openPick}>
                          Select order
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                <label className="chk">
                  <input type="checkbox" checked={v.f?.noHsnQty} onChange={v.togNoHsn} />
                  {" Qty not effect in GST HSN summary"}
                </label>
              </section>
              <section className="sec bottom">
                <div className="tabsx" role="tablist" aria-label="Summary and other details">
                  <button type="button" role="tab" className={v.tabCls?.sum} onClick={v.setTab?.sum}>
                    Summary
                  </button>
                  <button type="button" role="tab" className={v.tabCls?.tr} onClick={v.setTab?.tr}>
                    Transport
                  </button>
                  <button type="button" role="tab" className={v.tabCls?.ei} onClick={v.setTab?.ei}>
                    {"E-way bill & e-invoice"}
                  </button>
                  <button type="button" role="tab" className={v.tabCls?.ref} onClick={v.setTab?.ref}>
                    References
                  </button>
                </div>
                {v.isSum ? (
                  <>
                    <div className="cols3">
                      <div className="box">
                        <h3>
                          Tax summary
                        </h3>
                        <div className="kv">
                          <span>
                            Taxable amount
                          </span>
                          <span>
                            {v.sum?.basic}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            {v.sum?.l1}
                          </span>
                          <span>
                            {v.sum?.half}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            {v.sum?.l2}
                          </span>
                          <span>
                            {v.sum?.half}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            IGST
                          </span>
                          <span>
                            {v.sum?.igst}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            TCS
                          </span>
                          <span>
                            {v.sum?.tcs}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Avg rate (with GST)
                          </span>
                          <span>
                            {v.sum?.avg}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Basic avg rate
                          </span>
                          <span>
                            {v.sum?.bavg}
                          </span>
                        </div>
                      </div>
                      <div className="box">
                        <h3>
                          Amount
                        </h3>
                        <div className="kv">
                          <span>
                            Quantity
                          </span>
                          <span>
                            {v.sum?.qty}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Gross amount
                          </span>
                          <span>
                            {v.sum?.basic}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            GST
                          </span>
                          <span>
                            {v.sum?.gst}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Gross total
                          </span>
                          <span>
                            {v.sum?.gross}
                          </span>
                        </div>
                        <div className="fld">
                          <label htmlFor="a1">
                            Add / less amount (+/−)
                          </label>
                          <input id="a1" className="inp" type="text" value={v.f?.addLess} onChange={v.set?.addLess} placeholder="0.00" />
                        </div>
                        <div className="kv">
                          <span>
                            Round off
                          </span>
                          <span>
                            {v.sum?.ro}
                          </span>
                        </div>
                        <div className="kv" style={{"paddingTop":"8px","borderTop":"1px dashed var(--bd2)"}}>
                          <span style={{"color":"var(--t1)","fontWeight":"600"}}>
                            Net amount
                          </span>
                          <span className="bigtotal">
                            {v.sum?.net}
                          </span>
                        </div>
                        <span className="words">
                          {v.sum?.words}
                        </span>
                      </div>
                      <div className="box">
                        <h3>
                          Remark
                        </h3>
                        <textarea className="inp" aria-label="Remark" placeholder="Printed on the bill" style={{"height":"120px"}} value={v.f?.remark} onChange={v.set?.remark} />
                        <div className="fld">
                          <label htmlFor="a2">
                            Opportunity no.
                          </label>
                          <input id="a2" className="inp" type="text" placeholder="Optional" value={v.f?.opportunityNo} onChange={v.set?.opportunityNo} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isTr ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="o1">
                          Transporter · from schedule
                        </label>
                        <select id="o1" className="inp" value={v.f?.transporterId} onChange={v.set?.transporterId}>
                          {(v.opt?.transporters || []).map((o, $index) => (
                            <Fragment key={$index}>
                              <option value={o?.v}>
                                {o?.l}
                              </option>
                            </Fragment>
                          ))}
                        </select>
                      </div>
                      <div className="fld">
                        <label htmlFor="o2">
                          Tran. doc no.
                        </label>
                        <input id="o2" className="inp" type="text" value={v.x?.tranDocNo} onChange={v.xset?.tranDocNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o3">
                          Tran. doc date
                        </label>
                        <input id="o3" className="inp" type="text" value={v.x?.tranDocDate} onChange={v.xset?.tranDocDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o4">
                          L.R. no.
                        </label>
                        <input id="o4" className="inp" type="text" value={v.f?.lrNo} onChange={v.set?.lrNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o5">
                          L.R. date
                        </label>
                        <input id="o5" className="inp" type="text" value={v.f?.lrDate} onChange={v.set?.lrDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o6">
                          Vehicle no.
                        </label>
                        <input id="o6" className="inp" type="text" value={v.f?.vehicleNo} onChange={v.set?.vehicleNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o7">
                          Driver name
                        </label>
                        <input id="o7" className="inp" type="text" value={v.f?.driverName} onChange={v.set?.driverName} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o8">
                          Driver license
                        </label>
                        <input id="o8" className="inp" type="text" value={v.x?.driverLicense} onChange={v.xset?.driverLicense} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o9">
                          No. of parcels
                        </label>
                        <input id="o9" className="inp" type="text" value={v.f?.parcels} onChange={v.set?.parcels} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o10">
                          Parcel no.
                        </label>
                        <input id="o10" className="inp" type="text" value={v.x?.parcelNo} onChange={v.xset?.parcelNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o11">
                          Godown
                        </label>
                        <input id="o11" className="inp" type="text" value={v.x?.godown} onChange={v.xset?.godown} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o12">
                          Haste
                        </label>
                        <input id="o12" className="inp" type="text" value={v.x?.haste} onChange={v.xset?.haste} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o13">
                          Policy no.
                        </label>
                        <input id="o13" className="inp" type="text" value={v.x?.policyNo} onChange={v.xset?.policyNo} />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isEi ? (
                  <>
                    <div className="ewb">
                      <div className="ewbh">
                        <span className="muted" style={{"fontSize":"13px"}}>
                          E-way bill
                        </span>
                        <span className="no">
                          {v.ew?.no}
                        </span>
                        <span className={v.ew?.tc}>
                          {v.ew?.tag}
                        </span>
                        <span className="muted" style={{"fontSize":"13px"}}>
                          {v.ew?.valid}
                        </span>
                        <div style={{"flex":"1"}} />
                        <button className="btn sm" type="button" onClick={v.ew?.main} disabled={v.busy}>
                          {v.ew?.mainL}
                        </button>
                        <button className="btn sm" type="button" onClick={v.ew?.print}>
                          Print EWB
                        </button>
                        <button className="btn sm" type="button" style={{"color":"#F87171"}} onClick={v.ew?.cancel} disabled={v.ew?.noCancel}>
                          Cancel EWB
                        </button>
                      </div>
                      <div className="ewbg">
                        <div className="ewbc">
                          <h4>
                            {"Part A "}
                            <span className="tag">
                              Consignment
                            </span>
                          </h4>
                          <span>
                            Supplier GSTIN
                          </span>
                          <span>
                            {v.ew?.sup}
                          </span>
                          <span>
                            Dispatch from
                          </span>
                          <span>
                            {v.ew?.from}
                          </span>
                          <span>
                            Recipient GSTIN
                          </span>
                          <span>
                            {v.pt?.gstin}{" · "}{v.party}
                          </span>
                          <span>
                            Deliver to
                          </span>
                          <span>
                            {v.ew?.to}
                          </span>
                          <span>
                            Document
                          </span>
                          <span>
                            {v.ew?.doc}
                          </span>
                          <span>
                            Value of goods
                          </span>
                          <span>
                            {v.sum?.gross}
                          </span>
                          <span>
                            HSN
                          </span>
                          <span>
                            {v.ew?.hsn}
                          </span>
                          <span>
                            Reason
                          </span>
                          <span>
                            Outward · Supply
                          </span>
                          <span>
                            Transporter
                          </span>
                          <span>
                            {v.ew?.tr}
                          </span>
                          <span>
                            Approx. distance
                          </span>
                          <span>
                            {v.ew?.km}
                          </span>
                        </div>
                        <div className="ewbc">
                          <h4>
                            {"Part B "}
                            <span className={v.ew?.pbC}>
                              {v.ew?.pbT}
                            </span>
                          </h4>
                          <span>
                            Filled by
                          </span>
                          <span>
                            {v.ew?.by}
                          </span>
                          <span>
                            Transporter ID
                          </span>
                          <span>
                            {v.ew?.tid}
                          </span>
                          <span>
                            Mode
                          </span>
                          <span>
                            Road
                          </span>
                          <span>
                            Vehicle no.
                          </span>
                          <span>
                            {v.ew?.veh}
                          </span>
                          <span>
                            Vehicle type
                          </span>
                          <span>
                            Regular
                          </span>
                          <span>
                            Transport doc (LR)
                          </span>
                          <span>
                            {v.ew?.lr}
                          </span>
                          <span>
                            From place
                          </span>
                          <span>
                            {v.ew?.place}
                          </span>
                          <span>
                            Entered on
                          </span>
                          <span>
                            {v.ew?.on}
                          </span>
                          <div className="pbh">
                            <span className="hk">
                              Vehicle updates by transporter
                            </span>
                            {(v.ew?.hist || []).map((h, $index) => (
                              <Fragment key={$index}>
                                <div className="pbr" style={sx(h?.st)}>
                                  <b>
                                    {h?.a}
                                  </b>
                                  <span>
                                    {h?.b}
                                  </span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          <div className="sync">
                            <span className="dotg" />
                            {v.ew?.sync}
                          </div>
                        </div>
                      </div>
                      <div className="einv">
                        <div>
                          <span>
                            E-invoice IRN
                          </span>
                          <span>
                            {v.ei?.irn}
                          </span>
                        </div>
                        <div>
                          <span>
                            Ack no.
                          </span>
                          <span>
                            {v.ei?.ack}
                          </span>
                        </div>
                        <div>
                          <span>
                            Ack date
                          </span>
                          <span>
                            {v.ei?.dt}
                          </span>
                        </div>
                        <div>
                          <span>
                            Status
                          </span>
                          <span className={v.ei?.tc} style={{"alignSelf":"flex-start"}}>
                            {v.ei?.st}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isRef ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="r3">
                          P.O. no.
                        </label>
                        <input id="r3" className="inp" type="text" value={v.f?.refNo} onChange={v.set?.refNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="r4">
                          Supplier
                        </label>
                        <input id="r4" className="inp" type="text" value={v.x?.supplier} onChange={v.xset?.supplier} />
                      </div>
                      <div className="fld">
                        <label htmlFor="r5">
                          Collection person
                        </label>
                        <select id="r5" className="inp" value={v.f?.collectionPersonId} onChange={v.set?.collectionPersonId}>
                          <option value="">
                            —
                          </option>
                          {(v.opt?.collectors || []).map((o, $index) => (
                            <Fragment key={$index}>
                              <option value={o?.v}>
                                {o?.l}
                              </option>
                            </Fragment>
                          ))}
                        </select>
                      </div>
                      <div className="fld">
                        <label htmlFor="r6">
                          Adj. bill no.
                        </label>
                        <input id="r6" className="inp" type="text" value={v.x?.adjBillNo} onChange={v.xset?.adjBillNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="r7">
                          Adj. bill date
                        </label>
                        <input id="r7" className="inp" type="text" value={v.x?.adjBillDate} onChange={v.xset?.adjBillDate} />
                      </div>
                    </div>
                  </>
                ) : null}
              </section>
              <div className="actbar">
                <span className="actsum">
                  <span>
                    {"Qty "}
                    <b>
                      {v.tot?.wt}{" kg"}
                    </b>
                  </span>
                  <span>
                    {"Net "}
                    <b>
                      {v.sum?.net}
                    </b>
                  </span>
                </span>
                {' '}
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
                  <option>
                    Other fields
                  </option>
                </select>
                {' '}
                <button className="btn no" type="button" onClick={v.remove} disabled={v.busy}>
                  Delete
                </button>
                <div style={{"flex":"1"}} />
                <span className={v.noteCls} style={{"fontSize":"13px","maxWidth":"340px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}} role="status" title={v.updNote}>
                  {v.updNote}
                </span>
                <DcLink className="btn gh" href={v.backHref}>
                  {v.closeLabel}
                </DcLink>
                {' '}
                <button className="btn" type="button" onClick={v.savePrint} disabled={v.busy}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9V2h12v7" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect width="12" height="8" x="6" y="14" />
                  </svg>
                  {"Save & print"}
                </button>
                {' '}
                <button className="btn pr" type="button" onClick={v.doUpdate} disabled={v.busy}>
                  {v.saveLabel}
                </button>
              </div>
            </div>
            {v.hist ? (
              <>
                <aside className="rp" aria-label="Party history">
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"0 20px","minHeight":"56px","borderBottom":"1px solid var(--bd)"}}>
                    <b style={{"fontWeight":"600","flex":"1"}}>
                      Party history
                    </b>
                    <button className="btn sm gh" type="button" onClick={v.toggleHist} aria-label="Close history">
                      ✕
                    </button>
                  </div>
                  <div className="hist">
                    <div className="muted" style={{"fontSize":"13px"}}>
                      {v.party}
                    </div>
                    <div className="hcard">
                      <span className="hk">
                        Total sale · FY 26-27
                      </span>
                      <div className="kv">
                        <span>
                          Bills
                        </span>
                        <span>
                          {v.pt?.bills}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Value
                        </span>
                        <span>
                          {v.pt?.total}
                        </span>
                      </div>
                    </div>
                    <div className="hcard">
                      <span className="hk">
                        This bill
                      </span>
                      <div className="kv">
                        <span>
                          Bill amount
                        </span>
                        <span>
                          {v.sum?.net}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Received
                        </span>
                        <span>
                          {v.pt?.recv}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Balance
                        </span>
                        <span>
                          {v.pt?.bal}
                        </span>
                      </div>
                      <span className={v.pt?.dueC} style={{"alignSelf":"flex-start"}}>
                        {v.pt?.dueT}
                      </span>
                    </div>
                    <div className="hcard">
                      <span className="hk">
                        Billing against
                      </span>
                      <div className="kv">
                        <span>
                          Order no.
                        </span>
                        <span>
                          {v.sum?.first}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Date
                        </span>
                        <span>
                          {v.sum?.firstDt}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Item
                        </span>
                        <span>
                          {v.sum?.firstIt}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Rate
                        </span>
                        <span>
                          {v.sum?.firstRate}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Pending after bill
                        </span>
                        <span>
                          {v.sum?.pend}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>
              </>
            ) : null}
          </div>
        </div>
        {v.pick ? (
          <>
            <div className="ovl">
              <div className="mdl" role="dialog" aria-modal="true" aria-label="New sale bill · select dispatch schedule">
                <div className="mh">
                  <div style={{"flex":"1","display":"flex","flexDirection":"column","gap":"6px"}}>
                    <b>
                      New sale bill · select dispatch schedule
                    </b>
                    <div className="stepper">
                      <span className="on">
                        <i>
                          1
                        </i>
                        {" Select dispatch schedule"}
                      </span>
                      <span>
                        →
                      </span>
                      <span>
                        <i>
                          2
                        </i>
                        {" Check items & save bill"}
                      </span>
                    </div>
                  </div>
                  <button className="btn sm gh" type="button" onClick={v.cancelPick} aria-label="Close">
                    ✕
                  </button>
                </div>
                <div className="mf">
                  <input className="inp" type="search" placeholder="Search schedule no., party, item or lot" aria-label="Search dispatch schedules" value={v.mq} onChange={v.setMq} />
                  <select className="inp" aria-label="Party" value={v.mp} onChange={v.setMp}>
                    <option value="">
                      All parties
                    </option>
                    {(v.mParties || []).map((o, $index) => (
                      <Fragment key={$index}>
                        <option>
                          {o}
                        </option>
                      </Fragment>
                    ))}
                  </select>
                  <select className="inp" aria-label="Transporter" value={v.mt} onChange={v.setMt}>
                    <option value="">
                      All transporters
                    </option>
                    {(v.mTrs || []).map((o, $index) => (
                      <Fragment key={$index}>
                        <option>
                          {o}
                        </option>
                      </Fragment>
                    ))}
                  </select>
                  <span className="muted" style={{"alignSelf":"center","fontSize":"13px"}}>
                    Only approved dispatch schedules not yet billed are shown · details are fetched into the bill
                  </span>
                </div>
                <div className="mt">
                  <table>
                    <thead>
                      <tr>
                        <th style={{"width":"40px"}} />
                        <th>
                          Schedule
                        </th>
                        <th>
                          Party · delivery
                        </th>
                        <th>
                          Item
                        </th>
                        <th>
                          Order
                        </th>
                        <th className="r">
                          Cartons
                        </th>
                        <th className="r">
                          Sch. qty kg
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th>
                          Transporter · vehicle
                        </th>
                        <th className="r">
                          Bill qty kg
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.poNone ? (
                        <>
                          <tr>
                            <td colSpan="10" className="muted" style={{"textAlign":"center","padding":"28px"}}>
                              {v.poEmpty}
                            </td>
                          </tr>
                        </>
                      ) : null}
                      {(v.po || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <tr className={o?.rc}>
                            <td>
                              <input className="cb" type="checkbox" checked={o?.on} onChange={o?.tog} aria-label={`Select schedule ${o?.ds ?? ""}`} />
                            </td>
                            <td>
                              <div style={{"fontWeight":"500"}}>
                                {o?.ds}
                              </div>
                              <div className="sub">
                                {o?.dsdt}{" · "}{o?.age}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.p}
                              </div>
                              <div className="sub">
                                {"To "}{o?.dp}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.it}
                              </div>
                              <div className="sub">
                                {o?.br}{" · "}{o?.lot}{" · "}{o?.gr}
                              </div>
                            </td>
                            <td className="t2">
                              {o?.no}
                            </td>
                            <td className="r">
                              {o?.ctn}
                            </td>
                            <td className="r" style={{"fontWeight":"600"}}>
                              {o?.sq}
                            </td>
                            <td className="r">
                              {o?.rate}
                            </td>
                            <td>
                              <div>
                                {o?.tr}
                              </div>
                              <div className="sub">
                                {o?.veh}
                              </div>
                            </td>
                            <td className="r">
                              <input className="cin r" type="text" value={o?.bq} onChange={o?.setQ} aria-label="Quantity to bill" style={{"width":"110px"}} />
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mb">
                  <span style={{"flex":"1"}}>
                    {v.selText}
                  </span>
                  <button className="btn gh" type="button" onClick={v.cancelPick}>
                    Cancel
                  </button>
                  <button className="btn pr" type="button" onClick={v.applyPick} disabled={v.noDraft}>
                    Continue to bill →
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
        <div className="aiw">
          <Assistant page="disp" />
        </div>
      </div>
      </>
    );
  }
}

export default function Dispatch(props) {
  const theme = useTheme();
  return <DispatchView {...props} theme={theme} />;
}
