/* eslint-disable */
// PurchaseOrderEntry — converted 1:1 from the YarnFlow design (PurchaseOrderEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './PurchaseOrderEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { z: 1, moreF: false, more: false, hist: true, base: 'direct' }; }
  componentDidMount() {
    try { const b = JSON.parse(window.localStorage.getItem('yf-back') || 'null'); if (b && b.href) this.setState({ back: b }); } catch (e) {}
 if (this.props.mode !== 'view') return; const rd = () => { try { const raw = window.localStorage.getItem('yf-view-po'); if (raw && raw !== this._raw) { this._raw = raw; this.setState({ rec: JSON.parse(raw), upd: false, bill: undefined }); } } catch (e) {} }; this._rd = rd; rd(); this._iv = setInterval(rd, 700); try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {} }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const PTY = [{"name": "Garden Silk Mills Pvt Ltd", "grp": "Garden Silk Mills", "addr": "Jolwa Village, Palsana, Surat 394305", "city": "Palsana", "gst": "24AABCG5521N1Z8", "ph": "+91 261 239 0011", "cp": "Hitesh (sales)", "fig": "₹ 6,20,500", "sub": "45 days credit", "tag": "6-day delivery", "tc": "tag t-blue"}, {"name": "Reliance Industries Ltd", "grp": "Reliance Industries", "addr": "Polyester Division, Silvassa 396230", "city": "Silvassa", "gst": "26AAACR4471L1Z8", "ph": "+91 260 264 2000", "cp": "Yarn desk", "fig": "₹ 38,40,000", "sub": "60 days credit", "tag": "Key mill", "tc": "tag t-green"}, {"name": "Sanathan Textiles Pvt Ltd", "grp": "Sanathan Textiles", "addr": "Survey 187, Dadra, Silvassa 396193", "city": "Silvassa", "gst": "26AAHCS2210K1Z2", "ph": "+91 260 266 8800", "cp": "Ketan Rao", "fig": "₹ 4,12,000", "sub": "30 days credit", "tag": "2% short wt", "tc": "tag t-orange"}, {"name": "Garden Vareli Textiles", "grp": "Garden Silk Mills", "addr": "Vareli, Kadodara, Surat 394327", "city": "Surat", "gst": "24AACCG7781D1Z4", "ph": "+91 261 239 0450", "cp": "Paresh Naik", "fig": "₹ 0", "sub": "45 days credit", "tag": "New mill", "tc": "tag t-blue"}];
    const DEL = [{"name": "Our godown · Sachin GIDC", "grp": "Own godown", "addr": "Plot 210, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AAKCS7781M1Z2", "ph": "+91 98250 10010", "cp": "Godown in-charge", "fig": "Own", "sub": "54,910 kg in stock", "tag": "Godown", "tc": "tag"}, {"name": "Our godown · Pandesara", "grp": "Own godown", "addr": "Plot 51, Pandesara GIDC, Surat 394221", "city": "Surat", "gst": "24AAKCS7781M1Z2", "ph": "+91 98250 10011", "cp": "Godown in-charge", "fig": "Own", "sub": "21,400 kg in stock", "tag": "Godown", "tc": "tag"}, {"name": "Shree Rudraksha Poly (direct)", "grp": "Buyer · direct delivery", "addr": "Block 3, Kadodara Char Rasta, Surat 394327", "city": "Surat", "gst": "24AAHFS3302P1Z1", "ph": "+91 97234 55102", "cp": "Kamal Shah", "fig": "Buyer", "sub": "Against SAL05773", "tag": "Direct to buyer", "tc": "tag t-blue"}];
    const COL = ['#3B82F6, #6366F1', '#F59E0B, #EA580C', '#10B981, #059669', '#EC4899, #DB2777', '#8B5CF6, #6D28D9', '#14B8A6, #0D9488'];
    const deco = (p, i) => ({ ...p, ini: p.name.replace(/^(Shree|Shri|The)\s+/i, '').charAt(0), av: 'background: linear-gradient(135deg, ' + COL[i % COL.length] + ')' });
    const REC = this.props.mode === 'view' ? (this.state.rec || this.props.openRec || { no: 'PUR0796', dt: '23-06-2026', p: 'J.J. Industries', g: 'Henil', it: 'Muskan Gold', br: 'J.J. Industries', lot: 'MG123', gr: '1ST', rate: 550, oq: 2000, dq: 1771.99, stL: 'Pending receipt' }) : null;
    if (REC && !PTY.some((p) => p.name === REC.p)) PTY.push(Object.assign({}, PTY[0], { name: REC.p, grp: REC.g || REC.p }));
    const fN = (n, d) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const isRec = !!REC; let rec = {}, tt = { pcs: '0', qty: '0.000', half: '0.00', amt: '0.00' }, am = { q: '0.000 kg · 0 pcs', gross: '₹ 0.00', gst: '₹ 0.00', net: '₹ 0.00' };
    if (REC) { const oq = Number(REC.oq) || 0, rt = Number(REC.rate) || 0, dq = Number(REC.dq) || 0; const pcs = Math.max(1, Math.round(oq / 60)); const g = oq * rt; const gst = g * 0.05;
      rec = { it: REC.it, br: REC.br, lot: REC.lot, gr: REC.gr, pcs: String(pcs), qty: fN(oq, 3), rate: fN(rt, 2), amt: fN(g, 2), half: fN(g * 0.025, 2), avg: fN(rt * 1.05, 2), ppcs: String(Math.max(0, Math.round((oq - dq) / 60))), pq: fN(Math.max(oq - dq, 0), 3), st: REC.stL || 'Pending', done: ('Received ') + fN(dq, 3) + ' kg' };
      tt = { pcs: String(pcs), qty: fN(oq, 3), half: fN(g * 0.025, 2), amt: fN(g, 2) };
      am = { q: fN(oq, 3) + ' kg · ' + pcs + ' pcs', gross: '₹ ' + fN(g, 2), disc: '− ₹ 0.00', tax: '₹ ' + fN(g, 2), half: '₹ ' + fN(g * 0.025, 2), gst: '₹ ' + fN(gst, 2), net: '₹ ' + fN(Math.round(g + gst), 2) }; }
    const TAGC = { 'Pending dispatch': 'tag t-blue', 'Pending receipt': 'tag t-blue', 'On hold · approval': 'tag t-orange', 'On hold': 'tag t-orange', Closed: 'tag t-green', Clear: 'tag t-green', Cancelled: 'tag t-red', Locked: 'tag t-gray' };
    const NV = { p13: isRec ? '45' : '', p14: isRec ? '07-12-2026' : '', p16: isRec ? '30-10-2026' : '', p15: isRec ? '7' : '' };
    const recV = { nv: NV, sideKey: isRec ? 'po' : 'poe', regLabel: isRec ? 'Purchase order register' : 'Purchase Orders',
      updLabel: this.state.upd ? '✓ Updated' : 'Update order', updNote: this.state.upd ? 'Changes saved to ' + (REC ? REC.no : '') : 'Editing ' + (REC ? REC.no : ''), doUpdate: () => this.setState({ upd: true }), isRec, isNew: !isRec, rec, tt, am, nextN: isRec ? '2' : '1', recTitle: isRec ? REC.no : 'New order', recTag: isRec ? (REC.stL || 'Pending') : 'New', recTagC: isRec ? (TAGC[REC.stL] || 'tag') : 'tag',
      recNo: isRec ? (/\//.test(REC.no) ? REC.no : REC.no + '/26-27') : 'PUR2210/26-27', recDt: isRec ? REC.dt : '23-10-2026' };
    const bi = this.state.bill ?? (REC ? Math.max(0, PTY.findIndex((p) => p.name === REC.p)) : null); const hasP = bi != null; const bp = hasP ? deco(PTY[bi], bi) : { name: 'Select mill / party…', grp: '', ini: '+', av: 'background: var(--s3); color: var(--t3)', fig: '₹ 0', sub: '', tag: '', tc: '', addr: '', city: '', gst: '', ph: '', cp: '' };
    const same = this.state.same ?? true;
    const di = this.state.del ?? 0; const dp = deco(DEL[di], di + 2);
    const pdOpen = this.state.pd ?? (this.props.startSearch ? 'bill' : null);
    const q = (this.state.pq ?? this.props.startSearch ?? '').trim(); const ql = q.toLowerCase();
    const SRC = pdOpen === 'del' ? DEL : PTY; const cur = pdOpen === 'del' ? di : bi;
    const hits = SRC.map((p, i) => [p, i]).filter(([p]) => !ql || [p.name, p.gst, p.ph, p.cp, p.city, p.grp, p.addr].join(' ').toLowerCase().indexOf(ql) >= 0);
    const pdRows = hits.map(([p, i]) => { const d = deco(p, pdOpen === 'del' ? i + 2 : i); const k = ql ? p.name.toLowerCase().indexOf(ql) : -1;
      return { ...d, pre: k >= 0 ? p.name.slice(0, k) : p.name, hi: k >= 0 ? p.name.slice(k, k + q.length) : '', post: k >= 0 ? p.name.slice(k + q.length) : '',
        cls: i === cur ? 'pdi on' : 'pdi', fig: p.fig, sub: p.sub, tag: p.tag, tc: p.tc,
        pick: () => this.setState(pdOpen === 'del' ? { del: i, pd: null, pq: '' } : { bill: i, pd: null, pq: '' }) }; });
    const so = this.state.base === 'so';
    const BK = this.state.back;
    return { backHref: BK ? BK.href : 'PurchaseOrderList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Purchase order register', ...recV, hasP,
      dueCls: bp.tag.indexOf('Overdue') === 0 ? 'kp due' : 'kp ok', dueLbl: bp.tag.indexOf('Overdue') === 0 ? 'Due payment' : 'Due payment', dueVal: bp.tag.indexOf('Overdue') === 0 ? (bi === 0 ? '₹ 1,04,200 · ' : '') + bp.tag.replace('Overdue ', '') + ' late' : 'None',
      bp, dp, same, diff: !same, pdBill: pdOpen === 'bill', pdDel: pdOpen === 'del', dName: same ? DEL[0].name : dp.name, dAd: same ? DEL[0].addr : dp.addr, dMeta: same ? 'Default godown · ' + DEL[0].sub : 'GSTIN ' + dp.gst + ' · Ph ' + dp.ph, pdOpen: !!pdOpen, pdRows, pdNone: pdRows.length === 0, pdQ: q, pdCount: pdRows.length + (pdRows.length === 1 ? ' party' : ' parties'),
      pdCls: pdOpen === 'del' ? 'pdrop r' : 'pdrop', pdTitle: pdOpen === 'del' ? 'Choose delivery party' : 'Choose billing party',
      openBill: () => this.setState({ pd: 'bill', pq: '' }), openDel: () => this.setState({ pd: 'del', pq: '' }), closeP: () => this.setState({ pd: null, pq: '' }),
      setQ: (e) => this.setState({ pq: e.target.value, pd: pdOpen }), toggleSame: () => this.setState({ same: !same, pd: !same ? null : 'del', pq: '' }),
      newPartyHref: 'AccountMaster' + sfx + '.dc.html',
      fitStyle: 'height: 100vh',
      moreF: this.state.moreF, moreFLabel: this.state.moreF ? 'Fewer fields' : '+ 8 more fields', toggleF: () => this.setState({ moreF: !this.state.moreF }),
      theme, more: this.state.more, hist: this.state.hist && hasP, againstSO: so,
      bd: so ? '' : 'on', bs: so ? 'on' : '',
      setDirect: () => this.setState({ base: 'direct' }), setSO: () => this.setState({ base: 'so' }),
      colsLabel: this.state.more ? 'Fewer columns' : 'More columns',
      toggleCols: () => this.setState({ more: !this.state.more }),
      toggleHist: () => this.setState({ hist: !this.state.hist }),
      regHref: 'PurchaseOrderList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class PurchaseOrderEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""} fit`} style={sx(v.fitStyle)}>
        <div className="sbw">
          <Sidebar active={v.sideKey} />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href={v.regHref}>
                {v.regLabel}
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                {v.recTitle}
              </span>
              <span className={v.recTagC}>
                {v.recTag}
              </span>
            </div>
            <DcLink className="btn" href={v.regHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
              Show record
            </DcLink>
            {' '}
            <button className="btn" type="button">
              Import order
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.toggleHist} aria-pressed={v.hist}>
              History
            </button>
          </header>
          <div className="split">
            <div className="lp">
              <section className="sec">
                <div className="sh">
                  <h2>
                    Order details
                  </h2>
                  {v.hasP ? (
                    <>
                      <div className="kps">
                        <span className="kp">
                          <span>
                            Payable
                          </span>
                          <b>
                            {v.bp?.fig}
                          </b>
                        </span>
                        <span className="kp">
                          <span>
                            Terms
                          </span>
                          <b>
                            {v.bp?.sub}
                          </b>
                        </span>
                        <span className={v.dueCls}>
                          <span>
                            {v.dueLbl}
                          </span>
                          <b>
                            {v.dueVal}
                          </b>
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="seg" role="group" aria-label="Order base">
                    <button type="button" className={v.bd} onClick={v.setDirect}>
                      Direct
                    </button>
                    <button type="button" className={v.bs} onClick={v.setSO}>
                      Against sales order
                    </button>
                  </div>
                </div>
                {v.againstSO ? (
                  <>
                    <div className="banner" style={{"borderColor":"rgba(59,130,246,.35)","background":"rgba(59,130,246,.07)"}}>
                      <span className="tag t-blue">
                        Linked
                      </span>
                      <span style={{"flex":"1"}}>
                        {"Buying for "}
                        <b style={{"fontWeight":"600"}}>
                          SAL05773
                        </b>
                        {" (Shree Rudraksha Poly · 3,991 kg pending) and "}
                        <b style={{"fontWeight":"600"}}>
                          SAL04614
                        </b>
                        {" (4,798 kg pending)"}
                      </span>
                      <button className="btn sm" type="button">
                        Change orders
                      </button>
                    </div>
                  </>
                ) : null}
                <div className="props">
                  <div className="pg">
                    <div className="pgt">
                      Order
                    </div>
                    <div className="pr">
                      <label htmlFor="p4">
                        Cost center
                      </label>
                      <select id="p4" className="pv">
                        <option>
                          Trading division
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p1">
                        Book
                      </label>
                      <select id="p1" className="pv">
                        <option>
                          Purchase order
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p2">
                        Order no.
                      </label>
                      <input id="p2" className="pv" type="text" value={v.recNo} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="p3">
                        Order date
                      </label>
                      <input id="p3" className="pv" type="text" value={v.recDt} />
                    </div>
                    <div className="pr">
                      <label htmlFor="p9">
                        Broker
                      </label>
                      <select id="p9" className="pv">
                        <option>
                          Direct
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p10">
                        Brokerage
                      </label>
                      <div className="unit">
                        <input id="p10" className="pv" type="text" defaultValue="0" />
                        <span>
                          ₹ / kg
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p11">
                        Order mode
                      </label>
                      <select id="p11" className="pv">
                        <option>
                          Phone
                        </option>
                        <option>
                          Email
                        </option>
                        <option>
                          Mill portal
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      Mill
                    </div>
                    <div className="pr">
                      <label htmlFor="p5">
                        Mill / party
                        <i>
                          *
                        </i>
                      </label>
                      <button id="p5" className="pv pkb" type="button" onClick={v.openBill} aria-haspopup="dialog">
                        <span className="pav" style={sx(v.bp?.av)}>
                          {v.bp?.ini}
                        </span>
                        <b>
                          {v.bp?.name}
                        </b>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="m7 10 5 5 5-5" />
                        </svg>
                      </button>
                    </div>
                    <div className="pr">
                      <label htmlFor="p6">
                        Party group
                      </label>
                      <input id="p6" className="pv" type="text" value={v.bp?.grp} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="p18">
                        Mill ref. no.
                      </label>
                      <input id="p18" className="pv" type="text" placeholder="e.g. GSM/2026/4410" />
                    </div>
                    <div className="pr">
                      <label htmlFor="p8">
                        Delivery to
                      </label>
                      <div className="dl">
                        {v.same ? (
                          <>
                            <label className="samechk">
                              <input id="p8" type="checkbox" checked={v.same} onChange={v.toggleSame} />
                              {" Our godown · Sachin GIDC"}
                            </label>
                          </>
                        ) : null}
                        {v.diff ? (
                          <>
                            <button className="pv pkb" type="button" onClick={v.openDel} aria-haspopup="dialog">
                              <span className="pav" style={sx(v.dp?.av)}>
                                {v.dp?.ini}
                              </span>
                              <b>
                                {v.dp?.name}
                              </b>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="m7 10 5 5 5-5" />
                              </svg>
                            </button>
                          </>
                        ) : null}
                        {v.diff ? (
                          <>
                            <label className="samechk" title="Deliver to our default godown">
                              <input type="checkbox" checked={v.same} onChange={v.toggleSame} aria-label="Deliver to our default godown" />
                            </label>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p13">
                        Credit days
                      </label>
                      <div className="unit">
                        <input id="p13" className="pv" type="text" value={v.nv?.p13} />
                        <span>
                          days
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p14">
                        Due date
                      </label>
                      <input id="p14" className="pv" type="text" value={v.nv?.p14} readOnly />
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      {"Delivery & reference"}
                    </div>
                    <div className="pr">
                      <label htmlFor="p7">
                        Supplier / agent
                      </label>
                      <select id="p7" className="pv">
                        <option>
                          Direct
                        </option>
                        <option>
                          Henil (agent)
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p19">
                        Buyer
                      </label>
                      <select id="p19" className="pv">
                        <option>
                          Meera Patel
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p16">
                        Exp. delivery
                      </label>
                      <input id="p16" className="pv" type="text" value={v.nv?.p16} />
                    </div>
                    <div className="pr">
                      <label htmlFor="p17">
                        Process type
                      </label>
                      <select id="p17" className="pv">
                        <option>
                          Direct
                        </option>
                        <option>
                          Twisting
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="p15">
                        Delivery in
                      </label>
                      <div className="unit">
                        <input id="p15" className="pv" type="text" value={v.nv?.p15} />
                        <span>
                          days
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="p12">
                        Priority
                      </label>
                      <select id="p12" className="pv">
                        <option>
                          A · Urgent
                        </option>
                        <option>
                          B · Normal
                        </option>
                      </select>
                    </div>
                  </div>
                  {v.pdBill ? (
                    <>
                      <div className={v.pdCls} role="dialog" aria-label={v.pdTitle}>
                        <div className="pdh">
                          <input className="pds" type="search" value={v.pdQ} onChange={v.setQ} placeholder="Search by name, GSTIN, phone, contact or city" aria-label="Search parties" autoFocus={true} />
                          <span className="muted" style={{"fontSize":"12px","whiteSpace":"nowrap"}}>
                            {v.pdCount}
                          </span>
                          <button className="btn sm gh" type="button" onClick={v.closeP} aria-label="Close">
                            ✕
                          </button>
                        </div>
                        <div className="pdl">
                          {(v.pdRows || []).map((r, $index) => (
                            <Fragment key={$index}>
                              <button className={r?.cls} type="button" onClick={r?.pick}>
                                <span className="pav" style={sx(r?.av)}>
                                  {r?.ini}
                                </span>
                                <span className="pdm">
                                  <span className="pdn">
                                    <span>
                                      {r?.pre}
                                      <mark>
                                        {r?.hi}
                                      </mark>
                                      {r?.post}
                                    </span>
                                    <span className="tag">
                                      {r?.grp}
                                    </span>
                                  </span>
                                  <span className="pda">
                                    {r?.addr}
                                  </span>
                                  <span className="pdc">
                                    <span>
                                      {"GSTIN "}
                                      <b>
                                        {r?.gst}
                                      </b>
                                    </span>
                                    <span>
                                      {"Ph "}
                                      <b>
                                        {r?.ph}
                                      </b>
                                    </span>
                                    <span>
                                      {"Contact "}
                                      <b>
                                        {r?.cp}
                                      </b>
                                    </span>
                                  </span>
                                </span>
                                <span className="pdr">
                                  <b>
                                    {r?.fig}
                                  </b>
                                  <span>
                                    {r?.sub}
                                  </span>
                                  <span className={r?.tc}>
                                    {r?.tag}
                                  </span>
                                </span>
                              </button>
                            </Fragment>
                          ))}
                          {' '}
                          {v.pdNone ? (
                            <>
                              <div className="pde">
                                No party matches "{v.pdQ}{"\". Check the spelling or add a new party."}
                              </div>
                            </>
                          ) : null}
                        </div>
                        <div className="pdf">
                          <span style={{"flex":"1"}}>
                            Details come from the account master
                          </span>
                          <DcLink className="btn sm" href={v.newPartyHref}>
                            + New party
                          </DcLink>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {v.pdDel ? (
                    <>
                      <div className={v.pdCls} role="dialog" aria-label={v.pdTitle}>
                        <div className="pdh">
                          <input className="pds" type="search" value={v.pdQ} onChange={v.setQ} placeholder="Search by name, GSTIN, phone, contact or city" aria-label="Search parties" autoFocus={true} />
                          <span className="muted" style={{"fontSize":"12px","whiteSpace":"nowrap"}}>
                            {v.pdCount}
                          </span>
                          <button className="btn sm gh" type="button" onClick={v.closeP} aria-label="Close">
                            ✕
                          </button>
                        </div>
                        <div className="pdl">
                          {(v.pdRows || []).map((r, $index) => (
                            <Fragment key={$index}>
                              <button className={r?.cls} type="button" onClick={r?.pick}>
                                <span className="pav" style={sx(r?.av)}>
                                  {r?.ini}
                                </span>
                                <span className="pdm">
                                  <span className="pdn">
                                    <span>
                                      {r?.pre}
                                      <mark>
                                        {r?.hi}
                                      </mark>
                                      {r?.post}
                                    </span>
                                    <span className="tag">
                                      {r?.grp}
                                    </span>
                                  </span>
                                  <span className="pda">
                                    {r?.addr}
                                  </span>
                                  <span className="pdc">
                                    <span>
                                      {"GSTIN "}
                                      <b>
                                        {r?.gst}
                                      </b>
                                    </span>
                                    <span>
                                      {"Ph "}
                                      <b>
                                        {r?.ph}
                                      </b>
                                    </span>
                                    <span>
                                      {"Contact "}
                                      <b>
                                        {r?.cp}
                                      </b>
                                    </span>
                                  </span>
                                </span>
                                <span className="pdr">
                                  <b>
                                    {r?.fig}
                                  </b>
                                  <span>
                                    {r?.sub}
                                  </span>
                                  <span className={r?.tc}>
                                    {r?.tag}
                                  </span>
                                </span>
                              </button>
                            </Fragment>
                          ))}
                          {' '}
                          {v.pdNone ? (
                            <>
                              <div className="pde">
                                No party matches "{v.pdQ}{"\". Check the spelling or add a new party."}
                              </div>
                            </>
                          ) : null}
                        </div>
                        <div className="pdf">
                          <span style={{"flex":"1"}}>
                            Details come from the account master
                          </span>
                          <DcLink className="btn sm" href={v.newPartyHref}>
                            + New party
                          </DcLink>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>
              <section className="sec items">
                <div className="sh">
                  <h2>
                    Items
                  </h2>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          #
                        </th>
                        <th>
                          Item
                        </th>
                        <th>
                          Brand
                        </th>
                        <th>
                          Lot no.
                        </th>
                        <th>
                          Grade
                        </th>
                        <th className="r">
                          Pcs
                        </th>
                        <th className="r">
                          Qty kg
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th className="r">
                          Freight %
                        </th>
                        <th className="r">
                          CGST
                        </th>
                        <th className="r">
                          SGST
                        </th>
                        {v.more ? (
                          <>
                            <th>
                              Remark 1
                            </th>
                            <th>
                              HSN
                            </th>
                            <th className="r">
                              Avg rate + GST
                            </th>
                            <th className="r">
                              Pending qty
                            </th>
                            <th>
                              Status
                            </th>
                          </>
                        ) : null}
                        <th className="r">
                          Amount
                        </th>
                        <th>
                          Our stock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.isNew ? (
                        <>

                        </>
                      ) : null}
                      {v.isRec ? (
                        <>
                          <tr>
                            <td className="muted">
                              1
                            </td>
                            <td>
                              {v.rec?.it}
                            </td>
                            <td className="t2">
                              {v.rec?.br}
                            </td>
                            <td className="t2">
                              {v.rec?.lot}
                            </td>
                            <td className="t2">
                              {v.rec?.gr}
                            </td>
                            <td className="r">
                              {v.rec?.pcs}
                            </td>
                            <td className="r">
                              {v.rec?.qty}
                            </td>
                            <td className="r">
                              {v.rec?.rate}
                            </td>
                            <td className="r">
                              0
                            </td>
                            <td className="r">
                              {v.rec?.half}
                            </td>
                            <td className="r">
                              {v.rec?.half}
                            </td>
                            {v.more ? (
                              <>
                                <td className="t2">
                                  —
                                </td>
                                <td className="t2">
                                  5402
                                </td>
                                <td className="r">
                                  {v.rec?.avg}
                                </td>
                                <td className="r">
                                  {v.rec?.pq}
                                </td>
                                <td className="t2">
                                  {v.rec?.st}
                                </td>
                              </>
                            ) : null}
                            <td className="r">
                              {v.rec?.amt}
                            </td>
                            <td className="t2">
                              {v.rec?.done}
                            </td>
                          </tr>
                        </>
                      ) : null}
                      <tr>
                        <td className="muted">
                          {v.nextN}
                        </td>
                        <td>
                          <input className="cin" type="text" aria-label="Item" placeholder="Search item" style={{"width":"150px"}} />
                        </td>
                        <td>
                          <input className="cin" type="text" aria-label="Brand" style={{"width":"90px"}} />
                        </td>
                        <td>
                          <input className="cin" type="text" aria-label="Lot" style={{"width":"90px"}} />
                        </td>
                        <td>
                          <input className="cin" type="text" aria-label="Grade" style={{"width":"52px"}} />
                        </td>
                        <td>
                          <input className="cin r" type="text" aria-label="Pieces" style={{"width":"56px"}} />
                        </td>
                        <td>
                          <input className="cin r" type="text" aria-label="Quantity" style={{"width":"90px"}} />
                        </td>
                        <td>
                          <input className="cin r" type="text" aria-label="Rate" style={{"width":"76px"}} />
                        </td>
                        <td>
                          <input className="cin r" type="text" aria-label="Freight percent" style={{"width":"52px"}} />
                        </td>
                        <td className="r muted">
                          —
                        </td>
                        <td className="r muted">
                          —
                        </td>
                        {v.more ? (
                          <>
                            <td>
                              <input className="cin" type="text" aria-label="Remark" style={{"width":"80px"}} />
                            </td>
                            <td className="muted">
                              —
                            </td>
                            <td className="r muted">
                              —
                            </td>
                            <td className="r muted">
                              —
                            </td>
                            <td className="muted">
                              —
                            </td>
                          </>
                        ) : null}
                        <td className="r muted">
                          —
                        </td>
                        <td className="muted">
                          —
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td />
                        <td>
                          Total
                        </td>
                        <td />
                        <td />
                        <td />
                        <td className="r">
                          {v.tt?.pcs}
                        </td>
                        <td className="r">
                          {v.tt?.qty}
                        </td>
                        <td />
                        <td />
                        <td className="r">
                          {v.tt?.half}
                        </td>
                        <td className="r">
                          {v.tt?.half}
                        </td>
                        {v.more ? (
                          <>
                            <td />
                            <td />
                            <td />
                            <td className="r">
                              {v.tt?.qty}
                            </td>
                            <td />
                          </>
                        ) : null}
                        <td className="r">
                          {v.tt?.amt}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
              <section className="sec bottom">
                <div className="cols3">
                  <div className="box">
                    <h3>
                      Tax summary
                    </h3>
                    <div className="kv">
                      <span>
                        HSN 5402 · taxable
                      </span>
                      <span>
                        ₹ 10,05,600.00
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        CGST 2.5%
                      </span>
                      <span>
                        ₹ 25,140.00
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        SGST 2.5%
                      </span>
                      <span>
                        ₹ 25,140.00
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Discount structure
                      </span>
                      <span>
                        None
                      </span>
                    </div>
                  </div>
                  <div className="box">
                    <h3>
                      {"Transport & notes"}
                    </h3>
                    <div className="fld">
                      <label htmlFor="q1">
                        Transportation
                      </label>
                      <select id="q1" className="inp">
                        <option>
                          Mill's own transport
                        </option>
                        <option>
                          Jay Ambe Roadlines
                        </option>
                      </select>
                    </div>
                    <div className="fld">
                      <label htmlFor="p20">
                        Order type
                      </label>
                      <select id="p20" className="inp">
                        <option>
                          Yarn
                        </option>
                        <option>
                          General
                        </option>
                      </select>
                    </div>
                    <div className="fld">
                      <label htmlFor="q2">
                        Add / less
                      </label>
                      <input id="q2" className="inp" type="text" placeholder="e.g. loading charge" />
                    </div>
                    <div className="fld">
                      <label htmlFor="q3">
                        Remark
                      </label>
                      <textarea id="q3" className="inp" placeholder="Shown on the PO sent to the mill" />
                    </div>
                  </div>
                  <div className="box">
                    <h3>
                      Amount
                    </h3>
                    <div className="kv">
                      <span>
                        Quantity
                      </span>
                      <span>
                        {v.am?.q}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Gross amount
                      </span>
                      <span>
                        {v.am?.gross}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Freight
                      </span>
                      <span>
                        ₹ 0.00
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        CGST + SGST
                      </span>
                      <span>
                        {v.am?.gst}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Add / less
                      </span>
                      <span>
                        ₹ 0.00
                      </span>
                    </div>
                    <div className="kv" style={{"paddingTop":"8px","borderTop":"1px dashed var(--bd2)"}}>
                      <span style={{"color":"var(--t1)","fontWeight":"600"}}>
                        Net amount
                      </span>
                      <span style={{"fontSize":"20px","fontWeight":"600"}}>
                        {v.am?.net}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
              <div className="actbar">
                <span className="actsum">
                  <span>
                    {"Qty "}
                    <b>
                      {v.tt?.qty}{" kg"}
                    </b>
                  </span>
                  <span>
                    {"Net "}
                    <b>
                      {v.am?.net}
                    </b>
                  </span>
                </span>
                {' '}
                <select className="inp" aria-label="More actions">
                  <option>
                    More…
                  </option>
                  <option>
                    {"Terms & conditions"}
                  </option>
                  <option>
                    Party details
                  </option>
                </select>
                {' '}
                <button className="btn no" type="button">
                  Delete
                </button>
                <div style={{"flex":"1"}} />
                {v.isNew ? (
                  <>
                    <DcLink className="btn gh" href={v.regHref}>
                      Cancel
                    </DcLink>
                    {' '}
                    <button className="btn" type="button">
                      {"Save & send to mill"}
                    </button>
                    {' '}
                    <button className="btn pr" type="button">
                      Save for approval
                    </button>
                  </>
                ) : null}
                {v.isRec ? (
                  <>
                    <span className="muted" style={{"fontSize":"13px"}}>
                      {v.updNote}
                    </span>
                    <DcLink className="btn gh" href={v.backHref}>
                      Close
                    </DcLink>
                    <button className="btn" type="button">
                      Print
                    </button>
                    <button className="btn pr" type="button" onClick={v.doUpdate}>
                      {v.updLabel}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {v.hist ? (
              <>
                <aside className="rp" aria-label="Mill history">
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"0 20px","minHeight":"56px","borderBottom":"1px solid var(--bd)"}}>
                    <b style={{"fontWeight":"600","flex":"1"}}>
                      Mill history
                    </b>
                    <button className="btn sm gh" type="button" onClick={v.toggleHist} aria-label="Close history">
                      ✕
                    </button>
                  </div>
                  <div className="hist">
                    <div className="muted" style={{"fontSize":"13px"}}>
                      Last orders · Garden Silk Mills
                    </div>
                    <div className="hrow">
                      <span>
                        67/72 FDY · 850 kg
                      </span>
                      <span>
                        ₹ 119.00
                      </span>
                      <span className="muted">
                        PUR0724 · 13-06-2026
                      </span>
                      <span className="muted">
                        850 kg pending
                      </span>
                    </div>
                    <div className="hrow">
                      <span>
                        50/24 FDY · 21,000 kg
                      </span>
                      <span>
                        ₹ 126.00
                      </span>
                      <span className="muted">
                        PUR0979 · 08-07-2026
                      </span>
                      <span className="muted">
                        6,892 kg pending
                      </span>
                    </div>
                    <div className="hrow">
                      <span>
                        75/36 FDY · 12,000 kg
                      </span>
                      <span>
                        ₹ 117.50
                      </span>
                      <span className="muted">
                        PUR0412 · 02-05-2026
                      </span>
                      <span className="muted">
                        Clear
                      </span>
                    </div>
                    <div className="box" style={{"marginTop":"6px"}}>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        Rate trend · 75/36 FDY
                      </span>
                      <b style={{"fontWeight":"600"}}>
                        ₹ 117.50 → ₹ 119.00
                      </b>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        +1.3% in 6 months
                      </span>
                    </div>
                    <div className="box">
                      <span className="muted" style={{"fontSize":"13px"}}>
                        Payable to mill
                      </span>
                      <b style={{"fontWeight":"600"}}>
                        ₹ 6,20,500
                      </b>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        Avg delivery 6 days · 2% short weight
                      </span>
                    </div>
                  </div>
                </aside>
              </>
            ) : null}
          </div>
        </div>
        <div className="aiw">
          <Assistant page="poe" />
        </div>
      </div>
      </>
    );
  }
}

export default function PurchaseOrderEntry(props) {
  const theme = useTheme();
  return <PurchaseOrderEntryView {...props} theme={theme} />;
}
