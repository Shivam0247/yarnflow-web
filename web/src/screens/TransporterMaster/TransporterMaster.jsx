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
  constructor(p) { super(p); this.state = { fq: '', fr: '', fb: '', fm: null }; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  /* ---- generic master form (spec → sections of fields) ---- */
  fmOpen(title, vals, id) { this.setState({ fm: { title, v: { ...vals }, id: id || null, note: '', err: false, busy: false } }); }
  fmVals(spec, fm) {
    const secs = spec.map((sec) => ({ t: sec.t, f: sec.f.map((x) => { const v = fm.v[x.k]; const on = (e) => this.setState({ fm: { ...this.state.fm, v: { ...this.state.fm.v, [x.k]: x.type === 'chk' ? e.target.checked : e.target.value }, note: '', err: false } });
      return { l: x.l, req: x.req ? ' *' : '', isSel: x.type === 'sel', isIn: !x.type || x.type === 'text', isChk: x.type === 'chk', v: v === null || v === undefined ? '' : String(v), c: !!v, ph: x.ph || '', opts: (x.opts || []).map((o) => ({ v: String(o[0]), l: o[1] })), on }; }) }));
    return { open: true, title: fm.title, secs, note: fm.note, nc: fm.err ? 'tag t-red' : 'muted', busy: !!fm.busy, canDel: !!fm.id, saveL: fm.busy ? 'Saving…' : fm.id ? 'Save changes' : 'Create', close: () => this.setState({ fm: null }) };
  }
  async fmSave(slug, body, done) {
    const api = this.api(); const fm = this.state.fm; if (!api) { this.setState({ fm: null }); return; }
    this.setState({ fm: { ...fm, busy: true, note: 'Saving…', err: false } });
    try { const r = fm.id ? await api.put('/masters/' + slug + '/' + fm.id, body) : await api.post('/masters/' + slug, body); api.invalidate(); this.setState({ fm: null, toast: '✓ Saved ' + (r.name || r.code || '') }); if (done) await done(r); }
    catch (e) { this.setState({ fm: { ...this.state.fm, busy: false, note: api.message(e), err: true } }); }
  }
  async fmDel(slug, done) {
    const api = this.api(); const fm = this.state.fm; if (!api || !fm.id) return;
    if (!window.confirm('Delete this record? It cannot be undone.')) return;
    try { await api.del('/masters/' + slug + '/' + fm.id); api.invalidate(); this.setState({ fm: null, toast: '✓ Deleted' }); if (done) await done(); }
    catch (e) { this.setState({ fm: { ...this.state.fm, note: api.message(e), err: true } }); }
  }
  num(v) { const n = Number(String(v ?? '').replace(/[₹,\s]/g, '')); return isNaN(n) ? 0 : n; }
  nz(v) { return v === '' || v === undefined ? null : v; }
  componentDidMount() { this.load(); }
  async load() { const api = this.api(); if (!api) return; try { const [t, lk, ew] = await Promise.all([api.get('/masters/transporters'), api.lookups(), api.get('/eway-bills')]); this.setState({ rows: t.data, lk, ew: ew.data }); } catch (e) { this.setState({ toast: api.message(e) }); } }
  spec() {
    const lk = this.state.lk || { ledgers: [] };
    return [{ t: 'Transporter', f: [{ k: 'name', l: 'Transporter name', req: 1 }, { k: 'transporterId', l: 'Transporter ID (GSTIN / TRANSIN)', ph: '24AAJFN3381Q1Z6' }, { k: 'gstin', l: 'GSTIN' }, { k: 'status', l: 'Status', type: 'sel', opts: [['ACTIVE', 'Active'], ['ON_HOLD', 'Paused'], ['BLOCKED', 'Blocked'], ['INACTIVE', 'Inactive']] }] },
      { t: 'Contact', f: [{ k: 'contactPerson', l: 'Contact person' }, { k: 'mobile', l: 'Mobile' }, { k: 'address', l: 'Address' }, { k: 'city', l: 'City' }] },
      { t: 'Routes & freight', f: [{ k: 'routes', l: 'Main routes', ph: 'Surat → Bhiwandi, Surat → Ichalkaranji' }, { k: 'rateBasis', l: 'Rate basis', type: 'sel', opts: [['PER_KG', 'Per kg'], ['PER_BOX', 'Per box'], ['PER_TRIP', 'Per trip']] }, { k: 'rate', l: 'Rate ₹' },
        { k: 'accountId', l: 'Freight ledger', type: 'sel', opts: [['', '—']].concat(lk.ledgers.filter((x) => x.kind === 'TRANSPORTER' || x.kind === 'SUPPLIER' || x.kind === 'EXPENSE').map((x) => [x.id, x.name])) }] }];
  }
  body(v) { const b = {}; ['name', 'transporterId', 'gstin', 'contactPerson', 'address', 'city', 'routes', 'rateBasis', 'status'].forEach((k) => { b[k] = this.nz(String(v[k] ?? '').trim()); }); b.mobile = v.mobile ? String(v.mobile).replace(/\D/g, '').slice(-10) || null : null; b.rate = this.num(v.rate); b.accountId = v.accountId ? Number(v.accountId) : null; return b; }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const fmV = st.fm ? this.fmVals(this.spec(), st.fm) : { open: false };
    if (st.fm) { fmV.save = () => this.fmSave('transporters', this.body(st.fm.v), () => this.load()); fmV.del = () => this.fmDel('transporters', () => this.load()); }
    const base = { theme, fm: fmV, fq: st.fq, fr: st.fr, fb: st.fb, setFq: (e) => this.setState({ fq: e.target.value }), setFr: (e) => this.setState({ fr: e.target.value }), setFb: (e) => this.setState({ fb: e.target.value }),
      open: () => this.fmOpen('New transporter', { rateBasis: 'PER_KG', status: 'ACTIVE' }), lrReg: () => { try { window.localStorage.setItem('yf-report', 'ewb-register'); } catch (e) {} this.go('Reports' + sfx + '.dc.html'); } };
    if (!st.rows) {
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

      return { ...base, rows: rows.map((r) => ({ ...r, edit: () => {} })), cards: [{ l: 'Active transporters', v: '22' }, { l: 'LRs in transit', v: '31' }, { l: 'Freight due', v: '₹ 1.84 L' }, { l: 'On-time this month', v: '94%' }], count: '8 of 22 transporters', exportCsv: () => {} };
    }
    const inr = (n, d) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(d || 0); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const RB = { PER_KG: '/kg', PER_BOX: '/box', PER_TRIP: '/trip' };
    const bal = new Map((st.lk ? st.lk.ledgers : []).map((x) => [x.id, x.balance]));
    const ew = st.ew || []; const delivered = ew.filter((b) => b.ewbStatus === 'DELIVERED').length; const done = ew.filter((b) => b.ewbNo).length;
    const vis = st.rows.filter((r) => (!st.fq || r.name.toLowerCase().indexOf(st.fq.toLowerCase()) >= 0) && (!st.fr || String(r.routes || '').toLowerCase().indexOf(st.fr.toLowerCase()) >= 0) && (!st.fb || r.rateBasis === st.fb));
    const rows = vis.map((r) => { const rts = String(r.routes || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean); const due = r.accountId ? -(bal.get(r.accountId) || 0) : 0; const on = r.status === 'ACTIVE';
      return { i: r.name.charAt(0), n: r.name, id: r.transporterId || r.gstin || '—', r1: rts[0] || '—', more: rts.length > 1 ? '+' + (rts.length - 1) + (rts.length > 2 ? ' routes' : ' route') : '', rate: r.rate ? '₹ ' + inr(r.rate, 2) + (RB[r.rateBasis] || '') : '—', lr: String(r.inTransit || 0), ot: r.bills ? r.bills + ' bills' : '—', due: due > 0 ? '₹ ' + inr(due) : '—', ph: r.mobile || '—', s: on ? 'Active' : 'Paused', sc: '--c: ' + (on ? '#22C55E' : '#8F8F8F'), edit: () => this.fmOpen('Edit transporter · ' + r.name, r, r.id) }; });
    const freight = st.rows.reduce((a, r) => a + (r.accountId ? Math.max(0, -(bal.get(r.accountId) || 0)) : 0), 0);
    const csv = () => [['Name', 'Transporter ID', 'GSTIN', 'Routes', 'Rate basis', 'Rate', 'Mobile', 'City', 'Status']].concat(vis.map((r) => [r.name, r.transporterId, r.gstin, r.routes, r.rateBasis, r.rate, r.mobile, r.city, r.status])).map((a) => a.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    return { ...base, rows, cards: [{ l: 'Active transporters', v: String(st.rows.filter((r) => r.status === 'ACTIVE').length) }, { l: 'LRs in transit', v: String(st.rows.reduce((a, r) => a + (r.inTransit || 0), 0)) }, { l: 'Freight due', v: freight >= 1e5 ? '₹ ' + (freight / 1e5).toFixed(2) + ' L' : '₹ ' + inr(freight) }, { l: 'E-way bills filed', v: String(done) + (delivered ? ' · ' + delivered + ' delivered' : '') }],
      count: vis.length + ' of ' + st.rows.length + ' transporters' + (st.toast ? ' · ' + st.toast : ''), exportCsv: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'Transporters.csv'; a.click(); } catch (e) {} } };
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
            <button className="btn" type="button" onClick={v.lrReg}>
              LR register
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
          <div className="cards">
            {(v.cards || []).map((c, $index) => (
              <Fragment key={$index}>
                <div className="cardx">
                  <span className="muted">
                    {c?.l}
                  </span>
                  <b>
                    {c?.v}
                  </b>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" placeholder="Name" aria-label="Transporter name" value={v.fq} onChange={v.setFq} />
            {' '}
            <input className="inp" type="text" placeholder="Route" aria-label="Route" value={v.fr} onChange={v.setFr} />
            {' '}
            <select className="inp" aria-label="Rate basis" value={v.fb} onChange={v.setFb}>
              <option value="">
                Rate basis
              </option>
              <option value="PER_KG">
                Per kg
              </option>
              <option value="PER_BOX">
                Per box
              </option>
              <option value="PER_TRIP">
                Per trip
              </option>
            </select>
            <div style={{"flex":"1"}} />
            <button className="btn" type="button" onClick={v.exportCsv}>
              Excel
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
                    <tr onDoubleClick={x?.edit}>
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
                        {' '}
                        <button className="btn sm gh" type="button" onClick={x?.edit}>
                          Edit
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
              {v.count}
            </span>
            <div style={{"flex":"1"}} />
          </div>
        </div>
        {v.fm?.open ? (
          <>
            <div className="scrim fmx">
              <div className="modal" role="dialog" aria-label={v.fm?.title}>
                <div className="mh">
                  <h2>
                    {v.fm?.title}
                  </h2>
                  <button className="btn gh ic" type="button" aria-label="Close" onClick={v.fm?.close}>
                    ✕
                  </button>
                </div>
                <div className="fmb">
                  {(v.fm?.secs || []).map((sec, $index) => (
                    <Fragment key={$index}>
                      <div className="sub">
                        {sec?.t}
                      </div>
                      <div className="fgrid">
                        {(sec?.f || []).map((f, $index) => (
                          <Fragment key={$index}>
                            <div className="fld">
                              <label>
                                {f?.l}
                                <span style={{"color":"#EF4444"}}>
                                  {f?.req}
                                </span>
                              </label>
                              {' '}
                              {f?.isSel ? (
                                <>
                                  <select className="inp" aria-label={f?.l} value={f?.v} onChange={f?.on}>
                                    {(f?.opts || []).map((o, $index) => (
                                      <Fragment key={$index}>
                                        <option value={o?.v}>
                                          {o?.l}
                                        </option>
                                      </Fragment>
                                    ))}
                                  </select>
                                </>
                              ) : null}
                              {' '}
                              {f?.isIn ? (
                                <>
                                  <input className="inp" type="text" aria-label={f?.l} value={f?.v} placeholder={f?.ph} onChange={f?.on} />
                                </>
                              ) : null}
                              {' '}
                              {f?.isChk ? (
                                <>
                                  <span style={{"display":"flex","alignItems":"center","gap":"10px","minHeight":"34px"}}>
                                    <input className="sw" type="checkbox" aria-label={f?.l} checked={f?.c} onChange={f?.on} />
                                    <span className="t2">
                                      {f?.ph}
                                    </span>
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="mf">
                  <span className={v.fm?.nc} style={{"flex":"1","alignSelf":"center","fontSize":"13px"}}>
                    {v.fm?.note}
                  </span>
                  {v.fm?.canDel ? (
                    <>
                      <button className="btn" type="button" style={{"color":"#F87171"}} onClick={v.fm?.del}>
                        Delete
                      </button>
                    </>
                  ) : null}
                  <button className="btn" type="button" onClick={v.fm?.close}>
                    Cancel
                  </button>
                  <button className="btn pr" type="button" onClick={v.fm?.save} disabled={v.fm?.busy}>
                    {v.fm?.saveL}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
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
