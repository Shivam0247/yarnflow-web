/* eslint-disable */
// PurchaseBill — converted 1:1 from the YarnFlow design (PurchaseBill.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './PurchaseBill.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) {
    super(p);
    this.state = { z: 1, more: false, hist: true, tcs: false, tab: 'sum', pick: null, sel: p.startPicker ? [] : ['PUR2214'], qty: p.startPicker ? {} : { PUR2214: '206.830' }, draft: null, dqty: null,
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
      const rd = () => { try { const raw = window.localStorage.getItem('yf-open-pb'); if (raw && raw !== this._raw) { this._raw = raw; const r = JSON.parse(raw); this.setState({ brec: r, upd: false }); if (api && r.id) this.openBill(r.id); } } catch (e) {} };
      this._rd = rd; rd(); this._iv = setInterval(rd, 700); try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {}
    }
    try { const b = JSON.parse(window.localStorage.getItem('yf-back') || 'null'); if (b && b.href) this.setState({ back: b }); } catch (e) {}
    try { const fl = window.localStorage.getItem('yf-flash'); if (fl) { window.localStorage.removeItem('yf-flash'); this.setState({ note: fl }); } } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }

  async init() {
    const api = this.api(); if (!api) return;
    try {
      const [lk, pl, co, list] = await Promise.all([api.lookups(), api.get('/vouchers/purchase-orders/pending-lines', { for: 'purchase-bills' }), api.get('/company'), api.get('/vouchers/purchase-bills', { pageSize: 1000 })]);
      const book = lk.books.find((b) => b.voucherType === 'PURCHASE_BILL' && b.isDefault) || lk.books.find((b) => b.voucherType === 'PURCHASE_BILL');
      const gd = lk.godowns.find((g) => g.isDefault) || lk.godowns[0];
      this.setState({ lk, pl, co, bills: list.data, f: { ...this.state.f, bookId: this.state.f.bookId || (book ? String(book.id) : ''), godownId: this.state.f.godownId || (gd ? String(gd.id) : '') } });
      if (!this.state.doc) { const nx = await api.get('/vouchers/purchase-bills/next-number', book ? { bookId: book.id } : undefined); this.setState({ nextNo: nx.number }); }
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async reloadPending() { const api = this.api(); if (!api) return; try { this.setState({ pl: await api.get('/vouchers/purchase-orders/pending-lines', { for: 'purchase-bills' }) }); } catch (e) {} }

  async openBill(id) {
    const api = this.api(); if (!api) return;
    try { const d = await api.get('/vouchers/purchase-bills/' + id); this.fill(d); this.loadParty(d.partyId); } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  fill(d) {
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    const dmy = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('-') : '');
    const rows = d.lines.map((l) => ({ key: 'L' + l.id, lineId: l.id, sourceLineId: l.sourceLineId, no: (l.orderNumber || l.sourceNumber || '—').replace(/\/\d{2}-\d{2}$/, ''), ch: l.challanNo || d.refNo || '—', lr: l.lrNo || '—', dt: dmy(d.date), dsdt: dmy(l.challanDate || d.date),
      p: d.partyName, partyId: d.partyId, it: l.itemName || l.description || '', itemId: l.itemId, iid: l.itemCode || '—', br: l.brand || '—', lot: l.lotNo || '—', gr: l.grade || '—', hsn: l.hsn || '—', unit: l.unit, rate: Number(l.rate),
      oq: Number(l.qty), dq: 0, sq: Number(l.qty), ctn: Number(l.pcs) || 0, cops: Number(l.cops) || 0, gstRate: Number(l.gstRate), discPct: Number(l.discPct) || 0, freightPct: Number(l.freightPct) || 0, insPct: Number(l.insurancePct) || 0,
      pid: l.purchaseRef || '—', pinv: l.purchaseInvNo || '—', rem: l.remark1 || '—', godownId: l.godownId }));
    const qty = {}; rows.forEach((r) => { qty[r.key] = String(r.sq); });
    this.setState({ doc: d, docRows: rows, sel: rows.map((r) => r.key), qty, tcs: !!d.isTcs,
      f: { bookId: s(d.bookId), date: dmy(d.date), addLess: d.addLess ? s(d.addLess) : '', remark: s(d.remark), opportunityNo: s(d.opportunityNo), transporterId: s(d.transporterId), lrNo: s(d.lrNo), lrDate: dmy(d.lrDate), vehicleNo: s(d.vehicleNo),
        driverName: s(d.driverName), parcels: d.parcels ? s(d.parcels) : '', refNo: s(d.refNo), refDate: dmy(d.refDate), doNo: s(d.doNo), currency: d.currency || 'INR', collectionPersonId: s(d.collectionPersonId), godownId: s(d.godownId || (d.lines[0] && d.lines[0].godownId) || '') },
      x: { ...(d.extra || {}) } });
  }
  async loadParty(id) {
    const api = this.api(); if (!api || !id || (this.state.ps || {})[id]) return;
    try { const sm = await api.get('/accounts/' + id + '/summary'); this.setState({ ps: { ...(this.state.ps || {}), [id]: sm } }); } catch (e) {}
  }

  /** rows the user can pick: pending dispatch-schedule lines (app) or the sample orders (canvas) */
  rowsLive() {
    const st = this.state; const lk = st.lk; if (!lk) return [];
    const cust = new Map(lk.suppliers.map((c) => [c.id, c]));
    const dmy = (iso) => String(iso).slice(0, 10).split('-').reverse().join('-');
    const days = (iso) => Math.max(0, Math.round((Date.now() - new Date(String(iso).slice(0, 10) + 'T00:00:00').getTime()) / 864e5));
    const out = (st.pl || []).map((l) => { const c = cust.get(l.partyId) || {}; const d = days(l.date); const ctn = l.pcs ? Math.max(1, Math.round(l.pcs * l.pendingQty / Math.max(l.qty, 0.001))) : 0;
      return { key: String(l.lineId), sourceLineId: l.lineId, no: l.number.replace(/\/\d{2}-\d{2}$/, ''), ch: '—', lr: '—', dt: dmy(l.date), dsdt: dmy(l.date), age: d === 0 ? 'today' : d === 1 ? '1 day' : d + ' days',
        p: l.partyName, partyId: l.partyId, g: c.partyGroupName ? 'Group · ' + c.partyGroupName : 'Direct', dp: l.deliveryPartyName || l.partyName, it: l.itemName, itemId: l.itemId, iid: l.itemCode, br: l.brand || '—', lot: l.lotNo || '—', gr: l.grade || '—', hsn: l.hsn || '—', unit: l.unit,
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
    if (!rows.length) return this.fail('Select a purchase order first');
    if (!f.refNo) return this.fail('Enter the supplier invoice no.');
    if (!iso(f.date)) return this.fail('Bill date must be dd-mm-yyyy');
    const bad = rows.findIndex((r) => !(n(st.qty[r.key] ?? r.sq) > 0)); if (bad >= 0) return this.fail('Enter the weight to bill on line ' + (bad + 1));
    const c = st.lk.suppliers.find((p) => p.id === rows[0].partyId) || {};
    const ex = {}; Object.keys(x).forEach((k) => { if (x[k]) ex[k] = String(x[k]); });
    return {
      bookId: id(f.bookId), date: iso(f.date), partyId: rows[0].partyId, brokerId: c.brokerId || null, salesPersonId: c.salesPersonId || null, isTcs: !!st.tcs, godownId: id(f.godownId),
      refDate: iso(f.refDate), doNo: f.doNo || null, currency: f.currency || 'INR',
      transporterId: id(f.transporterId) || null, vehicleNo: f.vehicleNo || null, lrNo: f.lrNo || null, lrDate: iso(f.lrDate), driverName: f.driverName || null, parcels: n(f.parcels),
      refNo: f.refNo || null, remark: f.remark || null, addLess: n(f.addLess) || 0, collectionPersonId: id(f.collectionPersonId), extra: ex,
      lines: rows.map((r) => { const q = n(st.qty[r.key] ?? r.sq); const ctn = Math.abs(q - r.sq) < 0.001 ? r.ctn : r.ctn ? Math.max(1, Math.round(q / (r.sq / r.ctn))) : 0;
        return { itemId: r.itemId, brand: r.br === '—' ? null : r.br, lotNo: r.lot === '—' ? null : r.lot, grade: r.gr === '—' ? null : r.gr, unit: r.unit, pcs: ctn, cops: r.cops && r.ctn ? Math.round(r.cops / r.ctn * ctn) : 0, qty: q, rate: r.rate,
          discPct: r.discPct, freightPct: r.freightPct, gstRate: r.gstRate, challanNo: r.ch === '—' ? null : r.ch, godownId: id(f.godownId) || r.godownId || null, sourceLineId: r.sourceLineId || null }; })
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
      const d = doc ? await api.put('/vouchers/purchase-bills/' + doc.id, body) : await api.post('/vouchers/purchase-bills', body);
      api.invalidate();
      if (print) window.print();
      const msg = (doc ? '✓ Updated ' : '✓ Saved ') + d.number + (d.tdsAmount ? ' — TDS ₹ ' + d.tdsAmount.toFixed(2) + ' deducted' : '');
      if (doc) { this.fill(d); this.setState({ busy: false, note: msg, err: false, upd: true }); this.reloadPending(); return; }
      try { window.localStorage.setItem('yf-open-pb', JSON.stringify({ t: Date.now(), id: d.id, no: d.number })); window.localStorage.setItem('yf-flash', msg); } catch (e) {}
      if (this.props.startPicker) { this.go('PurchaseBill' + this.sfx() + '.dc.html'); return; }
      this._raw = null; this.setState({ busy: false }); this._rd && this._rd();
    } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  async remove() {
    const api = this.api(); const doc = this.state.doc;
    if (!doc) { this.setState({ sel: [], qty: {}, note: 'Cleared', err: false }); return; }
    if (!window.confirm('Delete purchase bill ' + doc.number + '? Stock and the party ledger are reversed.')) return;
    this.setState({ busy: true });
    try { await api.del('/vouchers/purchase-bills/' + doc.id); api.invalidate(); this.go('PurchaseBillList' + this.sfx() + '.dc.html'); }
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
      const sup = new Map(lk.suppliers.map((c) => [c.id, c])); const nm = new Map(lk.ledgers.map((a) => [a.id, a.name])); const spn = new Map(lk.salesPersons.map((x) => [x.id, x.name]));
      const gd = lk.godowns.find((g) => String(g.id) === String(st.f.godownId)) || lk.godowns[0];
      PO.forEach((r) => { if (PT[r.p]) return; const c = sup.get(r.partyId) || {}; const sm = (st.ps || {})[r.partyId]; const fy = sm ? sm.fyTotals.find((t) => t.type === 'PURCHASE_BILL') : null;
        PT[r.p] = { id: r.partyId, g: c.partyGroupName || r.p, agent: c.brokerId ? nm.get(c.brokerId) || '—' : 'Direct', sp: c.salesPersonId ? spn.get(c.salesPersonId) || '—' : '—', cr: c.creditDays || 0, gstin: c.gstin || '—', pan: c.pan || '—',
          out: '₹ ' + inr(sm ? sm.outstanding : Math.max(0, -(c.balance || 0)), 0), total: fy ? '₹ ' + inr(fy.amount, 0) : '—', bills: fy ? String(fy.count) : '—', del: gd ? 'Our godown · ' + gd.name : '—', stateCode: c.stateCode,
          tdsRate: c.tdsApplicable ? Number(c.tdsRate) || 0 : 0 }; });
    } else {
      PO = [{"no": "PUR2214", "dt": "18-10-2026", "p": "Bandhan Filaments", "g": "Agent · Henil", "it": "50/48 CREP", "br": "RK Fashion", "lot": "N500", "rate": 252.44, "oq": 1000, "dq": 0, "age": "5 days", "gr": "1ST", "iid": "70", "hsn": "54024700", "ch": "13610"}, {"no": "PUR2216", "dt": "20-10-2026", "p": "Bandhan Filaments", "g": "Agent · Henil", "it": "75/72 Roto", "br": "RK Fashion", "lot": "N512", "rate": 141.5, "oq": 1500, "dq": 0, "age": "3 days", "gr": "1ST", "iid": "74", "hsn": "54024700", "ch": "13618"}, {"no": "PUR2923", "dt": "13-12-2025", "p": "Daya Tex Industries", "g": "Agent · Direct", "it": "75/72 Roto Lim", "br": "Daya", "lot": "014850", "rate": 105, "oq": 11000, "dq": 8113.77, "age": "314 days", "gr": "1ST", "iid": "52", "hsn": "54024700", "ch": "DT/4410"}, {"no": "PUR0080", "dt": "08-04-2026", "p": "Reliance Industries", "g": "Agent · Direct", "it": "75/72 FDY", "br": "Reliance", "lot": "336C1M", "rate": 122.5, "oq": 31000, "dq": 28332.69, "age": "198 days", "gr": "A+", "iid": "12", "hsn": "54024700", "ch": "RIL/89120"}, {"no": "PUR0570", "dt": "28-05-2026", "p": "Shree Ram Yarn Trading", "g": "Agent · Direct", "it": "50/36 Bright Catonic", "br": "AYM Syntex", "lot": "FG7C13", "rate": 155.72, "oq": 10000, "dq": 4999.2, "age": "148 days", "gr": "1ST", "iid": "33", "hsn": "54024700", "ch": "SRY/771"}, {"no": "PUR0573", "dt": "29-05-2026", "p": "Radiant Polyester", "g": "Agent · Direct", "it": "80/48 BSY", "br": "Radiant", "lot": "R80/48", "rate": 155, "oq": 31000, "dq": 21326.55, "age": "147 days", "gr": "1ST", "iid": "41", "hsn": "54024700", "ch": "RP/2290"}, {"no": "PUR0639", "dt": "08-06-2026", "p": "GTX Private Limited", "g": "Agent · Direct", "it": "150 Limaya", "br": "GTPL", "lot": "LMY222", "rate": 149, "oq": 5000, "dq": 3948.162, "age": "137 days", "gr": "1ST", "iid": "58", "hsn": "54024700", "ch": "GTX/118"}];
      PT = {"Bandhan Filaments": {"g": "Bandhan Filaments", "agent": "Henil Vatsal Shah", "sp": "Manoj Bhai", "cr": 5, "gstin": "24AAKFB2290Q1Z6", "pan": "AAKFB2290Q", "out": "₹ 1,62,480", "total": "₹ 10,44,566", "bills": "21", "del": "Our godown · Sachin GIDC"}, "Daya Tex Industries": {"g": "Daya Tex Industries", "agent": "Direct", "sp": "Avi M", "cr": 30, "gstin": "24AAFFD6612H1Z0", "pan": "AAFFD6612H", "out": "₹ 4,12,300", "total": "₹ 9,86,400", "bills": "12", "del": "Our godown · Pandesara"}, "Reliance Industries": {"g": "Reliance Industries", "agent": "Direct", "sp": "Avi M", "cr": 60, "gstin": "26AAACR4471L1Z8", "pan": "AAACR4471L", "out": "₹ 38,40,000", "total": "₹ 3,12,40,000", "bills": "96", "del": "Our godown · Sachin GIDC"}, "Shree Ram Yarn Trading": {"g": "Shree Ram Yarn Trading", "agent": "Direct", "sp": "Avi M", "cr": 30, "gstin": "24AAPFS2208J1Z5", "pan": "AAPFS2208J", "out": "₹ 7,78,500", "total": "₹ 15,57,000", "bills": "9", "del": "Our godown · Kadodara"}, "Radiant Polyester": {"g": "Radiant Polyester", "agent": "Direct", "sp": "Avi M", "cr": 45, "gstin": "24AABCR8890E1Z3", "pan": "AABCR8890E", "out": "₹ 14,99,000", "total": "₹ 33,05,000", "bills": "24", "del": "Our godown · Sachin GIDC"}, "GTX Private Limited": {"g": "GTX Private Limited", "agent": "Direct", "sp": "Avi M", "cr": 30, "gstin": "24AADCG3317B1Z6", "pan": "AADCG3317B", "out": "₹ 1,56,700", "total": "₹ 5,88,200", "bills": "7", "del": "Our godown · Pandesara"}};
      PO.forEach((r) => { r.key = r.no; r.sq = r.oq - r.dq; r.ctn = Math.max(1, Math.round(r.sq / 25.85)); r.cops = 0; r.gstRate = 5; r.discPct = 0; r.freightPct = 0; r.insPct = 0; r.rem = '—'; r.lr = '—'; r.code = r.iid; });
    }
    const find = (k) => PO.find((r) => r.key === k);
    const pick = st.pick ?? (this.props.startPicker ?? false);
    const sel = st.sel; const qty = st.qty;
    const draft = st.draft ?? sel; const dqty = st.dqty ?? qty;
    const dRows = PO.filter((r) => draft.indexOf(r.key) >= 0);
    const dParty = dRows.length ? dRows[0].p : null;
    const mq = (st.mq || '').toLowerCase();
    const pickable = PO.filter((r) => !String(r.key).startsWith('L'));
    const poVis = pickable.filter((r) => (!mq || [r.no, r.p, r.it, r.lot, r.br].join(' ').toLowerCase().indexOf(mq) >= 0) && (!st.mp || r.p === st.mp) && (!st.mt || r.it === st.mt));
    const po = poVis.map((r) => { const on = draft.indexOf(r.key) >= 0; const other = dParty && r.p !== dParty; const pend = r.oq - r.dq;
      return { no: r.no, dt: r.dt, p: r.p, g: r.g, it: r.it, br: r.br, lot: r.lot, age: r.age, rate: inr(r.rate, 2), oq: inr(r.oq, 3), dq: inr(r.dq, 3), pq: inr(pend, 3),
        bq: dqty[r.key] ?? inr(r.sq, 3), on, rc: on ? 'on' : (other ? 'off' : ''),
        setQ: (e) => this.setState({ draft, dqty: { ...dqty, [r.key]: e.target.value } }),
        tog: () => this.setState({ draft: on ? draft.filter((x) => x !== r.key) : (other ? [r.key] : draft.concat([r.key])), dqty }) }; });
    const dQty = dRows.reduce((a, r) => a + num(dqty[r.key] ?? r.sq), 0);
    const rows = sel.map(find).filter(Boolean);
    const party = rows.length ? rows[0].p : null; const pt = party ? PT[party] : null;
    if (live && pt && pt.id && !(st.ps || {})[pt.id]) this.loadParty(pt.id);
    const inter = live && pt && pt.stateCode && lk.companyStateCode ? pt.stateCode !== lk.companyStateCode : false;
    let T = { q: 0, ctn: 0, cops: 0, basic: 0, dr: 0, fr: 0, ir: 0, tx: 0, gst: 0 }; const rates = new Set();
    const items = rows.map((r, i) => { const q = num(qty[r.key] ?? r.sq); const basic = q * r.rate; const dr = basic * (r.discPct || 0) / 100; const fr = (basic - dr) * (r.freightPct || 0) / 100; const ir = (basic - dr) * (r.insPct || 0) / 100;
      const tx = basic - dr + fr + ir; const g = tx * (r.gstRate ?? 5) / 100; const ctn = q > 0 ? (live ? (r.ctn ? (Math.abs(q - r.sq) < 0.001 ? r.ctn : Math.max(1, Math.round(q / (r.sq / r.ctn)))) : 0) : Math.max(1, Math.round(q / 25.85))) : 0; const cops = r.ctn ? Math.round((r.cops || 0) / r.ctn * ctn) : 0;
      T.q += q; T.ctn += ctn; T.cops += cops; T.basic += basic; T.dr += dr; T.fr += fr; T.ir += ir; T.tx += tx; T.gst += g; rates.add(r.gstRate ?? 5);
      return { n: i + 1, iid: r.iid, code: r.iid, it: r.it, br: r.br, hsn: r.hsn, gr: r.gr, unit: /^kg$/i.test(r.unit || 'Kg') ? 'Kg' : r.unit, rem: r.rem || '—', lr: r.lr || st.f.lrNo || '—', ch: live ? (st.f.refNo || r.ch) : r.ch, chd: live ? (st.f.refDate || r.dsdt) : '23-10-2026', lot: r.lot,
        ctn, cops, q: qty[r.key] ?? inr(r.sq, 3), rate: inr(r.rate, 2), basic: inr(basic, 2), dp: String(r.discPct || 0), dr: inr(dr, 2), fp: String(r.freightPct || 0), fr: inr(fr, 2), ip: String(r.insPct || 0), ir: inr(ir, 2), tx: inr(tx, 2), gst: inr(g, 2), amt: inr(tx + g, 2),
        setQ: (e) => this.setState({ qty: { ...qty, [r.key]: e.target.value } }) }; });
    const gst = T.gst; const gross = T.tx + gst; const al = num(st.f.addLess);
    const doc = st.doc;
    const tdsRate = live ? (doc ? Number(doc.tdsRate) || 0 : pt ? pt.tdsRate : 0) : 0.1;
    const tcs = st.tcs ? (gross + al) * 0.1 / 100 : 0;
    const net = Math.round(gross + al + tcs);
    const tds = live && doc ? doc.tdsAmount || 0 : live ? Math.round(T.tx * tdsRate / 100 * 100) / 100 : Math.round(T.basic * 0.001);
    const pendAfter = rows.reduce((a, r) => a + (r.oq - r.dq) - num(qty[r.key] ?? (r.oq - r.dq)), 0);
    const addDays = (s, n) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(s || '')); if (!m) return '—'; const t = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]) + n * 864e5); const z = (x) => String(x).padStart(2, '0'); return z(t.getUTCDate()) + '-' + z(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear(); };
    const ords = [...new Set(rows.map((r) => r.no))];
    const ordLabel = rows.length === 0 ? 'Select order…' : ords.length === 1 ? (/\//.test(ords[0]) ? ords[0] : ords[0] + '/26-27') + ' · ' + rows[0].it : ords.length + ' orders · ' + ords.join(', ');
    const P0 = pt || { g: '—', del: '—', agent: '—', sp: '—', cr: 0, gstin: '—', pan: '—', out: '—', total: '—', bills: '—' };
    const BK = st.back;
    const BR = st.brec || null;
    const isRec = live ? !!doc : !!BR;
    const recNo = live ? (doc ? doc.number : st.nextNo || '…') : BR ? BR.no : 'PUR21329/26-27';
    const billDt = live ? st.f.date || dmyNow : BR ? BR.dt : '21-10-2026';
    const billV = { billNo: recNo, billDt, regLabel: isRec ? 'Purchase bill register' : 'Purchase bills', billTag: isRec ? (doc && doc.status === 'CANCELLED' ? 'Cancelled' : 'Saved') : '', billTagC: isRec ? (doc && doc.status === 'CANCELLED' ? 'tag t-red' : 'tag') : '',
      closeLabel: isRec ? 'Close' : 'Cancel', saveLabel: st.busy ? 'Saving…' : isRec ? (st.upd ? '✓ Updated' : 'Update bill') : 'Save bill',
      updNote: st.note || (isRec ? (st.upd ? 'Changes saved to ' + recNo : 'Editing ' + recNo) : ''), noteCls: st.err ? 'tag t-red' : 'muted', busy: !!st.busy,
      doUpdate: () => this.save(false), savePrint: () => this.save(true), remove: () => this.remove() };
    const BL = st.bills || []; const bi = doc ? BL.findIndex((b) => b.id === doc.id) : -1;
    const openId = (b) => { if (!b) return; try { window.localStorage.setItem('yf-open-pb', JSON.stringify({ t: Date.now(), id: b.id, no: b.number })); } catch (e) {} if (this.props.startPicker) this.go('PurchaseBill' + sfx + '.dc.html'); };
    const f = { ...st.f, refNo: st.f.refNo ?? (live ? '' : '13610'), refDate: st.f.refDate ?? (live ? '' : '21-10-2026'), vehicleNo: st.f.vehicleNo ?? (live ? '' : 'GJ-19-Z-0040'), currency: st.f.currency || 'INR', doNo: st.f.doNo ?? '' };
    const set = {}; ['bookId', 'date', 'addLess', 'remark', 'transporterId', 'lrNo', 'lrDate', 'vehicleNo', 'driverName', 'parcels', 'refNo', 'refDate', 'doNo', 'currency', 'collectionPersonId', 'godownId'].forEach((k) => { set[k] = (e) => this.setState({ f: { ...this.state.f, [k]: e.target.value }, note: this.state.err ? '' : this.state.note, err: false }); });
    const x = { ...(live ? {} : { transporterExpense: '0.00' }), ...st.x };
    const xset = {}; ['driverLicense', 'transporterExpense', 'ewbNo', 'irn', 'ackNo', 'ackDate', 'beDate', 'port', 'refInvNo', 'refInvDate', 'adjBillNo', 'adjBillDate', 'debitNoteNo', 'debitNoteDate', 'dcpiNo'].forEach((k) => { xset[k] = (e) => this.setState({ x: { ...x, [k]: e.target.value } }); });
    const opts = (list) => (list || []).map((o) => ({ v: String(o.id), l: o.name }));
    const opt = live ? { books: opts(lk.books.filter((b) => b.voucherType === 'PURCHASE_BILL')), transporters: opts(lk.transporters), collectors: opts(lk.collectionPersons), godowns: opts(lk.godowns) }
      : { books: [{ v: '', l: 'Yarn purchase A/c new' }, { v: 'i', l: 'Yarn purchase A/c · import' }, { v: 'g', l: 'General purchase A/c' }], transporters: [{ v: 'n', l: 'Navkar Roadlines' }, { v: 'j', l: 'Jay Ambe Roadlines' }], collectors: [{ v: 'p', l: 'Prakash' }], godowns: [{ v: '', l: 'Sachin GIDC' }] };
    if (!live) { f.transporterId = st.f.transporterId ?? 'n'; f.collectionPersonId = st.f.collectionPersonId ?? 'p'; }
    const dueDt = pt ? addDays(live ? (f.refDate || billDt) : '21-10-2026', Number(P0.cr) || 0) : '—';
    const paid = live && doc && doc.pending != null && doc.pending <= 0.5;
    const rate1 = rates.size === 1 ? [...rates][0] : null;
    const parties = [...new Set(pickable.map((r) => r.p))].sort(); const its = [...new Set(pickable.map((r) => r.it))].sort();
    return { ...billV, backHref: BK ? BK.href : 'PurchaseBillList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Purchase bill register',
      fitStyle: 'height: 100vh',
      theme, more: st.more, hist: st.hist, pick, po, poNone: live && po.length === 0, poEmpty: pickable.length ? 'No order matches the filters' : 'No approved purchase order is waiting for goods. Make a purchase order first.',
      mq: st.mq, setMq: (e) => this.setState({ mq: e.target.value }), mp: st.mp, setMp: (e) => this.setState({ mp: e.target.value }), mt: st.mt, setMt: (e) => this.setState({ mt: e.target.value }), mParties: live ? parties : ['Bandhan Filaments', 'Daya Tex Industries'], mItems: live ? its : ['50/48 CREP', '75/72 Roto'],
      navNo: live ? (doc ? doc.number : (BL[0] ? BL[0].number : '—')) : 'PUR21329/26-27',
      prevBill: () => (live ? openId(bi >= 0 ? BL[bi + 1] : BL[0]) : null), nextBill: () => (live && bi > 0 ? openId(BL[bi - 1]) : null),
      colsLabel: st.more ? 'Fewer columns' : 'All columns',
      toggleCols: () => this.setState({ more: !st.more }),
      toggleHist: () => this.setState({ hist: !st.hist }),
      tcsY: st.tcs ? 'on' : '', tcsN: st.tcs ? '' : 'on',
      setTcsY: () => this.setState({ tcs: true }), setTcsN: () => this.setState({ tcs: false }),
      tdsTag: tdsRate ? 'TDS ' + tdsRate + '%' : 'No TDS', tdsC: tdsRate ? 'tag t-orange' : 'tag',
      tdsInfo: () => window.alert(tdsRate ? 'TDS u/s 194Q at ' + tdsRate + '% on the taxable value (' + '₹ ' + inr(T.tx, 2) + '). It is credited to TDS payable and reduces what we pay the mill.' : 'This supplier is not marked for TDS in the account master.'),
      gstr: live ? { t: doc ? 'Check after GSTR-2B' : 'Not filed yet', c: 'tag' } : { t: 'Invoice matched', c: 'tag t-green' },
      tabCls: { sum: tab === 'sum' ? 'on' : '', tr: tab === 'tr' ? 'on' : '', ei: tab === 'ei' ? 'on' : '', ref: tab === 'ref' ? 'on' : '' },
      setTab: { sum: () => this.setState({ tab: 'sum' }), tr: () => this.setState({ tab: 'tr' }), ei: () => this.setState({ tab: 'ei' }), ref: () => this.setState({ tab: 'ref' }) },
      isSum: tab === 'sum', isTr: tab === 'tr', isEi: tab === 'ei', isRef: tab === 'ref',
      openPick: () => { if (live && doc) { this.setState({ note: 'A saved bill keeps its orders — delete it to bill again', err: true }); return; } this.setState({ pick: true, draft: sel.slice(), dqty: { ...qty } }); },
      cancelPick: () => this.setState({ pick: false, draft: null, dqty: null }),
      applyPick: () => { const q = {}; draft.forEach((k) => { const r = find(k); q[k] = dqty[k] ?? inr(r.sq, 3); }); this.setState({ pick: false, sel: draft.slice(), qty: q, draft: null, dqty: null }); },
      noDraft: dRows.length === 0,
      selText: dRows.length ? dRows.length + (dRows.length > 1 ? ' orders' : ' order') + ' selected · ' + dParty + ' · ' + inr(dQty, 3) + ' kg to bill' : 'Tick one or more orders of the same mill',
      f, set, x, xset, opt,
      items, hasItems: rows.length > 0, noItems: rows.length === 0, ordLabel, ordTag: rows.length ? 'Against ' + ords.join(', ') : 'No order selected',
      party: party || '—', pt: { ...P0, cr: String(P0.cr), due: dueDt, dueT: paid ? 'Paid' : 'Due ' + dueDt, dueC: paid ? 'tag t-green' : 'tag t-orange' },
      tot: { ctn: String(T.ctn), cops: String(T.cops), wt: inr(T.q, 3), basic: inr(T.basic, 2), dr: inr(T.dr, 2), fr: inr(T.fr, 2), ir: inr(T.ir, 2), tx: inr(T.tx, 2), gst: inr(gst, 2), amt: inr(gross, 2) },
      sum: { qty: inr(T.q, 3) + ' kg · ' + T.ctn + ' cartons', basic: '₹ ' + inr(T.tx, 2), half: '₹ ' + inr(inter ? 0 : gst / 2, 2), igst: '₹ ' + inr(inter ? gst : 0, 2), tcs: '₹ ' + inr(tcs, 2),
        l1: 'CGST' + (rate1 != null ? ' ' + rate1 / 2 + '%' : ''), l2: 'SGST' + (rate1 != null ? ' ' + rate1 / 2 + '%' : ''), tdsL: 'TDS ' + (tdsRate || 0) + '%',
        gst: '₹ ' + inr(gst, 2), gross: '₹ ' + inr(gross, 2), ro: '₹ ' + inr(net - gross - al - tcs, 2), net: '₹ ' + inr(net, 2),
        words: words(net), avg: T.q ? inr(gross / T.q, 2) : '0.00', bavg: T.q ? inr(T.basic / T.q, 2) : '0.00', tds: '− ₹ ' + inr(tds, 2), pay: '₹ ' + inr(net - tds, 2), pend: inr(Math.max(pendAfter, 0), 3) + ' kg',
        first: rows.length ? (/\//.test(rows[0].no) ? rows[0].no : rows[0].no + '/26-27') : '—', firstDt: rows.length ? rows[0].dt : '—', firstIt: rows.length ? rows[0].it : '—', firstRate: rows.length ? inr(rows[0].rate, 2) : '—' },
      listHref: 'PurchaseBillList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class PurchaseBillView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""} fit`} style={sx(v.fitStyle)}>
        <div className="sbw">
          <Sidebar active="pb" />
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
            <button className="btn" type="button" onClick={v.openPick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              Pending GRN
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
                  <span className={v.tdsC}>
                    {v.tdsTag}
                  </span>
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="p1">
                      Book
                    </label>
                    <select id="p1" className="inp" value={v.f?.bookId} onChange={v.set?.bookId}>
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
                    <label htmlFor="p2">
                      Entry no.
                    </label>
                    <input id="p2" className="inp" type="text" value={v.billNo} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p3">
                      Received date
                    </label>
                    <input id="p3" className="inp" type="text" value={v.billDt} onChange={v.set?.date} placeholder="dd-mm-yyyy" />
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
                      {"Against order "}
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
                    <label htmlFor="p5">
                      Party · from order
                    </label>
                    <input id="p5" className="inp" type="text" value={v.party} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p6">
                      Delivery to
                    </label>
                    <input id="p6" className="inp" type="text" value={v.pt?.del} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p7">
                      {"Supplier inv. no. "}
                      <span className="req">
                        *
                      </span>
                    </label>
                    <input id="p7" className="inp" type="text" value={v.f?.refNo} onChange={v.set?.refNo} placeholder="Mill invoice no." />
                  </div>
                  <div className="fld">
                    <label htmlFor="p8">
                      Supplier inv. date
                    </label>
                    <input id="p8" className="inp" type="text" value={v.f?.refDate} onChange={v.set?.refDate} placeholder="dd-mm-yyyy" />
                  </div>
                  <div className="fld">
                    <label htmlFor="p9">
                      Agent
                    </label>
                    <input id="p9" className="inp" type="text" value={v.pt?.agent} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p10">
                      Salesperson
                    </label>
                    <input id="p10" className="inp" type="text" value={v.pt?.sp} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p11">
                      Credit days
                    </label>
                    <input id="p11" className="inp" type="text" value={v.pt?.cr} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p12">
                      Due date
                    </label>
                    <input id="p12" className="inp" type="text" value={v.pt?.due} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p13">
                      D.O. no.
                    </label>
                    <input id="p13" className="inp" type="text" value={v.f?.doNo} onChange={v.set?.doNo} />
                  </div>
                </div>
                <div className="strip">
                  <div>
                    <span>
                      GSTIN
                    </span>
                    <span>
                      {v.pt?.gstin}
                    </span>
                  </div>
                  <div>
                    <span>
                      PAN
                    </span>
                    <span>
                      {v.pt?.pan}
                    </span>
                  </div>
                  <div>
                    <span>
                      Payable to party
                    </span>
                    <span>
                      {v.pt?.out}
                    </span>
                  </div>
                  <div>
                    <span>
                      Order pending after this bill
                    </span>
                    <span>
                      {v.sum?.pend}
                    </span>
                  </div>
                  <div>
                    <span>
                      GSTR-2B
                    </span>
                    <span>
                      <span className={v.gstr?.c}>
                        {v.gstr?.t}
                      </span>
                    </span>
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
                  <button className="btn sm" type="button" onClick={v.openPick}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                    Pending GRN
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
                                  Item code
                                </th>
                              </>
                            ) : null}
                            <th>
                              Item
                            </th>
                            <th>
                              Brand
                            </th>
                            <th>
                              Grade
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  HSN
                                </th>
                                <th>
                                  Unit
                                </th>
                                <th>
                                  L.R. no.
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
                                  Insurance %
                                </th>
                                <th className="r">
                                  Insurance ₹
                                </th>
                                <th className="r">
                                  Taxable
                                </th>
                                <th className="r">
                                  CGST + SGST
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
                                      {it?.code}
                                    </td>
                                  </>
                                ) : null}
                                <td>
                                  {it?.it}
                                </td>
                                <td className="t2">
                                  {it?.br}
                                </td>
                                <td className="t2">
                                  {it?.gr}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.hsn}
                                    </td>
                                    <td className="t2">
                                      {it?.unit}
                                    </td>
                                    <td className="t2">
                                      {it?.lr}
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
                                      {it?.ip}
                                    </td>
                                    <td className="r">
                                      {it?.ir}
                                    </td>
                                    <td className="r">
                                      {it?.tx}
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
                            <td />
                            <td />
                            {v.more ? (
                              <>
                                <td />
                                <td />
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
                                  {v.tot?.ir}
                                </td>
                                <td className="r">
                                  {v.tot?.tx}
                                </td>
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
                    {"E-invoice, e-way & import"}
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
                            TDS basic
                          </span>
                          <span>
                            {v.sum?.basic}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            {v.sum?.tdsL}
                          </span>
                          <span>
                            {v.sum?.tds}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Average rate
                          </span>
                          <span>
                            {v.sum?.avg}
                          </span>
                        </div>
                        <button className="btn sm" type="button" style={{"alignSelf":"flex-start"}} onClick={v.tdsInfo}>
                          TDS details
                        </button>
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
                            Net GST
                          </span>
                          <span>
                            {v.sum?.gst}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Grand total
                          </span>
                          <span>
                            {v.sum?.gross}
                          </span>
                        </div>
                        <div className="fld">
                          <label htmlFor="pa1">
                            Add / less amount (+/−)
                          </label>
                          <input id="pa1" className="inp" type="text" value={v.f?.addLess} onChange={v.set?.addLess} placeholder="0.00" />
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
                        <div className="kv">
                          <span>
                            Payable after TDS
                          </span>
                          <span>
                            {v.sum?.pay}
                          </span>
                        </div>
                      </div>
                      <div className="box">
                        <h3>
                          {"Payment & remark"}
                        </h3>
                        <div className="fld">
                          <label htmlFor="pq1">
                            Collection person
                          </label>
                          <select id="pq1" className="inp" value={v.f?.collectionPersonId} onChange={v.set?.collectionPersonId}>
                            <option value="">
                              Self
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
                          <label htmlFor="pq2">
                            Currency
                          </label>
                          <select id="pq2" className="inp" value={v.f?.currency} onChange={v.set?.currency}>
                            <option>
                              INR
                            </option>
                            <option>
                              USD
                            </option>
                          </select>
                        </div>
                        <textarea className="inp" aria-label="Remark" placeholder="Remark" value={v.f?.remark} onChange={v.set?.remark} />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isTr ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="q1">
                          Transporter
                        </label>
                        <select id="q1" className="inp" value={v.f?.transporterId} onChange={v.set?.transporterId}>
                          <option value="">
                            —
                          </option>
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
                        <label htmlFor="q2">
                          L.R. no.
                        </label>
                        <input id="q2" className="inp" type="text" value={v.f?.lrNo} onChange={v.set?.lrNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="q3">
                          L.R. date
                        </label>
                        <input id="q3" className="inp" type="text" value={v.f?.lrDate} onChange={v.set?.lrDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="q4">
                          Vehicle no.
                        </label>
                        <input id="q4" className="inp" type="text" value={v.f?.vehicleNo} onChange={v.set?.vehicleNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="q5">
                          Driver name
                        </label>
                        <input id="q5" className="inp" type="text" value={v.f?.driverName} onChange={v.set?.driverName} />
                      </div>
                      <div className="fld">
                        <label htmlFor="q6">
                          Driver license
                        </label>
                        <input id="q6" className="inp" type="text" value={v.x?.driverLicense} onChange={v.xset?.driverLicense} />
                      </div>
                      <div className="fld">
                        <label htmlFor="q7">
                          No. of parcels
                        </label>
                        <input id="q7" className="inp" type="text" value={v.f?.parcels} onChange={v.set?.parcels} />
                      </div>
                      <div className="fld">
                        <label htmlFor="q8">
                          Godown
                        </label>
                        <select id="q8" className="inp" value={v.f?.godownId} onChange={v.set?.godownId}>
                          {(v.opt?.godowns || []).map((o, $index) => (
                            <Fragment key={$index}>
                              <option value={o?.v}>
                                {o?.l}
                              </option>
                            </Fragment>
                          ))}
                        </select>
                      </div>
                      <div className="fld">
                        <label htmlFor="q9">
                          Transporter expense
                        </label>
                        <input id="q9" className="inp" type="text" value={v.x?.transporterExpense} onChange={v.xset?.transporterExpense} />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isEi ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="w1">
                          E-way bill no.
                        </label>
                        <input id="w1" className="inp" type="text" value={v.x?.ewbNo} onChange={v.xset?.ewbNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="w2">
                          IRN
                        </label>
                        <input id="w2" className="inp" type="text" value={v.x?.irn} onChange={v.xset?.irn} />
                      </div>
                      <div className="fld">
                        <label htmlFor="w3">
                          Ack no.
                        </label>
                        <input id="w3" className="inp" type="text" value={v.x?.ackNo} onChange={v.xset?.ackNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="w4">
                          Ack date
                        </label>
                        <input id="w4" className="inp" type="text" value={v.x?.ackDate} onChange={v.xset?.ackDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="w5">
                          B.E. date
                        </label>
                        <input id="w5" className="inp" type="text" value={v.x?.beDate} onChange={v.xset?.beDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="w6">
                          Port
                        </label>
                        <input id="w6" className="inp" type="text" value={v.x?.port} onChange={v.xset?.port} />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isRef ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="z3">
                          Ref. inv. no.
                        </label>
                        <input id="z3" className="inp" type="text" value={v.x?.refInvNo} onChange={v.xset?.refInvNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="z4">
                          Ref. inv. date
                        </label>
                        <input id="z4" className="inp" type="text" value={v.x?.refInvDate} onChange={v.xset?.refInvDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="z5">
                          Adj. bill no.
                        </label>
                        <input id="z5" className="inp" type="text" value={v.x?.adjBillNo} onChange={v.xset?.adjBillNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="z6">
                          Adj. bill date
                        </label>
                        <input id="z6" className="inp" type="text" value={v.x?.adjBillDate} onChange={v.xset?.adjBillDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="z7">
                          Debit note no.
                        </label>
                        <input id="z7" className="inp" type="text" value={v.x?.debitNoteNo} onChange={v.xset?.debitNoteNo} />
                      </div>
                      <div className="fld">
                        <label htmlFor="z8">
                          Debit note date
                        </label>
                        <input id="z8" className="inp" type="text" value={v.x?.debitNoteDate} onChange={v.xset?.debitNoteDate} />
                      </div>
                      <div className="fld">
                        <label htmlFor="z9">
                          DCPI no.
                        </label>
                        <input id="z9" className="inp" type="text" value={v.x?.dcpiNo} onChange={v.xset?.dcpiNo} />
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
                <aside className="rp" aria-label="Supplier history">
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"0 20px","minHeight":"56px","borderBottom":"1px solid var(--bd)"}}>
                    <b style={{"fontWeight":"600","flex":"1"}}>
                      Supplier history
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
                        Total purchase · FY 26-27
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
                          TDS
                        </span>
                        <span>
                          {v.sum?.tds}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Payable
                        </span>
                        <span>
                          {v.sum?.pay}
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
              <div className="mdl" role="dialog" aria-modal="true" aria-label="New purchase bill · select purchase order">
                <div className="mh">
                  <div style={{"flex":"1","display":"flex","flexDirection":"column","gap":"6px"}}>
                    <b>
                      New purchase bill · select purchase order
                    </b>
                    <div className="stepper">
                      <span className="on">
                        <i>
                          1
                        </i>
                        {" Select purchase order"}
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
                  <input className="inp" type="search" placeholder="Search order no., party or item" aria-label="Search orders" value={v.mq} onChange={v.setMq} />
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
                  <select className="inp" aria-label="Item" value={v.mt} onChange={v.setMt}>
                    <option value="">
                      All items
                    </option>
                    {(v.mItems || []).map((o, $index) => (
                      <Fragment key={$index}>
                        <option>
                          {o}
                        </option>
                      </Fragment>
                    ))}
                  </select>
                  <span className="muted" style={{"alignSelf":"center","fontSize":"13px"}}>
                    Only approved orders with pending receipt are shown
                  </span>
                </div>
                <div className="mt">
                  <table>
                    <thead>
                      <tr>
                        <th style={{"width":"40px"}} />
                        <th>
                          Order
                        </th>
                        <th>
                          Mill / party
                        </th>
                        <th>
                          Item
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th className="r">
                          Ordered kg
                        </th>
                        <th className="r">
                          Received
                        </th>
                        <th className="r">
                          Pending kg
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
                            <td colSpan="9" className="muted" style={{"textAlign":"center","padding":"28px"}}>
                              {v.poEmpty}
                            </td>
                          </tr>
                        </>
                      ) : null}
                      {(v.po || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <tr className={o?.rc}>
                            <td>
                              <input className="cb" type="checkbox" checked={o?.on} onChange={o?.tog} aria-label={`Select order ${o?.no ?? ""}`} />
                            </td>
                            <td>
                              <div style={{"fontWeight":"500"}}>
                                {o?.no}
                              </div>
                              <div className="sub">
                                {o?.dt}{" · "}{o?.age}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.p}
                              </div>
                              <div className="sub">
                                {o?.g}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.it}
                              </div>
                              <div className="sub">
                                {o?.br}{" · "}{o?.lot}
                              </div>
                            </td>
                            <td className="r">
                              {o?.rate}
                            </td>
                            <td className="r">
                              {o?.oq}
                            </td>
                            <td className="r t2">
                              {o?.dq}
                            </td>
                            <td className="r" style={{"fontWeight":"600"}}>
                              {o?.pq}
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
          <Assistant page="pb" />
        </div>
      </div>
      </>
    );
  }
}

export default function PurchaseBill(props) {
  const theme = useTheme();
  return <PurchaseBillView {...props} theme={theme} />;
}
