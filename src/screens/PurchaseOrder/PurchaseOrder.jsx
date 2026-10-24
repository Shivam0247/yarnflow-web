/* eslint-disable */
// PurchaseOrder — converted 1:1 from the YarnFlow design (PurchaseOrder.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './PurchaseOrder.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: 'items' }; }
  renderVals() {
    const tab = this.state.tab;
    const tc = {}, go = {}, show = {};
    ['items', 'approvals'].forEach((k) => { tc[k] = k === tab ? 'tab on' : 'tab'; show[k] = k === tab; go[k] = () => this.setState({ tab: k }); });
    return { theme: this.props.theme ?? 'dark', tc, go, show };
  }
}

/* ----- view ----- */
class PurchaseOrderView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="po" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href="PurchaseOrderList.dc.html">
                Purchase Orders
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                PO-26-27-0123
              </span>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              Send to mill
            </button>
            {' '}
            <button className="btn" type="button">
              <span className="av" style={{"background":"#0D9488","width":"22px","height":"22px"}}>
                MP
              </span>
              Meera Patel
            </button>
            {' '}
            <button className="btn" type="button">
              <span className="dot c-orange">
                Pending approval
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {' '}
            <DcLink className="btn pr" href="PurchaseBill.dc.html">
              Receive goods / Bill
            </DcLink>
          </header>
          <div className="split">
            <div className="lp">
              <div className="tabs" role="tablist">
                <button className={v.tc?.items} type="button" role="tab" onClick={v.go?.items}>
                  {"Items "}
                  <span className="n">
                    2
                  </span>
                </button>
                {' '}
                <button className={v.tc?.approvals} type="button" role="tab" onClick={v.go?.approvals}>
                  {"Approvals "}
                  <span className="n">
                    1
                  </span>
                </button>
                {' '}
                <button className="tab" type="button" role="tab">
                  {"Receipts (GRN) "}
                  <span className="n">
                    0
                  </span>
                </button>
                {' '}
                <button className="tab" type="button" role="tab">
                  {"Bills "}
                  <span className="n">
                    0
                  </span>
                </button>
                {' '}
                <button className="tab" type="button" role="tab">
                  Activity
                </button>
                {' '}
                <button className="tab" type="button" role="tab">
                  Notes
                </button>
              </div>
              {v.show?.items ? (
                <>
                  <div className="pane">
                    <div className="ph2">
                      <h2>
                        Yarn to buy
                      </h2>
                      <button className="btn sm" type="button">
                        + Add line
                      </button>
                    </div>
                    <div style={{"overflowX":"auto"}}>
                      <table>
                        <thead>
                          <tr>
                            <th>
                              Yarn quality
                            </th>
                            <th>
                              Grade
                            </th>
                            <th className="r">
                              Boxes
                            </th>
                            <th className="r">
                              Order kg
                            </th>
                            <th className="r">
                              Rate ₹/kg
                            </th>
                            <th className="r">
                              Amount ₹
                            </th>
                            <th>
                              Received
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <div>
                                Polyester FDY 75/36 SD Raw White
                              </div>
                              <div className="muted" style={{"fontSize":"12px"}}>
                                {"HSN 5402 · last rate ₹ 128.00 → "}
                                <span style={{"color":"#FB923C"}}>
                                  +₹ 3.50
                                </span>
                              </div>
                            </td>
                            <td className="t2">
                              AA
                            </td>
                            <td className="r">
                              100
                            </td>
                            <td className="r">
                              6,000.00
                            </td>
                            <td className="r">
                              131.50
                            </td>
                            <td className="r">
                              7,89,000.00
                            </td>
                            <td>
                              <span className="prog">
                                <i style={{"width":"0%"}} />
                              </span>
                              {' '}
                              <span className="muted" style={{"fontSize":"12px"}}>
                                0 kg
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div>
                                Polyester FDY 150/48 BR
                              </div>
                              <div className="muted" style={{"fontSize":"12px"}}>
                                HSN 5402 · last rate ₹ 118.00 → same
                              </div>
                            </td>
                            <td className="t2">
                              AA
                            </td>
                            <td className="r">
                              80
                            </td>
                            <td className="r">
                              4,800.00
                            </td>
                            <td className="r">
                              118.00
                            </td>
                            <td className="r">
                              5,66,400.00
                            </td>
                            <td>
                              <span className="prog">
                                <i style={{"width":"0%"}} />
                              </span>
                              {' '}
                              <span className="muted" style={{"fontSize":"12px"}}>
                                0 kg
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style={{"fontWeight":"600"}}>
                              Total
                            </td>
                            <td />
                            <td className="r" style={{"fontWeight":"600"}}>
                              180
                            </td>
                            <td className="r" style={{"fontWeight":"600"}}>
                              10,800.00
                            </td>
                            <td />
                            <td className="r" style={{"fontWeight":"600"}}>
                              13,55,400.00
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(220px, 1fr))","gap":"12px"}}>
                      <div className="box" style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                        <span className="muted">
                          Why this order
                        </span>
                        <span>
                          FDY 75/36 covers 12 days at current sales. AI suggested 6,000 kg.
                        </span>
                      </div>
                      <div className="box" style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                        <span className="muted">
                          Linked sales orders
                        </span>
                        <span>
                          <DcLink href="SalesOrder.dc.html" style={{"textDecoration":"underline"}}>
                            SO-0419
                          </DcLink>
                          {", "}
                          <DcLink href="SalesOrderList.dc.html" style={{"textDecoration":"underline"}}>
                            SO-0412
                          </DcLink>
                          {" · 4,800 kg reserved"}
                        </span>
                      </div>
                      <div className="box" style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                        <span className="muted">
                          Mill rate trend · FDY 75/36
                        </span>
                        <span style={{"display":"flex","alignItems":"flex-end","gap":"4px","height":"28px"}} role="img" aria-label="Rate rose from 126 to 131.50 over 5 orders">
                          <i style={{"width":"14px","height":"12px","background":"var(--s3)","borderRadius":"2px"}} />
                          <i style={{"width":"14px","height":"14px","background":"var(--s3)","borderRadius":"2px"}} />
                          <i style={{"width":"14px","height":"16px","background":"var(--s3)","borderRadius":"2px"}} />
                          <i style={{"width":"14px","height":"18px","background":"var(--s3)","borderRadius":"2px"}} />
                          <i style={{"width":"14px","height":"28px","background":"#F97316","borderRadius":"2px"}} />
                          <span className="muted" style={{"fontSize":"12px","marginLeft":"6px"}}>
                            ₹ 126 → 131.50
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              {' '}
              {v.show?.approvals ? (
                <>
                  <div className="pane">
                    <div className="ph2">
                      <h2>
                        Approval flow
                      </h2>
                      <span className="dot c-orange">
                        Waiting on Avi Patel
                      </span>
                    </div>
                    <div className="step">
                      <span className="av" style={{"background":"#0D9488","width":"28px","height":"28px"}}>
                        MP
                      </span>
                      <div style={{"flex":"1"}}>
                        <b style={{"fontWeight":"500"}}>
                          Raised
                        </b>
                        {' '}
                        <span className="muted">
                          by Meera Patel · Purchase
                        </span>
                      </div>
                      <span className="tag t-green">
                        Done
                      </span>
                    </div>
                    <div className="step">
                      <span className="av" style={{"background":"#7C3AED","width":"28px","height":"28px"}}>
                        AI
                      </span>
                      <div style={{"flex":"1"}}>
                        <div>
                          <b style={{"fontWeight":"500"}}>
                            Rule check
                          </b>
                          {' '}
                          <span className="muted">
                            · automatic
                          </span>
                        </div>
                        <div className="muted" style={{"fontSize":"13px"}}>
                          Order value ₹ 14.23 L is above the ₹ 10 L purchase limit
                        </div>
                      </div>
                      <span className="tag t-orange">
                        Needs owner
                      </span>
                    </div>
                    <div className="step" style={{"borderBottom":"0"}}>
                      <span className="av" style={{"background":"#B45309","width":"28px","height":"28px"}}>
                        AP
                      </span>
                      <div style={{"flex":"1","display":"flex","flexDirection":"column","gap":"10px"}}>
                        <b style={{"fontWeight":"500"}}>
                          Owner approval
                        </b>
                        <textarea className="inp" aria-label="Approval remark" placeholder="Remark (optional)" />
                        <div style={{"display":"flex","gap":"8px"}}>
                          <button className="btn ok" type="button">
                            {"Approve & send to mill"}
                          </button>
                          <button className="btn no" type="button">
                            Reject
                          </button>
                        </div>
                      </div>
                      <span className="tag t-orange">
                        Pending
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
              <div className="botbar">
                <button type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  </svg>
                  WhatsApp mill
                </button>
                <button type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Comment
                </button>
              </div>
            </div>
            <aside className="rp">
              <div className="rid">
                PO-26-27-0123
              </div>
              <div className="rhead">
                <span className="big">
                  R
                </span>
                <div>
                  <div style={{"fontSize":"20px","lineHeight":"28px","fontWeight":"500"}}>
                    Reliance Industries
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    Polyester division · Silvassa
                  </div>
                  <div className="ibs">
                    <button className="ib" type="button" aria-label="WhatsApp">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                      </svg>
                    </button>
                    {' '}
                    <button className="ib" type="button" aria-label="Email">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-10 5L2 7" />
                      </svg>
                    </button>
                    {' '}
                    <DcLink className="ib" href="Ledger.dc.html" aria-label="Open ledger">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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
                    Order details
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    PO date
                  </span>
                  <span className="v">
                    23-10-2026
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Expected by
                  </span>
                  <span className="v">
                    02-11-2026
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Deliver to
                  </span>
                  <span className="v">
                    Sachin GIDC godown
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Credit days
                  </span>
                  <span className="v">
                    60 days
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Rate valid till
                  </span>
                  <span className="v">
                    25-10-2026
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Transporter
                  </span>
                  <span className="v">
                    Jay Ambe Roadlines
                  </span>
                </div>
              </div>
              <div className="sec">
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    Mill account
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Payable now
                  </span>
                  <span className="v">
                    ₹ 9,75,623
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Due this week
                  </span>
                  <span className="v">
                    <span className="tag t-orange">
                      ₹ 4,73,400
                    </span>
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Bought this FY
                  </span>
                  <span className="v">
                    ₹ 3.86 Cr
                  </span>
                </div>
              </div>
              <div className="sec" style={{"borderBottom":"0"}}>
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    Totals
                  </span>
                  <span className="tag t-gray" style={{"flex":"none"}}>
                    Inter-state · IGST
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Taxable value
                  </span>
                  <span className="v">
                    ₹ 13,55,400.00
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    IGST 5%
                  </span>
                  <span className="v">
                    ₹ 67,770.00
                  </span>
                </div>
                <div className="kv">
                  <span className="k" style={{"color":"var(--t1)","fontWeight":"600"}}>
                    Order total
                  </span>
                  <span className="v" style={{"fontSize":"18px","fontWeight":"600"}}>
                    ₹ 14,23,170.00
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="po" />
        </div>
      </div>
      </>
    );
  }
}

export default function PurchaseOrder(props) {
  const theme = useTheme();
  return <PurchaseOrderView {...props} theme={theme} />;
}
