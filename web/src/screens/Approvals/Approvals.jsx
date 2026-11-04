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
  constructor(p) { super(p); this.state = { sel: 0, filter: 'all', handled: [] }; }
  renderVals() {
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
      approve: () => this.setState({ handled: this.state.handled.concat([this.state.sel]) })
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
            <input className="inp" type="search" placeholder="Search document or party" aria-label="Search approvals" style={{"width":"240px"}} />
            {' '}
            <button className="btn" type="button">
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
                <DcLink className="btn" href={v.sel?.href}>
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
                  <textarea id="rmk" className="inp" placeholder={`Add a note for ${v.sel?.by ?? ""} (optional)`} />
                  <div style={{"display":"flex","gap":"8px","flexWrap":"wrap"}}>
                    <button className="btn ok" type="button" onClick={v.approve}>
                      Approve
                    </button>
                    <button className="btn no" type="button" onClick={v.approve}>
                      Reject
                    </button>
                    <button className="btn" type="button">
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
