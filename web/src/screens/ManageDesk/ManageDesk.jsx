/* eslint-disable */
// ManageDesk — converted 1:1 from the YarnFlow design (ManageDesk.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';



/* ----- screen logic (same as the design) ----- */
const TABS = [
  { k: 'orders', l: 'Orders', books: [15, 16] },
  { k: 'bills', l: 'Bills', books: [0, 1, 2, 3] },
  { k: 'os', l: 'Outstanding' },
  { k: 'stock', l: 'Stock' },
  { k: 'hist', l: 'Order History' },
  { k: 'bank', l: 'Bank-Cash', books: [24, 26] },
  { k: 'month', l: 'Monthly Report' },
  { k: 'note', l: 'Debit / Credit Note Register', books: [19, 20, 22] },
  { k: 'ostat', l: 'Order Status' }
];
const BANK_TYPES = [['BANKREC', 'Bank Receipt'], ['BANKPAY', 'Bank Payment'], ['CASHREC', 'Cash Receipt'], ['CASHPAY', 'Cash Payment']];
const ORDER_STATUS = [['PENDING', 'Pending'], ['CLOSE', 'Close'], ['CANCEL', 'Cancel']];
class Component extends DCLogic {
  constructor(p) {
    super(p);
    const t = new Date(); const d = String(t.getDate()).padStart(2, '0') + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + t.getFullYear();
    let tab = 'orders'; try { tab = localStorage.getItem('yf-desk-tab') || 'orders'; } catch (e) {}
    this.state = { tab, f: { company: '', cc: '', from: d, to: d, fmt: '', type: '' }, formats: {}, data: null, note: '', err: false, busy: false };
  }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  iso(d) { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; }
  componentDidMount() {
    this.init();
    this._key = (e) => { if (e.key === 'F5') { e.preventDefault(); this.load(); } };
    try { window.addEventListener('keydown', this._key); } catch (e) {}
  }
  componentWillUnmount() { try { window.removeEventListener('keydown', this._key); } catch (e) {} }
  tabDef() { return TABS.find((t) => t.k === this.state.tab) || TABS[0]; }
  async init() {
    const api = this.api(); if (!api) return;
    try {
      const [fl, ccs, list] = await Promise.all([api.get('/outstanding-print/filters'), api.get('/lookups').then((l) => l.costCenters || []).catch(() => []), api.get('/saved-queries', { type: 'TDASHBOARD' })]);
      const formats = {}; for (const t of TABS) if (t.books) formats[t.k] = list.filter((x) => t.books.includes(x.bookList));
      this.setState({ fl, ccs: Array.isArray(ccs) ? ccs : (ccs.rows || []), formats, ready: true }, () => this.pickTab(this.state.tab));
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  pickTab(k) {
    try { localStorage.setItem('yf-desk-tab', k); } catch (e) {}
    const list = this.state.formats[k] || [];
    const type = k === 'bank' ? 'BANKREC' : k === 'orders' ? 'PENDING' : '';
    this.setState({ tab: k, data: null, f: { ...this.state.f, fmt: list.length ? String(list[0].regId) : '', type } }, () => this.load());
  }
  fmtFor() {
    const st = this.state; const list = st.formats[st.tab] || [];
    if (st.tab === 'bank') { const pay = /PAY$/.test(st.f.type); const want = list.find((x) => String(x.regId) === st.f.fmt); if (want && (want.bookList === 26) === pay) return want; return list.find((x) => (x.bookList === 26) === pay) || want; }
    return list.find((x) => String(x.regId) === st.f.fmt) || list[0];
  }
  async load() {
    const api = this.api(); if (!api || !this.state.ready) return;
    const fmt = this.fmtFor(); if (!fmt) { this.setState({ data: null }); return; }
    const f = this.state.f;
    this.setState({ busy: true, note: 'Loading…', err: false });
    try {
      const data = await api.get('/saved-queries/' + fmt.regId + '/data', { from: this.iso(f.from) || undefined, to: this.iso(f.to) || undefined, companies: f.company || undefined, costCenters: f.cc || undefined, type: this.state.tab === 'bank' ? f.type : undefined, status: this.state.tab === 'orders' ? f.type : undefined });
      this.setState({ data, busy: false, note: '' });
    } catch (e) { this.setState({ data: null, busy: false, note: api.message(e), err: true }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const f = st.f; const td = this.tabDef();
    const set = {}; ['company', 'cc', 'from', 'to', 'fmt', 'type'].forEach((k) => { set[k] = (e) => { const v = e.target.value; this.setState({ f: { ...this.state.f, [k]: v } }, () => { if (k !== 'from' && k !== 'to') this.load(); }); }; });
    const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T|$)/.test(v);
    const dmy = (v) => v.slice(0, 10).split('-').reverse().join('/');
    const num = (v, d) => (Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const data = st.data;
    const cols = data ? data.cols.filter((c) => c.show).sort((a, b) => a.seq - b.seq) : [];
    const isNum = (c) => !!c.sum && c.sum !== 'Count' || (data && data.rows.length && typeof data.rows[0][c.field] === 'number') || (data && data.rows.length && /^-?\d+(\.\d+)?$/.test(String(data.rows[0][c.field] ?? '')) && !/(_Id|No|Code|Mobile|Phone)$/i.test(c.field));
    const fmtCell = (c, v) => { if (v == null || v === '') return ''; if (isDate(v)) return dmy(v); if (isNum(c)) return num(v, c.dec != null ? c.dec : 2); return String(v); };
    const rows = data ? data.rows.slice(0, 3000).map((r, i) => ({ n: i + 1, cells: cols.map((c) => ({ v: fmtCell(c, r[c.field]), c: isNum(c) ? 'r' : '' })) })) : [];
    const foot = cols.map((c) => {
      if (!data) return { v: '', c: '' };
      if (c.sum === 'Count') return { v: String(data.rows.length), c: 'r' };
      if (c.sum === 'Sum' || c.sum === 'OnlyIinColumn') return { v: num(data.rows.reduce((s, r) => s + (Number(r[c.field]) || 0), 0), c.dec != null ? c.dec : 2), c: 'r' };
      return { v: '', c: '' };
    });
    const formats = (st.formats[st.tab] || []).filter((x) => st.tab !== 'bank' || (x.bookList === 26) === /PAY$/.test(f.type)).map((x) => ({ v: String(x.regId), l: x.name + (x.available ? '' : ' (soon)') }));
    const excel = () => {
      try {
        if (!data) return;
        const lines = [cols.map((c) => c.cap)].concat(data.rows.map((r) => cols.map((c) => fmtCell(c, r[c.field]))));
        const csv = lines.map((l) => l.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\\r\\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\\ufeff' + csv], { type: 'text/csv' })); a.download = (data.name || 'Manage Desk') + '.csv'; a.click();
      } catch (e) {}
    };
    const hasFormats = !!td.books;
    return {
      theme, f, set,
      tabs: TABS.map((t) => ({ l: t.l, c: 'tab' + (t.k === st.tab ? ' on' : ''), go: () => this.pickTab(t.k) })),
      companies: ((st.fl || {}).companies || []).map((c) => ({ v: String(c.id), l: (c.code ? c.code + ' — ' : '') + c.name })),
      ccs: (st.ccs || []).map((c) => ({ v: String(c.id), l: c.name })),
      formats, hasFormats, noFormats: !hasFormats, tabL: td.l,
      hasType: st.tab === 'bank' || (st.tab === 'orders' && String(f.fmt) === '252'), typeL: st.tab === 'bank' ? 'Type' : 'Status',
      typeOpts: (st.tab === 'bank' ? BANK_TYPES : ORDER_STATUS).map(([v, l]) => ({ v, l })),
      cols: cols.map((c) => ({ cap: c.cap, cls: isNum(c) ? 'r' : '' })), rows, foot, span: cols.length + 1,
      empty: rows.length === 0, emptyL: st.busy ? 'Loading…' : 'No records found', count: data ? data.rows.length + ' rows' + (data.rows.length > 3000 ? ' (first 3,000 shown — Export To Excel has all)' : '') : '',
      excel, print: () => { try { window.print(); } catch (e) {} }, refresh: () => this.load(), busy: !!st.busy, note: st.note, noteCls: st.err ? 'tag t-red' : 'muted'
    };
  }
}

/* ----- view ----- */
class ManageDeskView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        
      <style>
        {"*{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:20px;-webkit-font-smoothing:antialiased} .dark{--bg:#141414;--sb:#1B1B1B;--s1:#1E1E1E;--s2:#262626;--s3:#2E2E2E;--bd:#262626;--bd2:#383838;--t1:#EDEDED;--t2:#B5B5B5;--t3:#8F8F8F;--ib:#F5F5F5;--it:#171717;--pop:#1E1E1E;color-scheme:dark} .light{--bg:#FFFFFF;--sb:#F8F8F8;--s1:#F7F7F7;--s2:#F1F1F1;--s3:#E9E9E9;--bd:#ECECEC;--bd2:#DDDDDD;--t1:#171717;--t2:#525252;--t3:#6B6B6B;--ib:#171717;--it:#FFFFFF;--pop:#FFFFFF;color-scheme:light} .app{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--t1)} a{color:inherit;text-decoration:none} button,input,select,textarea{font:inherit;color:inherit} .sbw{flex:0 0 236px;height:100%;overflow-y:auto;background:var(--sb);border-right:1px solid var(--bd)} .main{flex:1 1 auto;min-width:0;height:100%;display:flex;flex-direction:column;overflow:hidden} .main>*{flex:none} .hdr{display:flex;align-items:center;gap:8px;min-height:56px;padding:10px 20px;border-bottom:1px solid var(--bd);flex-wrap:wrap} .bc{display:flex;align-items:center;gap:8px;font-size:17px;flex:1 1 auto;min-width:0;white-space:nowrap} .bc .m{color:var(--t3)} .bc a.m{cursor:pointer;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} .btn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:8px;border:0;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;background:var(--s2);color:var(--t1)} .btn:hover{background:var(--s3)} .btn.pr{background:var(--ib);color:var(--it)} .btn.sm{height:30px;padding:0 10px;font-size:13px} .btn.gh{background:transparent}.btn.gh:hover{background:var(--s2)} .btn.no{background:rgba(239,68,68,.14);color:#F87171} .btn.ok{background:#16A34A;color:#fff} .inp{height:32px;border-radius:8px;border:1px solid transparent;background:var(--s2);padding:0 10px;font-size:14px;color:var(--t1);min-width:0} .inp::placeholder{color:var(--t3)} .muted{color:var(--t3)}.t2{color:var(--t2)} .tag{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:6px;font-size:11.5px;font-weight:500;white-space:nowrap;background:var(--s2);color:var(--t2)} .t-green{background:rgba(34,197,94,.14);color:#4ADE80}.t-orange{background:rgba(249,115,22,.15);color:#FB923C}.t-red{background:rgba(239,68,68,.15);color:#F87171}.t-blue{background:rgba(59,130,246,.16);color:#60A5FA}.t-gray{background:var(--s2);color:var(--t2)}.t-purple{background:rgba(168,85,247,.16);color:#C084FC} .light .t-green{color:#15803D}.light .t-orange{color:#C2410C}.light .t-red{color:#B91C1C}.light .t-blue{color:#1D4ED8}.light .t-purple{color:#7E22CE} .tabs{display:flex;gap:2px;padding:0 16px;border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none} .tab{display:flex;align-items:center;gap:8px;padding:9px 10px;color:var(--t3);border:0;border-bottom:2px solid transparent;background:none;cursor:pointer;white-space:nowrap} .tab:hover{color:var(--t1)} .tab.on{color:var(--t1);border-bottom-color:var(--t1)} .tab .n{font-size:12px;background:var(--s2);border-radius:6px;padding:0 6px;color:var(--t2);font-variant-numeric:tabular-nums} .dot{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}.dot::before{content:\"\";width:8px;height:8px;border-radius:50%;background:var(--c,#8F8F8F)} .fbar{display:flex;align-items:center;gap:8px;padding:8px 20px;flex-wrap:wrap} .bulk{display:flex;align-items:center;gap:8px;padding:6px 20px;background:rgba(59,130,246,.10);border-top:1px solid rgba(59,130,246,.25);border-bottom:1px solid rgba(59,130,246,.25);flex-wrap:wrap;font-size:13.5px} .okbar{display:flex;align-items:center;gap:10px;margin:0 20px 8px;padding:8px 12px;border-radius:8px;background:rgba(34,197,94,.12);color:#4ADE80;font-size:13.5px} .light .okbar{color:#15803D} .okbar button{margin-left:auto;border:0;background:transparent;color:inherit;cursor:pointer} .reg{flex:1 1 auto!important;min-height:0;overflow:auto;margin:0 20px 12px;border:1px solid var(--bd);border-radius:10px} table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0} .reg>table.cft{min-height:100%} thead th{background:var(--s1);color:var(--t3);font-weight:400;text-align:left;padding:0 9px;white-space:nowrap;border-bottom:1px solid var(--bd)} td{padding:0 9px;border-bottom:1px solid var(--bd);white-space:nowrap} .r{text-align:right;font-variant-numeric:tabular-nums} .cbx{width:15px;height:15px;margin:0;accent-color:#3B82F6;vertical-align:middle;cursor:pointer} .reg tbody tr:nth-child(even)>td{background:rgba(255,255,255,.04)} .light .reg tbody tr:nth-child(even)>td{background:#F6F7F9} .reg tbody tr:hover>td{background:var(--s2)} .reg tbody tr.sel>td{background:rgba(59,130,246,.22)!important} .light .reg tbody tr.sel>td{background:#DBEAFE!important} .reg tbody tr.sel>td:first-child{box-shadow:inset 3px 0 0 #3B82F6} .cft tbody tr:not(.fillr):not(.more){cursor:pointer;user-select:none} .cft tbody tr.fillr>td{height:auto!important;padding:0!important;border:0!important;background:transparent!important} .cft tbody tr.more>td{height:40px!important;text-align:center;color:var(--t3);font-size:13px;background:transparent!important} .cft tfoot td{position:sticky;bottom:0;z-index:4;background:var(--s2);font-weight:600;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .cft td.lnk{color:var(--t1);font-weight:500;text-decoration:underline;text-decoration-color:var(--bd2);text-underline-offset:3px} .spin{display:inline-block;width:12px;height:12px;border:2px solid var(--bd2);border-top-color:#3B82F6;border-radius:50%;animation:sp .8s linear infinite;margin-right:8px;vertical-align:-2px} @keyframes sp{to{transform:rotate(360deg)}} .aiw{flex:none;height:100vh} @media (max-width:760px){.aiw{display:none}.sbw{display:none}} /* gen17: one table size across the app */ table{font-size:13.5px;line-height:18px} thead th{font-size:13px;padding-top:7px;padding-bottom:7px;height:34px} tbody tr>td{height:36px!important;padding-top:3px;padding-bottom:3px} tbody td .sub{font-size:11.5px;line-height:14px} tfoot td{height:38px} table .tag{height:20px;font-size:11.5px;padding:0 7px} table .btn.sm{height:26px;padding:0 9px;font-size:12.5px} table .cin,table .inp{height:28px;font-size:13.5px} .ent{flex:1 1 auto!important;min-height:0;display:flex;flex-direction:column;overflow:auto} .ent>*{flex:none} .sec{padding:10px 20px;border-bottom:1px solid var(--bd);display:flex;flex-direction:column;gap:8px} .sh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sh h2{margin:0;font-size:15px;font-weight:600;white-space:nowrap} .props{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--bd);border-radius:12px;overflow:hidden} .pg{display:flex;flex-direction:column;padding:4px 0 6px;min-width:0} .pg+.pg{border-left:1px solid var(--bd)} .pgt{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);padding:5px 14px 1px} .pr{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;gap:6px;padding:0 10px 0 14px;min-height:28px} .pr:hover{background:var(--s1)} .pr label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .pv{height:26px;border:1px solid transparent;border-radius:7px;background:transparent;padding:0 8px;font-size:13.5px;color:var(--t1);width:100%;min-width:0} .pv:hover{background:var(--s2)}.pv:focus{outline:0;border-color:#3B82F6;background:var(--bg)} .pv[readonly]{color:var(--t2)}.pv[readonly]:hover{background:transparent} .pv::placeholder{color:var(--t3)} select.pv{cursor:pointer} .pr .unit{font-size:12px;color:var(--t3);white-space:nowrap} .sec.items{flex:1 1 auto!important;min-height:250px} .tw{flex:1 1 auto;min-height:0;overflow:auto;border:1px solid var(--bd);border-radius:10px} .it thead th{position:sticky;top:0;z-index:2} .it tbody td{height:36px} .it tfoot td{position:sticky;bottom:0;background:var(--s2);font-weight:600;height:38px;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .it td.n{color:var(--t3);width:34px} .it td.nm{font-weight:500} .cin{height:28px;border:1px solid var(--bd2);border-radius:6px;background:transparent;padding:0 7px;font-size:13.5px;color:var(--t1);width:100%;min-width:64px} .cin:focus{outline:0;border-color:#3B82F6} .cin::placeholder{color:var(--t3)} .cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px} .box{border:1px solid var(--bd);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:3px;min-width:0} .box h3{margin:0 0 3px;font-size:13px;font-weight:600} .kv{display:flex;justify-content:space-between;gap:12px;font-size:13px;line-height:20px;font-variant-numeric:tabular-nums} .kv span:first-child{color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0} .kv span:last-child{white-space:nowrap} .kv.big{border-top:1px dashed var(--bd2);padding-top:6px;margin-top:3px}.kv.big span:first-child{color:var(--t1);font-weight:600}.kv.big span:last-child{font-size:18px;font-weight:600} .flg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 14px} .fl{display:flex;flex-direction:column;gap:1px;min-width:0} .fl label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .fl .inp{height:28px;font-size:13px;width:100%;padding:0 8px} .fl label{font-size:11.5px} .actbar{display:flex;align-items:center;gap:6px;padding:10px 20px;border-top:1px solid var(--bd);flex-wrap:wrap} .actbar .btn{height:32px} .actbar select.inp{width:110px;height:32px} @media (max-width:1180px){.props,.cols3{grid-template-columns:repeat(2,minmax(0,1fr))}.pg:nth-child(3){grid-column:1 / -1;border-left:0;border-top:1px solid var(--bd)}} /* gen19: breadcrumb parent is a clear link back */ .bc a.m{cursor:pointer;text-decoration:none;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px;transition:background .12s,color .12s} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} /* gen27: collapsible sidebar */ .sbw{transition:flex-basis .18s ease,width .18s ease} .sbw:has(.sbc){flex:0 0 64px!important;width:64px!important;max-width:64px!important;min-width:64px!important} .t-red-x{color:#F87171} .light .t-red-x{color:#B91C1C}"}
      </style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="desk" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Dashboard
              </span>
              <span className="m">
                /
              </span>
              <span>
                Manage Desk
              </span>
            </div>
            <span className={v.noteCls} style={{"fontSize":"13px"}} role="status">
              {v.note}
            </span>
            {' '}
            <button className="btn" type="button" onClick={v.excel}>
              Export To Excel
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.print}>
              Print Preview
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.refresh} disabled={v.busy}>
              Refresh (F5)
            </button>
          </header>
          <div className="ent">
            <section className="sec">
              <div className="tabs" role="tablist" style={{"padding":"0"}}>
                {(v.tabs || []).map((t, $index) => (
                  <Fragment key={$index}>
                    <button type="button" role="tab" className={t?.c} onClick={t?.go}>
                      {t?.l}
                    </button>
                  </Fragment>
                ))}
              </div>
              <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"end"}}>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"230px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    Company
                  </label>
                  <select className="inp" aria-label="Company" value={v.f?.company} onChange={v.set?.company}>
                    <option value="">
                      All companies
                    </option>
                    {(v.companies || []).map((o, $index) => (
                      <Fragment key={$index}>
                        <option value={o?.v}>
                          {o?.l}
                        </option>
                      </Fragment>
                    ))}
                  </select>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"180px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    Cost Center
                  </label>
                  <select className="inp" aria-label="Cost center" value={v.f?.cc} onChange={v.set?.cc}>
                    <option value="">
                      All
                    </option>
                    {(v.ccs || []).map((o, $index) => (
                      <Fragment key={$index}>
                        <option value={o?.v}>
                          {o?.l}
                        </option>
                      </Fragment>
                    ))}
                  </select>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"130px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    From Date
                  </label>
                  <input className="inp" type="text" aria-label="From date" value={v.f?.from} onChange={v.set?.from} placeholder="dd-mm-yyyy" />
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"130px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    To Date
                  </label>
                  <input className="inp" type="text" aria-label="To date" value={v.f?.to} onChange={v.set?.to} placeholder="dd-mm-yyyy" />
                </div>
                {v.hasFormats ? (
                  <>
                    <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"300px"}}>
                      <label className="muted" style={{"fontSize":"12.5px"}}>
                        Report Format
                      </label>
                      <select className="inp" aria-label="Report format" value={v.f?.fmt} onChange={v.set?.fmt}>
                        {(v.formats || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.hasType ? (
                  <>
                    <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"170px"}}>
                      <label className="muted" style={{"fontSize":"12.5px"}}>
                        {v.typeL}
                      </label>
                      <select className="inp" aria-label="Type" value={v.f?.type} onChange={v.set?.type}>
                        {(v.typeOpts || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
              </div>
              {v.hasFormats ? (
                <>
                  <div className="tw" style={{"maxHeight":"calc(100vh - 270px)"}}>
                    <table className="it" style={{"whiteSpace":"nowrap"}}>
                      <thead>
                        <tr>
                          <th className="r">
                            #
                          </th>
                          {(v.cols || []).map((c, $index) => (
                            <Fragment key={$index}>
                              <th className={c?.cls}>
                                {c?.cap}
                              </th>
                            </Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(v.rows || []).map((x, $index) => (
                          <Fragment key={$index}>
                            <tr>
                              <td className="r muted">
                                {x?.n}
                              </td>
                              {(x?.cells || []).map((v, $index) => (
                                <Fragment key={$index}>
                                  <td className={v?.c}>
                                    {v?.v}
                                  </td>
                                </Fragment>
                              ))}
                            </tr>
                          </Fragment>
                        ))}
                        {v.empty ? (
                          <>
                            <tr>
                              <td colSpan={v.span} className="muted" style={{"textAlign":"center","padding":"18px"}}>
                                {v.emptyL}
                              </td>
                            </tr>
                          </>
                        ) : null}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td />
                          {(v.foot || []).map((v, $index) => (
                            <Fragment key={$index}>
                              <td className={v?.c}>
                                {v?.v}
                              </td>
                            </Fragment>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="muted" style={{"fontSize":"12.5px"}}>
                    {v.count}
                  </div>
                </>
              ) : null}
              {' '}
              {v.noFormats ? (
                <>
                  <div className="box">
                    <h3>
                      {v.tabL}
                    </h3>
                    <div className="muted" style={{"fontSize":"13px"}}>
                      This tab of the old Manage Desk is being rebuilt next.
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="dashboard" />
        </div>
      </div>
      </>
    );
  }
}

export default function ManageDesk(props) {
  const theme = useTheme();
  return <ManageDeskView {...props} theme={theme} />;
}
