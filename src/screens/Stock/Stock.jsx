/* eslint-disable */
// Stock — converted 1:1 from the YarnFlow design (Stock.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Stock.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { gd: 'All' }; }
  renderVals() {
    const S = { ok: ['In stock', '#22C55E'], low: ['Low', '#EF4444'], res: ['Reserved', '#3B82F6'], old: ['Ageing', '#F97316'] };
    const mk = (y, l, g, b, kg, free, res, age, v, s) => ({ y, l, g, b, kg, res: res, bw: 'width: ' + free + '%; background: ' + (free < 30 ? '#EF4444' : '#22C55E'), age, v, s: S[s][0], sc: '--c: ' + S[s][1] });
    const all = [
      mk('PFY 75/36 SD Raw White', 'L-2231 · AA', 'Sachin GIDC', '177', '10,600', 77, '2,400 reserved', '6 d', '₹ 13.9 L', 'ok'),
      mk('PFY 75/36 SD Raw White', 'L-2198 · AA', 'Pandesara', '60', '3,600', 100, 'all free', '41 d', '₹ 4.7 L', 'ok'),
      mk('PFY 150/48 BR', 'L-2245 · AA', 'Sachin GIDC', '148', '8,900', 64, '3,200 reserved', '2 d', '₹ 10.5 L', 'ok'),
      mk('PFY 150/48 BR', 'L-2170 · A', 'Kadodara', '40', '2,400', 100, 'all free', '68 d', '₹ 2.8 L', 'old'),
      mk('Viscose Filament 120D BR', 'V-118 · A', 'Sachin GIDC', '80', '3,860', 16, '3,240 reserved', '12 d', '₹ 8.2 L', 'low'),
      mk('Nylon 6 FDY 40/34 SD', 'N-904 · A', 'Sachin GIDC', '268', '6,420', 94, '384 reserved', '19 d', '₹ 17.2 L', 'ok'),
      mk('PV Spun 30s (65/35)', 'S-311 · A', 'Pandesara', '150', '6,840', 78, '1,500 reserved', '27 d', '₹ 14.4 L', 'ok'),
      mk('Polyester POY 250/48', 'P-077 · AA', 'Kadodara', '75', '6,000', 33, '4,000 reserved', '9 d', '₹ 6.2 L', 'res'),
      mk('DTY 80/36 SIM', 'D-552 · A', 'Pandesara', '83', '4,150', 61, '1,600 reserved', '33 d', '₹ 5.3 L', 'ok'),
      mk('Cotton Combed 40s', 'C-019 · A', 'Bhiwandi', '47', '2,140', 100, 'all free', '96 d', '₹ 6.7 L', 'old')
    ];
    const gds = [['All', '54,910 kg'], ['Sachin GIDC', '29,780 kg'], ['Pandesara', '14,590 kg'], ['Kadodara', '8,400 kg'], ['Bhiwandi', '2,140 kg']];
    const gd = this.state.gd;
    const rows = gd === 'All' ? all : all.filter((r) => r.g === gd);
    return {
      theme: this.props.theme ?? 'dark', rows,
      godowns: gds.map(([n, kg]) => ({ n, kg, cls: n === gd ? 'chip on' : 'chip', pick: () => this.setState({ gd: n }) })),
      summary: rows.length + ' lots shown · stock valued at weighted average cost'
    };
  }
}

/* ----- view ----- */
class StockView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="stock" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Stock
              </span>
              <span className="m">
                /
              </span>
              <button className="btn gh" type="button" style={{"fontSize":"17px","fontWeight":"400","padding":"0 8px","height":"32px"}}>
                Lot-wise
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            <button className="btn" type="button">
              Physical count
            </button>
            {' '}
            <button className="btn pr" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="m17 2 4 4-4 4" />
                <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                <path d="m7 22-4-4 4-4" />
                <path d="M21 13v1a4 4 0 0 1-4 4H3" />
              </svg>
              Stock transfer
            </button>
          </header>
          <div className="chips" role="group" aria-label="Godown">
            {(v.godowns || []).map((g, $index) => (
              <Fragment key={$index}>
                <button className={g?.cls} type="button" onClick={g?.pick}>
                  {g?.n}{" "}
                  <span>
                    {g?.kg}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" placeholder="Yarn" aria-label="Yarn" />
            {' '}
            <input className="inp" type="text" placeholder="Lot" aria-label="Lot" />
            {' '}
            <select className="inp" aria-label="Type">
              <option>
                Type
              </option>
              <option>
                FDY
              </option>
              <option>
                POY
              </option>
              <option>
                DTY
              </option>
              <option>
                Viscose
              </option>
              <option>
                Nylon
              </option>
              <option>
                Spun
              </option>
            </select>
            {' '}
            <select className="inp" aria-label="Status">
              <option>
                Status
              </option>
              <option>
                Low
              </option>
              <option>
                Reserved
              </option>
              <option>
                Ageing
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
                    Yarn
                  </th>
                  <th>
                    Lot · Grade
                  </th>
                  <th>
                    Godown
                  </th>
                  <th className="r">
                    Boxes
                  </th>
                  <th className="r">
                    Net kg
                  </th>
                  <th>
                    Free vs reserved
                  </th>
                  <th className="r">
                    Age
                  </th>
                  <th className="r">
                    Value
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
                        <input className="cb" type="checkbox" aria-label="Select lot" />
                      </td>
                      <td>
                        <DcLink href="YarnMaster.dc.html">
                          {x?.y}
                        </DcLink>
                      </td>
                      <td className="t2">
                        {x?.l}
                      </td>
                      <td className="t2">
                        {x?.g}
                      </td>
                      <td className="r">
                        {x?.b}
                      </td>
                      <td className="r">
                        {x?.kg}
                      </td>
                      <td>
                        <span className="bar">
                          <i style={sx(x?.bw)} />
                        </span>
                        <span className="muted" style={{"fontSize":"13px"}}>
                          {x?.res}
                        </span>
                      </td>
                      <td className="r t2">
                        {x?.age}
                      </td>
                      <td className="r">
                        {x?.v}
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
              {v.summary}
            </span>
            <div style={{"flex":"1"}} />
            <button className="btn" type="button">
              Load More
            </button>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="stock" />
        </div>
      </div>
      </>
    );
  }
}

export default function Stock(props) {
  const theme = useTheme();
  return <StockView {...props} theme={theme} />;
}
