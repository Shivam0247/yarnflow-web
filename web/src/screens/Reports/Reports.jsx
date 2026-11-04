/* eslint-disable */
// Reports — converted 1:1 from the YarnFlow design (Reports.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Reports.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { q: '', per: 'fy', key: null }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  range(per) {
    const fy = (this.api() && this.api().fy) || { startDate: '2026-04-01', endDate: '2027-03-31' };
    if (!per || per === 'fy') return [fy.startDate, fy.endDate];
    const [y, m] = per.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [per + '-01', per + '-' + String(last).padStart(2, '0')];
  }
  async componentDidMount() {
    const api = this.api(); if (!api) return;
    try { const list = await api.get('/reports/list'); this.setState({ list }); } catch (e) {}
    this.loadGst(this.state.per);
    try { const k = window.localStorage.getItem('yf-report'); if (k) { window.localStorage.removeItem('yf-report'); this.open(k); } } catch (e) {}
  }
  async loadGst(per) {
    const api = this.api(); if (!api) return; const [f, t0] = this.range(per === 'fy' ? this.curMonth() : per); const t = t0;
    try { const [g3, g1, ew] = await Promise.all([api.get('/reports/gstr3b', { from: f, to: t }), api.get('/reports/gstr1', { from: f, to: t }), api.get('/eway-bills')]); this.setState({ g3, g1, ew: ew.data, gper: per === 'fy' ? this.curMonth() : per }); } catch (e) {}
  }
  curMonth() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  async open(key, from, to) {
    const api = this.api(); if (!api) return;
    const [f0, t0] = this.range(this.state.per);
    const f = from || this.state.rf || f0; const t = to || this.state.rt || t0;
    this.setState({ key, rf: f, rt: t, tbl: null, busy: true });
    try { const tbl = await api.get('/reports/table/' + key, { from: f, to: t, asOn: t }); this.setState({ tbl, busy: false }); try { window.scrollTo(0, 0); } catch (e) {} } catch (e) { this.setState({ busy: false, tbl: { title: key, sub: api.message(e), cols: [], rows: [] } }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const live = !!this.api();
    const KEYS = ['sales-register', 'party-sales', 'yarn-sales', 'broker-sales', 'salesperson-sales', 'month-sales', 'brokerage', 'pending-so', 'purchase-register', 'mill-purchase', 'rate-history', 'pending-po', 'tds', 'day-book', 'trial-balance', 'profit-loss', 'balance-sheet', 'group-summary', 'collections-person', 'collections-sales', 'interest', 'payment-behaviour', 'stock-summary', 'lot-stock', 'slow-moving', 'stock-valuation', 'reorder', 'gstr1', 'gstr3b', 'gstr2b', 'hsn', 'ewb-register'];
    const op = {}; KEYS.forEach((k) => { op[k.replace(/-/g, '_')] = (e) => { if (e && e.preventDefault) e.preventDefault(); if (live) this.open(k); }; });
    const out = {}; ['party', 'group', 'collectionPerson', 'salesPerson', 'broker'].forEach((g) => { out[g] = () => { try { window.localStorage.setItem('yf-out-gb', g); } catch (e) {} }; });
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const inr = (n, d) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(d || 0); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const L = (v) => { const n = Number(v) || 0; return Math.abs(n) >= 1e7 ? '₹ ' + (n / 1e7).toFixed(2) + ' Cr' : Math.abs(n) >= 1e5 ? '₹ ' + (n / 1e5).toFixed(1) + ' L' : '₹ ' + inr(n); };
    // periods: months of the FY + FY
    const fy = (this.api() && this.api().fy) || { startDate: '2026-04-01', label: '2026-27' };
    const [fyY, fyM] = fy.startDate.split('-').map(Number);
    const pers = [{ v: 'fy', l: 'FY ' + (fy.label || fyY + '-' + String(fyY + 1).slice(2)) }];
    for (let i = 0; i < 12; i++) { const m = (fyM - 1 + i) % 12; const y = fyY + Math.floor((fyM - 1 + i) / 12); pers.push({ v: y + '-' + String(m + 1).padStart(2, '0'), l: mon[m] + ' ' + y }); }
    let gs;
    if (live && st.g3) {
      const g3 = st.g3; const [y, m] = st.gper.split('-').map(Number); const nx = new Date(Date.UTC(y, m, 1)); const nm = mon[nx.getUTCMonth()];
      const outTax = g3.outward.cgst + g3.outward.sgst + g3.outward.igst; const itc = g3.itc.cgst + g3.itc.sgst + g3.itc.igst;
      const ew = st.ew || []; const endT = new Date(); endT.setHours(23, 59, 59, 999); const exp = ew.filter((b) => b.ewbStatus === 'GENERATED' && b.ewbValidTill && new Date(b.ewbValidTill) <= endT).length;
      gs = { per: mon[m - 1] + ' ' + y, d1: '11 ' + nm, d3: '20 ' + nm, out: L(g3.outward.taxable), inv: (st.g1.b2b.length + st.g1.b2c.length) + ' invoices', tax: '₹ ' + inr(outTax), split: 'CGST+SGST ' + L(g3.outward.cgst + g3.outward.sgst) + ' · IGST ' + L(g3.outward.igst),
        itc: '₹ ' + inr(itc), itcN: 'from purchase bills', net: '₹ ' + inr(g3.totalPayable), ewb: String(ew.filter((b) => b.ewbNo).length), ewbS: exp ? exp + ' expire today' : ew.filter((b) => b.ewbStatus === 'PENDING').length + ' pending' };
    } else gs = { per: 'October 2026', d1: '11 Nov', d3: '20 Nov', out: '₹ 1.75 Cr', inv: '142 invoices', tax: '₹ 8,76,420', split: 'CGST+SGST ₹ 6.1 L · IGST ₹ 2.6 L', itc: '₹ 6,02,180', itcN: '4 bills missing in 2B', net: '₹ 2,74,240', ewb: '118', ewbS: '3 expire today' };
    // viewer
    const t = st.tbl; const list = st.list || [];
    const fmt = (c, v) => { if (v === null || v === undefined || v === '') return c.t === 'money' || c.t === 'qty' ? '' : '—'; if (c.t === 'money') return inr(v, 2); if (c.t === 'qty') return inr(v, 3); if (c.t === 'pct') return Number(v).toFixed(2); if (c.t === 'num') return inr(v); if (c.t === 'date') return String(v).slice(0, 10).split('-').reverse().join('-'); return String(v); };
    const isR = (c) => c.t === 'money' || c.t === 'qty' || c.t === 'num' || c.t === 'pct';
    const dmy = (x) => (x ? x.split('-').reverse().join('-') : '');
    const iso = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const csv = () => { if (!t) return ''; const head = t.cols.map((c) => c.l); const rows = t.rows.map((r) => t.cols.map((c) => fmt(c, r[c.k]))); if (t.total) rows.push(t.cols.map((c) => fmt(c, t.total[c.k]))); return [head].concat(rows).map((a) => a.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n'); };
    const q = st.q.trim().toLowerCase();
    const rv = { on: live && !!st.key, key: st.key || '', title: t ? t.title : st.busy ? 'Loading…' : '', sub: t ? t.sub : '', from: dmy(st.rf), to: dmy(st.rt),
      opts: list.filter((r) => !q || r.title.toLowerCase().indexOf(q) >= 0 || r.key === st.key).map((r) => ({ v: r.key, l: r.title })), pick: (e) => this.open(e.target.value),
      setFrom: (e) => { const v = iso(e.target.value); if (v) this.open(st.key, v, st.rt); }, setTo: (e) => { const v = iso(e.target.value); if (v) this.open(st.key, st.rf, v); },
      print: () => window.print(), excel: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = (t ? t.title : 'report') + '.csv'; a.click(); } catch (e) {} }, close: () => this.setState({ key: null, tbl: null }),
      cols: t ? t.cols.map((c) => ({ l: c.l, cls: isR(c) ? 'r' : '' })) : [],
      rows: t ? t.rows.slice(0, 2000).map((r) => ({ cls: r.bold ? 'b' : '', cells: t.cols.map((c) => ({ v: fmt(c, r[c.k]), cls: isR(c) ? 'r' : '' })) })) : [],
      empty: !!t && t.rows.length === 0, emptyL: st.busy ? 'Loading…' : 'Nothing in this period', hasTot: !!(t && t.total), tot: t && t.total ? t.cols.map((c) => ({ v: fmt(c, t.total[c.k]), cls: isR(c) ? 'r' : '' })) : [], hasNote: !!(t && t.note), note: t ? t.note || '' : '' };
    return { theme, op, out, gs, rv, nRep: String(live && list.length ? list.length : 42), q: st.q,
      setQ: (e) => { const v = e.target.value; this.setState({ q: v }); const hit = (st.list || []).find((r) => r.title.toLowerCase().indexOf(v.trim().toLowerCase()) >= 0); if (live && v.trim().length >= 3 && hit && hit.key !== st.key) this.open(hit.key); },
      per: st.per, pers, setPer: (e) => { const v = e.target.value; const [f, to] = this.range(v); this.setState({ per: v, rf: f, rt: to }); this.loadGst(v); if (st.key) this.open(st.key, f, to); },
      custom: () => { if (live) this.open(st.key || 'party-sales'); } };
  }
}

/* ----- view ----- */
class ReportsView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="rep" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                {"Reports & GST"}
              </span>
            </div>
            <input className="inp" type="search" placeholder={`Search ${v.nRep ?? ""} reports`} aria-label="Search reports" style={{"width":"240px"}} value={v.q} onChange={v.setQ} />
            {' '}
            <select className="inp" aria-label="Period" value={v.per} onChange={v.setPer}>
              {(v.pers || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option value={o?.v}>
                    {o?.l}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <button className="btn pr" type="button" onClick={v.custom}>
              + Custom report
            </button>
          </header>
          <div className="wrap">
            <section className="box">
              <div style={{"display":"flex","alignItems":"center","gap":"10px","padding":"14px 16px","borderBottom":"1px solid var(--bd)","flexWrap":"wrap"}}>
                <b style={{"fontWeight":"600","fontSize":"15px","flex":"1"}}>
                  {"GST summary · "}{v.gs?.per}
                </b>
                <span className="tag t-orange">
                  {"GSTR-1 due "}{v.gs?.d1}
                </span>
                <span className="tag t-gray">
                  {"GSTR-3B due "}{v.gs?.d3}
                </span>
                <button className="btn sm" type="button" onClick={v.op?.gstr2b}>
                  Reconcile 2B
                </button>
                <button className="btn sm pr" type="button" onClick={v.op?.gstr1}>
                  Prepare GSTR-1
                </button>
              </div>
              <div className="gst">
                <div>
                  <span className="muted">
                    Outward taxable
                  </span>
                  <b>
                    {v.gs?.out}
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    {v.gs?.inv}
                  </span>
                </div>
                <div>
                  <span className="muted">
                    Output GST
                  </span>
                  <b>
                    {v.gs?.tax}
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    {v.gs?.split}
                  </span>
                </div>
                <div>
                  <span className="muted">
                    Input credit (2B)
                  </span>
                  <b>
                    {v.gs?.itc}
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    {v.gs?.itcN}
                  </span>
                </div>
                <div>
                  <span className="muted">
                    Net GST payable
                  </span>
                  <b>
                    {v.gs?.net}
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    after ITC set-off
                  </span>
                </div>
                <div>
                  <span className="muted">
                    E-way bills
                  </span>
                  <b>
                    {v.gs?.ewb}
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    {v.gs?.ewbS}
                  </span>
                </div>
              </div>
            </section>
            {v.rv?.on ? (
              <>
                <section className="box rv">
                  <div className="rvh">
                    <b style={{"fontWeight":"600","fontSize":"15px"}}>
                      {v.rv?.title}
                    </b>
                    <span className="muted" style={{"fontSize":"13px","flex":"1"}}>
                      {v.rv?.sub}
                    </span>
                    <select className="inp" aria-label="Report" value={v.rv?.key} onChange={v.rv?.pick} style={{"width":"220px"}}>
                      {(v.rv?.opts || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <option value={o?.v}>
                            {o?.l}
                          </option>
                        </Fragment>
                      ))}
                    </select>
                    <input className="inp" type="text" value={v.rv?.from} onChange={v.rv?.setFrom} aria-label="From" style={{"width":"120px"}} />
                    <span className="muted">
                      to
                    </span>
                    <input className="inp" type="text" value={v.rv?.to} onChange={v.rv?.setTo} aria-label="To" style={{"width":"120px"}} />
                    <button className="btn sm" type="button" onClick={v.rv?.print}>
                      Print
                    </button>
                    <button className="btn sm" type="button" onClick={v.rv?.excel}>
                      Excel
                    </button>
                    <button className="btn sm gh" type="button" onClick={v.rv?.close} aria-label="Close report">
                      ✕
                    </button>
                  </div>
                  <div className="rvt">
                    <table>
                      <thead>
                        <tr>
                          {(v.rv?.cols || []).map((c, $index) => (
                            <Fragment key={$index}>
                              <th className={c?.cls}>
                                {c?.l}
                              </th>
                            </Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(v.rv?.rows || []).map((r, $index) => (
                          <Fragment key={$index}>
                            <tr className={r?.cls}>
                              {(r?.cells || []).map((x, $index) => (
                                <Fragment key={$index}>
                                  <td className={x?.cls}>
                                    {x?.v}
                                  </td>
                                </Fragment>
                              ))}
                            </tr>
                          </Fragment>
                        ))}
                        {v.rv?.empty ? (
                          <>
                            <tr>
                              <td className="muted" colSpan="20" style={{"textAlign":"center","padding":"28px"}}>
                                {v.rv?.emptyL}
                              </td>
                            </tr>
                          </>
                        ) : null}
                      </tbody>
                      {v.rv?.hasTot ? (
                        <>
                          <tfoot>
                            <tr>
                              {(v.rv?.tot || []).map((x, $index) => (
                                <Fragment key={$index}>
                                  <td className={x?.cls}>
                                    {x?.v}
                                  </td>
                                </Fragment>
                              ))}
                            </tr>
                          </tfoot>
                        </>
                      ) : null}
                    </table>
                  </div>
                  {v.rv?.hasNote ? (
                    <>
                      <div className="muted" style={{"padding":"10px 16px","fontSize":"13px"}}>
                        {v.rv?.note}
                      </div>
                    </>
                  ) : null}
                </section>
              </>
            ) : null}
            <div className="grid">
              <section className="box grp">
                <h2>
                  Sales
                </h2>
                <DcLink className="rep" href="SalesOrderList.dc.html" onClick={v.op?.sales_register}>
                  <span>
                    Sales register
                    <small>
                      Invoice-wise with GST split
                    </small>
                  </span>
                  <span className="star" aria-label="Favourite">
                    ★
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.party_sales}>
                  <span>
                    Party-wise sales
                    <small>
                      Top buyers, quantity and margin
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.yarn_sales}>
                  <span>
                    Yarn-wise sales
                    <small>
                      Kg and value by quality and lot
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.brokerage}>
                  <span>
                    Broker commission
                    <small>
                      Brokerage due by broker
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.pending_so}>
                  <span>
                    Pending orders
                    <small>
                      Ordered vs dispatched
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.salesperson_sales}>
                  <span>
                    Sales person-wise sales
                    <small>
                      Value, kg and returns per sales person
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.broker_sales}>
                  <span>
                    Broker-wise sales
                    <small>
                      Business brought by each broker
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.month_sales}>
                  <span>
                    Month-wise sales
                    <small>
                      Trend across the year
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  Purchase
                </h2>
                <DcLink className="rep" href="#" onClick={v.op?.purchase_register}>
                  <span>
                    Purchase register
                    <small>
                      Bill-wise with ITC
                    </small>
                  </span>
                  <span className="star" aria-label="Favourite">
                    ★
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.mill_purchase}>
                  <span>
                    Mill-wise purchase
                    <small>
                      Value, kg and average rate
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.rate_history}>
                  <span>
                    Rate history
                    <small>
                      Mill rate trend by yarn
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.pending_po}>
                  <span>
                    Pending POs
                    <small>
                      Ordered vs received
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.tds}>
                  <span>
                    TDS 194Q
                    <small>
                      TDS on purchase above ₹ 50 L
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  Accounts
                </h2>
                <DcLink className="rep" href="Ledger.dc.html">
                  <span>
                    Ledger statement
                    <small>
                      Any account, any period
                    </small>
                  </span>
                  <span className="star" aria-label="Favourite">
                    ★
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Outstanding.dc.html" onClick={v.out?.party}>
                  <span>
                    {"Outstanding & ageing"}
                    <small>
                      Receivable and payable
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Outstanding.dc.html" onClick={v.out?.group}>
                  <span>
                    Outstanding group-wise
                    <small>
                      By account group and party group
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Outstanding.dc.html" onClick={v.out?.collectionPerson}>
                  <span>
                    Outstanding collection person-wise
                    <small>
                      Who has to collect how much
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Outstanding.dc.html" onClick={v.out?.salesPerson}>
                  <span>
                    Outstanding sales person-wise
                    <small>
                      Ageing per sales person
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Outstanding.dc.html" onClick={v.out?.broker}>
                  <span>
                    Outstanding broker-wise
                    <small>
                      Dues through each broker
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.collections_person}>
                  <span>
                    Collection person-wise collection
                    <small>
                      Receipts by collection person
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.collections_sales}>
                  <span>
                    Sales person-wise collection
                    <small>
                      Receipts by sales person
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.interest}>
                  <span>
                    Interest on overdue bills
                    <small>
                      Interest by party · raise debit notes
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.group_summary}>
                  <span>
                    Group summary
                    <small>
                      Closing balance of every group
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.balance_sheet}>
                  <span>
                    Balance sheet
                    <small>
                      Assets and liabilities
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.day_book}>
                  <span>
                    Day book
                    <small>
                      All vouchers by date
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.trial_balance}>
                  <span>
                    Trial balance
                    <small>
                      Group-wise closing balances
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.profit_loss}>
                  <span>
                    {"Profit & loss · Balance sheet"}
                    <small>
                      Monthly and FY
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  Inventory
                </h2>
                <DcLink className="rep" href="Stock.dc.html" onClick={v.op?.stock_summary}>
                  <span>
                    Stock summary
                    <small>
                      Yarn × godown
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Stock.dc.html" onClick={v.op?.lot_stock}>
                  <span>
                    Lot-wise stock
                    <small>
                      Lot, grade, boxes and age
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.slow_moving}>
                  <span>
                    Slow-moving yarn
                    <small>
                      No sale in 60+ days
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.stock_valuation}>
                  <span>
                    Stock valuation
                    <small>
                      FIFO / weighted average
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  GST
                </h2>
                <DcLink className="rep" href="#" onClick={v.op?.gstr1}>
                  <span>
                    GSTR-1
                    <small>
                      Outward supplies · JSON export
                    </small>
                  </span>
                  <span className="tag t-orange">
                    Due
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.gstr3b}>
                  <span>
                    GSTR-3B
                    <small>
                      Summary return
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.gstr2b}>
                  <span>
                    GSTR-2B reconciliation
                    <small>
                      Match purchase bills with portal
                    </small>
                  </span>
                  <span className="tag t-orange">
                    4
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.hsn}>
                  <span>
                    HSN summary
                    <small>
                      5402, 5403, 5205 …
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.ewb_register}>
                  <span>
                    E-way bill register
                    <small>
                      Generated, expiring, cancelled
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  AI reports
                </h2>
                <DcLink className="rep" href="Main.dc.html#ai">
                  <span>
                    Ask in plain words
                    <small>
                      “Profit on viscose this quarter”
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.payment_behaviour}>
                  <span>
                    Payment behaviour
                    <small>
                      Who pays late, by how much
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#" onClick={v.op?.reorder}>
                  <span>
                    Reorder suggestions
                    <small>
                      Yarn to buy from which mill
                    </small>
                  </span>
                  <span className="tag t-green">
                    New
                  </span>
                </DcLink>
              </section>
            </div>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="rep" />
        </div>
      </div>
      </>
    );
  }
}

export default function Reports(props) {
  const theme = useTheme();
  return <ReportsView {...props} theme={theme} />;
}
