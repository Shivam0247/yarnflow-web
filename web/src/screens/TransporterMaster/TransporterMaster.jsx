/* eslint-disable */
// TransporterMaster — converted 1:1 from the YarnFlow design (TransporterMaster.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './TransporterMaster.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() {
    const mk = (i, n, id, r1, more, rate, lr, ot, due, ph, on) => ({ i, n, id, r1, more, rate, lr, ot, due, ph, s: on ? 'Active' : 'Paused', sc: '--c: ' + (on ? '#22C55E' : '#8F8F8F') });
    const rows = [
      mk('N', 'Navkar Roadlines', '24AAJFN3381Q1Z6', 'Surat → Bhiwandi', '+2 routes', '₹ 3.20/kg', '9', '97%', '₹ 48,200', '98984 22410', true),
      mk('J', 'Jay Ambe Roadlines', '24AAKFJ6619L1Z0', 'Silvassa → Surat', '+1 route', '₹ 2.10/kg', '6', '95%', '₹ 31,600', '98252 70014', true),
      mk('S', 'Sai Kripa Transport', '24ABUFS2207C1Z4', 'Surat → Ichalkaranji', '+3 routes', '₹ 3.60/kg', '5', '92%', '₹ 27,950', '99250 18840', true),
      mk('M', 'Mahalaxmi Cargo Movers', '24AAFFM9054R1Z8', 'Surat → Ludhiana', '+1 route', '₹ 6.80/kg', '4', '89%', '₹ 41,300', '97140 33215', true),
      mk('G', 'Ganesh Freight Carriers', '24AAGFG1146N1Z2', 'Surat → Malegaon', '', '₹ 45/box', '3', '96%', '₹ 12,640', '98795 60021', true),
      mk('S', 'Shiv Logistics', '24ACNFS7730H1Z9', 'Surat → Tiruppur', '+1 route', '₹ 7.40/kg', '2', '91%', '₹ 18,900', '90990 44178', true),
      mk('A', 'Ambaji Road Carriers', '24AAMFA5521P1Z3', 'Surat → Erode', '', '₹ 7.10/kg', '2', '88%', '₹ 3,410', '98255 12907', true),
      mk('R', 'Rajdhani Transport Co.', '24AAPFR0048K1Z1', 'Surat → Kolkata', '', '₹ 8.90/kg', '0', '—', '₹ 0', '98240 99112', false)
    ];
    return { theme: this.props.theme ?? 'dark', rows };
  }
}

/* ----- view ----- */
class TransporterMasterView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="trn" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Transporters
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
              LR register
            </button>
            {' '}
            <button className="btn pr" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create
            </button>
          </header>
          <div className="cards">
            <div className="cardx">
              <span className="muted">
                Active transporters
              </span>
              <b>
                22
              </b>
            </div>
            <div className="cardx">
              <span className="muted">
                LRs in transit
              </span>
              <b>
                31
              </b>
            </div>
            <div className="cardx">
              <span className="muted">
                Freight due
              </span>
              <b>
                ₹ 1.84 L
              </b>
            </div>
            <div className="cardx">
              <span className="muted">
                On-time this month
              </span>
              <b>
                94%
              </b>
            </div>
          </div>
          <div className="fbar">
            <input className="inp" type="text" placeholder="Name" aria-label="Transporter name" />
            {' '}
            <input className="inp" type="text" placeholder="Route" aria-label="Route" />
            {' '}
            <select className="inp" aria-label="Rate basis">
              <option>
                Rate basis
              </option>
              <option>
                Per kg
              </option>
              <option>
                Per box
              </option>
              <option>
                Per trip
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
                    Transporter
                  </th>
                  <th>
                    Transporter ID
                  </th>
                  <th>
                    Main routes
                  </th>
                  <th className="r">
                    Rate
                  </th>
                  <th className="r">
                    In transit
                  </th>
                  <th className="r">
                    On-time
                  </th>
                  <th className="r">
                    Freight due
                  </th>
                  <th>
                    Contact
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
                        <input className="cb" type="checkbox" aria-label="Select transporter" />
                      </td>
                      <td>
                        <span className="cell">
                          <span className="lg">
                            {x?.i}
                          </span>
                          {x?.n}
                        </span>
                      </td>
                      <td className="t2" style={{"fontVariantNumeric":"tabular-nums"}}>
                        {x?.id}
                      </td>
                      <td>
                        <span className="tag">
                          {x?.r1}
                        </span>
                        {' '}
                        <span className="muted" style={{"fontSize":"13px"}}>
                          {x?.more}
                        </span>
                      </td>
                      <td className="r">
                        {x?.rate}
                      </td>
                      <td className="r">
                        {x?.lr}
                      </td>
                      <td className="r">
                        {x?.ot}
                      </td>
                      <td className="r">
                        {x?.due}
                      </td>
                      <td className="t2">
                        {x?.ph}
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
              8 of 22 transporters
            </span>
            <div style={{"flex":"1"}} />
            <button className="btn" type="button">
              Load More
            </button>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="trn" />
        </div>
      </div>
      </>
    );
  }
}

export default function TransporterMaster(props) {
  const theme = useTheme();
  return <TransporterMasterView {...props} theme={theme} />;
}
