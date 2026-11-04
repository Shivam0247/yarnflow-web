/* eslint-disable */
// EwayBills — converted 1:1 from the YarnFlow design (EwayBills.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './EwayBills.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { f: 'all', sel: [], gen: {}, modal: null, mset: [], done: false, toast: '' }; }

  cf(base, COLS) {
    const st = this.state; const flt = st.flt || {}; const sk = st.sk || null; const sd = st.sd || 1; const pop = st.pop || null; const pq = String(st.pq || '').toLowerCase();
    const val = (r, c) => { const v = c.get ? c.get(r) : r[c.k]; return v == null || v === '' ? '—' : v; };
    const dk = (s) => { const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/); return m ? Number(m[3] + m[2] + m[1]) : 0; };
    const cmp = (c) => (a, b) => { const x = val(a, c), y = val(b, c); const r = c.num ? (Number(x) || 0) - (Number(y) || 0) : c.date ? dk(x) - dk(y) : String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' }); return r * sd; };
    const pass = (r, skip) => COLS.every((c) => c.k === skip || !flt[c.k] || flt[c.k].indexOf(String(val(r, c))) >= 0);
    const list = base.filter((r) => pass(r));
    const sc = sk ? COLS.find((x) => x.k === sk) : null;
    const sorter = sc ? cmp(sc) : null;
    if (sorter) list.sort(sorter);
    const set = (patch) => this.setState(Object.assign({ loaded: 20 }, patch));
    const fmtV = (c, v) => (c.fmt && v !== '—' ? c.fmt(v) : v);
    const heads = COLS.map((c) => {
      const on = !!flt[c.k]; const open = pop === c.k; const sorted = sk === c.k;
      let opts = []; let all = [];
      if (open) {
        const cnt = {}; base.filter((r) => pass(r, c.k)).forEach((r) => { const v = String(val(r, c)); cnt[v] = (cnt[v] || 0) + 1; });
        all = Object.keys(cnt).sort((a, b) => c.num ? (Number(a) || 0) - (Number(b) || 0) : c.date ? dk(a) - dk(b) : a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
        opts = all.filter((v) => !pq || String(fmtV(c, v)).toLowerCase().indexOf(pq) >= 0).map((v) => {
          const ck = !on || flt[c.k].indexOf(v) >= 0;
          return { v: fmtV(c, v), n: cnt[v], ck, tog: () => { let cur = on ? flt[c.k].slice() : all.slice(); const i = cur.indexOf(v); if (i >= 0) cur.splice(i, 1); else cur.push(v); const nf = Object.assign({}, flt); if (cur.length === all.length) delete nf[c.k]; else nf[c.k] = cur; set({ flt: nf }); } };
        });
      }
      const allCk = !on || (all.length > 0 && all.every((v) => flt[c.k].indexOf(v) >= 0));
      return {
        l: c.l, open, thc: 'fh' + (c.r ? ' r' : ''), btn: 'fb' + (on || sorted ? ' on' : '') + (open ? ' op' : ''),
        ic: sorted ? (sd > 0 ? '↑' : '↓') : '',
        toggle: () => this.setState({ pop: open ? null : c.k, pq: '' }), close: () => this.setState({ pop: null, pq: '' }),
        popCls: 'fp' + (c.rt ? ' rt' : ''),
        ascL: c.num ? 'Smallest to largest' : c.date ? 'Oldest to newest' : 'Sort A to Z', descL: c.num ? 'Largest to smallest' : c.date ? 'Newest to oldest' : 'Sort Z to A',
        ascC: sorted && sd > 0 ? 'fpi on' : 'fpi', descC: sorted && sd < 0 ? 'fpi on' : 'fpi',
        asc: () => set({ sk: c.k, sd: 1, pop: null }), desc: () => set({ sk: c.k, sd: -1, pop: null }),
        q: st.pq || '', setQ: (e) => this.setState({ pq: e.target.value }),
        opts, nOpts: String(all.length), noOpts: open && opts.length === 0, allCk,
        selAll: () => { const nf = Object.assign({}, flt); if (allCk) nf[c.k] = []; else delete nf[c.k]; set({ flt: nf }); },
        clear: () => { const nf = Object.assign({}, flt); delete nf[c.k]; set({ flt: nf, pop: null }); }
      };
    });
    const chips = COLS.filter((c) => flt[c.k]).map((c) => { const vs = flt[c.k].map((v) => fmtV(c, v)); return { l: c.l, v: vs.length === 0 ? 'none' : vs.slice(0, 2).join(', ') + (vs.length > 2 ? ' +' + (vs.length - 2) : ''), x: () => { const nf = Object.assign({}, flt); delete nf[c.k]; set({ flt: nf }); } }; });
    if (sc) chips.push({ l: 'Sorted by ' + sc.l, v: sd > 0 ? (sc.num ? 'smallest first' : sc.date ? 'oldest first' : 'A to Z') : (sc.num ? 'largest first' : sc.date ? 'newest first' : 'Z to A'), x: () => set({ sk: null, sd: 1 }) });
    const active = Object.keys(flt).length > 0 || !!sc;
    return { list, sorter, heads, chips, hasChips: chips.length > 0, active, filtered: Object.keys(flt).length > 0, clearAll: () => set({ flt: {}, sk: null, sd: 1, pop: null }) };
  }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const inr = (n, d) => { const s = Number(n).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return rest + l3 + (f ? '.' + f : ''); };
    const R = [{"no": "GU22853/26-27", "dt": "23-10-2026", "p": "Rannade Textile", "gst": "24AARFR5521K1Z4", "val": 135340, "km": 12, "tr": "Shivam Transport Services", "st": "pend"}, {"no": "GU22851/26-27", "dt": "22-10-2026", "p": "Bhagwati Filaments", "gst": "24AABCB4410K1Z3", "val": 188580, "km": 18, "tr": "Navkar Roadlines", "st": "pend"}, {"no": "GU22848/26-27", "dt": "22-10-2026", "p": "Shree Rudraksha Poly", "gst": "24AAHFS3302P1Z1", "val": 295561, "km": 9, "tr": "Jay Ambe Roadlines", "st": "pend"}, {"no": "GU22840/26-27", "dt": "20-10-2026", "p": "Jigita Fab LLP", "gst": "24AAKFJ9910R1Z7", "val": 134284, "km": 22, "tr": "Shree Maruti Cargo", "st": "pend"}, {"no": "GU22854/26-27", "dt": "23-10-2026", "p": "Rannade Textile", "gst": "24AARFR5521K1Z4", "val": 99024, "km": 12, "tr": "Shivam Transport Services", "st": "active", "ewb": "3210 8812 4401", "valid": "24-10-2026 11:59 PM", "veh": "GJ-05-BX-4120"}, {"no": "GU22802/26-27", "dt": "22-10-2026", "p": "Shree Rudraksha Poly", "gst": "24AAHFS3302P1Z1", "val": 337982, "km": 9, "tr": "Navkar Roadlines", "st": "partb", "ewb": "3210 8750 9912", "valid": "23-10-2026 11:59 PM", "veh": ""}, {"no": "GU22846/26-27", "dt": "22-10-2026", "p": "Ganpati Silk Mill", "gst": "24AAEFG4471C1Z2", "val": 174405, "km": 31, "tr": "VRL Logistics", "st": "partb", "ewb": "3210 8807 3315", "valid": "23-10-2026 11:59 PM", "veh": ""}, {"no": "GU22845/26-27", "dt": "21-10-2026", "p": "Bansam Fabrics", "gst": "24AADFB7781M1Z9", "val": 514500, "km": 14, "tr": "Navkar Roadlines", "st": "exp", "ewb": "3210 8809 1177", "valid": "Today 11:59 PM", "veh": "GJ-05-AV-7731"}, {"no": "GU22844/26-27", "dt": "21-10-2026", "p": "Sujal Synthetics", "gst": "24AAGFS1180D1Z4", "val": 136586, "km": 16, "tr": "Jay Ambe Roadlines", "st": "exp", "ewb": "3210 8808 4410", "valid": "Today 11:59 PM", "veh": "GJ-05-CT-1184"}, {"no": "GU22833/26-27", "dt": "18-10-2026", "p": "Ganpati Silk Mill", "gst": "24AAEFG4471C1Z2", "val": 174405, "km": 31, "tr": "VRL Logistics", "st": "active", "ewb": "3210 8790 5521", "valid": "Delivered", "veh": "GJ-19-T-2290"}, {"no": "GU22827/26-27", "dt": "16-10-2026", "p": "Sujal Synthetics", "gst": "24AAGFS1180D1Z4", "val": 136586, "km": 16, "tr": "Shivam Transport Services", "st": "active", "ewb": "3210 8781 0094", "valid": "Delivered", "veh": "GJ-05-CT-1184"}, {"no": "GU22790/26-27", "dt": "08-10-2026", "p": "Omkar Synthetics", "gst": "24AAFFO2209K1Z5", "val": 55519, "km": 27, "tr": "Navkar Roadlines", "st": "cancel", "ewb": "3210 8702 1180", "valid": "Cancelled 09-10", "veh": ""}];
    const gen = this.state.gen;
    const st = (r) => gen[r.no] ? 'partb' : r.st;
    const pend = R.filter((r) => st(r) === 'pend');
    const F = { gen: ['Generated', '#22C55E', 'E-way bill already made'], pend: ['Pending generation', '#F97316', 'Generate these'], partb: ['Part B pending', '#3B82F6', 'Waiting for transporter'], exp: ['Expiring today', '#EF4444', 'Extend if goods not delivered'], active: ['Active / delivered', '#22C55E', 'Part A + Part B done'], all: ['All', '#8F8F8F', 'Last 23 days'] };
    const f = this.state.f;
    const vis0 = R.filter((r) => f === 'all' || (f === 'gen' ? st(r) !== 'pend' : st(r) === f));
    const SL = { pend: ['EWB pending', 'tag t-orange'], partb: ['Part B pending', 'tag t-blue'], exp: ['Expiring today', 'tag t-red'], active: ['Active', 'tag t-green'], cancel: ['Cancelled', 'tag t-gray'] };
    const COLS = [{ k: 'no', l: 'Bill no.' }, { k: 'dt', l: 'Date', date: 1 }, { k: 'p', l: 'Party' }, { k: 'gst', l: 'GSTIN' }, { k: 'val', l: 'Value \u20b9', num: 1, r: 1, fmt: (v) => inr(v, 0) }, { k: 'tr', l: 'Transporter' }, { k: 'km', l: 'Km', num: 1, r: 1 }, { k: 'stL', l: 'Status', get: (r) => SL[st(r)][0] }, { k: 'ewbN', l: 'E-way bill no.', rt: 1, get: (r) => gen[r.no] || r.ewb || 'Not generated' }, { k: 'vld', l: 'Valid till', rt: 1, get: (r) => gen[r.no] ? '24-10-2026 11:59 PM' : (r.valid || 'Not generated') }, { k: 'vehN', l: 'Part B \u00b7 vehicle', rt: 1, get: (r) => st(r) === 'pend' ? '\u2014' : (r.veh && !gen[r.no] ? r.veh : 'Transporter to fill') }];
    const cf = this.cf(vis0, COLS); const vis = cf.list;
    const sel = this.state.sel;
    const open = (list) => this.setState({ modal: true, mset: list.map((r) => r.no), done: false });
    const rows = vis.map((r) => { const s = st(r); const on = sel.indexOf(r.no) >= 0; const ew = gen[r.no] || r.ewb;
      const act = s === 'pend' ? ['Generate', 'btn sm pr', () => open([r])] : s === 'exp' ? ['Extend', 'btn sm', () => {}] : ['View', 'btn sm gh', () => {}];
      return { no: r.no, dt: r.dt, p: r.p, gst: r.gst, val: inr(r.val, 0), tr: r.tr, km: r.km, sl: SL[s][0], sc: SL[s][1], ewb: ew || '—', valid: gen[r.no] ? 'Valid till 24-10-2026 11:59 PM' : (r.valid || 'Not generated'),
        veh: s === 'pend' ? '—' : (r.veh && !gen[r.no] ? r.veh : 'Transporter to fill'), on, rc: on ? 'sel' : '', tog: () => this.setState({ sel: on ? sel.filter((x) => x !== r.no) : sel.concat([r.no]) }),
        al: act[0], ac: act[1], act: act[2] }; });
    const cards = ['pend', 'partb', 'exp', 'active', 'all'].map((k) => { const n = k === 'all' ? R.length : R.filter((r) => st(r) === k).length;
      return { l: F[k][0], n: String(n), s: F[k][2], c: 'width: 8px; height: 8px; border-radius: 50%; background: ' + F[k][1], cls: k === f ? 'card on' : 'card', pick: () => this.setState({ f: k, sel: [] }) }; });
    const genN = R.filter((r) => st(r) !== 'pend').length;
    const segs = [['all', 'All e-way bills', R.length, '#8F8F8F'], ['pend', 'Pending', R.length - genN, '#F97316'], ['gen', 'Already generated', genN, '#22C55E']].map(([k, l, n, c]) => { const on = k === f || (k === 'gen' && ['partb', 'exp', 'active'].indexOf(f) >= 0); return { l, n: String(n), on, cls: on ? 'tab on' : 'tab', c: '--c: ' + c, pick: () => this.setState({ f: k, sel: [] }) }; });
    const selRows = R.filter((r) => sel.indexOf(r.no) >= 0); const selPend = selRows.filter((r) => st(r) === 'pend');
    const allOn = vis.length > 0 && vis.every((r) => sel.indexOf(r.no) >= 0);
    const modal = this.state.modal ?? (this.props.startModal ?? false);
    const mset = (this.state.modal === null && modal) ? pend.map((r) => r.no) : this.state.mset;
    const mR = R.filter((r) => mset.indexOf(r.no) >= 0); const done = this.state.done;
    const mrows = mR.map((r) => ({ no: r.no, p: r.p + ' · ' + r.gst, tr: r.tr, km: r.km, val: inr(r.val, 0), i: done ? '✓' : '•', ic: done ? 'ok' : 'muted', res: done ? 'EWB ' + gen[r.no] : 'Ready', rc: done ? 'tag t-green' : 'tag t-gray' }));
    return {
      cf, theme, cards, segs, rows, rowN: rows.length, allOn, hasSel: selRows.length > 0, selCount: selRows.length,
      selNote: selPend.length ? selPend.length + ' of these need an e-way bill' : 'All selected already have e-way bills',
      toggleAll: () => this.setState({ sel: allOn ? [] : vis.map((r) => r.no) }), clearSel: () => this.setState({ sel: [] }),
      hasPend: pend.length > 0, pendN: pend.length, pendVal: inr(pend.reduce((a, r) => a + r.val, 0), 0),
      openAll: () => open(pend), openSel: () => open(selPend), showPend: () => this.setState({ f: 'pend' }),
      filterLabel: F[f][0], totVal: inr(vis.reduce((a, r) => a + r.val, 0), 0),
      hasToast: !!this.state.toast, toast: this.state.toast, hideToast: () => this.setState({ toast: '' }),
      modal, mrows, mBefore: !done, mAfter: done,
      mTitle: done ? mR.length + ' e-way bills generated' : 'Generate ' + mR.length + ' e-way bills',
      mSub: done ? 'Part A is filed on the portal. Each transporter has been notified to fill Part B with the vehicle no.' : 'Part A is taken from each bill: GSTINs, document no., value, HSN, transporter and distance.',
      mBtn: 'Generate ' + mR.length + ' e-way bills', mFoot: done ? 'Numbers are saved on each bill.' : 'Total value ₹ ' + inr(mR.reduce((a, r) => a + r.val, 0), 0),
      runGen: () => { const g = { ...gen }; mR.forEach((r, i) => { if (!g[r.no] && st(r) === 'pend') g[r.no] = '3210 ' + String(8813 + Object.keys(g).length) + ' ' + String(4402 + i * 37); }); this.setState({ gen: g, done: true, sel: [], mset: mR.map((r) => r.no), modal: true, toast: mR.length + ' e-way bills generated · waiting for transporters to fill Part B' }); },
      closeM: () => this.setState({ modal: false, done: false }),
      billHref: 'Dispatch' + sfx + '.dc.html', billsHref: 'SaleBillList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class EwayBillsView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="ewb" />
        </div>
        <div className="main" style={{"height":"auto"}}>
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href={v.billsHref}>
                Sale bills
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                E-way bills
              </span>
            </div>
            <button className="btn" type="button">
              Sync with portal
            </button>
            {' '}
            <button className="btn" type="button">
              Excel
            </button>
            {' '}
            {v.hasPend ? (
              <>
                <button className="btn pr" type="button" onClick={v.openAll}>
                  {"Generate all pending · "}{v.pendN}
                </button>
              </>
            ) : null}
          </header>
          <div className="cards" role="group" aria-label="E-way bill status">
            {(v.cards || []).map((c, $index) => (
              <Fragment key={$index}>
                <button className={c?.cls} type="button" onClick={c?.pick}>
                  <span className="k">
                    <span className="dot" style={sx(c?.c)} />
                    {c?.l}
                  </span>
                  <span className="v">
                    {c?.n}
                  </span>
                  <span className="s">
                    {c?.s}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          {v.hasToast ? (
            <>
              <div className="okbar" role="status">
                <span>
                  ✓
                </span>
                <span>
                  {v.toast}
                </span>
                <button type="button" onClick={v.hideToast} aria-label="Dismiss">
                  ✕
                </button>
              </div>
            </>
          ) : null}
          <div className="tabs" role="tablist" aria-label="E-way bill filter" style={{"marginTop":"8px"}}>
            {(v.segs || []).map((g, $index) => (
              <Fragment key={$index}>
                <button className={g?.cls} type="button" role="tab" aria-selected={g?.on} onClick={g?.pick}>
                  <span className="dot" style={sx(g?.c)} />
                  {g?.l}
                  <span className="n">
                    {g?.n}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" defaultValue="01-10-2026" aria-label="From date" style={{"maxWidth":"120px"}} />
            <span className="muted">
              to
            </span>
            <input className="inp" type="text" defaultValue="23-10-2026" aria-label="To date" style={{"maxWidth":"120px"}} />
          </div>
          {v.hasSel ? (
            <>
              <div className="bulk" role="toolbar" aria-label="Bulk actions">
                <b style={{"fontWeight":"600"}}>
                  {v.selCount}{" selected"}
                </b>
                <span className="muted" style={{"flex":"1"}}>
                  {v.selNote}
                </span>
                <button className="btn sm pr" type="button" onClick={v.openSel}>
                  Generate e-way bills
                </button>
                <button className="btn sm" type="button">
                  Print
                </button>
                <button className="btn sm gh" type="button" onClick={v.clearSel}>
                  Clear
                </button>
              </div>
            </>
          ) : null}
          {' '}
          {v.cf?.hasChips ? (
            <>
              <div className="fchips" role="status">
                <span className="lbl">
                  Showing
                </span>
                {(v.cf?.chips || []).map((c, $index) => (
                  <Fragment key={$index}>
                    <span className="fchip">
                      {c?.l}{": "}
                      <b>
                        {c?.v}
                      </b>
                      <button type="button" onClick={c?.x} aria-label="Remove filter">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </span>
                  </Fragment>
                ))}
                <button className="fclr" type="button" onClick={v.cf?.clearAll}>
                  Clear all
                </button>
              </div>
            </>
          ) : null}
          <div className="reg">
            <table className="cft">
              <thead>
                <tr>
                  <th style={{"width":"32px"}}>
                    <input className="cbx" type="checkbox" aria-label="Select all" checked={v.allOn} onChange={v.toggleAll} />
                  </th>
                  {(v.cf?.heads || []).map((h, $index) => (
                    <Fragment key={$index}>
                      <th className={h?.thc}>
                        <button className={h?.btn} type="button" onClick={h?.toggle} aria-haspopup="dialog" aria-expanded={h?.open} title="Sort and filter">
                          {h?.l}
                          <span className="si">
                            {h?.ic}
                          </span>
                          <svg className="fi" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 5h18l-7 8v6l-4 2v-8z" />
                          </svg>
                        </button>
                        {h?.open ? (
                          <>
                            <div className="fpbk" onClick={h?.close} />
                            <div className={h?.popCls} role="dialog" aria-label="Sort and filter">
                              <button className={h?.ascC} type="button" onClick={h?.asc}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M12 19V5" />
                                  <path d="m5 12 7-7 7 7" />
                                </svg>
                                {h?.ascL}
                              </button>
                              <button className={h?.descC} type="button" onClick={h?.desc}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M12 5v14" />
                                  <path d="m19 12-7 7-7-7" />
                                </svg>
                                {h?.descL}
                              </button>
                              <div className="fpsep" />
                              <div className="fpt">
                                {"Filter "}{h?.l}
                              </div>
                              <input className="fps" type="search" value={h?.q} onChange={h?.setQ} placeholder="Search values" aria-label="Search values" autoFocus={true} />
                              <label className="fpo all">
                                <input type="checkbox" checked={h?.allCk} onChange={h?.selAll} />
                                <span className="v">
                                  Select all
                                </span>
                                <span className="n">
                                  {h?.nOpts}
                                </span>
                              </label>
                              <div className="fpl">
                                {(h?.opts || []).map((o, $index) => (
                                  <Fragment key={$index}>
                                    <label className="fpo">
                                      <input type="checkbox" checked={o?.ck} onChange={o?.tog} />
                                      <span className="v">
                                        {o?.v}
                                      </span>
                                      <span className="n">
                                        {o?.n}
                                      </span>
                                    </label>
                                  </Fragment>
                                ))}
                                {h?.noOpts ? (
                                  <>
                                    <div className="fpe">
                                      No matching values
                                    </div>
                                  </>
                                ) : null}
                              </div>
                              <div className="fpf">
                                <button className="btn sm gh" type="button" onClick={h?.clear}>
                                  Clear filter
                                </button>
                                <button className="btn sm pr" type="button" onClick={h?.close}>
                                  Done
                                </button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </th>
                    </Fragment>
                  ))}
                  <th className="r" />
                </tr>
              </thead>
              <tbody>
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr className={x?.rc}>
                      <td>
                        <input className="cbx" type="checkbox" aria-label="Select bill" checked={x?.on} onChange={x?.tog} />
                      </td>
                      <td>
                        <DcLink className="link" href={v.billHref}>
                          {x?.no}
                        </DcLink>
                      </td>
                      <td className="t2">
                        {x?.dt}
                      </td>
                      <td>
                        {x?.p}
                      </td>
                      <td className="t2">
                        {x?.gst}
                      </td>
                      <td className="r" style={{"fontWeight":"500"}}>
                        {x?.val}
                      </td>
                      <td>
                        {x?.tr}
                      </td>
                      <td className="r t2">
                        {x?.km}
                      </td>
                      <td>
                        <span className={x?.sc}>
                          {x?.sl}
                        </span>
                      </td>
                      <td className="ewbn">
                        {x?.ewb}
                      </td>
                      <td className="t2">
                        {x?.valid}
                      </td>
                      <td className="t2">
                        {x?.veh}
                      </td>
                      <td className="r">
                        <button className={x?.ac} type="button" onClick={x?.act}>
                          {x?.al}
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="foot">
            <span>
              {"Bills "}
              <b>
                {v.rowN}
              </b>
            </span>
            <span>
              {"Value "}
              <b>
                {"₹ "}{v.totVal}
              </b>
            </span>
          </div>
        </div>
        {v.modal ? (
          <>
            <div className="ovl">
              <div className="mdl" role="dialog" aria-modal="true" aria-label="Generate e-way bills">
                <div className="mh">
                  <div style={{"flex":"1","display":"flex","flexDirection":"column","gap":"4px"}}>
                    <b>
                      {v.mTitle}
                    </b>
                    <span className="muted" style={{"fontSize":"13px"}}>
                      {v.mSub}
                    </span>
                  </div>
                  <button className="btn sm gh" type="button" onClick={v.closeM} aria-label="Close">
                    ✕
                  </button>
                </div>
                <div className="ml">
                  {(v.mrows || []).map((m, $index) => (
                    <Fragment key={$index}>
                      <div className="mr">
                        <span className={m?.ic}>
                          {m?.i}
                        </span>
                        <div style={{"minWidth":"0"}}>
                          <div style={{"fontWeight":"500"}}>
                            {m?.no}
                          </div>
                          <div className="sub">
                            {m?.p}
                          </div>
                        </div>
                        <div style={{"minWidth":"0"}}>
                          <div>
                            {m?.tr}
                          </div>
                          <div className="sub">
                            {m?.km}{" km · Part A ready"}
                          </div>
                        </div>
                        <span style={{"fontVariantNumeric":"tabular-nums"}}>
                          {"₹ "}{m?.val}
                        </span>
                        <span className={m?.rc}>
                          {m?.res}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="mb">
                  <span className="muted" style={{"flex":"1","fontSize":"13px"}}>
                    {v.mFoot}
                  </span>
                  {v.mBefore ? (
                    <>
                      <button className="btn gh" type="button" onClick={v.closeM}>
                        Cancel
                      </button>
                      <button className="btn pr" type="button" onClick={v.runGen}>
                        {v.mBtn}
                      </button>
                    </>
                  ) : null}
                  {v.mAfter ? (
                    <>
                      <button className="btn pr" type="button" onClick={v.closeM}>
                        Done
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
        <div className="aiw">
          <Assistant page="ewb" />
        </div>
      </div>
      </>
    );
  }
}

export default function EwayBills(props) {
  const theme = useTheme();
  return <EwayBillsView {...props} theme={theme} />;
}
