/* eslint-disable */
// SalesOrderEntry — converted 1:1 from the YarnFlow design (SalesOrderEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './SalesOrderEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { z: 1, moreF: false, more: false, hist: true }; }
  componentDidMount() {
    try { const b = JSON.parse(window.localStorage.getItem('yf-back') || 'null'); if (b && b.href) this.setState({ back: b }); } catch (e) {}
 if (this.props.mode !== 'view') return; const rd = () => { try { const raw = window.localStorage.getItem('yf-view-so'); if (raw && raw !== this._raw) { this._raw = raw; this.setState({ rec: JSON.parse(raw), upd: false, bill: undefined }); } } catch (e) {} }; this._rd = rd; rd(); this._iv = setInterval(rd, 700); try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {} }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const PTY = [{"name": "Bhagwati Filaments", "grp": "Bhagwati Filaments", "addr": "Plot 12, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AABCB4410K1Z3", "ph": "+91 98250 41120", "cp": "Ramesh Agarwal", "fig": "₹ 8,12,540", "sub": "4 days credit", "tag": "Overdue 6 d", "tc": "tag t-orange"}, {"name": "Bhagwati Filaments · Unit 2", "grp": "Bhagwati Filaments", "addr": "Plot 44, Pandesara GIDC, Surat 394221", "city": "Surat", "gst": "24AABCB4410K2Z2", "ph": "+91 98250 41121", "cp": "Suresh Agarwal", "fig": "₹ 1,20,400", "sub": "4 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Shree Bhagwati Textiles", "grp": "Bhagwati Group", "addr": "14 Millennium Market, Ring Road, Surat 395002", "city": "Surat", "gst": "24AAKFB7712C1Z9", "ph": "+91 99099 22150", "cp": "Mahesh Patel", "fig": "₹ 2,10,400", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Bhagwati Synthetics LLP", "grp": "Bhagwati Synthetics", "addr": "Gala 7, Kamatghar, Bhiwandi 421302", "city": "Bhiwandi", "gst": "27AAJFB3301E1Z4", "ph": "+91 98201 77310", "cp": "Vinod Jain", "fig": "₹ 0", "sub": "30 days credit", "tag": "New party", "tc": "tag t-blue"}, {"name": "Shree Rudraksha Poly", "grp": "Shree Rudraksha Poly", "addr": "Block 3, Kadodara Char Rasta, Surat 394327", "city": "Surat", "gst": "24AAHFS3302P1Z1", "ph": "+91 97234 55102", "cp": "Kamal Shah", "fig": "₹ 6,40,210", "sub": "4 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Jigita Fab LLP", "grp": "Jigita Fab LLP", "addr": "22 Udhna Udyog Nagar, Surat 394210", "city": "Surat", "gst": "24AAKFJ9910R1Z7", "ph": "+91 90990 31188", "cp": "Jignesh Desai", "fig": "₹ 2,10,000", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Rannade Textile", "grp": "Rannade Textile", "addr": "5 Laxmi Industrial Estate, Varachha, Surat 395006", "city": "Surat", "gst": "24AARFR5521K1Z4", "ph": "+91 98989 10022", "cp": "Nilkanthbhai", "fig": "₹ 2,87,050", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Bansam Fabrics", "grp": "Bansam Fabrics", "addr": "Plot 88, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AADFB7781M1Z9", "ph": "+91 98240 66120", "cp": "Ramji Bhai", "fig": "₹ 18,60,000", "sub": "1 day credit", "tag": "Overdue 9 d", "tc": "tag t-red"}];
    const DEL = [{"name": "Bhagwati Filaments · Unit 2", "grp": "Bhagwati Filaments", "addr": "Plot 44, Pandesara GIDC, Surat 394221", "city": "Surat", "gst": "24AABCB4410K2Z2", "ph": "+91 98250 41121", "cp": "Suresh Agarwal", "fig": "₹ 1,20,400", "sub": "4 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Bhagwati Filaments", "grp": "Bhagwati Filaments", "addr": "Plot 12, Sachin GIDC, Surat 394230", "city": "Surat", "gst": "24AABCB4410K1Z3", "ph": "+91 98250 41120", "cp": "Ramesh Agarwal", "fig": "₹ 8,12,540", "sub": "4 days credit", "tag": "Overdue 6 d", "tc": "tag t-orange"}, {"name": "Shree Bhagwati Textiles", "grp": "Bhagwati Group", "addr": "14 Millennium Market, Ring Road, Surat 395002", "city": "Surat", "gst": "24AAKFB7712C1Z9", "ph": "+91 99099 22150", "cp": "Mahesh Patel", "fig": "₹ 2,10,400", "sub": "15 days credit", "tag": "Good payer", "tc": "tag t-green"}, {"name": "Om Sai Weaving (job work)", "grp": "Consignee", "addr": "Plot 9, Palsana Road, Surat 394315", "city": "Surat", "gst": "24AACFO1180H1Z6", "ph": "+91 97140 22091", "cp": "Sanjay Patil", "fig": "Job worker", "sub": "Twisting", "tag": "Consignee", "tc": "tag"}, {"name": "Kanvi Corporation", "grp": "Consignee", "addr": "Gujarat Hira Bourse Road, Ichchhapor, Surat 394510", "city": "Surat", "gst": "24AAGFK9902L1Z1", "ph": "+91 98795 11042", "cp": "Kanvi Shah", "fig": "Consignee", "sub": "—", "tag": "Consignee", "tc": "tag"}];
    const COL = ['#3B82F6, #6366F1', '#F59E0B, #EA580C', '#10B981, #059669', '#EC4899, #DB2777', '#8B5CF6, #6D28D9', '#14B8A6, #0D9488'];
    const deco = (p, i) => ({ ...p, ini: p.name.replace(/^(Shree|Shri|The)\s+/i, '').charAt(0), av: 'background: linear-gradient(135deg, ' + COL[i % COL.length] + ')' });
    const REC = this.props.mode === 'view' ? (this.state.rec || this.props.openRec || { no: 'SAL02722', dt: '21-05-2026', p: 'Bhagwati Filaments', g: 'Bhagwati Filaments', it: '50/24 SD CAT', br: 'Reliance', lot: '356C9S', gr: 'A+', rate: 179.6, oq: 10050, dq: 9335.8, stL: 'Pending dispatch' }) : null;
    if (REC && !PTY.some((p) => p.name === REC.p)) PTY.push(Object.assign({}, PTY[0], { name: REC.p, grp: REC.g || REC.p }));
    const fN = (n, d) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const isRec = !!REC; let rec = {}, tt = { pcs: '0', qty: '0.000', amt: '0.00' }, am = { q: '0.000 kg · 0 pcs', gross: '₹ 0.00', disc: '− ₹ 0.00', tax: '₹ 0.00', half: '₹ 0.00', net: '₹ 0.00' };
    if (REC) { const oq = Number(REC.oq) || 0, rt = Number(REC.rate) || 0, dq = Number(REC.dq) || 0; const pcs = Math.max(1, Math.round(oq / 60)); const g = oq * rt; const gst = g * 0.05;
      rec = { it: REC.it, br: REC.br, lot: REC.lot, gr: REC.gr, pcs: String(pcs), qty: fN(oq, 3), rate: fN(rt, 2), amt: fN(g, 2), half: fN(g * 0.025, 2), avg: fN(rt * 1.05, 2), ppcs: String(Math.max(0, Math.round((oq - dq) / 60))), pq: fN(Math.max(oq - dq, 0), 3), st: REC.stL || 'Pending', done: ('Dispatched ') + fN(dq, 3) + ' kg' };
      tt = { pcs: String(pcs), qty: fN(oq, 3), half: fN(g * 0.025, 2), amt: fN(g, 2) };
      am = { q: fN(oq, 3) + ' kg · ' + pcs + ' pcs', gross: '₹ ' + fN(g, 2), disc: '− ₹ 0.00', tax: '₹ ' + fN(g, 2), half: '₹ ' + fN(g * 0.025, 2), gst: '₹ ' + fN(gst, 2), net: '₹ ' + fN(Math.round(g + gst), 2) }; }
    const TAGC = { 'Pending dispatch': 'tag t-blue', 'Pending receipt': 'tag t-blue', 'On hold · approval': 'tag t-orange', 'On hold': 'tag t-orange', Closed: 'tag t-green', Clear: 'tag t-green', Cancelled: 'tag t-red', Locked: 'tag t-gray' };
    const NV = { f10: isRec ? '0.50' : '', f13: isRec ? '4' : '', f14: isRec ? '27-10-2026' : '', f15: isRec ? '28-10-2026' : '', f9: isRec ? 'Avi M' : 'Select broker', f8: isRec ? 'Reliance Industries' : 'Select mill', f12: isRec ? 'Avi M' : 'Select sales person' };
    const recV = { nv: NV, sideKey: isRec ? 'so' : 'soe', regLabel: isRec ? 'Sales order register' : 'Sales Orders',
      updLabel: this.state.upd ? '✓ Updated' : 'Update order', updNote: this.state.upd ? 'Changes saved to ' + (REC ? REC.no : '') : 'Editing ' + (REC ? REC.no : ''), doUpdate: () => this.setState({ upd: true }), isRec, isNew: !isRec, rec, tt, am, nextN: isRec ? '2' : '1', recTitle: isRec ? REC.no : 'New order', recTag: isRec ? (REC.stL || 'Pending') : 'New', recTagC: isRec ? (TAGC[REC.stL] || 'tag') : 'tag',
      recNo: isRec ? (/\//.test(REC.no) ? REC.no : REC.no + '/26-27') : 'SAL11838/26-27', recDt: isRec ? REC.dt : '23-10-2026' };
    const bi = this.state.bill ?? (REC ? Math.max(0, PTY.findIndex((p) => p.name === REC.p)) : null); const hasP = bi != null; const bp = hasP ? deco(PTY[bi], bi) : { name: 'Select party…', grp: '', ini: '+', av: 'background: var(--s3); color: var(--t3)', fig: '₹ 0', sub: '', tag: '', tc: '', addr: '', city: '', gst: '', ph: '', cp: '' };
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
    const BK = this.state.back;
    return { backHref: BK ? BK.href : 'SalesOrderList' + sfx + '.dc.html', backLabel: BK ? BK.label : 'Sales order register', ...recV, hasP,
      dueCls: bp.tag.indexOf('Overdue') === 0 ? 'kp due' : 'kp ok', dueLbl: bp.tag.indexOf('Overdue') === 0 ? 'Due payment' : 'Due payment', dueVal: bp.tag.indexOf('Overdue') === 0 ? (bi === 0 ? '₹ 1,04,200 · ' : '') + bp.tag.replace('Overdue ', '') + ' late' : 'None',
      cl: (() => { const LIM = [3000000, 1000000, 1500000, 500000, 2500000, 1200000, 1500000, 2000000]; const L = LIM[bi ?? 0] || 1000000; const o = parseFloat(String(bp.fig).replace(/[^0-9.]/g, '')) || 0; const p = Math.min(100, Math.round(o / L * 100)); const f = (n) => { const x = String(Math.round(n)); const l3 = x.slice(-3); const r = x.slice(0, -3); return '₹ ' + (r ? r.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + l3; }; return { pct: p + '% used', lim: f(L), used: f(o) + ' used · ' + p + '%', bar: 'width: ' + p + '%' + (p >= 80 ? '; background: #EF4444' : ''), avail: 'Available ' + f(Math.max(0, L - o)) }; })(),
      bp, dp, same, diff: !same, pdBill: pdOpen === 'bill', pdDel: pdOpen === 'del', dName: same ? bp.name : dp.name, dAd: same ? bp.addr : dp.addr, dMeta: same ? 'Same as bill to' : 'GSTIN ' + dp.gst + ' · Ph ' + dp.ph, pdOpen: !!pdOpen, pdRows, pdNone: pdRows.length === 0, pdQ: q, pdCount: pdRows.length + (pdRows.length === 1 ? ' party' : ' parties'),
      pdCls: pdOpen === 'del' ? 'pdrop r' : 'pdrop', pdTitle: pdOpen === 'del' ? 'Choose delivery party' : 'Choose billing party',
      openBill: () => this.setState({ pd: 'bill', pq: '' }), openDel: () => this.setState({ pd: 'del', pq: '' }), closeP: () => this.setState({ pd: null, pq: '' }),
      setQ: (e) => this.setState({ pq: e.target.value, pd: pdOpen }), toggleSame: () => this.setState({ same: !same, pd: !same ? null : 'del', pq: '' }),
      newPartyHref: 'AccountMaster' + sfx + '.dc.html',
      fitStyle: 'height: 100vh',
      moreF: this.state.moreF, moreFLabel: this.state.moreF ? 'Fewer fields' : '+ 8 more fields', toggleF: () => this.setState({ moreF: !this.state.moreF }),
      theme, more: this.state.more, hist: this.state.hist && hasP,
      colsLabel: this.state.more ? 'Fewer columns' : 'More columns',
      toggleCols: () => this.setState({ more: !this.state.more }),
      toggleHist: () => this.setState({ hist: !this.state.hist }),
      regHref: 'SalesOrderList' + sfx + '.dc.html', apprHref: 'SalesOrderList' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class SalesOrderEntryView extends Component {
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Import order
            </button>
            {' '}
            <button className="btn" type="button" onClick={v.toggleHist} aria-pressed={v.hist}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
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
                            Outstanding
                          </span>
                          <b>
                            {v.bp?.fig}
                          </b>
                        </span>
                        <span className="kp">
                          <span>
                            Credit limit
                          </span>
                          <b>
                            {v.cl?.lim}
                          </b>
                          <span className="mt" aria-hidden="true">
                            <i style={sx(v.cl?.bar)} />
                          </span>
                          <span>
                            {v.cl?.pct}
                          </span>
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
                </div>
                <div className="props">
                  <div className="pg">
                    <div className="pgt">
                      Order
                    </div>
                    <div className="pr">
                      <label htmlFor="f4">
                        Cost center
                      </label>
                      <select id="f4" className="pv">
                        <option>
                          Trading division
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f1">
                        Book
                      </label>
                      <select id="f1" className="pv">
                        <option>
                          Sales order
                        </option>
                        <option>
                          Sales order · export
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f2">
                        Order no.
                      </label>
                      <input id="f2" className="pv" type="text" value={v.recNo} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="f3">
                        Order date
                      </label>
                      <input id="f3" className="pv" type="text" value={v.recDt} />
                    </div>
                    <div className="pr">
                      <label htmlFor="f9">
                        Broker
                      </label>
                      <select id="f9" className="pv">
                        <option>
                          {v.nv?.f9}
                        </option>
                        <option>
                          Direct
                        </option>
                        <option>
                          Manoj
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f10">
                        Brokerage
                      </label>
                      <div style={{"display":"flex","gap":"6px","minWidth":"0"}}>
                        <div className="unit" style={{"flex":"1.2","minWidth":"0"}}>
                          <input id="f10" className="pv" type="text" value={v.nv?.f10} />
                          <span>
                            ₹/kg
                          </span>
                        </div>
                        <div className="unit" style={{"flex":"1","minWidth":"0"}}>
                          <input id="f11" className="pv" type="text" defaultValue="0" aria-label="Rs %" />
                          <span>
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      Party
                    </div>
                    <div className="pr">
                      <label htmlFor="f5">
                        Party
                        <i>
                          *
                        </i>
                      </label>
                      <button id="f5" className="pv pkb" type="button" onClick={v.openBill} aria-haspopup="dialog">
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
                      <label htmlFor="f6">
                        Party group
                      </label>
                      <input id="f6" className="pv" type="text" value={v.bp?.grp} readOnly />
                    </div>
                    <div className="pr">
                      <label htmlFor="f17">
                        Ref. ord no.
                      </label>
                      <input id="f17" className="pv" type="text" placeholder="e.g. BF/PO/221" />
                    </div>
                    <div className="pr">
                      <label htmlFor="f7">
                        Delivery party
                      </label>
                      <div className="dl">
                        {v.same ? (
                          <>
                            <label className="samechk">
                              <input id="f7" type="checkbox" checked={v.same} onChange={v.toggleSame} />
                              {" Same as party"}
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
                            <label className="samechk" title="Deliver to the same party">
                              <input type="checkbox" checked={v.same} onChange={v.toggleSame} aria-label="Deliver to the same party" />
                            </label>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="f13">
                        Credit days
                      </label>
                      <div className="unit">
                        <input id="f13" className="pv" type="text" value={v.nv?.f13} />
                        <span>
                          days
                        </span>
                      </div>
                    </div>
                    <div className="pr">
                      <label htmlFor="f14">
                        Due date
                      </label>
                      <input id="f14" className="pv" type="text" value={v.nv?.f14} readOnly />
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pgt">
                      {"Delivery & reference"}
                    </div>
                    <div className="pr">
                      <label htmlFor="f8">
                        Supplier (mill)
                      </label>
                      <select id="f8" className="pv">
                        <option>
                          {v.nv?.f8}
                        </option>
                        <option>
                          Any mill
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f12">
                        Sales person
                      </label>
                      <select id="f12" className="pv">
                        <option>
                          {v.nv?.f12}
                        </option>
                        <option>
                          Rajesh Shah
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f15">
                        Exp. delivery
                      </label>
                      <input id="f15" className="pv" type="text" value={v.nv?.f15} />
                    </div>
                    <div className="pr">
                      <label htmlFor="f16">
                        Process type
                      </label>
                      <select id="f16" className="pv">
                        <option>
                          Direct dispatch
                        </option>
                        <option>
                          Twisting
                        </option>
                        <option>
                          Dyeing
                        </option>
                      </select>
                    </div>
                    <div className="pr">
                      <label htmlFor="f18">
                        Ref. name
                      </label>
                      <input id="f18" className="pv" type="text" placeholder="Who placed the order" />
                    </div>
                    <div className="pr">
                      <label htmlFor="f20">
                        Priority
                      </label>
                      <select id="f20" className="pv">
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
                          Unit
                        </th>
                        <th>
                          Grade
                        </th>
                        <th className="r">
                          Pcs
                        </th>
                        <th className="r">
                          Qty
                        </th>
                        <th className="r">
                          Rate
                        </th>
                        <th className="r">
                          Disc %
                        </th>
                        <th className="r">
                          Freight %
                        </th>
                        <th className="r">
                          GST %
                        </th>
                        {v.more ? (
                          <>
                            <th>
                              Remark 1
                            </th>
                            <th>
                              Remark 2
                            </th>
                            <th>
                              HSN
                            </th>
                            <th className="r">
                              Avg rate + GST
                            </th>
                            <th className="r">
                              Pending pcs
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
                          Stock
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
                              Kg
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
                              0
                            </td>
                            <td className="r">
                              5
                            </td>
                            {v.more ? (
                              <>
                                <td className="t2">
                                  —
                                </td>
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
                                  {v.rec?.ppcs}
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
                            <td>
                              <span className="stockok">
                                {v.rec?.done}
                              </span>
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
                          <input className="cin" type="text" aria-label="Lot no" style={{"width":"90px"}} />
                        </td>
                        <td>
                          <input className="cin" type="text" aria-label="Unit" defaultValue="Kg" style={{"width":"52px"}} />
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
                          <input className="cin r" type="text" aria-label="Discount percent" style={{"width":"52px"}} />
                        </td>
                        <td>
                          <input className="cin r" type="text" aria-label="Freight percent" style={{"width":"52px"}} />
                        </td>
                        <td className="r muted">
                          5
                        </td>
                        {v.more ? (
                          <>
                            <td>
                              <input className="cin" type="text" aria-label="Remark 1" style={{"width":"80px"}} />
                            </td>
                            <td>
                              <input className="cin" type="text" aria-label="Remark 2" style={{"width":"80px"}} />
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
                        <td />
                        <td className="r">
                          {v.tt?.pcs}
                        </td>
                        <td className="r">
                          {v.tt?.qty}
                        </td>
                        <td />
                        <td />
                        <td />
                        <td />
                        {v.more ? (
                          <>
                            <td />
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
                      Discount structure
                    </h3>
                    <div className="kv">
                      <span>
                        Quantity discount
                      </span>
                      <span>
                        ₹ 0.00
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Cash discount
                      </span>
                      <span>
                        ₹ 0.00
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Rate difference
                      </span>
                      <span>
                        ₹ 0.00
                      </span>
                    </div>
                    <button className="btn sm" type="button" style={{"alignSelf":"flex-start"}}>
                      + Add discount
                    </button>
                  </div>
                  <div className="box">
                    <h3>
                      {"Transport & notes"}
                    </h3>
                    <div className="fld">
                      <label htmlFor="t1">
                        Transportation
                      </label>
                      <select id="t1" className="inp">
                        <option>
                          Navkar Roadlines
                        </option>
                        <option>
                          Jay Ambe Roadlines
                        </option>
                      </select>
                    </div>
                    <div className="fld">
                      <label htmlFor="f19">
                        Order type
                      </label>
                      <select id="f19" className="inp">
                        <option>
                          Yarn
                        </option>
                        <option>
                          General
                        </option>
                      </select>
                    </div>
                    <div className="fld">
                      <label htmlFor="t2">
                        Add / less
                      </label>
                      <input id="t2" className="inp" type="text" placeholder="e.g. packing charge" />
                    </div>
                    <div className="fld">
                      <label htmlFor="t3">
                        Remark
                      </label>
                      <textarea id="t3" className="inp" placeholder="Shown on order print" />
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
                        Discount
                      </span>
                      <span>
                        {v.am?.disc}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        Taxable value
                      </span>
                      <span>
                        {v.am?.tax}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        CGST 2.5%
                      </span>
                      <span>
                        {v.am?.half}
                      </span>
                    </div>
                    <div className="kv">
                      <span>
                        SGST 2.5%
                      </span>
                      <span>
                        {v.am?.half}
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
                      {"Save & print"}
                    </button>
                    {' '}
                    <DcLink className="btn pr" href={v.apprHref}>
                      Save for approval
                    </DcLink>
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
                <aside className="rp" aria-label="Party history">
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"0 20px","minHeight":"56px","borderBottom":"1px solid var(--bd)"}}>
                    <b style={{"fontWeight":"600","flex":"1"}}>
                      Party history
                    </b>
                    <button className="btn sm gh" type="button" onClick={v.toggleHist} aria-label="Close history">
                      ✕
                    </button>
                  </div>
                  <div className="hist">
                    <div className="muted" style={{"fontSize":"13px"}}>
                      Last orders · Bhagwati Filaments
                    </div>
                    <div className="hrow">
                      <span>
                        50/24 SD CAT · 10,050 kg
                      </span>
                      <span>
                        ₹ 179.60
                      </span>
                      <span className="muted">
                        SAL02722 · 21-05-2026
                      </span>
                      <span className="muted">
                        93% dispatched
                      </span>
                    </div>
                    <div className="hrow">
                      <span>
                        50/24 SD CAT · 8,040 kg
                      </span>
                      <span>
                        ₹ 176.00
                      </span>
                      <span className="muted">
                        SAL01988 · 02-04-2026
                      </span>
                      <span className="muted">
                        Clear
                      </span>
                    </div>
                    <div className="hrow">
                      <span>
                        50/48 FDY · 3,000 kg
                      </span>
                      <span>
                        ₹ 141.50
                      </span>
                      <span className="muted">
                        SAL01650 · 11-03-2026
                      </span>
                      <span className="muted">
                        Clear
                      </span>
                    </div>
                    <div className="hrow">
                      <span>
                        75/36 FDY · 2,400 kg
                      </span>
                      <span>
                        ₹ 128.00
                      </span>
                      <span className="muted">
                        SAL01204 · 18-02-2026
                      </span>
                      <span className="muted">
                        Clear
                      </span>
                    </div>
                    <div className="muted" style={{"fontSize":"13px","marginTop":"6px"}}>
                      Last design / lot used
                    </div>
                    <div style={{"display":"flex","gap":"6px","flexWrap":"wrap"}}>
                      <span className="tag">
                        356C9S · A+
                      </span>
                      <span className="tag">
                        338C1M · A+
                      </span>
                      <span className="tag">
                        FX85 · PQ
                      </span>
                    </div>
                    <div className="box" style={{"marginTop":"6px"}}>
                      <span className="muted" style={{"fontSize":"13px"}}>
                        Average payment
                      </span>
                      <b style={{"fontWeight":"600"}}>
                        Pays in 7 days on 4-day terms
                      </b>
                      <span className="tag t-green" style={{"alignSelf":"flex-start"}}>
                        Good payer
                      </span>
                    </div>
                  </div>
                </aside>
              </>
            ) : null}
          </div>
        </div>
        <div className="aiw">
          <Assistant page="soe" />
        </div>
      </div>
      </>
    );
  }
}

export default function SalesOrderEntry(props) {
  const theme = useTheme();
  return <SalesOrderEntryView {...props} theme={theme} />;
}
