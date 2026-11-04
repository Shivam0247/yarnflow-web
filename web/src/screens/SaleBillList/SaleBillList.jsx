/* eslint-disable */
// SaleBillList — converted 1:1 from the YarnFlow design (SaleBillList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './SaleBillList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { tab: 'All', loaded: 20, sel: [], gen: {}, toast: '' }; }
  /* live data (app) — on the design canvas window.YF_API is absent and the sample data below is used */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  async load() {
    const api = this.api(); if (!api) return;
    try { const r = await api.get('/vouchers/sale-bills', { pageSize: 1000 }); this.setState({ live: r.data }); } catch (e) { this.setState({ toast: api.message(e) }); }
  }
  async genLive(ids) {
    const api = this.api(); if (!api || !ids.length) return;
    try { const res = await api.post('/eway-bills/bulk-generate', { ids }); const ok = res.filter((x) => x.ewbNo); const bad = res.filter((x) => !x.ewbNo);
      this.setState({ sel: [], selAll: false, excl: [], toast: ok.length + ' e-way bill' + (ok.length === 1 ? '' : 's') + ' generated · Part A filed' + (bad.length ? ' · ' + bad.length + ' failed: ' + bad.map((x) => x.error || x.number).join('; ') : ' · Part B shows once the vehicle is entered') }); await this.load(); }
    catch (e) { this.setState({ toast: api.message(e) }); }
  }
  componentDidMount() { this.load(); this._sc = () => { try { const left = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight); if (left < 160 && !this._ld && this._more) { this._ld = true; setTimeout(() => { this._ld = false; this.setState({ loaded: this.state.loaded + 20 }); }, 400); } } catch (e) {} }; try { window.addEventListener('scroll', this._sc); } catch (e) {} }
  componentWillUnmount() { try { window.removeEventListener('scroll', this._sc); } catch (e) {} }

  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  cf(base, COLS) {
    const st = this.state; const flt = st.flt || {}; const sk = st.sk || null; const sd = st.sd || 1; const pop = st.pop || null; const pq = String(st.pq || '').toLowerCase();
    const val = (r, c) => { const v = c.get ? c.get(r) : r[c.k]; return v == null || v === '' ? '—' : v; };
    const dk = (s) => { const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/); return m ? Number(m[3] + m[2] + m[1]) : 0; };
    const cmp = (c) => (a, b) => { const x = val(a, c), y = val(b, c); const r = c.num ? (Number(x) || 0) - (Number(y) || 0) : c.date ? dk(x) - dk(y) : String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' }); return r * sd; };
    const pass = (r, skip) => COLS.every((c) => c.k === skip || !flt[c.k] || flt[c.k].indexOf(String(val(r, c))) >= 0);
    const list = base.filter((r) => pass(r));
    const sc = sk ? COLS.find((x) => x.k === sk) : null;
    const sorter = sc ? cmp(sc) : null;
    if (sorter) list.sort(sorter);
    const set = (patch) => this.setState(Object.assign({ loaded: 20 }, patch));
    const fmtV = (c, v) => (c.fmt && v !== '—' ? c.fmt(v) : v);
    const heads = COLS.map((c) => {
      const on = !!flt[c.k]; const open = pop === c.k; const sorted = sk === c.k;
      let opts = []; let all = [];
      if (open) {
        const cnt = {}; base.filter((r) => pass(r, c.k)).forEach((r) => { const v = String(val(r, c)); cnt[v] = (cnt[v] || 0) + 1; });
        all = Object.keys(cnt).sort((a, b) => c.num ? (Number(a) || 0) - (Number(b) || 0) : c.date ? dk(a) - dk(b) : a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
        opts = all.filter((v) => !pq || String(fmtV(c, v)).toLowerCase().indexOf(pq) >= 0).map((v) => {
          const ck = !on || flt[c.k].indexOf(v) >= 0;
          return { v: fmtV(c, v), n: cnt[v], ck, tog: () => { let cur = on ? flt[c.k].slice() : all.slice(); const i = cur.indexOf(v); if (i >= 0) cur.splice(i, 1); else cur.push(v); const nf = Object.assign({}, flt); if (cur.length === all.length) delete nf[c.k]; else nf[c.k] = cur; set({ flt: nf }); } };
        });
      }
      const allCk = !on || (all.length > 0 && all.every((v) => flt[c.k].indexOf(v) >= 0));
      return {
        l: c.l, open, thc: 'fh' + (c.r ? ' r' : ''), btn: 'fb' + (on || sorted ? ' on' : '') + (open ? ' op' : ''),
        ic: sorted ? (sd > 0 ? '↑' : '↓') : '',
        toggle: () => this.setState({ pop: open ? null : c.k, pq: '' }), close: () => this.setState({ pop: null, pq: '' }),
        popCls: 'fp' + (c.rt ? ' rt' : ''),
        ascL: c.num ? 'Smallest to largest' : c.date ? 'Oldest to newest' : 'Sort A to Z', descL: c.num ? 'Largest to smallest' : c.date ? 'Newest to oldest' : 'Sort Z to A',
        ascC: sorted && sd > 0 ? 'fpi on' : 'fpi', descC: sorted && sd < 0 ? 'fpi on' : 'fpi',
        asc: () => set({ sk: c.k, sd: 1, pop: null }), desc: () => set({ sk: c.k, sd: -1, pop: null }),
        q: st.pq || '', setQ: (e) => this.setState({ pq: e.target.value }),
        opts, nOpts: String(all.length), noOpts: open && opts.length === 0, allCk,
        selAll: () => { const nf = Object.assign({}, flt); if (allCk) nf[c.k] = []; else delete nf[c.k]; set({ flt: nf }); },
        clear: () => { const nf = Object.assign({}, flt); delete nf[c.k]; set({ flt: nf, pop: null }); }
      };
    });
    const chips = COLS.filter((c) => flt[c.k]).map((c) => { const vs = flt[c.k].map((v) => fmtV(c, v)); return { l: c.l, v: vs.length === 0 ? 'none' : vs.slice(0, 2).join(', ') + (vs.length > 2 ? ' +' + (vs.length - 2) : ''), x: () => { const nf = Object.assign({}, flt); delete nf[c.k]; set({ flt: nf }); } }; });
    if (sc) chips.push({ l: 'Sorted by ' + sc.l, v: sd > 0 ? (sc.num ? 'smallest first' : sc.date ? 'oldest first' : 'A to Z') : (sc.num ? 'largest first' : sc.date ? 'newest first' : 'Z to A'), x: () => set({ sk: null, sd: 1 }) });
    const active = Object.keys(flt).length > 0 || !!sc;
    return { list, sorter, heads, chips, hasChips: chips.length > 0, active, filtered: Object.keys(flt).length > 0, clearAll: () => set({ flt: {}, sk: null, sd: 1, pop: null }) };
  }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const inr = (n, d) => { const s = Number(n).toFixed(d); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return rest + l3 + (f ? '.' + f : ''); };
    const LIVE = this.state.live;
    const DEMO = [{"veh": "GJ-05-BX-4120", "ewb": "3210 8812 4401", "ewbValid": "24-10-2026", "no": "GU22854/26-27", "dt": "23-10-2026", "inv": "", "p": "Rannade Textile", "g": "Rannade Textile", "ord": "SAL11842", "it": "50/48 FDY NLBS", "br": "Wellknown", "lot": "R0484", "q": 619.43, "tx": 94308.22, "amt": 99024, "rc": 0, "od": 0, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": null, "ewb": null, "ewbValid": "", "no": "GU22853/26-27", "dt": "23-10-2026", "inv": "", "p": "Rannade Textile", "g": "Rannade Textile", "ord": "SAL11836", "it": "50/48 FDY NLBS", "br": "Wellknown", "lot": "R0484", "q": 846.6, "tx": 128894.85, "amt": 135340, "rc": 0, "od": 0, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": null, "ewb": null, "ewbValid": "", "no": "GU22851/26-27", "dt": "22-10-2026", "inv": "", "p": "Bhagwati Filaments", "g": "Bhagwati Filaments", "ord": "SAL02722", "it": "50/24 SD CAT", "br": "Reliance", "lot": "356C9S", "q": 1000, "tx": 179600.0, "amt": 188580, "rc": 0, "od": 0, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": null, "ewb": null, "ewbValid": "", "no": "GU22848/26-27", "dt": "22-10-2026", "inv": "", "p": "Shree Rudraksha Poly", "g": "Shree Rudraksha Poly", "ord": "SAL04614", "it": "50/12 BRT", "br": "Durga", "lot": "SIBS1008", "q": 1520.4, "tx": 281486.86, "amt": 295561, "rc": 100000, "od": 0, "e": "IRN pending", "ec": "tag t-orange", "cancel": false}, {"veh": "GJ-05-AV-7731", "ewb": "3210 8809 1177", "ewbValid": "22-10-2026", "no": "GU22845/26-27", "dt": "21-10-2026", "inv": "", "p": "Bansam Fabrics", "g": "Bansam Fabrics", "ord": "SAL03514", "it": "50/48 FDY", "br": "Reliance", "lot": "338C1M", "q": 3500, "tx": 490000, "amt": 514500, "rc": 514500, "od": 0, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": null, "ewb": null, "ewbValid": "", "no": "GU22840/26-27", "dt": "20-10-2026", "inv": "", "p": "Jigita Fab LLP", "g": "Jigita Fab LLP", "ord": "SAL04425", "it": "Muskan Gold", "br": "J.J. Industries", "lot": "MG123", "q": 220.5, "tx": 127890.0, "amt": 134284, "rc": 0, "od": 0, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": "GJ-19-T-2290", "ewb": "3210 8790 5521", "ewbValid": "19-10-2026", "no": "GU22833/26-27", "dt": "18-10-2026", "inv": "", "p": "Ganpati Silk Mill", "g": "Kanvi Corporation", "ord": "SAL05058", "it": "50/24 SD CAT", "br": "Reliance", "lot": "356C9S", "q": 1100, "tx": 166100, "amt": 174405, "rc": 0, "od": 4, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": "GJ-05-CT-1184", "ewb": "3210 8781 0094", "ewbValid": "17-10-2026", "no": "GU22827/26-27", "dt": "16-10-2026", "inv": "", "p": "Sujal Synthetics", "g": "Sujal Synthetics", "ord": "SAL05802", "it": "50/48 FDY", "br": "Reliance", "lot": "338C1M", "q": 980.2, "tx": 130082.34, "amt": 136586, "rc": 136586, "od": 0, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": "MH-04-KL-5521", "ewb": "3210 8770 6638", "ewbValid": "15-10-2026", "no": "GU22819/26-27", "dt": "14-10-2026", "inv": "", "p": "Veer Enterprise", "g": "Binaka Textiles", "ord": "SAL05863", "it": "50/24 SD CAT", "br": "Reliance", "lot": "FX85", "q": 400, "tx": 60400, "amt": 63420, "rc": 0, "od": 8, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": "GJ-05-UU-9902", "ewb": "3210 8761 2205", "ewbValid": "13-10-2026", "no": "GU22811/26-27", "dt": "12-10-2026", "inv": "", "p": "Geeta Fab", "g": "Ved Textiles", "ord": "SAL06932", "it": "110 Vichitra", "br": "Wellknown", "lot": "57460", "q": 650.3, "tx": 98845.6, "amt": 103788, "rc": 103788, "od": 0, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": null, "ewb": "3210 8750 9912", "ewbValid": "11-10-2026", "no": "GU22802/26-27", "dt": "10-10-2026", "inv": "", "p": "Shree Rudraksha Poly", "g": "Shree Rudraksha Poly", "ord": "SAL05773", "it": "50/48 FDY NLBS", "br": "Garden", "lot": "FD002I4", "q": 2400, "tx": 321888.0, "amt": 337982, "rc": 150000, "od": 9, "e": "IRN · EWB", "ec": "tag t-green", "cancel": false}, {"veh": null, "ewb": null, "ewbValid": "", "no": "GU22790/26-27", "dt": "08-10-2026", "inv": "", "p": "Omkar Synthetics", "g": "Omkar Filaments", "ord": "SAL06939", "it": "50/36 Bright", "br": "Sanathan", "lot": "D723A2", "q": 300, "tx": 52875.0, "amt": 55519, "rc": 0, "od": 0, "e": "IRN cancelled", "ec": "tag t-gray", "cancel": true}];
    const dmy = (x) => (x ? String(x).slice(0, 10).split('-').reverse().join('-') : '');
    const nowT = Date.now(); const fmtE = (n) => String(n).replace(/(\d{4})(?=\d)/g, '$1 ');
    const fromLive = (b) => { const cancel = b.status === 'CANCELLED'; const rc = cancel ? 0 : Math.max(0, b.netAmount - (b.tdsAmount || 0) - (b.pending || 0)); const due = b.dueDate ? new Date(String(b.dueDate).slice(0, 10) + 'T00:00:00').getTime() : nowT;
      const od = !cancel && b.pending > 0.5 ? Math.max(0, Math.floor((nowT - due) / 864e5)) : 0;
      const e = cancel ? (b.irn ? 'IRN cancelled' : 'Cancelled') : b.irn && b.ewbNo ? 'IRN · EWB' : b.ewbNo ? 'EWB' : b.irn ? 'IRN' : b.ewbStatus === 'PENDING' ? 'EWB pending' : 'Not needed';
      const ec = cancel ? 'tag t-gray' : b.irn || b.ewbNo ? 'tag t-green' : b.ewbStatus === 'PENDING' ? 'tag t-orange' : 'tag';
      return { id: b.id, ewbStatus: b.ewbStatus, veh: b.ewbStatus === 'GENERATED' ? b.vehicleNo : null, ewb: b.ewbNo && b.ewbStatus !== 'CANCELLED' ? fmtE(b.ewbNo) : null, ewbValid: dmy(b.ewbValidTill), no: b.number, dt: dmy(b.date), inv: b.refNo || '', p: b.partyName, g: b.partyGroupName || b.partyName,
        ord: b.orderNumbers ? b.orderNumbers.split(', ').map((x) => x.replace(/\/\d{2}-\d{2}$/, '')).join(', ') : '—', it: b.itemNames || '—', br: b.brands || '—', lot: b.lots || '—', gr: b.grades || '—', q: b.totalQty, tx: b.taxableAmount, amt: b.netAmount, rc, od, e, ec, cancel }; };
    const D = LIVE ? LIVE.map(fromLive) : DEMO;
    const splitIt = (s) => { const m = String(s).match(/(\d+(?:\/\d+){1,2}|\b\d{2,3}\b)/); if (!m) return { den: '\u2014', itn: s }; const rest = String(s).replace(m[1], '').replace(/\s+/g, ' ').trim(); return { den: m[1], itn: rest || s }; };
    const GRS = ['A+', 'A', '1ST', 'PQ', 'A1', 'F1']; D.forEach((r) => { const z = splitIt(r.it); r.den = z.den; r.itn = z.itn; r.gr = r.gr || GRS[[...String(r.lot)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % GRS.length]; });
    const PC = { Paid: 'tag t-green', Unpaid: 'tag t-gray', Overdue: 'tag t-red', Part: 'tag t-orange', Cancelled: 'tag t-gray' };
    const tab = this.state.tab;
    const st = (r) => r.cancel ? 'Cancelled' : r.rc >= r.amt ? 'Paid' : r.od > 0 ? 'Overdue' : 'Unpaid';
    const gen = this.state.gen;
    const needE = (r) => (LIVE ? !r.cancel && r.ewbStatus === 'PENDING' : !r.cancel && !r.ewb && !gen[r.no]);
    const vis0 = D.filter((r) => tab === 'All' || (tab === 'Ewb' ? needE(r) : st(r) === tab));
    const T0 = LIVE ? [['All', 'All', D.length], ['Ewb', 'E-way bill pending', D.filter(needE).length], ['Unpaid', 'Unpaid', D.filter((r) => st(r) === 'Unpaid').length], ['Overdue', 'Overdue', D.filter((r) => st(r) === 'Overdue').length], ['Paid', 'Paid', D.filter((r) => st(r) === 'Paid').length], ['Cancelled', 'Cancelled', D.filter((r) => r.cancel).length]] : [["All", "All", 1426], ["Ewb", "E-way bill pending", 4], ["Unpaid", "Unpaid", 214], ["Overdue", "Overdue", 38], ["Paid", "Paid", 1162], ["Cancelled", "Cancelled", 12]];
    const COLS = [{ k: 'no', l: 'Bill no.' }, { k: 'dt', l: 'Date', date: 1 }, { k: 'ord', l: 'Order' }, { k: 'p', l: 'Party' }, { k: 'itn', l: 'Item' }, { k: 'den', l: 'Denier' }, { k: 'br', l: 'Brand' }, { k: 'lot', l: 'Lot no.' }, { k: 'gr', l: 'Grade' }, { k: 'q', l: 'Qty kg', num: 1, r: 1, fmt: (v) => inr(v, 3) }, { k: 'amt', l: 'Bill amount ₹', num: 1, r: 1, fmt: (v) => inr(v, 2) }, { k: 'rc', l: 'Received ₹', num: 1, r: 1, rt: 1, fmt: (v) => inr(v, 2) }, { k: 'bal', l: 'Balance ₹', num: 1, r: 1, rt: 1, get: (r) => r.cancel ? 0 : r.amt - r.rc, fmt: (v) => inr(v, 2) }, { k: 'payS', l: 'Payment', rt: 1, get: (r) => { const s = st(r); return s === 'Unpaid' && r.rc > 0 ? 'Part paid' : s; } }, { k: 'ewbS', l: 'E-way bill', rt: 1, get: (r) => r.cancel ? 'Cancelled' : (gen[r.no] || r.ewb) ? ((r.veh && !gen[r.no]) ? 'Generated · Part B done' : 'Generated · Part B pending') : 'Pending' }];
    const cf = this.cf(vis0, COLS); const vis = cf.list;
    const tabTotal0 = (T0.find((t) => t[0] === tab) || [0, 0, 0])[2];
    const tabTotal = cf.filtered || LIVE ? vis.length : tabTotal0;
    const shown = [];
    if (LIVE) shown.push(...vis.slice(0, this.state.loaded));
    else while (vis.length && shown.length < Math.min(this.state.loaded, tabTotal)) { const r = vis[shown.length % vis.length]; const kk = Math.floor(shown.length / vis.length);
      shown.push(kk === 0 ? r : { ...r, ewb: r.cancel ? null : '3210 ' + String(8600 - kk * 41 - shown.length).padStart(4, '0') + ' ' + String(1000 + (shown.length * 389) % 9000), veh: r.veh || null, ewbValid: r.ewbValid || r.dt, no: r.no.replace(/(\d+)(\/)/, (m, a, b) => String(parseInt(a, 10) - kk * 97).padStart(a.length, '0') + b) }); }
    if (cf.sorter) shown.sort(cf.sorter);
    this._more = shown.length < tabTotal;
    const SA = !!this.state.selAll; const EX = this.state.excl || [];
    const isSel = (no) => SA ? EX.indexOf(no) < 0 : this.state.sel.indexOf(no) >= 0;
    const rows = shown.map((r) => { const s = st(r); const bal = r.cancel ? 0 : r.amt - r.rc;
      const ew = gen[r.no] || r.ewb; const on = isSel(r.no);
      const genOne = () => { if (LIVE) return this.genLive([r.id]); const g = { ...this.state.gen }; g[r.no] = '3210 ' + String(8800 + Object.keys(g).length).padStart(4, '0') + ' ' + String(4400 + r.no.length * 13 + Object.keys(g).length * 7); this.setState({ gen: g, toast: 'E-way bill ' + g[r.no] + ' generated for ' + r.no + ' · Part A filed, waiting for transporter to fill Part B' }); };
      return { on, rc: on || this.state.focus === r.no ? 'sel' : '', rowClick: (e) => { if (e && e.target && e.target.closest && e.target.closest('input,button,a,label,select')) return; this.setState({ focus: r.no }); }, open: (e) => { if (e && e.target && e.target.closest && e.target.closest('input,button,a,label,select')) return; try { window.localStorage.setItem('yf-back', JSON.stringify({ href: 'SaleBillList' + sfx + '.dc.html', label: 'Sale bill register' })); } catch (err) {} try { window.localStorage.setItem('yf-open-sb', JSON.stringify({ t: Date.now(), id: r.id, no: r.no, dt: r.dt, p: r.p, ord: r.ord, inv: r.inv || '' })); } catch (err) {} this.go('Dispatch' + sfx + '.dc.html'); }, tog: () => SA ? this.setState({ excl: on ? EX.concat([r.no]) : EX.filter((x) => x !== r.no) }) : this.setState({ sel: on ? this.state.sel.filter((x) => x !== r.no) : this.state.sel.concat([r.no]) }),
        hasE: !!ew && !r.cancel, ewbTag: (r.veh && !gen[r.no]) ? 'tag t-green' : 'tag t-blue', partB: (r.veh && !gen[r.no]) ? 'Part B · ' + r.veh : 'Part B pending · transporter', needE: needE(r), canE: !!r.cancel, ewbNo: ew || '', ewbValid: r.ewbValid || '24-10-2026', genOne,
        no: r.no, dt: r.dt, inv: r.inv || '', itn: r.itn, den: r.den, gr: r.gr, p: r.p, g: r.inv ? 'Inv ' + r.inv : r.g, ord: r.ord, it: r.it, br: r.br, lot: r.lot, q: inr(r.q, 3), tx: inr(r.tx, 2), amt: inr(r.amt, 2), rcv: inr(r.rc, 2), bal: inr(bal, 2),
        pay: s === 'Overdue' ? 'Overdue ' + r.od + ' d' : (s === 'Unpaid' && r.rc > 0 ? 'Part paid' : s), pc: s === 'Unpaid' && r.rc > 0 ? PC.Part : PC[s], e: r.e, ec: r.ec }; });
    const sum = (k) => vis.reduce((a, r) => a + (r.cancel && k !== 'q' ? 0 : r[k]), 0);
    const T = T0 || [["All", "All", 1426], ["Ewb", "E-way bill pending", 4], ["Unpaid", "Unpaid", 214], ["Overdue", "Overdue", 38], ["Paid", "Paid", 1162], ["Cancelled", "Cancelled", 12]];
    const selRows = SA ? vis.filter((r) => EX.indexOf(r.no) < 0) : shown.filter((r) => this.state.sel.indexOf(r.no) >= 0); const selNeed = selRows.filter(needE);
    const allOn = SA ? EX.length === 0 : (shown.length > 0 && shown.every((r) => this.state.sel.indexOf(r.no) >= 0));
    const TC = { Ewb: '#F97316', All: '#8F8F8F', Unpaid: '#3B82F6', Overdue: '#EF4444', Paid: '#22C55E', Cancelled: '#A855F7' };
    return {
      onScroll: (e) => { const el = e.currentTarget || e.target; if (!el || this._ld || !this._more) return; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 160) { this._ld = true; setTimeout(() => { this._ld = false; this.setState({ loaded: this.state.loaded + 20 }); }, 400); } },
      cf, sfxE: sfx, theme, rows, allOn, hasSel: SA ? tabTotal - EX.length > 0 : selRows.length > 0, selCount: SA ? inr(tabTotal - EX.length, 0) + ' (all)' : selRows.length,
      selNote: selNeed.length ? selNeed.length + ' without e-way bill · Part A goes to the portal now, the transporter fills Part B' : 'All selected bills already have e-way bills',
      toggleAll: () => this.setState(allOn || SA ? { selAll: false, excl: [], sel: [] } : { selAll: true, excl: [], sel: [] }), clearSel: () => this.setState({ sel: [], selAll: false, excl: [] }),
      genSel: () => { if (LIVE) return this.genLive(selNeed.map((r) => r.id)); const g = { ...this.state.gen }; selNeed.forEach((r, i) => { g[r.no] = '3210 ' + String(8800 + Object.keys(g).length).padStart(4, '0') + ' ' + String(4410 + i * 17); }); this.setState({ gen: g, sel: [], selAll: false, excl: [], toast: selNeed.length + ' e-way bills generated · Part A filed, transporter assigned · Part B will show here once the transporter fills it' }); },
      hasToast: !!this.state.toast, toast: this.state.toast, hideToast: () => this.setState({ toast: '' }),
      tabs: T.map(([k, l, n]) => ({ l, n: inr(n, 0), c: '--c: ' + TC[k], cls: k === tab ? 'tab on' : 'tab', pick: () => this.setState({ tab: k, loaded: 20, sel: [], selAll: false, excl: [] }) })),
      tot: (() => { const F = LIVE ? 1 : vis.length ? tabTotal / vis.length : 0; return { n: inr(tabTotal, 0), q: inr(sum('q') * F, 3), amt: inr(sum('amt') * F, 2), rc: inr(sum('rc') * F, 2), bal: inr((sum('amt') - sum('rc')) * F, 2) }; })(),
      moreLeft: shown.length < tabTotal, allLoaded: tabTotal > 0 && shown.length >= tabTotal, loadedLabel: shown.length + ' of ' + inr(tabTotal, 0) + ' loaded',
      countLabel: vis.length + ' of ' + (T.find((t) => t[0] === tab) || [0, 0, 0])[2] + ' bills',
      ewbPend: LIVE ? D.filter(needE).length : 4,
      billHref: 'Dispatch' + sfx + '.dc.html', newHref: 'SaleBillSelect' + sfx + '.dc.html'
    };
  }
}

/* ----- view ----- */
class SaleBillListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""} blx`}>
        <div className="sbw">
          <Sidebar active="disp" />
        </div>
        <div className="main" style={{"height":"auto"}}>
          <header className="hdr">
            <div className="bc">
              <span className="m">
                Sale bills
              </span>
              <span className="m">
                /
              </span>
              <span>
                Register
              </span>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
              Print
            </button>
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Excel
            </button>
            {' '}
            <DcLink className="btn" href={`EwayBills${v.sfxE ?? ""}.dc.html`}>
              {"E-way bills "}
              <span className="tag t-orange" style={{"marginLeft":"2px"}}>
                {v.ewbPend}{" pending"}
              </span>
            </DcLink>
            {' '}
            <DcLink className="btn pr" href={v.newHref}>
              + New bill
            </DcLink>
          </header>
          <div className="tabs" role="tablist" aria-label="Payment status">
            {(v.tabs || []).map((t, $index) => (
              <Fragment key={$index}>
                <button className={t?.cls} type="button" role="tab" onClick={t?.pick}>
                  <span className="dot" style={sx(t?.c)}>
                    {t?.l}
                  </span>
                  <span className="n">
                    {t?.n}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" defaultValue="01-04-2026" aria-label="From date" style={{"maxWidth":"120px"}} />
            <span className="muted">
              to
            </span>
            <input className="inp" type="text" defaultValue="31-03-2027" aria-label="To date" style={{"maxWidth":"120px"}} />
            <div style={{"flex":"1"}} />
          </div>
          {v.hasSel ? (
            <>
              <div className="bulk" role="toolbar" aria-label="Bulk actions">
                <b style={{"fontWeight":"600"}}>
                  {v.selCount}{" selected"}
                </b>
                <span className="muted" style={{"flex":"1"}}>
                  {v.selNote}
                </span>
                <button className="btn sm pr" type="button" onClick={v.genSel}>
                  Generate e-way bills · Part A
                </button>
                <button className="btn sm gh" type="button" onClick={v.clearSel}>
                  Clear
                </button>
              </div>
            </>
          ) : null}
          {' '}
          {v.hasToast ? (
            <>
              <div className="okbar" role="status">
                <span>
                  ✓
                </span>
                <span>
                  {v.toast}
                </span>
                <button type="button" onClick={v.hideToast} aria-label="Dismiss">
                  ✕
                </button>
              </div>
            </>
          ) : null}
          {' '}
          {v.cf?.hasChips ? (
            <>
              <div className="fchips" role="status">
                <span className="lbl">
                  Showing
                </span>
                {(v.cf?.chips || []).map((c, $index) => (
                  <Fragment key={$index}>
                    <span className="fchip">
                      {c?.l}{": "}
                      <b>
                        {c?.v}
                      </b>
                      <button type="button" onClick={c?.x} aria-label="Remove filter">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </span>
                  </Fragment>
                ))}
                <button className="fclr" type="button" onClick={v.cf?.clearAll}>
                  Clear all
                </button>
              </div>
            </>
          ) : null}
          <div className="reg" onScroll={v.onScroll}>
            <table className="cft">
              <thead>
                <tr>
                  <th style={{"width":"32px"}}>
                    <input className="cbx" type="checkbox" aria-label="Select all loaded bills" checked={v.allOn} onChange={v.toggleAll} />
                  </th>
                  {(v.cf?.heads || []).map((h, $index) => (
                    <Fragment key={$index}>
                      <th className={h?.thc}>
                        <button className={h?.btn} type="button" onClick={h?.toggle} aria-haspopup="dialog" aria-expanded={h?.open} title="Sort and filter">
                          {h?.l}
                          <span className="si">
                            {h?.ic}
                          </span>
                          <svg className="fi" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 5h18l-7 8v6l-4 2v-8z" />
                          </svg>
                        </button>
                        {h?.open ? (
                          <>
                            <div className="fpbk" onClick={h?.close} />
                            <div className={h?.popCls} role="dialog" aria-label="Sort and filter">
                              <button className={h?.ascC} type="button" onClick={h?.asc}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M12 19V5" />
                                  <path d="m5 12 7-7 7 7" />
                                </svg>
                                {h?.ascL}
                              </button>
                              <button className={h?.descC} type="button" onClick={h?.desc}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M12 5v14" />
                                  <path d="m19 12-7 7-7-7" />
                                </svg>
                                {h?.descL}
                              </button>
                              <div className="fpsep" />
                              <div className="fpt">
                                {"Filter "}{h?.l}
                              </div>
                              <input className="fps" type="search" value={h?.q} onChange={h?.setQ} placeholder="Search values" aria-label="Search values" autoFocus={true} />
                              <label className="fpo all">
                                <input type="checkbox" checked={h?.allCk} onChange={h?.selAll} />
                                <span className="v">
                                  Select all
                                </span>
                                <span className="n">
                                  {h?.nOpts}
                                </span>
                              </label>
                              <div className="fpl">
                                {(h?.opts || []).map((o, $index) => (
                                  <Fragment key={$index}>
                                    <label className="fpo">
                                      <input type="checkbox" checked={o?.ck} onChange={o?.tog} />
                                      <span className="v">
                                        {o?.v}
                                      </span>
                                      <span className="n">
                                        {o?.n}
                                      </span>
                                    </label>
                                  </Fragment>
                                ))}
                                {h?.noOpts ? (
                                  <>
                                    <div className="fpe">
                                      No matching values
                                    </div>
                                  </>
                                ) : null}
                              </div>
                              <div className="fpf">
                                <button className="btn sm gh" type="button" onClick={h?.clear}>
                                  Clear filter
                                </button>
                                <button className="btn sm pr" type="button" onClick={h?.close}>
                                  Done
                                </button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr className={x?.rc} onClick={x?.rowClick} onDoubleClick={x?.open} title="Click to select · double-click to open">
                      <td>
                        <input className="cbx" type="checkbox" aria-label="Select bill" checked={x?.on} onChange={x?.tog} />
                      </td>
                      <td>
                        <DcLink className="link" href={v.billHref}>
                          {x?.no}
                        </DcLink>
                      </td>
                      <td className="t2">
                        {x?.dt}
                      </td>
                      <td className="t2">
                        {x?.ord}
                      </td>
                      <td>
                        <div>
                          {x?.p}
                        </div>
                      </td>
                      <td className="it">
                        {x?.itn}
                      </td>
                      <td className="den">
                        {x?.den}
                      </td>
                      <td className="t2">
                        {x?.br}
                      </td>
                      <td className="t2">
                        {x?.lot}
                      </td>
                      <td>
                        {x?.gr}
                      </td>
                      <td className="r">
                        {x?.q}
                      </td>
                      <td className="r" style={{"fontWeight":"500"}}>
                        {x?.amt}
                      </td>
                      <td className="r t2">
                        {x?.rcv}
                      </td>
                      <td className="r" style={{"fontWeight":"500"}}>
                        {x?.bal}
                      </td>
                      <td>
                        <span className={x?.pc}>
                          {x?.pay}
                        </span>
                      </td>
                      <td>
                        {x?.hasE ? (
                          <>
                            <span className={x?.ewbTag}>
                              {"EWB "}{x?.ewbNo}
                            </span>
                            <div className="sub">
                              {x?.partB}
                            </div>
                          </>
                        ) : null}
                        {x?.needE ? (
                          <>
                            <span className="tag t-orange">
                              EWB pending
                            </span>
                            <button className="lnk" type="button" onClick={x?.genOne}>
                              Generate
                            </button>
                          </>
                        ) : null}
                        {x?.canE ? (
                          <>
                            <span className="tag t-gray">
                              Cancelled
                            </span>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  </Fragment>
                ))}
                {v.moreLeft ? (
                  <>
                    <tr className="more">
                      <td colSpan="15">
                        <span className="spin" aria-hidden="true" />
                        {"Loading more bills as you scroll · "}{v.loadedLabel}
                      </td>
                    </tr>
                  </>
                ) : null}
                {v.allLoaded ? (
                  <>
                    <tr className="more">
                      <td colSpan="15">
                        {"All "}{v.tot?.n}{" bills shown"}
                      </td>
                    </tr>
                  </>
                ) : null}
                <tr className="fillr" aria-hidden="true">
                  <td colSpan="15" />
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td>
                    {v.tot?.n}{" bills"}
                  </td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td className="r">
                    {v.tot?.q}
                  </td>
                  <td className="r">
                    {v.tot?.amt}
                  </td>
                  <td className="r">
                    {v.tot?.rc}
                  </td>
                  <td className="r">
                    {v.tot?.bal}
                  </td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="disp" />
        </div>
      </div>
      </>
    );
  }
}

export default function SaleBillList(props) {
  const theme = useTheme();
  return <SaleBillListView {...props} theme={theme} />;
}
