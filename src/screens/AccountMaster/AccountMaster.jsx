/* eslint-disable */
// AccountMaster — converted 1:1 from the YarnFlow design (AccountMaster.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './AccountMaster.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { type: 'All', modal: null }; }
  renderVals() {
    const ST = { a: ['Active', '#22C55E'], h: ['On hold', '#F97316'], b: ['Blocked', '#EF4444'] };
    const mk = (i, n, g, t, c, gst, m, cl, b, s) => ({ i, n, g, t, c, gst, m, cl, b, s: ST[s][0], sc: '--c: ' + ST[s][1] });
    const all = [
      mk('K', 'Krishna Textiles', 'Sundry Debtors', 'Customers', 'Surat', '24AABCK1234F1Z5', '98250 41122', '6,00,000', '4,82,350 Dr', 'h'),
      mk('S', 'Shiv Shakti Fabrics', 'Sundry Debtors', 'Customers', 'Sachin GIDC', '24AAGFS7712P1Z3', '98240 11930', '8,00,000', '7,84,200 Dr', 'a'),
      mk('O', 'Om Sai Weaving', 'Sundry Debtors', 'Customers', 'Pandesara', '24ABHPO5521K1Z8', '99090 55412', '7,50,000', '6,12,560 Dr', 'a'),
      mk('L', 'Laxmi Creation', 'Sundry Debtors', 'Customers', 'Bhiwandi', '27AALFL2290M1Z1', '98200 77345', '5,00,000', '5,46,900 Dr', 'b'),
      mk('R', 'Reliance Industries', 'Sundry Creditors', 'Mills', 'Silvassa', '26ABCDE1234F1Z9', '—', '—', '9,75,623 Cr', 'a'),
      mk('C', 'Century Rayon', 'Sundry Creditors', 'Mills', 'Kalyan', '27ABCDE5678G1Z4', '—', '—', '4,46,250 Cr', 'a'),
      mk('S', 'Sanathan Textiles', 'Sundry Creditors', 'Mills', 'Silvassa', '26ABCDE9012H1Z7', '—', '—', '8,40,000 Cr', 'a'),
      mk('M', 'Mahesh Shah (Broker)', 'Brokers', 'Brokers', 'Surat', '—', '98251 66870', '—', '38,420 Cr', 'a'),
      mk('N', 'Navkar Roadlines', 'Transporters', 'Transporters', 'Surat', '24AAJFN3381Q1Z6', '98984 22410', '—', '12,640 Cr', 'a'),
      mk('H', 'HDFC Bank · Current', 'Bank Accounts', 'Banks', 'Surat', '—', '—', '—', '18,42,300 Dr', 'a'),
      mk('F', 'Freight Inward', 'Direct Expenses', 'Expenses', '—', '—', '—', '—', '1,86,400 Dr', 'a')
    ];
    const types = [['All', '1,248'], ['Customers', '812'], ['Mills', '64'], ['Brokers', '38'], ['Transporters', '22'], ['Banks', '9'], ['Expenses', '303']];
    const t = this.state.type;
    const rows = t === 'All' ? all : all.filter((r) => r.t === t);
    const modal = this.state.modal ?? (this.props.showModal ?? false);
    return {
      theme: this.props.theme ?? 'dark', rows, modal,
      chips: types.map(([n, k]) => ({ n, k, cls: n === t ? 'chip on' : 'chip', pick: () => this.setState({ type: n }) })),
      count: rows.length + ' of ' + (types.find((x) => x[0] === t)[1]) + ' accounts',
      open: () => this.setState({ modal: true }), close: () => this.setState({ modal: false })
    };
  }
}

/* ----- view ----- */
class AccountMasterView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="acc" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Accounts
              </span>
              <span className="m">
                /
              </span>
              <button className="btn gh" type="button" style={{"fontSize":"17px","fontWeight":"400","padding":"0 8px","height":"32px"}}>
                List
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            <button className="btn" type="button">
              Import from Excel / Tally
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.open}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create
            </button>
          </header>
          <div className="chips" role="group" aria-label="Account type">
            {(v.chips || []).map((c, $index) => (
              <Fragment key={$index}>
                <button className={c?.cls} type="button" onClick={c?.pick}>
                  {c?.n}{" "}
                  <span>
                    {c?.k}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" placeholder="Account name" aria-label="Account name" />
            {' '}
            <input className="inp" type="text" placeholder="GSTIN" aria-label="GSTIN" />
            {' '}
            <input className="inp" type="text" placeholder="City" aria-label="City" />
            {' '}
            <select className="inp" aria-label="Group">
              <option>
                Group
              </option>
              <option>
                Sundry Debtors
              </option>
              <option>
                Sundry Creditors
              </option>
            </select>
            <div style={{"flex":"1"}} />
            <button className="btn" type="button">
              Filter
            </button>
            <button className="btn" type="button">
              Sort
            </button>
            <button className="btn" type="button">
              Columns
            </button>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th style={{"width":"36px"}}>
                    <input className="cb" type="checkbox" aria-label="Select all" />
                  </th>
                  <th>
                    Account
                  </th>
                  <th>
                    Group
                  </th>
                  <th>
                    City
                  </th>
                  <th>
                    GSTIN
                  </th>
                  <th>
                    Mobile
                  </th>
                  <th className="r">
                    Credit limit
                  </th>
                  <th className="r">
                    Balance
                  </th>
                  <th>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr>
                      <td>
                        <input className="cb" type="checkbox" aria-label="Select account" />
                      </td>
                      <td>
                        <DcLink className="cell" href="Ledger.dc.html">
                          <span className="lg">
                            {x?.i}
                          </span>
                          {x?.n}
                        </DcLink>
                      </td>
                      <td className="t2">
                        {x?.g}
                      </td>
                      <td className="t2">
                        {x?.c}
                      </td>
                      <td className="t2" style={{"fontVariantNumeric":"tabular-nums"}}>
                        {x?.gst}
                      </td>
                      <td className="t2">
                        {x?.m}
                      </td>
                      <td className="r">
                        {x?.cl}
                      </td>
                      <td className="r">
                        {x?.b}
                      </td>
                      <td>
                        <span className="dot" style={sx(x?.sc)}>
                          {x?.s}
                        </span>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="foot">
            <span className="muted">
              {v.count}
            </span>
            <div style={{"flex":"1"}} />
            <button className="btn" type="button">
              Load More
            </button>
          </div>
        </div>
        {v.modal ? (
          <>
            <div className="scrim">
              <div className="modal" role="dialog" aria-label="New account">
                <div className="mh">
                  <h2>
                    New account
                  </h2>
                  <button className="btn gh ic" type="button" aria-label="Close" onClick={v.close}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="a1">
                      {"Account name "}
                      <span style={{"color":"#EF4444"}}>
                        *
                      </span>
                    </label>
                    <input id="a1" className="inp" type="text" defaultValue="Shree Ganesh Textiles" />
                  </div>
                  <div className="fld">
                    <label htmlFor="a2">
                      {"Under group "}
                      <span style={{"color":"#EF4444"}}>
                        *
                      </span>
                    </label>
                    <select id="a2" className="inp">
                      <option>
                        Sundry Debtors › Surat
                      </option>
                      <option>
                        Sundry Creditors › Yarn mills
                      </option>
                      <option>
                        Brokers
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="a3">
                      GSTIN
                    </label>
                    <input id="a3" className="inp" type="text" defaultValue="24AAKFS4821R1Z2" />
                  </div>
                  <div className="fld">
                    <label htmlFor="a4">
                      Mobile (WhatsApp)
                    </label>
                    <input id="a4" className="inp" type="text" defaultValue="+91 98795 33120" />
                  </div>
                  <div className="fld">
                    <label htmlFor="a5">
                      City
                    </label>
                    <input id="a5" className="inp" type="text" defaultValue="Surat" />
                  </div>
                  <div className="fld">
                    <label htmlFor="a6">
                      State
                    </label>
                    <select id="a6" className="inp">
                      <option>
                        Gujarat (24)
                      </option>
                      <option>
                        Maharashtra (27)
                      </option>
                    </select>
                  </div>
                </div>
                <div className="sub">
                  {"Credit & terms"}
                </div>
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="a7">
                      Credit limit
                    </label>
                    <input id="a7" className="inp" type="text" defaultValue="₹ 5,00,000" />
                  </div>
                  <div className="fld">
                    <label htmlFor="a8">
                      Credit days
                    </label>
                    <input id="a8" className="inp" type="text" defaultValue="45" />
                  </div>
                  <div className="fld">
                    <label htmlFor="a9">
                      Broker
                    </label>
                    <select id="a9" className="inp">
                      <option>
                        Mahesh Shah · 1%
                      </option>
                      <option>
                        None
                      </option>
                    </select>
                  </div>
                </div>
                <label style={{"display":"flex","alignItems":"center","gap":"10px","padding":"6px 20px"}}>
                  <input className="sw" type="checkbox" defaultChecked />
                  Block dispatch when overdue more than 30 days
                </label>
                {' '}
                <label style={{"display":"flex","alignItems":"center","gap":"10px","padding":"6px 20px"}}>
                  <input className="sw" type="checkbox" defaultChecked />
                  Send invoices and reminders on WhatsApp
                </label>
                <div className="mf">
                  <button className="btn" type="button" onClick={v.close}>
                    Cancel
                  </button>
                  <button className="btn pr" type="button" onClick={v.close}>
                    Create account
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
        <div className="aiw">
          <Assistant page="acc" />
        </div>
      </div>
      </>
    );
  }
}

export default function AccountMaster(props) {
  const theme = useTheme();
  return <AccountMasterView {...props} theme={theme} />;
}
