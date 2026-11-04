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
  constructor(p) { super(p); this.state = { sel: 3, q: '', ed: null, collapsed: {} }; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  componentDidMount() { this.load(); }
  async load(selId) { const api = this.api(); if (!api) return; try { const g = await api.get('/masters/groups'); const keep = selId || this.state.selId || (g.data.find((x) => /debtor/i.test(x.name)) || g.data[0] || {}).id; this.setState({ rows: g.data }); this.pick(g.data.find((x) => x.id === keep)); } catch (e) { this.setState({ note: api.message(e), err: true }); } }
  pick(g) { if (!g) return; this.setState({ selId: g.id, ed: { name: g.name, parentId: g.parentId ? String(g.parentId) : '', nature: g.nature, billWise: !!g.billWise, creditControl: !!g.creditControl, affectsGrossProfit: !!g.affectsGrossProfit, showInOutstanding: !!g.showInOutstanding }, note: '', err: false }); }
  async save() {
    const api = this.api(); const st = this.state; if (!api) return; const e = st.ed;
    const body = { name: e.name, parentId: e.parentId ? Number(e.parentId) : null, nature: e.nature, billWise: !!e.billWise, creditControl: !!e.creditControl, affectsGrossProfit: !!e.affectsGrossProfit, showInOutstanding: !!e.showInOutstanding };
    try { const r = st.selId === 'new' ? await api.post('/masters/groups', body) : await api.put('/masters/groups/' + st.selId, body); api.invalidate(); this.setState({ note: '✓ Saved', err: false }); this.load(r.id); } catch (er) { this.setState({ note: api.message(er), err: true }); }
  }
  async del() {
    const api = this.api(); const st = this.state; if (!api || st.selId === 'new') { this.load(); return; }
    if (!window.confirm('Delete group ' + st.ed.name + '?')) return;
    try { await api.del('/masters/groups/' + st.selId); api.invalidate(); this.setState({ selId: null }); this.load(); } catch (er) { this.setState({ note: api.message(er), err: true }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark';
    if (!st.rows) {
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

      const s = st.sel;
      const tree = G.map((g, i) => ({ name: g[1], count: g[2], parent: !g[7], leaf: g[7], cls: i === s ? 'node on' : 'node', pad: 'padding-left: ' + (8 + g[0] * 22) + 'px', ws: g[0] === 0 ? 'font-weight: 500' : '', pick: () => this.setState({ sel: i }) }));
      const g = G[s]; const NAT = { Assets: 'ASSET', Liabilities: 'LIABILITY', Income: 'INCOME', Expenses: 'EXPENSE' };
      return { theme, tree, sel: { name: g[1], count: g[2] || '—', nature: g[3], under: g[4], bal: g[5], subs: g[6] }, ed: { name: g[1], parentId: '', nature: NAT[g[3]], billWise: true, creditControl: true, affectsGrossProfit: false, showInOutstanding: true },
        parents: [{ v: '', l: g[4] }], set: {}, q: st.q, setQ: (e) => this.setState({ q: e.target.value }), note: '', nc: 'muted', saveL: 'Save', save: () => {}, del: () => {}, create: () => {}, expand: () => {} };
    }
    const rows = st.rows; const byParent = {}; rows.forEach((r) => { (byParent[r.parentId || 0] = byParent[r.parentId || 0] || []).push(r); });
    const q = st.q.trim().toLowerCase(); const flat = [];
    const walk = (pid, depth) => (byParent[pid] || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name)).forEach((r) => { const kids = byParent[r.id] || []; if (!q || r.name.toLowerCase().indexOf(q) >= 0) flat.push({ r, depth, kids: kids.length }); if (!st.collapsed[r.id] || q) walk(r.id, depth + 1); });
    walk(0, 0);
    const L = (v) => (Math.abs(v) >= 1e7 ? '₹ ' + (v / 1e7).toFixed(2) + ' Cr' : Math.abs(v) >= 1e5 ? '₹ ' + (v / 1e5).toFixed(1) + ' L' : '₹ ' + Math.round(v).toLocaleString('en-IN'));
    const NL = { ASSET: 'Assets', LIABILITY: 'Liabilities', INCOME: 'Income', EXPENSE: 'Expenses' };
    const tree = flat.map(({ r, depth, kids }) => ({ name: r.name, count: r.accountCount ? String(r.accountCount) : '', parent: kids > 0, leaf: kids === 0, cls: r.id === st.selId ? 'node on' : 'node', pad: 'padding-left: ' + (8 + depth * 22) + 'px', ws: depth === 0 ? 'font-weight: 500' : '',
      pick: () => { if (kids && r.id === st.selId) this.setState({ collapsed: { ...st.collapsed, [r.id]: !st.collapsed[r.id] } }); this.pick(r); } }));
    const g = rows.find((x) => x.id === st.selId); const ed = st.ed || {};
    const sel = g ? { name: g.name, count: String(g.accountCount || 0), nature: NL[g.nature], under: g.parentName || 'Primary', bal: L(g.balance) + ' ' + (g.balanceType === 'DR' ? 'Dr' : 'Cr'), subs: String(g.subGroupCount || 0) } : { name: ed.name || 'New group', count: '0', nature: NL[ed.nature] || '', under: '—', bal: '₹ 0', subs: '0' };
    const set = {}; ['name', 'parentId', 'nature'].forEach((k) => { set[k] = (e) => this.setState({ ed: { ...this.state.ed, [k]: e.target.value }, note: '' }); });
    ['billWise', 'creditControl', 'affectsGrossProfit', 'showInOutstanding'].forEach((k) => { set[k] = (e) => this.setState({ ed: { ...this.state.ed, [k]: e.target.checked }, note: '' }); });
    set.parentId = (e) => { const p = rows.find((x) => String(x.id) === e.target.value); this.setState({ ed: { ...this.state.ed, parentId: e.target.value, nature: p ? p.nature : this.state.ed.nature } }); };
    return { theme, tree, sel, ed, set, parents: [{ v: '', l: 'Primary' }].concat(rows.filter((x) => x.id !== st.selId).map((x) => ({ v: String(x.id), l: (x.parentName ? x.parentName + ' › ' : '') + x.name }))),
      q: st.q, setQ: (e) => this.setState({ q: e.target.value }), note: st.note || '', nc: st.err ? 'tag t-red' : 'muted', saveL: st.selId === 'new' ? 'Create' : 'Save', save: () => this.save(), del: () => this.del(),
      create: () => { const p = rows.find((x) => x.id === st.selId); this.setState({ selId: 'new', ed: { name: '', parentId: p ? String(p.id) : '', nature: p ? p.nature : 'ASSET', billWise: p ? !!p.billWise : false, creditControl: p ? !!p.creditControl : false, affectsGrossProfit: p ? !!p.affectsGrossProfit : false, showInOutstanding: p ? !!p.showInOutstanding : false }, note: 'New group under ' + (p ? p.name : 'Primary'), err: false }); },
      expand: () => { const any = Object.values(st.collapsed).some(Boolean); const c = {}; if (!any) rows.forEach((r) => { if ((byParent[r.id] || []).length) c[r.id] = true; }); this.setState({ collapsed: c }); } };
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
            <button className="btn" type="button" onClick={v.expand}>
              Expand all
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.create}>
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
                <input className="inp" type="search" placeholder="Search groups" aria-label="Search groups" value={v.q} onChange={v.setQ} />
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
                  <span className={v.nc} style={{"fontSize":"13px"}}>
                    {v.note}
                  </span>
                  <button className="btn" type="button" onClick={v.del}>
                    Delete
                  </button>
                  <button className="btn pr" type="button" onClick={v.save}>
                    {v.saveL}
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
                    <input id="g1" className="inp" type="text" value={v.ed?.name} onChange={v.set?.name} />
                  </div>
                  <div className="fld">
                    <label htmlFor="g2">
                      Under
                    </label>
                    <select id="g2" className="inp" value={v.ed?.parentId} onChange={v.set?.parentId}>
                      {(v.parents || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <option value={o?.v}>
                            {o?.l}
                          </option>
                        </Fragment>
                      ))}
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="g3">
                      Nature
                    </label>
                    <select id="g3" className="inp" value={v.ed?.nature} onChange={v.set?.nature}>
                      <option value="ASSET">
                        Assets
                      </option>
                      <option value="LIABILITY">
                        Liabilities
                      </option>
                      <option value="INCOME">
                        Income
                      </option>
                      <option value="EXPENSE">
                        Expenses
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="opt">
                    <input className="sw" type="checkbox" checked={v.ed?.billWise} onChange={v.set?.billWise} />
                    <span style={{"flex":"1"}}>
                      Maintain bill-wise outstanding
                    </span>
                    <span className="muted" style={{"fontSize":"13px"}}>
                      {"Needed for ageing & reminders"}
                    </span>
                  </label>
                  {' '}
                  <label className="opt">
                    <input className="sw" type="checkbox" checked={v.ed?.creditControl} onChange={v.set?.creditControl} />
                    <span style={{"flex":"1"}}>
                      Allow credit limit and credit days
                    </span>
                  </label>
                  {' '}
                  <label className="opt">
                    <input className="sw" type="checkbox" checked={v.ed?.affectsGrossProfit} onChange={v.set?.affectsGrossProfit} />
                    <span style={{"flex":"1"}}>
                      Affects gross profit
                    </span>
                  </label>
                  {' '}
                  <label className="opt" style={{"borderBottom":"0"}}>
                    <input className="sw" type="checkbox" checked={v.ed?.showInOutstanding} onChange={v.set?.showInOutstanding} />
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
