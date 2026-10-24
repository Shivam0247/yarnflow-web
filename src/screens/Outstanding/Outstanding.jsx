/* eslint-disable */
// Outstanding — converted 1:1 from the YarnFlow design (Outstanding.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Outstanding.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { mode: 'r' }; }
  renderVals() {
    const r = this.state.mode === 'r';
    const mk = (i, n, c, t, a, b, d, e, lp) => ({ i, n, c, t, a, b, d, e, lp, dc: d !== '—' ? 'hot' : 'muted', ec: e !== '—' ? 'hot' : 'muted' });
    const recv = [
      mk('K', 'Krishna Textiles', 'Surat', '4,82,350', '1,40,700', '31,400', '3,10,250', '—', '06 Oct'),
      mk('S', 'Shiv Shakti Fabrics', 'Sachin GIDC', '7,84,200', '4,10,000', '2,44,375', '1,29,825', '—', '15 Oct'),
      mk('O', 'Om Sai Weaving', 'Pandesara', '6,12,560', '3,98,160', '2,14,400', '—', '—', '18 Oct'),
      mk('L', 'Laxmi Creation', 'Bhiwandi', '5,46,900', '—', '2,10,000', '1,86,900', '1,50,000', '22 Aug'),
      mk('N', 'Navrang Prints', 'Ichalkaranji', '4,02,800', '2,04,800', '1,98,000', '—', '—', '09 Oct'),
      mk('R', 'Radhe Textiles', 'Kadodara', '3,15,000', '3,15,000', '—', '—', '—', '20 Oct'),
      mk('A', 'Ambika Silk Mills', 'Surat', '2,08,400', '—', '—', '—', '2,08,400', '30 Jun'),
      mk('J', 'Jay Bhavani Fab', 'Kamrej', '3,26,400', '3,26,400', '—', '—', '—', '12 Oct')
    ];
    const pay = [
      mk('R', 'Reliance Industries', 'Silvassa', '9,75,623', '7,98,132', '1,77,491', '—', '—', '02 Oct'),
      mk('S', 'Sanathan Textiles', 'Silvassa', '8,40,000', '8,40,000', '—', '—', '—', '24 Sep'),
      mk('I', 'Indorama Synthetics', 'Butibori', '6,20,500', '3,20,500', '3,00,000', '—', '—', '29 Sep'),
      mk('C', 'Century Rayon', 'Kalyan', '4,46,250', '4,46,250', '—', '—', '—', '11 Oct'),
      mk('F', 'Filatex India', 'Dahej', '3,12,000', '—', '3,12,000', '—', '—', '04 Sep'),
      mk('J', 'JCT Fibres', 'Phagwara', '2,10,400', '2,10,400', '—', '—', '—', '16 Oct')
    ];
    const st = (c) => '--c: ' + c;
    const cards = r
      ? [{ l: 'Total receivable', v: '₹ 62.4 L', st: st('#3B82F6') }, { l: '0–30 days', v: '₹ 29.8 L', st: st('#8F8F8F') }, { l: '31–60 days', v: '₹ 17.8 L', st: st('#F97316') }, { l: '61–90 days', v: '₹ 9.7 L', st: st('#EF4444') }, { l: '90+ days', v: '₹ 5.1 L', st: st('#B91C1C') }]
      : [{ l: 'Total payable', v: '₹ 38.9 L', st: st('#3B82F6') }, { l: 'Due this week', v: '₹ 9.7 L', st: st('#F97316') }, { l: 'Not yet due', v: '₹ 26.1 L', st: st('#8F8F8F') }, { l: 'Overdue', v: '₹ 3.1 L', st: st('#EF4444') }, { l: 'Advances paid', v: '₹ 3.0 L', st: st('#A855F7') }];
    return {
      theme: this.props.theme ?? 'dark', rc: r ? 'on' : '', py: r ? '' : 'on',
      setR: () => this.setState({ mode: 'r' }), setP: () => this.setState({ mode: 'p' }),
      rows: r ? recv : pay, cards,
      verb: r ? 'receipt' : 'payment', action: r ? 'Remind' : 'Pay',
      bulk: r ? 'Send reminders' : 'Plan payments',
      footer: r ? '8 of 38 parties · ₹ 62.4 L receivable' : '6 of 14 mills · ₹ 38.9 L payable'
    };
  }
}

/* ----- view ----- */
class OutstandingView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="out" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                Outstanding
              </span>
            </div>
            <div className="seg" role="group" aria-label="Receivable or payable">
              <button type="button" className={v.rc} onClick={v.setR}>
                Receivable
              </button>
              <button type="button" className={v.py} onClick={v.setP}>
                Payable
              </button>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Export
            </button>
            {' '}
            <button className="btn pr" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              {v.bulk}
            </button>
          </header>
          <div className="cards">
            {(v.cards || []).map((c, $index) => (
              <Fragment key={$index}>
                <div className="cardx">
                  <span className="dot" style={sx(c?.st)}>
                    <span className="muted">
                      {c?.l}
                    </span>
                  </span>
                  <b>
                    {c?.v}
                  </b>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" placeholder="Party" aria-label="Party" />
            {' '}
            <select className="inp" aria-label="City">
              <option>
                City
              </option>
              <option>
                Surat
              </option>
              <option>
                Bhiwandi
              </option>
              <option>
                Ichalkaranji
              </option>
            </select>
            {' '}
            <select className="inp" aria-label="Broker">
              <option>
                Broker
              </option>
              <option>
                Mahesh Shah
              </option>
            </select>
            {' '}
            <select className="inp" aria-label="Age">
              <option>
                Any age
              </option>
              <option>
                Above 60 days
              </option>
              <option>
                Above 90 days
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
                    Party
                  </th>
                  <th>
                    City
                  </th>
                  <th className="r">
                    Total
                  </th>
                  <th className="r">
                    0–30
                  </th>
                  <th className="r">
                    31–60
                  </th>
                  <th className="r">
                    61–90
                  </th>
                  <th className="r">
                    90+
                  </th>
                  <th>
                    {"Last "}{v.verb}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr>
                      <td>
                        <input className="cb" type="checkbox" aria-label="Select party" />
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
                        {x?.c}
                      </td>
                      <td className="r" style={{"fontWeight":"500"}}>
                        {x?.t}
                      </td>
                      <td className="r t2">
                        {x?.a}
                      </td>
                      <td className="r t2">
                        {x?.b}
                      </td>
                      <td className="r">
                        <span className={x?.dc}>
                          {x?.d}
                        </span>
                      </td>
                      <td className="r">
                        <span className={x?.ec}>
                          {x?.e}
                        </span>
                      </td>
                      <td className="muted">
                        {x?.lp}
                      </td>
                      <td className="r">
                        <button className="btn sm" type="button">
                          {v.action}
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="foot">
            <span className="muted">
              {v.footer}
            </span>
            <div style={{"flex":"1"}} />
            <button className="btn" type="button">
              Load More
            </button>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="out" />
        </div>
      </div>
      </>
    );
  }
}

export default function Outstanding(props) {
  const theme = useTheme();
  return <OutstandingView {...props} theme={theme} />;
}
