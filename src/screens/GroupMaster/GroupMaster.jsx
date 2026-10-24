/* eslint-disable */
// GroupMaster — converted 1:1 from the YarnFlow design (GroupMaster.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './GroupMaster.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { sel: 3 }; }
  renderVals() {
    const G = [
      [0, 'Capital Account', '4', 'Liabilities', 'Primary', '₹ 1.20 Cr Cr', '0', true],
      [0, 'Current Assets', '', 'Assets', 'Primary', '₹ 1.48 Cr Dr', '4', false],
      [1, 'Bank Accounts', '9', 'Assets', 'Current Assets', '₹ 24.6 L Dr', '0', true],
      [1, 'Sundry Debtors', '812', 'Assets', 'Current Assets', '₹ 62.4 L Dr', '2', false],
      [2, 'Surat Debtors', '546', 'Assets', 'Sundry Debtors', '₹ 41.8 L Dr', '0', true],
      [2, 'Out-station Debtors', '266', 'Assets', 'Sundry Debtors', '₹ 20.6 L Dr', '0', true],
      [1, 'Stock-in-hand', '4', 'Assets', 'Current Assets', '₹ 89.3 L Dr', '0', true],
      [0, 'Current Liabilities', '', 'Liabilities', 'Primary', '₹ 46.2 L Cr', '2', false],
      [1, 'Sundry Creditors', '124', 'Liabilities', 'Current Liabilities', '₹ 39.4 L Cr', '3', false],
      [2, 'Yarn Mills', '64', 'Liabilities', 'Sundry Creditors', '₹ 38.9 L Cr', '0', true],
      [2, 'Brokers', '38', 'Liabilities', 'Sundry Creditors', '₹ 3.8 L Cr', '0', true],
      [2, 'Transporters', '22', 'Liabilities', 'Sundry Creditors', '₹ 0.9 L Cr', '0', true],
      [1, 'Duties & Taxes', '12', 'Liabilities', 'Current Liabilities', '₹ 2.7 L Cr', '0', true],
      [0, 'Sales Accounts', '4', 'Income', 'Primary', '₹ 9.84 Cr Cr', '0', true],
      [0, 'Purchase Accounts', '4', 'Expenses', 'Primary', '₹ 8.92 Cr Dr', '0', true],
      [0, 'Direct Expenses', '18', 'Expenses', 'Primary', '₹ 6.1 L Dr', '0', true],
      [0, 'Indirect Expenses', '41', 'Expenses', 'Primary', '₹ 14.8 L Dr', '0', true]
    ];
    const s = this.state.sel;
    const tree = G.map((g, i) => ({
      name: g[1], count: g[2], parent: !g[7], leaf: g[7],
      cls: i === s ? 'node on' : 'node',
      pad: 'padding-left: ' + (8 + g[0] * 22) + 'px',
      ws: g[0] === 0 ? 'font-weight: 500' : '',
      pick: () => this.setState({ sel: i })
    }));
    const g = G[s];
    return { theme: this.props.theme ?? 'dark', tree, sel: { name: g[1], count: g[2] || '—', nature: g[3], under: g[4], bal: g[5], subs: g[6] } };
  }
}

/* ----- view ----- */
class GroupMasterView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="grp" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Groups
              </span>
              <span className="m">
                /
              </span>
              <span>
                Chart of accounts
              </span>
            </div>
            <button className="btn" type="button">
              Expand all
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
          <div className="split">
            <div className="lp" role="tree" aria-label="Account groups">
              <div style={{"padding":"0 4px 10px"}}>
                <input className="inp" type="search" placeholder="Search groups" aria-label="Search groups" />
              </div>
              {(v.tree || []).map((g, $index) => (
                <Fragment key={$index}>
                  <button className={g?.cls} type="button" role="treeitem" style={sx(g?.pad)} onClick={g?.pick}>
                    {g?.parent ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={{"color":"var(--t3)"}}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </>
                    ) : null}
                    {' '}
                    {g?.leaf ? (
                      <>
                        <span style={{"width":"14px"}} />
                      </>
                    ) : null}
                    {' '}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"color":"var(--t2)"}}>
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                    {' '}
                    <span style={sx(g?.ws)}>
                      {g?.name}
                    </span>
                    <span className="n">
                      {g?.count}
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
            <div className="rp">
              <div className="pane" style={{"borderBottom":"1px solid var(--bd)"}}>
                <div className="ph2">
                  <h2>
                    {v.sel?.name}
                  </h2>
                  <span className="tag">
                    {v.sel?.nature}
                  </span>
                  <span className="muted" style={{"flex":"1"}}>
                    {"Under "}{v.sel?.under}
                  </span>
                  <button className="btn" type="button">
                    Delete
                  </button>
                  <button className="btn pr" type="button">
                    Save
                  </button>
                </div>
                <div className="stats">
                  <div className="stat">
                    <span className="muted">
                      Accounts
                    </span>
                    <b>
                      {v.sel?.count}
                    </b>
                  </div>
                  <div className="stat">
                    <span className="muted">
                      Closing balance
                    </span>
                    <b>
                      {v.sel?.bal}
                    </b>
                  </div>
                  <div className="stat">
                    <span className="muted">
                      Sub-groups
                    </span>
                    <b>
                      {v.sel?.subs}
                    </b>
                  </div>
                </div>
              </div>
              <div className="pane">
                <div className="fgrid">
                  <div className="fld">
                    <label htmlFor="g1">
                      Group name
                    </label>
                    <input id="g1" className="inp" type="text" value={v.sel?.name} />
                  </div>
                  <div className="fld">
                    <label htmlFor="g2">
                      Under
                    </label>
                    <select id="g2" className="inp">
                      <option>
                        {v.sel?.under}
                      </option>
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="g3">
                      Nature
                    </label>
                    <select id="g3" className="inp">
                      <option>
                        {v.sel?.nature}
                      </option>
                      <option>
                        Assets
                      </option>
                      <option>
                        Liabilities
                      </option>
                      <option>
                        Income
                      </option>
                      <option>
                        Expenses
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="opt">
                    <input className="sw" type="checkbox" defaultChecked />
                    <span style={{"flex":"1"}}>
                      Maintain bill-wise outstanding
                    </span>
                    <span className="muted" style={{"fontSize":"13px"}}>
                      {"Needed for ageing & reminders"}
                    </span>
                  </label>
                  {' '}
                  <label className="opt">
                    <input className="sw" type="checkbox" defaultChecked />
                    <span style={{"flex":"1"}}>
                      Allow credit limit and credit days
                    </span>
                  </label>
                  {' '}
                  <label className="opt">
                    <input className="sw" type="checkbox" />
                    <span style={{"flex":"1"}}>
                      Affects gross profit
                    </span>
                  </label>
                  {' '}
                  <label className="opt" style={{"borderBottom":"0"}}>
                    <input className="sw" type="checkbox" defaultChecked />
                    <span style={{"flex":"1"}}>
                      Show in outstanding reports
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="grp" />
        </div>
      </div>
      </>
    );
  }
}

export default function GroupMaster(props) {
  const theme = useTheme();
  return <GroupMasterView {...props} theme={theme} />;
}
