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
  constructor(p) { super(p); this.state = { gd: 'All', fy: '', fl: '', ft: '', fs: '', sk: '', view: 'lot', sel: [], lim: 60, tr: null }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  today() { const t = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(t.getDate()) + '-' + z(t.getMonth() + 1) + '-' + t.getFullYear(); }
  componentDidMount() { this.load(); }
  async load() { const api = this.api(); if (!api) return; try { const [s, lk] = await Promise.all([api.get('/reports/stock'), api.lookups()]); this.setState({ data: s, lk }); } catch (e) {} }
  async transfer(rows) {
    const api = this.api(); const tr = this.state.tr; if (!api) return;
    const iso = (d) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(d || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const n = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
    const moves = rows.filter((r) => n(tr.q[r.key] ?? r.qty) > 0 && String(r.godownId) !== String(tr.to));
    if (!moves.length) { this.setState({ tr: { ...tr, note: 'Nothing to move — pick a different godown or enter kg', err: true } }); return; }
    if (moves.some((r) => n(tr.q[r.key] ?? r.qty) > r.qty + 0.0005)) { this.setState({ tr: { ...tr, note: 'Cannot move more than available', err: true } }); return; }
    this.setState({ tr: { ...tr, busy: true, note: 'Saving…', err: false } });
    try {
      const byFrom = {}; moves.forEach((r) => { (byFrom[r.godownId] = byFrom[r.godownId] || []).push(r); });
      const nos = [];
      for (const g of Object.keys(byFrom)) { const d = await api.post('/vouchers/stock-transfers', { date: iso(tr.date), godownId: Number(g), toGodownId: Number(tr.to), lines: byFrom[g].map((r) => { const q = n(tr.q[r.key] ?? r.qty); return { itemId: r.itemId, lotNo: r.lotNo, grade: r.grade, brand: r.brand, qty: q, pcs: r.qty ? Math.round(r.pcs * q / r.qty) : 0 }; }) }); nos.push(d.number); }
      api.invalidate(); this.setState({ tr: null, sel: [], toast: '✓ ' + nos.join(', ') + ' saved' }); await this.load();
    } catch (e) { this.setState({ tr: { ...this.state.tr, busy: false, note: api.message(e), err: true } }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark';
    const S = { ok: ['In stock', '#22C55E'], low: ['Low', '#EF4444'], res: ['Reserved', '#3B82F6'], old: ['Ageing', '#F97316'] };
    const base = { theme, fy: st.fy, fl: st.fl, ft: st.ft, fs: st.fs, sk: st.sk, setFy: (e) => this.setState({ fy: e.target.value }), setFl: (e) => this.setState({ fl: e.target.value }), setFt: (e) => this.setState({ ft: e.target.value }), setFs: (e) => this.setState({ fs: e.target.value }), setSk: (e) => this.setState({ sk: e.target.value }),
      viewL: st.view === 'lot' ? 'Lot-wise' : 'Yarn-wise', togView: () => this.setState({ view: st.view === 'lot' ? 'yarn' : 'lot', sel: [] }) };
    const d = st.data;
    if (!d) {
      const mk = (y, l, g, b, kg, free, res, age, v, s) => ({ y, l, g, b, kg, res: res, bw: 'width: ' + free + '%; background: ' + (free < 30 ? '#EF4444' : '#22C55E'), age, v, s: S[s][0], sc: '--c: ' + S[s][1], on: false, tog: () => {} });
      const all = [mk('PFY 75/36 SD Raw White', 'L-2231 · AA', 'Sachin GIDC', '177', '10,600', 77, '2,400 reserved', '6 d', '₹ 13.9 L', 'ok'), mk('PFY 75/36 SD Raw White', 'L-2198 · AA', 'Pandesara', '60', '3,600', 100, 'all free', '41 d', '₹ 4.7 L', 'ok'), mk('PFY 150/48 BR', 'L-2245 · AA', 'Sachin GIDC', '148', '8,900', 64, '3,200 reserved', '2 d', '₹ 10.5 L', 'ok'), mk('PFY 150/48 BR', 'L-2170 · A', 'Kadodara', '40', '2,400', 100, 'all free', '68 d', '₹ 2.8 L', 'old'), mk('Viscose Filament 120D BR', 'V-118 · A', 'Sachin GIDC', '80', '3,860', 16, '3,240 reserved', '12 d', '₹ 8.2 L', 'low'), mk('Nylon 6 FDY 40/34 SD', 'N-904 · A', 'Sachin GIDC', '268', '6,420', 94, '384 reserved', '19 d', '₹ 17.2 L', 'ok'), mk('PV Spun 30s (65/35)', 'S-311 · A', 'Pandesara', '150', '6,840', 78, '1,500 reserved', '27 d', '₹ 14.4 L', 'ok'), mk('Polyester POY 250/48', 'P-077 · AA', 'Kadodara', '75', '6,000', 33, '4,000 reserved', '9 d', '₹ 6.2 L', 'res'), mk('DTY 80/36 SIM', 'D-552 · A', 'Pandesara', '83', '4,150', 61, '1,600 reserved', '33 d', '₹ 5.3 L', 'ok'), mk('Cotton Combed 40s', 'C-019 · A', 'Bhiwandi', '47', '2,140', 100, 'all free', '96 d', '₹ 6.7 L', 'old')];
      const gds = [['All', '54,910 kg'], ['Sachin GIDC', '29,780 kg'], ['Pandesara', '14,590 kg'], ['Kadodara', '8,400 kg'], ['Bhiwandi', '2,140 kg']];
      const rows = st.gd === 'All' ? all : all.filter((r) => r.g === st.gd);
      return { ...base, rows, godowns: gds.map(([n, kg]) => ({ n, kg, cls: n === st.gd ? 'chip on' : 'chip', pick: () => this.setState({ gd: n }) })), summary: rows.length + ' lots shown · stock valued at weighted average cost',
        types: ['FDY', 'POY', 'DTY', 'Viscose', 'Nylon', 'Spun'], allOn: false, togAll: () => {}, exportCsv: () => {}, count: () => {}, openTr: () => {}, more: true, loadMore: () => {}, tr: { open: false } };
    }
    const inr = (n, dg) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(dg || 0); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const L = (v) => (Math.abs(v) >= 1e5 ? '₹ ' + (v / 1e5).toFixed(1) + ' L' : '₹ ' + inr(v));
    let rowsAll = d.rows.map((r) => ({ ...r, key: [r.itemId, r.lotNo, r.grade, r.godownId].join('|') }));
    if (st.view === 'yarn') { const m = new Map(); rowsAll.forEach((r) => { const k = r.itemId + '|' + (st.gd === 'All' ? '' : r.godownId); const g = m.get(k) || { ...r, key: 'Y' + k, lotNo: null, grade: null, qty: 0, pcs: 0, value: 0, reserved: 0, lots: 0, ageDays: 0, godownName: st.gd === 'All' ? 'All godowns' : r.godownName }; g.qty += r.qty; g.pcs += r.pcs; g.value += r.value; g.reserved += r.reserved; g.lots += 1; g.ageDays = Math.max(g.ageDays, r.ageDays); m.set(k, g); }); rowsAll = [...m.values()]; }
    const statusOf = (r) => { const free = r.qty ? (r.qty - r.reserved) / r.qty * 100 : 100; return r.minStock > 0 && r.qty < r.minStock ? 'low' : free < 30 ? 'low' : r.reserved > 0 && free < 60 ? 'res' : r.ageDays > 60 ? 'old' : 'ok'; };
    const q1 = st.fy.trim().toLowerCase(), q2 = st.fl.trim().toLowerCase();
    let vis = rowsAll.filter((r) => (st.gd === 'All' || r.godownName === st.gd || st.view === 'yarn' && r.godownName === st.gd) && (!q1 || (r.itemName + ' ' + (r.brand || '')).toLowerCase().indexOf(q1) >= 0) && (!q2 || String(r.lotNo || '').toLowerCase().indexOf(q2) >= 0) && (!st.ft || r.type === st.ft) && (!st.fs || S[statusOf(r)][0] === st.fs));
    if (st.view === 'lot' && st.gd !== 'All') vis = vis.filter((r) => r.godownName === st.gd);
    const SK = { kg: (a, b) => b.qty - a.qty, age: (a, b) => b.ageDays - a.ageDays, value: (a, b) => b.value - a.value };
    if (SK[st.sk]) vis = vis.slice().sort(SK[st.sk]);
    const sel = st.sel;
    const rows = vis.slice(0, st.lim).map((r) => { const free = r.qty ? Math.max(0, Math.round((r.qty - r.reserved) / r.qty * 100)) : 100; const s = statusOf(r); const on = sel.indexOf(r.key) >= 0;
      return { y: r.itemName + (r.brand ? ' · ' + r.brand : ''), l: st.view === 'yarn' ? r.lots + (r.lots === 1 ? ' lot' : ' lots') : (r.lotNo || '—') + ' · ' + (r.grade || '—'), g: r.godownName || '—', b: inr(r.pcs), kg: inr(r.qty, 3), res: r.reserved > 0.0005 ? inr(r.reserved, 0) + ' reserved' : 'all free',
        bw: 'width: ' + free + '%; background: ' + (free < 30 ? '#EF4444' : '#22C55E'), age: r.ageDays + ' d', v: L(r.value), s: S[s][0], sc: '--c: ' + S[s][1], on, tog: () => this.setState({ sel: on ? sel.filter((x) => x !== r.key) : sel.concat([r.key]) }) }; });
    const gm = new Map(); d.rows.forEach((r) => gm.set(r.godownName || '—', (gm.get(r.godownName || '—') || 0) + r.qty));
    const gds = [['All', d.totals.qty]].concat([...gm.entries()].sort((a, b) => b[1] - a[1]));
    const types = [...new Set(d.rows.map((r) => r.type).filter(Boolean))].sort();
    const tv = vis.reduce((a, r) => a + r.value, 0), tq = vis.reduce((a, r) => a + r.qty, 0);
    const csv = (head, lines) => [head].concat(lines).map((a) => a.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const dl = (name, text) => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); } catch (e) {} };
    const lk = st.lk || { godowns: [] };
    const selRows = rowsAll.filter((r) => sel.indexOf(r.key) >= 0 && r.lotNo !== null);
    const tr = st.tr;
    return { ...base, rows, types, godowns: gds.map(([n, kg]) => ({ n, kg: inr(kg, 0) + ' kg', cls: n === st.gd ? 'chip on' : 'chip', pick: () => this.setState({ gd: n, sel: [] }) })),
      summary: vis.length + (st.view === 'lot' ? ' lots' : ' yarns') + ' · ' + inr(tq, 0) + ' kg · ' + L(tv) + ' at weighted average cost' + (st.toast ? ' · ' + st.toast : ''),
      allOn: rows.length > 0 && rows.every((r) => r.on), togAll: () => this.setState({ sel: rows.length && rows.every((r) => r.on) ? [] : vis.slice(0, st.lim).map((r) => r.key) }),
      more: vis.length > st.lim, loadMore: () => this.setState({ lim: st.lim + 60 }),
      exportCsv: () => dl('Stock.csv', csv(['Yarn', 'Brand', 'Lot', 'Grade', 'Godown', 'Boxes', 'Kg', 'Reserved', 'Avg cost', 'Value', 'Age days'], vis.map((r) => [r.itemName, r.brand, r.lotNo, r.grade, r.godownName, r.pcs, r.qty, r.reserved, r.rate, r.value, r.ageDays]))),
      count: () => dl('Physical count sheet ' + this.today() + '.csv', csv(['Yarn', 'Lot', 'Grade', 'Godown', 'Book boxes', 'Book kg', 'Counted boxes', 'Counted kg', 'Difference kg'], d.rows.filter((r) => st.gd === 'All' || r.godownName === st.gd).map((r) => [r.itemName, r.lotNo, r.grade, r.godownName, r.pcs, r.qty, '', '', '']))),
      openTr: () => { if (st.view === 'yarn') { this.setState({ view: 'lot', toast: 'Pick lots to move, then press Stock transfer' }); return; } const other = lk.godowns.find((g) => !selRows.length || String(g.id) !== String(selRows[0].godownId)) || lk.godowns[0]; this.setState({ tr: { to: other ? String(other.id) : '', date: this.today(), q: {}, note: '', err: false } }); },
      tr: tr ? { open: true, to: tr.to, date: tr.date, gds: lk.godowns.map((g) => ({ v: String(g.id), l: g.name })), setTo: (e) => this.setState({ tr: { ...tr, to: e.target.value } }), setDate: (e) => this.setState({ tr: { ...tr, date: e.target.value } }),
        rows: selRows.map((r) => ({ y: r.itemName, l: (r.lotNo || '—') + ' · ' + (r.grade || '—'), g: r.godownName, kg: inr(r.qty, 3), q: tr.q[r.key] ?? String(r.qty), set: (e) => this.setState({ tr: { ...this.state.tr, q: { ...this.state.tr.q, [r.key]: e.target.value } } }) })),
        none: selRows.length === 0, note: tr.note || (selRows.length + ' lot' + (selRows.length === 1 ? '' : 's') + ' selected'), nc: tr.err ? 'tag t-red' : 'muted', busy: !!tr.busy, close: () => this.setState({ tr: null }), save: () => this.transfer(selRows) } : { open: false } };
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
              <button className="btn gh" type="button" onClick={v.togView} style={{"fontSize":"17px","fontWeight":"400","padding":"0 8px","height":"32px"}}>
                {v.viewL}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            <button className="btn" type="button" onClick={v.count}>
              Physical count
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.openTr}>
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
            <input className="inp" type="text" placeholder="Yarn" aria-label="Yarn" value={v.fy} onChange={v.setFy} />
            {' '}
            <input className="inp" type="text" placeholder="Lot" aria-label="Lot" value={v.fl} onChange={v.setFl} />
            {' '}
            <select className="inp" aria-label="Type" value={v.ft} onChange={v.setFt}>
              <option value="">
                Type
              </option>
              {(v.types || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option>
                    {o}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <select className="inp" aria-label="Status" value={v.fs} onChange={v.setFs}>
              <option value="">
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
            <select className="inp" aria-label="Sort" value={v.sk} onChange={v.setSk}>
              <option value="">
                Sort: yarn
              </option>
              <option value="kg">
                Sort: kg
              </option>
              <option value="age">
                Sort: age
              </option>
              <option value="value">
                Sort: value
              </option>
            </select>
            <button className="btn" type="button" onClick={v.exportCsv}>
              Excel
            </button>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th style={{"width":"36px"}}>
                    <input className="cb" type="checkbox" aria-label="Select all" checked={v.allOn} onChange={v.togAll} />
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
                        <input className="cb" type="checkbox" aria-label="Select lot" checked={x?.on} onChange={x?.tog} />
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
            {v.more ? (
              <>
                <button className="btn" type="button" onClick={v.loadMore}>
                  Load More
                </button>
              </>
            ) : null}
          </div>
          {v.tr?.open ? (
            <>
              <div className="ovl">
                <div className="mdl" role="dialog" aria-modal="true" aria-label="Godown transfer">
                  <div className="mdh">
                    <b style={{"flex":"1","fontWeight":"600"}}>
                      Godown transfer
                    </b>
                    <button className="btn sm gh" type="button" onClick={v.tr?.close} aria-label="Close">
                      ✕
                    </button>
                  </div>
                  <div className="mdb">
                    <div style={{"display":"flex","gap":"10px","alignItems":"center","flexWrap":"wrap"}}>
                      <span className="muted">
                        Move to
                      </span>
                      <select className="inp" aria-label="To godown" value={v.tr?.to} onChange={v.tr?.setTo} style={{"width":"220px"}}>
                        {(v.tr?.gds || []).map((o, $index) => (
                          <Fragment key={$index}>
                            <option value={o?.v}>
                              {o?.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                      <span className="muted">
                        on
                      </span>
                      <input className="inp" type="text" value={v.tr?.date} onChange={v.tr?.setDate} aria-label="Transfer date" style={{"width":"130px"}} />
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>
                            Yarn
                          </th>
                          <th>
                            Lot · Grade
                          </th>
                          <th>
                            From
                          </th>
                          <th className="r">
                            Available kg
                          </th>
                          <th className="r">
                            Move kg
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(v.tr?.rows || []).map((r, $index) => (
                          <Fragment key={$index}>
                            <tr>
                              <td>
                                {r?.y}
                              </td>
                              <td className="t2">
                                {r?.l}
                              </td>
                              <td className="t2">
                                {r?.g}
                              </td>
                              <td className="r">
                                {r?.kg}
                              </td>
                              <td className="r">
                                <input className="inp" type="text" value={r?.q} onChange={r?.set} aria-label="Kg to move" style={{"width":"110px","textAlign":"right"}} />
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                    {v.tr?.none ? (
                      <>
                        <div className="muted">
                          Tick the lots to move in the stock list first.
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="mdf">
                    <span className={v.tr?.nc} style={{"flex":"1"}}>
                      {v.tr?.note}
                    </span>
                    <button className="btn gh" type="button" onClick={v.tr?.close}>
                      Cancel
                    </button>
                    <button className="btn pr" type="button" onClick={v.tr?.save} disabled={v.tr?.busy}>
                      Transfer
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
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
