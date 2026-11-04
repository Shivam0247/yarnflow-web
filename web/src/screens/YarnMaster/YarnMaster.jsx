/* eslint-disable */
// YarnMaster — converted 1:1 from the YarnFlow design (YarnMaster.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './YarnMaster.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { t: 'All' }; }
  renderVals() {
    const C = { FDY: '#3B82F6', POY: '#14B8A6', DTY: '#22C55E', Viscose: '#F97316', Nylon: '#A855F7', Spun: '#EAB308' };
    const mk = (code, name, mill, type, den, fil, lus, hsn, box, stock, rate, low) => ({ code, name, mill, type, den, fil, lus, hsn, box, stock, rate, tc: '--c: ' + C[type], sc: low ? 'low' : '' });
    const all = [
      mk('PFY-7536-SD', 'Polyester FDY 75/36 SD Raw White', 'Reliance · Silvassa', 'FDY', '75 D', '36', 'SD', '5402 · 5%', '60 kg', '14,200', '136.00'),
      mk('PFY-15048-BR', 'Polyester FDY 150/48 BR', 'Reliance · Silvassa', 'FDY', '150 D', '48', 'BR', '5402 · 5%', '60 kg', '11,300', '118.50'),
      mk('PFY-7572-SD', 'Polyester FDY 75/72 SD Micro', 'Sanathan Textiles', 'FDY', '75 D', '72', 'SD', '5402 · 5%', '60 kg', '3,420', '142.00'),
      mk('POY-25048', 'Polyester POY 250/48', 'Indorama Synthetics', 'POY', '250 D', '48', 'SD', '5402 · 5%', '80 kg', '6,000', '104.00'),
      mk('DTY-8036-SIM', 'Polyester DTY 80/36 SIM', 'Filatex India', 'DTY', '80 D', '36', 'SD', '5402 · 5%', '50 kg', '4,150', '128.00'),
      mk('VFY-120-BR', 'Viscose Filament 120D/30F BR', 'Century Rayon', 'Viscose', '120 D', '30', 'BR', '5403 · 5%', '48 kg', '3,860', '212.50', true),
      mk('NYL-4034-SD', 'Nylon 6 FDY 40/34 SD', 'JCT Fibres', 'Nylon', '40 D', '34', 'SD', '5402 · 5%', '24 kg', '6,420', '268.00'),
      mk('PVS-30S', 'PV Spun 30s (65/35)', 'Vardhman', 'Spun', '30s Ne', '—', '—', '5509 · 5%', '45.36 kg', '6,840', '210.00'),
      mk('COT-40S-CMB', 'Cotton Combed 40s', 'Arvind', 'Spun', '40s Ne', '—', '—', '5205 · 5%', '45.36 kg', '2,140', '312.00')
    ];
    const types = [['All', '186'], ['FDY', '64'], ['POY', '18'], ['DTY', '22'], ['Viscose', '26'], ['Nylon', '21'], ['Spun', '35']];
    const t = this.state.t;
    const rows = t === 'All' ? all : all.filter((r) => r.type === t);
    return {
      theme: this.props.theme ?? 'dark', rows,
      chips: types.map(([n, k]) => ({ n, k, cls: n === t ? 'chip on' : 'chip', pick: () => this.setState({ t: n }) })),
      count: rows.length + ' of ' + types.find((x) => x[0] === t)[1] + ' yarn items'
    };
  }
}

/* ----- view ----- */
class YarnMasterView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="yarn" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Yarn Items
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
              Update rates
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
          <div className="chips" role="group" aria-label="Yarn type">
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
            <input className="inp" type="text" placeholder="Item code" aria-label="Item code" />
            {' '}
            <input className="inp" type="text" placeholder="Yarn quality" aria-label="Yarn quality" />
            {' '}
            <input className="inp" type="text" placeholder="Denier / count" aria-label="Denier or count" />
            {' '}
            <select className="inp" aria-label="Lustre">
              <option>
                Lustre
              </option>
              <option>
                SD
              </option>
              <option>
                BR
              </option>
              <option>
                FD
              </option>
            </select>
            {' '}
            <select className="inp" aria-label="Mill">
              <option>
                Mill
              </option>
              <option>
                Reliance
              </option>
              <option>
                Sanathan
              </option>
              <option>
                Century
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
                    Code
                  </th>
                  <th>
                    Yarn quality
                  </th>
                  <th>
                    Type
                  </th>
                  <th>
                    Denier / count
                  </th>
                  <th className="r">
                    Filament
                  </th>
                  <th>
                    Lustre
                  </th>
                  <th>
                    HSN · GST
                  </th>
                  <th className="r">
                    Std box
                  </th>
                  <th className="r">
                    Stock kg
                  </th>
                  <th className="r">
                    Rate ₹/kg
                  </th>
                </tr>
              </thead>
              <tbody>
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr>
                      <td>
                        <input className="cb" type="checkbox" aria-label="Select item" />
                      </td>
                      <td className="t2" style={{"fontVariantNumeric":"tabular-nums"}}>
                        {x?.code}
                      </td>
                      <td>
                        <DcLink href="Stock.dc.html">
                          <div>
                            {x?.name}
                          </div>
                          <div className="muted" style={{"fontSize":"12px"}}>
                            {x?.mill}
                          </div>
                        </DcLink>
                      </td>
                      <td>
                        <span className="dot" style={sx(x?.tc)}>
                          {x?.type}
                        </span>
                      </td>
                      <td>
                        {x?.den}
                      </td>
                      <td className="r t2">
                        {x?.fil}
                      </td>
                      <td className="t2">
                        {x?.lus}
                      </td>
                      <td className="t2">
                        {x?.hsn}
                      </td>
                      <td className="r t2">
                        {x?.box}
                      </td>
                      <td className="r">
                        <span className={x?.sc}>
                          {x?.stock}
                        </span>
                      </td>
                      <td className="r">
                        {x?.rate}
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
        <div className="aiw">
          <Assistant page="yarn" />
        </div>
      </div>
      </>
    );
  }
}

export default function YarnMaster(props) {
  const theme = useTheme();
  return <YarnMasterView {...props} theme={theme} />;
}
