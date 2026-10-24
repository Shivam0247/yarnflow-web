/* eslint-disable */
// Dispatch — converted 1:1 from the YarnFlow design (Dispatch.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Dispatch.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { z: 1, more: false, hist: true, tcs: false, tab: 'sum', pick: null, sel: p.startPicker ? [] : ["SAL11842"], qty: p.startPicker ? {} : {"SAL11842": "619.430"}, draft: null, dqty: null }; }
  componentDidMount() {
    if (!this.props.startPicker) { const rd = () => { try { const raw = window.localStorage.getItem('yf-open-sb'); if (raw && raw !== this._raw) { this._raw = raw; this.setState({ brec: JSON.parse(raw), upd: false }); } } catch (e) {} }; this._rd = rd; rd(); this._iv = setInterval(rd, 700); try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {} }
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
    const PO = [{"no": "SAL11842", "dt": "23-10-2026", "p": "Rannade Textile", "g": "Rannade Textile", "it": "50/48 FDY NLBS", "br": "Wellknown", "lot": "R0484", "rate": 152.25, "oq": 1800, "dq": 0, "age": "today", "gr": "1ST", "iid": "263-I", "hsn": "54024700", "pid": "PUR20413/26-27", "pinv": "RV0020024097", "ch": "DS24248/26-27"}, {"no": "SAL11840", "dt": "22-10-2026", "p": "Rannade Textile", "g": "Rannade Textile", "it": "75/36 FDY", "br": "Reliance", "lot": "316C1S", "rate": 128, "oq": 1200, "dq": 0, "age": "1 day", "gr": "A+", "iid": "118-F", "hsn": "54024700", "pid": "PUR20398/26-27", "pinv": "RIL/88120", "ch": "DS24250/26-27"}, {"no": "SAL02722", "dt": "21-05-2026", "p": "Bhagwati Filaments", "g": "Bhagwati Filaments", "it": "50/24 SD CAT", "br": "Reliance", "lot": "356C9S", "rate": 179.6, "oq": 10050, "dq": 9335.8, "age": "155 days", "gr": "A+", "iid": "204-C", "hsn": "54024700", "pid": "PUR19022/26-27", "pinv": "RIL/80211", "ch": "DS24251/26-27"}, {"no": "SAL03514", "dt": "05-06-2026", "p": "Bansam Fabrics", "g": "Bansam Fabrics", "it": "50/48 FDY", "br": "Reliance", "lot": "338C1M", "rate": 140, "oq": 36050, "dq": 34827.45, "age": "140 days", "gr": "A+", "iid": "261-F", "hsn": "54024700", "pid": "PUR19310/26-27", "pinv": "RIL/81877", "ch": "DS24252/26-27"}, {"no": "SAL04254", "dt": "19-06-2026", "p": "Shree Rudraksha Poly", "g": "Shree Rudraksha Poly", "it": "50/12 BRT", "br": "Durga", "lot": "SIBS1008", "rate": 185.14, "oq": 15050, "dq": 14526.4, "age": "126 days", "gr": "F1", "iid": "091-B", "hsn": "54024700", "pid": "PUR19550/26-27", "pinv": "DS/2231", "ch": "DS24253/26-27"}, {"no": "SAL04424", "dt": "23-06-2026", "p": "Jigita Fab LLP", "g": "Jigita Fab LLP", "it": "Muskan Bright", "br": "J.J. Industries", "lot": "MB123", "rate": 370, "oq": 2050, "dq": 1478.26, "age": "122 days", "gr": "1ST", "iid": "310-M", "hsn": "54023300", "pid": "PUR19601/26-27", "pinv": "JJ/1180", "ch": "DS24254/26-27"}, {"no": "SAL05058", "dt": "02-07-2026", "p": "Ganpati Silk Mill", "g": "Kanvi Corporation", "it": "50/24 SD CAT", "br": "Reliance", "lot": "356C9S", "rate": 151, "oq": 5050, "dq": 4453.69, "age": "113 days", "gr": "PQ", "iid": "204-C", "hsn": "54024700", "pid": "PUR19702/26-27", "pinv": "RIL/83390", "ch": "DS24255/26-27"}];
    const PT = {"Rannade Textile": {"g": "Rannade Textile", "agent": "Nilkanthbhai Ghariwala", "sp": "Manoj Bhai", "cr": 15, "gstin": "24AARFR5521K1Z4", "pan": "AARFR5521K", "out": "₹ 2,87,050", "total": "₹ 2,87,050", "bills": "14", "del": "Rannade Textile"}, "Bhagwati Filaments": {"g": "Bhagwati Filaments", "agent": "Avi M", "sp": "Avi M", "cr": 4, "gstin": "24AABCB4410K1Z3", "pan": "AABCB4410K", "out": "₹ 8,12,540", "total": "₹ 42,18,900", "bills": "38", "del": "Bhagwati Filaments · Unit 2"}, "Bansam Fabrics": {"g": "Bansam Fabrics", "agent": "Ramji", "sp": "Rajesh Shah", "cr": 1, "gstin": "24AADFB7781M1Z9", "pan": "AADFB7781M", "out": "₹ 18,60,000", "total": "₹ 50,47,000", "bills": "61", "del": "Bansam Fabrics"}, "Shree Rudraksha Poly": {"g": "Shree Rudraksha Poly", "agent": "Direct", "sp": "Avi M", "cr": 4, "gstin": "24AAHFS3302P1Z1", "pan": "AAHFS3302P", "out": "₹ 6,40,210", "total": "₹ 27,86,300", "bills": "29", "del": "Shree Rudraksha Poly"}, "Jigita Fab LLP": {"g": "Jigita Fab LLP", "agent": "Direct", "sp": "Avi M", "cr": 15, "gstin": "24AAKFJ9910R1Z7", "pan": "AAKFJ9910R", "out": "₹ 2,10,000", "total": "₹ 12,46,500", "bills": "11", "del": "Jigita Fab LLP"}, "Ganpati Silk Mill": {"g": "Kanvi Corporation", "agent": "Krish J", "sp": "Rajesh Shah", "cr": 15, "gstin": "24AAEFG4471C1Z2", "pan": "AAEFG4471C", "out": "₹ 3,95,600", "total": "₹ 14,02,800", "bills": "17", "del": "Ganpati Silk Mill"}};
    const TRS = ['Shivam Transport Services', 'Navkar Roadlines', 'Jay Ambe Roadlines', 'VRL Logistics'];
    PO.forEach((r, i) => { const pend = r.oq - r.dq; r.ctn = r.no === 'SAL11842' ? 24 : Math.max(6, Math.min(32, Math.round(pend / 60))); r.sq = r.no === 'SAL11842' ? 619.43 : Math.min(pend, Math.round(r.ctn * 38.71 * 1000) / 1000); r.dsdt = r.dt; r.tr = TRS[i % TRS.length]; r.veh = 'GJ-05-' + ['BX', 'AV', 'CT', 'UU'][i % 4] + '-' + (4120 + i * 377); r.dp = r.g; });
    const find = (no) => PO.find((r) => r.no === no);
    const pick = this.state.pick ?? (this.props.startPicker ?? false);
    const sel = this.state.sel; const qty = this.state.qty;
    const draft = this.state.draft ?? sel; const dqty = this.state.dqty ?? qty;
    const dRows = PO.filter((r) => draft.indexOf(r.no) >= 0);
    const dParty = dRows.length ? dRows[0].p : null;
    const po = PO.map((r) => { const on = draft.indexOf(r.no) >= 0; const other = dParty && r.p !== dParty; const pend = r.oq - r.dq;
      return { no: r.no, dt: r.dt, p: r.p, g: r.g, it: r.it, br: r.br, lot: r.lot, gr: r.gr, age: r.age, rate: inr(r.rate, 2), oq: inr(r.oq, 3), dq: inr(r.dq, 3), pq: inr(pend, 3),
        ds: r.ch, dsdt: r.dsdt, dp: r.dp, ctn: String(r.ctn), sq: inr(r.sq, 3), tr: r.tr, veh: r.veh, bq: dqty[r.no] ?? inr(r.sq, 3), on, rc: on ? 'on' : (other ? 'off' : ''),
        setQ: (e) => this.setState({ draft, dqty: { ...dqty, [r.no]: e.target.value } }),
        tog: () => this.setState({ draft: on ? draft.filter((x) => x !== r.no) : (other ? [r.no] : draft.concat([r.no])), dqty }) }; });
    const dQty = dRows.reduce((a, r) => a + num(dqty[r.no] ?? r.sq), 0);
    const rows = sel.map(find).filter(Boolean);
    const party = rows.length ? rows[0].p : null; const pt = party ? PT[party] : null;
    let T = { q: 0, ctn: 0, cops: 0, basic: 0 };
    const items = rows.map((r, i) => { const q = num(qty[r.no] ?? r.sq); const basic = q * r.rate; const g = basic * 0.05; const ctn = q > 0 ? (Math.abs(q - r.sq) < 0.001 ? r.ctn : Math.max(1, Math.round(q / (r.sq / r.ctn)))) : 0;
      T.q += q; T.ctn += ctn; T.cops += ctn * 4; T.basic += basic;
      return { n: i + 1, iid: r.iid, code: r.iid, it: r.it, pid: r.pid || '—', br: r.br, pinv: r.pinv || '—', hsn: r.hsn, gr: r.gr, unit: 'Kg', rem: '—', lr: '—', ch: r.ch, chd: '23-10-2026', lot: r.lot,
        ctn, cops: ctn * 4, q: qty[r.no] ?? inr(r.sq, 3), rate: inr(r.rate, 2), basic: inr(basic, 2), dp: '0', dr: '0.00', fp: '0', fr: '0.00', ins: '0', ip: '0', ir: '0.00', tx: inr(basic, 2), gst: inr(g, 2), amt: inr(basic + g, 2),
        setQ: (e) => this.setState({ qty: { ...qty, [r.no]: e.target.value } }) }; });
    const gst = T.basic * 0.05; const gross = T.basic + gst; const net = Math.round(gross); const tds = 0;
    const pendAfter = rows.reduce((a, r) => a + (r.oq - r.dq) - num(qty[r.no] ?? (r.oq - r.dq)), 0);
    const addDays = (s, n) => { const [d, m, y] = s.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d) + n * 864e5); const z = (x) => String(x).padStart(2, '0'); return z(t.getUTCDate()) + '-' + z(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear(); };
    const ordLabel = rows.length === 0 ? 'Select dispatch schedule…' : rows.length === 1 ? rows[0].ch + ' · order ' + rows[0].no + ' · ' + rows[0].it : rows.length + ' schedules · ' + rows.map((r) => r.ch).join(', ');
    const P0 = pt || { g: '—', del: '—', agent: '—', sp: '—', cr: 0, gstin: '—', pan: '—', out: '—', total: '—', bills: '—' };
    const BK = this.state.back;
    const BR = this.state.brec || null;
    const billV = { billNo: BR ? BR.no : 'GU22854/26-27', billDt: BR ? BR.dt : '23-10-2026', regLabel: BR ? 'Sale bill register' : 'Sale bills', billTag: BR ? 'Saved' : '', billTagC: BR ? 'tag' : '',
      closeLabel: BR ? 'Close' : 'Cancel', saveLabel: BR ? (this.state.upd ? '✓ Updated' : 'Update bill') : 'Save bill', updNote: BR ? (this.state.upd ? 'Changes saved to ' + BR.no : 'Editing ' + BR.no) : '', doUpdate: () => { if (BR) this.setState({ upd: true }); } };
    return { ...billV, backHref: BK ? BK.href : 'SaleBillList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Sale bill register',
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
      applyPick: () => { const q = {}; draft.forEach((no) => { const r = find(no); q[no] = dqty[no] ?? inr(r.sq, 3); }); this.setState({ pick: false, sel: draft.slice(), qty: q, draft: null, dqty: null }); },
      noDraft: dRows.length === 0,
      selText: dRows.length ? dRows.length + (dRows.length > 1 ? ' schedules' : ' schedule') + ' selected · ' + dParty + ' · ' + inr(dQty, 3) + ' kg to bill' : 'Tick one or more dispatch schedules of the same party',
      kp: (() => { const n = (x) => parseFloat(String(x || '').replace(/[^0-9.]/g, '')) || 0; const LIM = { 'Bhagwati Filaments': 3000000, 'Rannade Textile': 1500000, 'Jigita Fab LLP': 1000000, 'Bansam Fabrics': 2500000, 'Shree Rudraksha Poly': 1500000, 'Ganpati Silk Mill': 1200000 };
        const DUE = { 'Bhagwati Filaments': '₹ 1,04,200 · 6 d late', 'Jigita Fab LLP': '₹ 9,60,000 · 41 d late', 'Ganpati Silk Mill': '₹ 1,74,405 · 4 d late' };
        const used = n(P0.out); const lim = LIM[party] || 2000000; const pct = Math.min(100, Math.round(used / lim * 100)); const due = DUE[party] || 'None';
        return { out: P0.out, lim: '₹ ' + inr(lim, 0), pct: pct + '% used', bar: 'width: ' + pct + '%' + (pct >= 80 ? '; background: #EF4444' : ''), due, dc: due === 'None' ? 'kp ok' : 'kp due' }; })(),
      trName: rows.length ? rows[0].tr : 'Shivam Transport Services', trVeh: rows.length ? rows[0].veh : '',
      items, hasItems: rows.length > 0, noItems: rows.length === 0, ordLabel, ordTag: rows.length ? 'From ' + rows.map((r) => r.ch).join(', ') : 'No schedule selected',
      party: party || '—', pt: { ...P0, cr: String(P0.cr), due: pt ? addDays('23-10-2026', P0.cr) : '—' },
      tot: { ctn: String(T.ctn), cops: String(T.cops), wt: inr(T.q, 3), basic: inr(T.basic, 2), dr: '0.00', fr: '0.00', ir: '0.00', tx: inr(T.basic, 2), gst: inr(gst, 2), amt: inr(gross, 2) },
      sum: { qty: inr(T.q, 3) + ' kg · ' + T.ctn + ' cartons', basic: '₹ ' + inr(T.basic, 2), half: '₹ ' + inr(gst / 2, 2), gst: '₹ ' + inr(gst, 2), gross: '₹ ' + inr(gross, 2), ro: '₹ ' + inr(net - gross, 2), net: '₹ ' + inr(net, 2),
        words: words(net), avg: T.q ? inr(gross / T.q, 2) : '0.00', bavg: T.q ? inr(T.basic / T.q, 2) : '0.00', tds: '− ₹ ' + inr(tds, 2), pay: '₹ ' + inr(net - tds, 2), pend: inr(Math.max(pendAfter, 0), 3) + ' kg',
        first: rows.length ? rows[0].no + '/26-27' : '—', firstDt: rows.length ? rows[0].dt : '—', firstIt: rows.length ? rows[0].it : '—', firstRate: rows.length ? inr(rows[0].rate, 2) : '—' },
      listHref: 'SaleBillList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class DispatchView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""} fit`} style={sx(v.fitStyle)}>
        <div className="sbw">
          <Sidebar active="disp" />
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
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
              Dispatch details
            </button>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              E-invoice
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
                GU22854/26-27
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
                  <div className="kps">
                    <span className="kp">
                      <span>
                        Outstanding
                      </span>
                      <b>
                        {v.kp?.out}
                      </b>
                    </span>
                    <span className="kp">
                      <span>
                        Credit limit
                      </span>
                      <b>
                        {v.kp?.lim}
                      </b>
                      <span className="mt" aria-hidden="true">
                        <i style={sx(v.kp?.bar)} />
                      </span>
                      <span>
                        {v.kp?.pct}
                      </span>
                    </span>
                    <span className={v.kp?.dc}>
                      <span>
                        Due payment
                      </span>
                      <b>
                        {v.kp?.due}
                      </b>
                    </span>
                  </div>
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="b1">
                      Book
                    </label>
                    <select id="b1" className="inp">
                      <option>
                        Yarn sales tax A/c (Umiya)
                      </option>
                      <option>
                        Yarn sales A/c · export
                      </option>
                      <option>
                        General sales A/c
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="b2">
                      Bill no.
                    </label>
                    <input id="b2" className="inp" type="text" value={v.billNo} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b3">
                      Bill date
                    </label>
                    <input id="b3" className="inp" type="text" value={v.billDt} />
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
                      {"Against dispatch schedule "}
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
                    <label htmlFor="b5">
                      Party · from schedule
                    </label>
                    <input id="b5" className="inp" type="text" value={v.party} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b6">
                      Party group
                    </label>
                    <input id="b6" className="inp" type="text" value={v.pt?.g} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b7">
                      Delivery party
                    </label>
                    <input id="b7" className="inp" type="text" value={v.pt?.del} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b8">
                      Agent / broker
                    </label>
                    <input id="b8" className="inp" type="text" value={v.pt?.agent} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b9">
                      Salesperson
                    </label>
                    <input id="b9" className="inp" type="text" value={v.pt?.sp} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b10">
                      Credit days
                    </label>
                    <input id="b10" className="inp" type="text" value={v.pt?.cr} readOnly />
                  </div>
                  <div className="fld">
                    <label htmlFor="b11">
                      Due date
                    </label>
                    <input id="b11" className="inp" type="text" value={v.pt?.due} readOnly />
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
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                    Pending challans
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
                                  Item id
                                </th>
                              </>
                            ) : null}
                            <th>
                              Item
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Purchase id
                                </th>
                              </>
                            ) : null}
                            <th>
                              Brand
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Pur. inv. no.
                                </th>
                                <th>
                                  HSN
                                </th>
                              </>
                            ) : null}
                            <th>
                              Grade
                            </th>
                            {v.more ? (
                              <>
                                <th>
                                  Unit
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
                                  Insurance
                                </th>
                                <th className="r">
                                  GST 5%
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
                                      {it?.iid}
                                    </td>
                                  </>
                                ) : null}
                                <td>
                                  {it?.it}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.pid}
                                    </td>
                                  </>
                                ) : null}
                                <td className="t2">
                                  {it?.br}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.pinv}
                                    </td>
                                    <td className="t2">
                                      {it?.hsn}
                                    </td>
                                  </>
                                ) : null}
                                <td className="t2">
                                  {it?.gr}
                                </td>
                                {v.more ? (
                                  <>
                                    <td className="t2">
                                      {it?.unit}
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
                                      {it?.ins}
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
                            {v.more ? (
                              <>
                                <td />
                              </>
                            ) : null}
                            <td />
                            {v.more ? (
                              <>
                                <td />
                                <td />
                              </>
                            ) : null}
                            <td />
                            {v.more ? (
                              <>
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
                {' '}
                <label className="chk">
                  <input type="checkbox" />
                  {" Qty not effect in GST HSN summary"}
                </label>
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
                    {"E-way bill & e-invoice"}
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
                            Avg rate (with GST)
                          </span>
                          <span>
                            {v.sum?.avg}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Basic avg rate
                          </span>
                          <span>
                            {v.sum?.bavg}
                          </span>
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
                            GST
                          </span>
                          <span>
                            {v.sum?.gst}
                          </span>
                        </div>
                        <div className="kv">
                          <span>
                            Gross total
                          </span>
                          <span>
                            {v.sum?.gross}
                          </span>
                        </div>
                        <div className="fld">
                          <label htmlFor="a1">
                            Add / less amount (+/−)
                          </label>
                          <input id="a1" className="inp" type="text" defaultValue="0.00" />
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
                      </div>
                      <div className="box">
                        <h3>
                          Remark
                        </h3>
                        <textarea className="inp" aria-label="Remark" placeholder="Printed on the bill" style={{"height":"120px"}} />
                        <div className="fld">
                          <label htmlFor="a2">
                            Opportunity no.
                          </label>
                          <input id="a2" className="inp" type="text" placeholder="Optional" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isTr ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="o1">
                          Transporter · from schedule
                        </label>
                        <select id="o1" className="inp">
                          <option>
                            {v.trName}
                          </option>
                          <option>
                            Navkar Roadlines
                          </option>
                        </select>
                      </div>
                      <div className="fld">
                        <label htmlFor="o2">
                          Tran. doc no.
                        </label>
                        <input id="o2" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o3">
                          Tran. doc date
                        </label>
                        <input id="o3" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o4">
                          L.R. no.
                        </label>
                        <input id="o4" className="inp" type="text" defaultValue="8675" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o5">
                          L.R. date
                        </label>
                        <input id="o5" className="inp" type="text" defaultValue="23-10-2026" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o6">
                          Vehicle no.
                        </label>
                        <input id="o6" className="inp" type="text" value={v.trVeh} />
                      </div>
                      <div className="fld">
                        <label htmlFor="o7">
                          Driver name
                        </label>
                        <input id="o7" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o8">
                          Driver license
                        </label>
                        <input id="o8" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o9">
                          No. of parcels
                        </label>
                        <input id="o9" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o10">
                          Parcel no.
                        </label>
                        <input id="o10" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o11">
                          Godown
                        </label>
                        <input id="o11" className="inp" type="text" defaultValue="Shivam Transport Services" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o12">
                          Haste
                        </label>
                        <input id="o12" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="o13">
                          Policy no.
                        </label>
                        <input id="o13" className="inp" type="text" />
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isEi ? (
                  <>
                    <div className="ewb">
                      <div className="ewbh">
                        <span className="muted" style={{"fontSize":"13px"}}>
                          E-way bill
                        </span>
                        <span className="no">
                          3210 8812 4401
                        </span>
                        <span className="tag t-green">
                          Active
                        </span>
                        <span className="muted" style={{"fontSize":"13px"}}>
                          Valid till 24-10-2026 11:59 PM
                        </span>
                        <div style={{"flex":"1"}} />
                        <button className="btn sm" type="button">
                          Refresh from portal
                        </button>
                        <button className="btn sm" type="button">
                          Print EWB
                        </button>
                        <button className="btn sm" type="button" style={{"color":"#F87171"}}>
                          Cancel EWB
                        </button>
                      </div>
                      <div className="ewbg">
                        <div className="ewbc">
                          <h4>
                            {"Part A "}
                            <span className="tag">
                              Consignment
                            </span>
                          </h4>
                          <span>
                            Supplier GSTIN
                          </span>
                          <span>
                            24AAKCS7781M1Z2 · Shree Umiya Yarn
                          </span>
                          <span>
                            Dispatch from
                          </span>
                          <span>
                            Ring Road, Surat · 395002
                          </span>
                          <span>
                            Recipient GSTIN
                          </span>
                          <span>
                            {v.pt?.gstin}{" · "}{v.party}
                          </span>
                          <span>
                            Deliver to
                          </span>
                          <span>
                            {v.pt?.del}{" · Surat 395010"}
                          </span>
                          <span>
                            Document
                          </span>
                          <span>
                            Tax invoice · GU22854/26-27 · 23-10-2026
                          </span>
                          <span>
                            Value of goods
                          </span>
                          <span>
                            {v.sum?.gross}
                          </span>
                          <span>
                            HSN
                          </span>
                          <span>
                            54024700 · Synthetic filament yarn
                          </span>
                          <span>
                            Reason
                          </span>
                          <span>
                            Outward · Supply
                          </span>
                          <span>
                            Transporter
                          </span>
                          <span>
                            Shivam Transport Services · 24AAJFS4412Q1Z8
                          </span>
                          <span>
                            Approx. distance
                          </span>
                          <span>
                            12 km
                          </span>
                        </div>
                        <div className="ewbc">
                          <h4>
                            {"Part B "}
                            <span className="tag t-green">
                              Filled by transporter
                            </span>
                          </h4>
                          <span>
                            Filled by
                          </span>
                          <span>
                            Shivam Transport Services
                          </span>
                          <span>
                            Transporter ID
                          </span>
                          <span>
                            24AAJFS4412Q1Z8
                          </span>
                          <span>
                            Mode
                          </span>
                          <span>
                            Road
                          </span>
                          <span>
                            Vehicle no.
                          </span>
                          <span>
                            GJ-05-BX-4120
                          </span>
                          <span>
                            Vehicle type
                          </span>
                          <span>
                            Regular
                          </span>
                          <span>
                            Transport doc (LR)
                          </span>
                          <span>
                            8675 · 23-10-2026
                          </span>
                          <span>
                            From place
                          </span>
                          <span>
                            Surat, Gujarat
                          </span>
                          <span>
                            Entered on
                          </span>
                          <span>
                            23-10-2026 06:42 PM
                          </span>
                          <div className="pbh">
                            <span className="hk">
                              Vehicle updates by transporter
                            </span>
                            <div className="pbr">
                              <b>
                                GJ-05-BX-4120
                              </b>
                              <span>
                                Surat · 23-10-2026 06:42 PM
                              </span>
                            </div>
                            <div className="pbr" style={{"opacity":".6"}}>
                              <b>
                                Part B pending
                              </b>
                              <span>
                                Part A filed by us · 23-10-2026 05:18 PM
                              </span>
                            </div>
                          </div>
                          <div className="sync">
                            <span className="dotg" />
                            Synced from e-way bill portal · 2 min ago
                          </div>
                        </div>
                      </div>
                      <div className="einv">
                        <div>
                          <span>
                            E-invoice IRN
                          </span>
                          <span>
                            b29ad0e9925749231cb2186657ce…
                          </span>
                        </div>
                        <div>
                          <span>
                            Ack no.
                          </span>
                          <span>
                            1626 2640 6867 1
                          </span>
                        </div>
                        <div>
                          <span>
                            Ack date
                          </span>
                          <span>
                            23-10-2026 05:16 PM
                          </span>
                        </div>
                        <div>
                          <span>
                            Status
                          </span>
                          <span className="tag t-green" style={{"alignSelf":"flex-start"}}>
                            IRN generated
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isRef ? (
                  <>
                    <div className="ogrid">
                      <div className="fld">
                        <label htmlFor="r3">
                          P.O. no.
                        </label>
                        <input id="r3" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="r4">
                          Supplier
                        </label>
                        <input id="r4" className="inp" type="text" defaultValue="Wellknown Polyesters Ltd" />
                      </div>
                      <div className="fld">
                        <label htmlFor="r5">
                          Collection person
                        </label>
                        <input id="r5" className="inp" type="text" defaultValue="Ajay Joshi (Bhanu)" />
                      </div>
                      <div className="fld">
                        <label htmlFor="r6">
                          Adj. bill no.
                        </label>
                        <input id="r6" className="inp" type="text" />
                      </div>
                      <div className="fld">
                        <label htmlFor="r7">
                          Adj. bill date
                        </label>
                        <input id="r7" className="inp" type="text" />
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
                  <option>
                    Other fields
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
                <aside className="rp" aria-label="Party history">
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"0 20px","minHeight":"56px","borderBottom":"1px solid var(--bd)"}}>
                    <b style={{"fontWeight":"600","flex":"1"}}>
                      Party history
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
                        Total sale · FY 26-27
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
                          Received
                        </span>
                        <span>
                          ₹ 0.00
                        </span>
                      </div>
                      <div className="kv">
                        <span>
                          Balance
                        </span>
                        <span>
                          {v.sum?.net}
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
              <div className="mdl" role="dialog" aria-modal="true" aria-label="New sale bill · select dispatch schedule">
                <div className="mh">
                  <div style={{"flex":"1","display":"flex","flexDirection":"column","gap":"6px"}}>
                    <b>
                      New sale bill · select dispatch schedule
                    </b>
                    <div className="stepper">
                      <span className="on">
                        <i>
                          1
                        </i>
                        {" Select dispatch schedule"}
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
                  <input className="inp" type="search" placeholder="Search schedule no., party, item or lot" aria-label="Search dispatch schedules" />
                  <select className="inp" aria-label="Party">
                    <option>
                      All parties
                    </option>
                  </select>
                  <select className="inp" aria-label="Transporter">
                    <option>
                      All transporters
                    </option>
                  </select>
                  <span className="muted" style={{"alignSelf":"center","fontSize":"13px"}}>
                    Only approved dispatch schedules not yet billed are shown · details are fetched into the bill
                  </span>
                </div>
                <div className="mt">
                  <table>
                    <thead>
                      <tr>
                        <th style={{"width":"40px"}} />
                        <th>
                          Schedule
                        </th>
                        <th>
                          Party · delivery
                        </th>
                        <th>
                          Item
                        </th>
                        <th>
                          Order
                        </th>
                        <th className="r">
                          Cartons
                        </th>
                        <th className="r">
                          Sch. qty kg
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th>
                          Transporter · vehicle
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
                              <input className="cb" type="checkbox" checked={o?.on} onChange={o?.tog} aria-label={`Select schedule ${o?.ds ?? ""}`} />
                            </td>
                            <td>
                              <div style={{"fontWeight":"500"}}>
                                {o?.ds}
                              </div>
                              <div className="sub">
                                {o?.dsdt}{" · "}{o?.age}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.p}
                              </div>
                              <div className="sub">
                                {"To "}{o?.dp}
                              </div>
                            </td>
                            <td>
                              <div>
                                {o?.it}
                              </div>
                              <div className="sub">
                                {o?.br}{" · "}{o?.lot}{" · "}{o?.gr}
                              </div>
                            </td>
                            <td className="t2">
                              {o?.no}
                            </td>
                            <td className="r">
                              {o?.ctn}
                            </td>
                            <td className="r" style={{"fontWeight":"600"}}>
                              {o?.sq}
                            </td>
                            <td className="r">
                              {o?.rate}
                            </td>
                            <td>
                              <div>
                                {o?.tr}
                              </div>
                              <div className="sub">
                                {o?.veh}
                              </div>
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
          <Assistant page="disp" />
        </div>
      </div>
      </>
    );
  }
}

export default function Dispatch(props) {
  const theme = useTheme();
  return <DispatchView {...props} theme={theme} />;
}
