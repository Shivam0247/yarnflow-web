/* eslint-disable */
// Payments — converted 1:1 from the YarnFlow design (Payments.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Payments.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { kind: 'r', f: {}, adj: {}, off: {}, note: '', err: false, busy: false }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  today() { const t = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(t.getDate()) + '-' + z(t.getMonth() + 1) + '-' + t.getFullYear(); }
  slug(k) { return { r: 'receipts', p: 'payments', c: 'contras', j: 'journals' }[k || this.state.kind]; }
  componentDidMount() {
    const api = this.api(); if (!api) return;
    let k = 'r'; try { const want = window.localStorage.getItem('yf-pay-kind'); if (want) { window.localStorage.removeItem('yf-pay-kind'); k = want; } } catch (e) {}
    this.setState({ kind: k, f: { date: this.today(), mode: 'NEFT' } }); this.init(k);
  }
  async init(k) {
    const api = this.api(); if (!api) return;
    try {
      const lk = await api.lookups(); const bank = lk.banks[0];
      this.setState({ lk, f: { ...this.state.f, bankAccountId: this.state.f.bankAccountId || (bank ? String(bank.id) : '') } });
      this.number(k);
      let pre = null; try { pre = JSON.parse(window.localStorage.getItem('yf-pay-party') || 'null'); if (pre) window.localStorage.removeItem('yf-pay-party'); } catch (e) {}
      if (pre && pre.id) this.pickParty(String(pre.id));
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  async number(k) { const api = this.api(); if (!api) return; try { const nx = await api.get('/vouchers/' + this.slug(k) + '/next-number'); this.setState({ nextNo: nx.number }); } catch (e) {} }
  setKind(k) { if (k === this.state.kind) return; this.setState({ kind: k, adj: {}, off: {}, bills: [], sm: null, note: '', err: false, f: { date: this.state.f.date || this.today(), mode: this.state.f.mode || 'NEFT', bankAccountId: (this.state.lk && this.state.lk.banks[0]) ? String(this.state.lk.banks[0].id) : '' } }); this.number(k); }
  async pickParty(id) {
    const api = this.api(); const k = this.state.kind;
    this.setState({ f: { ...this.state.f, partyId: id }, adj: {}, off: {}, bills: [], sm: null, note: '', err: false });
    if (!api || !id || k === 'c' || k === 'j') return;
    try {
      const [bills, sm] = await Promise.all([api.get('/accounts/' + id + '/open-bills', { side: k === 'r' ? 'receivable' : 'payable' }), api.get('/accounts/' + id + '/summary')]);
      this.setState({ bills, sm });
    } catch (e) { this.setState({ note: api.message(e), err: true }); }
  }
  auto(amount) {
    const bills = this.state.bills || []; let left = amount; const adj = {};
    bills.forEach((b) => { const p = b.pending; const a = Math.min(p, Math.max(0, left)); if (a > 0.004) { adj[b.id] = a.toFixed(2); left -= a; } });
    this.setState({ adj, off: {} });
  }
  async save() {
    const api = this.api(); if (!api) { this.setState({ note: 'Saved (design preview)' }); return; }
    const st = this.state, f = st.f, k = st.kind;
    const n = (v) => Number(String(v ?? '').replace(/[₹,\s]/g, '')) || 0;
    const iso = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const amt = n(f.amount);
    if (!f.partyId) return this.setState({ note: k === 'c' ? 'Choose where the money goes' : k === 'j' ? 'Choose the debit account' : 'Choose the party', err: true });
    if (!(amt > 0)) return this.setState({ note: 'Enter the amount', err: true });
    if (!iso(f.date)) return this.setState({ note: 'Date must be dd-mm-yyyy', err: true });
    let body;
    if (k === 'c' || k === 'j') {
      if (!f.bankAccountId) return this.setState({ note: k === 'c' ? 'Choose where the money comes from' : 'Choose the credit account', err: true });
      if (f.bankAccountId === f.partyId) return this.setState({ note: 'Debit and credit accounts must be different', err: true });
      body = { date: iso(f.date), narration: f.narration || null, mode: k === 'c' ? f.mode : undefined, instrumentNo: f.instrumentNo || null, lines: [{ accountId: Number(f.partyId), debit: amt, description: f.narration || null }, { accountId: Number(f.bankAccountId), credit: amt, description: f.narration || null }] };
    } else {
      if (!f.bankAccountId) return this.setState({ note: 'Choose the bank / cash account', err: true });
      const allocations = (st.bills || []).filter((b) => !st.off[b.id] && n(st.adj[b.id]) > 0).map((b) => ({ billId: b.id, amount: n(st.adj[b.id]) }));
      if (allocations.reduce((a, x) => a + x.amount, 0) > amt + 0.005) return this.setState({ note: 'Adjusted more than the amount', err: true });
      body = { date: iso(f.date), partyId: Number(f.partyId), bankAccountId: Number(f.bankAccountId), mode: f.mode || 'NEFT', instrumentNo: f.instrumentNo || null, amount: amt, narration: f.narration || null, allocations };
    }
    this.setState({ busy: true, note: 'Saving…', err: false });
    try {
      const d = await api.post('/vouchers/' + this.slug(), body); api.invalidate();
      this.setState({ busy: false, note: '✓ Saved ' + d.number + ' · ₹ ' + amt.toLocaleString('en-IN', { minimumFractionDigits: 2 }), err: false, last: d, f: { date: f.date, mode: f.mode, bankAccountId: f.bankAccountId }, adj: {}, off: {}, bills: [], sm: null });
      this.number(k);
    } catch (e) { this.setState({ busy: false, note: api.message(e), err: true }); }
  }

  renderVals() {
    const st = this.state; const k = st.kind; const r = k === 'r'; const theme = this.props.theme ?? 'dark';
    const live = !!this.api() && !!st.lk; const lk = st.lk || {};
    const inr = (n, d) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const n = (v) => Number(String(v ?? '').replace(/[₹,\s]/g, '')) || 0;
    const dmy = (x) => (x ? String(x).slice(0, 10).split('-').reverse().join('-') : '');
    const KN = { r: 'Receipt', p: 'Payment', c: 'Contra', j: 'Journal' }[k];
    const base = {
      theme, rc: k === 'r' ? 'on' : '', py: k === 'p' ? 'on' : '', ct: k === 'c' ? 'on' : '', jv: k === 'j' ? 'on' : '',
      setR: () => (live ? this.setKind('r') : this.setState({ kind: 'r' })), setP: () => (live ? this.setKind('p') : this.setState({ kind: 'p' })), setC: () => (live ? this.setKind('c') : this.setState({ kind: 'c' })), setJ: () => (live ? this.setKind('j') : this.setState({ kind: 'j' })),
      kind: KN, kindLower: KN.toLowerCase(), note: st.note, noteCls: st.err ? 'tag t-red' : 'muted', busy: !!st.busy, saveL: st.busy ? 'Saving…' : 'Save ' + KN.toLowerCase(), save: () => this.save(),
      send: () => window.print(), isNarr: k === 'c' || k === 'j', hasBills: k === 'r' || k === 'p'
    };
    if (!live) {
      const sample = [['SI-0598', '05-08-2026', '79 days', 'tag t-red', '1,48,250.00', '1,48,250.00', '1,48,250.00', true], ['SI-0640', '22-08-2026', '62 days', 'tag t-red', '1,62,000.00', '1,62,000.00', '51,750.00', true], ['SI-0721', '18-09-2026', '35 days', 'tag t-orange', '1,33,875.00', '31,400.00', '', false], ['SI-0790', '10-10-2026', '13 days', 'tag t-gray', '1,40,700.00', '1,40,700.00', '', false]];
      const pfx = r ? 'SI' : 'PB';
      return { ...base, docNo: { r: 'RC-26-27-0471', p: 'PY-26-27-0092', c: 'CT-26-27-0014', j: 'JV-26-27-0031' }[k], partyLabel: { r: 'Received from', p: 'Paid to', c: 'Deposit into', j: 'Debit account' }[k], bankLabel: { r: 'Bank account', p: 'Bank account', c: 'Withdraw from', j: 'Credit account' }[k],
        partyName: r ? 'Krishna Textiles' : 'Reliance Industries', partySub: r ? 'Sundry Debtors · Ring Road, Surat' : 'Sundry Creditors · Yarn mill, Silvassa', initial: r ? 'K' : 'R', p: pfx, drcr: r ? 'Dr' : 'Cr',
        f: { partyId: '', amount: '₹ 2,00,000.00', date: '23-10-2026', mode: 'NEFT', bankAccountId: '', instrumentNo: 'HDFCR52026102318821', narration: '' }, set: {},
        opt: { parties: [{ v: '', l: r ? 'Krishna Textiles' : 'Reliance Industries' }], banks: [{ v: '', l: 'HDFC Bank · Current ••4412' }, { v: 's', l: 'SBI · Current ••0918' }] },
        bills: sample.map((b) => ({ no: b[0].replace('SI', pfx), dt: b[1], age: b[2], tc: b[3], amt: b[4], pend: b[5], adj: b[6], on: b[7], tog: () => {}, set: () => {} })), noBills: false, allOn: true, togAll: () => {}, autoAdj: () => {},
        sm: { amt: '₹ 2,00,000.00', l2: 'Adjusted', adj: '₹ 2,00,000.00', l3: 'On account', onAcc: '₹ 0.00', after: '₹ 2,82,350.00' },
        ac: { out: '₹ 4,82,350.00', od: '₹ 3,10,250.00', odC: 'tag t-red', cr: '45 days', delay: '+21 days' },
        recent: [{ a: '06-10-2026', b: '₹ 1,50,000 · Cheque' }, { a: '12-09-2026', b: '₹ 2,00,000 · NEFT' }, { a: '18-08-2026', b: '₹ 1,75,500 · RTGS' }], noRecent: false, footTag: 'WhatsApp receipt goes out automatically on save', openLedger: () => {} };
    }
    const f = st.f;
    const notBank = lk.ledgers.filter((a) => a.kind !== 'BANK' && a.kind !== 'CASH');
    const ord = (first) => notBank.filter((a) => a.kind === first).concat(notBank.filter((a) => a.kind !== first));
    const kindL = { CUSTOMER: 'Sundry Debtors', SUPPLIER: 'Sundry Creditors', BROKER: 'Broker', TRANSPORTER: 'Transporter', EXPENSE: 'Expense', INCOME: 'Income', BANK: 'Bank', CASH: 'Cash' };
    const partyList = k === 'r' ? ord('CUSTOMER') : k === 'p' ? ord('SUPPLIER') : k === 'c' ? lk.banks : lk.ledgers;
    const bankList = k === 'j' ? lk.ledgers : lk.banks;
    const P = lk.ledgers.find((a) => String(a.id) === String(f.partyId));
    const set = {}; ['amount', 'date', 'mode', 'bankAccountId', 'instrumentNo', 'narration'].forEach((key) => { set[key] = (e) => this.setState({ f: { ...this.state.f, [key]: e.target.value }, note: this.state.err ? '' : this.state.note, err: false }); });
    set.partyId = (e) => this.pickParty(e.target.value);
    const amt = n(f.amount);
    set.amount = (e) => { const v = e.target.value; this.setState({ f: { ...this.state.f, amount: v } }); if (Object.keys(this.state.adj).length === 0 && n(v) > 0) this.auto(n(v)); };
    const today = Date.now();
    const bills = (st.bills || []).map((b) => { const dd = b.dueDate || b.date; const age = Math.round((today - new Date(String(dd).slice(0, 10) + 'T00:00:00').getTime()) / 864e5); const on = !st.off[b.id] && n(st.adj[b.id]) > 0;
      return { no: b.number, dt: dmy(b.date), age: age > 0 ? age + ' days' : 'Due ' + dmy(dd), tc: age > 60 ? 'tag t-red' : age > 30 ? 'tag t-orange' : 'tag t-gray', amt: inr(b.net, 2), pend: inr(b.pending, 2), adj: st.off[b.id] ? '' : st.adj[b.id] ?? '', on,
        tog: () => { if (on) this.setState({ off: { ...this.state.off, [b.id]: true } }); else { const used = (st.bills || []).reduce((a, x) => a + (x.id !== b.id && !st.off[x.id] ? n(st.adj[x.id]) : 0), 0); const a = Math.min(b.pending, Math.max(0, amt - used)) || b.pending; this.setState({ off: { ...this.state.off, [b.id]: false }, adj: { ...this.state.adj, [b.id]: a.toFixed(2) } }); } },
        set: (e) => this.setState({ adj: { ...this.state.adj, [b.id]: e.target.value }, off: { ...this.state.off, [b.id]: false } }) }; });
    const adjT = (st.bills || []).reduce((a, b) => a + (st.off[b.id] ? 0 : n(st.adj[b.id])), 0);
    const sm = st.sm;
    const out = sm ? sm.outstanding : P ? Math.abs(P.balance) : 0;
    const after = Math.max(0, out - (k === 'r' || k === 'p' ? amt : 0));
    const od = sm ? sm.overdue : 0;
    const openB = sm ? sm.bills || [] : [];
    const delay = openB.length ? Math.round(openB.reduce((a, b) => a + (b.overdueDays || 0), 0) / openB.length) : 0;
    const typ = { r: 'RECEIPT', p: 'PAYMENT' }[k];
    const recent = sm ? sm.recent.filter((x) => x.type === typ).slice(0, 4).map((x) => ({ a: dmy(x.date), b: '₹ ' + inr(x.amount || x.netAmount, 0) + (x.mode ? ' · ' + x.mode.charAt(0) + x.mode.slice(1).toLowerCase() : '') })) : [];
    const name = P ? P.name : { r: 'Select party', p: 'Select party', c: 'Select account', j: 'Select account' }[k];
    return { ...base, docNo: st.nextNo || '…', partyLabel: { r: 'Received from', p: 'Paid to', c: 'Deposit into', j: 'Debit account' }[k], bankLabel: { r: 'Bank account', p: 'Bank account', c: 'Withdraw from', j: 'Credit account' }[k],
      partyName: name, partySub: P ? (kindL[P.kind] || P.kind) + (P.city ? ' · ' + P.city : '') : '—', initial: P ? P.name.replace(/^(Shree|Shri|The)\s+/i, '').charAt(0) : '+', p: r ? 'GU' : 'PB', drcr: P && P.balance < 0 ? 'Cr' : 'Dr',
      f: { ...f, partyId: f.partyId || '', amount: f.amount ?? '', instrumentNo: f.instrumentNo ?? '', narration: f.narration ?? '' }, set,
      opt: { parties: [{ v: '', l: name === 'Select party' || name === 'Select account' ? name + '…' : 'Select…' }].concat(partyList.map((a) => ({ v: String(a.id), l: a.name + (a.city ? ' · ' + a.city : '') }))), banks: bankList.map((a) => ({ v: String(a.id), l: a.name })) },
      bills, noBills: !!f.partyId && bills.length === 0, allOn: bills.length > 0 && bills.every((b) => b.on),
      togAll: () => { if (bills.length && bills.every((b) => b.on)) { const off = {}; (st.bills || []).forEach((b) => { off[b.id] = true; }); this.setState({ off }); } else this.auto(amt || (st.bills || []).reduce((a, b) => a + b.pending, 0)); },
      autoAdj: () => this.auto(amt),
      sm: { amt: '₹ ' + inr(amt, 2), l2: k === 'c' || k === 'j' ? 'Debit' : 'Adjusted', adj: '₹ ' + inr(k === 'c' || k === 'j' ? amt : adjT, 2), l3: k === 'c' || k === 'j' ? 'Credit' : 'On account', onAcc: '₹ ' + inr(k === 'c' || k === 'j' ? amt : Math.max(0, amt - adjT), 2), after: '₹ ' + inr(k === 'c' || k === 'j' ? Math.abs(P ? P.balance : 0) : after, 2) },
      ac: { out: '₹ ' + inr(out, 2), od: '₹ ' + inr(od, 2), odC: od > 0 ? 'tag t-red' : 'tag t-green', cr: P && P.creditDays != null ? P.creditDays + ' days' : '—', delay: openB.length ? (delay >= 0 ? '+' : '') + delay + ' days' : '—' },
      recent, noRecent: recent.length === 0, footTag: st.last ? 'Last saved ' + st.last.number : 'Use Send voucher to print or share after saving',
      openLedger: (e) => { try { if (P) window.localStorage.setItem('yf-ledger', JSON.stringify({ id: P.id, name: P.name })); } catch (er) {} }
    };
  }
}

/* ----- view ----- */
class PaymentsView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="pay" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                {"Payments & Receipts"}
              </span>
              <span className="m">
                /
              </span>
              <span>
                {v.docNo}
              </span>
            </div>
            <div className="seg" role="group" aria-label="Entry type">
              <button type="button" className={v.rc} onClick={v.setR}>
                Receipt
              </button>
              <button type="button" className={v.py} onClick={v.setP}>
                Payment
              </button>
              <button type="button" className={v.ct} onClick={v.setC}>
                Contra
              </button>
              <button type="button" className={v.jv} onClick={v.setJ}>
                Journal
              </button>
            </div>
            <button className="btn" type="button" onClick={v.send}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              Send voucher
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.save} disabled={v.busy}>
              {v.saveL}
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <div className="pane">
                <div className="ph2">
                  <h2>
                    {v.kind}{" details"}
                  </h2>
                  <span className={v.noteCls} style={{"fontSize":"13px","maxWidth":"420px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}} role="status" title={v.note}>
                    {v.note}
                  </span>
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="p1">
                      {v.partyLabel}{" "}
                      <span style={{"color":"#EF4444"}}>
                        *
                      </span>
                    </label>
                    <select id="p1" className="inp" value={v.f?.partyId} onChange={v.set?.partyId}>
                      {(v.opt?.parties || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <option value={o?.v}>
                            {o?.l}
                          </option>
                        </Fragment>
                      ))}
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="p2">
                      {"Amount "}
                      <span style={{"color":"#EF4444"}}>
                        *
                      </span>
                    </label>
                    <input id="p2" className="inp" type="text" value={v.f?.amount} onChange={v.set?.amount} placeholder="₹ 0.00" />
                  </div>
                  <div className="fld">
                    <label htmlFor="p3">
                      Date
                    </label>
                    <input id="p3" className="inp" type="text" value={v.f?.date} onChange={v.set?.date} placeholder="dd-mm-yyyy" />
                  </div>
                  <div className="fld">
                    <label htmlFor="p4">
                      Mode
                    </label>
                    <select id="p4" className="inp" value={v.f?.mode} onChange={v.set?.mode}>
                      <option value="NEFT">
                        NEFT / RTGS
                      </option>
                      <option value="CHEQUE">
                        Cheque
                      </option>
                      <option value="UPI">
                        UPI
                      </option>
                      <option value="CASH">
                        Cash
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="p5">
                      {v.bankLabel}
                    </label>
                    <select id="p5" className="inp" value={v.f?.bankAccountId} onChange={v.set?.bankAccountId}>
                      {(v.opt?.banks || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <option value={o?.v}>
                            {o?.l}
                          </option>
                        </Fragment>
                      ))}
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="p6">
                      UTR / cheque no.
                    </label>
                    <input id="p6" className="inp" type="text" value={v.f?.instrumentNo} onChange={v.set?.instrumentNo} placeholder="Reference" />
                  </div>
                </div>
                {v.hasBills ? (
                  <>
                    <div className="ph2" style={{"marginTop":"6px"}}>
                      <h2 style={{"fontSize":"16px"}}>
                        Adjust against bills
                      </h2>
                      <button className="btn" type="button" onClick={v.autoAdj}>
                        Auto-adjust oldest first
                      </button>
                    </div>
                    <div style={{"overflowX":"auto"}}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{"width":"36px"}}>
                              <input className="cb" type="checkbox" aria-label="Select all bills" checked={v.allOn} onChange={v.togAll} />
                            </th>
                            <th>
                              Bill
                            </th>
                            <th>
                              Date
                            </th>
                            <th>
                              Due
                            </th>
                            <th className="r">
                              Bill amount
                            </th>
                            <th className="r">
                              Pending
                            </th>
                            <th className="r">
                              Adjust now
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(v.bills || []).map((b, $index) => (
                            <Fragment key={$index}>
                              <tr>
                                <td>
                                  <input className="cb" type="checkbox" aria-label={b?.no} checked={b?.on} onChange={b?.tog} />
                                </td>
                                <td>
                                  {b?.no}
                                </td>
                                <td className="t2">
                                  {b?.dt}
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
                                <td className="r">
                                  <input className="cin" type="text" value={b?.adj} placeholder="0.00" aria-label={`Adjust on ${b?.no ?? ""}`} onChange={b?.set} />
                                </td>
                              </tr>
                            </Fragment>
                          ))}
                          {v.noBills ? (
                            <>
                              <tr>
                                <td colSpan="7" className="muted" style={{"textAlign":"center","padding":"20px"}}>
                                  No pending bills — the amount goes on account
                                </td>
                              </tr>
                            </>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
                {' '}
                {v.isNarr ? (
                  <>
                    <div className="fld" style={{"marginTop":"14px"}}>
                      <label htmlFor="p7">
                        Narration
                      </label>
                      <input id="p7" className="inp" type="text" value={v.f?.narration} onChange={v.set?.narration} placeholder="What this entry is for" />
                    </div>
                  </>
                ) : null}
                <div className="sum">
                  <div>
                    <span className="muted">
                      Amount
                    </span>
                    <b>
                      {v.sm?.amt}
                    </b>
                  </div>
                  <div>
                    <span className="muted">
                      {v.sm?.l2}
                    </span>
                    <b>
                      {v.sm?.adj}
                    </b>
                  </div>
                  <div>
                    <span className="muted">
                      {v.sm?.l3}
                    </span>
                    <b>
                      {v.sm?.onAcc}
                    </b>
                  </div>
                  <div>
                    <span className="muted">
                      Balance after this
                    </span>
                    <b>
                      {v.sm?.after}
                    </b>
                  </div>
                </div>
              </div>
            </div>
            <aside className="rp">
              <div className="rid">
                {v.docNo}
              </div>
              <div className="rhead">
                <span className="big">
                  {v.initial}
                </span>
                <div>
                  <div style={{"fontSize":"20px","lineHeight":"28px","fontWeight":"500"}}>
                    {v.partyName}
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    {v.partySub}
                  </div>
                </div>
              </div>
              <div className="sec">
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    Account
                  </span>
                  <DcLink href="Ledger.dc.html" className="muted" style={{"fontSize":"13px","fontWeight":"400"}} onClick={v.openLedger}>
                    Open ledger →
                  </DcLink>
                </div>
                <div className="kv">
                  <span className="k">
                    Outstanding
                  </span>
                  <span className="v">
                    {v.ac?.out}{" "}{v.drcr}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Overdue
                  </span>
                  <span className="v">
                    <span className={v.ac?.odC}>
                      {v.ac?.od}
                    </span>
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Credit days
                  </span>
                  <span className="v">
                    {v.ac?.cr}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Avg. pay delay
                  </span>
                  <span className="v">
                    {v.ac?.delay}
                  </span>
                </div>
              </div>
              <div className="sec" style={{"borderBottom":"0"}}>
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    {"Recent "}{v.kindLower}s
                  </span>
                </div>
                {(v.recent || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <div className="kv">
                      <span className="k">
                        {x?.a}
                      </span>
                      <span className="v">
                        {x?.b}
                      </span>
                    </div>
                  </Fragment>
                ))}
                {' '}
                {v.noRecent ? (
                  <>
                    <div className="kv">
                      <span className="k">
                        Nothing yet
                      </span>
                      <span className="v">
                        —
                      </span>
                    </div>
                  </>
                ) : null}
                <div style={{"padding":"14px 20px 0"}}>
                  <span className="tag t-green">
                    {v.footTag}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="pay" />
        </div>
      </div>
      </>
    );
  }
}

export default function Payments(props) {
  const theme = useTheme();
  return <PaymentsView {...props} theme={theme} />;
}
