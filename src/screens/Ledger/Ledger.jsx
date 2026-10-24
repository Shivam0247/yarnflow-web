/* eslint-disable */
// Ledger — converted 1:1 from the YarnFlow design (Ledger.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Ledger.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: 'led' }; }
  renderVals() {
    const tab = this.state.tab;
    const tc = {}, go = {}, show = {};
    ['led', 'bills'].forEach((k) => { tc[k] = k === tab ? 'tab on' : 'tab'; show[k] = k === tab; go[k] = () => this.setState({ tab: k }); });
    return { theme: this.props.theme ?? 'dark', tc, go, show };
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
                Krishna Textiles
              </span>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
              Print
            </button>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Excel
            </button>
            {' '}
            <button className="btn pr" type="button">
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
                    4
                  </span>
                </button>
                {' '}
                <DcLink className="tab" href="SalesOrderList.dc.html">
                  {"Orders "}
                  <span className="n">
                    38
                  </span>
                </DcLink>
                {' '}
                <button className="tab" type="button" role="tab">
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
                    <input className="inp" type="text" defaultValue="01-09-2026" aria-label="From date" style={{"width":"130px"}} />
                    <span className="muted">
                      to
                    </span>
                    <input className="inp" type="text" defaultValue="23-10-2026" aria-label="To date" style={{"width":"130px"}} />
                    {' '}
                    <select className="inp" aria-label="Voucher type">
                      <option>
                        All vouchers
                      </option>
                      <option>
                        Sales
                      </option>
                      <option>
                        Receipt
                      </option>
                      <option>
                        Credit note
                      </option>
                      <option>
                        Journal
                      </option>
                    </select>
                    <div style={{"flex":"1"}} />
                    <label className="muted" style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                      <input type="checkbox" defaultChecked style={{"accentColor":"#8F8F8F"}} />
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
                            01-09-2026
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
                            3,10,250.00 Dr
                          </td>
                        </tr>
                        <tr>
                          <td className="t2">
                            04-09-2026
                          </td>
                          <td>
                            <span className="dot c-blue">
                              Sales
                            </span>
                          </td>
                          <td>
                            <DcLink href="Dispatch.dc.html" style={{"textDecoration":"underline"}}>
                              SI-0688
                            </DcLink>
                          </td>
                          <td>
                            PFY 75/36 SD · 1,800 kg
                          </td>
                          <td className="r">
                            2,57,040.00
                          </td>
                          <td className="r" />
                          <td className="r">
                            5,67,290.00 Dr
                          </td>
                        </tr>
                        <tr>
                          <td className="t2">
                            12-09-2026
                          </td>
                          <td>
                            <span className="dot c-green">
                              Receipt
                            </span>
                          </td>
                          <td>
                            RC-0412
                          </td>
                          <td>
                            HDFC · NEFT UTR 4471
                          </td>
                          <td className="r" />
                          <td className="r">
                            2,00,000.00
                          </td>
                          <td className="r">
                            3,67,290.00 Dr
                          </td>
                        </tr>
                        <tr>
                          <td className="t2">
                            18-09-2026
                          </td>
                          <td>
                            <span className="dot c-blue">
                              Sales
                            </span>
                          </td>
                          <td>
                            <DcLink href="Dispatch.dc.html" style={{"textDecoration":"underline"}}>
                              SI-0721
                            </DcLink>
                          </td>
                          <td>
                            Viscose 120D BR · 600 kg
                          </td>
                          <td className="r">
                            1,33,875.00
                          </td>
                          <td className="r" />
                          <td className="r">
                            5,01,165.00 Dr
                          </td>
                        </tr>
                        <tr>
                          <td className="t2">
                            27-09-2026
                          </td>
                          <td>
                            <span className="dot c-orange">
                              Credit note
                            </span>
                          </td>
                          <td>
                            CN-0034
                          </td>
                          <td>
                            Rate difference on SI-0688
                          </td>
                          <td className="r" />
                          <td className="r">
                            4,815.00
                          </td>
                          <td className="r">
                            4,96,350.00 Dr
                          </td>
                        </tr>
                        <tr>
                          <td className="t2">
                            06-10-2026
                          </td>
                          <td>
                            <span className="dot c-green">
                              Receipt
                            </span>
                          </td>
                          <td>
                            RC-0466
                          </td>
                          <td>
                            Cheque 018822 · SBI
                          </td>
                          <td className="r" />
                          <td className="r">
                            1,50,000.00
                          </td>
                          <td className="r">
                            3,46,350.00 Dr
                          </td>
                        </tr>
                        <tr>
                          <td className="t2">
                            10-10-2026
                          </td>
                          <td>
                            <span className="dot c-blue">
                              Sales
                            </span>
                          </td>
                          <td>
                            <DcLink href="Dispatch.dc.html" style={{"textDecoration":"underline"}}>
                              SI-0790
                            </DcLink>
                          </td>
                          <td>
                            Nylon 6 FDY 40/34 · 500 kg
                          </td>
                          <td className="r">
                            1,40,700.00
                          </td>
                          <td className="r" />
                          <td className="r">
                            4,87,050.00 Dr
                          </td>
                        </tr>
                        <tr>
                          <td className="t2">
                            15-10-2026
                          </td>
                          <td>
                            <span className="dot c-violet">
                              Journal
                            </span>
                          </td>
                          <td>
                            JV-0102
                          </td>
                          <td>
                            Brokerage adjustment · Mahesh Shah
                          </td>
                          <td className="r" />
                          <td className="r">
                            4,700.00
                          </td>
                          <td className="r">
                            4,82,350.00 Dr
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4">
                            Closing balance
                          </td>
                          <td className="r">
                            5,31,615.00
                          </td>
                          <td className="r">
                            3,59,515.00
                          </td>
                          <td className="r">
                            4,82,350.00 Dr
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
                        <tr>
                          <td>
                            SI-0598
                          </td>
                          <td className="t2">
                            05-08-2026
                          </td>
                          <td className="t2">
                            19-09-2026
                          </td>
                          <td>
                            <span className="tag t-red">
                              79 days
                            </span>
                          </td>
                          <td className="r">
                            1,48,250.00
                          </td>
                          <td className="r">
                            1,48,250.00
                          </td>
                        </tr>
                        <tr>
                          <td>
                            SI-0640
                          </td>
                          <td className="t2">
                            22-08-2026
                          </td>
                          <td className="t2">
                            06-10-2026
                          </td>
                          <td>
                            <span className="tag t-red">
                              62 days
                            </span>
                          </td>
                          <td className="r">
                            1,62,000.00
                          </td>
                          <td className="r">
                            1,62,000.00
                          </td>
                        </tr>
                        <tr>
                          <td>
                            SI-0721
                          </td>
                          <td className="t2">
                            18-09-2026
                          </td>
                          <td className="t2">
                            02-11-2026
                          </td>
                          <td>
                            <span className="tag t-orange">
                              35 days
                            </span>
                          </td>
                          <td className="r">
                            1,33,875.00
                          </td>
                          <td className="r">
                            31,400.00
                          </td>
                        </tr>
                        <tr>
                          <td>
                            SI-0790
                          </td>
                          <td className="t2">
                            10-10-2026
                          </td>
                          <td className="t2">
                            24-11-2026
                          </td>
                          <td>
                            <span className="tag t-gray">
                              13 days
                            </span>
                          </td>
                          <td className="r">
                            1,40,700.00
                          </td>
                          <td className="r">
                            1,40,700.00
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5">
                            Total pending
                          </td>
                          <td className="r">
                            4,82,350.00
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    <div style={{"display":"flex","gap":"8px","padding":"16px 0"}}>
                      <DcLink className="btn pr" href="Payments.dc.html">
                        Record receipt
                      </DcLink>
                      <button className="btn" type="button">
                        Send reminder
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
            <aside className="rp">
              <div className="rid">
                ACC-SD-0412
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
                    <button className="ib" type="button" aria-label="Call">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    {' '}
                    <DcLink className="ib" href="AccountMaster.dc.html" aria-label="Edit account">
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
                    ₹ 1,12,400.00 Dr
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Total debit
                  </span>
                  <span className="v">
                    ₹ 18,46,250.00
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Total credit
                  </span>
                  <span className="v">
                    ₹ 14,76,300.00
                  </span>
                </div>
                <div className="kv">
                  <span className="k" style={{"color":"var(--t1)","fontWeight":"600"}}>
                    Closing
                  </span>
                  <span className="v" style={{"fontSize":"18px","fontWeight":"600"}}>
                    ₹ 4,82,350.00 Dr
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
                <div className="age" role="img" aria-label="0 to 30 days 1.41 lakh, 31 to 60 days 0.31 lakh, 61 to 90 days 3.10 lakh">
                  <i style={{"width":"29%","background":"#8F8F8F"}} />
                  <i style={{"width":"7%","background":"#F97316"}} />
                  <i style={{"width":"64%","background":"#EF4444"}} />
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot c-gray">
                      0–30 days
                    </span>
                  </span>
                  <span className="v">
                    ₹ 1,40,700
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot c-orange">
                      31–60 days
                    </span>
                  </span>
                  <span className="v">
                    ₹ 31,400
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot" style={{"--c":"#EF4444"}}>
                      61–90 days
                    </span>
                  </span>
                  <span className="v">
                    ₹ 3,10,250
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    <span className="dot c-gray">
                      90+ days
                    </span>
                  </span>
                  <span className="v">
                    ₹ 0
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
                    Sundry Debtors › Surat
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
                    Credit limit
                  </span>
                  <span className="v">
                    ₹ 6,00,000 · 45 days
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Broker
                  </span>
                  <span className="v">
                    Mahesh Shah
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
