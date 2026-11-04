/* eslint-disable */
// SalesOrderEntry — converted 1:1 from the YarnFlow design (SalesOrderEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './SalesOrderEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) {
    super(p);
    this.state = { z: 1, moreF: false, more: false, hist: true, f: this.blank(), lines: [this.blankLine()], disc: [['Quantity discount', ''], ['Cash discount', ''], ['Rate difference', '']], note: '', err: false, busy: false, ps: {}, ph: {} };
  }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  today() { const t = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(t.getDate()) + '-' + z(t.getMonth() + 1) + '-' + t.getFullYear(); }
  blank() { return { costCenterId: '', bookId: '', date: this.today(), brokerId: '', brokerageRate: '', brokeragePct: '', partyId: '', deliveryPartyId: '', refNo: '', creditDays: '', millId: '', salesPersonId: '', expDeliveryDate: '', processType: 'Direct dispatch', refName: '', priority: 'NORMAL', transporterId: '', orderType: 'Yarn', addLess: '', remark: '' }; }
  blankLine() { return { itemId: null, itemName: '', brand: '', lotNo: '', unit: 'Kg', grade: '', pcs: '', qty: '', rate: '', discPct: '', freightPct: '', gstRate: '5', remark1: '', remark2: '', hsn: '' }; }
  isView() { return this.props.mode === 'view'; }

  componentDidMount() {
    try { const b = JSON.parse(window.localStorage.getItem('yf-back') || 'null'); if (b && b.href) this.setState({ back: b }); } catch (e) {}
    try { const fl = window.localStorage.getItem('yf-flash'); if (fl) { window.localStorage.removeItem('yf-flash'); this.setState({ note: fl }); } } catch (e) {}
    this.init();
    if (!this.isView()) return;
    const rd = () => { try { const raw = window.localStorage.getItem('yf-view-so'); if (raw && raw !== this._raw) { this._raw = raw; this.openRec(JSON.parse(raw)); } } catch (e) {} };
    this._rd = rd; rd(); if (!this._raw) this.openRec(null); this._iv = setInterval(rd, 700);
    try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }

  async init() {
    const api = this.api(); if (!api) return;
    try {
      const [lk, stock] = await Promise.all([api.lookups(), api.get('/reports/stock')]);
      const stk = {}; stock.rows.forEach((r) => { stk[r.itemId] = (stk[r.itemId] || 0) + r.qty; });
      const book = lk.books.find((b) => b.voucherType === 'SALES_ORDER' && b.isDefault) || lk.books.find((b) => b.voucherType === 'SALES_ORDER');
      const cc = lk.costCenters.find((c) => c.isDefault) || lk.costCenters[0];
      this.setState({ lk, stk, f: { ...this.state.f, bookId: this.state.f.bookId || (book ? String(book.id) : ''), costCenterId: this.state.f.costCenterId || (cc ? String(cc.id) : '') } });
      if (!this.isView()) { const nx = await api.get('/vouchers/sales-orders/next-number', book ? { bookId: book.id } : undefined); this.setState({ nextNo: nx.number }); }
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }

  /** open a saved order (app) or the sample record (design canvas) */
  async openRec(rec) {
    const api = this.api();
    if (api && rec && rec.id) {
      try { const d = await api.get('/vouchers/sales-orders/' + rec.id); this.fill(d); this.loadParty(d.partyId); } catch (e) { this.setState({ note: api.message(e), err: true }); }
      return;
    }
    if (api) return;
    const R = rec || { no: 'SAL02722', dt: '21-05-2026', p: 'Bhagwati Filaments', it: '50/24 SD CAT', br: 'Reliance', lot: '356C9S', gr: 'A+', rate: 179.6, oq: 10050, dq: 9335.8, stL: 'Pending dispatch' };
    this.setState({ sample: R, f: { ...this.blank(), partyId: 'd0', date: R.dt, brokerageRate: '0.50', creditDays: '4', expDeliveryDate: '28-10-2026', brokerId: '', salesPersonId: '' },
      lines: [{ ...this.blankLine(), itemName: R.it, brand: R.br, lotNo: R.lot, grade: R.gr, pcs: String(Math.max(1, Math.round(R.oq / 60))), qty: String(R.oq), rate: String(R.rate), doneQty: Number(R.dq) || 0, pendingQty: Math.max(0, (Number(R.oq) || 0) - (Number(R.dq) || 0)), saved: true }, this.blankLine()] });
  }

  fill(d) {
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    const dmy = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('-') : '');
    const pct = d.brokerageType === 'PERCENT';
    this.setState({
      doc: d, same: !d.deliveryPartyId,
      f: { costCenterId: s(d.costCenterId), bookId: s(d.bookId), date: dmy(d.date), brokerId: s(d.brokerId), brokerageRate: pct ? '' : s(d.brokerageRate || ''), brokeragePct: pct ? s(d.brokerageRate) : '', partyId: s(d.partyId), deliveryPartyId: s(d.deliveryPartyId),
        refNo: s(d.refNo), creditDays: s(d.creditDays), millId: s(d.millId), salesPersonId: s(d.salesPersonId), expDeliveryDate: dmy(d.expDeliveryDate), processType: d.processType || 'Direct dispatch', refName: s(d.refName),
        priority: d.priority || 'NORMAL', transporterId: s(d.transporterId), orderType: d.orderType || 'Yarn', addLess: d.addLess ? s(d.addLess) : '', remark: s(d.remark) },
      disc: (d.discounts && d.discounts.length ? d.discounts.map((x) => [x.label, s(x.amount)]) : [['Quantity discount', ''], ['Cash discount', ''], ['Rate difference', '']]),
      lines: d.lines.map((l) => ({ id: l.id, itemId: l.itemId, itemName: l.itemName || l.description || '', brand: s(l.brand), lotNo: s(l.lotNo), unit: l.unit === 'KG' ? 'Kg' : s(l.unit), grade: s(l.grade), pcs: s(l.pcs || ''), qty: s(l.qty), rate: s(l.rate),
        discPct: l.discPct ? s(l.discPct) : '', freightPct: l.freightPct ? s(l.freightPct) : '', gstRate: s(l.gstRate), remark1: s(l.remark1), remark2: s(l.remark2), hsn: s(l.hsn), doneQty: l.doneQty || 0, pendingQty: l.pendingQty, lineStatus: l.lineStatus, saved: true })).concat([this.blankLine()])
    });
  }

  async loadParty(id) {
    const api = this.api(); if (!api || !id) return;
    try {
      const [sm, hist] = await Promise.all([api.get('/accounts/' + id + '/summary'), api.get('/vouchers/sales-orders', { view: 'lines', partyId: id, pageSize: 6 })]);
      this.setState({ ps: { ...this.state.ps, [id]: sm }, ph: { ...this.state.ph, [id]: hist.data } });
    } catch (e) {}
  }

  pickParty(p) {
    const f = { ...this.state.f, partyId: String(p.id) };
    if (p.live) Object.assign(f, { creditDays: String(p.creditDays ?? ''), brokerId: p.brokerId ? String(p.brokerId) : f.brokerId, salesPersonId: p.salesPersonId ? String(p.salesPersonId) : f.salesPersonId, transporterId: p.transporterId ? String(p.transporterId) : f.transporterId,
      brokerageRate: p.brokerageType === 'PERCENT' ? '' : p.brokerageRate ? String(p.brokerageRate) : f.brokerageRate, brokeragePct: p.brokerageType === 'PERCENT' ? String(p.brokerageRate) : f.brokeragePct });
    this.setState({ f, pd: null, pq: '' });
    if (p.live) this.loadParty(p.id);
  }

  setLine(i, k, v) {
    const lines = this.state.lines.slice();
    const l = { ...lines[i], [k]: v };
    if (k === 'itemName') {
      const its = (this.state.lk && this.state.lk.items) || [];
      const it = its.find((x) => x.name.toLowerCase() === String(v).trim().toLowerCase() || x.code.toLowerCase() === String(v).trim().toLowerCase());
      l.itemId = it ? it.id : null;
      if (it) { l.itemName = it.name; l.gstRate = String(it.gstRate); l.hsn = it.hsn; l.unit = it.unit === 'KG' ? 'Kg' : it.unit; if (!l.rate && it.rate) l.rate = String(it.rate); if (!l.brand && it.brandId) { const b = (this.state.lk.brands || []).find((x) => x.id === it.brandId); if (b) l.brand = b.name; } }
    }
    lines[i] = l;
    const last = lines[lines.length - 1];
    if (last.itemName || last.qty) lines.push(this.blankLine());
    this.setState({ lines });
  }

  body() {
    const st = this.state, f = st.f;
    const iso = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const n = (v) => (v === '' || v === null || v === undefined ? null : Number(String(v).replace(/,/g, '')));
    const id = (v) => (v ? Number(v) : null);
    if (!f.partyId) return this.fail('Select a party');
    if (!iso(f.date)) return this.fail('Order date must be dd-mm-yyyy');
    const lines = st.lines.filter((l) => l.itemName || l.qty);
    if (lines.some((l) => !l.itemId)) return this.fail('Pick each item from the list (line ' + (st.lines.findIndex((l) => (l.itemName || l.qty) && !l.itemId) + 1) + ')');
    if (!lines.length) return this.fail('Add at least one item');
    const pct = n(f.brokeragePct);
    return {
      bookId: id(f.bookId), costCenterId: id(f.costCenterId), date: iso(f.date), partyId: id(f.partyId), deliveryPartyId: st.same === false ? id(f.deliveryPartyId) : null, brokerId: id(f.brokerId),
      brokerageRate: pct || n(f.brokerageRate) || 0, brokerageType: pct ? 'PERCENT' : 'PER_KG', refNo: f.refNo || null, creditDays: n(f.creditDays), millId: id(f.millId), salesPersonId: id(f.salesPersonId),
      expDeliveryDate: iso(f.expDeliveryDate), processType: f.processType, refName: f.refName || null, priority: f.priority, transporterId: id(f.transporterId), orderType: f.orderType, addLess: n(f.addLess) || 0, remark: f.remark || null,
      discounts: st.disc.filter((d) => n(d[1])).map((d) => ({ label: d[0], amount: n(d[1]) })),
      lines: lines.map((l) => ({ itemId: l.itemId, brand: l.brand || null, lotNo: l.lotNo || null, grade: l.grade || null, unit: /^kg$/i.test(l.unit) ? 'KG' : l.unit, pcs: n(l.pcs) || 0, qty: n(l.qty) || 0, rate: n(l.rate) || 0, discPct: n(l.discPct) || 0, freightPct: n(l.freightPct) || 0, gstRate: n(l.gstRate) ?? 5, remark1: l.remark1 || null, remark2: l.remark2 || null }))
    };
  }
  fail(msg) { this.setState({ note: msg, err: true }); return null; }

  async save(print) {
    const api = this.api();
    const isRec = !!this.state.doc;
    if (!api) { this.setState({ note: isRec ? 'Changes saved (design preview)' : 'Saved for approval (design preview)', err: false, upd: true }); return; }
    const body = this.body(); if (!body) return;
    this.setState({ busy: true, note: 'Saving…', err: false });
    try {
      const doc = isRec ? await api.put('/vouchers/sales-orders/' + this.state.doc.id, body) : await api.post('/vouchers/sales-orders', body);
      api.invalidate();
      if (print) window.print();
      const msg = (isRec ? '✓ Updated ' : '✓ Saved ') + doc.number + (doc.status === 'PENDING_APPROVAL' ? ' — waiting for approval' : '');
      if (isRec) { this.fill(doc); this.setState({ busy: false, note: msg, err: false, upd: true }); return; }
      try { window.localStorage.setItem('yf-view-so', JSON.stringify({ t: Date.now(), id: doc.id, no: doc.number })); window.localStorage.setItem('yf-flash', msg); } catch (e) {}
      this.go('SalesOrderView' + ((this.props.theme ?? 'dark') === 'light' ? 'Light' : '') + '.dc.html');
    } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }

  async remove() {
    const api = this.api(); const doc = this.state.doc;
    if (!doc) { this.setState({ f: { ...this.blank(), bookId: this.state.f.bookId, costCenterId: this.state.f.costCenterId }, lines: [this.blankLine()], note: 'Cleared', err: false }); return; }
    if (!api) return;
    if (!window.confirm('Delete sales order ' + doc.number + '?')) return;
    this.setState({ busy: true });
    try { await api.del('/vouchers/sales-orders/' + doc.id); api.invalidate(); this.go('SalesOrderList' + ((this.props.theme ?? 'dark') === 'light' ? 'Light' : '') + '.dc.html'); }
    catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }

  renderVals() {
    const st = this.state;
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const live = !!this.api() && !!st.lk;
    const lk = st.lk || {};
    const inr = (n, d) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const num = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
    const SAMPLE_PTY = [{"name": "Bhagwati Filaments", "grp": "Bhagwati Filaments", "addr": "Plot 12, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AABCB4410K1Z3", "ph": "+91 98250 41120", "cp": "Ramesh Agarwal", "fig": "₹ 8,12,540", "sub": "4 days credit", "tag": "Overdue 6 d", "tc": "tag t-orange"}, {"name": "Bhagwati Filaments · Unit 2", "grp": "Bhagwati Filaments", "addr": "Plot 44, Pandesara GIDC, Surat 394221", "city": "Surat", "gst": "24AABCB4410K2Z2", "ph": "+91 98250 41121", "cp": "Suresh Agarwal", "fig": "₹ 1,20,400", "sub": "4 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Shree Bhagwati Textiles", "grp": "Bhagwati Group", "addr": "14 Millennium Market, Ring Road, Surat 395002", "city": "Surat", "gst": "24AAKFB7712C1Z9", "ph": "+91 99099 22150", "cp": "Mahesh Patel", "fig": "₹ 2,10,400", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Bhagwati Synthetics LLP", "grp": "Bhagwati Synthetics", "addr": "Gala 7, Kamatghar, Bhiwandi 421302", "city": "Bhiwandi", "gst": "27AAJFB3301E1Z4", "ph": "+91 98201 77310", "cp": "Vinod Jain", "fig": "₹ 0", "sub": "30 days credit", "tag": "New party", "tc": "tag t-blue"}, {"name": "Shree Rudraksha Poly", "grp": "Shree Rudraksha Poly", "addr": "Block 3, Kadodara Char Rasta, Surat 394327", "city": "Surat", "gst": "24AAHFS3302P1Z1", "ph": "+91 97234 55102", "cp": "Kamal Shah", "fig": "₹ 6,40,210", "sub": "4 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Jigita Fab LLP", "grp": "Jigita Fab LLP", "addr": "22 Udhna Udyog Nagar, Surat 394210", "city": "Surat", "gst": "24AAKFJ9910R1Z7", "ph": "+91 90990 31188", "cp": "Jignesh Desai", "fig": "₹ 2,10,000", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Rannade Textile", "grp": "Rannade Textile", "addr": "5 Laxmi Industrial Estate, Varachha, Surat 395006", "city": "Surat", "gst": "24AARFR5521K1Z4", "ph": "+91 98989 10022", "cp": "Nilkanthbhai", "fig": "₹ 2,87,050", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Bansam Fabrics", "grp": "Bansam Fabrics", "addr": "Plot 88, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AADFB7781M1Z9", "ph": "+91 98240 66120", "cp": "Ramji Bhai", "fig": "₹ 18,60,000", "sub": "1 day credit", "tag": "Overdue 9 d", "tc": "tag t-red"}];
    const SAMPLE_DEL = [{"name": "Bhagwati Filaments · Unit 2", "grp": "Bhagwati Filaments", "addr": "Plot 44, Pandesara GIDC, Surat 394221", "city": "Surat", "gst": "24AABCB4410K2Z2", "ph": "+91 98250 41121", "cp": "Suresh Agarwal", "fig": "₹ 1,20,400", "sub": "4 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Bhagwati Filaments", "grp": "Bhagwati Filaments", "addr": "Plot 12, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AABCB4410K1Z3", "ph": "+91 98250 41120", "cp": "Ramesh Agarwal", "fig": "₹ 8,12,540", "sub": "4 days credit", "tag": "Overdue 6 d", "tc": "tag t-orange"}, {"name": "Shree Bhagwati Textiles", "grp": "Bhagwati Group", "addr": "14 Millennium Market, Ring Road, Surat 395002", "city": "Surat", "gst": "24AAKFB7712C1Z9", "ph": "+91 99099 22150", "cp": "Mahesh Patel", "fig": "₹ 2,10,400", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Om Sai Weaving (job work)", "grp": "Consignee", "addr": "Plot 9, Palsana Road, Surat 394315", "city": "Surat", "gst": "24AACFO1180H1Z6", "ph": "+91 97140 22091", "cp": "Sanjay Patil", "fig": "Job worker", "sub": "Twisting", "tag": "Consignee", "tc": "tag"}, {"name": "Kanvi Corporation", "grp": "Consignee", "addr": "Gujarat Hira Bourse Road, Ichchhapor, Surat 394510", "city": "Surat", "gst": "24AAGFK9902L1Z1", "ph": "+91 98795 11042", "cp": "Kanvi Shah", "fig": "Consignee", "sub": "—", "tag": "Consignee", "tc": "tag"}];
    const PTY = live
      ? lk.customers.map((c) => ({ id: c.id, live: true, ...c, name: c.name, grp: c.partyGroupName || c.name, addr: [c.address1, c.area, c.city].filter(Boolean).join(', ') || '—', city: c.city || '', gst: c.gstin || '—', ph: c.mobile || '—', cp: c.contactPerson || '—',
          fig: '₹ ' + inr(Math.max(0, c.balance), 0), sub: (c.creditDays || 0) + ' days credit', tag: c.status === 'ON_HOLD' ? 'On hold' : c.status === 'BLOCKED' ? 'Blocked' : '', tc: c.status === 'ACTIVE' ? 'tag' : 'tag t-orange' }))
      : SAMPLE_PTY.map((p, i) => ({ ...p, id: 'd' + i }));
    const DEL = live ? PTY : SAMPLE_DEL.map((p, i) => ({ ...p, id: 'x' + i }));
    const COL = ['#3B82F6, #6366F1', '#F59E0B, #EA580C', '#10B981, #059669', '#EC4899, #DB2777', '#8B5CF6, #6D28D9', '#14B8A6, #0D9488'];
    const deco = (p, i) => ({ ...p, ini: p.name.replace(/^(Shree|Shri|The)\s+/i, '').charAt(0), av: 'background: linear-gradient(135deg, ' + COL[i % COL.length] + ')' });

    const doc = st.doc; const sample = st.sample;
    const isRec = this.isView() && !!(doc || sample);
    const STL = { PENDING_APPROVAL: 'On hold · approval', OPEN: 'Pending dispatch', PARTIAL: 'Pending dispatch', COMPLETED: 'Closed', CANCELLED: 'Cancelled', LOCKED: 'Locked', REJECTED: 'Rejected' };
    const TAGC = { 'Pending dispatch': 'tag t-blue', 'On hold · approval': 'tag t-orange', Closed: 'tag t-green', Cancelled: 'tag t-red', Rejected: 'tag t-red', Locked: 'tag t-gray' };
    const stL = doc ? STL[doc.status] || doc.status : sample ? sample.stL || 'Pending dispatch' : 'New';
    const recNo = doc ? doc.number : sample ? (/\//.test(sample.no) ? sample.no : sample.no + '/26-27') : (st.nextNo || 'SAL11838/26-27');

    // party
    const f = st.f;
    const bi = PTY.findIndex((p) => String(p.id) === String(f.partyId));
    const hasP = bi >= 0;
    const bp = hasP ? deco(PTY[bi], bi) : { name: 'Select party…', grp: '', ini: '+', av: 'background: var(--s3); color: var(--t3)', fig: '₹ 0', sub: '', tag: '', tc: '', addr: '', city: '', gst: '', ph: '', cp: '' };
    const same = st.same ?? true;
    const di = Math.max(0, DEL.findIndex((p) => String(p.id) === String(f.deliveryPartyId)));
    const dp = DEL[di] ? deco(DEL[di], di + 2) : bp;
    const pdOpen = st.pd ?? (this.props.startSearch ? 'bill' : null);
    const q = (st.pq ?? this.props.startSearch ?? '').trim(); const ql = q.toLowerCase();
    const SRC = pdOpen === 'del' ? DEL : PTY; const cur = pdOpen === 'del' ? di : bi;
    const hits = SRC.map((p, i) => [p, i]).filter(([p]) => !ql || [p.name, p.gst, p.ph, p.cp, p.city, p.grp, p.addr].join(' ').toLowerCase().indexOf(ql) >= 0).slice(0, 60);
    const pdRows = hits.map(([p, i]) => { const d = deco(p, pdOpen === 'del' ? i + 2 : i); const k = ql ? p.name.toLowerCase().indexOf(ql) : -1;
      return { ...d, pre: k >= 0 ? p.name.slice(0, k) : p.name, hi: k >= 0 ? p.name.slice(k, k + q.length) : '', post: k >= 0 ? p.name.slice(k + q.length) : '',
        cls: i === cur ? 'pdi on' : 'pdi', fig: p.fig, sub: p.sub, tag: p.tag, tc: p.tc,
        pick: () => (pdOpen === 'del' ? this.setState({ f: { ...st.f, deliveryPartyId: String(p.id) }, pd: null, pq: '' }) : this.pickParty(p)) }; });

    // credit position pills
    const ps = hasP && live ? st.ps[PTY[bi].id] : null;
    const fmt0 = (n) => '₹ ' + inr(n, 0);
    let cl, dueCls = 'kp ok', dueVal = 'None';
    if (live && hasP) {
      const L = PTY[bi].creditLimit || 0; const o = Math.max(0, PTY[bi].balance || 0); const p = L ? Math.min(100, Math.round(o / L * 100)) : 0;
      cl = { pct: L ? p + '% used' : 'No limit', lim: L ? fmt0(L) : '—', used: fmt0(o) + ' used', bar: 'width: ' + p + '%' + (p >= 80 ? '; background: #EF4444' : ''), avail: 'Available ' + fmt0(Math.max(0, L - o)) };
      if (ps && ps.overdue > 0) { dueCls = 'kp due'; dueVal = fmt0(ps.overdue) + ' · ' + ps.maxOverdueDays + ' d late'; }
    } else {
      const LIM = [3000000, 1000000, 1500000, 500000, 2500000, 1200000, 1500000, 2000000]; const L = LIM[Math.max(0, bi)] || 1000000; const o = parseFloat(String(bp.fig).replace(/[^0-9.]/g, '')) || 0; const p = Math.min(100, Math.round(o / L * 100));
      cl = { pct: p + '% used', lim: fmt0(L), used: fmt0(o) + ' used · ' + p + '%', bar: 'width: ' + p + '%' + (p >= 80 ? '; background: #EF4444' : ''), avail: 'Available ' + fmt0(Math.max(0, L - o)) };
      if (bp.tag && bp.tag.indexOf('Overdue') === 0) { dueCls = 'kp due'; dueVal = (bi === 0 ? '₹ 1,04,200 · ' : '') + bp.tag.replace('Overdue ', '') + ' late'; }
    }

    // lines & totals
    const pState = hasP && live ? PTY[bi].stateCode : null;
    const inter = !!(pState && lk.companyStateCode && pState !== lk.companyStateCode);
    const stk = st.stk || {};
    let tPcs = 0, tQty = 0, tBasic = 0, tDisc = 0, tTax = 0, tGst = 0; const rates = new Set();
    const lines = st.lines.map((l, i) => {
      const qty = num(l.qty), rate = num(l.rate), g = num(l.gstRate);
      const basic = qty * rate; const disc = basic * num(l.discPct) / 100; const fr = (basic - disc) * num(l.freightPct) / 100; const tax = basic - disc + fr;
      const blank = !l.itemName && !l.qty;
      if (!blank) { tPcs += num(l.pcs); tQty += qty; tBasic += basic; tDisc += disc; tTax += tax; tGst += tax * g / 100; if (g) rates.add(g); }
      const on = {}; ['itemName', 'brand', 'lotNo', 'unit', 'grade', 'pcs', 'qty', 'rate', 'discPct', 'freightPct', 'gstRate', 'remark1', 'remark2'].forEach((k) => { on[k] = (e) => this.setLine(i, k, e.target.value); });
      const have = l.itemId ? stk[l.itemId] : null;
      const stock = l.saved ? 'Dispatched ' + inr(l.doneQty || 0, 3) + ' kg' : blank ? '—' : have != null ? inr(have, 0) + ' kg in stock' : live && l.itemName && !l.itemId ? 'Pick from list' : '—';
      const stc = l.saved || (have != null && have >= qty) ? 'stockok' : blank ? 'muted' : 'tag t-orange';
      return { ...l, n: i + 1, on, rc: blank ? '' : '', amt: blank ? '—' : inr(tax, 2), stock, stc, avg: blank ? '—' : inr(rate * (1 + g / 100), 2),
        ppcs: l.saved ? String(Math.max(0, Math.round((l.pendingQty ?? qty) / Math.max(1, qty) * num(l.pcs)))) : blank ? '—' : l.pcs || '0', pq: blank ? '—' : inr(l.saved ? l.pendingQty ?? qty : qty, 3),
        st: l.saved ? (l.lineStatus === 'CLOSED' ? 'Closed' : (l.pendingQty ?? qty) <= 0.001 ? 'Clear' : (l.doneQty || 0) > 0 ? 'Partly dispatched' : 'Pending') : blank ? '—' : 'New', hsn: l.hsn || '—' };
    });
    const hdrDisc = st.disc.reduce((a, d) => a + num(d[1]), 0);
    const taxable = Math.max(0, tTax - hdrDisc); const gst = tTax > 0 ? tGst * taxable / tTax : 0;
    const al = num(f.addLess); const net = Math.round(taxable + gst + al);
    const rate1 = rates.size === 1 ? [...rates][0] : null;
    const am = { q: inr(tQty, 3) + ' kg · ' + inr(tPcs, 0) + ' pcs', gross: '₹ ' + inr(tBasic, 2), disc: '− ₹ ' + inr(tDisc + hdrDisc, 2), tax: '₹ ' + inr(taxable, 2), half: '₹ ' + inr(gst / 2, 2), al: '₹ ' + inr(al, 2), net: '₹ ' + inr(net, 2),
      l1: inter ? 'IGST' + (rate1 != null ? ' ' + rate1 + '%' : '') : 'CGST' + (rate1 != null ? ' ' + rate1 / 2 + '%' : ''), v1: '₹ ' + inr(inter ? gst : gst / 2, 2),
      l2: inter ? 'CGST + SGST' : 'SGST' + (rate1 != null ? ' ' + rate1 / 2 + '%' : ''), v2: '₹ ' + inr(inter ? 0 : gst / 2, 2) };
    const tt = { pcs: inr(tPcs, 0), qty: inr(tQty, 3), amt: inr(tTax, 2) };

    // due date
    const due = (() => { const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(f.date || ''); if (!m) return ''; const t = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1] + num(f.creditDays))); const z = (x) => String(x).padStart(2, '0'); return z(t.getUTCDate()) + '-' + z(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear(); })();

    // dropdown options
    const opts = (list, l = (x) => x.name) => (list || []).map((x) => ({ v: String(x.id), l: l(x) }));
    const opt = live
      ? { costCenters: opts(lk.costCenters), books: opts(lk.books.filter((b) => b.voucherType === 'SALES_ORDER')), brokers: opts(lk.brokers), mills: opts(lk.suppliers), salesPersons: opts(lk.salesPersons), transporters: opts(lk.transporters),
          items: (lk.items || []).filter((i) => !i.isGeneral).map((i) => ({ l: i.name, d: i.code + ' · ' + (i.description || '') })), brands: (lk.brands || []).map((b) => ({ l: b.name })) }
      : { costCenters: [{ v: '', l: 'Trading division' }], books: [{ v: '', l: 'Sales order' }, { v: 'x', l: 'Sales order · export' }], brokers: [{ v: 'm', l: 'Manoj' }, { v: 'a', l: 'Avi M' }], mills: [{ v: 'r', l: 'Reliance Industries' }], salesPersons: [{ v: 'r', l: 'Rajesh Shah' }, { v: 'a', l: 'Avi M' }],
          transporters: [{ v: 'n', l: 'Navkar Roadlines' }, { v: 'j', l: 'Jay Ambe Roadlines' }], items: [{ l: '50/24 SD CAT', d: 'PFY-5024-SDC' }, { l: '75/36 FDY', d: 'PFY-7536-SD' }], brands: [{ l: 'Reliance' }, { l: 'Sanathan' }] };
    const set = {}; Object.keys(this.blank()).forEach((k) => { set[k] = (e) => this.setState({ f: { ...this.state.f, [k]: e.target.value }, note: this.state.err ? '' : this.state.note, err: false }); });
    const dsc = st.disc.map((d, i) => ({ l: d[0], v: d[1], on: (e) => { const disc = st.disc.slice(); disc[i] = [d[0], e.target.value]; this.setState({ disc }); } }));

    // party history
    let ph;
    if (live && hasP) {
      const rows = (st.ph[PTY[bi].id] || []);
      const sm = st.ps[PTY[bi].id];
      ph = { title: 'Last orders · ' + bp.name, rows: rows.slice(0, 5).map((r) => ({ a: (r.itemName || '') + ' · ' + inr(r.qty, 0) + ' kg', b: '₹ ' + inr(r.rate, 2), c: r.number.replace(/\/\d{2}-\d{2}$/, '') + ' · ' + r.date.split('-').reverse().join('-'), d: r.qty ? Math.round(r.doneQty / r.qty * 100) + '% dispatched' : '' })),
        lots: [...new Set(rows.filter((r) => r.lotNo).map((r) => r.lotNo + (r.grade ? ' · ' + r.grade : '')))].slice(0, 4),
        payL: 'Payment position', pay: sm ? (sm.overdue > 0 ? fmt0(sm.overdue) + ' overdue · ' + sm.maxOverdueDays + ' days' : sm.outstanding > 0 ? fmt0(sm.outstanding) + ' due, nothing overdue' : 'Nothing outstanding') : '…',
        payT: sm && sm.overdue > 0 ? 'Follow up' : 'Good payer', payC: sm && sm.overdue > 0 ? 'tag t-orange' : 'tag t-green' };
      ph.none = ph.rows.length === 0;
    } else {
      ph = { title: 'Last orders · ' + (hasP ? bp.name : 'Bhagwati Filaments'), none: false,
        rows: [{ a: '50/24 SD CAT · 10,050 kg', b: '₹ 179.60', c: 'SAL02722 · 21-05-2026', d: '93% dispatched' }, { a: '50/24 SD CAT · 8,040 kg', b: '₹ 176.00', c: 'SAL01988 · 02-04-2026', d: 'Clear' }, { a: '50/48 FDY · 3,000 kg', b: '₹ 141.50', c: 'SAL01650 · 11-03-2026', d: 'Clear' }, { a: '75/36 FDY · 2,400 kg', b: '₹ 128.00', c: 'SAL01204 · 18-02-2026', d: 'Clear' }],
        lots: ['356C9S · A+', '338C1M · A+', 'FX85 · PQ'], payL: 'Average payment', pay: 'Pays in 7 days on 4-day terms', payT: 'Good payer', payC: 'tag t-green' };
    }

    const BK = st.back;
    const saveLabel = st.busy ? 'Saving…' : 'Save for approval';
    return {
      backHref: BK ? BK.href : 'SalesOrderList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Sales order register',
      sideKey: isRec ? 'so' : 'soe', regLabel: isRec ? 'Sales order register' : 'Sales Orders', isRec, isNew: !isRec,
      recTitle: isRec ? recNo : 'New order', recTag: isRec ? stL : 'New', recTagC: isRec ? (TAGC[stL] || 'tag') : 'tag', recNo, recDt: f.date,
      updLabel: st.busy ? 'Saving…' : st.upd ? '✓ Updated' : 'Update order', updNote: st.note || ('Editing ' + recNo), note: st.note, noteCls: st.err ? 'tag t-red' : 'muted', busy: !!st.busy,
      doUpdate: () => this.save(false), save: () => this.save(false), savePrint: () => this.save(true), print: () => window.print(), remove: () => this.remove(), saveLabel,
      f, set, opt, lines, tt, am, dsc, dueDate: due, addDisc: () => this.setState({ disc: st.disc.concat([['Other discount', '']]) }),
      hasP, dueCls, dueLbl: 'Due payment', dueVal, cl, bp, dp, same, diff: !same, pdBill: pdOpen === 'bill', pdDel: pdOpen === 'del',
      dName: same ? bp.name : dp.name, dAd: same ? bp.addr : dp.addr, dMeta: same ? 'Same as bill to' : 'GSTIN ' + dp.gst + ' · Ph ' + dp.ph, pdOpen: !!pdOpen, pdRows, pdNone: pdRows.length === 0, pdQ: q, pdCount: hits.length + (hits.length === 1 ? ' party' : ' parties'),
      pdCls: pdOpen === 'del' ? 'pdrop r' : 'pdrop', pdTitle: pdOpen === 'del' ? 'Choose delivery party' : 'Choose billing party',
      openBill: () => this.setState({ pd: 'bill', pq: '' }), openDel: () => this.setState({ pd: 'del', pq: '' }), closeP: () => this.setState({ pd: null, pq: '' }),
      setQ: (e) => this.setState({ pq: e.target.value, pd: pdOpen }), toggleSame: () => this.setState({ same: !same, pd: !same ? null : 'del', pq: '' }),
      newPartyHref: 'AccountMaster' + sfx + '.dc.html', ph,
      fitStyle: 'height: 100vh',
      moreF: st.moreF, moreFLabel: st.moreF ? 'Fewer fields' : '+ 8 more fields', toggleF: () => this.setState({ moreF: !st.moreF }),
      theme, more: st.more, hist: st.hist && hasP,
      colsLabel: st.more ? 'Fewer columns' : 'More columns', toggleCols: () => this.setState({ more: !st.more }), toggleHist: () => this.setState({ hist: !st.hist }),
      regHref: 'SalesOrderList' + sfx + '.dc.html', apprHref: 'SalesOrderList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class SalesOrderEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""} fit`} style={sx(v.fitStyle)}>
        <div className="sbw">
          <Sidebar active={v.sideKey} />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href={v.regHref}>
                {v.regLabel}
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                {v.recTitle}
              </span>
              <span className={v.recTagC}>
                {v.recTag}
              </span>
            </div>
            <DcLink className="btn" href={v.regHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
              Show record
            </DcLink>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Import order
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.toggleHist} aria-pressed={v.hist}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              History
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <section className="sec">
                <div className="sh">
                  <h2>
                    Order details
                  </h2>
                  {v.hasP ? (
                    <>
                      <div className="kps">
                        <span className="kp">
                          <span>
                            Outstanding
                          </span>
                          <b>
                            {v.bp?.fig}
                          </b>
                        </span>
                        <span className="kp">
                          <span>
                            Credit limit
                          </span>
                          <b>
                            {v.cl?.lim}
                          </b>
                          <span className="mt" aria-hidden="true">
                            <i style={sx(v.cl?.bar)} />
                          </span>
                          <span>
                            {v.cl?.pct}
                          </span>
                        </span>
                        <span className={v.dueCls}>
                          <span>
                            {v.dueLbl}
                          </span>
                          <b>
                            {v.dueVal}
                          </b>
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="props">
                  <div className="pg">
                    <div className="pgt">
                      Order
                    </div>
                    <div className="pr">
                      <label htmlFor="f4">
                        Cost center
                      </label>
                      <select id="f4" className="pv" value={v.f?.costCenterId} onChange={v.set?.costCenterId}>
                        {(v.opt?.costCenters || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f1">
                        Book
                      </label>
                      <select id="f1" className="pv" value={v.f?.bookId} onChange={v.set?.bookId}>
                        {(v.opt?.books || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f2">
                        Order no.
                      </label>
                      <input id="f2" className="pv" type="text" value={v.recNo} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="f3">
                        Order date
                      </label>
                      <input id="f3" className="pv" type="text" value={v.f?.date} onChange={v.set?.date} placeholder="dd-mm-yyyy" />
                    </div>
                    <div className="pr">
                      <label htmlFor="f9">
                        Broker
                      </label>
                      <select id="f9" className="pv" value={v.f?.brokerId} onChange={v.set?.brokerId}>
                        <option value="">
                          Direct
                        </option>
                        {(v.opt?.brokers || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f10">
                        Brokerage
                      </label>
                      <div style={{"display":"flex","gap":"6px","minWidth":"0"}}>
                        <div className="unit" style={{"flex":"1.2","minWidth":"0"}}>
                          <input id="f10" className="pv" type="text" value={v.f?.brokerageRate} onChange={v.set?.brokerageRate} />
                          <span>
                            ₹/kg
                          </span>
                        </div>
                        <div className="unit" style={{"flex":"1","minWidth":"0"}}>
                          <input id="f11" className="pv" type="text" value={v.f?.brokeragePct} onChange={v.set?.brokeragePct} aria-label="Rs %" />
                          <span>
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      Party
                    </div>
                    <div className="pr">
                      <label htmlFor="f5">
                        Party
                        <i>
                          *
                        </i>
                      </label>
                      <button id="f5" className="pv pkb" type="button" onClick={v.openBill} aria-haspopup="dialog">
                        <span className="pav" style={sx(v.bp?.av)}>
                          {v.bp?.ini}
                        </span>
                        <b>
                          {v.bp?.name}
                        </b>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="m7 10 5 5 5-5" />
                        </svg>
                      </button>
                    </div>
                    <div className="pr">
                      <label htmlFor="f6">
                        Party group
                      </label>
                      <input id="f6" className="pv" type="text" value={v.bp?.grp} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="f17">
                        Ref. ord no.
                      </label>
                      <input id="f17" className="pv" type="text" placeholder="e.g. BF/PO/221" value={v.f?.refNo} onChange={v.set?.refNo} />
                    </div>
                    <div className="pr">
                      <label htmlFor="f7">
                        Delivery party
                      </label>
                      <div className="dl">
                        {v.same ? (
                          <>
                            <label className="samechk">
                              <input id="f7" type="checkbox" checked={v.same} onChange={v.toggleSame} />
                              {" Same as party"}
                            </label>
                          </>
                        ) : null}
                        {v.diff ? (
                          <>
                            <button className="pv pkb" type="button" onClick={v.openDel} aria-haspopup="dialog">
                              <span className="pav" style={sx(v.dp?.av)}>
                                {v.dp?.ini}
                              </span>
                              <b>
                                {v.dp?.name}
                              </b>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="m7 10 5 5 5-5" />
                              </svg>
                            </button>
                          </>
                        ) : null}
                        {v.diff ? (
                          <>
                            <label className="samechk" title="Deliver to the same party">
                              <input type="checkbox" checked={v.same} onChange={v.toggleSame} aria-label="Deliver to the same party" />
                            </label>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="f13">
                        Credit days
                      </label>
                      <div className="unit">
                        <input id="f13" className="pv" type="text" value={v.f?.creditDays} onChange={v.set?.creditDays} />
                        <span>
                          days
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="f14">
                        Due date
                      </label>
                      <input id="f14" className="pv" type="text" value={v.dueDate} readOnly />
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      {"Delivery & reference"}
                    </div>
                    <div className="pr">
                      <label htmlFor="f8">
                        Supplier (mill)
                      </label>
                      <select id="f8" className="pv" value={v.f?.millId} onChange={v.set?.millId}>
                        <option value="">
                          Any mill
                        </option>
                        {(v.opt?.mills || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f12">
                        Sales person
                      </label>
                      <select id="f12" className="pv" value={v.f?.salesPersonId} onChange={v.set?.salesPersonId}>
                        <option value="">
                          Select sales person
                        </option>
                        {(v.opt?.salesPersons || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f15">
                        Exp. delivery
                      </label>
                      <input id="f15" className="pv" type="text" value={v.f?.expDeliveryDate} onChange={v.set?.expDeliveryDate} placeholder="dd-mm-yyyy" />
                    </div>
                    <div className="pr">
                      <label htmlFor="f16">
                        Process type
                      </label>
                      <select id="f16" className="pv" value={v.f?.processType} onChange={v.set?.processType}>
                        <option>
                          Direct dispatch
                        </option>
                        <option>
                          Twisting
                        </option>
                        <option>
                          Dyeing
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f18">
                        Ref. name
                      </label>
                      <input id="f18" className="pv" type="text" placeholder="Who placed the order" value={v.f?.refName} onChange={v.set?.refName} />
                    </div>
                    <div className="pr">
                      <label htmlFor="f20">
                        Priority
                      </label>
                      <select id="f20" className="pv" value={v.f?.priority} onChange={v.set?.priority}>
                        <option value="URGENT">
                          A · Urgent
                        </option>
                        <option value="NORMAL">
                          B · Normal
                        </option>
                        <option value="LOW">
                          C · Low
                        </option>
                      </select>
                    </div>
                  </div>
                  {v.pdBill ? (
                    <>
                      <div className={v.pdCls} role="dialog" aria-label={v.pdTitle}>
                        <div className="pdh">
                          <input className="pds" type="search" value={v.pdQ} onChange={v.setQ} placeholder="Search by name, GSTIN, phone, contact or city" aria-label="Search parties" autoFocus={true} />
                          <span className="muted" style={{"fontSize":"12px","whiteSpace":"nowrap"}}>
                            {v.pdCount}
                          </span>
                          <button className="btn sm gh" type="button" onClick={v.closeP} aria-label="Close">
                            ✕
                          </button>
                        </div>
                        <div className="pdl">
                          {(v.pdRows || []).map((r, $index) => (
                            <Fragment key={$index}>
                              <button className={r?.cls} type="button" onClick={r?.pick}>
                                <span className="pav" style={sx(r?.av)}>
                                  {r?.ini}
                                </span>
                                <span className="pdm">
                                  <span className="pdn">
                                    <span>
                                      {r?.pre}
                                      <mark>
                                        {r?.hi}
                                      </mark>
                                      {r?.post}
                                    </span>
                                    <span className="tag">
                                      {r?.grp}
                                    </span>
                                  </span>
                                  <span className="pda">
                                    {r?.addr}
                                  </span>
                                  <span className="pdc">
                                    <span>
                                      {"GSTIN "}
                                      <b>
                                        {r?.gst}
                                      </b>
                                    </span>
                                    <span>
                                      {"Ph "}
                                      <b>
                                        {r?.ph}
                                      </b>
                                    </span>
                                    <span>
                                      {"Contact "}
                                      <b>
                                        {r?.cp}
                                      </b>
                                    </span>
                                  </span>
                                </span>
                                <span className="pdr">
                                  <b>
                                    {r?.fig}
                                  </b>
                                  <span>
                                    {r?.sub}
                                  </span>
                                  <span className={r?.tc}>
                                    {r?.tag}
                                  </span>
                                </span>
                              </button>
                            </Fragment>
                          ))}
                          {' '}
                          {v.pdNone ? (
                            <>
                              <div className="pde">
                                No party matches "{v.pdQ}{"\". Check the spelling or add a new party."}
                              </div>
                            </>
                          ) : null}
                        </div>
                        <div className="pdf">
                          <span style={{"flex":"1"}}>
                            Details come from the account master
                          </span>
                          <DcLink className="btn sm" href={v.newPartyHref}>
                            + New party
                          </DcLink>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {v.pdDel ? (
                    <>
                      <div className={v.pdCls} role="dialog" aria-label={v.pdTitle}>
                        <div className="pdh">
                          <input className="pds" type="search" value={v.pdQ} onChange={v.setQ} placeholder="Search by name, GSTIN, phone, contact or city" aria-label="Search parties" autoFocus={true} />
                          <span className="muted" style={{"fontSize":"12px","whiteSpace":"nowrap"}}>
                            {v.pdCount}
                          </span>
                          <button className="btn sm gh" type="button" onClick={v.closeP} aria-label="Close">
                            ✕
                          </button>
                        </div>
                        <div className="pdl">
                          {(v.pdRows || []).map((r, $index) => (
                            <Fragment key={$index}>
                              <button className={r?.cls} type="button" onClick={r?.pick}>
                                <span className="pav" style={sx(r?.av)}>
                                  {r?.ini}
                                </span>
                                <span className="pdm">
                                  <span className="pdn">
                                    <span>
                                      {r?.pre}
                                      <mark>
                                        {r?.hi}
                                      </mark>
                                      {r?.post}
                                    </span>
                                    <span className="tag">
                                      {r?.grp}
                                    </span>
                                  </span>
                                  <span className="pda">
                                    {r?.addr}
                                  </span>
                                  <span className="pdc">
                                    <span>
                                      {"GSTIN "}
                                      <b>
                                        {r?.gst}
                                      </b>
                                    </span>
                                    <span>
                                      {"Ph "}
                                      <b>
                                        {r?.ph}
                                      </b>
                                    </span>
                                    <span>
                                      {"Contact "}
                                      <b>
                                        {r?.cp}
                                      </b>
                                    </span>
                                  </span>
                                </span>
                                <span className="pdr">
                                  <b>
                                    {r?.fig}
                                  </b>
                                  <span>
                                    {r?.sub}
                                  </span>
                                  <span className={r?.tc}>
                                    {r?.tag}
                                  </span>
                                </span>
                              </button>
                            </Fragment>
                          ))}
                          {' '}
                          {v.pdNone ? (
                            <>
                              <div className="pde">
                                No party matches "{v.pdQ}{"\". Check the spelling or add a new party."}
                              </div>
                            </>
                          ) : null}
                        </div>
                        <div className="pdf">
                          <span style={{"flex":"1"}}>
                            Details come from the account master
                          </span>
                          <DcLink className="btn sm" href={v.newPartyHref}>
                            + New party
                          </DcLink>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>
              <section className="sec items">
                <div className="sh">
                  <h2>
                    Items
                  </h2>
                </div>
                <datalist id="soe-items">
                  {(v.opt?.items || []).map((o, $index) => (
                    <Fragment key={$index}>
                      <option value={o?.l}>
                        {o?.d}
                      </option>
                    </Fragment>
                  ))}
                </datalist>
                <datalist id="soe-brands">
                  {(v.opt?.brands || []).map((o, $index) => (
                    <Fragment key={$index}>
                      <option value={o?.l} />
                    </Fragment>
                  ))}
                </datalist>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          #
                        </th>
                        <th>
                          Item
                        </th>
                        <th>
                          Brand
                        </th>
                        <th>
                          Lot no.
                        </th>
                        <th>
                          Unit
                        </th>
                        <th>
                          Grade
                        </th>
                        <th className="r">
                          Pcs
                        </th>
                        <th className="r">
                          Qty
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th className="r">
                          Disc %
                        </th>
                        <th className="r">
                          Freight %
                        </th>
                        <th className="r">
                          GST %
                        </th>
                        {v.more ? (
                          <>
                            <th>
                              Remark 1
                            </th>
                            <th>
                              Remark 2
                            </th>
                            <th>
                              HSN
                            </th>
                            <th className="r">
                              Avg rate + GST
                            </th>
                            <th className="r">
                              Pending pcs
                            </th>
                            <th className="r">
                              Pending qty
                            </th>
                            <th>
                              Status
                            </th>
                          </>
                        ) : null}
                        <th className="r">
                          Amount
                        </th>
                        <th>
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(v.lines || []).map((l, $index) => (
                        <Fragment key={$index}>
                          <tr className={l?.rc}>
                            <td className="muted">
                              {l?.n}
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Item" placeholder="Search item" list="soe-items" value={l?.itemName} onChange={l?.on?.itemName} style={{"width":"150px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Brand" list="soe-brands" value={l?.brand} onChange={l?.on?.brand} style={{"width":"90px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Lot no" value={l?.lotNo} onChange={l?.on?.lotNo} style={{"width":"90px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Unit" value={l?.unit} onChange={l?.on?.unit} style={{"width":"52px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Grade" value={l?.grade} onChange={l?.on?.grade} style={{"width":"52px"}} />
                            </td>
                            <td>
                              <input className="cin r" type="text" aria-label="Pieces" value={l?.pcs} onChange={l?.on?.pcs} style={{"width":"56px"}} />
                            </td>
                            <td>
                              <input className="cin r" type="text" aria-label="Quantity" value={l?.qty} onChange={l?.on?.qty} style={{"width":"90px"}} />
                            </td>
                            <td>
                              <input className="cin r" type="text" aria-label="Rate" value={l?.rate} onChange={l?.on?.rate} style={{"width":"76px"}} />
                            </td>
                            <td>
                              <input className="cin r" type="text" aria-label="Discount percent" value={l?.discPct} onChange={l?.on?.discPct} style={{"width":"52px"}} />
                            </td>
                            <td>
                              <input className="cin r" type="text" aria-label="Freight percent" value={l?.freightPct} onChange={l?.on?.freightPct} style={{"width":"52px"}} />
                            </td>
                            <td>
                              <input className="cin r" type="text" aria-label="GST percent" value={l?.gstRate} onChange={l?.on?.gstRate} style={{"width":"44px"}} />
                            </td>
                            {v.more ? (
                              <>
                                <td>
                                  <input className="cin" type="text" aria-label="Remark 1" value={l?.remark1} onChange={l?.on?.remark1} style={{"width":"80px"}} />
                                </td>
                                <td>
                                  <input className="cin" type="text" aria-label="Remark 2" value={l?.remark2} onChange={l?.on?.remark2} style={{"width":"80px"}} />
                                </td>
                                <td className="t2">
                                  {l?.hsn}
                                </td>
                                <td className="r">
                                  {l?.avg}
                                </td>
                                <td className="r">
                                  {l?.ppcs}
                                </td>
                                <td className="r">
                                  {l?.pq}
                                </td>
                                <td className="t2">
                                  {l?.st}
                                </td>
                              </>
                            ) : null}
                            <td className="r">
                              {l?.amt}
                            </td>
                            <td>
                              <span className={l?.stc}>
                                {l?.stock}
                              </span>
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td />
                        <td>
                          Total
                        </td>
                        <td />
                        <td />
                        <td />
                        <td />
                        <td className="r">
                          {v.tt?.pcs}
                        </td>
                        <td className="r">
                          {v.tt?.qty}
                        </td>
                        <td />
                        <td />
                        <td />
                        <td />
                        {v.more ? (
                          <>
                            <td />
                            <td />
                            <td />
                            <td />
                            <td className="r">
                              {v.tt?.pcs}
                            </td>
                            <td className="r">
                              {v.tt?.qty}
                            </td>
                            <td />
                          </>
                        ) : null}
                        <td className="r">
                          {v.tt?.amt}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
              <section className="sec bottom">
                <div className="cols3">
                  <div className="box">
                    <h3>
                      Discount structure
                    </h3>
                    {(v.dsc || []).map((d, $index) => (
                      <Fragment key={$index}>
                        <div className="kv">
                          <span>
                            {d?.l}
                          </span>
                          <span>
                            <input className="cin r" type="text" aria-label={d?.l} value={d?.v} onChange={d?.on} style={{"width":"96px","height":"26px"}} />
                          </span>
                        </div>
                      </Fragment>
                    ))}
                    {' '}
                    <button className="btn sm" type="button" style={{"alignSelf":"flex-start"}} onClick={v.addDisc}>
                      + Add discount
                    </button>
                  </div>
                  <div className="box">
                    <h3>
                      {"Transport & notes"}
                    </h3>
                    <div className="fld">
                      <label htmlFor="t1">
                        Transportation
                      </label>
                      <select id="t1" className="inp" value={v.f?.transporterId} onChange={v.set?.transporterId}>
                        <option value="">
                          Select transporter
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
                      <label htmlFor="f19">
                        Order type
                      </label>
                      <select id="f19" className="inp" value={v.f?.orderType} onChange={v.set?.orderType}>
                        <option>
                          Yarn
                        </option>
                        <option>
                          General
                        </option>
                      </select>
                    </div>
                    <div className="fld">
                      <label htmlFor="t2">
                        Add / less
                      </label>
                      <input id="t2" className="inp" type="text" placeholder="e.g. packing charge" value={v.f?.addLess} onChange={v.set?.addLess} />
                    </div>
                    <div className="fld">
                      <label htmlFor="t3">
                        Remark
                      </label>
                      <textarea id="t3" className="inp" placeholder="Shown on order print" value={v.f?.remark} onChange={v.set?.remark} />
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
                        {v.am?.q}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Gross amount
                      </span>
                      <span>
                        {v.am?.gross}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Discount
                      </span>
                      <span>
                        {v.am?.disc}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Taxable value
                      </span>
                      <span>
                        {v.am?.tax}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        {v.am?.l1}
                      </span>
                      <span>
                        {v.am?.v1}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        {v.am?.l2}
                      </span>
                      <span>
                        {v.am?.v2}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Add / less
                      </span>
                      <span>
                        {v.am?.al}
                      </span>
                    </div>
                    <div className="kv" style={{"paddingTop":"8px","borderTop":"1px dashed var(--bd2)"}}>
                      <span style={{"color":"var(--t1)","fontWeight":"600"}}>
                        Net amount
                      </span>
                      <span style={{"fontSize":"20px","fontWeight":"600"}}>
                        {v.am?.net}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
              <div className="actbar">
                <span className="actsum">
                  <span>
                    {"Qty "}
                    <b>
                      {v.tt?.qty}{" kg"}
                    </b>
                  </span>
                  <span>
                    {"Net "}
                    <b>
                      {v.am?.net}
                    </b>
                  </span>
                </span>
                {' '}
                <select className="inp" aria-label="More actions">
                  <option>
                    More…
                  </option>
                  <option>
                    {"Terms & conditions"}
                  </option>
                  <option>
                    Party details
                  </option>
                </select>
                {' '}
                <button className="btn no" type="button" onClick={v.remove} disabled={v.busy}>
                  Delete
                </button>
                <div style={{"flex":"1"}} />
                {v.isNew ? (
                  <>
                    <span className={v.noteCls} style={{"fontSize":"13px","maxWidth":"340px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}} role="status" title={v.note}>
                      {v.note}
                    </span>
                    <DcLink className="btn gh" href={v.regHref}>
                      Cancel
                    </DcLink>
                    {' '}
                    <button className="btn" type="button" onClick={v.savePrint} disabled={v.busy}>
                      {"Save & print"}
                    </button>
                    {' '}
                    <button className="btn pr" type="button" onClick={v.save} disabled={v.busy}>
                      {v.saveLabel}
                    </button>
                  </>
                ) : null}
                {v.isRec ? (
                  <>
                    <span className={v.noteCls} style={{"fontSize":"13px","maxWidth":"340px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}} role="status" title={v.note}>
                      {v.updNote}
                    </span>
                    <DcLink className="btn gh" href={v.backHref}>
                      Close
                    </DcLink>
                    <button className="btn" type="button" onClick={v.print}>
                      Print
                    </button>
                    <button className="btn pr" type="button" onClick={v.doUpdate} disabled={v.busy}>
                      {v.updLabel}
                    </button>
                  </>
                ) : null}
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
                      {v.ph?.title}
                    </div>
                    {(v.ph?.rows || []).map((h, $index) => (
                      <Fragment key={$index}>
                        <div className="hrow">
                          <span>
                            {h?.a}
                          </span>
                          <span>
                            {h?.b}
                          </span>
                          <span className="muted">
                            {h?.c}
                          </span>
                          <span className="muted">
                            {h?.d}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                    {' '}
                    {v.ph?.none ? (
                      <>
                        <div className="muted" style={{"fontSize":"13px"}}>
                          No earlier orders
                        </div>
                      </>
                    ) : null}
                    <div className="muted" style={{"fontSize":"13px","marginTop":"6px"}}>
                      Last design / lot used
                    </div>
                    <div style={{"display":"flex","gap":"6px","flexWrap":"wrap"}}>
                      {(v.ph?.lots || []).map((t, $index) => (
                        <Fragment key={$index}>
                          <span className="tag">
                            {t}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                    <div className="box" style={{"marginTop":"6px"}}>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {v.ph?.payL}
                      </span>
                      <b style={{"fontWeight":"600"}}>
                        {v.ph?.pay}
                      </b>
                      <span className={v.ph?.payC} style={{"alignSelf":"flex-start"}}>
                        {v.ph?.payT}
                      </span>
                    </div>
                  </div>
                </aside>
              </>
            ) : null}
          </div>
        </div>
        <div className="aiw">
          <Assistant page="soe" />
        </div>
      </div>
      </>
    );
  }
}

export default function SalesOrderEntry(props) {
  const theme = useTheme();
  return <SalesOrderEntryView {...props} theme={theme} />;
}
