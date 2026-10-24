/* eslint-disable */
// PurchaseBill — converted 1:1 from the YarnFlow design (PurchaseBill.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './PurchaseBill.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { z: 1, more: false, hist: true, tcs: false, tab: 'sum', pick: null, sel: p.startPicker ? [] : ["PUR2214"], qty: p.startPicker ? {} : {"PUR2214": "206.830"}, draft: null, dqty: null }; }
  componentDidMount() {
    if (!this.props.startPicker) { const rd = () => { try { const raw = window.localStorage.getItem('yf-open-pb'); if (raw && raw !== this._raw) { this._raw = raw; this.setState({ brec: JSON.parse(raw), upd: false }); } } catch (e) {} }; this._rd = rd; rd(); this._iv = setInterval(rd, 700); try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {} }
    try { const b = JSON.parse(window.localStorage.getItem('yf-back') || 'null'); if (b && b.href) this.setState({ back: b }); } catch (e) {}
  }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const tab = this.state.tab;
    const inr = (n, d) => { const neg = n < 0; const s = Math.abs(Number(n)).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (neg ? '− ' : '') + rest + l3 + (f ? '.' + f : ''); };
    const words = (n) => { const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']; const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const two = (x) => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''); const three = (x) => x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + two(x % 100) : '') : two(x);
      let s = ''; const cr = Math.floor(n / 1e7); n %= 1e7; const l = Math.floor(n / 1e5); n %= 1e5; const t = Math.floor(n / 1000); n %= 1000;
      if (cr) s += three(cr) + ' Crore '; if (l) s += two(l) + ' Lakh '; if (t) s += two(t) + ' Thousand '; if (n) s += three(n); return 'Rupees ' + (s.trim() || 'Zero') + ' Only'; };
    const num = (s) => parseFloat(String(s).replace(/,/g, '')) || 0;
    const PO = [{"no": "PUR2214", "dt": "18-10-2026", "p": "Bandhan Filaments", "g": "Agent · Henil", "it": "50/48 CREP", "br": "RK Fashion", "lot": "N500", "rate": 252.44, "oq": 1000, "dq": 0, "age": "5 days", "gr": "1ST", "iid": "70", "hsn": "54024700", "ch": "13610"}, {"no": "PUR2216", "dt": "20-10-2026", "p": "Bandhan Filaments", "g": "Agent · Henil", "it": "75/72 Roto", "br": "RK Fashion", "lot": "N512", "rate": 141.5, "oq": 1500, "dq": 0, "age": "3 days", "gr": "1ST", "iid": "74", "hsn": "54024700", "ch": "13618"}, {"no": "PUR2923", "dt": "13-12-2025", "p": "Daya Tex Industries", "g": "Agent · Direct", "it": "75/72 Roto Lim", "br": "Daya", "lot": "014850", "rate": 105, "oq": 11000, "dq": 8113.77, "age": "314 days", "gr": "1ST", "iid": "52", "hsn": "54024700", "ch": "DT/4410"}, {"no": "PUR0080", "dt": "08-04-2026", "p": "Reliance Industries", "g": "Agent · Direct", "it": "75/72 FDY", "br": "Reliance", "lot": "336C1M", "rate": 122.5, "oq": 31000, "dq": 28332.69, "age": "198 days", "gr": "A+", "iid": "12", "hsn": "54024700", "ch": "RIL/89120"}, {"no": "PUR0570", "dt": "28-05-2026", "p": "Shree Ram Yarn Trading", "g": "Agent · Direct", "it": "50/36 Bright Catonic", "br": "AYM Syntex", "lot": "FG7C13", "rate": 155.72, "oq": 10000, "dq": 4999.2, "age": "148 days", "gr": "1ST", "iid": "33", "hsn": "54024700", "ch": "SRY/771"}, {"no": "PUR0573", "dt": "29-05-2026", "p": "Radiant Polyester", "g": "Agent · Direct", "it": "80/48 BSY", "br": "Radiant", "lot": "R80/48", "rate": 155, "oq": 31000, "dq": 21326.55, "age": "147 days", "gr": "1ST", "iid": "41", "hsn": "54024700", "ch": "RP/2290"}, {"no": "PUR0639", "dt": "08-06-2026", "p": "GTX Private Limited", "g": "Agent · Direct", "it": "150 Limaya", "br": "GTPL", "lot": "LMY222", "rate": 149, "oq": 5000, "dq": 3948.162, "age": "137 days", "gr": "1ST", "iid": "58", "hsn": "54024700", "ch": "GTX/118"}];
    const PT = {"Bandhan Filaments": {"g": "Bandhan Filaments", "agent": "Henil Vatsal Shah", "sp": "Manoj Bhai", "cr": 5, "gstin": "24AAKFB2290Q1Z6", "pan": "AAKFB2290Q", "out": "₹ 1,62,480", "total": "₹ 10,44,566", "bills": "21", "del": "Our godown · Sachin GIDC"}, "Daya Tex Industries": {"g": "Daya Tex Industries", "agent": "Direct", "sp": "Avi M", "cr": 30, "gstin": "24AAFFD6612H1Z0", "pan": "AAFFD6612H", "out": "₹ 4,12,300", "total": "₹ 9,86,400", "bills": "12", "del": "Our godown · Pandesara"}, "Reliance Industries": {"g": "Reliance Industries", "agent": "Direct", "sp": "Avi M", "cr": 60, "gstin": "26AAACR4471L1Z8", "pan": "AAACR4471L", "out": "₹ 38,40,000", "total": "₹ 3,12,40,000", "bills": "96", "del": "Our godown · Sachin GIDC"}, "Shree Ram Yarn Trading": {"g": "Shree Ram Yarn Trading", "agent": "Direct", "sp": "Avi M", "cr": 30, "gstin": "24AAPFS2208J1Z5", "pan": "AAPFS2208J", "out": "₹ 7,78,500", "total": "₹ 15,57,000", "bills": "9", "del": "Our godown · Kadodara"}, "Radiant Polyester": {"g": "Radiant Polyester", "agent": "Direct", "sp": "Avi M", "cr": 45, "gstin": "24AABCR8890E1Z3", "pan": "AABCR8890E", "out": "₹ 14,99,000", "total": "₹ 33,05,000", "bills": "24", "del": "Our godown · Sachin GIDC"}, "GTX Private Limited": {"g": "GTX Private Limited", "agent": "Direct", "sp": "Avi M", "cr": 30, "gstin": "24AADCG3317B1Z6", "pan": "AADCG3317B", "out": "₹ 1,56,700", "total": "₹ 5,88,200", "bills": "7", "del": "Our godown · Pandesara"}};
    const find = (no) => PO.find((r) => r.no === no);
    const pick = this.state.pick ?? (this.props.startPicker ?? false);
    const sel = this.state.sel; const qty = this.state.qty;
    const draft = this.state.draft ?? sel; const dqty = this.state.dqty ?? qty;
    const dRows = PO.filter((r) => draft.indexOf(r.no) >= 0);
    const dParty = dRows.length ? dRows[0].p : null;
    const po = PO.map((r) => { const on = draft.indexOf(r.no) >= 0; const other = dParty && r.p !== dParty; const pend = r.oq - r.dq;
      return { no: r.no, dt: r.dt, p: r.p, g: r.g, it: r.it, br: r.br, lot: r.lot, age: r.age, rate: inr(r.rate, 2), oq: inr(r.oq, 3), dq: inr(r.dq, 3), pq: inr(pend, 3),
        bq: dqty[r.no] ?? inr(pend, 3), on, rc: on ? 'on' : (other ? 'off' : ''),
        setQ: (e) => this.setState({ draft, dqty: { ...dqty, [r.no]: e.target.value } }),
        tog: () => this.setState({ draft: on ? draft.filter((x) => x !== r.no) : (other ? [r.no] : draft.concat([r.no])), dqty }) }; });
    const dQty = dRows.reduce((a, r) => a + num(dqty[r.no] ?? (r.oq - r.dq)), 0);
    const rows = sel.map(find).filter(Boolean);
    const party = rows.length ? rows[0].p : null; const pt = party ? PT[party] : null;
    let T = { q: 0, ctn: 0, cops: 0, basic: 0 };
    const items = rows.map((r, i) => { const q = num(qty[r.no] ?? (r.oq - r.dq)); const basic = q * r.rate; const g = basic * 0.05; const ctn = q > 0 ? Math.max(1, Math.round(q / 25.85)) : 0;
      T.q += q; T.ctn += ctn; T.cops += ctn * 0; T.basic += basic;
      return { n: i + 1, iid: r.iid, code: r.iid, it: r.it, pid: r.pid || '—', br: r.br, pinv: r.pinv || '—', hsn: r.hsn, gr: r.gr, unit: 'Kg', rem: '—', lr: '—', ch: r.ch, chd: '23-10-2026', lot: r.lot,
        ctn, cops: ctn * 0, q: qty[r.no] ?? inr(r.oq - r.dq, 3), rate: inr(r.rate, 2), basic: inr(basic, 2), dp: '0', dr: '0.00', fp: '0', fr: '0.00', ins: '0', ip: '0', ir: '0.00', tx: inr(basic, 2), gst: inr(g, 2), amt: inr(basic + g, 2),
        setQ: (e) => this.setState({ qty: { ...qty, [r.no]: e.target.value } }) }; });
    const gst = T.basic * 0.05; const gross = T.basic + gst; const net = Math.round(gross); const tds = Math.round(T.basic * 0.001);
    const pendAfter = rows.reduce((a, r) => a + (r.oq - r.dq) - num(qty[r.no] ?? (r.oq - r.dq)), 0);
    const addDays = (s, n) => { const [d, m, y] = s.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d) + n * 864e5); const z = (x) => String(x).padStart(2, '0'); return z(t.getUTCDate()) + '-' + z(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear(); };
    const ordLabel = rows.length === 0 ? 'Select order…' : rows.length === 1 ? rows[0].no + '/26-27 · ' + rows[0].it : rows.length + ' orders · ' + rows.map((r) => r.no).join(', ');
    const P0 = pt || { g: '—', del: '—', agent: '—', sp: '—', cr: 0, gstin: '—', pan: '—', out: '—', total: '—', bills: '—' };
    const BK = this.state.back;
    const BR = this.state.brec || null;
    const billV = { billNo: BR ? BR.no : 'PUR21329/26-27', billDt: BR ? BR.dt : '21-10-2026', regLabel: BR ? 'Purchase bill register' : 'Purchase bills', billTag: BR ? 'Saved' : '', billTagC: BR ? 'tag' : '',
      closeLabel: BR ? 'Close' : 'Cancel', saveLabel: BR ? (this.state.upd ? '✓ Updated' : 'Update bill') : 'Save bill', updNote: BR ? (this.state.upd ? 'Changes saved to ' + BR.no : 'Editing ' + BR.no) : '', doUpdate: () => { if (BR) this.setState({ upd: true }); } };
    return { ...billV, backHref: BK ? BK.href : 'PurchaseBillList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Purchase bill register',
      fitStyle: 'height: 100vh',
      theme, more: this.state.more, hist: this.state.hist, pick, po,
      colsLabel: this.state.more ? 'Fewer columns' : 'All columns',
      toggleCols: () => this.setState({ more: !this.state.more }),
      toggleHist: () => this.setState({ hist: !this.state.hist }),
      tcsY: this.state.tcs ? 'on' : '', tcsN: this.state.tcs ? '' : 'on',
      setTcsY: () => this.setState({ tcs: true }), setTcsN: () => this.setState({ tcs: false }),
      tabCls: { sum: tab === 'sum' ? 'on' : '', tr: tab === 'tr' ? 'on' : '', ei: tab === 'ei' ? 'on' : '', ref: tab === 'ref' ? 'on' : '' },
      setTab: { sum: () => this.setState({ tab: 'sum' }), tr: () => this.setState({ tab: 'tr' }), ei: () => this.setState({ tab: 'ei' }), ref: () => this.setState({ tab: 'ref' }) },
      isSum: tab === 'sum', isTr: tab === 'tr', isEi: tab === 'ei', isRef: tab === 'ref',
      openPick: () => this.setState({ pick: true, draft: sel.slice(), dqty: { ...qty } }),
      cancelPick: () => this.setState({ pick: false, draft: null, dqty: null }),
      applyPick: () => { const q = {}; draft.forEach((no) => { const r = find(no); q[no] = dqty[no] ?? inr(r.oq - r.dq, 3); }); this.setState({ pick: false, sel: draft.slice(), qty: q, draft: null, dqty: null }); },
      noDraft: dRows.length === 0,
      selText: dRows.length ? dRows.length + (dRows.length > 1 ? ' orders' : ' order') + ' selected · ' + dParty + ' · ' + inr(dQty, 3) + ' kg to bill' : 'Tick one or more orders of the same mill',
      items, hasItems: rows.length > 0, noItems: rows.length === 0, ordLabel, ordTag: rows.length ? 'Against ' + rows.map((r) => r.no).join(', ') : 'No order selected',
      party: party || '—', pt: { ...P0, cr: String(P0.cr), due: pt ? addDays('21-10-2026', P0.cr) : '—' },
      tot: { ctn: String(T.ctn), cops: String(T.cops), wt: inr(T.q, 3), basic: inr(T.basic, 2), dr: '0.00', fr: '0.00', ir: '0.00', tx: inr(T.basic, 2), gst: inr(gst, 2), amt: inr(gross, 2) },
      sum: { qty: inr(T.q, 3) + ' kg · ' + T.ctn + ' cartons', basic: '₹ ' + inr(T.basic, 2), half: '₹ ' + inr(gst / 2, 2), gst: '₹ ' + inr(gst, 2), gross: '₹ ' + inr(gross, 2), ro: '₹ ' + inr(net - gross, 2), net: '₹ ' + inr(net, 2),
        words: words(net), avg: T.q ? inr(gross / T.q, 2) : '0.00', bavg: T.q ? inr(T.basic / T.q, 2) : '0.00', tds: '− ₹ ' + inr(tds, 2), pay: '₹ ' + inr(net - tds, 2), pend: inr(Math.max(pendAfter, 0), 3) + ' kg',
        first: rows.length ? rows[0].no + '/26-27' : '—', firstDt: rows.length ? rows[0].dt : '—', firstIt: rows.length ? rows[0].it : '—', firstRate: rows.length ? inr(rows[0].rate, 2) : '—' },
      listHref: 'PurchaseBillList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class PurchaseBillView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""} fit`} style={sx(v.fitStyle)}>
        <div className="sbw">
          <Sidebar active="pb" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href={v.listHref}>
                {v.regLabel}
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                {v.billNo}
              </span>
              <span className={v.billTagC}>
                {v.billTag}
              </span>
            </div>
            <DcLink className="btn" href={v.listHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
              Show record
            </DcLink>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              Pending GRN
            </button>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Upload
            </button>
            <div className="nav" role="group" aria-label="Previous or next bill">
              <button type="button" aria-label="Previous bill">
                ‹
              </button>
              <span>
                PUR21329/26-27
              </span>
              <button type="button" aria-label="Next bill">
                ›
              </button>
            </div>
            <button className="btn" type="button" onClick={v.toggleHist} aria-pressed={v.hist}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              History
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.openPick}>
              + New bill
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <section className="sec">
                <div className="sh">
                  <h2>
                    Bill details
                  </h2>
                  <span className="tag">
                    {v.ordTag}
                  </span>
                  <span className="tag t-orange">
                    TDS 0.1%
                  </span>
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="p1">
                      Book
                    </label>
                    <select id="p1" className="inp">
                      <option>
                        Yarn purchase A/c new
                      </option>
                      <option>
                        Yarn purchase A/c · import
                      </option>
                      <option>
                        General purchase A/c
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="p2">
                      Entry no.
                    </label>
                    <input id="p2" className="inp" type="text" value={v.billNo} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p3">
                      Received date
                    </label>
                    <input id="p3" className="inp" type="text" value={v.billDt} />
                  </div>
                  <div className="fld">
                    <label>
                      TCS applicable?
                    </label>
                    <div className="yn" role="group" aria-label="TCS applicable?">
                      <button type="button" className={v.tcsN} onClick={v.setTcsN}>
                        No
                      </button>
                      <button type="button" className={v.tcsY} onClick={v.setTcsY}>
                        Yes
                      </button>
                    </div>
                  </div>
                  <div className="fld span2">
                    <label>
                      {"Against order "}
                      <span className="req">
                        *
                      </span>
                    </label>
                    <button className="inp pickf" type="button" onClick={v.openPick}>
                      <b>
                        {v.ordLabel}
                      </b>
                      <span>
                        Change
                      </span>
                    </button>
                  </div>
                  <div className="fld">
                    <label htmlFor="p5">
                      Party · from order
                    </label>
                    <input id="p5" className="inp" type="text" value={v.party} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p6">
                      Delivery to
                    </label>
                    <input id="p6" className="inp" type="text" value={v.pt?.del} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p7">
                      {"Supplier inv. no. "}
                      <span className="req">
                        *
                      </span>
                    </label>
                    <input id="p7" className="inp" type="text" defaultValue="13610" />
                  </div>
                  <div className="fld">
                    <label htmlFor="p8">
                      Supplier inv. date
                    </label>
                    <input id="p8" className="inp" type="text" defaultValue="21-10-2026" />
                  </div>
                  <div className="fld">
                    <label htmlFor="p9">
                      Agent
                    </label>
                    <input id="p9" className="inp" type="text" value={v.pt?.agent} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p10">
                      Salesperson
                    </label>
                    <input id="p10" className="inp" type="text" value={v.pt?.sp} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p11">
                      Credit days
                    </label>
                    <input id="p11" className="inp" type="text" value={v.pt?.cr} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p12">
                      Due date
                    </label>
                    <input id="p12" className="inp" type="text" value={v.pt?.due} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="p13">
                      D.O. no.
                    </label>
                    <input id="p13" className="inp" type="text" defaultValue="" />
                  </div>
                </div>
                <div className="strip">
                  <div>
                    <span>
                      GSTIN
                    </span>
                    <span>
                      {v.pt?.gstin}
                    </span>
                  </div>
                  <div>
                    <span>
                      PAN
                    </span>
                    <span>
                      {v.pt?.pan}
                    </span>
                  </div>
                  <div>
                    <span>
                      Payable to party
                    </span>
                    <span>
                      {v.pt?.out}
                    </span>
                  </div>
                  <div>
                    <span>
                      Order pending after this bill
                    </span>
                    <span>
                      {v.sum?.pend}
                    </span>
                  </div>
                  <div>
                    <span>
                      GSTR-2B
                    </span>
                    <span>
                      <span className="tag t-green">
                        Invoice matched
                      </span>
                    </span>
                  </div>
                </div>
              </section>
              <section className="sec items">
                <div className="sh">
                  <h2>
                    Items
                  </h2>
                  <button className="btn sm gh" type="button" onClick={v.toggleCols}>
                    {v.colsLabel}
                  </button>
                  <button className="btn sm" type="button" onClick={v.openPick}>
                    Change order
                  </button>
                  <button className="btn sm" type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                    Pending GRN
                  </button>
                </div>
                {v.hasItems ? (
                  <>
                    <div className="tw">
                      <table>
                        <thead>
                          <tr>
                            <th>
                              #
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Item code
                                </th>
                              </>
                            ) : null}
                            <th>
                              Item
                            </th>
                            <th>
                              Brand
                            </th>
                            <th>
                              Grade
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  HSN
                                </th>
                                <th>
                                  Unit
                                </th>
                                <th>
                                  L.R. no.
                                </th>
                                <th>
                                  Remark
                                </th>
                                <th>
                                  Challan no.
                                </th>
                                <th>
                                  Challan date
                                </th>
                              </>
                            ) : null}
                            <th>
                              Lot no.
                            </th>
                            <th className="r">
                              Cartons
                            </th>
                            {v.more ? (
                              <>
                                <th className="r">
                                  Cops
                                </th>
                              </>
                            ) : null}
                            <th className="r">
                              Weight kg
                            </th>
                            <th className="r">
                              Rate
                            </th>
                            <th className="r">
                              Basic amt
                            </th>
                            {v.more ? (
                              <>
                                <th className="r">
                                  Disc %
                                </th>
                                <th className="r">
                                  Disc ₹
                                </th>
                                <th className="r">
                                  Freight %
                                </th>
                                <th className="r">
                                  Freight ₹
                                </th>
                                <th className="r">
                                  Insurance %
                                </th>
                                <th className="r">
                                  Insurance ₹
                                </th>
                                <th className="r">
                                  Taxable
                                </th>
                                <th className="r">
                                  CGST + SGST
                                </th>
                              </>
                            ) : null}
                            <th className="r">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(v.items || []).map((it, $index) => (
                            <Fragment key={$index}>
                              <tr>
                                <td>
                                  {it?.n}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.code}
                                    </td>
                                  </>
                                ) : null}
                                <td>
                                  {it?.it}
                                </td>
                                <td className="t2">
                                  {it?.br}
                                </td>
                                <td className="t2">
                                  {it?.gr}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.hsn}
                                    </td>
                                    <td className="t2">
                                      {it?.unit}
                                    </td>
                                    <td className="t2">
                                      {it?.lr}
                                    </td>
                                    <td className="t2">
                                      {it?.rem}
                                    </td>
                                    <td className="t2">
                                      {it?.ch}
                                    </td>
                                    <td className="t2">
                                      {it?.chd}
                                    </td>
                                  </>
                                ) : null}
                                <td className="t2">
                                  {it?.lot}
                                </td>
                                <td className="r">
                                  {it?.ctn}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="r">
                                      {it?.cops}
                                    </td>
                                  </>
                                ) : null}
                                <td className="r">
                                  <input className="cin r w" type="text" value={it?.q} onChange={it?.setQ} aria-label="Weight kg to bill" />
                                </td>
                                <td className="r">
                                  {it?.rate}
                                </td>
                                <td className="r">
                                  {it?.basic}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="r">
                                      {it?.dp}
                                    </td>
                                    <td className="r">
                                      {it?.dr}
                                    </td>
                                    <td className="r">
                                      {it?.fp}
                                    </td>
                                    <td className="r">
                                      {it?.fr}
                                    </td>
                                    <td className="r">
                                      {it?.ip}
                                    </td>
                                    <td className="r">
                                      {it?.ir}
                                    </td>
                                    <td className="r">
                                      {it?.tx}
                                    </td>
                                    <td className="r">
                                      {it?.gst}
                                    </td>
                                  </>
                                ) : null}
                                <td className="r">
                                  {it?.amt}
                                </td>
                              </tr>
                            </Fragment>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td />
                            {v.more ? (
                              <>
                                <td />
                              </>
                            ) : null}
                            <td>
                              Total
                            </td>
                            <td />
                            <td />
                            {v.more ? (
                              <>
                                <td />
                                <td />
                                <td />
                                <td />
                                <td />
                                <td />
                              </>
                            ) : null}
                            <td />
                            <td className="r">
                              {v.tot?.ctn}
                            </td>
                            {v.more ? (
                              <>
                                <td className="r">
                                  {v.tot?.cops}
                                </td>
                              </>
                            ) : null}
                            <td className="r">
                              {v.tot?.wt}
                            </td>
                            <td />
                            <td className="r">
                              {v.tot?.basic}
                            </td>
                            {v.more ? (
                              <>
                                <td />
                                <td className="r">
                                  {v.tot?.dr}
                                </td>
                                <td />
                                <td className="r">
                                  {v.tot?.fr}
                                </td>
                                <td />
                                <td className="r">
                                  {v.tot?.ir}
                                </td>
                                <td className="r">
                                  {v.tot?.tx}
                                </td>
                                <td className="r">
                                  {v.tot?.gst}
                                </td>
                              </>
                            ) : null}
                            <td className="r">
                              {v.tot?.amt}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.noItems ? (
                  <>
                    <div className="tw">
                      <div className="empty">
                        <b style={{"color":"var(--t1)","fontWeight":"600"}}>
                          No order selected yet
                        </b>
                        <span>
                          Pick the order you are billing — party, items, rate and taxes fill in automatically.
                        </span>
                        <button className="btn pr" type="button" onClick={v.openPick}>
                          Select order
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </section>
              <section className="sec bottom">
                <div className="tabsx" role="tablist" aria-label="Summary and other details">
                  <button type="button" role="tab" className={v.tabCls?.sum} onClick={v.setTab?.sum}>
                    Summary
                  </button>
                  <button type="button" role="tab" className={v.tabCls?.tr} onClick={v.setTab?.tr}>
                    Transport
                  </button>
                  <button type="button" role="tab" className={v.tabCls?.ei} onClick={v.setTab?.ei}>
                    {"E-invoice, e-way & import"}
                  </button>
                  <button type="button" role="tab" className={v.tabCls?.ref} onClick={v.setTab?.ref}>
                    References
                  </button>
                </div>
                {v.isSum ? (
                  <>
                    <div className="cols3">
                      <div className="box">
                        <h3>
                          Tax summary
                        </h3>
                        <div className="kv">
                          <span>
                            Taxable amount
                          </span>
                          <span>
                            {v.sum?.basic}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            CGST 2.5%
                          </span>
                          <span>
                            {v.sum?.half}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            SGST 2.5%
                          </span>
                          <span>
                            {v.sum?.half}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            IGST
                          </span>
                          <span>
                            ₹ 0.00
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            TCS
                          </span>
                          <span>
                            ₹ 0.00
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            TDS basic
                          </span>
                          <span>
                            {v.sum?.basic}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            TDS 0.1%
                          </span>
                          <span>
                            {v.sum?.tds}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Average rate
                          </span>
                          <span>
                            {v.sum?.avg}
                          </span>
                        </div>
                        <button className="btn sm" type="button" style={{"alignSelf":"flex-start"}}>
                          TDS details
                        </button>
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
                            {v.sum?.qty}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Gross amount
                          </span>
                          <span>
                            {v.sum?.basic}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Net GST
                          </span>
                          <span>
                            {v.sum?.gst}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Grand total
                          </span>
                          <span>
                            {v.sum?.gross}
                          </span>
                        </div>
                        <div className="fld">
                          <label htmlFor="pa1">
                            Add / less amount (+/−)
                          </label>
                          <input id="pa1" className="inp" type="text" defaultValue="0.00" />
                        </div>
                        <div className="kv">
                          <span>
                            Round off
                          </span>
                          <span>
                            {v.sum?.ro}
                          </span>
                        </div>
                        <div className="kv" style={{"paddingTop":"8px","borderTop":"1px dashed var(--bd2)"}}>
                          <span style={{"color":"var(--t1)","fontWeight":"600"}}>
                            Net amount
                          </span>
                          <span className="bigtotal">
                            {v.sum?.net}
                          </span>
                        </div>
                        <span className="words">
                          {v.sum?.words}
                        </span>
                        <div className="kv">
                          <span>
                            Payable after TDS
                          </span>
                          <span>
                            {v.sum?.pay}
                          </span>
                        </div>
                      </div>
                      <div className="box">
                        <h3>
                          {"Payment & remark"}
                        </h3>
                        <div className="fld">
                          <label htmlFor="pq1">
                            Collection person
                          </label>
                          <select id="pq1" className="inp">
                            <option>
                              Prakash
                            </option>
                            <option>
                              Self
                            </option>
                          </select>
                        </div>
                        <div className="fld">
                          <label htmlFor="pq2">
                            Currency
                          </label>
                          <select id="pq2" className="inp">
                            <option>
                              INR
                            </option>
                            <option>
                              USD
                            </option>
                          </select>
                        </div>
                        <textarea className="inp" aria-label="Remark" placeholder="Remark" />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isTr ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="q1">
                          Transporter
                        </label>
                        <select id="q1" className="inp">
                          <option>
                            Navkar Roadlines
                          </option>
                          <option>
                            Jay Ambe Roadlines
                          </option>
                        </select>
                      </div>
                      <div className="fld">
                        <label htmlFor="q2">
                          L.R. no.
                        </label>
                        <input id="q2" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="q3">
                          L.R. date
                        </label>
                        <input id="q3" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="q4">
                          Vehicle no.
                        </label>
                        <input id="q4" className="inp" type="text" defaultValue="GJ-19-Z-0040" />
                      </div>
                      <div className="fld">
                        <label htmlFor="q5">
                          Driver name
                        </label>
                        <input id="q5" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="q6">
                          Driver license
                        </label>
                        <input id="q6" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="q7">
                          No. of parcels
                        </label>
                        <input id="q7" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="q8">
                          Godown
                        </label>
                        <input id="q8" className="inp" type="text" defaultValue="Sachin GIDC" />
                      </div>
                      <div className="fld">
                        <label htmlFor="q9">
                          Transporter expense
                        </label>
                        <input id="q9" className="inp" type="text" defaultValue="0.00" />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isEi ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="w1">
                          E-way bill no.
                        </label>
                        <input id="w1" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="w2">
                          IRN
                        </label>
                        <input id="w2" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="w3">
                          Ack no.
                        </label>
                        <input id="w3" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="w4">
                          Ack date
                        </label>
                        <input id="w4" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="w5">
                          B.E. date
                        </label>
                        <input id="w5" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="w6">
                          Port
                        </label>
                        <input id="w6" className="inp" type="text" />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isRef ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="z3">
                          Ref. inv. no.
                        </label>
                        <input id="z3" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="z4">
                          Ref. inv. date
                        </label>
                        <input id="z4" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="z5">
                          Adj. bill no.
                        </label>
                        <input id="z5" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="z6">
                          Adj. bill date
                        </label>
                        <input id="z6" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="z7">
                          Debit note no.
                        </label>
                        <input id="z7" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="z8">
                          Debit note date
                        </label>
                        <input id="z8" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="z9">
                          DCPI no.
                        </label>
                        <input id="z9" className="inp" type="text" />
                      </div>
                    </div>
                  </>
                ) : null}
              </section>
              <div className="actbar">
                <span className="actsum">
                  <span>
                    {"Qty "}
                    <b>
                      {v.tot?.wt}{" kg"}
                    </b>
                  </span>
                  <span>
                    {"Net "}
                    <b>
                      {v.sum?.net}
                    </b>
                  </span>
                </span>
                {' '}
                <select className="inp" aria-label="More actions">
                  <option>
                    More…
                  </option>
                  <option>
                    Party details
                  </option>
                  <option>
                    Adjustment details
                  </option>
                </select>
                {' '}
                <button className="btn no" type="button">
                  Delete
                </button>
                <div style={{"flex":"1"}} />
                <span className="muted" style={{"fontSize":"13px"}}>
                  {v.updNote}
                </span>
                <DcLink className="btn gh" href={v.backHref}>
                  {v.closeLabel}
                </DcLink>
                {' '}
                <button className="btn" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9V2h12v7" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect width="12" height="8" x="6" y="14" />
                  </svg>
                  {"Save & print"}
                </button>
                {' '}
                <button className="btn pr" type="button" onClick={v.doUpdate}>
                  {v.saveLabel}
                </button>
              </div>
            </div>
            {v.hist ? (
              <>
                <aside className="rp" aria-label="Supplier history">
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"0 20px","minHeight":"56px","borderBottom":"1px solid var(--bd)"}}>
                    <b style={{"fontWeight":"600","flex":"1"}}>
                      Supplier history
                    </b>
                    <button className="btn sm gh" type="button" onClick={v.toggleHist} aria-label="Close history">
                      ✕
                    </button>
                  </div>
                  <div className="hist">
                    <div className="muted" style={{"fontSize":"13px"}}>
                      {v.party}
                    </div>
                    <div className="hcard">
                      <span className="hk">
                        Total purchase · FY 26-27
                      </span>
                      <div className="kv">
                        <span>
                          Bills
                        </span>
                        <span>
                          {v.pt?.bills}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Value
                        </span>
                        <span>
                          {v.pt?.total}
                        </span>
                      </div>
                    </div>
                    <div className="hcard">
                      <span className="hk">
                        This bill
                      </span>
                      <div className="kv">
                        <span>
                          Bill amount
                        </span>
                        <span>
                          {v.sum?.net}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          TDS
                        </span>
                        <span>
                          {v.sum?.tds}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Payable
                        </span>
                        <span>
                          {v.sum?.pay}
                        </span>
                      </div>
                      <span className="tag t-orange" style={{"alignSelf":"flex-start"}}>
                        {"Due "}{v.pt?.due}
                      </span>
                    </div>
                    <div className="hcard">
                      <span className="hk">
                        Billing against
                      </span>
                      <div className="kv">
                        <span>
                          Order no.
                        </span>
                        <span>
                          {v.sum?.first}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Date
                        </span>
                        <span>
                          {v.sum?.firstDt}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Item
                        </span>
                        <span>
                          {v.sum?.firstIt}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Rate
                        </span>
                        <span>
                          {v.sum?.firstRate}
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Pending after bill
                        </span>
                        <span>
                          {v.sum?.pend}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>
              </>
            ) : null}
          </div>
        </div>
        {v.pick ? (
          <>
            <div className="ovl">
              <div className="mdl" role="dialog" aria-modal="true" aria-label="New purchase bill · select purchase order">
                <div className="mh">
                  <div style={{"flex":"1","display":"flex","flexDirection":"column","gap":"6px"}}>
                    <b>
                      New purchase bill · select purchase order
                    </b>
                    <div className="stepper">
                      <span className="on">
                        <i>
                          1
                        </i>
                        {" Select purchase order"}
                      </span>
                      <span>
                        →
                      </span>
                      <span>
                        <i>
                          2
                        </i>
                        {" Check items & save bill"}
                      </span>
                    </div>
                  </div>
                  <button className="btn sm gh" type="button" onClick={v.cancelPick} aria-label="Close">
                    ✕
                  </button>
                </div>
                <div className="mf">
                  <input className="inp" type="search" placeholder="Search order no., party or item" aria-label="Search orders" />
                  <select className="inp" aria-label="Party">
                    <option>
                      All parties
                    </option>
                  </select>
                  <select className="inp" aria-label="Item">
                    <option>
                      All items
                    </option>
                  </select>
                  <span className="muted" style={{"alignSelf":"center","fontSize":"13px"}}>
                    Only approved orders with pending receipt are shown
                  </span>
                </div>
                <div className="mt">
                  <table>
                    <thead>
                      <tr>
                        <th style={{"width":"40px"}} />
                        <th>
                          Order
                        </th>
                        <th>
                          Mill / party
                        </th>
                        <th>
                          Item
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th className="r">
                          Ordered kg
                        </th>
                        <th className="r">
                          Received
                        </th>
                        <th className="r">
                          Pending kg
                        </th>
                        <th className="r">
                          Bill qty kg
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(v.po || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <tr className={o?.rc}>
                            <td>
                              <input className="cb" type="checkbox" checked={o?.on} onChange={o?.tog} aria-label={`Select order ${o?.no ?? ""}`} />
                            </td>
                            <td>
                              <div style={{"fontWeight":"500"}}>
                                {o?.no}
                              </div>
                              <div className="sub">
                                {o?.dt}{" · "}{o?.age}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.p}
                              </div>
                              <div className="sub">
                                {o?.g}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.it}
                              </div>
                              <div className="sub">
                                {o?.br}{" · "}{o?.lot}
                              </div>
                            </td>
                            <td className="r">
                              {o?.rate}
                            </td>
                            <td className="r">
                              {o?.oq}
                            </td>
                            <td className="r t2">
                              {o?.dq}
                            </td>
                            <td className="r" style={{"fontWeight":"600"}}>
                              {o?.pq}
                            </td>
                            <td className="r">
                              <input className="cin r" type="text" value={o?.bq} onChange={o?.setQ} aria-label="Quantity to bill" style={{"width":"110px"}} />
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mb">
                  <span style={{"flex":"1"}}>
                    {v.selText}
                  </span>
                  <button className="btn gh" type="button" onClick={v.cancelPick}>
                    Cancel
                  </button>
                  <button className="btn pr" type="button" onClick={v.applyPick} disabled={v.noDraft}>
                    Continue to bill →
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
        <div className="aiw">
          <Assistant page="pb" />
        </div>
      </div>
      </>
    );
  }
}

export default function PurchaseBill(props) {
  const theme = useTheme();
  return <PurchaseBillView {...props} theme={theme} />;
}
