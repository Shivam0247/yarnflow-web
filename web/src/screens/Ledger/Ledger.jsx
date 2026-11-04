/* eslint-disable */
// Ledger — converted 1:1 from the YarnFlow design (Ledger.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Ledger.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: 'led', det: true, vt: 'All vouchers' }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  iso(d) { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; }
  async componentDidMount() {
    const api = this.api(); if (!api) return;
    try {
      const lk = await api.lookups(); let id = null;
      try { const p = JSON.parse(window.localStorage.getItem('yf-ledger') || 'null'); if (p && p.id) id = p.id; } catch (e) {}
      if (!id) id = (lk.customers.slice().sort((a, b) => b.balance - a.balance)[0] || lk.ledgers[0] || {}).id;
      const fy = api.fy || {}; this.setState({ lk, from: fy.startDate ? fy.startDate.split('-').reverse().join('-') : '', to: fy.endDate ? fy.endDate.split('-').reverse().join('-') : '' });
      if (id) this.open(id);
    } catch (e) { this.setState({ err: api.message(e) }); }
  }
  async open(id, from, to) {
    const api = this.api(); if (!api) return;
    try { window.localStorage.setItem('yf-ledger', JSON.stringify({ id })); } catch (e) {}
    const q = {}; const f = this.iso(from ?? this.state.from); const t = this.iso(to ?? this.state.to); if (f) q.from = f; if (t) q.to = t;
    try {
      const [led, sm, so] = await Promise.all([api.get('/reports/ledger/' + id, q), api.get('/accounts/' + id + '/summary'), api.get('/vouchers/sales-orders', { partyId: id, pageSize: 1 }).catch(() => ({ total: 0 }))]);
      this.setState({ id, led, sm, nOrd: so.total || 0 });
    } catch (e) { this.setState({ err: api.message(e) }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const tab = st.tab; const tc = {}, go = {}, show = {};
    ['led', 'bills', 'act'].forEach((k) => { tc[k] = k === tab ? 'tab on' : 'tab'; show[k] = k === tab; go[k] = () => this.setState({ tab: k }); });
    const inr = (n, d) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const base = { theme, tc, go, show, det: st.det, togDet: () => this.setState({ det: !st.det }), vt: st.vt, setVt: (e) => this.setState({ vt: e.target.value }) };
    const led = st.led; const lk = st.lk;
    if (!led || !lk) {
      const S = [['04-09-2026', 'Sales', 'c-blue', 'SI-0688', 'PFY 75/36 SD · 1,800 kg', '2,57,040.00', '', '5,67,290.00 Dr'], ['12-09-2026', 'Receipt', 'c-green', 'RC-0412', 'HDFC · NEFT UTR 4471', '', '2,00,000.00', '3,67,290.00 Dr'], ['18-09-2026', 'Sales', 'c-blue', 'SI-0721', 'Viscose 120D BR · 600 kg', '1,33,875.00', '', '5,01,165.00 Dr'], ['27-09-2026', 'Credit note', 'c-orange', 'CN-0034', 'Rate difference on SI-0688', '', '4,815.00', '4,96,350.00 Dr'], ['06-10-2026', 'Receipt', 'c-green', 'RC-0466', 'Cheque 018822 · SBI', '', '1,50,000.00', '3,46,350.00 Dr'], ['10-10-2026', 'Sales', 'c-blue', 'SI-0790', 'Nylon 6 FDY 40/34 · 500 kg', '1,40,700.00', '', '4,87,050.00 Dr'], ['15-10-2026', 'Journal', 'c-violet', 'JV-0102', 'Brokerage adjustment · Mahesh Shah', '', '4,700.00', '4,82,350.00 Dr']];
      const B = [['SI-0598', '05-08-2026', '19-09-2026', '79 days', 'tag t-red', '1,48,250.00', '1,48,250.00'], ['SI-0640', '22-08-2026', '06-10-2026', '62 days', 'tag t-red', '1,62,000.00', '1,62,000.00'], ['SI-0721', '18-09-2026', '02-11-2026', '35 days', 'tag t-orange', '1,33,875.00', '31,400.00'], ['SI-0790', '10-10-2026', '24-11-2026', '13 days', 'tag t-gray', '1,40,700.00', '1,40,700.00']];
      return { ...base, acc: { name: 'Krishna Textiles', code: 'ACC-SD-0412', ini: 'K', grp: 'Sundry Debtors › Surat', gstin: '24AABCK1234F1Z5', lim: '₹ 6,00,000 · 45 days', broker: 'Mahesh Shah' }, accId: '', accOpts: [{ v: '', l: 'Krishna Textiles' }], pickAcc: () => {},
        print: () => {}, excel: () => {}, whatsapp: () => {}, call: () => {}, editAcc: () => {}, recordPay: () => {}, payLabel: 'Record receipt',
        nBills: '4', nOrders: '38', ordHref: 'SalesOrderList.dc.html', from: '01-09-2026', to: '23-10-2026', setFrom: () => {}, setTo: () => {},
        op: { dt: '01-09-2026', bal: '3,10,250.00 Dr' }, rows: S.map((r) => ({ dt: r[0], vt: r[1], dc: 'dot ' + r[2], no: r[3], href: r[1] === 'Sales' ? 'Dispatch.dc.html' : '#', open: () => {}, part: r[4], dr: r[5], cr: r[6], bal: r[7] })),
        tot: { dr: '5,31,615.00', cr: '3,59,515.00', bal: '4,82,350.00 Dr' }, bills: B.map((b) => ({ no: b[0], dt: b[1], due: b[2], age: b[3], tc: b[4], amt: b[5], pend: b[6] })), billTot: '4,82,350.00', acts: [],
        bal: { op: '₹ 1,12,400.00 Dr', dr: '₹ 18,46,250.00', cr: '₹ 14,76,300.00', cl: '₹ 4,82,350.00 Dr' },
        ag: { aria: '0 to 30 days 1.41 lakh, 31 to 60 days 0.31 lakh, 61 to 90 days 3.10 lakh', w1: 'width: 29%', w2: 'width: 7%', w3: 'width: 64%', w4: 'width: 0%', a: '₹ 1,40,700', b: '₹ 31,400', c: '₹ 3,10,250', d: '₹ 0' } };
    }
    const sm = st.sm || {}; const A = sm.account || {}; const a0 = led.account;
    const dmy = (x) => (x ? String(x).slice(0, 10).split('-').reverse().join('-') : '');
    const VT = { SALE_BILL: ['Sales', 'c-blue'], GENERAL_SALE: ['Sales', 'c-blue'], PURCHASE_BILL: ['Purchase', 'c-orange'], GENERAL_PURCHASE: ['Purchase', 'c-orange'], RECEIPT: ['Receipt', 'c-green'], PAYMENT: ['Payment', 'c-green'], CREDIT_NOTE: ['Credit note', 'c-orange'], DEBIT_NOTE: ['Debit note', 'c-orange'], JOURNAL: ['Journal', 'c-violet'], CONTRA: ['Contra', 'c-violet'], SALE_RETURN: ['Sale return', 'c-orange'], PURCHASE_RETURN: ['Purchase return', 'c-orange'] };
    const OPEN = { SALE_BILL: ['Dispatch', 'yf-open-sb'], PURCHASE_BILL: ['PurchaseBill', 'yf-open-pb'], SALE_RETURN: ['SaleReturnView', 'yf-view-sr'], PURCHASE_RETURN: ['PurchaseReturnView', 'yf-view-pr'], GENERAL_SALE: ['GeneralSaleView', 'yf-view-gs'], GENERAL_PURCHASE: ['GeneralPurchaseView', 'yf-view-gp'] };
    const ents = led.entries.filter((e) => st.vt === 'All vouchers' || (VT[e.type] || [''])[0] === st.vt);
    const rows = ents.map((e) => { const v = VT[e.type] || [e.type, 'c-gray']; const o = OPEN[e.type];
      return { dt: dmy(e.date), vt: v[0], dc: 'dot ' + v[1], no: e.number, href: o ? o[0] + sfx + '.dc.html' : '#',
        open: (ev) => { if (ev && ev.preventDefault) ev.preventDefault(); if (!o) return; try { window.localStorage.setItem(o[1], JSON.stringify({ t: Date.now(), id: e.voucherId, no: e.number })); window.localStorage.setItem('yf-back', JSON.stringify({ href: 'Ledger' + sfx + '.dc.html', label: 'Ledger' })); } catch (er) {} this.go(o[0] + sfx + '.dc.html'); },
        part: (e.against || e.narration || '') + (st.det && e.qty ? ' · ' + inr(e.qty, 3) + ' kg' : '') + (st.det && e.refNo ? ' · ' + e.refNo : ''), dr: e.debit ? inr(e.debit, 2) : '', cr: e.credit ? inr(e.credit, 2) : '', bal: inr(e.balance, 2) + ' ' + (e.balanceType === 'DR' ? 'Dr' : 'Cr') }; });
    const now = Date.now();
    const ob = sm.bills || [];
    const bills = ob.map((b) => { const days = Math.max(0, Math.round((now - new Date(String(b.date).slice(0, 10) + 'T00:00:00').getTime()) / 864e5));
      return { no: b.number, dt: dmy(b.date), due: dmy(b.dueDate), age: days + ' days', tc: b.overdueDays > 60 ? 'tag t-red' : b.overdueDays > 0 ? 'tag t-orange' : 'tag t-gray', amt: inr(b.amount ?? b.net ?? 0, 2), pend: inr(b.pending, 2), days, pending: b.pending }; });
    const bk = [0, 0, 0, 0]; bills.forEach((b) => { bk[b.days <= 30 ? 0 : b.days <= 60 ? 1 : b.days <= 90 ? 2 : 3] += b.pending; });
    const bt = bk.reduce((x, y) => x + y, 0) || 1;
    const pdr = (n) => 'width: ' + Math.round(n / bt * 100) + '%';
    const nm = new Map(lk.ledgers.map((x) => [x.id, x]));
    const isSup = A.kind === 'SUPPLIER';
    const csv = () => { const L = [['Date', 'Voucher', 'No.', 'Particulars', 'Debit', 'Credit', 'Balance']].concat(rows.map((r) => [r.dt, r.vt, r.no, r.part, r.dr, r.cr, r.bal])); return L.map((x) => x.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n'); };
    const stmt = 'Statement of ' + a0.name + ' (' + dmy(led.from) + ' to ' + dmy(led.to) + '): closing balance ₹ ' + inr(led.closing, 2) + ' ' + (led.closingType === 'DR' ? 'Dr' : 'Cr') + (sm.overdue > 0 ? '. Overdue ₹ ' + inr(sm.overdue, 2) + '.' : '.');
    const mob = String(A.mobile || '').replace(/\D/g, '').slice(-10);
    return { ...base,
      acc: { name: a0.name, code: a0.code || 'ACC-' + a0.id, ini: a0.name.replace(/^(Shree|Shri|The)\s+/i, '').charAt(0), grp: (a0.groupName || '—') + (a0.city ? ' › ' + a0.city : ''), gstin: a0.gstin || '—', lim: (a0.creditLimit ? '₹ ' + inr(a0.creditLimit, 0) : 'No limit') + ' · ' + (a0.creditDays || 0) + ' days', broker: a0.brokerId ? (nm.get(a0.brokerId) || {}).name || '—' : 'Direct' },
      accId: String(st.id), accOpts: lk.ledgers.map((x) => ({ v: String(x.id), l: x.name + (x.city ? ' · ' + x.city : '') })), pickAcc: (e) => this.open(Number(e.target.value)),
      print: () => window.print(), excel: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'Ledger - ' + a0.name + '.csv'; a.click(); } catch (e) {} },
      whatsapp: () => { try { window.open('https://wa.me/' + (mob ? '91' + mob : '') + '?text=' + encodeURIComponent(stmt), '_blank'); } catch (e) {} }, call: () => { if (mob) window.location.href = 'tel:+91' + mob; },
      editAcc: () => { try { window.localStorage.setItem('yf-edit-acc', JSON.stringify({ id: a0.id })); } catch (e) {} },
      recordPay: () => { try { window.localStorage.setItem('yf-pay-kind', isSup ? 'p' : 'r'); window.localStorage.setItem('yf-pay-party', JSON.stringify({ id: a0.id })); } catch (e) {} }, payLabel: isSup ? 'Record payment' : 'Record receipt',
      nBills: String(bills.length), nOrders: String(st.nOrd || 0), ordHref: (isSup ? 'PurchaseOrderList' : 'SalesOrderList') + sfx + '.dc.html',
      from: st.from, to: st.to, setFrom: (e) => { this.setState({ from: e.target.value }); if (this.iso(e.target.value)) this.open(st.id, e.target.value, st.to); }, setTo: (e) => { this.setState({ to: e.target.value }); if (this.iso(e.target.value)) this.open(st.id, st.from, e.target.value); },
      op: { dt: dmy(led.from), bal: inr(led.opening, 2) + ' ' + (led.openingType === 'DR' ? 'Dr' : 'Cr') }, rows,
      tot: { dr: inr(led.totalDebit, 2), cr: inr(led.totalCredit, 2), bal: inr(led.closing, 2) + ' ' + (led.closingType === 'DR' ? 'Dr' : 'Cr') },
      bills, billTot: inr(ob.reduce((x, b) => x + b.pending, 0), 2),
      acts: (sm.recent || []).map((x) => { const v = VT[x.type] || [x.type.replace(/_/g, ' ').toLowerCase(), 'c-gray']; return { dt: dmy(x.date), vt: v[0], dc: 'dot ' + v[1], no: x.number, amt: '₹ ' + inr(x.netAmount || x.amount, 2), mode: x.mode || '—' }; }),
      bal: { op: '₹ ' + inr(led.opening, 2) + ' ' + (led.openingType === 'DR' ? 'Dr' : 'Cr'), dr: '₹ ' + inr(led.totalDebit, 2), cr: '₹ ' + inr(led.totalCredit, 2), cl: '₹ ' + inr(led.closing, 2) + ' ' + (led.closingType === 'DR' ? 'Dr' : 'Cr') },
      ag: { aria: 'Ageing of pending bills', w1: pdr(bk[0]), w2: pdr(bk[1]), w3: pdr(bk[2]), w4: pdr(bk[3]), a: '₹ ' + inr(bk[0], 0), b: '₹ ' + inr(bk[1], 0), c: '₹ ' + inr(bk[2], 0), d: '₹ ' + inr(bk[3], 0) } };
  }
}

/* ----- view ----- */
class LedgerView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="led" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href="AccountMaster.dc.html">
                Ledgers
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                {v.acc?.name}
              </span>
            </div>
            <select className="inp" aria-label="Account" style={{"width":"240px"}} value={v.accId} onChange={v.pickAcc}>
              {(v.accOpts || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option value={o?.v}>
                    {o?.l}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <button className="btn" type="button" onClick={v.print}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
              Print
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.excel}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Excel
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.whatsapp}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              WhatsApp statement
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <div className="tabs" role="tablist">
                <button className={v.tc?.led} type="button" role="tab" onClick={v.go?.led}>
                  Ledger
                </button>
                {' '}
                <button className={v.tc?.bills} type="button" role="tab" onClick={v.go?.bills}>
                  {"Pending bills "}
                  <span className="n">
                    {v.nBills}
                  </span>
                </button>
                {' '}
                <DcLink className="tab" href={v.ordHref}>
                  {"Orders "}
                  <span className="n">
                    {v.nOrders}
                  </span>
                </DcLink>
                {' '}
                <button className={v.tc?.act} type="button" role="tab" onClick={v.go?.act}>
                  Activity
                </button>
                {' '}
                <button className="tab" type="button" role="tab">
                  Notes
                </button>
              </div>
              {v.show?.led ? (
                <>
                  <div className="fbar">
                    <input className="inp" type="text" value={v.from} onChange={v.setFrom} aria-label="From date" style={{"width":"130px"}} />
                    <span className="muted">
                      to
                    </span>
                    <input className="inp" type="text" value={v.to} onChange={v.setTo} aria-label="To date" style={{"width":"130px"}} />
                    {' '}
                    <select className="inp" aria-label="Voucher type" value={v.vt} onChange={v.setVt}>
                      <option>
                        All vouchers
                      </option>
                      <option>
                        Sales
                      </option>
                      <option>
                        Purchase
                      </option>
                      <option>
                        Receipt
                      </option>
                      <option>
                        Payment
                      </option>
                      <option>
                        Credit note
                      </option>
                      <option>
                        Debit note
                      </option>
                      <option>
                        Journal
                      </option>
                    </select>
                    <div style={{"flex":"1"}} />
                    <label className="muted" style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                      <input type="checkbox" checked={v.det} onChange={v.togDet} style={{"accentColor":"#8F8F8F"}} />
                      Show item details
                    </label>
                  </div>
                  <div className="tw">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            Date
                          </th>
                          <th>
                            Voucher
                          </th>
                          <th>
                            No.
                          </th>
                          <th>
                            Particulars
                          </th>
                          <th className="r">
                            Debit
                          </th>
                          <th className="r">
                            Credit
                          </th>
                          <th className="r">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="t2">
                            {v.op?.dt}
                          </td>
                          <td>
                            <span className="dot c-gray">
                              Opening
                            </span>
                          </td>
                          <td className="muted">
                            —
                          </td>
                          <td className="t2">
                            Balance brought forward
                          </td>
                          <td className="r" />
                          <td className="r" />
                          <td className="r">
                            {v.op?.bal}
                          </td>
                        </tr>
                        {(v.rows || []).map((r, $index) => (
                          <Fragment key={$index}>
                            <tr>
                              <td className="t2">
                                {r?.dt}
                              </td>
                              <td>
                                <span className={r?.dc}>
                                  {r?.vt}
                                </span>
                              </td>
                              <td>
                                <DcLink href={r?.href} style={{"textDecoration":"underline"}} onClick={r?.open}>
                                  {r?.no}
                                </DcLink>
                              </td>
                              <td>
                                {r?.part}
                              </td>
                              <td className="r">
                                {r?.dr}
                              </td>
                              <td className="r">
                                {r?.cr}
                              </td>
                              <td className="r">
                                {r?.bal}
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4">
                            Closing balance
                          </td>
                          <td className="r">
                            {v.tot?.dr}
                          </td>
                          <td className="r">
                            {v.tot?.cr}
                          </td>
                          <td className="r">
                            {v.tot?.bal}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : null}
              {' '}
              {v.show?.bills ? (
                <>
                  <div className="tw" style={{"paddingTop":"16px"}}>
                    <table>
                      <thead>
                        <tr>
                          <th>
                            Bill
                          </th>
                          <th>
                            Date
                          </th>
                          <th>
                            Due date
                          </th>
                          <th>
                            Age
                          </th>
                          <th className="r">
                            Bill amount
                          </th>
                          <th className="r">
                            Pending
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(v.bills || []).map((b, $index) => (
                          <Fragment key={$index}>
                            <tr>
                              <td>
                                {b?.no}
                              </td>
                              <td className="t2">
                                {b?.dt}
                              </td>
                              <td className="t2">
                                {b?.due}
                              </td>
                              <td>
                                <span className={b?.tc}>
                                  {b?.age}
                                </span>
                              </td>
                              <td className="r">
                                {b?.amt}
                              </td>
                              <td className="r">
                                {b?.pend}
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5">
                            Total pending
                          </td>
                          <td className="r">
                            {v.billTot}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    <div style={{"display":"flex","gap":"8px","padding":"16px 0"}}>
                      <DcLink className="btn pr" href="Payments.dc.html" onClick={v.recordPay}>
                        {v.payLabel}
                      </DcLink>
                      <button className="btn" type="button" onClick={v.whatsapp}>
                        Send reminder
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
              {' '}
              {v.show?.act ? (
                <>
                  <div className="tw" style={{"paddingTop":"16px"}}>
                    <table>
                      <thead>
                        <tr>
                          <th>
                            Date
                          </th>
                          <th>
                            Voucher
                          </th>
                          <th>
                            No.
                          </th>
                          <th className="r">
                            Amount
                          </th>
                          <th>
                            Mode
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(v.acts || []).map((x, $index) => (
                          <Fragment key={$index}>
                            <tr>
                              <td className="t2">
                                {x?.dt}
                              </td>
                              <td>
                                <span className={x?.dc}>
                                  {x?.vt}
                                </span>
                              </td>
                              <td>
                                {x?.no}
                              </td>
                              <td className="r">
                                {x?.amt}
                              </td>
                              <td className="t2">
                                {x?.mode}
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
            <aside className="rp">
              <div className="rid">
                {v.acc?.code}
              </div>
              <div className="rhead">
                <span className="big">
                  {v.acc?.ini}
                </span>
                <div>
                  <div style={{"fontSize":"20px","lineHeight":"28px","fontWeight":"500"}}>
                    {v.acc?.name}
                  </div>
                  <div className="ibs">
                    <button className="ib" type="button" aria-label="WhatsApp" onClick={v.whatsapp}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                      </svg>
                    </button>
                    {' '}
                    <button className="ib" type="button" aria-label="Call" onClick={v.call}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    {' '}
                    <DcLink className="ib" href="AccountMaster.dc.html" aria-label="Edit account" onClick={v.editAcc}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </DcLink>
                  </div>
                </div>
              </div>
              <div className="sec">
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    Balance
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Opening (FY)
                  </span>
                  <span className="v">
                    {v.bal?.op}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Total debit
                  </span>
                  <span className="v">
                    {v.bal?.dr}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Total credit
                  </span>
                  <span className="v">
                    {v.bal?.cr}
                  </span>
                </div>
                <div className="kv">
                  <span className="k" style={{"color":"var(--t1)","fontWeight":"600"}}>
                    Closing
                  </span>
                  <span className="v" style={{"fontSize":"18px","fontWeight":"600"}}>
                    {v.bal?.cl}
                  </span>
                </div>
              </div>
              <div className="sec">
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    Ageing
                  </span>
                </div>
                <div className="age" role="img" aria-label={v.ag?.aria}>
                  <i style={sx(`${v.ag?.w1 ?? ""}; background: #8F8F8F`)} />
                  <i style={sx(`${v.ag?.w2 ?? ""}; background: #F97316`)} />
                  <i style={sx(`${v.ag?.w3 ?? ""}; background: #EF4444`)} />
                  <i style={sx(`${v.ag?.w4 ?? ""}; background: #A855F7`)} />
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot c-gray">
                      0–30 days
                    </span>
                  </span>
                  <span className="v">
                    {v.ag?.a}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot c-orange">
                      31–60 days
                    </span>
                  </span>
                  <span className="v">
                    {v.ag?.b}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot" style={{"--c":"#EF4444"}}>
                      61–90 days
                    </span>
                  </span>
                  <span className="v">
                    {v.ag?.c}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot c-gray">
                      90+ days
                    </span>
                  </span>
                  <span className="v">
                    {v.ag?.d}
                  </span>
                </div>
              </div>
              <div className="sec" style={{"borderBottom":"0"}}>
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    Details
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Group
                  </span>
                  <span className="v">
                    {v.acc?.grp}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    GSTIN
                  </span>
                  <span className="v">
                    {v.acc?.gstin}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Credit limit
                  </span>
                  <span className="v">
                    {v.acc?.lim}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Broker
                  </span>
                  <span className="v">
                    {v.acc?.broker}
                  </span>
                </div>
              </div>
            </aside>
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

export default function Ledger(props) {
  const theme = useTheme();
  return <LedgerView {...props} theme={theme} />;
}
