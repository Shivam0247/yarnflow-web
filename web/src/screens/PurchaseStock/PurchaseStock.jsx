/* eslint-disable */
// PurchaseStock — converted 1:1 from the YarnFlow design (PurchaseStock.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';



/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { f: { mode: 'pending', from: '', to: '', company: '', q: '' }, data: null, on: {}, note: '', err: false, busy: false }; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  iso(d) { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; }
  dmy(iso) { return iso ? String(iso).slice(0, 10).split('-').reverse().join('-') : ''; }
  componentDidMount() {
    this.init();
    this._key = (e) => { if (e.key === 'F5') { e.preventDefault(); this.load(); } if (e.key === 'F11') { e.preventDefault(); this.setClear(true); } if (e.key === 'F12') { e.preventDefault(); this.setClear(false); } };
    try { window.addEventListener('keydown', this._key); } catch (e) {}
  }
  componentWillUnmount() { try { window.removeEventListener('keydown', this._key); } catch (e) {} }
  async init() {
    const api = this.api(); if (!api) return;
    try { const fl = await api.get('/outstanding-print/filters'); this.setState({ fl, ready: true }, () => this.load()); }
    catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async load() {
    const api = this.api(); if (!api) return; const f = this.state.f;
    this.setState({ busy: true, note: 'Loading…', err: false });
    try { const data = await api.get('/reports/purchase-stock', { mode: f.mode, from: this.iso(f.from) || undefined, to: this.iso(f.to) || undefined, companies: f.company || undefined, q: f.q || undefined }); this.setState({ data, on: {}, busy: false, note: '' }); }
    catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  async setClear(clear) {
    const api = this.api(); if (!api) return; const ids = Object.keys(this.state.on).filter((k) => this.state.on[k]).map(Number);
    if (!ids.length) { this.setState({ note: 'Tick the purchase lines first', err: true }); return; }
    if (!window.confirm((clear ? 'Stock clear ' : 'Re-open stock of ') + ids.length + ' purchase line(s)?')) return;
    this.setState({ busy: true });
    try { const r = await api.put('/reports/purchase-stock/clear', { lineIds: ids, clear }); await this.load(); this.setState({ note: '✓ ' + r.updated + (clear ? ' line(s) stock cleared' : ' line(s) re-opened'), err: false }); }
    catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const f = st.f; const live = !!this.api() && !!st.ready;
    const n3 = (v) => (Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    const n2 = (v) => (Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const set = {}; ['from', 'to', 'company', 'q'].forEach((k) => { set[k] = (e) => { const v = e.target.value; this.setState({ f: { ...this.state.f, [k]: v } }, () => { if (k === 'company') this.load(); }); }; });
    const modes = [['pending', 'Pending'], ['clear', 'Clear'], ['lock', 'Lock']].map(([v, l]) => ({ l, c: f.mode === v ? 'on' : '', go: () => this.setState({ f: { ...this.state.f, mode: v } }, () => this.load()) }));
    const src = live && st.data ? st.data.rows : [{ id: 1, number: 'R00166/26-27', date: '2026-09-20', party: 'RELIANCE INDUSTRIES LTD', deliveryParty: 'MAHAKALI TEXTILES', supplier: '', transporter: 'SHREE RAM ROADLINES', itemName: '50/24 FDY', brand: 'RELIANCE (RPL)', grade: 'A2', lot: 'FD001F2462', challanNo: '8100316633', challanDate: '2026-09-19', invNo: '2690046604', lrNo: '', w: 1115.38, dispatchQty: 0, pendingQty: 1115.38, pendingBox: 32, rate: 132, avgRate: '132', com: 'SUY', lock: null, clear: null }];
    const rows = src.map((r) => { const on = !!st.on[r.id]; return { on, tog: () => this.setState({ on: { ...this.state.on, [r.id]: !on } }), no: r.number, dt: this.dmy(r.date), party: r.party || '', dly: r.deliveryParty || '', supp: r.supplier || '', tr: r.transporter || '', item: r.itemName, brand: r.brand || '', grade: r.grade || '', lot: r.lot || '', ch: r.challanNo || '', chDt: this.dmy(r.challanDate), inv: r.invNo || '', lr: r.lrNo || '', qty: n3(r.w), dis: n3(r.dispatchQty), pen: n3(r.pendingQty), box: n3(r.pendingBox), rate: n2(r.rate), avg: r.avgRate ? n2(r.avgRate) : '', com: r.com || '', lock: r.lock ? 'Yes' : 'No', clr: r.clear ? 'Yes' : 'No' }; });
    const tot = live && st.data ? st.data.totals : { qty: 1115.38, dispatched: 0, pending: 1115.38, box: 32 };
    const ticked = src.filter((r) => st.on[r.id]);
    const excel = () => {
      try {
        const head = ['Pur Id', 'Pur Date', 'Party Name', 'Delivery Party', 'Supplier', 'Transport Name', 'Item Name', 'Brand', 'Grade', 'Lot No', 'Pur Ch No', 'Ch Date', 'Pur Inv No', 'Pur Lr No', 'Pur. Qty', 'Dis. Qty', 'Pending Qty', 'Pending Box', 'Rate', 'Avg Rate', 'Company', 'Is Lock', 'Is Clear'];
        const lines = [head].concat(rows.map((r) => [r.no, r.dt, r.party, r.dly, r.supp, r.tr, r.item, r.brand, r.grade, r.lot, r.ch, r.chDt, r.inv, r.lr, r.qty, r.dis, r.pen, r.box, r.rate, r.avg, r.com, r.lock, r.clr]));
        const csv = lines.map((l) => l.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'Purchase Stock.csv'; a.click();
      } catch (e) {}
    };
    return {
      theme, f, set, modes, companies: ((st.fl || {}).companies || []).map((c) => ({ v: String(c.id), l: (c.code ? c.code + ' — ' : '') + c.name })),
      rows, empty: rows.length === 0, emptyL: st.busy ? 'Loading…' : 'Nothing in this list', count: rows.length + ' lines' + (rows.length >= 5000 ? ' (first 5000 — narrow the dates)' : ''),
      tot: { qty: n3(tot.qty), dis: n3(tot.dispatched), pen: n3(tot.pending), box: n3(tot.box) },
      allOn: rows.length > 0 && ticked.length === rows.length, togAll: () => { const on = {}; if (ticked.length !== rows.length) src.forEach((r) => { on[r.id] = true; }); this.setState({ on }); },
      print: () => { try { window.open('/print/grid/stock?mode=' + f.mode + (this.iso(f.from) ? '&from=' + this.iso(f.from) : '') + (this.iso(f.to) ? '&to=' + this.iso(f.to) : '') + (f.company ? '&companies=' + f.company : ''), '_blank'); } catch (e) {} },
      printBrand: () => { try { window.open('/print/grid/brand' + (f.company ? '?companies=' + f.company : ''), '_blank'); } catch (e) {} },
      clear: () => this.setClear(true), reopen: () => this.setClear(false), excel, refresh: () => this.load(), busy: !!st.busy, note: st.note, noteCls: st.err ? 'tag t-red' : 'muted'
    };
  }
}

/* ----- view ----- */
class PurchaseStockView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        
      <style>
        {"*{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:20px;-webkit-font-smoothing:antialiased} .dark{--bg:#141414;--sb:#1B1B1B;--s1:#1E1E1E;--s2:#262626;--s3:#2E2E2E;--bd:#262626;--bd2:#383838;--t1:#EDEDED;--t2:#B5B5B5;--t3:#8F8F8F;--ib:#F5F5F5;--it:#171717;--pop:#1E1E1E;color-scheme:dark} .light{--bg:#FFFFFF;--sb:#F8F8F8;--s1:#F7F7F7;--s2:#F1F1F1;--s3:#E9E9E9;--bd:#ECECEC;--bd2:#DDDDDD;--t1:#171717;--t2:#525252;--t3:#6B6B6B;--ib:#171717;--it:#FFFFFF;--pop:#FFFFFF;color-scheme:light} .app{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--t1)} a{color:inherit;text-decoration:none} button,input,select,textarea{font:inherit;color:inherit} .sbw{flex:0 0 236px;height:100%;overflow-y:auto;background:var(--sb);border-right:1px solid var(--bd)} .main{flex:1 1 auto;min-width:0;height:100%;display:flex;flex-direction:column;overflow:hidden} .main>*{flex:none} .hdr{display:flex;align-items:center;gap:8px;min-height:56px;padding:10px 20px;border-bottom:1px solid var(--bd);flex-wrap:wrap} .bc{display:flex;align-items:center;gap:8px;font-size:17px;flex:1 1 auto;min-width:0;white-space:nowrap} .bc .m{color:var(--t3)} .bc a.m{cursor:pointer;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} .btn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:8px;border:0;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;background:var(--s2);color:var(--t1)} .btn:hover{background:var(--s3)} .btn.pr{background:var(--ib);color:var(--it)} .btn.sm{height:30px;padding:0 10px;font-size:13px} .btn.gh{background:transparent}.btn.gh:hover{background:var(--s2)} .btn.no{background:rgba(239,68,68,.14);color:#F87171} .btn.ok{background:#16A34A;color:#fff} .inp{height:32px;border-radius:8px;border:1px solid transparent;background:var(--s2);padding:0 10px;font-size:14px;color:var(--t1);min-width:0} .inp::placeholder{color:var(--t3)} .muted{color:var(--t3)}.t2{color:var(--t2)} .tag{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:6px;font-size:11.5px;font-weight:500;white-space:nowrap;background:var(--s2);color:var(--t2)} .t-green{background:rgba(34,197,94,.14);color:#4ADE80}.t-orange{background:rgba(249,115,22,.15);color:#FB923C}.t-red{background:rgba(239,68,68,.15);color:#F87171}.t-blue{background:rgba(59,130,246,.16);color:#60A5FA}.t-gray{background:var(--s2);color:var(--t2)}.t-purple{background:rgba(168,85,247,.16);color:#C084FC} .light .t-green{color:#15803D}.light .t-orange{color:#C2410C}.light .t-red{color:#B91C1C}.light .t-blue{color:#1D4ED8}.light .t-purple{color:#7E22CE} .tabs{display:flex;gap:2px;padding:0 16px;border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none} .tab{display:flex;align-items:center;gap:8px;padding:9px 10px;color:var(--t3);border:0;border-bottom:2px solid transparent;background:none;cursor:pointer;white-space:nowrap} .tab:hover{color:var(--t1)} .tab.on{color:var(--t1);border-bottom-color:var(--t1)} .tab .n{font-size:12px;background:var(--s2);border-radius:6px;padding:0 6px;color:var(--t2);font-variant-numeric:tabular-nums} .dot{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}.dot::before{content:\"\";width:8px;height:8px;border-radius:50%;background:var(--c,#8F8F8F)} .fbar{display:flex;align-items:center;gap:8px;padding:8px 20px;flex-wrap:wrap} .bulk{display:flex;align-items:center;gap:8px;padding:6px 20px;background:rgba(59,130,246,.10);border-top:1px solid rgba(59,130,246,.25);border-bottom:1px solid rgba(59,130,246,.25);flex-wrap:wrap;font-size:13.5px} .okbar{display:flex;align-items:center;gap:10px;margin:0 20px 8px;padding:8px 12px;border-radius:8px;background:rgba(34,197,94,.12);color:#4ADE80;font-size:13.5px} .light .okbar{color:#15803D} .okbar button{margin-left:auto;border:0;background:transparent;color:inherit;cursor:pointer} .reg{flex:1 1 auto!important;min-height:0;overflow:auto;margin:0 20px 12px;border:1px solid var(--bd);border-radius:10px} table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0} .reg>table.cft{min-height:100%} thead th{background:var(--s1);color:var(--t3);font-weight:400;text-align:left;padding:0 9px;white-space:nowrap;border-bottom:1px solid var(--bd)} td{padding:0 9px;border-bottom:1px solid var(--bd);white-space:nowrap} .r{text-align:right;font-variant-numeric:tabular-nums} .cbx{width:15px;height:15px;margin:0;accent-color:#3B82F6;vertical-align:middle;cursor:pointer} .reg tbody tr:nth-child(even)>td{background:rgba(255,255,255,.04)} .light .reg tbody tr:nth-child(even)>td{background:#F6F7F9} .reg tbody tr:hover>td{background:var(--s2)} .reg tbody tr.sel>td{background:rgba(59,130,246,.22)!important} .light .reg tbody tr.sel>td{background:#DBEAFE!important} .reg tbody tr.sel>td:first-child{box-shadow:inset 3px 0 0 #3B82F6} .cft tbody tr:not(.fillr):not(.more){cursor:pointer;user-select:none} .cft tbody tr.fillr>td{height:auto!important;padding:0!important;border:0!important;background:transparent!important} .cft tbody tr.more>td{height:40px!important;text-align:center;color:var(--t3);font-size:13px;background:transparent!important} .cft tfoot td{position:sticky;bottom:0;z-index:4;background:var(--s2);font-weight:600;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .cft td.lnk{color:var(--t1);font-weight:500;text-decoration:underline;text-decoration-color:var(--bd2);text-underline-offset:3px} .spin{display:inline-block;width:12px;height:12px;border:2px solid var(--bd2);border-top-color:#3B82F6;border-radius:50%;animation:sp .8s linear infinite;margin-right:8px;vertical-align:-2px} @keyframes sp{to{transform:rotate(360deg)}} .aiw{flex:none;height:100vh} @media (max-width:760px){.aiw{display:none}.sbw{display:none}} /* gen17: one table size across the app */ table{font-size:13.5px;line-height:18px} thead th{font-size:13px;padding-top:7px;padding-bottom:7px;height:34px} tbody tr>td{height:36px!important;padding-top:3px;padding-bottom:3px} tbody td .sub{font-size:11.5px;line-height:14px} tfoot td{height:38px} table .tag{height:20px;font-size:11.5px;padding:0 7px} table .btn.sm{height:26px;padding:0 9px;font-size:12.5px} table .cin,table .inp{height:28px;font-size:13.5px} .ent{flex:1 1 auto!important;min-height:0;display:flex;flex-direction:column;overflow:auto} .ent>*{flex:none} .sec{padding:10px 20px;border-bottom:1px solid var(--bd);display:flex;flex-direction:column;gap:8px} .sh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sh h2{margin:0;font-size:15px;font-weight:600;white-space:nowrap} .props{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--bd);border-radius:12px;overflow:hidden} .pg{display:flex;flex-direction:column;padding:4px 0 6px;min-width:0} .pg+.pg{border-left:1px solid var(--bd)} .pgt{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);padding:5px 14px 1px} .pr{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;gap:6px;padding:0 10px 0 14px;min-height:28px} .pr:hover{background:var(--s1)} .pr label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .pv{height:26px;border:1px solid transparent;border-radius:7px;background:transparent;padding:0 8px;font-size:13.5px;color:var(--t1);width:100%;min-width:0} .pv:hover{background:var(--s2)}.pv:focus{outline:0;border-color:#3B82F6;background:var(--bg)} .pv[readonly]{color:var(--t2)}.pv[readonly]:hover{background:transparent} .pv::placeholder{color:var(--t3)} select.pv{cursor:pointer} .pr .unit{font-size:12px;color:var(--t3);white-space:nowrap} .sec.items{flex:1 1 auto!important;min-height:250px} .tw{flex:1 1 auto;min-height:0;overflow:auto;border:1px solid var(--bd);border-radius:10px} .it thead th{position:sticky;top:0;z-index:2} .it tbody td{height:36px} .it tfoot td{position:sticky;bottom:0;background:var(--s2);font-weight:600;height:38px;border-top:1px solid var(--bd2);border-bottom:0;white-space:nowrap} .it td.n{color:var(--t3);width:34px} .it td.nm{font-weight:500} .cin{height:28px;border:1px solid var(--bd2);border-radius:6px;background:transparent;padding:0 7px;font-size:13.5px;color:var(--t1);width:100%;min-width:64px} .cin:focus{outline:0;border-color:#3B82F6} .cin::placeholder{color:var(--t3)} .cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px} .box{border:1px solid var(--bd);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:3px;min-width:0} .box h3{margin:0 0 3px;font-size:13px;font-weight:600} .kv{display:flex;justify-content:space-between;gap:12px;font-size:13px;line-height:20px;font-variant-numeric:tabular-nums} .kv span:first-child{color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0} .kv span:last-child{white-space:nowrap} .kv.big{border-top:1px dashed var(--bd2);padding-top:6px;margin-top:3px}.kv.big span:first-child{color:var(--t1);font-weight:600}.kv.big span:last-child{font-size:18px;font-weight:600} .flg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 14px} .fl{display:flex;flex-direction:column;gap:1px;min-width:0} .fl label{font-size:12.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .fl .inp{height:28px;font-size:13px;width:100%;padding:0 8px} .fl label{font-size:11.5px} .actbar{display:flex;align-items:center;gap:6px;padding:10px 20px;border-top:1px solid var(--bd);flex-wrap:wrap} .actbar .btn{height:32px} .actbar select.inp{width:110px;height:32px} @media (max-width:1180px){.props,.cols3{grid-template-columns:repeat(2,minmax(0,1fr))}.pg:nth-child(3){grid-column:1 / -1;border-left:0;border-top:1px solid var(--bd)}} /* gen19: breadcrumb parent is a clear link back */ .bc a.m{cursor:pointer;text-decoration:none;border-radius:6px;padding:3px 6px;margin:0 -2px 0 -6px;transition:background .12s,color .12s} .bc a.m:hover{color:var(--t1);background:var(--s2);text-decoration:underline;text-underline-offset:3px} /* gen27: collapsible sidebar */ .sbw{transition:flex-basis .18s ease,width .18s ease} .sbw:has(.sbc){flex:0 0 64px!important;width:64px!important;max-width:64px!important;min-width:64px!important} .t-red-x{color:#F87171} .light .t-red-x{color:#B91C1C} .seg2{display:inline-flex;background:var(--s2);border-radius:8px;padding:2px;gap:2px} .seg2 button{border:0;background:transparent;border-radius:6px;padding:5px 12px;font-size:13px;cursor:pointer;color:var(--t2)} .seg2 button.on{background:var(--bg);color:var(--t1);box-shadow:0 0 0 1px var(--bd2)}"}
      </style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="pstk" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Inventory
              </span>
              <span className="m">
                /
              </span>
              <span>
                Purchase Stock Pending List
              </span>
            </div>
            <span className={v.noteCls} style={{"fontSize":"13px"}} role="status">
              {v.note}
            </span>
            {' '}
            <button className="btn" type="button" onClick={v.clear} disabled={v.busy}>
              Stock Clear-F11
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.reopen} disabled={v.busy}>
              ReOpen-F12
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.print}>
              Print (brand wise)
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.printBrand}>
              Brandwise Sold-UnSold
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.excel}>
              Export To Excel
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.refresh}>
              Refresh (F5)
            </button>
          </header>
          <div className="ent">
            <section className="sec">
              <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","alignItems":"end"}}>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    Status
                  </label>
                  <div className="seg2">
                    {(v.modes || []).map((o, $index) => (
                      <Fragment key={$index}>
                        <button type="button" className={o?.c} onClick={o?.go}>
                          {o?.l}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"130px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    From
                  </label>
                  <input className="inp" type="text" aria-label="From" value={v.f?.from} onChange={v.set?.from} placeholder="dd-mm-yyyy" />
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"130px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    To
                  </label>
                  <input className="inp" type="text" aria-label="To" value={v.f?.to} onChange={v.set?.to} placeholder="dd-mm-yyyy" />
                </div>
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
                <div style={{"display":"flex","flexDirection":"column","gap":"4px","width":"260px"}}>
                  <label className="muted" style={{"fontSize":"12.5px"}}>
                    Search
                  </label>
                  <input className="inp" type="text" aria-label="Search" value={v.f?.q} onChange={v.set?.q} placeholder="Item, party, lot, challan, Pur no." />
                </div>
              </div>
              <div className="tw" style={{"maxHeight":"calc(100vh - 230px)"}}>
                <table className="it" style={{"whiteSpace":"nowrap"}}>
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" aria-label="Select all" checked={v.allOn} onChange={v.togAll} />
                      </th>
                      <th>
                        Pur Id
                      </th>
                      <th>
                        Pur Date
                      </th>
                      <th>
                        Party Name
                      </th>
                      <th>
                        Delivery Party
                      </th>
                      <th>
                        Supplier
                      </th>
                      <th>
                        Transport Name
                      </th>
                      <th>
                        Item Name
                      </th>
                      <th>
                        Brand
                      </th>
                      <th>
                        Grade
                      </th>
                      <th>
                        Lot No
                      </th>
                      <th>
                        Pur Ch No
                      </th>
                      <th>
                        Ch Date
                      </th>
                      <th>
                        Pur Inv No
                      </th>
                      <th>
                        Pur Lr No
                      </th>
                      <th className="r">
                        Pur. Qty
                      </th>
                      <th className="r">
                        Dis. Qty
                      </th>
                      <th className="r">
                        Pending Qty
                      </th>
                      <th className="r">
                        Pending Box
                      </th>
                      <th className="r">
                        Rate
                      </th>
                      <th className="r">
                        Avg Rate
                      </th>
                      <th>
                        Company
                      </th>
                      <th>
                        Is Lock
                      </th>
                      <th>
                        Is Clear
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(v.rows || []).map((x, $index) => (
                      <Fragment key={$index}>
                        <tr>
                          <td>
                            <input type="checkbox" aria-label="Select" checked={x?.on} onChange={x?.tog} />
                          </td>
                          <td>
                            {x?.no}
                          </td>
                          <td className="t2">
                            {x?.dt}
                          </td>
                          <td>
                            {x?.party}
                          </td>
                          <td className="t2">
                            {x?.dly}
                          </td>
                          <td className="t2">
                            {x?.supp}
                          </td>
                          <td className="t2">
                            {x?.tr}
                          </td>
                          <td>
                            {x?.item}
                          </td>
                          <td className="t2">
                            {x?.brand}
                          </td>
                          <td className="t2">
                            {x?.grade}
                          </td>
                          <td className="t2">
                            {x?.lot}
                          </td>
                          <td className="t2">
                            {x?.ch}
                          </td>
                          <td className="t2">
                            {x?.chDt}
                          </td>
                          <td className="t2">
                            {x?.inv}
                          </td>
                          <td className="t2">
                            {x?.lr}
                          </td>
                          <td className="r">
                            {x?.qty}
                          </td>
                          <td className="r">
                            {x?.dis}
                          </td>
                          <td className="r">
                            {x?.pen}
                          </td>
                          <td className="r">
                            {x?.box}
                          </td>
                          <td className="r">
                            {x?.rate}
                          </td>
                          <td className="r">
                            {x?.avg}
                          </td>
                          <td className="t2">
                            {x?.com}
                          </td>
                          <td className="t2">
                            {x?.lock}
                          </td>
                          <td className="t2">
                            {x?.clr}
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                    {v.empty ? (
                      <>
                        <tr>
                          <td colSpan="24" className="muted" style={{"textAlign":"center","padding":"18px"}}>
                            {v.emptyL}
                          </td>
                        </tr>
                      </>
                    ) : null}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td />
                      <td colSpan="14">
                        {v.count}
                      </td>
                      <td className="r">
                        {v.tot?.qty}
                      </td>
                      <td className="r">
                        {v.tot?.dis}
                      </td>
                      <td className="r">
                        {v.tot?.pen}
                      </td>
                      <td className="r">
                        {v.tot?.box}
                      </td>
                      <td colSpan="5" />
                    </tr>
                  </tfoot>
                </table>
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

export default function PurchaseStock(props) {
  const theme = useTheme();
  return <PurchaseStockView {...props} theme={theme} />;
}
