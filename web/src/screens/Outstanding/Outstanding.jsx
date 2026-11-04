/* eslint-disable */
// Outstanding — converted 1:1 from the YarnFlow design (Outstanding.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Outstanding.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { mode: 'r', gb: 'party', fq: '', fc: '', fb: '', fa: '', basis: 'bill', vw: 'p', sel: [], lim: 50, drill: null }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  componentDidMount() { let gb = null; try { gb = window.localStorage.getItem('yf-out-gb'); if (gb) window.localStorage.removeItem('yf-out-gb'); } catch (e) {} if (gb) this.setState({ gb }); this.load(); }
  async load(patch) {
    const st = { ...this.state, ...(patch || {}) }; if (patch) this.setState(patch);
    const api = this.api(); if (!api) return;
    const q = { side: st.mode === 'r' ? 'receivable' : 'payable', buckets: '30,60,90', basis: st.basis };
    if (st.fa === 'od') q.overdueOnly = '1'; else if (st.fa) q.minDays = st.fa;
    try { const res = await api.get('/reports/outstanding', q); this.setState({ res }); } catch (e) { this.setState({ err: api.message(e) }); }
  }
  renderVals() {
    const st = this.state; const r = st.mode === 'r'; const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const mk = (i, n, c, t, a, b, d, e, lp) => ({ i, n, c, t, a, b, d, e, lp, dc: d !== '—' ? 'hot' : 'muted', ec: e !== '—' ? 'hot' : 'muted' });
    const stc = (c) => '--c: ' + c;
    const GB = [['party', 'Party-wise'], ['group', 'Account group'], ['partyGroup', 'Party group'], ['salesPerson', 'Sales person'], ['collectionPerson', 'Collection person'], ['broker', 'Broker'], ['city', 'City'], ['area', 'Area'], ['state', 'State']];
    const common = { theme: this.props.theme ?? 'dark', rc: r ? 'on' : '', py: r ? '' : 'on', verb: r ? 'receipt' : 'payment', bulk: r ? 'Send reminders' : 'Plan payments',
      gbOpts: GB.map(([v, l]) => ({ v, l })), gb: st.gb, setGb: (e) => this.setState({ gb: e.target.value, drill: null, sel: [] }), fq: st.fq, setFq: (e) => this.setState({ fq: e.target.value }),
      fc: st.fc, setFc: (e) => this.setState({ fc: e.target.value }), fb: st.fb, setFb: (e) => this.setState({ fb: e.target.value }), fa: st.fa, setFa: (e) => this.load({ fa: e.target.value }),
      basis: st.basis, setBasis: (e) => this.load({ basis: e.target.value }), vwP: st.vw === 'p' ? 'on' : '', vwB: st.vw === 'b' ? 'on' : '', setVwP: () => this.setState({ vw: 'p' }), setVwB: () => this.setState({ vw: 'b' }) };
    const res = st.res;
    if (!res) {
      const recv = [mk('K', 'Krishna Textiles', 'Surat', '4,82,350', '1,40,700', '31,400', '3,10,250', '—', '06 Oct'), mk('S', 'Shiv Shakti Fabrics', 'Sachin GIDC', '7,84,200', '4,10,000', '2,44,375', '1,29,825', '—', '15 Oct'), mk('O', 'Om Sai Weaving', 'Pandesara', '6,12,560', '3,98,160', '2,14,400', '—', '—', '18 Oct'), mk('L', 'Laxmi Creation', 'Bhiwandi', '5,46,900', '—', '2,10,000', '1,86,900', '1,50,000', '22 Aug'), mk('N', 'Navrang Prints', 'Ichalkaranji', '4,02,800', '2,04,800', '1,98,000', '—', '—', '09 Oct'), mk('R', 'Radhe Textiles', 'Kadodara', '3,15,000', '3,15,000', '—', '—', '—', '20 Oct'), mk('A', 'Ambika Silk Mills', 'Surat', '2,08,400', '—', '—', '—', '2,08,400', '30 Jun'), mk('J', 'Jay Bhavani Fab', 'Kamrej', '3,26,400', '3,26,400', '—', '—', '—', '12 Oct')];
      const pay = [mk('R', 'Reliance Industries', 'Silvassa', '9,75,623', '7,98,132', '1,77,491', '—', '—', '02 Oct'), mk('S', 'Sanathan Textiles', 'Silvassa', '8,40,000', '8,40,000', '—', '—', '—', '24 Sep'), mk('I', 'Indorama Synthetics', 'Butibori', '6,20,500', '3,20,500', '3,00,000', '—', '—', '29 Sep'), mk('C', 'Century Rayon', 'Kalyan', '4,46,250', '4,46,250', '—', '—', '—', '11 Oct'), mk('F', 'Filatex India', 'Dahej', '3,12,000', '—', '3,12,000', '—', '—', '04 Sep'), mk('J', 'JCT Fibres', 'Phagwara', '2,10,400', '2,10,400', '—', '—', '—', '16 Oct')];
      const cards = r ? [{ l: 'Total receivable', v: '₹ 62.4 L', st: stc('#3B82F6') }, { l: '0–30 days', v: '₹ 29.8 L', st: stc('#8F8F8F') }, { l: '31–60 days', v: '₹ 17.8 L', st: stc('#F97316') }, { l: '61–90 days', v: '₹ 9.7 L', st: stc('#EF4444') }, { l: '90+ days', v: '₹ 5.1 L', st: stc('#B91C1C') }]
        : [{ l: 'Total payable', v: '₹ 38.9 L', st: stc('#3B82F6') }, { l: 'Due this week', v: '₹ 9.7 L', st: stc('#F97316') }, { l: 'Not yet due', v: '₹ 26.1 L', st: stc('#8F8F8F') }, { l: 'Overdue', v: '₹ 3.1 L', st: stc('#EF4444') }, { l: 'Advances paid', v: '₹ 3.0 L', st: stc('#A855F7') }];
      return { ...common, setR: () => this.setState({ mode: 'r' }), setP: () => this.setState({ mode: 'p' }), rows: (r ? recv : pay).map((x) => ({ ...x, on: false, tog: () => {}, open: () => {}, act: () => {}, al: r ? 'Remind' : 'Pay' })), cards,
        h1: 'Party', h2: 'City', h9: 'Last ' + (r ? 'receipt' : 'payment'), back: false, backL: '', goBack: () => {}, none: false, allOn: false, togAll: () => {}, exportCsv: () => {}, bulkGo: () => {},
        cities: ['Surat', 'Bhiwandi', 'Ichalkaranji'], brokers: ['Mahesh Shah'], ft: { l: '', t: '', a: '', b: '', d: '', e: '' }, more: true, loadMore: () => {},
        footer: r ? '8 of 38 parties · ₹ 62.4 L receivable' : '6 of 14 mills · ₹ 38.9 L payable' };
    }
    const inr = (n) => { const v = Math.round(Number(n) || 0); const s = String(Math.abs(v)); let l3 = s.slice(-3), rest = s.slice(0, -3); if (rest) l3 = ',' + l3; return (v < 0 ? '-' : '') + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + l3; };
    const L = (n) => { const v = Number(n) || 0; return Math.abs(v) >= 1e5 ? '₹ ' + (v / 1e5).toFixed(1) + ' L' : '₹ ' + inr(v); };
    const dash = (v) => (Math.abs(v) > 0.5 ? inr(v) : '—');
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = (x) => { if (!x) return '—'; const p = String(x).slice(0, 10).split('-'); return p[2] + ' ' + mon[Number(p[1]) - 1]; };
    const KEY = { party: 'partyName', group: 'groupName', partyGroup: 'partyGroupName', salesPerson: 'salesPersonName', collectionPerson: 'collectionPersonName', broker: 'brokerName', city: 'city', area: 'area', state: 'state' };
    const fq = st.fq.trim().toLowerCase();
    let parties = res.parties.filter((p) => (!fq || p.partyName.toLowerCase().indexOf(fq) >= 0) && (!st.fc || p.city === st.fc) && (!st.fb || p.brokerName === st.fb));
    if (st.drill) parties = parties.filter((p) => String(p[KEY[st.gb]] ?? '(not set)') === st.drill);
    const pid = new Set(parties.map((p) => p.partyId));
    const sel = st.sel;
    const remind = (p) => { const txt = (r ? 'Dear ' + p.partyName + ', ₹ ' + inr(p.billsPending) + ' is outstanding' + (p.overdue > 0 ? ' (₹ ' + inr(p.overdue) + ' overdue)' : '') + '. Kindly arrange payment. — ' + ((this.api().company || {}).name || '') : ''); const m = String(p.mobile || '').replace(/\D/g, '').slice(-10); try { window.open('https://wa.me/' + (m ? '91' + m : '') + '?text=' + encodeURIComponent(txt), '_blank'); } catch (e) {} };
    const pay = (p) => { try { window.localStorage.setItem('yf-pay-kind', 'p'); window.localStorage.setItem('yf-pay-party', JSON.stringify({ id: p.partyId })); } catch (e) {} this.go('Payments' + sfx + '.dc.html'); };
    const ledger = (id) => (e) => { try { window.localStorage.setItem('yf-ledger', JSON.stringify({ id })); } catch (er) {} };
    let rows, h1 = 'Party', h2 = 'City', h9 = 'Last ' + (r ? 'receipt' : 'payment'), ft, total, count;
    if (st.vw === 'b') {
      const bills = res.bills.filter((b) => pid.has(b.partyId));
      const bk = (b) => { const a = [0, 0, 0, 0]; a[b.bucket] = b.pending; return a; };
      rows = bills.slice(0, st.lim).map((b) => { const a = bk(b); const on = sel.indexOf('b' + b.id) >= 0; return { i: b.partyName.charAt(0), n: b.number + ' · ' + b.partyName, c: String(b.date).slice(0, 10).split('-').reverse().join('-'), t: inr(b.pending), a: dash(a[0]), b: dash(a[1]), d: dash(a[2]), e: dash(a[3]), dc: a[2] ? 'hot' : 'muted', ec: a[3] ? 'hot' : 'muted', lp: b.overdueDays > 0 ? b.overdueDays + ' d overdue' : 'Not due',
        on, tog: () => this.setState({ sel: on ? sel.filter((x) => x !== 'b' + b.id) : sel.concat(['b' + b.id]) }), open: ledger(b.partyId), act: () => (r ? remind(res.parties.find((p) => p.partyId === b.partyId) || { partyName: b.partyName, billsPending: b.pending, overdue: 0 }) : pay(b)), al: r ? 'Remind' : 'Pay' }; });
      h1 = 'Bill · party'; h2 = 'Bill date'; h9 = 'Status';
      const tb = [0, 0, 0, 0]; bills.forEach((b) => { tb[b.bucket] += b.pending; }); total = tb.reduce((x, y) => x + y, 0); count = bills.length;
      ft = { l: inr(bills.length) + ' bills', t: inr(total), a: inr(tb[0]), b: inr(tb[1]), d: inr(tb[2]), e: inr(tb[3]) };
      common.footerX = rows.length + ' of ' + bills.length + ' bills · ' + L(total) + (r ? ' receivable' : ' payable');
    } else if (st.gb !== 'party' && !st.drill) {
      const gm = new Map(); parties.forEach((p) => { const k = String(p[KEY[st.gb]] ?? '(not set)'); const g = gm.get(k) || { k, n: 0, net: 0, bills: 0, b: [0, 0, 0, 0], od: 0 }; g.n += 1; g.net += p.net; g.b = g.b.map((x, i) => x + (p.buckets[i] || 0)); g.od += p.overdue; gm.set(k, g); });
      const gs = [...gm.values()].sort((a, b) => b.net - a.net);
      rows = gs.slice(0, st.lim).map((g) => { const on = sel.indexOf('g' + g.k) >= 0; return { i: g.k.charAt(0), n: g.k, c: g.n + (g.n === 1 ? ' party' : ' parties'), t: inr(g.net), a: dash(g.b[0]), b: dash(g.b[1]), d: dash(g.b[2]), e: dash(g.b[3]), dc: g.b[2] ? 'hot' : 'muted', ec: g.b[3] ? 'hot' : 'muted', lp: g.od > 0 ? '₹ ' + inr(g.od) + ' overdue' : 'Nothing overdue',
        on, tog: () => this.setState({ sel: on ? sel.filter((x) => x !== 'g' + g.k) : sel.concat(['g' + g.k]) }), open: (e) => { if (e && e.preventDefault) e.preventDefault(); this.setState({ drill: g.k, sel: [] }); }, act: () => this.setState({ drill: g.k, sel: [] }), al: 'Parties' }; });
      h1 = (GB.find((x) => x[0] === st.gb) || [0, ''])[1]; h2 = 'Parties'; h9 = 'Overdue';
      total = gs.reduce((a, g) => a + g.net, 0); count = gs.length;
      const tb = [0, 1, 2, 3].map((i) => gs.reduce((a, g) => a + g.b[i], 0));
      ft = { l: gs.length + ' groups', t: inr(total), a: inr(tb[0]), b: inr(tb[1]), d: inr(tb[2]), e: inr(tb[3]) };
      common.footerX = rows.length + ' of ' + gs.length + ' · ' + L(total) + (r ? ' receivable' : ' payable');
    } else {
      rows = parties.slice(0, st.lim).map((p) => { const on = sel.indexOf('p' + p.partyId) >= 0; const b = p.buckets;
        return { i: p.partyName.replace(/^(Shree|Shri|The)\s+/i, '').charAt(0), n: p.partyName + (p.overLimit ? ' · over limit' : ''), c: (p.city || '—') + (Math.abs(p.onAccount) > 0.5 ? ' · ' + (p.onAccount < 0 ? 'advance ' : 'on a/c ') + L(Math.abs(p.onAccount)) : ''), t: inr(p.net), a: dash(b[0]), b: dash(b[1]), d: dash(b[2]), e: dash(b[3]), dc: b[2] ? 'hot' : 'muted', ec: b[3] ? 'hot' : 'muted', lp: dd(p.lastPayment),
          on, tog: () => this.setState({ sel: on ? sel.filter((x) => x !== 'p' + p.partyId) : sel.concat(['p' + p.partyId]) }), open: ledger(p.partyId), act: () => (r ? remind(p) : pay(p)), al: r ? 'Remind' : 'Pay' }; });
      total = parties.reduce((a, p) => a + p.net, 0); count = parties.length;
      const tb = [0, 1, 2, 3].map((i) => parties.reduce((a, p) => a + (p.buckets[i] || 0), 0));
      ft = { l: parties.length + ' parties', t: inr(total), a: inr(tb[0]), b: inr(tb[1]), d: inr(tb[2]), e: inr(tb[3]) };
      common.footerX = rows.length + ' of ' + parties.length + (r ? ' parties' : ' mills') + ' · ' + L(total) + (r ? ' receivable' : ' payable');
    }
    const T = res.totals; const B = T.buckets || [0, 0, 0, 0];
    const notDue = res.parties.reduce((a, p) => a + p.billsPending - p.overdue, 0);
    const adv = res.parties.reduce((a, p) => a + (p.onAccount < 0 ? -p.onAccount : 0), 0);
    const cards = r ? [{ l: 'Total receivable', v: L(T.net), st: stc('#3B82F6') }, { l: '0–30 days', v: L(B[0]), st: stc('#8F8F8F') }, { l: '31–60 days', v: L(B[1]), st: stc('#F97316') }, { l: '61–90 days', v: L(B[2]), st: stc('#EF4444') }, { l: '90+ days', v: L(B[3]), st: stc('#B91C1C') }]
      : [{ l: 'Total payable', v: L(T.net), st: stc('#3B82F6') }, { l: '0–30 days', v: L(B[0]), st: stc('#F97316') }, { l: 'Not yet due', v: L(notDue), st: stc('#8F8F8F') }, { l: 'Overdue', v: L(T.overdue), st: stc('#EF4444') }, { l: 'Advances paid', v: L(adv), st: stc('#A855F7') }];
    const selParties = res.parties.filter((p) => sel.indexOf('p' + p.partyId) >= 0);
    const csv = () => { const head = [h1, h2, 'Total', '0-30', '31-60', '61-90', '90+', h9]; const lines = [head].concat(rows.map((x) => [x.n, x.c, x.t, x.a, x.b, x.d, x.e, x.lp])); return lines.map((a) => a.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n'); };
    return { ...common, cards, rows, h1, h2, h9, ft, none: rows.length === 0,
      setR: () => this.load({ mode: 'r', sel: [], drill: null }), setP: () => this.load({ mode: 'p', sel: [], drill: null }),
      back: !!st.drill, backL: 'All ' + (GB.find((x) => x[0] === st.gb) || [0, ''])[1].toLowerCase() + ' · ' + (st.drill || ''), goBack: () => this.setState({ drill: null, sel: [] }),
      allOn: rows.length > 0 && rows.every((x) => x.on), togAll: () => { const all = rows.every((x) => x.on); rows.forEach(() => {}); this.setState({ sel: all ? [] : (st.vw === 'b' ? res.bills.filter((b) => pid.has(b.partyId)).slice(0, st.lim).map((b) => 'b' + b.id) : st.gb !== 'party' && !st.drill ? [] : parties.slice(0, st.lim).map((p) => 'p' + p.partyId)) }); },
      cities: [...new Set(res.parties.map((p) => p.city).filter(Boolean))].sort(), brokers: [...new Set(res.parties.map((p) => p.brokerName).filter(Boolean))].sort(),
      exportCsv: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'Outstanding ' + (r ? 'receivable' : 'payable') + '.csv'; a.click(); } catch (e) {} },
      bulkGo: () => { if (!r) { this.go('Payments' + sfx + '.dc.html'); try { window.localStorage.setItem('yf-pay-kind', 'p'); } catch (e) {} return; } const list = selParties.length ? selParties : res.parties.filter((p) => p.overdue > 0); if (!list.length) return; if (list.length > 1 && !window.confirm('Open WhatsApp reminders for ' + list.length + ' parties?')) return; list.slice(0, 15).forEach(remind); },
      more: rows.length < count, loadMore: () => this.setState({ lim: st.lim + 50 }), footer: common.footerX };
  }
}

/* ----- view ----- */
class OutstandingView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="out" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                Outstanding
              </span>
            </div>
            <div className="seg" role="group" aria-label="Receivable or payable">
              <button type="button" className={v.rc} onClick={v.setR}>
                Receivable
              </button>
              <button type="button" className={v.py} onClick={v.setP}>
                Payable
              </button>
            </div>
            <button className="btn" type="button" onClick={v.exportCsv}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Export
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.bulkGo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              {v.bulk}
            </button>
          </header>
          <div className="cards">
            {(v.cards || []).map((c, $index) => (
              <Fragment key={$index}>
                <div className="cardx">
                  <span className="dot" style={sx(c?.st)}>
                    <span className="muted">
                      {c?.l}
                    </span>
                  </span>
                  <b>
                    {c?.v}
                  </b>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="fbar">
            <input className="inp" type="text" placeholder="Party" aria-label="Party" value={v.fq} onChange={v.setFq} />
            {' '}
            <select className="inp" aria-label="Group by" value={v.gb} onChange={v.setGb}>
              {(v.gbOpts || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option value={o?.v}>
                    {o?.l}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <select className="inp" aria-label="City" value={v.fc} onChange={v.setFc}>
              <option value="">
                City
              </option>
              {(v.cities || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option>
                    {o}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <select className="inp" aria-label="Broker" value={v.fb} onChange={v.setFb}>
              <option value="">
                Broker
              </option>
              {(v.brokers || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option>
                    {o}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <select className="inp" aria-label="Age" value={v.fa} onChange={v.setFa}>
              <option value="">
                Any age
              </option>
              <option value="od">
                Overdue only
              </option>
              <option value="30">
                Above 30 days
              </option>
              <option value="60">
                Above 60 days
              </option>
              <option value="90">
                Above 90 days
              </option>
            </select>
            <div style={{"flex":"1"}} />
            <select className="inp" aria-label="Ageing basis" value={v.basis} onChange={v.setBasis}>
              <option value="bill">
                Age from bill date
              </option>
              <option value="due">
                Age from due date
              </option>
            </select>
            <div className="seg" role="group" aria-label="View">
              <button type="button" className={v.vwP} onClick={v.setVwP}>
                Summary
              </button>
              <button type="button" className={v.vwB} onClick={v.setVwB}>
                Bill-wise
              </button>
            </div>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th style={{"width":"36px"}}>
                    <input className="cb" type="checkbox" aria-label="Select all" checked={v.allOn} onChange={v.togAll} />
                  </th>
                  <th>
                    {v.h1}
                  </th>
                  <th>
                    {v.h2}
                  </th>
                  <th className="r">
                    Total
                  </th>
                  <th className="r">
                    0–30
                  </th>
                  <th className="r">
                    31–60
                  </th>
                  <th className="r">
                    61–90
                  </th>
                  <th className="r">
                    90+
                  </th>
                  <th>
                    {v.h9}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {v.back ? (
                  <>
                    <tr>
                      <td />
                      <td colSpan="9">
                        <button className="btn sm gh" type="button" onClick={v.goBack}>
                          {"← "}{v.backL}
                        </button>
                      </td>
                    </tr>
                  </>
                ) : null}
                {(v.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <tr>
                      <td>
                        <input className="cb" type="checkbox" aria-label="Select party" checked={x?.on} onChange={x?.tog} />
                      </td>
                      <td>
                        <DcLink className="cell" href="Ledger.dc.html" onClick={x?.open}>
                          <span className="lg">
                            {x?.i}
                          </span>
                          {x?.n}
                        </DcLink>
                      </td>
                      <td className="t2">
                        {x?.c}
                      </td>
                      <td className="r" style={{"fontWeight":"500"}}>
                        {x?.t}
                      </td>
                      <td className="r t2">
                        {x?.a}
                      </td>
                      <td className="r t2">
                        {x?.b}
                      </td>
                      <td className="r">
                        <span className={x?.dc}>
                          {x?.d}
                        </span>
                      </td>
                      <td className="r">
                        <span className={x?.ec}>
                          {x?.e}
                        </span>
                      </td>
                      <td className="muted">
                        {x?.lp}
                      </td>
                      <td className="r">
                        <button className="btn sm" type="button" onClick={x?.act}>
                          {x?.al}
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                ))}
                {v.none ? (
                  <>
                    <tr>
                      <td colSpan="10" className="muted" style={{"textAlign":"center","padding":"28px"}}>
                        Nothing outstanding for these filters
                      </td>
                    </tr>
                  </>
                ) : null}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td>
                    {v.ft?.l}
                  </td>
                  <td />
                  <td className="r">
                    {v.ft?.t}
                  </td>
                  <td className="r">
                    {v.ft?.a}
                  </td>
                  <td className="r">
                    {v.ft?.b}
                  </td>
                  <td className="r">
                    {v.ft?.d}
                  </td>
                  <td className="r">
                    {v.ft?.e}
                  </td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="foot">
            <span className="muted">
              {v.footer}
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
        <div className="aiw">
          <Assistant page="out" />
        </div>
      </div>
      </>
    );
  }
}

export default function Outstanding(props) {
  const theme = useTheme();
  return <OutstandingView {...props} theme={theme} />;
}
