/* eslint-disable */
// Approvals — converted 1:1 from the YarnFlow design (Approvals.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Approvals.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { sel: 0, filter: 'all', handled: [], q: '', rmk: '', det: {} }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  componentDidMount() { this.load(); }
  async load() {
    const api = this.api(); if (!api) return;
    try { const [rows, co] = await Promise.all([api.get('/approvals'), api.get('/company')]); const live = rows.filter((r) => r.status === 'PENDING_APPROVAL'); this.setState({ live, co, selId: (live.find((r) => r.id === this.state.selId) || live[0] || {}).id }); }
    catch (e) { this.setState({ done: api.message(e) }); }
  }
  async detail(r) {
    const api = this.api(); if (!api || !r || this.state.det[r.id]) return;
    try { const [d, sm] = await Promise.all([api.get('/vouchers/' + r.slug + '/' + r.id), r.partyId ? api.get('/accounts/' + r.partyId + '/summary') : Promise.resolve(null)]); this.setState({ det: { ...this.state.det, [r.id]: { d, sm } } }); } catch (e) {}
  }
  async act(r, action) {
    const api = this.api(); if (!api || !r) return;
    const rmk = this.state.rmk.trim();
    if (action !== 'approve' && !rmk) { this.setState({ done: 'Add a remark so ' + (r.createdBy || 'the user') + ' knows what to change' }); return; }
    try { await api.post('/vouchers/' + r.slug + '/' + r.id + '/actions/' + (action === 'approve' ? 'approve' : 'reject'), { reason: action === 'back' ? 'Sent back for changes: ' + rmk : rmk || 'Approved' }); api.invalidate();
      this.setState({ rmk: '', done: (action === 'approve' ? '✓ Approved ' : action === 'back' ? '↩ Sent back ' : '✕ Rejected ') + r.number, selId: null }); await this.load(); }
    catch (e) { this.setState({ done: api.message(e) }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const api = this.api(); const LIVE = st.live;
    if (LIVE) {
      const inr = (n) => { const v = Math.round(Number(n) || 0); const s = String(Math.abs(v)); let l3 = s.slice(-3), rest = s.slice(0, -3); if (rest) l3 = ',' + l3; return (v < 0 ? '-' : '') + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + l3; };
      const dmy = (x) => (x ? String(x).slice(0, 10).split('-').reverse().join('-') : '—');
      const AREA = { SALES_ORDER: 'sales', DISPATCH_SCHEDULE: 'sales', SALE_BILL: 'sales', PURCHASE_ORDER: 'purchase', PURCHASE_BILL: 'purchase' };
      const SHORT = { SALES_ORDER: 'SO', PURCHASE_ORDER: 'PO', DISPATCH_SCHEDULE: 'DS', SALE_BILL: 'SB', PURCHASE_BILL: 'PB', PAYMENT: 'PY', CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN' };
      const ago = (t) => { const m = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 6e4)); return m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; };
      const tone = (why) => /credit limit/i.test(why) ? 't-red' : /overdue|hold/i.test(why) ? 't-orange' : /limit|above/i.test(why) ? 't-orange' : 't-blue';
      const q = st.q.trim().toLowerCase();
      const all = LIVE.map((r) => { const why = r.reasons || r.approvalNote || 'Needs approval'; return { ...r, g: AREA[r.type] || 'accounts', why, short: SHORT[r.type] || r.type.slice(0, 2) }; });
      const counts = { all: all.length, sales: 0, purchase: 0, accounts: 0 }; all.forEach((d) => { counts[d.g] += 1; });
      const vis = all.filter((d) => (st.filter === 'all' || d.g === st.filter) && (!q || (d.number + ' ' + d.partyName).toLowerCase().indexOf(q) >= 0));
      const selR = all.find((r) => r.id === st.selId) || vis[0] || null;
      if (selR) this.detail(selR);
      const det = selR ? st.det[selR.id] : null; const d = det && det.d; const sm = det && det.sm;
      const VIEW = { SALES_ORDER: ['SalesOrderView', 'yf-view-so'], PURCHASE_ORDER: ['PurchaseOrderView', 'yf-view-po'], DISPATCH_SCHEDULE: ['DispatchScheduleView', 'yf-view-ds'] };
      const init = (n) => String(n || '?').split(/\s+/).map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
      const sel = selR ? { type: selR.typeLabel, no: selR.number, party: selR.partyName || '—', amount: '₹ ' + inr(selR.netAmount), by: selR.createdBy || '—', init: init(selR.createdBy), why: selR.why, href: '#',
        k1: selR.g === 'purchase' ? 'Credit days' : 'Payment terms', v1: d && d.creditDays != null ? d.creditDays + ' days' + (selR.g === 'purchase' ? '' : ' credit') : '—',
        k2: selR.g === 'purchase' ? 'Payable to party' : 'Outstanding', v2: sm ? '₹ ' + inr(sm.outstanding) + (sm.overdue > 0 ? ' · ₹ ' + inr(sm.overdue) + ' overdue' : '') : '…',
        k3: selR.g === 'purchase' ? 'Expected' : 'Deliver by', v3: d ? dmy(d.expDeliveryDate) : '…',
        lines: d ? d.lines.map((l) => (l.itemName || l.description || '') + ' ' + inr(l.qty) + ' kg @ ₹ ' + Number(l.rate).toFixed(2)).join(' · ') : '…' }
        : { type: '', no: 'Nothing waiting', party: 'all clear', amount: '—', by: '—', init: '✓', why: 'No document is waiting for approval.', href: '#', k1: '', v1: '', k2: '', v2: '', k3: '', v3: '', lines: '—' };
      return {
        theme, count: all.length, q: st.q, setQ: (e) => this.setState({ q: e.target.value }),
        rules: () => window.alert('Approval rules\n\n• Sales order: party over credit limit, party on hold, or bills overdue more than 30 days\n• Purchase order: above ₹ ' + inr((st.co || {}).poApprovalLimit || 0) + ' (Settings → Company)\n• Only an admin can approve or reject'),
        filters: [['all', 'All'], ['sales', 'Sales'], ['purchase', 'Purchase'], ['accounts', 'Accounts']].map(([k, label]) => ({ label, n: counts[k], cls: k === st.filter ? 'tab on' : 'tab', pick: () => this.setState({ filter: k }) })),
        rows: vis.map((r) => ({ short: r.short, no: r.number, party: r.partyName || '—', age: ago(r.updatedAt), reason: r.why.length > 42 ? r.why.slice(0, 40) + '…' : r.why, tagCls: 'tag ' + tone(r.why), amount: '₹ ' + inr(r.netAmount), cls: selR && r.id === selR.id ? 'item on' : 'item', pick: () => this.setState({ selId: r.id, done: '' }) })),
        sel, rmk: st.rmk, setRmk: (e) => this.setState({ rmk: e.target.value }),
        openDoc: (e) => { if (e && e.preventDefault) e.preventDefault(); if (!selR) return; const v = VIEW[selR.type]; if (!v) return; try { window.localStorage.setItem(v[1], JSON.stringify({ t: Date.now(), id: selR.id, no: selR.number })); window.localStorage.setItem('yf-back', JSON.stringify({ href: 'Approvals' + sfx + '.dc.html', label: 'Approvals' })); } catch (er) {} this.go(v[0] + sfx + '.dc.html'); },
        done: st.done || '', approve: () => this.act(selR, 'approve'), reject: () => this.act(selR, 'reject'), sendBack: () => this.act(selR, 'back')
      };
    }
    const data = [
      { g: 'sales', short: 'SO', type: 'Sales order', no: 'SO-0419', party: 'Krishna Textiles', reason: 'Credit limit +₹ 4.66 L', tone: 't-red', amount: '₹ 5,83,658', by: 'Rajesh Shah', init: 'RS', age: '1h', href: 'SalesOrder.dc.html', why: 'Outstanding ₹ 4.82 L plus this order crosses the ₹ 6.00 L credit limit. ₹ 2.14 L is already 18 days overdue.', k1: 'Payment terms', v1: '45 days credit', k2: 'Last payment', v2: '₹ 1,50,000 on 06 Oct', k3: 'Deliver by', v3: '28 Oct 2026', lines: 'PFY 75/36 SD 2,400 kg · Viscose 120D 600 kg · Nylon 40/34 384 kg' },
      { g: 'purchase', short: 'PO', type: 'Purchase order', no: 'PO-0123', party: 'Reliance Industries', reason: 'Above ₹ 10 L limit', tone: 't-orange', amount: '₹ 14,23,170', by: 'Meera Patel', init: 'MP', age: '2h', href: 'PurchaseOrder.dc.html', why: 'Purchase orders above ₹ 10,00,000 need owner approval.', k1: 'Mill', v1: 'Reliance · Silvassa', k2: 'Credit days', v2: '60 days', k3: 'Expected', v3: '02 Nov 2026', lines: 'PFY 75/36 SD 6,000 kg @ ₹ 131.50 · PFY 150/48 BR 4,800 kg @ ₹ 118.00 · IGST 5%' },
      { g: 'sales', short: 'SO', type: 'Sales order', no: 'SO-0416', party: 'Laxmi Creation', reason: 'Rate below floor', tone: 't-orange', amount: '₹ 2,30,480', by: 'Rajesh Shah', init: 'RS', age: '5h', href: 'SalesOrder.dc.html', why: 'Nylon 40/34 offered at ₹ 268/kg; floor price is ₹ 272/kg.', k1: 'Margin', v1: '3.1% (target 6%)', k2: 'Party since', v2: '2021', k3: 'Deliver by', v3: '27 Oct 2026', lines: 'Nylon 6 FDY 40/34 SD 860 kg @ ₹ 268.00' },
      { g: 'purchase', short: 'PB', type: 'Purchase bill', no: 'PB-0287', party: 'Century Rayon', reason: 'Rate differs from PO', tone: 't-orange', amount: '₹ 4,46,250', by: 'Dhaval K.', init: 'DK', age: '6h', href: 'PurchaseBill.dc.html', why: 'Bill rate ₹ 212.50/kg vs PO rate ₹ 212.00/kg — ₹ 1,050 extra on 2,100 kg.', k1: 'Against PO', v1: 'PO-0118', k2: 'GRN', v2: 'GRN-0291 · 2,100 kg', k3: 'Due on', v3: '21 Dec 2026', lines: 'Viscose Filament 120D/30F BR 2,100 kg @ ₹ 212.50' },
      { g: 'sales', short: 'SO', type: 'Sales order', no: 'SO-0405', party: 'Navrang Prints', reason: 'New party', tone: 't-blue', amount: '₹ 1,92,000', by: 'Kiran Joshi', init: 'KJ', age: '1d', href: 'SalesOrder.dc.html', why: 'First order from this party; no credit history yet.', k1: 'GSTIN', v1: 'Verified · Active', k2: 'Reference', v2: 'Mahesh Shah (broker)', k3: 'Terms asked', v3: '30 days credit', lines: 'DTY 80/36 SIM 1,500 kg @ ₹ 128.00' },
      { g: 'accounts', short: 'PY', type: 'Payment', no: 'PAY-0091', party: 'Sanathan Textiles', reason: 'Advance to mill', tone: 't-violet', amount: '₹ 3,00,000', by: 'Meera Patel', init: 'MP', age: '1d', href: 'Payments.dc.html', why: 'Advance payments without a bill need owner approval.', k1: 'Bank', v1: 'HDFC · RTGS', k2: 'Against', v2: 'PO-0121', k3: 'Pay on', v3: '24 Oct 2026', lines: 'Advance against PO-0121 · FDY 75/72 SD 2,400 kg' },
      { g: 'accounts', short: 'CN', type: 'Credit note', no: 'CN-0035', party: 'Om Sai Weaving', reason: 'Rate claim', tone: 't-gray', amount: '₹ 6,120', by: 'Neha Desai', init: 'ND', age: '2d', href: 'Ledger.dc.html', why: 'Party claims ₹ 1.70/kg rate difference on SI-0688.', k1: 'Invoice', v1: 'SI-0688', k2: 'Quantity', v2: '3,600 kg', k3: 'Reason', v3: 'Rate difference', lines: 'Rate difference ₹ 1.70 × 3,600 kg' }
    ];
    const f = this.state.filter;
    const counts = { all: data.length, sales: 0, purchase: 0, accounts: 0 };
    data.forEach((d) => { counts[d.g] += 1; });
    const filters = [['all', 'All'], ['sales', 'Sales'], ['purchase', 'Purchase'], ['accounts', 'Accounts']].map(([k, label]) => ({ label, n: counts[k], cls: k === f ? 'tab on' : 'tab', pick: () => this.setState({ filter: k }) }));
    const rows = data.map((d, i) => ({ ...d, i })).filter((d) => f === 'all' || d.g === f).map((d) => ({ ...d, tagCls: 'tag ' + d.tone, cls: d.i === this.state.sel ? 'item on' : 'item', pick: () => this.setState({ sel: d.i }) }));
    const sel = data[this.state.sel];
    const isDone = this.state.handled.indexOf(this.state.sel) >= 0;
    return {
      theme: this.props.theme ?? 'dark', count: data.length - this.state.handled.length, filters, rows, sel,
      done: isDone ? 'Decision recorded · ' + sel.by + ' notified on WhatsApp' : '',
      approve: () => this.setState({ handled: this.state.handled.concat([this.state.sel]) }), reject: () => this.setState({ handled: this.state.handled.concat([this.state.sel]) }), sendBack: () => {},
      q: this.state.q, setQ: (e) => this.setState({ q: e.target.value }), rules: () => {}, rmk: this.state.rmk, setRmk: (e) => this.setState({ rmk: e.target.value }), openDoc: () => {}
    };
  }
}

/* ----- view ----- */
class ApprovalsView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="appr" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                Approvals
              </span>
              <span className="tag t-orange">
                {v.count}{" pending"}
              </span>
            </div>
            <input className="inp" type="search" placeholder="Search document or party" aria-label="Search approvals" style={{"width":"240px"}} value={v.q} onChange={v.setQ} />
            {' '}
            <button className="btn" type="button" onClick={v.rules}>
              Approval rules
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <div className="tabs" role="tablist">
                {(v.filters || []).map((f, $index) => (
                  <Fragment key={$index}>
                    <button className={f?.cls} type="button" role="tab" onClick={f?.pick}>
                      {f?.label}{" "}
                      <span className="n">
                        {f?.n}
                      </span>
                    </button>
                  </Fragment>
                ))}
              </div>
              {(v.rows || []).map((it, $index) => (
                <Fragment key={$index}>
                  <button className={it?.cls} type="button" onClick={it?.pick}>
                    <span className="ico">
                      {it?.short}
                    </span>
                    {' '}
                    <span style={{"flex":"1","minWidth":"0","display":"flex","flexDirection":"column","gap":"4px"}}>
                      <span style={{"display":"flex","gap":"8px","alignItems":"baseline"}}>
                        <b style={{"fontWeight":"500","flex":"1"}}>
                          {it?.no}{" · "}{it?.party}
                        </b>
                        <span className="muted" style={{"fontSize":"12px"}}>
                          {it?.age}
                        </span>
                      </span>
                      {' '}
                      <span style={{"display":"flex","gap":"8px","alignItems":"center","justifyContent":"space-between"}}>
                        <span className={it?.tagCls}>
                          {it?.reason}
                        </span>
                        <span style={{"fontVariantNumeric":"tabular-nums"}}>
                          {it?.amount}
                        </span>
                      </span>
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
            <div className="rp">
              <div style={{"display":"flex","alignItems":"center","gap":"12px","padding":"20px 24px","borderBottom":"1px solid var(--bd)","flexWrap":"wrap"}}>
                <div style={{"flex":"1","minWidth":"220px"}}>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    {v.sel?.type}
                  </div>
                  <div style={{"fontSize":"20px","lineHeight":"28px","fontWeight":"600"}}>
                    {v.sel?.no}{" · "}{v.sel?.party}
                  </div>
                </div>
                <DcLink className="btn" href={v.sel?.href} onClick={v.openDoc}>
                  Open document
                </DcLink>
              </div>
              <div style={{"padding":"20px 24px","display":"flex","flexDirection":"column","gap":"18px"}}>
                <div className="box" style={{"display":"flex","gap":"12px","alignItems":"flex-start","borderColor":"rgba(249,115,22,.35)","background":"rgba(249,115,22,.06)"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{"flex":"none","marginTop":"1px"}}>
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                  <div>
                    <div style={{"fontWeight":"500"}}>
                      Why this needs approval
                    </div>
                    <div className="t2">
                      {v.sel?.why}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="kv">
                    <span className="k">
                      Amount
                    </span>
                    <span className="v" style={{"fontSize":"18px","fontWeight":"600"}}>
                      {v.sel?.amount}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">
                      Raised by
                    </span>
                    <span className="v" style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                      <span className="av" style={{"background":"#2563EB"}}>
                        {v.sel?.init}
                      </span>
                      {v.sel?.by}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">
                      {v.sel?.k1}
                    </span>
                    <span className="v">
                      {v.sel?.v1}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">
                      {v.sel?.k2}
                    </span>
                    <span className="v">
                      {v.sel?.v2}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">
                      {v.sel?.k3}
                    </span>
                    <span className="v">
                      {v.sel?.v3}
                    </span>
                  </div>
                </div>
                <div className="box" style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    Lines
                  </div>
                  <div>
                    {v.sel?.lines}
                  </div>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"10px"}}>
                  <label htmlFor="rmk" className="muted">
                    Remark
                  </label>
                  {' '}
                  <textarea id="rmk" className="inp" placeholder={`Add a note for ${v.sel?.by ?? ""} (optional)`} value={v.rmk} onChange={v.setRmk} />
                  <div style={{"display":"flex","gap":"8px","flexWrap":"wrap"}}>
                    <button className="btn ok" type="button" onClick={v.approve}>
                      Approve
                    </button>
                    <button className="btn no" type="button" onClick={v.reject}>
                      Reject
                    </button>
                    <button className="btn" type="button" onClick={v.sendBack}>
                      Send back for changes
                    </button>
                    <div style={{"flex":"1"}} />
                    <span className="muted" style={{"alignSelf":"center","fontSize":"13px"}}>
                      {v.done}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="appr" />
        </div>
      </div>
      </>
    );
  }
}

export default function Approvals(props) {
  const theme = useTheme();
  return <ApprovalsView {...props} theme={theme} />;
}
