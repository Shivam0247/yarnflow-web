/* eslint-disable */
// SalesOrder — converted 1:1 from the YarnFlow design (SalesOrder.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './SalesOrder.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: null }; }
  renderVals() {
    const tab = this.state.tab ?? this.props.startTab ?? 'items';
    const keys = ['items', 'activity', 'approvals', 'dispatch', 'notes'];
    const tc = {}, go = {}, show = {};
    keys.forEach((k) => { tc[k] = k === tab ? 'tab on' : 'tab'; show[k] = k === tab; go[k] = () => this.setState({ tab: k }); });
    return { theme: this.props.theme ?? 'dark', tc, go, show, goAppr: () => this.setState({ tab: 'approvals' }) };
  }
}

/* ----- view ----- */
class SalesOrderView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="so" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href="SalesOrderList.dc.html">
                Sales Orders
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                SO-26-27-0419
              </span>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
              </svg>
              AI check
            </button>
            {' '}
            <button className="btn" type="button">
              <span className="av" style={{"background":"#2563EB","width":"22px","height":"22px"}}>
                RS
              </span>
              Rajesh Shah
            </button>
            {' '}
            <button className="btn" type="button">
              <span className="dot c-orange">
                On hold · approval
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.goAppr}>
              Approve → Pending
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <div className="tabs" role="tablist">
                <button className={v.tc?.items} type="button" role="tab" onClick={v.go?.items}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M5.5 6.5c4.5.5 9 4.5 10.5 12" />
                    <path d="M9.5 3.3c3.5 2 6.6 6 7.6 11.6" />
                  </svg>
                  {"Items "}
                  <span className="n">
                    3
                  </span>
                </button>
                {' '}
                <button className={v.tc?.activity} type="button" role="tab" onClick={v.go?.activity}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  Activity
                </button>
                {' '}
                <button className={v.tc?.approvals} type="button" role="tab" onClick={v.go?.approvals}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  {"Approvals "}
                  <span className="n">
                    1
                  </span>
                </button>
                {' '}
                <button className={v.tc?.dispatch} type="button" role="tab" onClick={v.go?.dispatch}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                  Dispatches
                </button>
                {' '}
                <button className={v.tc?.notes} type="button" role="tab" onClick={v.go?.notes}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                  {"Notes "}
                  <span className="n">
                    1
                  </span>
                </button>
                {' '}
                <button className="tab" type="button" role="tab">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  {"Attachments "}
                  <span className="n">
                    2
                  </span>
                </button>
              </div>
              {v.show?.items ? (
                <>
                  <div className="pane">
                    <div className="ph2">
                      <h2>
                        Yarn items
                      </h2>
                      <button className="btn sm" type="button">
                        Copy from quotation
                      </button>
                      <button className="btn sm pr" type="button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                        Add line
                      </button>
                    </div>
                    <div style={{"overflowX":"auto"}}>
                      <table>
                        <thead>
                          <tr>
                            <th>
                              #
                            </th>
                            <th>
                              Yarn quality
                            </th>
                            <th>
                              Shade / Lot
                            </th>
                            <th className="r">
                              Boxes
                            </th>
                            <th className="r">
                              Net kg
                            </th>
                            <th className="r">
                              Rate ₹/kg
                            </th>
                            <th className="r">
                              Disc %
                            </th>
                            <th className="r">
                              Amount ₹
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="muted">
                              1
                            </td>
                            <td>
                              <div>
                                Polyester FDY 75/36 SD
                              </div>
                              <div className="muted" style={{"fontSize":"12px"}}>
                                HSN 5402 · AA grade
                              </div>
                            </td>
                            <td className="t2">
                              Raw white · L-2231
                            </td>
                            <td className="r">
                              40
                            </td>
                            <td className="r">
                              2,400.00
                            </td>
                            <td className="r">
                              136.00
                            </td>
                            <td className="r">
                              0.5
                            </td>
                            <td className="r">
                              3,24,768.00
                            </td>
                          </tr>
                          <tr>
                            <td className="muted">
                              2
                            </td>
                            <td>
                              <div>
                                Viscose Filament 120D/30F BR
                              </div>
                              <div className="muted" style={{"fontSize":"12px"}}>
                                HSN 5403 · A grade
                              </div>
                            </td>
                            <td className="t2">
                              Dyed navy · V-118
                            </td>
                            <td className="r">
                              12
                            </td>
                            <td className="r">
                              600.00
                            </td>
                            <td className="r">
                              212.50
                            </td>
                            <td className="r">
                              —
                            </td>
                            <td className="r">
                              1,27,500.00
                            </td>
                          </tr>
                          <tr>
                            <td className="muted">
                              3
                            </td>
                            <td>
                              <div>
                                Nylon 6 FDY 40/34 SD
                              </div>
                              <div className="muted" style={{"fontSize":"12px"}}>
                                HSN 5402 · A grade
                              </div>
                            </td>
                            <td className="t2">
                              Raw white · N-904
                            </td>
                            <td className="r">
                              8
                            </td>
                            <td className="r">
                              384.00
                            </td>
                            <td className="r">
                              268.00
                            </td>
                            <td className="r">
                              1.0
                            </td>
                            <td className="r">
                              1,01,882.88
                            </td>
                          </tr>
                          <tr>
                            <td className="muted">
                              4
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Yarn quality" placeholder="Search yarn  (F2)" style={{"minWidth":"220px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Shade or lot" placeholder="Lot" />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Boxes" placeholder="0" style={{"textAlign":"right","width":"64px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Net kg" placeholder="0.00" style={{"textAlign":"right","width":"88px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Rate" placeholder="0.00" style={{"textAlign":"right","width":"88px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Discount" placeholder="0" style={{"textAlign":"right","width":"56px"}} />
                            </td>
                            <td className="r muted">
                              —
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{"display":"flex","flexWrap":"wrap","gap":"12px","alignItems":"center","fontSize":"13px"}}>
                      <span className="muted" style={{"flex":"1 1 260px"}}>
                        <kbd>
                          Enter
                        </kbd>
                        {" add line · "}
                        <kbd>
                          F2
                        </kbd>
                        {" search yarn · "}
                        <kbd>
                          Ctrl D
                        </kbd>
                        {" duplicate"}
                      </span>
                      <span>
                        {"60 boxes · 816 cones · "}
                        <b style={{"fontWeight":"600"}}>
                          3,384.00 kg
                        </b>
                      </span>
                    </div>
                    <div className="ai">
                      <div style={{"display":"flex","alignItems":"center","gap":"8px","fontWeight":"600"}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
                        </svg>
                        AI order check
                      </div>
                      <span className="dot c-green t2">
                        Stock available for all 3 lines in Sachin GIDC godown.
                      </span>
                      {' '}
                      <span className="dot c-red t2">
                        Credit limit exceeded by ₹ 4.66 L — keep in mind before approving.
                      </span>
                      {' '}
                      <span className="dot c-violet t2">
                        Party paid ₹ 137.50/kg avg for FDY 75/36 on last 5 orders; this line is ₹ 1.50 lower.
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
              {' '}
              {v.show?.activity ? (
                <>
                  <div className="pane">
                    <div className="ph2">
                      <h2>
                        Activity
                      </h2>
                      <button className="btn sm" type="button">
                        + New
                      </button>
                    </div>
                    <div className="act">
                      <span className="ico">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </span>
                      <span style={{"flex":"1","paddingTop":"4px"}}>
                        <b style={{"fontWeight":"500"}}>
                          Rajesh Shah
                        </b>
                        {' '}
                        <span className="muted">
                          created this order from quotation QT-0388
                        </span>
                      </span>
                      <span className="muted" style={{"paddingTop":"4px"}}>
                        2 hours ago
                      </span>
                    </div>
                    <div className="act">
                      <span className="ico">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
                        </svg>
                      </span>
                      <span style={{"flex":"1","paddingTop":"4px"}}>
                        <b style={{"fontWeight":"500"}}>
                          YarnFlow AI
                        </b>
                        {' '}
                        <span className="muted">
                          flagged credit limit and rate below party average
                        </span>
                      </span>
                      <span className="muted" style={{"paddingTop":"4px"}}>
                        2 hours ago
                      </span>
                    </div>
                    <div className="act">
                      <span className="ico">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="m22 2-7 20-4-9-9-4Z" />
                        </svg>
                      </span>
                      <span style={{"flex":"1","paddingTop":"4px"}}>
                        <b style={{"fontWeight":"500"}}>
                          Rajesh Shah
                        </b>
                        {' '}
                        <span className="muted">
                          submitted for approval to
                        </span>
                        {' '}
                        <b style={{"fontWeight":"500"}}>
                          Avi Patel
                        </b>
                      </span>
                      <span className="muted" style={{"paddingTop":"4px"}}>
                        1 hour ago
                      </span>
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
                        On hold · waiting on Avi Patel
                      </span>
                    </div>
                    <div className="t2" style={{"fontSize":"13px"}}>
                      On hold → approve → Pending dispatch → closes automatically once fully dispatched.
                    </div>
                    <div className="step">
                      <span className="av" style={{"background":"#2563EB","width":"28px","height":"28px"}}>
                        RS
                      </span>
                      <div style={{"flex":"1"}}>
                        <div>
                          <b style={{"fontWeight":"500"}}>
                            Submitted
                          </b>
                          {' '}
                          <span className="muted">
                            by Rajesh Shah · Salesperson
                          </span>
                        </div>
                        <div className="muted" style={{"fontSize":"13px"}}>
                          “Regular party, payment coming Monday.”
                        </div>
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
                            Credit check
                          </b>
                          {' '}
                          <span className="muted">
                            · automatic
                          </span>
                        </div>
                        <div className="muted" style={{"fontSize":"13px"}}>
                          Outstanding ₹ 4.82 L + this order ₹ 5.84 L exceeds ₹ 6.00 L limit by ₹ 4.66 L
                        </div>
                      </div>
                      <span className="tag t-red">
                        Failed
                      </span>
                    </div>
                    <div className="step" style={{"borderBottom":"0"}}>
                      <span className="av" style={{"background":"#B45309","width":"28px","height":"28px"}}>
                        AP
                      </span>
                      <div style={{"flex":"1","display":"flex","flexDirection":"column","gap":"10px"}}>
                        <div>
                          <b style={{"fontWeight":"500"}}>
                            Owner approval
                          </b>
                          {' '}
                          <span className="muted">
                            · Avi Patel
                          </span>
                        </div>
                        <textarea className="inp" aria-label="Approval remark" placeholder="Add a remark (optional)" />
                        <div style={{"display":"flex","gap":"8px"}}>
                          <button className="btn ok" type="button">
                            Approve → Pending
                          </button>
                          <button className="btn" type="button">
                            Keep on hold
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
              {' '}
              {v.show?.dispatch ? (
                <>
                  <div className="pane" style={{"alignItems":"center","justifyContent":"center","textAlign":"center","gap":"10px","minHeight":"360px"}}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{"color":"var(--t3)"}}>
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                    <div style={{"fontWeight":"500"}}>
                      No dispatches yet
                    </div>
                    <div className="muted">
                      Dispatch can start once the order is approved.
                    </div>
                    <DcLink className="btn" href="Dispatch.dc.html">
                      Create dispatch
                    </DcLink>
                  </div>
                </>
              ) : null}
              {' '}
              {v.show?.notes ? (
                <>
                  <div className="pane">
                    <div className="ph2">
                      <h2>
                        Notes
                      </h2>
                      <button className="btn sm pr" type="button">
                        + New Note
                      </button>
                    </div>
                    <div style={{"width":"260px","border":"1px solid var(--bd)","borderRadius":"12px","padding":"16px","background":"var(--s1)","display":"flex","flexDirection":"column","gap":"8px"}}>
                      <b style={{"fontWeight":"600"}}>
                        Packing
                      </b>
                      <span className="t2" style={{"fontSize":"13px"}}>
                        Pack in 5-ply cartons. Deliver before 11 AM — party godown closes afternoons.
                      </span>
                      <span className="muted" style={{"fontSize":"12px","display":"flex","gap":"8px","alignItems":"center"}}>
                        <span className="av" style={{"background":"#2563EB","width":"18px","height":"18px","fontSize":"9px"}}>
                          RS
                        </span>
                        Rajesh S. · today
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
                  WhatsApp party
                </button>
                <button type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Comment
                </button>
                <button type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 9V2h12v7" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect width="12" height="8" x="6" y="14" />
                  </svg>
                  Print PI
                </button>
              </div>
            </div>
            <aside className="rp">
              <div className="rid">
                SO-26-27-0419
              </div>
              <div className="rhead">
                <span className="big">
                  K
                </span>
                <div>
                  <div style={{"fontSize":"20px","lineHeight":"28px","fontWeight":"500"}}>
                    Krishna Textiles
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
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </DcLink>
                    {' '}
                    <button className="ib" type="button" aria-label="Attach file">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                    {' '}
                    <button className="ib del" type="button" aria-label="Cancel order">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
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
                  <button className="ib" type="button" aria-label="Edit details" style={{"width":"28px","height":"28px","background":"transparent"}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
                <div className="kv">
                  <span className="k">
                    Order date
                  </span>
                  <span className="v">
                    23-10-2026
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Deliver by
                  </span>
                  <span className="v">
                    28-10-2026
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Broker
                  </span>
                  <span className="v">
                    Mahesh Shah · 1%
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Payment terms
                  </span>
                  <span className="v">
                    45 days credit
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Transporter
                  </span>
                  <span className="v">
                    Navkar Roadlines
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Godown
                  </span>
                  <span className="v">
                    Sachin GIDC
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Party PO
                  </span>
                  <span className="v">
                    KT/PO/7781
                  </span>
                </div>
              </div>
              <div className="sec">
                <div className="sech">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>
                    Party credit
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    GSTIN
                  </span>
                  <span className="v">
                    24AABCK1234F1Z5
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Outstanding
                  </span>
                  <span className="v">
                    ₹ 4,82,350
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Overdue
                  </span>
                  <span className="v">
                    <span className="tag t-red">
                      ₹ 2,14,000 · 18 days
                    </span>
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Credit limit
                  </span>
                  <span className="v">
                    {"₹ 6,00,000 "}
                    <span className="muted">
                      · 80% used
                    </span>
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
                    CGST + SGST
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Taxable value
                  </span>
                  <span className="v">
                    ₹ 5,54,150.88
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    CGST 2.5%
                  </span>
                  <span className="v">
                    ₹ 13,853.77
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    SGST 2.5%
                  </span>
                  <span className="v">
                    ₹ 13,853.77
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Freight
                  </span>
                  <span className="v">
                    ₹ 1,800.00
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Round off
                  </span>
                  <span className="v">
                    − ₹ 0.42
                  </span>
                </div>
                <div className="kv">
                  <span className="k" style={{"color":"var(--t1)","fontWeight":"600"}}>
                    Grand total
                  </span>
                  <span className="v" style={{"fontSize":"18px","fontWeight":"600"}}>
                    ₹ 5,83,658.00
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="so" />
        </div>
      </div>
      </>
    );
  }
}

export default function SalesOrder(props) {
  const theme = useTheme();
  return <SalesOrderView {...props} theme={theme} />;
}
