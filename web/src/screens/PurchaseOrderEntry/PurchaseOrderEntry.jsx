/* eslint-disable */
// PurchaseOrderEntry — converted 1:1 from the YarnFlow design (PurchaseOrderEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './PurchaseOrderEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) {
    super(p);
    this.state = { z: 1, moreF: false, more: false, hist: true, base: 'direct', lp: 0, f: this.blank(), lines: [this.blankLine()], note: '', err: false, busy: false, ps: {}, ph: {} };
  }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  today() { const t = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(t.getDate()) + '-' + z(t.getMonth() + 1) + '-' + t.getFullYear(); }
  blank() { return { costCenterId: '', bookId: '', date: this.today(), brokerId: '', brokerageRate: '', orderMode: 'Phone', partyId: '', refNo: '', creditDays: '', agentId: '', salesPersonId: '', expDeliveryDate: '', processType: 'Direct', priority: 'NORMAL', transporterId: '', orderType: 'Yarn', addLess: '', remark: '', godownId: '', deliveryPartyId: '', refName: '' }; }
  blankLine() { return { itemId: null, itemName: '', brand: '', lotNo: '', unit: 'Kg', grade: '', pcs: '', qty: '', rate: '', freightPct: '', gstRate: '5', remark1: '', hsn: '' }; }
  isView() { return this.props.mode === 'view'; }

  componentDidMount() {
    try { const b = JSON.parse(window.localStorage.getItem('yf-back') || 'null'); if (b && b.href) this.setState({ back: b }); } catch (e) {}
    try { const fl = window.localStorage.getItem('yf-flash'); if (fl) { window.localStorage.removeItem('yf-flash'); this.setState({ note: fl }); } } catch (e) {}
    this.init();
    if (!this.isView()) return;
    const rd = () => { try { const raw = window.localStorage.getItem('yf-view-po'); if (raw && raw !== this._raw) { this._raw = raw; this.openRec(JSON.parse(raw)); } } catch (e) {} };
    this._rd = rd; rd(); if (!this._raw) this.openRec(null); this._iv = setInterval(rd, 700);
    try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }

  async init() {
    const api = this.api(); if (!api) return;
    try {
      const [lk, stock] = await Promise.all([api.lookups(), api.get('/reports/stock')]);
      const stk = {}; stock.rows.forEach((r) => { stk[r.itemId] = (stk[r.itemId] || 0) + r.qty; });
      const book = lk.books.find((b) => b.voucherType === 'PURCHASE_ORDER' && b.isDefault) || lk.books.find((b) => b.voucherType === 'PURCHASE_ORDER');
      const cc = lk.costCenters.find((c) => c.isDefault) || lk.costCenters[0];
      const gd = lk.godowns.find((g) => g.isDefault) || lk.godowns[0];
      const f = this.state.f;
      this.setState({ lk, stk, f: { ...f, bookId: f.bookId || (book ? String(book.id) : ''), costCenterId: f.costCenterId || (cc ? String(cc.id) : ''), godownId: f.godownId || (gd && !f.deliveryPartyId ? String(gd.id) : f.godownId) } });
      if (!this.isView()) { const nx = await api.get('/vouchers/purchase-orders/next-number', book ? { bookId: book.id } : undefined); this.setState({ nextNo: nx.number }); }
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }

  async openRec(rec) {
    const api = this.api();
    if (api && rec && rec.id) {
      try { const d = await api.get('/vouchers/purchase-orders/' + rec.id); this.fill(d); this.loadParty(d.partyId); } catch (e) { this.setState({ note: api.message(e), err: true }); }
      return;
    }
    if (api) return;
    const R = rec || { no: 'PUR0796', dt: '23-06-2026', p: 'J.J. Industries', g: 'Henil', it: 'Muskan Gold', br: 'J.J. Industries', lot: 'MG123', gr: '1ST', rate: 550, oq: 2000, dq: 1771.99, stL: 'Pending receipt' };
    this.setState({ sample: R, f: { ...this.blank(), partyId: 'd0', date: R.dt, creditDays: '45', expDeliveryDate: '30-10-2026' },
      lines: [{ ...this.blankLine(), itemName: R.it, brand: R.br, lotNo: R.lot, grade: R.gr, pcs: String(Math.max(1, Math.round(R.oq / 60))), qty: String(R.oq), rate: String(R.rate), doneQty: Number(R.dq) || 0, pendingQty: Math.max(0, (Number(R.oq) || 0) - (Number(R.dq) || 0)), saved: true }, this.blankLine()] });
  }

  fill(d) {
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    const dmy = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('-') : '');
    this.setState({
      doc: d, same: !d.deliveryPartyId && !(d.godownId && this.state.lk && this.state.lk.godowns[0] && d.godownId !== (this.state.lk.godowns.find((g) => g.isDefault) || this.state.lk.godowns[0]).id),
      base: /^Against /.test(d.refName || '') ? 'so' : 'direct',
      f: { costCenterId: s(d.costCenterId), bookId: s(d.bookId), date: dmy(d.date), brokerId: s(d.brokerId), brokerageRate: d.brokerageRate ? s(d.brokerageRate) : '', orderMode: d.orderMode || 'Phone', partyId: s(d.partyId), refNo: s(d.refNo), creditDays: s(d.creditDays),
        agentId: s(d.agentId), salesPersonId: s(d.salesPersonId), expDeliveryDate: dmy(d.expDeliveryDate), processType: d.processType || 'Direct', priority: d.priority || 'NORMAL', transporterId: s(d.transporterId), orderType: d.orderType || 'Yarn',
        addLess: d.addLess ? s(d.addLess) : '', remark: s(d.remark), godownId: s(d.godownId), deliveryPartyId: s(d.deliveryPartyId), refName: s(d.refName) },
      lines: d.lines.map((l) => ({ id: l.id, itemId: l.itemId, itemName: l.itemName || l.description || '', brand: s(l.brand), lotNo: s(l.lotNo), unit: l.unit === 'KG' ? 'Kg' : s(l.unit), grade: s(l.grade), pcs: s(l.pcs || ''), qty: s(l.qty), rate: s(l.rate),
        freightPct: l.freightPct ? s(l.freightPct) : '', gstRate: s(l.gstRate), remark1: s(l.remark1), hsn: s(l.hsn), doneQty: l.doneQty || 0, pendingQty: l.pendingQty, lineStatus: l.lineStatus, saved: true })).concat([this.blankLine()])
    });
  }

  async loadParty(id) {
    const api = this.api(); if (!api || !id) return;
    try {
      const [sm, hist] = await Promise.all([api.get('/accounts/' + id + '/summary'), api.get('/vouchers/purchase-orders', { view: 'lines', partyId: id, pageSize: 8 })]);
      this.setState({ ps: { ...this.state.ps, [id]: sm }, ph: { ...this.state.ph, [id]: hist.data } });
    } catch (e) {}
  }

  pickParty(p) {
    const f = { ...this.state.f, partyId: String(p.id) };
    if (p.live) Object.assign(f, { creditDays: String(p.creditDays ?? ''), brokerId: p.brokerId ? String(p.brokerId) : f.brokerId, transporterId: p.transporterId ? String(p.transporterId) : f.transporterId, brokerageRate: p.brokerageRate ? String(p.brokerageRate) : f.brokerageRate });
    this.setState({ f, pd: null, pq: '' });
    if (p.live) this.loadParty(p.id);
  }

  /** "Against sales order": link open sales orders and bring their pending lines in */
  async setSO() {
    this.setState({ base: 'so' });
    const api = this.api(); if (!api) return;
    try {
      const pl = this.state.sop || await api.get('/vouchers/sales-orders/pending-lines', { for: 'sale-bills' });
      this.setState({ sop: pl }); this.linkOrders(pl, this.state.lp || 0);
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  linkOrders(pl, page) {
    const ords = [...new Map(pl.map((l) => [l.voucherId, l])).values()];
    if (!ords.length) { this.setState({ note: 'No sales order has pending quantity', err: false }); return; }
    const start = (page * 2) % ords.length; const pick = [ords[start], ords[(start + 1) % ords.length]].filter((o, i, a) => a.indexOf(o) === i);
    const ids = new Set(pick.map((o) => o.voucherId));
    const its = (this.state.lk && this.state.lk.items) || [];
    const lines = pl.filter((l) => ids.has(l.voucherId)).map((l) => { const it = its.find((x) => x.id === l.itemId) || {};
      return { ...this.blankLine(), itemId: l.itemId, itemName: l.itemName, brand: l.brand || '', lotNo: l.lotNo || '', grade: l.grade || '', pcs: l.pcs ? String(Math.round(l.pcs * l.pendingQty / Math.max(l.qty, 0.001))) : '', qty: String(l.pendingQty), rate: it.purchaseRate ? String(it.purchaseRate) : '', gstRate: String(l.gstRate), hsn: l.hsn || '' }; });
    this.setState({ lp: page, linked: pick.map((o) => ({ no: o.number.replace(/\/\d{2}-\d{2}$/, ''), d: o.partyName + ' · ' + pl.filter((l) => l.voucherId === o.voucherId).reduce((a, l) => a + l.pendingQty, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' kg pending' })),
      lines: lines.concat([this.blankLine()]), f: { ...this.state.f, refName: 'Against ' + pick.map((o) => o.number).join(', ') } });
  }

  setLine(i, k, v) {
    const lines = this.state.lines.slice();
    const l = { ...lines[i], [k]: v };
    if (k === 'itemName') {
      const its = (this.state.lk && this.state.lk.items) || [];
      const it = its.find((x) => x.name.toLowerCase() === String(v).trim().toLowerCase() || x.code.toLowerCase() === String(v).trim().toLowerCase());
      l.itemId = it ? it.id : null;
      if (it) { l.itemName = it.name; l.gstRate = String(it.gstRate); l.hsn = it.hsn; l.unit = it.unit === 'KG' ? 'Kg' : it.unit; if (!l.rate && (it.purchaseRate || it.rate)) l.rate = String(it.purchaseRate || it.rate); if (!l.brand && it.brandId) { const b = (this.state.lk.brands || []).find((x) => x.id === it.brandId); if (b) l.brand = b.name; } }
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
    if (!f.partyId) return this.fail('Select a mill / party');
    if (!iso(f.date)) return this.fail('Order date must be dd-mm-yyyy');
    const lines = st.lines.filter((l) => l.itemName || l.qty);
    if (lines.some((l) => !l.itemId)) return this.fail('Pick each item from the list (line ' + (st.lines.findIndex((l) => (l.itemName || l.qty) && !l.itemId) + 1) + ')');
    if (!lines.length) return this.fail('Add at least one item');
    const same = st.same ?? true;
    return {
      bookId: id(f.bookId), costCenterId: id(f.costCenterId), date: iso(f.date), partyId: id(f.partyId), brokerId: id(f.brokerId), brokerageRate: n(f.brokerageRate) || 0, brokerageType: 'PER_KG', orderMode: f.orderMode,
      refNo: f.refNo || null, refName: st.base === 'so' ? f.refName || null : null, creditDays: n(f.creditDays), agentId: id(f.agentId), salesPersonId: id(f.salesPersonId), expDeliveryDate: iso(f.expDeliveryDate), processType: f.processType, priority: f.priority,
      transporterId: id(f.transporterId), orderType: f.orderType, addLess: n(f.addLess) || 0, remark: f.remark || null,
      godownId: same ? id(this.defGodown()) : id(f.godownId), deliveryPartyId: same ? null : id(f.deliveryPartyId),
      lines: lines.map((l) => ({ itemId: l.itemId, brand: l.brand || null, lotNo: l.lotNo || null, grade: l.grade || null, unit: /^kg$/i.test(l.unit) ? 'KG' : l.unit, pcs: n(l.pcs) || 0, qty: n(l.qty) || 0, rate: n(l.rate) || 0, freightPct: n(l.freightPct) || 0, gstRate: n(l.gstRate) ?? 5, remark1: l.remark1 || null }))
    };
  }
  defGodown() { const g = this.state.lk ? this.state.lk.godowns.find((x) => x.isDefault) || this.state.lk.godowns[0] : null; return g ? String(g.id) : ''; }
  fail(msg) { this.setState({ note: msg, err: true }); return null; }

  async save(send) {
    const api = this.api();
    const isRec = !!this.state.doc;
    if (!api) { this.setState({ note: isRec ? 'Changes saved (design preview)' : send ? 'Saved and sent to mill (design preview)' : 'Saved for approval (design preview)', err: false, upd: true }); return; }
    const body = this.body(); if (!body) return;
    this.setState({ busy: true, note: 'Saving…', err: false });
    try {
      const doc = isRec ? await api.put('/vouchers/purchase-orders/' + this.state.doc.id, body) : await api.post('/vouchers/purchase-orders', body);
      api.invalidate();
      if (send) window.print();
      const msg = (isRec ? '✓ Updated ' : '✓ Saved ') + doc.number + (doc.status === 'PENDING_APPROVAL' ? ' — waiting for approval' : send ? ' — PO ready to send to the mill' : '');
      if (isRec) { this.fill(doc); this.setState({ busy: false, note: msg, err: false, upd: true }); return; }
      try { window.localStorage.setItem('yf-view-po', JSON.stringify({ t: Date.now(), id: doc.id, no: doc.number })); window.localStorage.setItem('yf-flash', msg); } catch (e) {}
      this.go('PurchaseOrderView' + ((this.props.theme ?? 'dark') === 'light' ? 'Light' : '') + '.dc.html');
    } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }

  async remove() {
    const api = this.api(); const doc = this.state.doc;
    if (!doc) { this.setState({ f: { ...this.blank(), bookId: this.state.f.bookId, costCenterId: this.state.f.costCenterId }, lines: [this.blankLine()], note: 'Cleared', err: false, base: 'direct' }); return; }
    if (!api) return;
    if (!window.confirm('Delete purchase order ' + doc.number + '?')) return;
    this.setState({ busy: true });
    try { await api.del('/vouchers/purchase-orders/' + doc.id); api.invalidate(); this.go('PurchaseOrderList' + ((this.props.theme ?? 'dark') === 'light' ? 'Light' : '') + '.dc.html'); }
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
    const fmt0 = (n) => '₹ ' + inr(n, 0);
    const SAMPLE_PTY = [{"name": "Garden Silk Mills Pvt Ltd", "grp": "Garden Silk Mills", "addr": "Jolwa Village, Palsana, Surat 394305", "city": "Palsana", "gst": "24AABCG5521N1Z8", "ph": "+91 261 239 0011", "cp": "Hitesh (sales)", "fig": "₹ 6,20,500", "sub": "45 days credit", "tag": "6-day delivery", "tc": "tag t-blue"}, {"name": "Reliance Industries Ltd", "grp": "Reliance Industries", "addr": "Polyester Division, Silvassa 396230", "city": "Silvassa", "gst": "26AAACR4471L1Z8", "ph": "+91 260 264 2000", "cp": "Yarn desk", "fig": "₹ 38,40,000", "sub": "60 days credit", "tag": "Key mill", "tc": "tag t-green"}, {"name": "Sanathan Textiles Pvt Ltd", "grp": "Sanathan Textiles", "addr": "Survey 187, Dadra, Silvassa 396193", "city": "Silvassa", "gst": "26AAHCS2210K1Z2", "ph": "+91 260 266 8800", "cp": "Ketan Rao", "fig": "₹ 4,12,000", "sub": "30 days credit", "tag": "2% short wt", "tc": "tag t-orange"}, {"name": "Garden Vareli Textiles", "grp": "Garden Silk Mills", "addr": "Vareli, Kadodara, Surat 394327", "city": "Surat", "gst": "24AACCG7781D1Z4", "ph": "+91 261 239 0450", "cp": "Paresh Naik", "fig": "₹ 0", "sub": "45 days credit", "tag": "New mill", "tc": "tag t-blue"}];
    const SAMPLE_DEL = [{"name": "Our godown · Sachin GIDC", "grp": "Own godown", "addr": "Plot 210, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AAKCS7781M1Z2", "ph": "+91 98250 10010", "cp": "Godown in-charge", "fig": "Own", "sub": "54,910 kg in stock", "tag": "Godown", "tc": "tag"}, {"name": "Our godown · Pandesara", "grp": "Own godown", "addr": "Plot 51, Pandesara GIDC, Surat 394221", "city": "Surat", "gst": "24AAKCS7781M1Z2", "ph": "+91 98250 10011", "cp": "Godown in-charge", "fig": "Own", "sub": "21,400 kg in stock", "tag": "Godown", "tc": "tag"}, {"name": "Shree Rudraksha Poly (direct)", "grp": "Buyer · direct delivery", "addr": "Block 3, Kadodara Char Rasta, Surat 394327", "city": "Surat", "gst": "24AAHFS3302P1Z1", "ph": "+91 97234 55102", "cp": "Kamal Shah", "fig": "Buyer", "sub": "Against SAL05773", "tag": "Direct to buyer", "tc": "tag t-blue"}];
    const PTY = live
      ? lk.suppliers.map((c) => ({ live: true, ...c, id: c.id, name: c.name, grp: c.partyGroupName || c.name, addr: [c.address1, c.area, c.city].filter(Boolean).join(', ') || '—', city: c.city || '', gst: c.gstin || '—', ph: c.mobile || '—', cp: c.contactPerson || '—',
          fig: fmt0(Math.max(0, -c.balance)), sub: (c.creditDays || 0) + ' days credit', tag: c.status === 'ON_HOLD' ? 'On hold' : c.status === 'BLOCKED' ? 'Blocked' : '', tc: c.status === 'ACTIVE' ? 'tag' : 'tag t-orange' }))
      : SAMPLE_PTY.map((p, i) => ({ ...p, id: 'd' + i }));
    const DEL = live
      ? lk.godowns.map((g) => ({ id: 'g' + g.id, gid: g.id, name: 'Our godown · ' + g.name, grp: 'Own godown', addr: [g.address, g.city].filter(Boolean).join(', ') || '—', city: g.city || '', gst: '—', ph: '—', cp: 'Godown in-charge', fig: 'Own', sub: '', tag: 'Godown', tc: 'tag' }))
          .concat(lk.customers.map((c) => ({ id: 'c' + c.id, cid: c.id, name: c.name + ' (direct)', grp: 'Buyer · direct delivery', addr: [c.address1, c.area, c.city].filter(Boolean).join(', ') || '—', city: c.city || '', gst: c.gstin || '—', ph: c.mobile || '—', cp: c.contactPerson || '—', fig: 'Buyer', sub: '', tag: 'Direct to buyer', tc: 'tag t-blue' })))
      : SAMPLE_DEL.map((p, i) => ({ ...p, id: 'x' + i }));
    const COL = ['#3B82F6, #6366F1', '#F59E0B, #EA580C', '#10B981, #059669', '#EC4899, #DB2777', '#8B5CF6, #6D28D9', '#14B8A6, #0D9488'];
    const deco = (p, i) => ({ ...p, ini: p.name.replace(/^(Our godown · |Shree |Shri |The )/i, '').charAt(0), av: 'background: linear-gradient(135deg, ' + COL[i % COL.length] + ')' });

    const doc = st.doc; const sample = st.sample;
    const isRec = this.isView() && !!(doc || sample);
    const STL = { PENDING_APPROVAL: 'On hold · approval', OPEN: 'Pending receipt', PARTIAL: 'Pending receipt', COMPLETED: 'Closed', CANCELLED: 'Cancelled', LOCKED: 'Locked', REJECTED: 'Rejected' };
    const TAGC = { 'Pending dispatch': 'tag t-blue', 'Pending receipt': 'tag t-blue', 'On hold · approval': 'tag t-orange', 'On hold': 'tag t-orange', Closed: 'tag t-green', Clear: 'tag t-green', Cancelled: 'tag t-red', Rejected: 'tag t-red', Locked: 'tag t-gray' };
    const stL = doc ? STL[doc.status] || doc.status : sample ? sample.stL || 'Pending receipt' : 'New';
    const recNo = doc ? doc.number : sample ? (/\//.test(sample.no) ? sample.no : sample.no + '/26-27') : (st.nextNo || 'PUR2210/26-27');

    // party
    const f = st.f;
    const bi = PTY.findIndex((p) => String(p.id) === String(f.partyId));
    const hasP = bi >= 0;
    const bp = hasP ? deco(PTY[bi], bi) : { name: 'Select mill / party…', grp: '', ini: '+', av: 'background: var(--s3); color: var(--t3)', fig: '₹ 0', sub: '', tag: '', tc: '', addr: '', city: '', gst: '', ph: '', cp: '' };
    const same = st.same ?? true;
    const dKey = f.deliveryPartyId ? 'c' + f.deliveryPartyId : f.godownId ? 'g' + f.godownId : '';
    const di = live ? Math.max(0, DEL.findIndex((p) => p.id === dKey)) : st.del ?? 0;
    const dp = DEL[di] ? deco(DEL[di], di + 2) : bp;
    const pdOpen = st.pd ?? (this.props.startSearch ? 'bill' : null);
    const q = (st.pq ?? this.props.startSearch ?? '').trim(); const ql = q.toLowerCase();
    const SRC = pdOpen === 'del' ? DEL : PTY; const cur = pdOpen === 'del' ? di : bi;
    const hits = SRC.map((p, i) => [p, i]).filter(([p]) => !ql || [p.name, p.gst, p.ph, p.cp, p.city, p.grp, p.addr].join(' ').toLowerCase().indexOf(ql) >= 0).slice(0, 60);
    const pickDel = (p, i) => this.setState({ del: i, f: { ...st.f, godownId: p.gid ? String(p.gid) : '', deliveryPartyId: p.cid ? String(p.cid) : '' }, pd: null, pq: '' });
    const pdRows = hits.map(([p, i]) => { const d = deco(p, pdOpen === 'del' ? i + 2 : i); const k = ql ? p.name.toLowerCase().indexOf(ql) : -1;
      return { ...d, pre: k >= 0 ? p.name.slice(0, k) : p.name, hi: k >= 0 ? p.name.slice(k, k + q.length) : '', post: k >= 0 ? p.name.slice(k + q.length) : '',
        cls: i === cur ? 'pdi on' : 'pdi', fig: p.fig, sub: p.sub, tag: p.tag, tc: p.tc, pick: () => (pdOpen === 'del' ? pickDel(p, i) : this.pickParty(p)) }; });
    const defG = live ? (lk.godowns.find((g) => g.isDefault) || lk.godowns[0]) : null;
    const defGd = defG ? 'Our godown · ' + defG.name : 'Our godown · Sachin GIDC';

    // payable / due pills
    const ps = hasP && live ? st.ps[PTY[bi].id] : null;
    let dueCls = 'kp ok', dueVal = 'None';
    if (ps && ps.overdue > 0) { dueCls = 'kp due'; dueVal = fmt0(ps.overdue) + ' · ' + ps.maxOverdueDays + ' d late'; }

    // lines & totals
    const pState = hasP && live ? PTY[bi].stateCode : null;
    const inter = !!(pState && lk.companyStateCode && pState !== lk.companyStateCode);
    const stk = st.stk || {};
    let tPcs = 0, tQty = 0, tBasic = 0, tFr = 0, tTax = 0, tGst = 0, tPq = 0; const hsnT = {};
    const lines = st.lines.map((l, i) => {
      const qty = num(l.qty), rate = num(l.rate), g = num(l.gstRate);
      const basic = qty * rate; const fr = basic * num(l.freightPct) / 100; const tax = basic + fr; const gst = tax * g / 100;
      const blank = !l.itemName && !l.qty;
      const pq = l.saved ? l.pendingQty ?? qty : qty;
      if (!blank) { tPcs += num(l.pcs); tQty += qty; tBasic += basic; tFr += fr; tTax += tax; tGst += gst; tPq += pq; const h = (l.hsn || '5402') + '|' + g; hsnT[h] = (hsnT[h] || 0) + tax; }
      const on = {}; ['itemName', 'brand', 'lotNo', 'grade', 'pcs', 'qty', 'rate', 'freightPct', 'remark1'].forEach((k) => { on[k] = (e) => this.setLine(i, k, e.target.value); });
      const have = l.itemId ? stk[l.itemId] : null;
      const stock = l.saved ? 'Received ' + inr(l.doneQty || 0, 3) + ' kg' : blank ? '—' : have != null ? inr(have, 0) + ' kg' : live && l.itemName && !l.itemId ? 'Pick from list' : '—';
      return { ...l, n: i + 1, on, amt: blank ? '—' : inr(tax, 2), stock, stc: blank ? 'muted' : l.saved ? 't2' : live && l.itemName && !l.itemId ? 'tag t-orange' : 't2',
        t1: blank ? '—' : inr(inter ? gst : gst / 2, 2), t2: blank ? '—' : inr(inter ? 0 : gst / 2, 2), avg: blank ? '—' : inr(rate * (1 + g / 100), 2), pq: blank ? '—' : inr(pq, 3),
        st: l.saved ? (l.lineStatus === 'CLOSED' ? 'Closed' : pq <= 0.001 ? 'Clear' : (l.doneQty || 0) > 0 ? 'Part received' : 'Pending') : blank ? '—' : 'New', hsn: l.hsn || '—' };
    });
    const al = num(f.addLess); const net = Math.round(tTax + tGst + al);
    const tt = { pcs: inr(tPcs, 0), qty: inr(tQty, 3), t1: inr(inter ? tGst : tGst / 2, 2), t2: inr(inter ? 0 : tGst / 2, 2), amt: inr(tTax, 2), pq: inr(tPq, 3) };
    const am = { q: inr(tQty, 3) + ' kg · ' + inr(tPcs, 0) + ' pcs', gross: '₹ ' + inr(tBasic, 2), fr: '₹ ' + inr(tFr, 2), gl: inter ? 'IGST' : 'CGST + SGST', gst: '₹ ' + inr(tGst, 2), al: '₹ ' + inr(al, 2), net: '₹ ' + inr(net, 2) };
    const txRows = [];
    Object.keys(hsnT).forEach((k) => { const [h, g] = k.split('|'); const v = hsnT[k]; txRows.push({ l: 'HSN ' + h + ' · taxable', v: '₹ ' + inr(v, 2) });
      if (inter) txRows.push({ l: 'IGST ' + g + '%', v: '₹ ' + inr(v * g / 100, 2) }); else { txRows.push({ l: 'CGST ' + g / 2 + '%', v: '₹ ' + inr(v * g / 200, 2) }); txRows.push({ l: 'SGST ' + g / 2 + '%', v: '₹ ' + inr(v * g / 200, 2) }); } });
    const tx = { rows: txRows.length ? txRows : [{ l: 'HSN 5402 · taxable', v: '₹ 0.00' }, { l: inter ? 'IGST 5%' : 'CGST 2.5%', v: '₹ 0.00' }].concat(inter ? [] : [{ l: 'SGST 2.5%', v: '₹ 0.00' }]), disc: 'None' };

    // dates
    const parse = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : null; };
    const fmtD = (t) => { const x = new Date(t); const z = (v) => String(v).padStart(2, '0'); return z(x.getUTCDate()) + '-' + z(x.getUTCMonth() + 1) + '-' + x.getUTCFullYear(); };
    const d0 = parse(f.date); const dE = parse(f.expDeliveryDate);
    const due = d0 != null ? fmtD(d0 + num(f.creditDays) * 864e5) : '';
    const deliveryIn = d0 != null && dE != null ? String(Math.round((dE - d0) / 864e5)) : '';
    const setDeliveryIn = (e) => { const v = e.target.value; const b = parse(this.state.f.date); this.setState({ f: { ...this.state.f, expDeliveryDate: b != null && v !== '' && !isNaN(Number(v)) ? fmtD(b + Number(v) * 864e5) : this.state.f.expDeliveryDate } }); };

    // dropdown options
    const opts = (list, l = (x) => x.name) => (list || []).map((x) => ({ v: String(x.id), l: l(x) }));
    const opt = live
      ? { costCenters: opts(lk.costCenters), books: opts(lk.books.filter((b) => b.voucherType === 'PURCHASE_ORDER')), brokers: opts(lk.brokers), agents: opts(lk.brokers, (x) => x.name + ' (agent)'), salesPersons: opts(lk.salesPersons), transporters: opts(lk.transporters),
          items: (lk.items || []).filter((i) => !i.isGeneral).map((i) => ({ l: i.name, d: i.code + ' · ' + (i.description || '') })), brands: (lk.brands || []).map((b) => ({ l: b.name })) }
      : { costCenters: [{ v: '', l: 'Trading division' }], books: [{ v: '', l: 'Purchase order' }], brokers: [], agents: [{ v: 'h', l: 'Henil (agent)' }], salesPersons: [{ v: 'm', l: 'Meera Patel' }], transporters: [{ v: 'j', l: 'Jay Ambe Roadlines' }],
          items: [{ l: '75/36 FDY', d: 'PFY-7536-SD' }, { l: '50/24 FDY', d: 'PFY-5024' }], brands: [{ l: 'Garden' }, { l: 'Reliance' }] };
    const set = {}; Object.keys(this.blank()).forEach((k) => { set[k] = (e) => this.setState({ f: { ...this.state.f, [k]: e.target.value }, note: this.state.err ? '' : this.state.note, err: false }); });

    // linked sales orders
    const so = st.base === 'so';
    const lk2 = live ? (st.linked || []) : [{ no: 'SAL05773', d: 'Shree Rudraksha Poly · 3,991 kg pending' }, { no: 'SAL04614', d: '4,798 kg pending' }];
    const lnk = { rows: lk2.map((k, i) => ({ ...k, sep: i < lk2.length - 2 ? ', ' : i === lk2.length - 2 ? ' and ' : '' })), change: () => (live && st.sop ? this.linkOrders(st.sop, (st.lp || 0) + 1) : null) };

    // mill history
    let ph;
    if (live && hasP) {
      const rows = st.ph[PTY[bi].id] || []; const sm = st.ps[PTY[bi].id];
      const it0 = rows[0] ? rows[0].itemName : null; const tr = rows.filter((r) => r.itemName === it0).map((r) => r.rate);
      const chg = tr.length > 1 && tr[tr.length - 1] ? (tr[0] - tr[tr.length - 1]) / tr[tr.length - 1] * 100 : 0;
      ph = { title: 'Last orders · ' + bp.name, rows: rows.slice(0, 5).map((r) => ({ a: (r.itemName || '') + ' · ' + inr(r.qty, 0) + ' kg', b: '₹ ' + inr(r.rate, 2), c: r.number.replace(/\/\d{2}-\d{2}$/, '') + ' · ' + r.date.split('-').reverse().join('-'), d: r.pendingQty > 0.001 ? inr(r.pendingQty, 0) + ' kg pending' : 'Clear' })),
        trL: 'Rate trend · ' + (it0 || '—'), tr: tr.length ? (tr.length > 1 ? '₹ ' + inr(tr[tr.length - 1], 2) + ' → ' : '') + '₹ ' + inr(tr[0], 2) : '—', trS: tr.length > 1 ? (chg >= 0 ? '+' : '') + chg.toFixed(1) + '% over last ' + tr.length + ' orders' : 'One order so far',
        pay: sm ? fmt0(Math.abs(sm.outstanding || 0)) : '…', payS: sm ? (sm.overdue > 0 ? fmt0(sm.overdue) + ' overdue · ' + sm.maxOverdueDays + ' days' : 'Nothing overdue') : '' };
      ph.none = ph.rows.length === 0;
    } else {
      ph = { title: 'Last orders · ' + (hasP ? bp.name : 'Garden Silk Mills'), none: false,
        rows: [{ a: '67/72 FDY · 850 kg', b: '₹ 119.00', c: 'PUR0724 · 13-06-2026', d: '850 kg pending' }, { a: '50/24 FDY · 21,000 kg', b: '₹ 126.00', c: 'PUR0979 · 08-07-2026', d: '6,892 kg pending' }, { a: '75/36 FDY · 12,000 kg', b: '₹ 117.50', c: 'PUR0412 · 02-05-2026', d: 'Clear' }],
        trL: 'Rate trend · 75/36 FDY', tr: '₹ 117.50 → ₹ 119.00', trS: '+1.3% in 6 months', pay: '₹ 6,20,500', payS: 'Avg delivery 6 days · 2% short weight' };
    }

    const BK = st.back;
    return {
      backHref: BK ? BK.href : 'PurchaseOrderList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Purchase order register',
      sideKey: isRec ? 'po' : 'poe', regLabel: isRec ? 'Purchase order register' : 'Purchase Orders', isRec, isNew: !isRec,
      recTitle: isRec ? recNo : 'New order', recTag: isRec ? stL : 'New', recTagC: isRec ? (TAGC[stL] || 'tag') : 'tag', recNo, recDt: f.date,
      updLabel: st.busy ? 'Saving…' : st.upd ? '✓ Updated' : 'Update order', updNote: st.note || ('Editing ' + recNo), note: st.note, noteCls: st.err ? 'tag t-red' : 'muted', busy: !!st.busy,
      doUpdate: () => this.save(false), save: () => this.save(false), saveSend: () => this.save(true), print: () => window.print(), remove: () => this.remove(), saveLabel: st.busy ? 'Saving…' : 'Save for approval',
      f, set, opt, lines, tt, am, tx, dueDate: due, deliveryIn, setDeliveryIn, defGd, lnk,
      hasP, dueCls, dueLbl: 'Due payment', dueVal, bp, dp, same, diff: !same, pdBill: pdOpen === 'bill', pdDel: pdOpen === 'del',
      dName: same ? defGd : dp.name, dAd: same ? '' : dp.addr, dMeta: same ? 'Default godown' : 'GSTIN ' + dp.gst + ' · Ph ' + dp.ph, pdOpen: !!pdOpen, pdRows, pdNone: pdRows.length === 0, pdQ: q, pdCount: hits.length + (hits.length === 1 ? ' party' : ' parties'),
      pdCls: pdOpen === 'del' ? 'pdrop r' : 'pdrop', pdTitle: pdOpen === 'del' ? 'Choose delivery party' : 'Choose billing party',
      openBill: () => this.setState({ pd: 'bill', pq: '' }), openDel: () => this.setState({ pd: 'del', pq: '' }), closeP: () => this.setState({ pd: null, pq: '' }),
      setQ: (e) => this.setState({ pq: e.target.value, pd: pdOpen }),
      toggleSame: () => { const ns = !same; this.setState({ same: ns, pd: ns ? null : 'del', pq: '', f: ns ? { ...st.f, godownId: this.defGodown(), deliveryPartyId: '' } : st.f }); },
      newPartyHref: 'AccountMaster' + sfx + '.dc.html', ph,
      fitStyle: 'height: 100vh',
      moreF: st.moreF, moreFLabel: st.moreF ? 'Fewer fields' : '+ 8 more fields', toggleF: () => this.setState({ moreF: !st.moreF }),
      theme, more: st.more, hist: st.hist && hasP, againstSO: so,
      bd: so ? '' : 'on', bs: so ? 'on' : '',
      setDirect: () => this.setState({ base: 'direct', f: { ...st.f, refName: '' } }), setSO: () => this.setSO(),
      colsLabel: st.more ? 'Fewer columns' : 'More columns', toggleCols: () => this.setState({ more: !st.more }), toggleHist: () => this.setState({ hist: !st.hist }),
      regHref: 'PurchaseOrderList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class PurchaseOrderEntryView extends Component {
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
              Import order
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.toggleHist} aria-pressed={v.hist}>
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
                            Payable
                          </span>
                          <b>
                            {v.bp?.fig}
                          </b>
                        </span>
                        <span className="kp">
                          <span>
                            Terms
                          </span>
                          <b>
                            {v.bp?.sub}
                          </b>
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
                  <div className="seg" role="group" aria-label="Order base">
                    <button type="button" className={v.bd} onClick={v.setDirect}>
                      Direct
                    </button>
                    <button type="button" className={v.bs} onClick={v.setSO}>
                      Against sales order
                    </button>
                  </div>
                </div>
                {v.againstSO ? (
                  <>
                    <div className="banner" style={{"borderColor":"rgba(59,130,246,.35)","background":"rgba(59,130,246,.07)"}}>
                      <span className="tag t-blue">
                        Linked
                      </span>
                      <span style={{"flex":"1"}}>
                        {"Buying for "}
                        {(v.lnk?.rows || []).map((k, $index) => (
                          <Fragment key={$index}>
                            <span>
                              <b style={{"fontWeight":"600"}}>
                                {k?.no}
                              </b>
                              {" ("}{k?.d}){k?.sep}
                            </span>
                          </Fragment>
                        ))}
                      </span>
                      <button className="btn sm" type="button" onClick={v.lnk?.change}>
                        Change orders
                      </button>
                    </div>
                  </>
                ) : null}
                <div className="props">
                  <div className="pg">
                    <div className="pgt">
                      Order
                    </div>
                    <div className="pr">
                      <label htmlFor="p4">
                        Cost center
                      </label>
                      <select id="p4" className="pv" value={v.f?.costCenterId} onChange={v.set?.costCenterId}>
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
                      <label htmlFor="p1">
                        Book
                      </label>
                      <select id="p1" className="pv" value={v.f?.bookId} onChange={v.set?.bookId}>
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
                      <label htmlFor="p2">
                        Order no.
                      </label>
                      <input id="p2" className="pv" type="text" value={v.recNo} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="p3">
                        Order date
                      </label>
                      <input id="p3" className="pv" type="text" value={v.f?.date} onChange={v.set?.date} placeholder="dd-mm-yyyy" />
                    </div>
                    <div className="pr">
                      <label htmlFor="p9">
                        Broker
                      </label>
                      <select id="p9" className="pv" value={v.f?.brokerId} onChange={v.set?.brokerId}>
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
                      <label htmlFor="p10">
                        Brokerage
                      </label>
                      <div className="unit">
                        <input id="p10" className="pv" type="text" value={v.f?.brokerageRate} onChange={v.set?.brokerageRate} />
                        <span>
                          ₹ / kg
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p11">
                        Order mode
                      </label>
                      <select id="p11" className="pv" value={v.f?.orderMode} onChange={v.set?.orderMode}>
                        <option>
                          Phone
                        </option>
                        <option>
                          Email
                        </option>
                        <option>
                          Mill portal
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      Mill
                    </div>
                    <div className="pr">
                      <label htmlFor="p5">
                        Mill / party
                        <i>
                          *
                        </i>
                      </label>
                      <button id="p5" className="pv pkb" type="button" onClick={v.openBill} aria-haspopup="dialog">
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
                      <label htmlFor="p6">
                        Party group
                      </label>
                      <input id="p6" className="pv" type="text" value={v.bp?.grp} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="p18">
                        Mill ref. no.
                      </label>
                      <input id="p18" className="pv" type="text" placeholder="e.g. GSM/2026/4410" value={v.f?.refNo} onChange={v.set?.refNo} />
                    </div>
                    <div className="pr">
                      <label htmlFor="p8">
                        Delivery to
                      </label>
                      <div className="dl">
                        {v.same ? (
                          <>
                            <label className="samechk">
                              <input id="p8" type="checkbox" checked={v.same} onChange={v.toggleSame} />
                              {" "}{v.defGd}
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
                            <label className="samechk" title="Deliver to our default godown">
                              <input type="checkbox" checked={v.same} onChange={v.toggleSame} aria-label="Deliver to our default godown" />
                            </label>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p13">
                        Credit days
                      </label>
                      <div className="unit">
                        <input id="p13" className="pv" type="text" value={v.f?.creditDays} onChange={v.set?.creditDays} />
                        <span>
                          days
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p14">
                        Due date
                      </label>
                      <input id="p14" className="pv" type="text" value={v.dueDate} readOnly />
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      {"Delivery & reference"}
                    </div>
                    <div className="pr">
                      <label htmlFor="p7">
                        Supplier / agent
                      </label>
                      <select id="p7" className="pv" value={v.f?.agentId} onChange={v.set?.agentId}>
                        <option value="">
                          Direct
                        </option>
                        {(v.opt?.agents || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p19">
                        Buyer
                      </label>
                      <select id="p19" className="pv" value={v.f?.salesPersonId} onChange={v.set?.salesPersonId}>
                        <option value="">
                          Select buyer
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
                      <label htmlFor="p16">
                        Exp. delivery
                      </label>
                      <input id="p16" className="pv" type="text" value={v.f?.expDeliveryDate} onChange={v.set?.expDeliveryDate} placeholder="dd-mm-yyyy" />
                    </div>
                    <div className="pr">
                      <label htmlFor="p17">
                        Process type
                      </label>
                      <select id="p17" className="pv" value={v.f?.processType} onChange={v.set?.processType}>
                        <option>
                          Direct
                        </option>
                        <option>
                          Twisting
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p15">
                        Delivery in
                      </label>
                      <div className="unit">
                        <input id="p15" className="pv" type="text" value={v.deliveryIn} onChange={v.setDeliveryIn} />
                        <span>
                          days
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p12">
                        Priority
                      </label>
                      <select id="p12" className="pv" value={v.f?.priority} onChange={v.set?.priority}>
                        <option value="URGENT">
                          A · Urgent
                        </option>
                        <option value="NORMAL">
                          B · Normal
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
                <datalist id="poe-items">
                  {(v.opt?.items || []).map((o, $index) => (
                    <Fragment key={$index}>
                      <option value={o?.l}>
                        {o?.d}
                      </option>
                    </Fragment>
                  ))}
                </datalist>
                <datalist id="poe-brands">
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
                          Grade
                        </th>
                        <th className="r">
                          Pcs
                        </th>
                        <th className="r">
                          Qty kg
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th className="r">
                          Freight %
                        </th>
                        <th className="r">
                          CGST
                        </th>
                        <th className="r">
                          SGST
                        </th>
                        {v.more ? (
                          <>
                            <th>
                              Remark 1
                            </th>
                            <th>
                              HSN
                            </th>
                            <th className="r">
                              Avg rate + GST
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
                          Our stock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(v.lines || []).map((l, $index) => (
                        <Fragment key={$index}>
                          <tr>
                            <td className="muted">
                              {l?.n}
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Item" placeholder="Search item" list="poe-items" value={l?.itemName} onChange={l?.on?.itemName} style={{"width":"150px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Brand" list="poe-brands" value={l?.brand} onChange={l?.on?.brand} style={{"width":"90px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Lot" value={l?.lotNo} onChange={l?.on?.lotNo} style={{"width":"90px"}} />
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
                              <input className="cin r" type="text" aria-label="Freight percent" value={l?.freightPct} onChange={l?.on?.freightPct} style={{"width":"52px"}} />
                            </td>
                            <td className="r">
                              {l?.t1}
                            </td>
                            <td className="r">
                              {l?.t2}
                            </td>
                            {v.more ? (
                              <>
                                <td>
                                  <input className="cin" type="text" aria-label="Remark" value={l?.remark1} onChange={l?.on?.remark1} style={{"width":"80px"}} />
                                </td>
                                <td className="t2">
                                  {l?.hsn}
                                </td>
                                <td className="r">
                                  {l?.avg}
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
                        <td className="r">
                          {v.tt?.pcs}
                        </td>
                        <td className="r">
                          {v.tt?.qty}
                        </td>
                        <td />
                        <td />
                        <td className="r">
                          {v.tt?.t1}
                        </td>
                        <td className="r">
                          {v.tt?.t2}
                        </td>
                        {v.more ? (
                          <>
                            <td />
                            <td />
                            <td />
                            <td className="r">
                              {v.tt?.pq}
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
                      Tax summary
                    </h3>
                    {(v.tx?.rows || []).map((x, $index) => (
                      <Fragment key={$index}>
                        <div className="kv">
                          <span>
                            {x?.l}
                          </span>
                          <span>
                            {x?.v}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                    <div className="kv">
                      <span>
                        Discount structure
                      </span>
                      <span>
                        {v.tx?.disc}
                      </span>
                    </div>
                  </div>
                  <div className="box">
                    <h3>
                      {"Transport & notes"}
                    </h3>
                    <div className="fld">
                      <label htmlFor="q1">
                        Transportation
                      </label>
                      <select id="q1" className="inp" value={v.f?.transporterId} onChange={v.set?.transporterId}>
                        <option value="">
                          Mill's own transport
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
                      <label htmlFor="p20">
                        Order type
                      </label>
                      <select id="p20" className="inp" value={v.f?.orderType} onChange={v.set?.orderType}>
                        <option>
                          Yarn
                        </option>
                        <option>
                          General
                        </option>
                      </select>
                    </div>
                    <div className="fld">
                      <label htmlFor="q2">
                        Add / less
                      </label>
                      <input id="q2" className="inp" type="text" placeholder="e.g. loading charge" value={v.f?.addLess} onChange={v.set?.addLess} />
                    </div>
                    <div className="fld">
                      <label htmlFor="q3">
                        Remark
                      </label>
                      <textarea id="q3" className="inp" placeholder="Shown on the PO sent to the mill" value={v.f?.remark} onChange={v.set?.remark} />
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
                        Freight
                      </span>
                      <span>
                        {v.am?.fr}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        {v.am?.gl}
                      </span>
                      <span>
                        {v.am?.gst}
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
                    <button className="btn" type="button" onClick={v.saveSend} disabled={v.busy}>
                      {"Save & send to mill"}
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
                <aside className="rp" aria-label="Mill history">
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"0 20px","minHeight":"56px","borderBottom":"1px solid var(--bd)"}}>
                    <b style={{"fontWeight":"600","flex":"1"}}>
                      Mill history
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
                    <div className="box" style={{"marginTop":"6px"}}>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {v.ph?.trL}
                      </span>
                      <b style={{"fontWeight":"600"}}>
                        {v.ph?.tr}
                      </b>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {v.ph?.trS}
                      </span>
                    </div>
                    <div className="box">
                      <span className="muted" style={{"fontSize":"13px"}}>
                        Payable to mill
                      </span>
                      <b style={{"fontWeight":"600"}}>
                        {v.ph?.pay}
                      </b>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {v.ph?.payS}
                      </span>
                    </div>
                  </div>
                </aside>
              </>
            ) : null}
          </div>
        </div>
        <div className="aiw">
          <Assistant page="poe" />
        </div>
      </div>
      </>
    );
  }
}

export default function PurchaseOrderEntry(props) {
  const theme = useTheme();
  return <PurchaseOrderEntryView {...props} theme={theme} />;
}
