/* eslint-disable */
// Masters — converted 1:1 from the YarnFlow design (Masters.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Masters.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { q: '', sm: null, fm: null }; }
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
    try { const g = (s) => api.get('/masters/' + s, { pageSize: 2000 }).then((r) => r.data);
      const [accounts, groups, items, brands, transporters, vehicles, godowns, sp, cc, books, stock, lk] = await Promise.all([g('accounts'), g('groups'), g('items'), g('brands'), g('transporters'), g('vehicles'), g('godowns'), g('sales-persons'), g('cost-centers'), g('books'), api.get('/reports/stock'), api.lookups()]);
      this.setState({ d: { accounts, groups, items, brands, transporters, vehicles, godowns, sp, cc, books, stock: stock.rows }, lk }); } catch (e) { this.setState({ toast: api.message(e) }); }
  }
  /* editable simple masters */
  MS() {
    const lk = this.state.lk || { ledgers: [], suppliers: [], transporters: [] };
    const VT = ['SALES_ORDER', 'PURCHASE_ORDER', 'DISPATCH_SCHEDULE', 'SALE_BILL', 'PURCHASE_BILL', 'SALE_RETURN', 'PURCHASE_RETURN', 'GENERAL_SALE', 'GENERAL_PURCHASE', 'RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL', 'DEBIT_NOTE', 'CREDIT_NOTE', 'STOCK_TRANSFER', 'OPENING_STOCK'];
    const lab = (s) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
    return {
      'sales-persons': { title: 'Sales & collection persons', data: 'sp', cols: ['Name', 'Mobile', 'Email', 'Active'], row: (r) => [r.name, r.mobile || '—', r.email || '—', r.isActive ? 'Yes' : 'No'],
        spec: [{ t: 'Person', f: [{ k: 'name', l: 'Name', req: 1 }, { k: 'mobile', l: 'Mobile' }, { k: 'email', l: 'Email' }, { k: 'isActive', l: 'Active', type: 'chk', ph: 'Can be chosen in entries' }] }], blank: { isActive: true },
        body: (v) => ({ name: v.name, mobile: v.mobile ? String(v.mobile).replace(/\D/g, '').slice(-10) : null, email: this.nz(v.email), isActive: !!v.isActive }) },
      vehicles: { title: 'Vehicles', data: 'vehicles', cols: ['Vehicle no.', 'Transporter', 'Driver', 'Driver mobile'], row: (r) => [r.number, ((this.state.d.transporters || []).find((t) => t.id === r.transporterId) || {}).name || '—', r.driverName || '—', r.driverMobile || '—'],
        spec: [{ t: 'Vehicle', f: [{ k: 'number', l: 'Vehicle no.', req: 1, ph: 'GJ05AB1234' }, { k: 'transporterId', l: 'Transporter', type: 'sel', opts: [['', '—']].concat(lk.transporters.map((t) => [t.id, t.name])) }, { k: 'driverName', l: 'Driver name' }, { k: 'driverMobile', l: 'Driver mobile' }] }], blank: {},
        body: (v) => ({ number: v.number, transporterId: v.transporterId ? Number(v.transporterId) : null, driverName: this.nz(v.driverName), driverMobile: v.driverMobile ? String(v.driverMobile).replace(/\D/g, '').slice(-10) : null }) },
      'cost-centers': { title: 'Cost centers', data: 'cc', cols: ['Name', 'Default'], row: (r) => [r.name, r.isDefault ? 'Yes' : ''], spec: [{ t: 'Cost center', f: [{ k: 'name', l: 'Name', req: 1 }, { k: 'isDefault', l: 'Default', type: 'chk', ph: 'Pre-select in entries' }] }], blank: {}, body: (v) => ({ name: v.name, isDefault: !!v.isDefault }) },
      godowns: { title: 'Godowns', data: 'godowns', cols: ['Godown', 'City', 'Address', 'Default'], row: (r) => [r.name, r.city || '—', r.address || '—', r.isDefault ? 'Yes' : ''],
        spec: [{ t: 'Godown', f: [{ k: 'name', l: 'Name', req: 1 }, { k: 'city', l: 'City' }, { k: 'address', l: 'Address' }, { k: 'isDefault', l: 'Default', type: 'chk', ph: 'Goods come here unless chosen' }, { k: 'isActive', l: 'Active', type: 'chk', ph: 'In use' }] }], blank: { isActive: true },
        body: (v) => ({ name: v.name, city: this.nz(v.city), address: this.nz(v.address), isDefault: !!v.isDefault, isActive: v.isActive !== false }) },
      brands: { title: 'Brands / mills', data: 'brands', cols: ['Brand', 'Mill account', 'Location'], row: (r) => [r.name, ((lk.ledgers || []).find((a) => a.id === r.millAccountId) || {}).name || '—', r.location || '—'],
        spec: [{ t: 'Brand', f: [{ k: 'name', l: 'Brand', req: 1 }, { k: 'millAccountId', l: 'Mill account', type: 'sel', opts: [['', '—']].concat(lk.suppliers.map((a) => [a.id, a.name])) }, { k: 'location', l: 'Location' }] }], blank: {},
        body: (v) => ({ name: v.name, millAccountId: v.millAccountId ? Number(v.millAccountId) : null, location: this.nz(v.location) }) },
      books: { title: 'Books & voucher series', data: 'books', cols: ['Book', 'Voucher', 'Series', 'Default'], row: (r) => [r.name, lab(r.voucherType), r.prefix + '0'.repeat(Math.max(0, (r.padding || 5) - 1)) + '1' + (r.withFySuffix ? '/26-27' : ''), r.isDefault ? 'Yes' : ''],
        spec: [{ t: 'Book', f: [{ k: 'name', l: 'Book name', req: 1 }, { k: 'voucherType', l: 'Voucher type', type: 'sel', opts: VT.map((x) => [x, lab(x)]) }, { k: 'prefix', l: 'Prefix', req: 1, ph: 'GU' }, { k: 'padding', l: 'Digits', ph: '5' }, { k: 'withFySuffix', l: 'FY suffix', type: 'chk', ph: 'Add /26-27' },
          { k: 'postingAccountId', l: 'Posting ledger', type: 'sel', opts: [['', 'Default']].concat(lk.ledgers.filter((a) => ['SALES', 'PURCHASE', 'INCOME', 'EXPENSE'].indexOf(a.kind) >= 0).map((a) => [a.id, a.name])) }, { k: 'isDefault', l: 'Default', type: 'chk', ph: 'Pre-select for this voucher' }, { k: 'isActive', l: 'Active', type: 'chk', ph: 'In use' }] }],
        blank: { voucherType: 'SALE_BILL', padding: 5, withFySuffix: true, isActive: true }, body: (v) => ({ name: v.name, voucherType: v.voucherType, prefix: v.prefix, padding: Number(v.padding) || 5, withFySuffix: !!v.withFySuffix, postingAccountId: v.postingAccountId ? Number(v.postingAccountId) : null, isDefault: !!v.isDefault, isActive: v.isActive !== false }) }
    };
  }
  /* read-only lists derived from the books */
  DER(key) {
    const d = this.state.d; const cnt = (arr, f) => { const m = new Map(); arr.forEach((x) => { const k = f(x); if (k) m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
    const A = d.accounts;
    const L = {
      partyGroups: ['Party groups', ['Head office', 'Branches / units'], cnt(A.filter((a) => a.partyGroupId), (a) => (A.find((x) => x.id === a.partyGroupId) || {}).name).map(([k, n]) => [k, n])],
      tds: ['TDS / TCS', ['Party', 'TDS', 'TCS'], A.filter((a) => a.tdsApplicable || a.tcsApplicable).map((a) => [a.name, a.tdsApplicable ? a.tdsRate + '%' : '—', a.tcsApplicable ? a.tcsRate + '%' : '—'])],
      hsn: ['HSN codes', ['HSN', 'GST %', 'Items'], cnt(d.items, (i) => i.hsn + '|' + i.gstRate).map(([k, n]) => k.split('|').concat([n]))],
      units: ['Units', ['Unit', 'Items'], cnt(d.items, (i) => i.unit)],
      itemGroups: ['Item groups', ['Type', 'Items'], cnt(d.items, (i) => i.type)],
      itemMain: ['Item main groups', ['Group', 'Items'], cnt(d.items, (i) => (i.isGeneral ? 'General / services' : 'Yarn'))],
      lots: ['Lots', ['Lot', 'Yarn', 'Kg'], d.stock.map((r) => [r.lotNo || '—', r.itemName, r.qty.toLocaleString('en-IN')])],
      grades: ['Grades', ['Grade', 'Lots'], cnt(d.stock, (r) => r.grade)],
      areas: ['Areas', ['Area', 'Parties'], cnt(A, (a) => a.area)], cities: ['Cities', ['City', 'Parties'], cnt(A, (a) => a.city)], states: ['States', ['State', 'Parties'], cnt(A, (a) => (a.state ? a.state + ' (' + (a.stateCode || '') + ')' : a.stateCode))],
      countries: ['Countries', ['Country', 'Parties'], [['India', A.length]]], blocked: ['Blocked parties', ['Party', 'Status'], A.filter((a) => a.status === 'BLOCKED' || a.status === 'ON_HOLD').map((a) => [a.name, a.status === 'BLOCKED' ? 'Blocked' : 'On hold'])],
      branches: ['Branches', ['Company', 'City'], ((this.api() && this.api().user && this.api().user.companies) || []).map((c) => [c.name, c.city || '—'])],
      partners: ['Partner ratio', ['Capital account', 'Balance'], A.filter((a) => a.kind === 'CAPITAL').map((a) => [a.name, a.balance.toLocaleString('en-IN') + ' ' + (a.balanceType === 'DR' ? 'Dr' : 'Cr')])],
      merge: ['Merge numbers', ['Lot', 'Godowns'], cnt(d.stock, (r) => r.lotNo).filter(([, n]) => n > 1)], twist: ['Twist', ['Twist'], []], designs: ['Designs / shades', ['Design'], []], narrations: ['Narrations', ['Narration'], []]
    };
    return L[key];
  }
  openSm(key, der) { this.setState({ sm: { key, der } }); }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const L = (f) => (f ? f + sfx + '.dc.html' : '#');
    const S = [
      ['Accounts', 'Parties, brokers, groups', [['Party master', '1,248', 'AccountMaster', 'Ctrl M'], ['Delivery parties', '312', 'AccountMaster'], ['Account groups', '17', 'GroupMaster'], ['Party groups', '24', ''], ['Brokers', '38', 'AccountMaster', 'Ctrl A'], ['Collection persons', '9', ''], ['TDS / TCS', '6', ''], ['Blocked parties', '14', 'AccountMaster'], ['Party opening balances', '—', 'Ledger']]],
      ['Items & yarn', 'What you buy and sell', [['Yarn items', '186', 'YarnMaster', 'Ctrl I'], ['Item groups', '12', 'YarnMaster'], ['Item main groups', '5', 'YarnMaster'], ['HSN codes', '8', ''], ['Units', '6', ''], ['Designs / shades', '64', ''], ['Godowns', '6', 'Stock']]],
      ['Inventory', 'Lot and quality tracking', [['Lots', '412', 'Stock'], ['Merge numbers', '38', ''], ['Twist', '4', ''], ['Grades', '5', ''], ['Item opening stock', '—', 'Stock']]],
      ['Logistics & location', 'Transport and addresses', [['Transporters', '22', 'TransporterMaster'], ['Vehicles', '31', ''], ['Areas', '18', ''], ['Cities', '54', ''], ['States', '36', ''], ['Countries', '3', '']]],
      ['Company setup', 'Branches, books, series', [['Branches', '2', ''], ['Cost centers', '3', ''], ['Books & voucher series', '14', ''], ['Company godowns', '6', 'Stock'], ['Partner ratio', '3', ''], ['Narrations', '27', '']]]
    ];
    const live = !!st.d; const d = st.d;
    const MAP = { 'Party groups': ['der', 'partyGroups'], 'Collection persons': ['ms', 'sales-persons'], 'TDS / TCS': ['der', 'tds'], 'HSN codes': ['der', 'hsn'], 'Units': ['der', 'units'], 'Designs / shades': ['der', 'designs'], 'Item groups': ['der', 'itemGroups'], 'Item main groups': ['der', 'itemMain'],
      'Godowns': ['ms', 'godowns'], 'Lots': ['der', 'lots'], 'Merge numbers': ['der', 'merge'], 'Twist': ['der', 'twist'], 'Grades': ['der', 'grades'], 'Vehicles': ['ms', 'vehicles'], 'Areas': ['der', 'areas'], 'Cities': ['der', 'cities'], 'States': ['der', 'states'], 'Countries': ['der', 'countries'],
      'Branches': ['der', 'branches'], 'Cost centers': ['ms', 'cost-centers'], 'Books & voucher series': ['ms', 'books'], 'Company godowns': ['ms', 'godowns'], 'Partner ratio': ['der', 'partners'], 'Narrations': ['der', 'narrations'], 'Blocked parties': ['der', 'blocked'], 'Brands / mills': ['ms', 'brands'] };
    const S2 = S.map(([t, dd, items]) => [t, dd, t === 'Items & yarn' && !items.some((i) => i[0] === 'Brands / mills') ? items.concat([['Brands / mills', '', '']]) : items]);
    const COUNT = live ? { 'Party master': d.accounts.filter((a) => a.kind === 'CUSTOMER' || a.kind === 'SUPPLIER').length, 'Delivery parties': d.accounts.filter((a) => a.kind === 'CUSTOMER').length, 'Account groups': d.groups.length, 'Brokers': d.accounts.filter((a) => a.kind === 'BROKER').length, 'Collection persons': d.sp.length,
      'Yarn items': d.items.filter((i) => !i.isGeneral).length, 'Godowns': d.godowns.length, 'Company godowns': d.godowns.length, 'Lots': d.stock.length, 'Transporters': d.transporters.length, 'Vehicles': d.vehicles.length, 'Cost centers': d.cc.length, 'Books & voucher series': d.books.length, 'Brands / mills': d.brands.length } : {};
    const q = st.q.trim().toLowerCase();
    let total = 0;
    const secs = S2.map(([t, dd, items]) => { total += items.length;
      const list = items.filter((i) => !q || i[0].toLowerCase().indexOf(q) >= 0).map((i) => { const m = MAP[i[0]]; const der = live && m && m[0] === 'der' ? this.DER(m[1]) : null;
        const c = !live ? i[1] : COUNT[i[0]] != null ? COUNT[i[0]].toLocaleString('en-IN') : der ? String(der[2].length) : i[1];
        return { n: i[0], c: c || '—', h: m && live ? '#' : L(i[2]), k: i[3] || '', on: (e) => { if (!live || !m) { if (i[0] === 'Brokers' || i[0] === 'Blocked parties') try { window.localStorage.setItem('yf-acc-type', i[0]); } catch (er) {} return; } if (e && e.preventDefault) e.preventDefault(); this.openSm(m[1], m[0] === 'der'); } }; });
      return { t, d: dd, items: list }; }).filter((s) => s.items.length > 0);
    // simple master modal
    let sm = { open: false };
    if (st.sm && live) {
      if (st.sm.der) { const x = this.DER(st.sm.key); sm = { open: true, title: x[0], sub: x[2].length + ' from your books', canAdd: false, cols: x[1], rows: x[2].map((r) => ({ cls: '', on: () => {}, cells: r.map(String) })), none: x[2].length === 0, empty: 'Nothing recorded yet', close: () => this.setState({ sm: null }), add: () => {} }; }
      else { const M = this.MS()[st.sm.key]; const data = d[M.data] || [];
        sm = { open: true, title: M.title, sub: data.length + ' records', canAdd: true, cols: M.cols, rows: data.map((r) => ({ cls: 'ck', on: () => this.fmOpen('Edit · ' + (r.name || r.number), r, r.id), cells: M.row(r).map(String) })), none: data.length === 0, empty: 'None yet — press + New', close: () => this.setState({ sm: null }), add: () => this.fmOpen('New · ' + M.title, M.blank) }; }
    }
    let fm = { open: false };
    if (st.fm && st.sm && !st.sm.der) { const M = this.MS()[st.sm.key]; fm = this.fmVals(M.spec, st.fm); fm.save = () => this.fmSave(st.sm.key, M.body(st.fm.v), () => this.load()); fm.del = () => this.fmDel(st.sm.key, () => this.load()); }
    return {
      theme, secs, total, q: st.q, empty: secs.length === 0, sm, fm,
      onQ: (e) => this.setState({ q: e.target.value }),
      newParty: L('AccountMaster'), importGo: () => { if (live) this.setState({ toast: '' }); try { const a = document.createElement('a'); a.href = L('AccountMaster'); a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} },
      lk: { acc: L('AccountMaster'), yarn: L('YarnMaster'), trn: L('TransporterMaster'), stock: L('Stock') }
    };
  }
}

/* ----- view ----- */
class MastersView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="mast" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                Masters
              </span>
              <span className="muted" style={{"fontSize":"14px"}}>
                {v.total}{" masters"}
              </span>
            </div>
            <input className="inp" type="search" placeholder="Find a master… e.g. broker, HSN, lot" aria-label="Find a master" onChange={v.onQ} style={{"width":"300px"}} />
            {' '}
            <button className="btn" type="button" onClick={v.importGo}>
              Import from Excel / Tally
            </button>
            {' '}
            <DcLink className="btn pr" href={v.newParty}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New party
            </DcLink>
          </header>
          <div className="wrap">
            <div className="recent">
              <span className="muted" style={{"fontSize":"13px"}}>
                Most used
              </span>
              {' '}
              <DcLink className="chip" href={v.lk?.acc}>
                {"Party master "}
                <span className="muted">
                  Ctrl M
                </span>
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.yarn}>
                {"Yarn items "}
                <span className="muted">
                  Ctrl I
                </span>
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.acc}>
                {"Brokers "}
                <span className="muted">
                  Ctrl A
                </span>
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.trn}>
                Transporters
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.stock}>
                Lots
              </DcLink>
            </div>
            <div className="grid">
              {(v.secs || []).map((s, $index) => (
                <Fragment key={$index}>
                  <section className="sec">
                    <div className="sh">
                      <span className="ico">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect width="7" height="7" x="3" y="3" rx="1" />
                          <rect width="7" height="7" x="14" y="3" rx="1" />
                          <rect width="7" height="7" x="14" y="14" rx="1" />
                          <rect width="7" height="7" x="3" y="14" rx="1" />
                        </svg>
                      </span>
                      <h2>
                        {s?.t}
                      </h2>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {s?.d}
                      </span>
                    </div>
                    {(s?.items || []).map((x, $index) => (
                      <Fragment key={$index}>
                        <DcLink className="row" href={x?.h} onClick={x?.on}>
                          <span className="n">
                            {x?.n}
                          </span>
                          {x?.k ? (
                            <>
                              <span className="badge">
                                {x?.k}
                              </span>
                            </>
                          ) : null}
                          <span className="c">
                            {x?.c}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </DcLink>
                      </Fragment>
                    ))}
                  </section>
                </Fragment>
              ))}
            </div>
            {v.empty ? (
              <>
                <div className="muted" style={{"padding":"40px","textAlign":"center"}}>
                  No master matches “{v.q}”.
                </div>
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
        {' '}
        {v.sm?.open ? (
          <>
            <div className="scrim fmx sml">
              <div className="modal" role="dialog" aria-label={v.sm?.title}>
                <div className="mh">
                  <h2>
                    {v.sm?.title}
                  </h2>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    {v.sm?.sub}
                  </span>
                  {v.sm?.canAdd ? (
                    <>
                      <button className="btn pr" type="button" onClick={v.sm?.add}>
                        + New
                      </button>
                    </>
                  ) : null}
                  <button className="btn gh ic" type="button" aria-label="Close" onClick={v.sm?.close}>
                    ✕
                  </button>
                </div>
                <div className="fmb" style={{"padding":"8px 20px 16px"}}>
                  <table>
                    <thead>
                      <tr>
                        {(v.sm?.cols || []).map((c, $index) => (
                          <Fragment key={$index}>
                            <th>
                              {c}
                            </th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(v.sm?.rows || []).map((r, $index) => (
                        <Fragment key={$index}>
                          <tr className={r?.cls} onClick={r?.on}>
                            {(r?.cells || []).map((v, $index) => (
                              <Fragment key={$index}>
                                <td>
                                  {v}
                                </td>
                              </Fragment>
                            ))}
                          </tr>
                        </Fragment>
                      ))}
                      {v.sm?.none ? (
                        <>
                          <tr>
                            <td className="muted" colSpan="6" style={{"textAlign":"center","padding":"24px"}}>
                              {v.sm?.empty}
                            </td>
                          </tr>
                        </>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : null}
        <div className="aiw">
          <Assistant page="mast" />
        </div>
      </div>
      </>
    );
  }
}

export default function Masters(props) {
  const theme = useTheme();
  return <MastersView {...props} theme={theme} />;
}
