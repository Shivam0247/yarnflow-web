/* eslint-disable */
// JournalForm — converted 1:1 from the YarnFlow design (JournalForm.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Share from '@/components/Share/Share';
import Sidebar from '@/components/Sidebar/Sidebar';



/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { f: this.blank(), lines: [this.blankLine()], adj: [], open: [], note: '', err: false, busy: false, saved: false }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  today() { const t = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(t.getDate()) + '-' + z(t.getMonth() + 1) + '-' + t.getFullYear(); }
  kind() { return this.props.kind || 'dn'; }
  K() {
    return {
      jv: { slug: 'journals', type: 'JOURNAL', title: 'Journal voucher', reg: 'Journal register', list: 'JournalVoucherList', entry: 'JournalVoucherEntry', side: 'jvo', party: false },
      dn: { slug: 'debit-notes', type: 'DEBIT_NOTE', title: 'Debit note', reg: 'Debit note register', list: 'DebitNoteList', entry: 'DebitNoteEntry', side: 'dn', party: true },
      cn: { slug: 'credit-notes', type: 'CREDIT_NOTE', title: 'Credit note', reg: 'Credit note register', list: 'CreditNoteList', entry: 'CreditNoteEntry', side: 'cn', party: true }
    }[this.kind()];
  }
  blank() { return { bookId: '', costCenterId: '', date: this.today(), partyId: '', secondAccountId: '', creditDays: '', billNo: '', billDate: '', partyVchNo: '', partyVchDate: '', crNoteParty: '', brokerId: '', salesPersonId: '', remark: '',
    gstPct: '', beforeTax: '', hsn: '', cgstPct: '', cgst: '', sgstPct: '', sgst: '', igstPct: '', igst: '', tcsPct: '', tcs: '', tdsAmt: '', tdsAccountId: '', provisional: '' }; }
  blankLine() { return { accountId: null, code: '', name: '', debit: '', credit: '', billNo: '', remark: '', itemId: null, itemName: '', usdRate: '', usdAmt: '' }; }
  isView() { return this.props.mode === 'view'; }

  componentDidMount() {
    this.init();
    try { const fl = window.localStorage.getItem('yf-flash'); if (fl) { window.localStorage.removeItem('yf-flash'); this.setState({ note: fl }); } } catch (e) {}
    if (!this.isView()) return;
    const key = 'yf-view-' + this.kind();
    const rd = () => { try { const raw = window.localStorage.getItem(key); if (raw && raw !== this._raw) { this._raw = raw; const r = JSON.parse(raw); this.setState({ rec: r, saved: false }); if (this.api() && r.id) this.open(r.id); } } catch (e) {} };
    this._rd = rd; rd(); this._iv = setInterval(rd, 700);
    try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }

  async init() {
    const api = this.api(); if (!api) return; const K = this.K();
    try {
      const lk = await api.lookups();
      const byName = new Map(); const byCode = new Map(); const byId = new Map();
      lk.ledgers.forEach((a) => { byId.set(a.id, a); if (!byName.has(a.name.toLowerCase())) byName.set(a.name.toLowerCase(), a); if (a.code) byCode.set(String(a.code).toLowerCase(), a); });
      const book = lk.books.find((b) => b.voucherType === K.type && b.isDefault) || lk.books.find((b) => b.voucherType === K.type);
      const cc = lk.costCenters.find((c) => c.isDefault) || lk.costCenters[0];
      this.setState({ lk, A: { byName, byCode, byId }, f: { ...this.state.f, bookId: this.state.f.bookId || (book ? String(book.id) : ''), costCenterId: this.state.f.costCenterId || (cc ? String(cc.id) : '') } });
      if (!this.isView()) { const nx = await api.get('/vouchers/' + K.slug + '/next-number', book ? { bookId: book.id } : undefined); this.setState({ nextNo: nx.number }); }
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async open(id) {
    const api = this.api();
    try { const d = await api.get('/vouchers/' + this.K().slug + '/' + id); this.fill(d); } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  fill(d) {
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    const dmy = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('-') : '');
    const x = d.extra || {};
    this.setState({ doc: d,
      f: { bookId: s(d.bookId), costCenterId: s(d.costCenterId), date: dmy(d.date), partyId: s(d.partyId), secondAccountId: s(x.secondAccountId), creditDays: d.creditDays ? s(d.creditDays) : '', billNo: s(x.billNo || d.refNo), billDate: s(x.billDate) || dmy(d.refDate),
        partyVchNo: s(x.partyVchNo), partyVchDate: s(x.partyVchDate), crNoteParty: s(x.crNoteParty), brokerId: s(d.brokerId), salesPersonId: s(d.salesPersonId), remark: s(d.narration || d.remark).trim(),
        gstPct: s(x.gstPct), beforeTax: s(x.beforeTax), hsn: s(x.hsn), cgstPct: s(x.cgstPct), cgst: s(x.cgst), sgstPct: s(x.sgstPct), sgst: s(x.sgst), igstPct: s(x.igstPct), igst: s(x.igst), tcsPct: s(x.tcsPct), tcs: s(x.tcs),
        tdsAmt: s(x.tdsAmt), tdsAccountId: s(x.tdsAccountId), provisional: s(x.provisional) },
      lines: d.lines.map((l) => { const e = l.extra || {}; return { id: l.id, accountId: l.accountId, code: '', name: l.accountName || '', debit: l.debit ? s(l.debit) : '', credit: l.credit ? s(l.credit) : '', billNo: s(l.remark2),
        remark: s(l.remark1 || e.lineRemark), itemId: l.itemId, itemName: s(l.itemName), usdRate: s(e.usdRate), usdAmt: s(e.usdAmt) }; }).concat([this.blankLine()]),
      adj: (d.allocations || []).map((a) => ({ billId: a.billId, no: a.number, dt: dmy(a.date), amount: s(a.amount), was: Number(a.amount) || 0, net: a.net })) });
    if (d.partyId) this.loadOpen(d.partyId, d.id);
  }
  async loadOpen(partyId, exclude) {
    const api = this.api(); if (!api || !partyId) return;
    try {
      const side = this.kind() === 'cn' ? 'payable' : 'receivable';
      const [a, b] = await Promise.all([api.get('/accounts/' + partyId + '/open-bills', { side, exclude }), api.get('/accounts/' + partyId + '/open-bills', { side: side === 'payable' ? 'receivable' : 'payable', exclude })]);
      this.setState({ open: a.concat(b) });
    } catch (e) {}
  }
  setF(k, v) {
    const f = { ...this.state.f, [k]: v };
    const n = (x) => Number(String(x || '').replace(/,/g, '')) || 0;
    if (k === 'gstPct' || k === 'beforeTax') {
      // like the old form: the tax slab and the amount before tax give CGST / SGST (IGST for another state)
      const inter = !!f.igstPct && n(f.igstPct) > 0; const g = n(f.gstPct), b = n(f.beforeTax);
      if (inter) Object.assign(f, { igstPct: String(g), igst: (b * g / 100).toFixed(2), cgstPct: '', cgst: '', sgstPct: '', sgst: '' });
      else Object.assign(f, { cgstPct: g ? String(g / 2) : '', cgst: g ? (b * g / 200).toFixed(2) : '', sgstPct: g ? String(g / 2) : '', sgst: g ? (b * g / 200).toFixed(2) : '' });
    }
    if (k === 'partyId' && v) this.loadOpen(Number(v), this.state.doc ? this.state.doc.id : undefined);
    this.setState({ f, note: this.state.err ? '' : this.state.note, err: false });
  }
  setLine(i, k, v) {
    const lines = this.state.lines.slice(); const l = { ...lines[i], [k]: v }; const A = this.state.A;
    if (A && (k === 'name' || k === 'code')) {
      const a = k === 'name' ? A.byName.get(String(v).trim().toLowerCase()) : A.byCode.get(String(v).trim().toLowerCase());
      l.accountId = a ? a.id : null; if (a) { l.name = a.name; l.code = a.code || ''; }
    }
    if (k === 'itemName') { const its = (this.state.lk && this.state.lk.items) || []; const it = its.find((x) => x.name.toLowerCase() === String(v).trim().toLowerCase()); l.itemId = it ? it.id : null; if (it) l.itemName = it.name; }
    if (k === 'debit' && v) l.credit = ''; if (k === 'credit' && v) l.debit = '';
    if ((k === 'usdRate' || k === 'usdAmt') && l.usdRate && l.usdAmt) { const amt = (Number(l.usdRate) || 0) * (Number(l.usdAmt) || 0); if (amt && !l.debit && !l.credit) l.debit = amt.toFixed(2); }
    lines[i] = l;
    const last = lines[lines.length - 1]; if (last.name || last.debit || last.credit) lines.push(this.blankLine());
    this.setState({ lines, note: this.state.err ? '' : this.state.note, err: false });
  }
  body() {
    const st = this.state, f = st.f, K = this.K();
    const iso = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const n = (v) => (v === '' || v === null || v === undefined ? 0 : Number(String(v).replace(/,/g, '')) || 0);
    const id = (v) => (v ? Number(v) : null);
    const fail = (m) => { this.setState({ note: m, err: true }); return null; };
    if (!iso(f.date)) return fail('Date must be dd-mm-yyyy');
    if (K.party && !f.partyId) return fail('Select the party');
    const rows = st.lines.filter((l) => l.name || l.debit || l.credit);
    const bad = rows.findIndex((l) => !l.accountId); if (bad >= 0) return fail('Line ' + (bad + 1) + ': pick the account from the list');
    if (!rows.length) return fail('Add at least one account line');
    const partyLine = rows.find((l) => String(l.accountId) === String(f.partyId));
    const amount = partyLine ? n(partyLine.debit) || n(partyLine.credit) : Math.max(rows.reduce((a, l) => a + n(l.debit), 0), rows.reduce((a, l) => a + n(l.credit), 0));
    const keep = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v ?? '').trim()]));
    return {
      format: 'journal', bookId: id(f.bookId), costCenterId: id(f.costCenterId), date: iso(f.date), partyId: id(f.partyId), brokerId: id(f.brokerId), salesPersonId: id(f.salesPersonId), creditDays: f.creditDays ? n(f.creditDays) : null,
      refNo: f.billNo || null, refDate: iso(f.billDate), narration: f.remark || null, amount,
      extra: keep({ secondAccountId: f.secondAccountId, tdsAccountId: f.tdsAccountId, gstPct: f.gstPct, beforeTax: f.beforeTax, hsn: f.hsn, cgstPct: f.cgstPct, cgst: f.cgst, sgstPct: f.sgstPct, sgst: f.sgst, igstPct: f.igstPct, igst: f.igst,
        tcsPct: f.tcsPct, tcs: f.tcs, tdsAmt: f.tdsAmt, billNo: f.billNo, billDate: f.billDate, partyVchNo: f.partyVchNo, partyVchDate: f.partyVchDate, crNoteParty: f.crNoteParty, provisional: f.provisional,
        partyDc: partyLine ? (n(partyLine.debit) ? 'Dr' : 'Cr') : '' }),
      lines: rows.map((l) => ({ accountId: l.accountId, itemId: l.itemId || null, debit: n(l.debit), credit: n(l.credit), remark1: l.remark || null, remark2: l.billNo || null,
        extra: Object.fromEntries([['usdRate', l.usdRate], ['usdAmt', l.usdAmt]].filter(([, v]) => v !== '' && v !== null && v !== undefined).map(([k, v]) => [k, String(v)])) })),
      allocations: st.adj.filter((a) => n(a.amount) > 0).map((a) => ({ billId: a.billId, amount: n(a.amount) }))
    };
  }
  async save() {
    const api = this.api(); const K = this.K();
    if (!api) { this.setState({ saved: true, note: 'Saved (design preview)', err: false }); return; }
    const body = this.body(); if (!body) return;
    this.setState({ busy: true, note: 'Saving…', err: false });
    try {
      const doc = this.state.doc ? await api.put('/vouchers/' + K.slug + '/' + this.state.doc.id, body) : await api.post('/vouchers/' + K.slug, body);
      api.invalidate();
      if (this.state.doc) { this.fill(doc); this.setState({ busy: false, saved: true, note: '✓ Updated ' + doc.number, err: false }); return; }
      try { window.localStorage.setItem('yf-view-' + this.kind(), JSON.stringify({ t: Date.now(), id: doc.id, no: doc.number })); window.localStorage.setItem('yf-flash', '✓ Saved ' + doc.number); } catch (e) {}
      this.go(K.entry.replace('Entry', 'View') + ((this.props.theme ?? 'dark') === 'light' ? 'Light' : '') + '.dc.html');
    } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  async remove() {
    const api = this.api(); const doc = this.state.doc; const K = this.K();
    if (!doc) { this.setState({ f: { ...this.blank(), bookId: this.state.f.bookId, costCenterId: this.state.f.costCenterId }, lines: [this.blankLine()], adj: [], note: 'Cleared', err: false }); return; }
    if (!api || !window.confirm('Delete ' + doc.number + '?')) return;
    this.setState({ busy: true });
    try { await api.del('/vouchers/' + K.slug + '/' + doc.id); api.invalidate(); this.go(K.list + ((this.props.theme ?? 'dark') === 'light' ? 'Light' : '') + '.dc.html'); }
    catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }

  /* in the app nothing is shown until the real lists have loaded (the design's sample content never appears) */
  renderVals() {
    const v = this.renderVals0();
    const st = this.state || {};
    v.bootCls = typeof window !== 'undefined' && window.YF_API && window.YF_API.session && !st.lk && !st.err ? 'booting' : '';
    return v;
  }
  renderVals0() {
    const st = this.state, f = st.f, K = this.K(), kind = this.kind();
    const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const live = !!this.api() && !!st.lk; const lk = st.lk || {}; const view = this.isView(); const A = st.A;
    const inr = (v, d) => { const x = Number(v) || 0; const s = Math.abs(x).toFixed(d); let [i, fr] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (x < 0 ? '-' : '') + rest + l3 + (fr ? '.' + fr : ''); };
    const n = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
    // sample record for the design canvas
    const S = !live ? { party: 'Ashok Textiles (63)', second: 'Debit note a/c (rate difference)', lines: [['P023108', 'Ashok Textiles (63)', '', '10051', 'GU26200/25-26', '', '50/24 SD CAT'], ['23231', 'CGST payable', '239.31', '', '', '', ''], ['23232', 'SGST payable', '239.31', '', '', '', '']] } : null;
    const lines = (S ? S.lines.map((r) => ({ code: r[0], name: r[1], debit: r[2], credit: r[3], billNo: r[4], remark: r[5], itemName: r[6], usdRate: '', usdAmt: '' })).concat([this.blankLine()]) : st.lines).map((l, i) => {
      const on = {}; ['code', 'name', 'debit', 'credit', 'billNo', 'remark', 'itemName', 'usdRate', 'usdAmt'].forEach((k) => { on[k] = (e) => this.setLine(i, k, e.target.value); });
      const code = l.code || (A && l.accountId && A.byId.get(l.accountId) ? A.byId.get(l.accountId).code || '' : '');
      return { ...l, code, n: String(i + 1), on };
    });
    const dr = lines.reduce((a, l) => a + n(l.debit), 0), cr = lines.reduce((a, l) => a + n(l.credit), 0);
    const nLines = lines.filter((l) => l.name || l.debit || l.credit).length;
    const second = f.secondAccountId && A && A.byId.get(Number(f.secondAccountId));
    const sel = (l, k, opts, none) => ({ l, v: f[k], isSel: true, isIn: false, isRo: false, opts: (none ? [{ v: '', l: none }] : []).concat(opts), on: (e) => this.setF(k, e.target.value), u: '' });
    const inp = (l, k, ph, u, dl) => ({ l, v: f[k], isSel: false, isIn: true, isRo: false, ph: ph || (/date|dt\b/i.test(l) ? 'dd-mm-yyyy' : ''), u: u || '', dl: dl || '', opts: [], on: (e) => this.setF(k, e.target.value) });
    const ro = (l, v, u) => ({ l, v, isSel: false, isIn: false, isRo: true, u: u || '', opts: [], on: () => {} });
    const O = (arr, lab) => (arr || []).map((x) => ({ v: String(x.id), l: lab ? lab(x) : x.name }));
    const books = live ? O(lk.books.filter((b) => b.voucherType === K.type)) : [{ v: '', l: K.title.toUpperCase() }];
    const accPick = (l, k) => {
      if (!live) return ro(l, k === 'secondAccountId' ? S.second : '');
      const a = f[k] && A ? A.byId.get(Number(f[k])) : null;
      return { l, v: a ? a.name : f['_' + k] || '', isSel: false, isIn: true, isRo: false, ph: 'Search account', u: '', dl: 'jf-acc', opts: [],
        on: (e) => { const v = e.target.value; const m = A.byName.get(String(v).trim().toLowerCase()); this.setState({ f: { ...this.state.f, [k]: m ? String(m.id) : '', ['_' + k]: v } }); } };
    };
    const D = st.doc || {};
    const groups = [
      { t: 'Voucher', rows: [sel('Book name', 'bookId', books), live ? sel('Cost center', 'costCenterId', O(lk.costCenters), '—') : ro('Cost center', 'SHIVAM (DIRECT)'), ro('Voucher no.', view ? (D.number || (st.rec || {}).no || 'DBT4212/26-27') : st.nextNo || 'Auto'),
        inp('Date', 'date'), ...(K.party ? [live ? sel('Party', 'partyId', O(lk.parties), 'Select party') : ro('Party', S.party)] : []), accPick(kind === 'jv' ? 'Second account' : 'Expense account', 'secondAccountId'), inp('Cr days', 'creditDays', '', 'days')] },
      { t: 'Bill & party', rows: [inp('Bill no.', 'billNo'), inp('Bill date', 'billDate'), inp('Party vch no.', 'partyVchNo'), inp('Party vch dt.', 'partyVchDate'), inp('Cr. nt. party name', 'crNoteParty'),
        live ? sel('Broker', 'brokerId', O(lk.brokers), 'Direct') : ro('Broker', 'AELISH'), live ? sel('Sales person', 'salesPersonId', O(lk.salesPersons), '—') : ro('Sales person', 'AELISHBHAI'), inp('Remark', 'remark')] },
      { t: 'Tax & e-invoice', rows: [inp('Tax slab (GST %)', 'gstPct', '', '%'), inp('Before tax amount', 'beforeTax', '', '₹'), inp('HSN code', 'hsn'), ro('IRN no.', D.irn ? String(D.irn).slice(0, 18) + '…' : '—'), ro('Ack no.', D.ackNo || '—'),
        ro('Ack dt.', (D.extra || {}).ackDate || '—'), sel('Provisional', 'provisional', [{ v: 'Yes', l: 'Yes — not posted to the ledger' }], 'No')] }
    ];
    const T = (a, k) => ({ a, b: f[k], on: (e) => this.setF(k, e.target.value) });
    const tax = [T('CGST %', 'cgstPct'), T('CGST ₹', 'cgst'), T('SGST / UGST %', 'sgstPct'), T('SGST / UGST ₹', 'sgst'), T('IGST %', 'igstPct'), T('IGST ₹', 'igst'), T('TCS %', 'tcsPct'), T('TCS ₹', 'tcs'), T('TDS amount ₹', 'tdsAmt'),
      { a: 'TDS account', b: f.tdsAccountId && A && A.byId.get(Number(f.tdsAccountId)) ? A.byId.get(Number(f.tdsAccountId)).name : '', on: () => {} }];
    if (!live) Object.assign(tax[0], { b: '2.5' }, {}), Object.assign(tax[1], { b: '239.31' }), Object.assign(tax[2], { b: '2.5' }), Object.assign(tax[3], { b: '239.31' });
    const adj = (live ? st.adj : [{ type: 'Sale bill', no: 'GU26200/25-26', dt: '15-10-2025', amount: '10051', net: 152250 }]).map((a, i) => {
      const o = (st.open || []).find((x) => x.id === a.billId);
      return { type: a.type || (o ? (o.type || '').replace(/_/g, ' ').toLowerCase() : 'Bill'), no: a.no, dt: a.dt, pend: o ? inr(o.pending, 2) : '—', amt: a.amount,
        on: (e) => { const v = this.state.adj.slice(); v[i] = { ...v[i], amount: e.target.value }; this.setState({ adj: v }); } };
    });
    const dmy = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('-') : '');
    const openOpts = (st.open || []).filter((b) => !st.adj.some((a) => a.billId === b.id)).slice(0, 300).map((b) => ({ v: String(b.id), l: b.number + ' · ' + dmy(b.date) + ' · pending ₹ ' + inr(b.pending, 2) }));
    const addAdj = (e) => { const b = (st.open || []).find((x) => String(x.id) === e.target.value); if (!b) return; this.setState({ adj: st.adj.concat([{ billId: b.id, no: b.number, dt: dmy(b.date), amount: String(b.pending), was: 0 }]) }); };
    const party = K.party && f.partyId ? lines.find((l) => String(l.accountId) === String(f.partyId)) : null;
    const amt = live ? (party ? n(party.debit) || n(party.credit) : Math.max(dr, cr)) : 10051;
    const adjT = (live ? st.adj : [{ amount: '10051' }]).reduce((a, x) => a + n(x.amount), 0);
    const am = [{ c: 'kv', a: 'Total debit', b: '₹ ' + inr(S ? 478.62 : dr, 2) }, { c: 'kv', a: 'Total credit', b: '₹ ' + inr(S ? 10051 : cr, 2) },
      { c: 'kv', a: second || S ? 'Posted to ' + (second ? second.name : S.second) : 'Difference', b: second || S ? '₹ ' + inr(S ? 9572.38 : Math.abs(dr - cr), 2) : '₹ ' + inr(dr - cr, 2) },
      { c: 'kv', a: 'Adjusted against bills', b: '₹ ' + inr(adjT, 2) }, { c: 'kv big', a: K.party ? K.title + ' amount' : 'Voucher amount', b: '₹ ' + inr(amt, 2) }];
    const tagL = view ? (D.status === 'CANCELLED' ? 'Cancelled' : 'Saved') : 'New';
    return {
      theme, side: K.side, listHref: K.list + sfx + '.dc.html', newHref: K.entry + sfx + '.dc.html', crumb: view ? K.reg : 'Accounts · ' + K.title, title: view ? (D.number || (st.rec || {}).no || 'DBT4212/26-27') : 'New ' + K.title.toLowerCase(),
      tagL, tagC: 'tag' + (tagL === 'Cancelled' ? ' t-red' : view ? ' t-blue' : ''), detailsT: K.title + ' details',
      accOpts: live ? lk.ledgers.map((a) => ({ l: a.name, d: a.code || '' })) : [{ l: 'Ashok Textiles (63)', d: 'P023108' }, { l: 'CGST payable', d: '23231' }],
      itemOpts: live ? (lk.items || []).map((i) => ({ l: i.name, d: i.code })) : [{ l: '50/24 SD CAT', d: 'I0474' }],
      groups, lines, tt: { n: nLines + ' lines', dr: inr(dr, 2), cr: inr(cr, 2), diff: second || S ? 'Each line is posted against ' + (second ? second.name : S.second) : Math.abs(dr - cr) < 0.005 ? 'Balanced' : 'Difference ₹ ' + inr(dr - cr, 2) },
      gridNote: second || S ? 'Lines are posted against the ' + (kind === 'jv' ? 'second' : 'expense') + ' account, as in the old software' : 'Debit and credit must be equal',
      tax, adj, noAdj: !adj.length, canAdj: !!(live && K.party && f.partyId), openOpts, addAdj, am,
      remove: () => this.remove(), save: () => this.save(), print: () => { try { const d = this.state.doc; if (d) window.open('/print/' + this.K().slug + '/' + d.id, '_blank'); else this.setState({ note: 'Save the voucher first, then print', err: true }); } catch (e) {} }, busy: !!st.busy,
      closeL: view ? 'Close' : 'Cancel', saveL: st.busy ? 'Saving…' : view ? (st.saved ? '✓ Updated' : 'Update') : 'Save',
      shareId: st.doc && st.doc.id && this.kind() !== 'jv' ? String(st.doc.id) : '',
      note: st.note || (view ? 'Editing ' + (D.number || '') : ''), noteCls: st.err ? 'tag t-red' : 'muted'
    };
  }
}

/* ----- view ----- */
class JournalFormView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        
      <style>
        {"*{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:20px;-webkit-font-smoothing:antialiased} .dark{--bg:#141414;--sb:#1B1B1B;--s1:#1E1E1E;--s2:#262626;--s3:#2E2E2E;--bd:#262626;--bd2:#383838;--t1:#EDEDED;--t2:#B5B5B5;--t3:#8F8F8F;--ib:#F5F5F5;--it:#171717;--pop:#1E1E1E;color-scheme:dark} .light{--bg:#FFFFFF;--sb:#F8F8F8;--s1:#F7F7F7;--s2:#F1F1F1;--s3:#E9E9E9;--bd:#ECECEC;--bd2:#DDDDDD;--t1:#171717;--t2:#525252;--t3:#6B6B6B;--ib:#171717;--it:#FFFFFF;--pop:#FFFFFF;color-scheme:light} .app{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--t1)} a{color:inherit;text-decoration:none} button,input,select,textarea{font:inherit;color:inherit} .sbw{flex:0 0 236px;height:100%;overflow-y:auto;background:var(--sb);border-right:1px solid var(--bd)} .main{flex:1 1 auto;min-width:0;height:100%;display:flex;flex-direction:column;overflow:hidden} .main>*{flex:none} .hdr{display:flex;align-items:center;gap:8px;min-height:56px;padding:10px 20px;border-bottom:1px solid var(--bd);flex-wrap:wrap} .bc{display:flex;align-items:center;gap:8px;font-size:17px;flex:1 1 auto;min-width:0;white-space:nowrap} .bc .m{color:var(--t3)} .bc a.m{cursor:pointer;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} .btn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:8px;border:0;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;background:var(--s2);color:var(--t1)} .btn:hover{background:var(--s3)} .btn.pr{background:var(--ib);color:var(--it)} .btn.sm{height:30px;padding:0 10px;font-size:13px} .btn.gh{background:transparent}.btn.gh:hover{background:var(--s2)} .btn.no{background:rgba(239,68,68,.14);color:#F87171} .btn.ok{background:#16A34A;color:#fff} .inp{height:32px;border-radius:8px;border:1px solid transparent;background:var(--s2);padding:0 10px;font-size:14px;color:var(--t1);min-width:0} .inp::placeholder{color:var(--t3)} .muted{color:var(--t3)}.t2{color:var(--t2)} .tag{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:6px;font-size:11.5px;font-weight:500;white-space:nowrap;background:var(--s2);color:var(--t2)} .t-green{background:rgba(34,197,94,.14);color:#4ADE80}.t-orange{background:rgba(249,115,22,.15);color:#FB923C}.t-red{background:rgba(239,68,68,.15);color:#F87171}.t-blue{background:rgba(59,130,246,.16);color:#60A5FA}.t-gray{background:var(--s2);color:var(--t2)}.t-purple{background:rgba(168,85,247,.16);color:#C084FC} .light .t-green{color:#15803D}.light .t-orange{color:#C2410C}.light .t-red{color:#B91C1C}.light .t-blue{color:#1D4ED8}.light .t-purple{color:#7E22CE} .tabs{display:flex;gap:2px;padding:0 16px;border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none} .tab{display:flex;align-items:center;gap:8px;padding:9px 10px;color:var(--t3);border:0;border-bottom:2px solid transparent;background:none;cursor:pointer;white-space:nowrap} .tab:hover{color:var(--t1)} .tab.on{color:var(--t1);border-bottom-color:var(--t1)} .tab .n{font-size:12px;background:var(--s2);border-radius:6px;padding:0 6px;color:var(--t2);font-variant-numeric:tabular-nums} .dot{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}.dot::before{content:\"\";width:8px;height:8px;border-radius:50%;background:var(--c,#8F8F8F)} .fbar{display:flex;align-items:center;gap:8px;padding:8px 20px;flex-wrap:wrap} .bulk{display:flex;align-items:center;gap:8px;padding:6px 20px;background:rgba(59,130,246,.10);border-top:1px solid rgba(59,130,246,.25);border-bottom:1px solid rgba(59,130,246,.25);flex-wrap:wrap;font-size:13.5px} .okbar{display:flex;align-items:center;gap:10px;margin:0 20px 8px;padding:8px 12px;border-radius:8px;background:rgba(34,197,94,.12);color:#4ADE80;font-size:13.5px} .light .okbar{color:#15803D} .okbar button{margin-left:auto;border:0;background:transparent;color:inherit;cursor:pointer} .reg{flex:1 1 auto!important;min-height:0;overflow:auto;margin:0 20px 12px;border:1px solid var(--bd);border-radius:10px} table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0} .reg>table.cft{min-height:100%} thead th{background:var(--s1);color:var(--t3);font-weight:400;text-align:left;padding:0 9px;white-space:nowrap;border-bottom:1px solid var(--bd)} td{padding:0 9px;border-bottom:1px solid var(--bd);white-space:nowrap} .r{text-align:right;font-variant-numeric:tabular-nums} .cbx{width:15px;height:15px;margin:0;accent-color:#3B82F6;vertical-align:middle;cursor:pointer} .reg tbody tr:nth-child(even)>td{background:rgba(255,255,255,.04)} .light .reg tbody tr:nth-child(even)>td{background:#F6F7F9} .reg tbody tr:hover>td{background:var(--s2)} .reg tbody tr.sel>td{background:rgba(59,130,246,.22)!important} .light .reg tbody tr.sel>td{background:#DBEAFE!important} .reg tbody tr.sel>td:first-child{box-shadow:inset 3px 0 0 #3B82F6} .cft tbody tr:not(.fillr):not(.more){cursor:pointer;user-select:none} .cft tbody tr.fillr>td{height:auto!important;padding:0!important;border:0!important;background:transparent!important} .cft tbody tr.more>td{height:40px!important;text-align:center;color:var(--t3);font-size:13px;background:transparent!important} .cft tfoot td{position:sticky;bottom:0;z-index:4;background:var(--s2);font-weight:600;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .cft td.lnk{color:var(--t1);font-weight:500;text-decoration:underline;text-decoration-color:var(--bd2);text-underline-offset:3px} .spin{display:inline-block;width:12px;height:12px;border:2px solid var(--bd2);border-top-color:#3B82F6;border-radius:50%;animation:sp .8s linear infinite;margin-right:8px;vertical-align:-2px} @keyframes sp{to{transform:rotate(360deg)}} .aiw{flex:none;height:100vh} @media (max-width:760px){.aiw{display:none}.sbw{display:none}} /* gen17: one table size across the app */ table{font-size:13.5px;line-height:18px} thead th{font-size:13px;padding-top:7px;padding-bottom:7px;height:34px} tbody tr>td{height:36px!important;padding-top:3px;padding-bottom:3px} tbody td .sub{font-size:11.5px;line-height:14px} tfoot td{height:38px} table .tag{height:20px;font-size:11.5px;padding:0 7px} table .btn.sm{height:26px;padding:0 9px;font-size:12.5px} table .cin,table .inp{height:28px;font-size:13.5px} .ent{flex:1 1 auto!important;min-height:0;display:flex;flex-direction:column;overflow:auto} .ent>*{flex:none} .sec{padding:10px 20px;border-bottom:1px solid var(--bd);display:flex;flex-direction:column;gap:8px} .sh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sh h2{margin:0;font-size:15px;font-weight:600;white-space:nowrap} .props{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--bd);border-radius:12px;overflow:hidden} .pg{display:flex;flex-direction:column;padding:4px 0 6px;min-width:0} .pg+.pg{border-left:1px solid var(--bd)} .pgt{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);padding:5px 14px 1px} .pr{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;gap:6px;padding:0 10px 0 14px;min-height:28px} .pr:hover{background:var(--s1)} .pr label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .pv{height:26px;border:1px solid transparent;border-radius:7px;background:transparent;padding:0 8px;font-size:13.5px;color:var(--t1);width:100%;min-width:0} .pv:hover{background:var(--s2)}.pv:focus{outline:0;border-color:#3B82F6;background:var(--bg)} .pv[readonly]{color:var(--t2)}.pv[readonly]:hover{background:transparent} .pv::placeholder{color:var(--t3)} select.pv{cursor:pointer} .pr .unit{font-size:12px;color:var(--t3);white-space:nowrap} .sec.items{flex:1 1 auto!important;min-height:250px} .tw{flex:1 1 auto;min-height:0;overflow:auto;border:1px solid var(--bd);border-radius:10px} .it thead th{position:sticky;top:0;z-index:2} .it tbody td{height:36px} .it tfoot td{position:sticky;bottom:0;background:var(--s2);font-weight:600;height:38px;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .it td.n{color:var(--t3);width:34px} .it td.nm{font-weight:500} .cin{height:28px;border:1px solid var(--bd2);border-radius:6px;background:transparent;padding:0 7px;font-size:13.5px;color:var(--t1);width:100%;min-width:64px} .cin:focus{outline:0;border-color:#3B82F6} .cin::placeholder{color:var(--t3)} .cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px} .box{border:1px solid var(--bd);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:3px;min-width:0} .box h3{margin:0 0 3px;font-size:13px;font-weight:600} .kv{display:flex;justify-content:space-between;gap:12px;font-size:13px;line-height:20px;font-variant-numeric:tabular-nums} .kv span:first-child{color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0} .kv span:last-child{white-space:nowrap} .kv.big{border-top:1px dashed var(--bd2);padding-top:6px;margin-top:3px}.kv.big span:first-child{color:var(--t1);font-weight:600}.kv.big span:last-child{font-size:18px;font-weight:600} .flg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 14px} .fl{display:flex;flex-direction:column;gap:1px;min-width:0} .fl label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .fl .inp{height:28px;font-size:13px;width:100%;padding:0 8px} .fl label{font-size:11.5px} .actbar{display:flex;align-items:center;gap:6px;padding:10px 20px;border-top:1px solid var(--bd);flex-wrap:wrap} .actbar .btn{height:32px} .actbar select.inp{width:110px;height:32px} @media (max-width:1180px){.props,.cols3{grid-template-columns:repeat(2,minmax(0,1fr))}.pg:nth-child(3){grid-column:1 / -1;border-left:0;border-top:1px solid var(--bd)}} /* gen19: breadcrumb parent is a clear link back */ .bc a.m{cursor:pointer;text-decoration:none;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px;transition:background .12s,color .12s} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} /* gen27: collapsible sidebar */ .sbw{transition:flex-basis .18s ease,width .18s ease} .sbw:has(.sbc){flex:0 0 64px!important;width:64px!important;max-width:64px!important;min-width:64px!important} .main.booting{position:relative;min-height:70vh} .main.booting::after{content:'Loading your data…';position:absolute;left:0;right:0;top:var(--boot-top,0);bottom:0;background:var(--bg);z-index:20;display:flex;justify-content:center;padding-top:84px;color:var(--t3,#8F8F8F);font-size:14px} .main.booting::before{content:'';position:absolute;top:calc(var(--boot-top,0px) + 40px);left:50%;width:30px;height:30px;margin-left:-15px;border:3px solid var(--bd2,#383838);border-top-color:#3B82F6;border-radius:50%;animation:yfspin .8s linear infinite;z-index:21} @keyframes yfspin{to{transform:rotate(360deg)}} @media (prefers-reduced-motion:reduce){.main.booting::before{animation-duration:2.4s}}"}
      </style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active={v.side} />
        </div>
        <div className={`main ${v.bootCls ?? ""}`}>
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
            <DcLink className="btn" href={v.newHref}>
              New
            </DcLink>
          </header>
          <div className="ent">
            <section className="sec">
              <div className="sh">
                <h2>
                  {v.detailsT}
                </h2>
              </div>
              <datalist id="jf-acc">
                {(v.accOpts || []).map((o, $index) => (
                  <Fragment key={$index}>
                    <option value={o?.l}>
                      {o?.d}
                    </option>
                  </Fragment>
                ))}
              </datalist>
              <datalist id="jf-items">
                {(v.itemOpts || []).map((o, $index) => (
                  <Fragment key={$index}>
                    <option value={o?.l}>
                      {o?.d}
                    </option>
                  </Fragment>
                ))}
              </datalist>
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
                                <input className="pv" type="text" value={f?.v} placeholder={f?.ph} aria-label={f?.l} list={f?.dl} onChange={f?.on} />
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
                  Accounts
                </h2>
                <span className="muted" style={{"fontSize":"12.5px"}}>
                  {v.gridNote}
                </span>
              </div>
              <div className="tw">
                <table className="it">
                  <thead>
                    <tr>
                      <th>
                        #
                      </th>
                      <th>
                        Account code
                      </th>
                      <th>
                        Account name
                      </th>
                      <th className="r">
                        Debit
                      </th>
                      <th className="r">
                        Credit
                      </th>
                      <th>
                        Bill no.
                      </th>
                      <th>
                        Remark
                      </th>
                      <th>
                        Item name
                      </th>
                      <th className="r">
                        Per USD rate
                      </th>
                      <th className="r">
                        USD amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(v.lines || []).map((l, $index) => (
                      <Fragment key={$index}>
                        <tr>
                          <td className="n">
                            {l?.n}
                          </td>
                          <td>
                            <input className="cin" type="text" aria-label="Account code" value={l?.code} onChange={l?.on?.code} style={{"width":"96px"}} />
                          </td>
                          <td>
                            <input className="cin" type="text" aria-label="Account name" list="jf-acc" placeholder="Search account" value={l?.name} onChange={l?.on?.name} style={{"width":"260px"}} />
                          </td>
                          <td>
                            <input className="cin r" type="text" aria-label="Debit" value={l?.debit} onChange={l?.on?.debit} style={{"width":"110px"}} />
                          </td>
                          <td>
                            <input className="cin r" type="text" aria-label="Credit" value={l?.credit} onChange={l?.on?.credit} style={{"width":"110px"}} />
                          </td>
                          <td>
                            <input className="cin" type="text" aria-label="Bill no" value={l?.billNo} onChange={l?.on?.billNo} style={{"width":"130px"}} />
                          </td>
                          <td>
                            <input className="cin" type="text" aria-label="Remark" value={l?.remark} onChange={l?.on?.remark} style={{"width":"150px"}} />
                          </td>
                          <td>
                            <input className="cin" type="text" aria-label="Item name" list="jf-items" value={l?.itemName} onChange={l?.on?.itemName} style={{"width":"150px"}} />
                          </td>
                          <td>
                            <input className="cin r" type="text" aria-label="Per USD rate" value={l?.usdRate} onChange={l?.on?.usdRate} style={{"width":"84px"}} />
                          </td>
                          <td>
                            <input className="cin r" type="text" aria-label="USD amount" value={l?.usdAmt} onChange={l?.on?.usdAmt} style={{"width":"96px"}} />
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td />
                      <td />
                      <td>
                        {"Total · "}{v.tt?.n}
                      </td>
                      <td className="r">
                        {v.tt?.dr}
                      </td>
                      <td className="r">
                        {v.tt?.cr}
                      </td>
                      <td colSpan="5" className="muted" style={{"fontWeight":"400"}}>
                        {v.tt?.diff}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
            <section className="sec">
              <div className="cols3">
                <div className="box">
                  <h3>
                    {"GST & TDS"}
                  </h3>
                  <div className="flg">
                    {(v.tax || []).map((k, $index) => (
                      <Fragment key={$index}>
                        <div className="fl">
                          <label>
                            {k?.a}
                          </label>
                          <input className="inp" type="text" value={k?.b} aria-label={k?.a} onChange={k?.on} />
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div className="box">
                  <h3>
                    Adjustment details
                  </h3>
                  <table className="it" style={{"fontSize":"13px"}}>
                    <thead>
                      <tr>
                        <th>
                          Ref. type
                        </th>
                        <th>
                          Bill no.
                        </th>
                        <th>
                          Date
                        </th>
                        <th className="r">
                          Pending
                        </th>
                        <th className="r">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(v.adj || []).map((a, $index) => (
                        <Fragment key={$index}>
                          <tr>
                            <td className="t2">
                              {a?.type}
                            </td>
                            <td>
                              {a?.no}
                            </td>
                            <td className="t2">
                              {a?.dt}
                            </td>
                            <td className="r">
                              {a?.pend}
                            </td>
                            <td className="r">
                              <input className="cin r" type="text" aria-label="Adjust amount" value={a?.amt} onChange={a?.on} style={{"width":"96px"}} />
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                      {v.noAdj ? (
                        <>
                          <tr>
                            <td colSpan="5" className="muted" style={{"textAlign":"center"}}>
                              Not adjusted against any bill
                            </td>
                          </tr>
                        </>
                      ) : null}
                    </tbody>
                  </table>
                  {v.canAdj ? (
                    <>
                      <select className="inp" aria-label="Add a bill" value="" onChange={v.addAdj} style={{"marginTop":"6px"}}>
                        <option value="">
                          + Adjust against a bill…
                        </option>
                        {(v.openOpts || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </>
                  ) : null}
                </div>
                <div className="box">
                  <h3>
                    Amount
                  </h3>
                  {(v.am || []).map((k, $index) => (
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
                </div>
              </div>
            </section>
          </div>
          <div className="actbar">
            <button className="btn no" type="button" onClick={v.remove} disabled={v.busy}>
              Delete
            </button>
            <div style={{"flex":"1"}} />
            <span className={v.noteCls} style={{"fontSize":"13px","maxWidth":"420px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}} role="status" title={v.note}>
              {v.note}
            </span>
            {' '}
            <DcLink className="btn gh" href={v.listHref}>
              {v.closeL}
            </DcLink>
            {' '}
            {v.shareId ? (
              <>
                <Share vid={v.shareId} />
              </>
            ) : null}
            {' '}
            <button className="btn" type="button" onClick={v.print} disabled={v.busy}>
              Print
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.save} disabled={v.busy}>
              {v.saveL}
            </button>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="led" />
        </div>
      </div>
      </>
    );
  }
}

export default function JournalForm(props) {
  const theme = useTheme();
  return <JournalFormView {...props} theme={theme} />;
}
