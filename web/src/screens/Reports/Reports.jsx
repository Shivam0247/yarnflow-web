/* eslint-disable */
// Reports — converted 1:1 from the YarnFlow design (Reports.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Reports.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return { theme: this.props.theme ?? 'dark' }; }
}

/* ----- view ----- */
class ReportsView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="rep" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                {"Reports & GST"}
              </span>
            </div>
            <input className="inp" type="search" placeholder="Search 42 reports" aria-label="Search reports" style={{"width":"240px"}} />
            {' '}
            <select className="inp" aria-label="Period">
              <option>
                Oct 2026
              </option>
              <option>
                Sep 2026
              </option>
              <option>
                FY 2026-27
              </option>
            </select>
            {' '}
            <button className="btn pr" type="button">
              + Custom report
            </button>
          </header>
          <div className="wrap">
            <section className="box">
              <div style={{"display":"flex","alignItems":"center","gap":"10px","padding":"14px 16px","borderBottom":"1px solid var(--bd)","flexWrap":"wrap"}}>
                <b style={{"fontWeight":"600","fontSize":"15px","flex":"1"}}>
                  GST summary · October 2026
                </b>
                <span className="tag t-orange">
                  GSTR-1 due 11 Nov
                </span>
                <span className="tag t-gray">
                  GSTR-3B due 20 Nov
                </span>
                <button className="btn sm" type="button">
                  Reconcile 2B
                </button>
                <button className="btn sm pr" type="button">
                  Prepare GSTR-1
                </button>
              </div>
              <div className="gst">
                <div>
                  <span className="muted">
                    Outward taxable
                  </span>
                  <b>
                    ₹ 1.75 Cr
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    142 invoices
                  </span>
                </div>
                <div>
                  <span className="muted">
                    Output GST
                  </span>
                  <b>
                    ₹ 8,76,420
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    CGST+SGST ₹ 6.1 L · IGST ₹ 2.6 L
                  </span>
                </div>
                <div>
                  <span className="muted">
                    Input credit (2B)
                  </span>
                  <b>
                    ₹ 6,02,180
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    4 bills missing in 2B
                  </span>
                </div>
                <div>
                  <span className="muted">
                    Net GST payable
                  </span>
                  <b>
                    ₹ 2,74,240
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    after ITC set-off
                  </span>
                </div>
                <div>
                  <span className="muted">
                    E-way bills
                  </span>
                  <b>
                    118
                  </b>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    3 expire today
                  </span>
                </div>
              </div>
            </section>
            <div className="grid">
              <section className="box grp">
                <h2>
                  Sales
                </h2>
                <DcLink className="rep" href="SalesOrderList.dc.html">
                  <span>
                    Sales register
                    <small>
                      Invoice-wise with GST split
                    </small>
                  </span>
                  <span className="star" aria-label="Favourite">
                    ★
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Party-wise sales
                    <small>
                      Top buyers, quantity and margin
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Yarn-wise sales
                    <small>
                      Kg and value by quality and lot
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Broker commission
                    <small>
                      Brokerage due by broker
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Pending orders
                    <small>
                      Ordered vs dispatched
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  Purchase
                </h2>
                <DcLink className="rep" href="#">
                  <span>
                    Purchase register
                    <small>
                      Bill-wise with ITC
                    </small>
                  </span>
                  <span className="star" aria-label="Favourite">
                    ★
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Mill-wise purchase
                    <small>
                      Value, kg and average rate
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Rate history
                    <small>
                      Mill rate trend by yarn
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Pending POs
                    <small>
                      Ordered vs received
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    TDS 194Q
                    <small>
                      TDS on purchase above ₹ 50 L
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  Accounts
                </h2>
                <DcLink className="rep" href="Ledger.dc.html">
                  <span>
                    Ledger statement
                    <small>
                      Any account, any period
                    </small>
                  </span>
                  <span className="star" aria-label="Favourite">
                    ★
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Outstanding.dc.html">
                  <span>
                    {"Outstanding & ageing"}
                    <small>
                      Receivable and payable
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Day book
                    <small>
                      All vouchers by date
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Trial balance
                    <small>
                      Group-wise closing balances
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    {"Profit & loss · Balance sheet"}
                    <small>
                      Monthly and FY
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  Inventory
                </h2>
                <DcLink className="rep" href="Stock.dc.html">
                  <span>
                    Stock summary
                    <small>
                      Yarn × godown
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="Stock.dc.html">
                  <span>
                    Lot-wise stock
                    <small>
                      Lot, grade, boxes and age
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Slow-moving yarn
                    <small>
                      No sale in 60+ days
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Stock valuation
                    <small>
                      FIFO / weighted average
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  GST
                </h2>
                <DcLink className="rep" href="#">
                  <span>
                    GSTR-1
                    <small>
                      Outward supplies · JSON export
                    </small>
                  </span>
                  <span className="tag t-orange">
                    Due
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    GSTR-3B
                    <small>
                      Summary return
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    GSTR-2B reconciliation
                    <small>
                      Match purchase bills with portal
                    </small>
                  </span>
                  <span className="tag t-orange">
                    4
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    HSN summary
                    <small>
                      5402, 5403, 5205 …
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    E-way bill register
                    <small>
                      Generated, expiring, cancelled
                    </small>
                  </span>
                </DcLink>
              </section>
              <section className="box grp">
                <h2>
                  AI reports
                </h2>
                <DcLink className="rep" href="Main.dc.html#ai">
                  <span>
                    Ask in plain words
                    <small>
                      “Profit on viscose this quarter”
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Payment behaviour
                    <small>
                      Who pays late, by how much
                    </small>
                  </span>
                </DcLink>
                {' '}
                <DcLink className="rep" href="#">
                  <span>
                    Reorder suggestions
                    <small>
                      Yarn to buy from which mill
                    </small>
                  </span>
                  <span className="tag t-green">
                    New
                  </span>
                </DcLink>
              </section>
            </div>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="rep" />
        </div>
      </div>
      </>
    );
  }
}

export default function Reports(props) {
  const theme = useTheme();
  return <ReportsView {...props} theme={theme} />;
}
