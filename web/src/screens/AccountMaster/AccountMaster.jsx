/* eslint-disable */
// AccountMaster — converted 1:1 from the YarnFlow design (AccountMaster.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './AccountMaster.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { type: 'All', modal: null, fq: '', fg: '', fc: '', fgr: '', sk: '', lim: 50, fm: null }; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  /* ---- generic master form (spec → sections of fields) ---- */
  fmOpen(title, vals, id) { this.setState({ fm: { title, v: { ...vals }, id: id || null, note: '', err: false, busy: false } }); }
  fmVals(spec, fm) {
    const secs = spec.map((sec) => ({ t: sec.t, f: sec.f.map((x) => { const v = fm.v[x.k]; const on = (e) => this.setState({ fm: { ...this.state.fm, v: { ...this.state.fm.v, [x.k]: x.type === 'chk' ? e.target.checked : e.target.value }, note: '', err: false } });
      return { l: x.l, req: x.req ? ' *' : '', isSel: x.type === 'sel', isIn: !x.type || x.type === 'text', isChk: x.type === 'chk', v: v === null || v === undefined ? '' : String(v), c: !!v, ph: x.ph || '', opts: (x.opts || []).map((o) => ({ v: String(o[0]), l: o[1] })), on }; }) }));
    return { open: true, title: fm.title, secs, note: fm.note, nc: fm.err ? 'tag t-red' : 'muted', busy: !!fm.busy, canDel: !!fm.id, saveL: fm.busy ? 'Saving…' : fm.id ? 'Save changes' : 'Create', close: () => this.setState({ fm: null }) };
  }
  async fmSave(slug, body, done) {
    const api = this.api(); const fm = this.state.fm; if (!api) { this.setState({ fm: null }); return; }
    this.setState({ fm: { ...fm, busy: true, note: 'Saving…', err: false } });
    try { const r = fm.id ? await api.put('/masters/' + slug + '/' + fm.id, body) : await api.post('/masters/' + slug, body); api.invalidate(); this.setState({ fm: null, toast: '✓ Saved ' + (r.name || r.code || '') }); if (done) await done(r); }
    catch (e) { this.setState({ fm: { ...this.state.fm, busy: false, note: api.message(e), err: true } }); }
  }
  async fmDel(slug, done) {
    const api = this.api(); const fm = this.state.fm; if (!api || !fm.id) return;
    if (!window.confirm('Delete this record? It cannot be undone.')) return;
    try { await api.del('/masters/' + slug + '/' + fm.id); api.invalidate(); this.setState({ fm: null, toast: '✓ Deleted' }); if (done) await done(); }
    catch (e) { this.setState({ fm: { ...this.state.fm, note: api.message(e), err: true } }); }
  }
  num(v) { const n = Number(String(v ?? '').replace(/[₹,\s]/g, '')); return isNaN(n) ? 0 : n; }
  nz(v) { return v === '' || v === undefined ? null : v; }
  componentDidMount() { this.load(); }
  async load() {
    const api = this.api(); if (!api) return;
    try { const [a, g, lk] = await Promise.all([api.get('/masters/accounts', { pageSize: 2000 }), api.get('/masters/groups'), api.lookups()]); this.setState({ rows: a.data, grps: g.data, lk });
      let ed = null; try { ed = JSON.parse(window.localStorage.getItem('yf-edit-acc') || 'null'); if (ed) window.localStorage.removeItem('yf-edit-acc'); } catch (e) {}
      if (ed && ed.id) { const r = a.data.find((x) => x.id === ed.id); if (r) this.edit(r); } } catch (e) { this.setState({ toast: api.message(e) }); }
  }
  blank() { const g = (this.state.grps || []).find((x) => /debtor/i.test(x.name)); return { kind: 'CUSTOMER', groupId: g ? g.id : '', gstType: 'REGULAR', state: 'Gujarat', stateCode: '24', creditDays: 30, creditLimit: 0, brokerageType: 'PER_KG', openingType: 'DR', openingBalance: 0, status: 'ACTIVE', interestRate: 18 }; }
  edit(r) { this.fmOpen('Edit account · ' + r.name, r, r.id); }
  spec() {
    const lk = this.state.lk || { brokers: [], transporters: [], salesPersons: [], collectionPersons: [], ledgers: [] };
    const O = (l) => [['', '—']].concat((l || []).map((x) => [x.id, x.name]));
    const KINDS = [['CUSTOMER', 'Customer'], ['SUPPLIER', 'Supplier / mill'], ['BROKER', 'Broker'], ['TRANSPORTER', 'Transporter'], ['BANK', 'Bank'], ['CASH', 'Cash'], ['EXPENSE', 'Expense'], ['INCOME', 'Income'], ['SALES', 'Sales'], ['PURCHASE', 'Purchase'], ['TAX', 'Tax / duty'], ['CAPITAL', 'Capital'], ['LOAN', 'Loan'], ['ASSET', 'Asset'], ['OTHER', 'Other']];
    const ST = [['24', 'Gujarat (24)'], ['27', 'Maharashtra (27)'], ['26', 'Dadra & Nagar Haveli and Daman & Diu (26)'], ['08', 'Rajasthan (08)'], ['33', 'Tamil Nadu (33)'], ['03', 'Punjab (03)'], ['09', 'Uttar Pradesh (09)'], ['07', 'Delhi (07)'], ['29', 'Karnataka (29)'], ['36', 'Telangana (36)'], ['19', 'West Bengal (19)'], ['23', 'Madhya Pradesh (23)'], ['06', 'Haryana (06)'], ['32', 'Kerala (32)'], ['37', 'Andhra Pradesh (37)']];
    return [
      { t: 'Account', f: [{ k: 'name', l: 'Account name', req: 1 }, { k: 'alias', l: 'Alias / short name' }, { k: 'printName', l: 'Print name' }, { k: 'code', l: 'Code' },
        { k: 'groupId', l: 'Under group', req: 1, type: 'sel', opts: [['', 'Choose group']].concat((this.state.grps || []).map((g) => [g.id, (g.parentName ? g.parentName + ' › ' : '') + g.name])) }, { k: 'kind', l: 'Account type', req: 1, type: 'sel', opts: KINDS },
        { k: 'partyGroupId', l: 'Party group (head office)', type: 'sel', opts: O(lk.ledgers.filter((x) => x.kind === 'CUSTOMER' || x.kind === 'SUPPLIER')) }, { k: 'status', l: 'Status', type: 'sel', opts: [['ACTIVE', 'Active'], ['ON_HOLD', 'On hold (orders need approval)'], ['BLOCKED', 'Blocked'], ['INACTIVE', 'Inactive']] }] },
      { t: 'GST & address', f: [{ k: 'gstType', l: 'GST type', type: 'sel', opts: [['REGULAR', 'Regular'], ['COMPOSITION', 'Composition'], ['UNREGISTERED', 'Unregistered'], ['CONSUMER', 'Consumer'], ['SEZ', 'SEZ'], ['EXPORT', 'Export']] }, { k: 'gstin', l: 'GSTIN', ph: '24AAKFS4821R1Z2' }, { k: 'pan', l: 'PAN', ph: 'Taken from GSTIN if blank' },
        { k: 'address1', l: 'Address line 1' }, { k: 'address2', l: 'Address line 2' }, { k: 'area', l: 'Area' }, { k: 'city', l: 'City' }, { k: 'stateCode', l: 'State', type: 'sel', opts: ST }, { k: 'pincode', l: 'Pincode' }] },
      { t: 'Contact', f: [{ k: 'contactPerson', l: 'Contact person' }, { k: 'mobile', l: 'Mobile (WhatsApp)', ph: '98795 33120' }, { k: 'phone', l: 'Phone' }, { k: 'email', l: 'Email' }] },
      { t: 'Credit & terms', f: [{ k: 'creditLimit', l: 'Credit limit ₹' }, { k: 'creditDays', l: 'Credit days' }, { k: 'interestRate', l: 'Interest % p.a. on overdue' }, { k: 'brokerId', l: 'Broker', type: 'sel', opts: O(lk.brokers) }, { k: 'brokerageRate', l: 'Brokerage rate' },
        { k: 'brokerageType', l: 'Brokerage on', type: 'sel', opts: [['PER_KG', '₹ per kg'], ['PERCENT', '% of value']] }, { k: 'transporterId', l: 'Default transporter', type: 'sel', opts: O(lk.transporters) }, { k: 'salesPersonId', l: 'Sales person', type: 'sel', opts: O(lk.salesPersons) },
        { k: 'collectionPersonId', l: 'Collection person', type: 'sel', opts: O(lk.collectionPersons) }] },
      { t: 'TDS / TCS', f: [{ k: 'tdsApplicable', l: 'TDS 194Q', type: 'chk', ph: 'Deduct TDS on purchases' }, { k: 'tdsRate', l: 'TDS %' }, { k: 'tcsApplicable', l: 'TCS 206C(1H)', type: 'chk', ph: 'Collect TCS on sales' }, { k: 'tcsRate', l: 'TCS %' }] },
      { t: 'Bank & opening', f: [{ k: 'bankName', l: 'Bank name' }, { k: 'bankAccountNo', l: 'Account no.' }, { k: 'ifsc', l: 'IFSC' }, { k: 'openingBalance', l: 'Opening balance ₹' }, { k: 'openingType', l: 'Dr / Cr', type: 'sel', opts: [['DR', 'Dr (they owe us)'], ['CR', 'Cr (we owe them)']] }, { k: 'notes', l: 'Notes' }] }
    ];
  }
  body(v) {
    const ST = { 24: 'Gujarat', 27: 'Maharashtra', 26: 'Dadra & Nagar Haveli and Daman & Diu', '08': 'Rajasthan', 33: 'Tamil Nadu', '03': 'Punjab', '09': 'Uttar Pradesh', '07': 'Delhi', 29: 'Karnataka', 36: 'Telangana', 19: 'West Bengal', 23: 'Madhya Pradesh', '06': 'Haryana', 32: 'Kerala', 37: 'Andhra Pradesh' };
    const b = {}; const keys = ['name', 'alias', 'printName', 'code', 'gstin', 'pan', 'address1', 'address2', 'area', 'city', 'stateCode', 'pincode', 'contactPerson', 'mobile', 'phone', 'email', 'bankName', 'bankAccountNo', 'ifsc', 'notes', 'kind', 'status', 'gstType', 'brokerageType', 'openingType'];
    keys.forEach((k) => { b[k] = this.nz(v[k] === null ? '' : String(v[k] ?? '').trim()); });
    ['groupId', 'partyGroupId', 'brokerId', 'transporterId', 'salesPersonId', 'collectionPersonId'].forEach((k) => { b[k] = v[k] ? Number(v[k]) : null; });
    ['creditLimit', 'creditDays', 'interestRate', 'brokerageRate', 'openingBalance', 'tdsRate', 'tcsRate'].forEach((k) => { b[k] = this.num(v[k]); });
    b.tdsApplicable = !!v.tdsApplicable; b.tcsApplicable = !!v.tcsApplicable; b.state = b.stateCode ? ST[b.stateCode] || null : null;
    if (b.mobile) b.mobile = b.mobile.replace(/\D/g, '').slice(-10);
    return b;
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const ST = { a: ['Active', '#22C55E'], h: ['On hold', '#F97316'], b: ['Blocked', '#EF4444'], i: ['Inactive', '#8F8F8F'] };
    const fmV = st.fm ? this.fmVals(this.spec(), st.fm) : { open: false };
    if (st.fm) { fmV.save = () => this.fmSave('accounts', this.body(st.fm.v), () => this.load()); fmV.del = () => this.fmDel('accounts', () => this.load()); }
    const base = { theme, fm: fmV, fq: st.fq, fg: st.fg, fc: st.fc, fgr: st.fgr, sk: st.sk, setFq: (e) => this.setState({ fq: e.target.value }), setFg: (e) => this.setState({ fg: e.target.value }), setFc: (e) => this.setState({ fc: e.target.value }), setFgr: (e) => this.setState({ fgr: e.target.value }), setSk: (e) => this.setState({ sk: e.target.value }) };
    if (!st.rows) {
      const mk = (i, n, g, t, c, gst, m, cl, b, s) => ({ i, n, g, t, c, gst, m, cl, b, s: ST[s][0], sc: '--c: ' + ST[s][1], edit: () => {}, led: () => {} });
      const all = [mk('K', 'Krishna Textiles', 'Sundry Debtors', 'Customers', 'Surat', '24AABCK1234F1Z5', '98250 41122', '6,00,000', '4,82,350 Dr', 'h'), mk('S', 'Shiv Shakti Fabrics', 'Sundry Debtors', 'Customers', 'Sachin GIDC', '24AAGFS7712P1Z3', '98240 11930', '8,00,000', '7,84,200 Dr', 'a'), mk('O', 'Om Sai Weaving', 'Sundry Debtors', 'Customers', 'Pandesara', '24ABHPO5521K1Z8', '99090 55412', '7,50,000', '6,12,560 Dr', 'a'), mk('L', 'Laxmi Creation', 'Sundry Debtors', 'Customers', 'Bhiwandi', '27AALFL2290M1Z1', '98200 77345', '5,00,000', '5,46,900 Dr', 'b'), mk('R', 'Reliance Industries', 'Sundry Creditors', 'Mills', 'Silvassa', '26ABCDE1234F1Z9', '—', '—', '9,75,623 Cr', 'a'), mk('C', 'Century Rayon', 'Sundry Creditors', 'Mills', 'Kalyan', '27ABCDE5678G1Z4', '—', '—', '4,46,250 Cr', 'a'), mk('S', 'Sanathan Textiles', 'Sundry Creditors', 'Mills', 'Silvassa', '26ABCDE9012H1Z7', '—', '—', '8,40,000 Cr', 'a'), mk('M', 'Mahesh Shah (Broker)', 'Brokers', 'Brokers', 'Surat', '—', '98251 66870', '—', '38,420 Cr', 'a'), mk('N', 'Navkar Roadlines', 'Transporters', 'Transporters', 'Surat', '24AAJFN3381Q1Z6', '98984 22410', '—', '12,640 Cr', 'a'), mk('H', 'HDFC Bank · Current', 'Bank Accounts', 'Banks', 'Surat', '—', '—', '—', '18,42,300 Dr', 'a'), mk('F', 'Freight Inward', 'Direct Expenses', 'Expenses', '—', '—', '—', '—', '1,86,400 Dr', 'a')];
      const types = [['All', '1,248'], ['Customers', '812'], ['Mills', '64'], ['Brokers', '38'], ['Transporters', '22'], ['Banks', '9'], ['Expenses', '303']];
      const t = st.type; const rows = t === 'All' ? all : all.filter((r) => r.t === t);
      const modal = st.modal ?? (this.props.showModal ?? false);
      return { ...base, rows, chips: types.map(([n, k]) => ({ n, k, cls: n === t ? 'chip on' : 'chip', pick: () => this.setState({ type: n }) })), count: rows.length + ' of ' + (types.find((x) => x[0] === t)[1]) + ' accounts',
        open: () => this.setState({ fm: { title: 'New account', v: { name: 'Shree Ganesh Textiles', gstin: '24AAKFS4821R1Z2', mobile: '+91 98795 33120', city: 'Surat', stateCode: '24', creditLimit: '₹ 5,00,000', creditDays: '45', kind: 'CUSTOMER', status: 'ACTIVE', tdsApplicable: false, tcsApplicable: false } } }), close: () => this.setState({ fm: null }),
        fm: modal && !st.fm ? this.fmVals(this.spec(), { title: 'New account', v: { name: 'Shree Ganesh Textiles', gstin: '24AAKFS4821R1Z2', mobile: '+91 98795 33120', city: 'Surat', stateCode: '24', creditLimit: '₹ 5,00,000', creditDays: '45', kind: 'CUSTOMER' } }) : fmV,
        groups: ['Sundry Debtors', 'Sundry Creditors'], exportCsv: () => {}, importCsv: () => {}, more: true, loadMore: () => {} };
    }
    const inr = (n) => { const v = Math.round(Number(n) || 0); const s = String(Math.abs(v)); let l3 = s.slice(-3), rest = s.slice(0, -3); if (rest) l3 = ',' + l3; return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + l3; };
    const TT = { CUSTOMER: 'Customers', SUPPLIER: 'Mills', BROKER: 'Brokers', TRANSPORTER: 'Transporters', BANK: 'Banks', CASH: 'Banks', EXPENSE: 'Expenses', PURCHASE: 'Expenses', INCOME: 'Others', SALES: 'Others' };
    const typeOf = (r) => TT[r.kind] || 'Others';
    const q = st.fq.trim().toLowerCase(), qg = st.fg.trim().toLowerCase(), qc = st.fc.trim().toLowerCase();
    let vis = st.rows.filter((r) => (st.type === 'All' || typeOf(r) === st.type) && (!q || (r.name + ' ' + (r.alias || '')).toLowerCase().indexOf(q) >= 0) && (!qg || String(r.gstin || '').toLowerCase().indexOf(qg) >= 0) && (!qc || String(r.city || '').toLowerCase().indexOf(qc) >= 0) && (!st.fgr || r.groupName === st.fgr));
    if (st.sk === 'bal') vis = vis.slice().sort((a, b) => b.balance - a.balance); if (st.sk === 'city') vis = vis.slice().sort((a, b) => String(a.city || '').localeCompare(String(b.city || '')));
    const SK = { ACTIVE: 'a', ON_HOLD: 'h', BLOCKED: 'b', INACTIVE: 'i' };
    const rows = vis.slice(0, st.lim).map((r) => { const s = ST[SK[r.status] || 'a']; return { i: r.name.replace(/^(Shree|Shri|The)\s+/i, '').charAt(0), n: r.name, g: r.groupName || '—', c: r.city || '—', gst: r.gstin || '—', m: r.mobile || '—', cl: r.creditLimit ? inr(r.creditLimit) : '—', b: inr(r.balance) + ' ' + (r.balanceType === 'DR' ? 'Dr' : 'Cr'), s: s[0], sc: '--c: ' + s[1],
      edit: () => this.edit(r), led: () => { try { window.localStorage.setItem('yf-ledger', JSON.stringify({ id: r.id })); } catch (e) {} } }; });
    const cnt = { All: st.rows.length }; st.rows.forEach((r) => { const t = typeOf(r); cnt[t] = (cnt[t] || 0) + 1; });
    const types = ['All', 'Customers', 'Mills', 'Brokers', 'Transporters', 'Banks', 'Expenses', 'Others'];
    const csv = () => [['Name', 'Group', 'Type', 'GSTIN', 'PAN', 'City', 'State code', 'Mobile', 'Credit limit', 'Credit days', 'Balance', 'Dr/Cr', 'Status']].concat(vis.map((r) => [r.name, r.groupName, r.kind, r.gstin, r.pan, r.city, r.stateCode, r.mobile, r.creditLimit, r.creditDays, r.balance, r.balanceType, r.status])).map((a) => a.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    return { ...base, rows, chips: types.map((n) => ({ n, k: inr(cnt[n] || 0), cls: n === st.type ? 'chip on' : 'chip', pick: () => this.setState({ type: n }) })),
      count: rows.length + ' of ' + inr(vis.length) + ' accounts' + (st.toast ? ' · ' + st.toast : ''), groups: [...new Set(st.rows.map((r) => r.groupName).filter(Boolean))].sort(),
      open: () => this.fmOpen('New account', this.blank()), close: () => this.setState({ fm: null }), more: vis.length > st.lim, loadMore: () => this.setState({ lim: st.lim + 50 }),
      exportCsv: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'Accounts.csv'; a.click(); } catch (e) {} },
      importCsv: () => this.importCsv() };
  }
  importCsv() {
    const api = this.api(); if (!api) return;
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,text/csv';
    inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f) return; const text = await f.text(); const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const parse = (l) => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
      const head = parse(lines[0]).map((h) => h.toLowerCase()); const ix = (n) => head.findIndex((h) => h.indexOf(n) >= 0);
      const g = (this.state.grps || []); let ok = 0; const errs = [];
      for (const l of lines.slice(1)) { const c = parse(l); const name = c[ix('name')]; if (!name) continue; const grpName = ix('group') >= 0 ? c[ix('group')] : ''; const grp = g.find((x) => x.name.toLowerCase() === String(grpName).toLowerCase()) || g.find((x) => /debtor/i.test(x.name));
        const body = this.body({ ...this.blank(), name, groupId: grp ? grp.id : '', kind: ix('type') >= 0 && c[ix('type')] ? c[ix('type')].toUpperCase() : /creditor/i.test(grp ? grp.name : '') ? 'SUPPLIER' : 'CUSTOMER', gstin: ix('gstin') >= 0 ? c[ix('gstin')] : '', city: ix('city') >= 0 ? c[ix('city')] : '', mobile: ix('mobile') >= 0 ? c[ix('mobile')] : '', creditLimit: ix('limit') >= 0 ? c[ix('limit')] : 0, creditDays: ix('days') >= 0 ? c[ix('days')] : 30 });
        try { await api.post('/masters/accounts', body); ok += 1; } catch (e) { errs.push(name + ': ' + api.message(e)); } }
      api.invalidate(); this.setState({ toast: ok + ' imported' + (errs.length ? ' · ' + errs.length + ' skipped (' + errs.slice(0, 2).join('; ') + ')' : '') }); this.load(); };
    inp.click();
  }
}

/* ----- view ----- */
class AccountMasterView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="acc" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Accounts
              </span>
              <span className="m">
                /
              </span>
              <button className="btn gh" type="button" onClick={v.exportCsv} style={{"fontSize":"17px","fontWeight":"400","padding":"0 8px","height":"32px"}}>
                List
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            <button className="btn" type="button" onClick={v.importCsv}>
              Import from Excel / Tally
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.open}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create
            </button>
          </header>
          <div className="chips" role="group" aria-label="Account type">
            {(v.chips || []).map((c, $index) => (
              <Fragment key={$index}>
                <button className={c?.cls} type="button" onClick={c?.pick}>
                  {c?.n}{" "}
                  <span>
                    {c?.k}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" placeholder="Account name" aria-label="Account name" value={v.fq} onChange={v.setFq} />
            {' '}
            <input className="inp" type="text" placeholder="GSTIN" aria-label="GSTIN" value={v.fg} onChange={v.setFg} />
            {' '}
            <input className="inp" type="text" placeholder="City" aria-label="City" value={v.fc} onChange={v.setFc} />
            {' '}
            <select className="inp" aria-label="Group" value={v.fgr} onChange={v.setFgr}>
              <option value="">
                Group
              </option>
              {(v.groups || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option>
                    {o}
                  </option>
                </Fragment>
              ))}
            </select>
            <div style={{"flex":"1"}} />
            <select className="inp" aria-label="Sort" value={v.sk} onChange={v.setSk}>
              <option value="">
                Sort: name
              </option>
              <option value="bal">
                Sort: balance
              </option>
              <option value="city">
                Sort: city
              </option>
            </select>
            <button className="btn" type="button" onClick={v.exportCsv}>
              Excel
            </button>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th style={{"width":"36px"}}>
                    <input className="cb" type="checkbox" aria-label="Select all" />
                  </th>
                  <th>
                    Account
                  </th>
                  <th>
                    Group
                  </th>
                  <th>
                    City
                  </th>
                  <th>
                    GSTIN
                  </th>
                  <th>
                    Mobile
                  </th>
                  <th className="r">
                    Credit limit
                  </th>
                  <th className="r">
                    Balance
                  </th>
                  <th>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr onDoubleClick={x?.edit}>
                      <td>
                        <input className="cb" type="checkbox" aria-label="Select account" />
                      </td>
                      <td>
                        <DcLink className="cell" href="Ledger.dc.html" onClick={x?.led}>
                          <span className="lg">
                            {x?.i}
                          </span>
                          {x?.n}
                        </DcLink>
                      </td>
                      <td className="t2">
                        {x?.g}
                      </td>
                      <td className="t2">
                        {x?.c}
                      </td>
                      <td className="t2" style={{"fontVariantNumeric":"tabular-nums"}}>
                        {x?.gst}
                      </td>
                      <td className="t2">
                        {x?.m}
                      </td>
                      <td className="r">
                        {x?.cl}
                      </td>
                      <td className="r">
                        {x?.b}
                      </td>
                      <td>
                        <span className="dot" style={sx(x?.sc)}>
                          {x?.s}
                        </span>
                        {' '}
                        <button className="btn sm gh" type="button" onClick={x?.edit}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="foot">
            <span className="muted">
              {v.count}
            </span>
            <div style={{"flex":"1"}} />
            {v.more ? (
              <>
                <button className="btn" type="button" onClick={v.loadMore}>
                  Load More
                </button>
              </>
            ) : null}
          </div>
        </div>
        {v.fm?.open ? (
          <>
            <div className="scrim fmx">
              <div className="modal" role="dialog" aria-label={v.fm?.title}>
                <div className="mh">
                  <h2>
                    {v.fm?.title}
                  </h2>
                  <button className="btn gh ic" type="button" aria-label="Close" onClick={v.fm?.close}>
                    ✕
                  </button>
                </div>
                <div className="fmb">
                  {(v.fm?.secs || []).map((sec, $index) => (
                    <Fragment key={$index}>
                      <div className="sub">
                        {sec?.t}
                      </div>
                      <div className="fgrid">
                        {(sec?.f || []).map((f, $index) => (
                          <Fragment key={$index}>
                            <div className="fld">
                              <label>
                                {f?.l}
                                <span style={{"color":"#EF4444"}}>
                                  {f?.req}
                                </span>
                              </label>
                              {' '}
                              {f?.isSel ? (
                                <>
                                  <select className="inp" aria-label={f?.l} value={f?.v} onChange={f?.on}>
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
                              {' '}
                              {f?.isIn ? (
                                <>
                                  <input className="inp" type="text" aria-label={f?.l} value={f?.v} placeholder={f?.ph} onChange={f?.on} />
                                </>
                              ) : null}
                              {' '}
                              {f?.isChk ? (
                                <>
                                  <span style={{"display":"flex","alignItems":"center","gap":"10px","minHeight":"34px"}}>
                                    <input className="sw" type="checkbox" aria-label={f?.l} checked={f?.c} onChange={f?.on} />
                                    <span className="t2">
                                      {f?.ph}
                                    </span>
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="mf">
                  <span className={v.fm?.nc} style={{"flex":"1","alignSelf":"center","fontSize":"13px"}}>
                    {v.fm?.note}
                  </span>
                  {v.fm?.canDel ? (
                    <>
                      <button className="btn" type="button" style={{"color":"#F87171"}} onClick={v.fm?.del}>
                        Delete
                      </button>
                    </>
                  ) : null}
                  <button className="btn" type="button" onClick={v.fm?.close}>
                    Cancel
                  </button>
                  <button className="btn pr" type="button" onClick={v.fm?.save} disabled={v.fm?.busy}>
                    {v.fm?.saveL}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
        <div className="aiw">
          <Assistant page="acc" />
        </div>
      </div>
      </>
    );
  }
}

export default function AccountMaster(props) {
  const theme = useTheme();
  return <AccountMasterView {...props} theme={theme} />;
}
