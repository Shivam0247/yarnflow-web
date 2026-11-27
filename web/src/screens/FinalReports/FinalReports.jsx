/* eslint-disable */
// FinalReports — converted 1:1 from the YarnFlow design (FinalReports.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';



/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { f: { company: '', cc: '', type: 'Sold Unsold', q: '' }, data: null, note: '', err: false, busy: false }; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  componentDidMount() {
    this.init();
    this._key = (e) => { if (e.key === 'F5') { e.preventDefault(); this.load(); } };
    try { window.addEventListener('keydown', this._key); } catch (e) {}
  }
  componentWillUnmount() { try { window.removeEventListener('keydown', this._key); } catch (e) {} }
  async init() {
    const api = this.api(); if (!api) return;
    try { const [lk, fl] = await Promise.all([api.lookups(), api.get('/outstanding-print/filters')]); this.setState({ lk, fl }, () => this.load()); }
    catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async load() {
    const api = this.api(); if (!api) return; const f = this.state.f;
    if (f.type !== 'Sold Unsold') return;
    this.setState({ busy: true, note: 'Loading…', err: false });
    try { const data = await api.get('/reports/sold-unsold', { companies: f.company || undefined, costCenters: f.cc || undefined }); this.setState({ data, busy: false, note: '' }); }
    catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const f = st.f; const live = !!this.api() && !!st.lk;
    const fmt = (n) => { const v = Number(n) || 0; return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    const set = {}; ['company', 'cc', 'type', 'q'].forEach((k) => { set[k] = (e) => { const v = e.target.value; this.setState({ f: { ...this.state.f, [k]: v } }, () => { if (k !== 'q') this.load(); }); }; });
    const src = live && st.data ? st.data.rows : [
      { code: 'I0261', name: '47/36 BRIGHT', stock: 257900.87, saleOrderPending: 230000, soldUnsold: 27900.87, purchasePending: 12000, unsoldAfterPurchase: 39900.87 },
      { code: 'I0263', name: '47/36 SEMI DULL', stock: 171679.05, saleOrderPending: 188938.38, soldUnsold: -17259.33, purchasePending: 0, unsoldAfterPurchase: -17259.33 }];
    const q = String(f.q || '').toLowerCase();
    const list = src.filter((r) => !q || String(r.name).toLowerCase().includes(q) || String(r.code || '').toLowerCase().includes(q));
    const neg = (v) => 'r' + (v < 0 ? ' t-red-x' : '');
    const rows = list.map((r, i) => ({ n: String(i + 1), code: r.code || '', name: r.name, stock: fmt(r.stock), so: fmt(r.saleOrderPending), su: fmt(r.soldUnsold), suC: neg(r.soldUnsold), po: fmt(r.purchasePending), ua: fmt(r.unsoldAfterPurchase), uaC: neg(r.unsoldAfterPurchase) }));
    const sum = (k) => list.reduce((a, r) => a + Math.round((Number(r[k]) || 0) * 100), 0) / 100;
    const TYPES = ['Monthly Profit & Loss Report Without Gst', 'Monthly Profit & Loss Report With Gst', 'Yearly Profit & Loss Report Without Gst', 'Yearly Profit & Loss Report With Gst', 'Month Outstanding Report', 'Taka History', 'Sal - Sal Return', 'Pur - Pur Return', 'Sales + Reciept', 'Purchase + Payment', 'General Sale', 'Sal - Sal Return - Credit Note', 'Bank CC/OD Register', 'Sold Unsold', 'Party Group + Item + Brand', 'Party Group + Item + Brand + Grade', 'Party Group + Party + Item + Brand + Grade', 'Party Wise', 'Party + Party Group Wise', 'Item + Brand', 'Sales Person + Party Group', 'Sales Person + Party'];
    const excel = () => {
      try {
        const head = ['Item Code', 'Item Name', 'STOCK', 'Sale Ord Pending', 'Sold Unsold', 'Purchase Pending', 'Unsold After Purchase Pending'];
        const lines = [head].concat(list.map((r) => [r.code || '', r.name, r.stock, r.saleOrderPending, r.soldUnsold, r.purchasePending, r.unsoldAfterPurchase]));
        const csv = lines.map((l) => l.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'Sold Unsold.csv'; a.click();
      } catch (e) {}
    };
    const ready = f.type === 'Sold Unsold';
    return {
      theme, f, set, companies: ((st.fl || {}).companies || []).map((c) => ({ v: String(c.id), l: (c.code ? c.code + ' — ' : '') + c.name })),
      ccs: ((st.lk || {}).costCenters || []).map((c) => ({ v: String(c.id), l: c.name })), types: TYPES.map((t) => ({ v: t, l: t + (t === 'Sold Unsold' ? '' : '  (next)') })),
      tabL: f.type.toUpperCase(), ready, notReady: !ready, rows, empty: rows.length === 0, emptyL: st.busy ? 'Loading…' : 'Nothing pending', count: rows.length + ' items',
      tot: { stock: fmt(sum('stock')), so: fmt(sum('saleOrderPending')), su: fmt(sum('soldUnsold')), po: fmt(sum('purchasePending')), ua: fmt(sum('unsoldAfterPurchase')) },
      refresh: () => this.load(), excel, print: () => { try { window.print(); } catch (e) {} }, printBrand: () => { try { window.open('/print/grid/brand', '_blank'); } catch (e) {} }, note: st.note, noteCls: st.err ? 'tag t-red' : 'muted'
    };
  }
}

/* ----- view ----- */
class FinalReportsView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        
      <style>
        {"*{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:20px;-webkit-font-smoothing:antialiased} .dark{--bg:#141414;--sb:#1B1B1B;--s1:#1E1E1E;--s2:#262626;--s3:#2E2E2E;--bd:#262626;--bd2:#383838;--t1:#EDEDED;--t2:#B5B5B5;--t3:#8F8F8F;--ib:#F5F5F5;--it:#171717;--pop:#1E1E1E;color-scheme:dark} .light{--bg:#FFFFFF;--sb:#F8F8F8;--s1:#F7F7F7;--s2:#F1F1F1;--s3:#E9E9E9;--bd:#ECECEC;--bd2:#DDDDDD;--t1:#171717;--t2:#525252;--t3:#6B6B6B;--ib:#171717;--it:#FFFFFF;--pop:#FFFFFF;color-scheme:light} .app{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--t1)} a{color:inherit;text-decoration:none} button,input,select,textarea{font:inherit;color:inherit} .sbw{flex:0 0 236px;height:100%;overflow-y:auto;background:var(--sb);border-right:1px solid var(--bd)} .main{flex:1 1 auto;min-width:0;height:100%;display:flex;flex-direction:column;overflow:hidden} .main>*{flex:none} .hdr{display:flex;align-items:center;gap:8px;min-height:56px;padding:10px 20px;border-bottom:1px solid var(--bd);flex-wrap:wrap} .bc{display:flex;align-items:center;gap:8px;font-size:17px;flex:1 1 auto;min-width:0;white-space:nowrap} .bc .m{color:var(--t3)} .bc a.m{cursor:pointer;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} .btn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:8px;border:0;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;background:var(--s2);color:var(--t1)} .btn:hover{background:var(--s3)} .btn.pr{background:var(--ib);color:var(--it)} .btn.sm{height:30px;padding:0 10px;font-size:13px} .btn.gh{background:transparent}.btn.gh:hover{background:var(--s2)} .btn.no{background:rgba(239,68,68,.14);color:#F87171} .btn.ok{background:#16A34A;color:#fff} .inp{height:32px;border-radius:8px;border:1px solid transparent;background:var(--s2);padding:0 10px;font-size:14px;color:var(--t1);min-width:0} .inp::placeholder{color:var(--t3)} .muted{color:var(--t3)}.t2{color:var(--t2)} .tag{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:6px;font-size:11.5px;font-weight:500;white-space:nowrap;background:var(--s2);color:var(--t2)} .t-green{background:rgba(34,197,94,.14);color:#4ADE80}.t-orange{background:rgba(249,115,22,.15);color:#FB923C}.t-red{background:rgba(239,68,68,.15);color:#F87171}.t-blue{background:rgba(59,130,246,.16);color:#60A5FA}.t-gray{background:var(--s2);color:var(--t2)}.t-purple{background:rgba(168,85,247,.16);color:#C084FC} .light .t-green{color:#15803D}.light .t-orange{color:#C2410C}.light .t-red{color:#B91C1C}.light .t-blue{color:#1D4ED8}.light .t-purple{color:#7E22CE} .tabs{display:flex;gap:2px;padding:0 16px;border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none} .tab{display:flex;align-items:center;gap:8px;padding:9px 10px;color:var(--t3);border:0;border-bottom:2px solid transparent;background:none;cursor:pointer;white-space:nowrap} .tab:hover{color:var(--t1)} .tab.on{color:var(--t1);border-bottom-color:var(--t1)} .tab .n{font-size:12px;background:var(--s2);border-radius:6px;padding:0 6px;color:var(--t2);font-variant-numeric:tabular-nums} .dot{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}.dot::before{content:\"\";width:8px;height:8px;border-radius:50%;background:var(--c,#8F8F8F)} .fbar{display:flex;align-items:center;gap:8px;padding:8px 20px;flex-wrap:wrap} .bulk{display:flex;align-items:center;gap:8px;padding:6px 20px;background:rgba(59,130,246,.10);border-top:1px solid rgba(59,130,246,.25);border-bottom:1px solid rgba(59,130,246,.25);flex-wrap:wrap;font-size:13.5px} .okbar{display:flex;align-items:center;gap:10px;margin:0 20px 8px;padding:8px 12px;border-radius:8px;background:rgba(34,197,94,.12);color:#4ADE80;font-size:13.5px} .light .okbar{color:#15803D} .okbar button{margin-left:auto;border:0;background:transparent;color:inherit;cursor:pointer} .reg{flex:1 1 auto!important;min-height:0;overflow:auto;margin:0 20px 12px;border:1px solid var(--bd);border-radius:10px} table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0} .reg>table.cft{min-height:100%} thead th{background:var(--s1);color:var(--t3);font-weight:400;text-align:left;padding:0 9px;white-space:nowrap;border-bottom:1px solid var(--bd)} td{padding:0 9px;border-bottom:1px solid var(--bd);white-space:nowrap} .r{text-align:right;font-variant-numeric:tabular-nums} .cbx{width:15px;height:15px;margin:0;accent-color:#3B82F6;vertical-align:middle;cursor:pointer} .reg tbody tr:nth-child(even)>td{background:rgba(255,255,255,.04)} .light .reg tbody tr:nth-child(even)>td{background:#F6F7F9} .reg tbody tr:hover>td{background:var(--s2)} .reg tbody tr.sel>td{background:rgba(59,130,246,.22)!important} .light .reg tbody tr.sel>td{background:#DBEAFE!important} .reg tbody tr.sel>td:first-child{box-shadow:inset 3px 0 0 #3B82F6} .cft tbody tr:not(.fillr):not(.more){cursor:pointer;user-select:none} .cft tbody tr.fillr>td{height:auto!important;padding:0!important;border:0!important;background:transparent!important} .cft tbody tr.more>td{height:40px!important;text-align:center;color:var(--t3);font-size:13px;background:transparent!important} .cft tfoot td{position:sticky;bottom:0;z-index:4;background:var(--s2);font-weight:600;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .cft td.lnk{color:var(--t1);font-weight:500;text-decoration:underline;text-decoration-color:var(--bd2);text-underline-offset:3px} .spin{display:inline-block;width:12px;height:12px;border:2px solid var(--bd2);border-top-color:#3B82F6;border-radius:50%;animation:sp .8s linear infinite;margin-right:8px;vertical-align:-2px} @keyframes sp{to{transform:rotate(360deg)}} .aiw{flex:none;height:100vh} @media (max-width:760px){.aiw{display:none}.sbw{display:none}} /* gen17: one table size across the app */ table{font-size:13.5px;line-height:18px} thead th{font-size:13px;padding-top:7px;padding-bottom:7px;height:34px} tbody tr>td{height:36px!important;padding-top:3px;padding-bottom:3px} tbody td .sub{font-size:11.5px;line-height:14px} tfoot td{height:38px} table .tag{height:20px;font-size:11.5px;padding:0 7px} table .btn.sm{height:26px;padding:0 9px;font-size:12.5px} table .cin,table .inp{height:28px;font-size:13.5px} .ent{flex:1 1 auto!important;min-height:0;display:flex;flex-direction:column;overflow:auto} .ent>*{flex:none} .sec{padding:10px 20px;border-bottom:1px solid var(--bd);display:flex;flex-direction:column;gap:8px} .sh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sh h2{margin:0;font-size:15px;font-weight:600;white-space:nowrap} .props{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--bd);border-radius:12px;overflow:hidden} .pg{display:flex;flex-direction:column;padding:4px 0 6px;min-width:0} .pg+.pg{border-left:1px solid var(--bd)} .pgt{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);padding:5px 14px 1px} .pr{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;gap:6px;padding:0 10px 0 14px;min-height:28px} .pr:hover{background:var(--s1)} .pr label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .pv{height:26px;border:1px solid transparent;border-radius:7px;background:transparent;padding:0 8px;font-size:13.5px;color:var(--t1);width:100%;min-width:0} .pv:hover{background:var(--s2)}.pv:focus{outline:0;border-color:#3B82F6;background:var(--bg)} .pv[readonly]{color:var(--t2)}.pv[readonly]:hover{background:transparent} .pv::placeholder{color:var(--t3)} select.pv{cursor:pointer} .pr .unit{font-size:12px;color:var(--t3);white-space:nowrap} .sec.items{flex:1 1 auto!important;min-height:250px} .tw{flex:1 1 auto;min-height:0;overflow:auto;border:1px solid var(--bd);border-radius:10px} .it thead th{position:sticky;top:0;z-index:2} .it tbody td{height:36px} .it tfoot td{position:sticky;bottom:0;background:var(--s2);font-weight:600;height:38px;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .it td.n{color:var(--t3);width:34px} .it td.nm{font-weight:500} .cin{height:28px;border:1px solid var(--bd2);border-radius:6px;background:transparent;padding:0 7px;font-size:13.5px;color:var(--t1);width:100%;min-width:64px} .cin:focus{outline:0;border-color:#3B82F6} .cin::placeholder{color:var(--t3)} .cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px} .box{border:1px solid var(--bd);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:3px;min-width:0} .box h3{margin:0 0 3px;font-size:13px;font-weight:600} .kv{display:flex;justify-content:space-between;gap:12px;font-size:13px;line-height:20px;font-variant-numeric:tabular-nums} .kv span:first-child{color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0} .kv span:last-child{white-space:nowrap} .kv.big{border-top:1px dashed var(--bd2);padding-top:6px;margin-top:3px}.kv.big span:first-child{color:var(--t1);font-weight:600}.kv.big span:last-child{font-size:18px;font-weight:600} .flg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 14px} .fl{display:flex;flex-direction:column;gap:1px;min-width:0} .fl label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .fl .inp{height:28px;font-size:13px;width:100%;padding:0 8px} .fl label{font-size:11.5px} .actbar{display:flex;align-items:center;gap:6px;padding:10px 20px;border-top:1px solid var(--bd);flex-wrap:wrap} .actbar .btn{height:32px} .actbar select.inp{width:110px;height:32px} @media (max-width:1180px){.props,.cols3{grid-template-columns:repeat(2,minmax(0,1fr))}.pg:nth-child(3){grid-column:1 / -1;border-left:0;border-top:1px solid var(--bd)}} /* gen19: breadcrumb parent is a clear link back */ .bc a.m{cursor:pointer;text-decoration:none;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px;transition:background .12s,color .12s} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} /* gen27: collapsible sidebar */ .sbw{transition:flex-basis .18s ease,width .18s ease} .sbw:has(.sbc){flex:0 0 64px!important;width:64px!important;max-width:64px!important;min-width:64px!important} .t-red-x{color:#F87171} .light .t-red-x{color:#B91C1C}"}
      </style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="finr" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Reports
              </span>
              <span className="m">
                /
              </span>
              <span>
                Final Reports
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
              Export To PDF
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.printBrand}>
              Brandwise Sold-UnSold
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.refresh}>
              Refresh (F5)
            </button>
          </header>
          <div className="ent">
            <section className="sec">
              <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"end"}}>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"230px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    Company Name
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
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"200px"}}>
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
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"300px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    Report Type
                  </label>
                  <select className="inp" aria-label="Report type" value={v.f?.type} onChange={v.set?.type}>
                    {(v.types || []).map((o, $index) => (
                      <Fragment key={$index}>
                        <option value={o?.v}>
                          {o?.l}
                        </option>
                      </Fragment>
                    ))}
                  </select>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"260px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    Search item
                  </label>
                  <input className="inp" type="text" aria-label="Search item" value={v.f?.q} onChange={v.set?.q} placeholder="Item name" />
                </div>
              </div>
              <div className="tabs" style={{"padding":"0","marginTop":"6px"}}>
                <span className="tab on">
                  {v.tabL}
                </span>
              </div>
              {v.ready ? (
                <>
                  <div className="tw" style={{"maxHeight":"calc(100vh - 250px)"}}>
                    <table className="it">
                      <thead>
                        <tr>
                          <th className="r">
                            #
                          </th>
                          <th>
                            Item Code
                          </th>
                          <th>
                            Item Name
                          </th>
                          <th className="r">
                            STOCK
                          </th>
                          <th className="r">
                            Sale Ord Pending
                          </th>
                          <th className="r">
                            Sold Unsold
                          </th>
                          <th className="r">
                            Purchase Pending
                          </th>
                          <th className="r">
                            Unsold After Purchase Pending
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(v.rows || []).map((x, $index) => (
                          <Fragment key={$index}>
                            <tr>
                              <td className="r muted">
                                {x?.n}
                              </td>
                              <td className="t2">
                                {x?.code}
                              </td>
                              <td>
                                {x?.name}
                              </td>
                              <td className="r">
                                {x?.stock}
                              </td>
                              <td className="r">
                                {x?.so}
                              </td>
                              <td className={x?.suC}>
                                {x?.su}
                              </td>
                              <td className="r">
                                {x?.po}
                              </td>
                              <td className={x?.uaC}>
                                {x?.ua}
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                        {v.empty ? (
                          <>
                            <tr>
                              <td colSpan="8" className="muted" style={{"textAlign":"center","padding":"18px"}}>
                                {v.emptyL}
                              </td>
                            </tr>
                          </>
                        ) : null}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td />
                          <td colSpan="2">
                            {v.count}
                          </td>
                          <td className="r">
                            {v.tot?.stock}
                          </td>
                          <td className="r">
                            {v.tot?.so}
                          </td>
                          <td className="r">
                            {v.tot?.su}
                          </td>
                          <td className="r">
                            {v.tot?.po}
                          </td>
                          <td className="r">
                            {v.tot?.ua}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : null}
              {' '}
              {v.notReady ? (
                <>
                  <div className="box">
                    <h3>
                      {v.f?.type}
                    </h3>
                    <div className="muted" style={{"fontSize":"13px"}}>
                      This report of the old Final Reports screen is being rebuilt next. Sold Unsold is ready now.
                    </div>
                  </div>
                </>
              ) : null}
              <div className="muted" style={{"fontSize":"12.5px"}}>
                STOCK = purchases not yet dispatched (unlocked, not stock-cleared) · Sold Unsold = STOCK − Sale Ord Pending · Unsold After Purchase Pending = Sold Unsold + Purchase Pending — the same calculation as the old software.
              </div>
            </section>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="stock" />
        </div>
      </div>
      </>
    );
  }
}

export default function FinalReports(props) {
  const theme = useTheme();
  return <FinalReportsView {...props} theme={theme} />;
}
