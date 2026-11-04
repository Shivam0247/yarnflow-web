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
  constructor(p) { super(p); this.state = { t: 'All', fc: '', fq: '', fd: '', fl: '', fm2: '', lim: 50, fm: null }; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
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
  async load() { const api = this.api(); if (!api) return; try { const [it, br] = await Promise.all([api.get('/masters/items', { pageSize: 2000 }), api.get('/masters/brands')]); this.setState({ rows: it.data, brands: br.data }); } catch (e) { this.setState({ toast: api.message(e) }); } }
  spec() {
    const TY = [['FDY', 'FDY'], ['POY', 'POY'], ['DTY', 'DTY'], ['VISCOSE', 'Viscose'], ['NYLON', 'Nylon'], ['SPUN', 'Spun'], ['COTTON', 'Cotton'], ['OTHER', 'Other'], ['SERVICE', 'Service / general']];
    return [{ t: 'Item', f: [{ k: 'code', l: 'Item code', req: 1 }, { k: 'name', l: 'Yarn quality / name', req: 1 }, { k: 'description', l: 'Description' }, { k: 'type', l: 'Type', type: 'sel', opts: TY }, { k: 'brandId', l: 'Brand / mill', type: 'sel', opts: [['', '—']].concat((this.state.brands || []).map((b) => [b.id, b.name])) }, { k: 'isActive', l: 'Active', type: 'chk', ph: 'Show in entry screens' }] },
      { t: 'Specification', f: [{ k: 'denier', l: 'Denier / count', ph: '75' }, { k: 'filament', l: 'Filament', ph: '36' }, { k: 'lustre', l: 'Lustre', ph: 'SD / BR / FD' }, { k: 'stdBoxKg', l: 'Std box kg' }, { k: 'conesPerBox', l: 'Cones per box' }, { k: 'unit', l: 'Unit', type: 'sel', opts: [['KG', 'Kg'], ['PCS', 'Pcs'], ['MTR', 'Mtr'], ['BOX', 'Box'], ['NOS', 'Nos']] }] },
      { t: 'Tax, rate & stock', f: [{ k: 'hsn', l: 'HSN', req: 1, ph: '5402' }, { k: 'gstRate', l: 'GST %', type: 'sel', opts: [[0, '0%'], [0.25, '0.25%'], [3, '3%'], [5, '5%'], [12, '12%'], [18, '18%'], [28, '28%']] }, { k: 'rate', l: 'Default rate ₹/kg' }, { k: 'minStock', l: 'Minimum stock kg' }, { k: 'isGeneral', l: 'General item', type: 'chk', ph: 'Non-yarn (for general bills)' }] }];
  }
  body(v) { const b = {}; ['code', 'name', 'description', 'denier', 'filament', 'lustre', 'hsn', 'type', 'unit'].forEach((k) => { b[k] = this.nz(String(v[k] ?? '').trim()); }); b.brandId = v.brandId ? Number(v.brandId) : null; ['stdBoxKg', 'conesPerBox', 'rate', 'minStock', 'gstRate'].forEach((k) => { b[k] = this.num(v[k]); }); b.isGeneral = !!v.isGeneral; b.isActive = v.isActive !== false; return b; }
  async updRates() {
    const api = this.api(); if (!api) return; const pct = window.prompt('Change default rate of the listed items by how many % ? (e.g. 2 or -1.5)'); if (!pct || isNaN(Number(pct))) return;
    const list = this._vis || []; let ok = 0;
    for (const r of list) { if (!r.rate) continue; try { await api.put('/masters/items/' + r.id, this.body({ ...r, rate: Math.round(r.rate * (1 + Number(pct) / 100) * 100) / 100 })); ok += 1; } catch (e) {} }
    api.invalidate(); this.setState({ toast: ok + ' rates updated by ' + pct + '%' }); this.load();
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark';
    const C = { FDY: '#3B82F6', POY: '#14B8A6', DTY: '#22C55E', Viscose: '#F97316', Nylon: '#A855F7', Spun: '#EAB308', Cotton: '#EC4899', Other: '#8F8F8F', Service: '#8F8F8F' };
    const fmV = st.fm ? this.fmVals(this.spec(), st.fm) : { open: false };
    if (st.fm) { fmV.save = () => this.fmSave('items', this.body(st.fm.v), () => this.load()); fmV.del = () => this.fmDel('items', () => this.load()); }
    const base = { theme: this.props.theme ?? 'dark', fm: fmV, fc: st.fc, fq: st.fq, fd: st.fd, fl: st.fl, fm2: st.fm2, setFc: (e) => this.setState({ fc: e.target.value }), setFq: (e) => this.setState({ fq: e.target.value }), setFd: (e) => this.setState({ fd: e.target.value }), setFl: (e) => this.setState({ fl: e.target.value }), setFm2: (e) => this.setState({ fm2: e.target.value }),
      open: () => this.fmOpen('New yarn item', { type: 'FDY', unit: 'KG', hsn: '5402', gstRate: 5, stdBoxKg: 60, isActive: true }), updRates: () => this.updRates() };
    if (!st.rows) {
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

      const t = st.t; const rows = (t === 'All' ? all : all.filter((r) => r.type === t)).map((r) => ({ ...r, edit: () => {} }));
      return { ...base, rows, chips: types.map(([n, k]) => ({ n, k, cls: n === t ? 'chip on' : 'chip', pick: () => this.setState({ t: n }) })), count: rows.length + ' of ' + types.find((x) => x[0] === t)[1] + ' yarn items', lustres: ['SD', 'BR', 'FD'], mills: ['Reliance', 'Sanathan', 'Century'], exportCsv: () => {}, more: true, loadMore: () => {} };
    }
    const inr = (n, d) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(d || 0); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const TN = (t) => (t ? t.charAt(0) + t.slice(1).toLowerCase() : 'Other');
    const TL = (t) => (t === 'FDY' || t === 'POY' || t === 'DTY' ? t : TN(t));
    let vis = st.rows.filter((r) => (st.t === 'All' || TL(r.type) === st.t) && (!st.fc || r.code.toLowerCase().indexOf(st.fc.toLowerCase()) >= 0) && (!st.fq || (r.name + ' ' + (r.description || '')).toLowerCase().indexOf(st.fq.toLowerCase()) >= 0) && (!st.fd || String(r.denier || '').indexOf(st.fd) >= 0) && (!st.fl || r.lustre === st.fl) && (!st.fm2 || r.brandName === st.fm2));
    this._vis = vis;
    const rows = vis.slice(0, st.lim).map((r) => ({ code: r.code, name: r.name, mill: r.brandName || r.description || '—', type: TL(r.type), tc: '--c: ' + (C[TL(r.type)] || '#8F8F8F'), den: r.denier ? r.denier + (/\D/.test(r.denier) ? '' : ' D') : '—', fil: r.filament || '—', lus: r.lustre || '—', hsn: r.hsn + ' · ' + r.gstRate + '%', box: r.stdBoxKg ? inr(r.stdBoxKg) + ' kg' : '—', stock: inr(r.stockQty, 0), sc: r.minStock > 0 && r.stockQty < r.minStock ? 'low' : '', rate: r.rate ? inr(r.rate, 2) : '—', edit: () => this.fmOpen('Edit yarn item · ' + r.code, r, r.id) }));
    const cnt = { All: st.rows.length }; st.rows.forEach((r) => { const t = TL(r.type); cnt[t] = (cnt[t] || 0) + 1; });
    const csv = () => [['Code', 'Name', 'Type', 'Brand', 'Denier', 'Filament', 'Lustre', 'HSN', 'GST %', 'Std box kg', 'Stock kg', 'Rate', 'Min stock']].concat(vis.map((r) => [r.code, r.name, r.type, r.brandName, r.denier, r.filament, r.lustre, r.hsn, r.gstRate, r.stdBoxKg, r.stockQty, r.rate, r.minStock])).map((a) => a.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    return { ...base, rows, chips: Object.keys(cnt).map((n) => ({ n, k: inr(cnt[n]), cls: n === st.t ? 'chip on' : 'chip', pick: () => this.setState({ t: n }) })), count: rows.length + ' of ' + vis.length + ' yarn items' + (st.toast ? ' · ' + st.toast : ''),
      lustres: [...new Set(st.rows.map((r) => r.lustre).filter(Boolean))].sort(), mills: [...new Set(st.rows.map((r) => r.brandName).filter(Boolean))].sort(), more: vis.length > st.lim, loadMore: () => this.setState({ lim: st.lim + 50 }),
      exportCsv: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'Yarn items.csv'; a.click(); } catch (e) {} } };
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
            <button className="btn" type="button" onClick={v.updRates}>
              Update rates
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
            <input className="inp" type="text" placeholder="Item code" aria-label="Item code" value={v.fc} onChange={v.setFc} />
            {' '}
            <input className="inp" type="text" placeholder="Yarn quality" aria-label="Yarn quality" value={v.fq} onChange={v.setFq} />
            {' '}
            <input className="inp" type="text" placeholder="Denier / count" aria-label="Denier or count" value={v.fd} onChange={v.setFd} />
            {' '}
            <select className="inp" aria-label="Lustre" value={v.fl} onChange={v.setFl}>
              <option value="">
                Lustre
              </option>
              {(v.lustres || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option>
                    {o}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <select className="inp" aria-label="Mill" value={v.fm2} onChange={v.setFm2}>
              <option value="">
                Mill
              </option>
              {(v.mills || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option>
                    {o}
                  </option>
                </Fragment>
              ))}
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
                    <tr onDoubleClick={x?.edit}>
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
                        {x?.rate}{" "}
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
            {v.more ? (
              <>
                <button className="btn" type="button" onClick={v.loadMore}>
                  Load More
                </button>
              </>
            ) : null}
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
