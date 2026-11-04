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
  constructor(p) { super(p); this.state = { kind: 'r' }; }
  renderVals() {
    const r = this.state.kind === 'r';
    return {
      theme: this.props.theme ?? 'dark',
      rc: r ? 'on' : '', py: r ? '' : 'on',
      setR: () => this.setState({ kind: 'r' }), setP: () => this.setState({ kind: 'p' }),
      kind: r ? 'Receipt' : 'Payment', kindLower: r ? 'receipt' : 'payment',
      docNo: r ? 'RC-26-27-0471' : 'PY-26-27-0092',
      partyLabel: r ? 'Received from' : 'Paid to',
      partyName: r ? 'Krishna Textiles' : 'Reliance Industries',
      partySub: r ? 'Sundry Debtors · Ring Road, Surat' : 'Sundry Creditors · Yarn mill, Silvassa',
      initial: r ? 'K' : 'R', p: r ? 'SI' : 'PB', drcr: r ? 'Dr' : 'Cr'
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
              <button type="button">
                Contra
              </button>
              <button type="button">
                Journal
              </button>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              Send voucher
            </button>
            {' '}
            <button className="btn pr" type="button">
              {"Save "}{v.kindLower}
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <div className="pane">
                <div className="ph2">
                  <h2>
                    {v.kind}{" details"}
                  </h2>
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="p1">
                      {v.partyLabel}{" "}
                      <span style={{"color":"#EF4444"}}>
                        *
                      </span>
                    </label>
                    <select id="p1" className="inp">
                      <option>
                        {v.partyName}
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="p2">
                      {"Amount "}
                      <span style={{"color":"#EF4444"}}>
                        *
                      </span>
                    </label>
                    <input id="p2" className="inp" type="text" defaultValue="₹ 2,00,000.00" />
                  </div>
                  <div className="fld">
                    <label htmlFor="p3">
                      Date
                    </label>
                    <input id="p3" className="inp" type="text" defaultValue="23-10-2026" />
                  </div>
                  <div className="fld">
                    <label htmlFor="p4">
                      Mode
                    </label>
                    <select id="p4" className="inp">
                      <option>
                        NEFT / RTGS
                      </option>
                      <option>
                        Cheque
                      </option>
                      <option>
                        UPI
                      </option>
                      <option>
                        Cash
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="p5">
                      Bank account
                    </label>
                    <select id="p5" className="inp">
                      <option>
                        HDFC Bank · Current ••4412
                      </option>
                      <option>
                        SBI · Current ••0918
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="p6">
                      UTR / cheque no.
                    </label>
                    <input id="p6" className="inp" type="text" defaultValue="HDFCR52026102318821" />
                  </div>
                </div>
                <div className="ph2" style={{"marginTop":"6px"}}>
                  <h2 style={{"fontSize":"16px"}}>
                    Adjust against bills
                  </h2>
                  <button className="btn" type="button">
                    Auto-adjust oldest first
                  </button>
                </div>
                <div style={{"overflowX":"auto"}}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{"width":"36px"}}>
                          <input className="cb" type="checkbox" aria-label="Select all bills" defaultChecked />
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
                      <tr>
                        <td>
                          <input className="cb" type="checkbox" aria-label="SI-0598" defaultChecked />
                        </td>
                        <td>
                          {v.p}-0598
                        </td>
                        <td className="t2">
                          05-08-2026
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
                        <td className="r">
                          <input className="cin" type="text" defaultValue="1,48,250.00" aria-label="Adjust on 0598" />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input className="cb" type="checkbox" aria-label="SI-0640" defaultChecked />
                        </td>
                        <td>
                          {v.p}-0640
                        </td>
                        <td className="t2">
                          22-08-2026
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
                        <td className="r">
                          <input className="cin" type="text" defaultValue="51,750.00" aria-label="Adjust on 0640" />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input className="cb" type="checkbox" aria-label="SI-0721" />
                        </td>
                        <td>
                          {v.p}-0721
                        </td>
                        <td className="t2">
                          18-09-2026
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
                        <td className="r">
                          <input className="cin" type="text" placeholder="0.00" aria-label="Adjust on 0721" />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input className="cb" type="checkbox" aria-label="SI-0790" />
                        </td>
                        <td>
                          {v.p}-0790
                        </td>
                        <td className="t2">
                          10-10-2026
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
                        <td className="r">
                          <input className="cin" type="text" placeholder="0.00" aria-label="Adjust on 0790" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="sum">
                  <div>
                    <span className="muted">
                      Amount
                    </span>
                    <b>
                      ₹ 2,00,000.00
                    </b>
                  </div>
                  <div>
                    <span className="muted">
                      Adjusted
                    </span>
                    <b>
                      ₹ 2,00,000.00
                    </b>
                  </div>
                  <div>
                    <span className="muted">
                      On account
                    </span>
                    <b>
                      ₹ 0.00
                    </b>
                  </div>
                  <div>
                    <span className="muted">
                      Balance after this
                    </span>
                    <b>
                      ₹ 2,82,350.00
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
                  <DcLink href="Ledger.dc.html" className="muted" style={{"fontSize":"13px","fontWeight":"400"}}>
                    Open ledger →
                  </DcLink>
                </div>
                <div className="kv">
                  <span className="k">
                    Outstanding
                  </span>
                  <span className="v">
                    {"₹ 4,82,350.00 "}{v.drcr}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Overdue
                  </span>
                  <span className="v">
                    <span className="tag t-red">
                      ₹ 3,10,250.00
                    </span>
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Credit days
                  </span>
                  <span className="v">
                    45 days
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    Avg. pay delay
                  </span>
                  <span className="v">
                    +21 days
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
                <div className="kv">
                  <span className="k">
                    06-10-2026
                  </span>
                  <span className="v">
                    ₹ 1,50,000 · Cheque
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    12-09-2026
                  </span>
                  <span className="v">
                    ₹ 2,00,000 · NEFT
                  </span>
                </div>
                <div className="kv">
                  <span className="k">
                    18-08-2026
                  </span>
                  <span className="v">
                    ₹ 1,75,500 · RTGS
                  </span>
                </div>
                <div style={{"padding":"14px 20px 0"}}>
                  <span className="tag t-green">
                    WhatsApp receipt goes out automatically on save
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
