/* eslint-disable */
// Masters — converted 1:1 from the YarnFlow design (Masters.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Masters.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { q: '' }; }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const L = (f) => (f ? f + sfx + '.dc.html' : '#');
    const S = [
      ['Accounts', 'Parties, brokers, groups', [['Party master', '1,248', 'AccountMaster', 'Ctrl M'], ['Delivery parties', '312', 'AccountMaster'], ['Account groups', '17', 'GroupMaster'], ['Party groups', '24', ''], ['Brokers', '38', 'AccountMaster', 'Ctrl A'], ['Collection persons', '9', ''], ['TDS / TCS', '6', ''], ['Blocked parties', '14', 'AccountMaster'], ['Party opening balances', '—', 'Ledger']]],
      ['Items & yarn', 'What you buy and sell', [['Yarn items', '186', 'YarnMaster', 'Ctrl I'], ['Item groups', '12', 'YarnMaster'], ['Item main groups', '5', 'YarnMaster'], ['HSN codes', '8', ''], ['Units', '6', ''], ['Designs / shades', '64', ''], ['Godowns', '6', 'Stock']]],
      ['Inventory', 'Lot and quality tracking', [['Lots', '412', 'Stock'], ['Merge numbers', '38', ''], ['Twist', '4', ''], ['Grades', '5', ''], ['Item opening stock', '—', 'Stock']]],
      ['Logistics & location', 'Transport and addresses', [['Transporters', '22', 'TransporterMaster'], ['Vehicles', '31', ''], ['Areas', '18', ''], ['Cities', '54', ''], ['States', '36', ''], ['Countries', '3', '']]],
      ['Company setup', 'Branches, books, series', [['Branches', '2', ''], ['Cost centers', '3', ''], ['Books & voucher series', '14', ''], ['Company godowns', '6', 'Stock'], ['Partner ratio', '3', ''], ['Narrations', '27', '']]]
    ];
    const q = this.state.q.trim().toLowerCase();
    let total = 0;
    const secs = S.map(([t, d, items]) => {
      total += items.length;
      const list = items.filter((i) => !q || i[0].toLowerCase().indexOf(q) >= 0).map((i) => ({ n: i[0], c: i[1], h: L(i[2]), k: i[3] || '' }));
      return { t, d, items: list };
    }).filter((s) => s.items.length > 0);
    return {
      theme, secs, total, q: this.state.q, empty: secs.length === 0,
      onQ: (e) => this.setState({ q: e.target.value }),
      newParty: L('AccountMaster'),
      lk: { acc: L('AccountMaster'), yarn: L('YarnMaster'), trn: L('TransporterMaster'), stock: L('Stock') }
    };
  }
}

/* ----- view ----- */
class MastersView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="mast" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                Masters
              </span>
              <span className="muted" style={{"fontSize":"14px"}}>
                {v.total}{" masters"}
              </span>
            </div>
            <input className="inp" type="search" placeholder="Find a master… e.g. broker, HSN, lot" aria-label="Find a master" onChange={v.onQ} style={{"width":"300px"}} />
            {' '}
            <button className="btn" type="button">
              Import from Excel / Tally
            </button>
            {' '}
            <DcLink className="btn pr" href={v.newParty}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New party
            </DcLink>
          </header>
          <div className="wrap">
            <div className="recent">
              <span className="muted" style={{"fontSize":"13px"}}>
                Most used
              </span>
              {' '}
              <DcLink className="chip" href={v.lk?.acc}>
                {"Party master "}
                <span className="muted">
                  Ctrl M
                </span>
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.yarn}>
                {"Yarn items "}
                <span className="muted">
                  Ctrl I
                </span>
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.acc}>
                {"Brokers "}
                <span className="muted">
                  Ctrl A
                </span>
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.trn}>
                Transporters
              </DcLink>
              {' '}
              <DcLink className="chip" href={v.lk?.stock}>
                Lots
              </DcLink>
            </div>
            <div className="grid">
              {(v.secs || []).map((s, $index) => (
                <Fragment key={$index}>
                  <section className="sec">
                    <div className="sh">
                      <span className="ico">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect width="7" height="7" x="3" y="3" rx="1" />
                          <rect width="7" height="7" x="14" y="3" rx="1" />
                          <rect width="7" height="7" x="14" y="14" rx="1" />
                          <rect width="7" height="7" x="3" y="14" rx="1" />
                        </svg>
                      </span>
                      <h2>
                        {s?.t}
                      </h2>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {s?.d}
                      </span>
                    </div>
                    {(s?.items || []).map((x, $index) => (
                      <Fragment key={$index}>
                        <DcLink className="row" href={x?.h}>
                          <span className="n">
                            {x?.n}
                          </span>
                          {x?.k ? (
                            <>
                              <span className="badge">
                                {x?.k}
                              </span>
                            </>
                          ) : null}
                          <span className="c">
                            {x?.c}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </DcLink>
                      </Fragment>
                    ))}
                  </section>
                </Fragment>
              ))}
            </div>
            {v.empty ? (
              <>
                <div className="muted" style={{"padding":"40px","textAlign":"center"}}>
                  No master matches “{v.q}”.
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="aiw">
          <Assistant page="mast" />
        </div>
      </div>
      </>
    );
  }
}

export default function Masters(props) {
  const theme = useTheme();
  return <MastersView {...props} theme={theme} />;
}
