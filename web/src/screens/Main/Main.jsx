/* eslint-disable */
// Main — converted 1:1 from the YarnFlow design (Main.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Main.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { menu: null, per: 'today', cq: '', ask: '' }; }
  /* live data layer: present in the app, absent on the design canvas (sample data is used there) */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  go(h) { try { const a = document.createElement('a'); a.href = h; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
  ymd(d) { const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  range(per) {
    const api = this.api(); const fy = (api && api.fy) || { startDate: '2026-04-01', endDate: '2027-03-31' };
    const t = new Date(); let to = this.ymd(t); if (to > fy.endDate) to = fy.endDate;
    if (per === 'week') { const d = new Date(t); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [this.ymd(d), to]; }
    if (per === 'month') return [to.slice(0, 8) + '01', to];
    if (per === 'fy') return [fy.startDate, to];
    return [to, to];
  }
  componentDidMount() { if (this.api()) { this.load('today'); this.lookups(); } }
  async lookups() { try { this.setState({ lk: await this.api().lookups() }); } catch (e) {} }
  async load(per, from, to) {
    const api = this.api(); if (!api) return;
    const [f, t] = from ? [from, to] : this.range(per);
    this.setState({ per, from: f, to: t });
    try { this.setState({ d: await api.get('/reports/dashboard', { from: f, to: t }), at: Date.now() }); } catch (e) {}
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const L = (f) => f + sfx + '.dc.html';
    const menu = st.menu ?? (this.props.showMenu ?? false);
    const C = { b: '--c: #3B82F6', o: '--c: #F97316', g: '--c: #22C55E', r: '--c: #EF4444', v: '--c: #A855F7', t: '--c: #14B8A6', y: '--c: #EAB308', n: '--c: #8F8F8F' };
    const T = (l, v, s, c, h, d, dcls, pre) => ({ l, v, s, c: C[c], h: L(h), d: d || '', dcls: dcls || 'muted', on: () => { if (pre) try { Object.keys(pre).forEach((k) => window.localStorage.setItem(k, pre[k])); } catch (e) {} } });
    const cm0 = [
      { t: 'Sales', items: [{ l: 'Sales order', k: 'Ctrl F4', h: L('SalesOrderEntry') }, { l: 'Sale bill', k: 'F8', h: L('SaleBillSelect') }, { l: 'Sale return', k: 'Ctrl ⇧ F8', h: L('SaleReturnEntry') }, { l: 'General sale', k: '⇧ F8', h: L('GeneralSaleEntry') }, { l: 'Dispatch schedule', k: 'Ctrl F8', h: L('DispatchScheduleEntry') }] },
      { t: 'Purchase', items: [{ l: 'Purchase order', k: 'Ctrl F5', h: L('PurchaseOrderEntry') }, { l: 'Purchase bill', k: 'F9', h: L('PurchaseBillSelect') }, { l: 'Purchase return', k: 'Ctrl ⇧ F9', h: L('PurchaseReturnEntry') }, { l: 'General purchase', k: '⇧ F9', h: L('GeneralPurchaseEntry') }] },
      { t: 'Bank & cash', items: [{ l: 'Bank receipt', k: 'F6', h: L('Payments') }, { l: 'Bank payment', k: 'F7', h: L('Payments') }, { l: 'Cash receipt', k: '⇧ F6', h: L('Payments') }, { l: 'Cash payment', k: '⇧ F7', h: L('Payments') }] },
      { t: 'Journal', items: [{ l: 'Debit note', k: 'Ctrl D', h: L('DebitNoteEntry') }, { l: 'Credit note', k: 'Ctrl E', h: L('CreditNoteEntry') }, { l: 'Journal voucher', k: 'Ctrl J', h: L('Payments') }] },
      { t: 'Masters', items: [{ l: 'Party', k: 'Ctrl M', h: L('AccountMaster') }, { l: 'Broker', k: 'Ctrl A', h: L('AccountMaster') }, { l: 'Yarn item', k: 'Ctrl I', h: L('YarnMaster') }, { l: 'All masters', k: '→', h: L('Masters') }] }
    ];
    const cq = st.cq.trim().toLowerCase();
    const cm = cm0.map((g) => ({ ...g, items: g.items.filter((x) => !cq || x.l.toLowerCase().indexOf(cq) >= 0) })).filter((g) => g.items.length);
    const PL = [['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['fy', 'FY']];
    const base = { theme, cm, menu, toggleMenu: () => this.setState({ menu: !menu }), cq: st.cq, setCq: (e) => this.setState({ cq: e.target.value }), ask: st.ask, setAsk: (e) => this.setState({ ask: e.target.value }), allHref: L('Approvals') };
    const d = st.d; const api = this.api();
    if (!d) {
      const tiles = [T('Sales', '₹ 1,18,68,981', '75,371.708 kg · 1,961 pcs', 'b', 'SalesOrderList', '▲ 12%', 'up'), T('Purchase', '₹ 45,29,712', '29,368.780 kg · 806 pcs', 'o', 'PurchaseBill'), T('Sales return', '₹ 7,06,309', '4,565.367 kg · 140 pcs', 'r', 'Dispatch'), T('Purchase return', '₹ 0', '0.000 kg · 0 pcs', 'n', 'PurchaseBill'), T('Receipts', '₹ 54,25,755', 'Bank + cash', 'g', 'Payments'), T('Payments', '₹ 1,99,31,067', 'Bank + cash', 'v', 'Payments'), T('Sales outstanding', '₹ 78,98,66,505', 'Bill-wise receivable', 'b', 'Outstanding'), T('General sale O/S', '₹ 4,93,31,205', 'Non-yarn sales', 't', 'Outstanding'), T('Purchase outstanding', '₹ 15,23,50,686', 'Payable to mills', 'o', 'Outstanding'), T('General purchase O/S', '₹ 3,08,78,078', 'Expenses & services', 'y', 'Outstanding'), T('Debit note O/S', '₹ 1,22,96,026', 'Interest & claims', 'r', 'Outstanding'), T('Sales orders', '40,500 kg', 'Pending to dispatch', 'b', 'SalesOrderList'), T('Purchase orders', '0 kg', 'Pending to receive', 'o', 'PurchaseOrderList'), T('E-invoice', '1,72,657 used', 'IRN generated this FY', 't', 'Reports'), T('WhatsApp', 'Running', '0 in queue · 1,33,716 sent', 'g', 'Approvals', '● Live', 'up')];
      const H = [[95, 75], [105, 83], [88, 73], [120, 90], [130, 100], [115, 88], [138, 103], [123, 95], [145, 110], [153, 118], [135, 105], [160, 113]];
      return { ...base, tiles, exportCsv: () => {}, coId: '', cos: [{ v: '', l: 'Shree Umiya Yarn Pvt Ltd · Surat' }, { v: 'b', l: 'Branch · Bhiwandi' }], setCo: () => {}, ccs: ['Trading division · Shivam', 'All cost centers'], from: '23-10-2026', to: '23-10-2026', setFrom: () => {}, setTo: () => {},
        pers: PL.map(([k, l]) => ({ l, cls: k === 'today' ? 'on' : '', pick: () => {} })), tg: { l: "Today's target", w: 'display: block; width: 100%; height: 6px; background: #22C55E', v: '₹ 1.19 Cr', of: 'of ₹ 1.00 L target' }, glance: 'Today at a glance',
        ch: { s: 'Sales ₹ 622 L', p: 'Purchase ₹ 460 L', aria: 'Weekly sales rose from 38 to 64 lakh and purchase from 30 to 45 lakh between weeks 32 and 43', ax: ['72', '54', '36', '18', '0'], bars: H.map((h, i) => ({ s: 'height: ' + h[0] + 'px; background: #3B82F6', p: 'height: ' + h[1] + 'px; background: #F97316', w: 'W' + (32 + i), ls: i === 11 ? 'color: var(--t1)' : '', t: '' })) },
        pl: { sub: 'Oct · 86 orders', st: [['dot c-orange', 'On hold · approval', 22, '#F97316', 11], ['dot c-blue', 'Pending dispatch', 52, '#3B82F6', 26], ['dot c-violet', 'Dispatched', 36, '#A855F7', 18], ['dot c-teal', 'Invoiced', 34, '#14B8A6', 17], ['dot c-green', 'Closed · fully dispatched', 28, '#22C55E', 14]].map((x) => ({ dc: x[0], l: x[1], w: 'width: ' + x[2] + '%; background: ' + x[3], n: String(x[4]) })), avg: '₹ 2.14 L', days: '41' },
        ins: { when: '4 min ago', rows: [{ dc: 'dot c-red', t: 'Krishna Textiles is 18 days past terms with ₹ 2.14 L overdue.', a: 'Send WhatsApp reminder', h: L('Outstanding'), st: 'padding-top: 14px', on: () => {} }, { dc: 'dot c-green', t: 'Viscose 120D sales up 32%. Stock covers 9 days only.', a: 'Draft a mill order', h: L('PurchaseOrder'), st: '', on: () => {} }, { dc: 'dot c-violet', t: 'FDY 75/36 mill rate rose ₹ 3.50/kg; 6 open quotes use the old rate.', a: 'Review orders', h: L('SalesOrderList'), st: '', on: () => {} }] },
        doAsk: () => {}, allHref: L('SalesOrderList'),
        acts: [{ who: 'Dhaval K.', verb: 'dispatched', what: 'SO-0415', rest: 'to Om Sai Weaving · LR NR-44817', ago: '12 min ago', st: 'padding-top: 0' }, { who: 'Meera Patel', verb: 'recorded receipt of', what: '₹ 1,50,000', rest: 'from Krishna Textiles', ago: '1 hour ago', st: '' }, { who: 'Avi Patel', verb: 'approved', what: 'PO-0121', rest: '· Sanathan Textiles · ₹ 8.4 L', ago: '3 hours ago', st: 'padding-bottom: 16px' }] };
    }
    const inr = (n, dg) => { const v = Number(n) || 0; const s = Math.abs(v).toFixed(dg || 0); let [i, f] = s.split('.'); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (v < 0 ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const LK = (v) => { const n = Number(v) || 0; return Math.abs(n) >= 1e7 ? '₹ ' + (n / 1e7).toFixed(2) + ' Cr' : Math.abs(n) >= 1e5 ? '₹ ' + (n / 1e5).toFixed(2) + ' L' : '₹ ' + inr(n); };
    const kgp = (x) => inr(x.qty, 3) + ' kg · ' + inr(x.pcs) + ' pcs';
    const os = d.outstandingByType || {};
    const tiles = [T('Sales', '₹ ' + inr(d.sales.amount), kgp(d.sales), 'b', 'SaleBillList', d.sales.count + ' bills', 'muted'), T('Purchase', '₹ ' + inr(d.purchase.amount), kgp(d.purchase), 'o', 'PurchaseBillList', d.purchase.count + ' bills'),
      T('Sales return', '₹ ' + inr(d.salesReturn.amount), kgp(d.salesReturn), 'r', 'SaleReturnList'), T('Purchase return', '₹ ' + inr(d.purchaseReturn.amount), kgp(d.purchaseReturn), 'n', 'PurchaseReturnList'),
      T('Receipts', '₹ ' + inr(d.receipts.amount), d.receipts.count + ' entries · bank + cash', 'g', 'Payments', '', '', { 'yf-pay-kind': 'r' }), T('Payments', '₹ ' + inr(d.payments.amount), d.payments.count + ' entries · bank + cash', 'v', 'Payments', '', '', { 'yf-pay-kind': 'p' }),
      T('Sales outstanding', '₹ ' + inr(os.SALE_BILL || 0), 'Bill-wise receivable', 'b', 'Outstanding', d.receivable.overdue ? LK(d.receivable.overdue) + ' overdue' : '', 'down'), T('General sale O/S', '₹ ' + inr(os.GENERAL_SALE || 0), 'Non-yarn sales', 't', 'Outstanding'),
      T('Purchase outstanding', '₹ ' + inr(os.P_PURCHASE_BILL || 0), 'Payable to mills', 'o', 'Outstanding', '', '', { 'yf-out-side': 'p' }), T('General purchase O/S', '₹ ' + inr(os.P_GENERAL_PURCHASE || 0), 'Expenses & services', 'y', 'Outstanding', '', '', { 'yf-out-side': 'p' }),
      T('Debit note O/S', '₹ ' + inr(os.DEBIT_NOTE || 0), 'Interest & claims', 'r', 'DebitNoteList'), T('Sales orders', inr(d.pendingSalesOrders.qty, 0) + ' kg', d.pendingSalesOrders.count + ' orders pending to dispatch', 'b', 'SalesOrderList'),
      T('Purchase orders', inr(d.pendingPurchaseOrders.qty, 0) + ' kg', d.pendingPurchaseOrders.count + ' orders pending to receive', 'o', 'PurchaseOrderList'), T('E-invoice', inr(d.irnCount) + ' used', 'IRN generated this FY', 't', 'EwayBills', d.ewbPending ? d.ewbPending + ' EWB pending' : '', d.ewbPending ? 'down' : 'muted'),
      T('Approvals', String(d.approvalsPending), 'Waiting for you', 'g', 'Approvals', d.approvalsPending ? '● Action' : '✓ Clear', d.approvalsPending ? 'down' : 'up')];
    const W = (d.weekly || []).slice(-12); const mx = Math.max(1, ...W.map((w) => Math.max(w.sales, w.purchase)));
    const step = Math.ceil(mx / 1e5 / 4) || 1;
    const top = step * 4;
    const ch = { s: 'Sales ' + LK(W.reduce((a, w) => a + w.sales, 0)), p: 'Purchase ' + LK(W.reduce((a, w) => a + w.purchase, 0)), aria: 'Weekly sales and purchase for the last 12 weeks', ax: [4, 3, 2, 1, 0].map((i) => String(i * step)),
      bars: W.map((w, i) => ({ s: 'height: ' + Math.round(w.sales / 1e5 / top * 180) + 'px; background: #3B82F6', p: 'height: ' + Math.round(w.purchase / 1e5 / top * 180) + 'px; background: #F97316', w: 'W' + Number(w.week.slice(5)), ls: i === W.length - 1 ? 'color: var(--t1)' : '', t: 'Sales ' + LK(w.sales) + ' · Purchase ' + LK(w.purchase) })) };
    const P = d.pipeline || {}; const stg = [['dot c-orange', 'On hold · approval', '#F97316', P.PENDING_APPROVAL || 0], ['dot c-blue', 'Pending dispatch', '#3B82F6', P.OPEN || 0], ['dot c-violet', 'Part dispatched', '#A855F7', P.PARTIAL || 0], ['dot c-teal', 'Locked', '#14B8A6', P.LOCKED || 0], ['dot c-green', 'Closed · fully dispatched', '#22C55E', P.COMPLETED || 0]];
    const tot = stg.reduce((a, x) => a + x[3], 0) || 1;
    const pl = { sub: 'FY · ' + Object.values(P).reduce((a, b) => a + b, 0) + ' orders', st: stg.map((x) => ({ dc: x[0], l: x[1], w: 'width: ' + Math.round(x[3] / tot * 100) + '%; background: ' + x[2], n: String(x[3]) })), avg: d.sales.count ? LK(d.sales.amount / d.sales.count) : '—', days: String(d.avgDaysToPay || '—') };
    const ins = [];
    const td = (d.topDebtors || []).filter((p) => p.overdue > 0).sort((a, b) => b.overdue - a.overdue)[0];
    if (td) ins.push({ dc: 'dot c-red', t: td.partyName + ' has ' + LK(td.overdue) + ' overdue, oldest bill ' + td.maxDays + ' days.', a: 'Send WhatsApp reminder', h: L('Outstanding'), on: () => {} });
    if (d.lowStock && d.lowStock.length) ins.push({ dc: 'dot c-green', t: d.lowStock[0].itemName + ' is below minimum stock (' + inr(d.lowStock[0].qty, 0) + ' of ' + inr(d.lowStock[0].minStock, 0) + ' kg).', a: 'Draft a mill order', h: L('PurchaseOrderEntry'), on: () => {} });
    if (d.approvalsPending) ins.push({ dc: 'dot c-violet', t: d.approvalsPending + ' document' + (d.approvalsPending > 1 ? 's are' : ' is') + ' waiting for your approval.', a: 'Review approvals', h: L('Approvals'), on: () => {} });
    if (d.ewbPending) ins.push({ dc: 'dot c-orange', t: d.ewbPending + ' sale bill' + (d.ewbPending > 1 ? 's need' : ' needs') + ' an e-way bill.', a: 'Generate e-way bills', h: L('EwayBills'), on: () => {} });
    if (!ins.length) ins.push({ dc: 'dot c-green', t: 'Nothing needs attention right now.', a: 'Open reports', h: L('Reports'), on: () => {} });
    ins.forEach((x, i) => { x.st = i === 0 ? 'padding-top: 14px' : ''; });
    const ago = (t) => { const m = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 6e4)); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' hour' + (m >= 120 ? 's' : '') + ' ago' : Math.round(m / 1440) + ' days ago'; };
    const VB = { CREATE: 'created', UPDATE: 'updated', DELETE: 'deleted', APPROVE: 'approved', REJECT: 'rejected', CANCEL: 'cancelled', LOGIN: 'signed in' };
    const acts = (d.recent || []).slice(0, 6).map((r, i, a) => ({ who: r.userName || 'System', verb: VB[r.action] || String(r.action || '').toLowerCase(), what: String(r.summary || '').split(' ').slice(0, 3).join(' '), rest: String(r.summary || '').split(' ').slice(3).join(' '), ago: ago(r.at), st: i === 0 ? 'padding-top: 0' : i === a.length - 1 ? 'padding-bottom: 16px' : '' }));
    const iso = (s) => { const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(s || '').trim()); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; };
    const dmy = (s) => (s ? s.split('-').reverse().join('-') : '');
    const user = api.user || {}; const cos = (user.companies || []).map((c) => ({ v: String(c.id), l: c.name + (c.city ? ' · ' + c.city : '') }));
    const target = d.avgDailySales || 0; const days = Math.max(1, Math.round((new Date(st.to) - new Date(st.from)) / 864e5) + 1); const tgt = target * days; const pct = tgt ? Math.min(100, Math.round(d.sales.amount / tgt * 100)) : 0;
    const csv = () => [['Tile', 'Value', 'Detail']].concat(tiles.map((t) => [t.l, t.v, t.s])).map((a) => a.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const PLN = { today: 'Today', week: 'This week', month: 'This month', fy: 'This year' };
    return { ...base, tiles, ch, pl, acts, ins: { when: st.at ? ago(st.at) : 'now', rows: ins },
      exportCsv: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })); a.download = 'Dashboard ' + st.from + ' to ' + st.to + '.csv'; a.click(); } catch (e) {} },
      coId: String(api.session.companyId), cos, setCo: async (e) => { try { await api.switchCompany(Number(e.target.value)); window.location.reload(); } catch (er) {} },
      ccs: st.lk ? ['All cost centers'].concat(st.lk.costCenters.map((c) => c.name)) : ['All cost centers'],
      from: dmy(st.from), to: dmy(st.to), setFrom: (e) => { const v = iso(e.target.value); if (v) this.load('custom', v, st.to); }, setTo: (e) => { const v = iso(e.target.value); if (v) this.load('custom', st.from, v); },
      pers: PL.map(([k, l]) => ({ l, cls: k === st.per ? 'on' : '', pick: () => this.load(k) })),
      tg: { l: (PLN[st.per] || 'Period') + ' vs average', w: 'display: block; width: ' + pct + '%; height: 6px; background: ' + (pct >= 100 ? '#22C55E' : '#F97316'), v: LK(d.sales.amount), of: 'of ' + LK(tgt) + ' usual' },
      glance: (PLN[st.per] || 'Period') + ' at a glance',
      doAsk: () => { try { window.dispatchEvent(new CustomEvent('yf-ask', { detail: st.ask })); } catch (e) {} } };
  }
}

/* ----- view ----- */
class MainView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="dash" />
        </div>
        <div className="main">
          <header className="hdr" style={{"position":"relative"}}>
            <div className="bc">
              <span>
                Dashboard
              </span>
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
            <button className="btn pr" type="button" onClick={v.toggleMenu} aria-expanded={v.menu}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {' '}
            {v.menu ? (
              <>
                <div className="cmenu" role="menu" aria-label="Create new">
                  <div className="cmh">
                    <input className="inp" type="search" placeholder="What do you want to create?" aria-label="Search create menu" style={{"flex":"1"}} value={v.cq} onChange={v.setCq} />
                    <span className="muted" style={{"fontSize":"12px"}}>
                      Old shortcuts still work
                    </span>
                  </div>
                  <div className="cgrid">
                    {(v.cm || []).map((c, $index) => (
                      <Fragment key={$index}>
                        <div className="ccol">
                          <div className="cct">
                            {c?.t}
                          </div>
                          {(c?.items || []).map((x, $index) => (
                            <Fragment key={$index}>
                              <DcLink className="cit" href={x?.h} role="menuitem">
                                <span style={{"flex":"1"}}>
                                  {x?.l}
                                </span>
                                <kbd>
                                  {x?.k}
                                </kbd>
                              </DcLink>
                            </Fragment>
                          ))}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </header>
          <div className="fbar2">
            <select className="inp" aria-label="Company / branch" value={v.coId} onChange={v.setCo}>
              {(v.cos || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option value={o?.v}>
                    {o?.l}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <select className="inp" aria-label="Cost center">
              {(v.ccs || []).map((o, $index) => (
                <Fragment key={$index}>
                  <option>
                    {o}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <span style={{"display":"inline-flex","alignItems":"center","gap":"6px"}}>
              <input className="inp" type="text" value={v.from} onChange={v.setFrom} aria-label="From date" style={{"width":"118px"}} />
              <span className="muted">
                to
              </span>
              <input className="inp" type="text" value={v.to} onChange={v.setTo} aria-label="To date" style={{"width":"118px"}} />
            </span>
            <div className="seg" role="group" aria-label="Quick period">
              {(v.pers || []).map((p, $index) => (
                <Fragment key={$index}>
                  <button type="button" className={p?.cls} onClick={p?.pick}>
                    {p?.l}
                  </button>
                </Fragment>
              ))}
            </div>
            <div style={{"flex":"1"}} />
            <span style={{"display":"inline-flex","alignItems":"center","gap":"10px","fontSize":"13px"}}>
              <span className="muted">
                {v.tg?.l}
              </span>
              <span style={{"width":"120px","height":"6px","borderRadius":"3px","background":"var(--s2)","overflow":"hidden","display":"inline-block"}}>
                <i style={sx(v.tg?.w)} />
              </span>
              <b style={{"fontWeight":"600"}}>
                {v.tg?.v}
              </b>
              <span className="muted">
                {v.tg?.of}
              </span>
            </span>
          </div>
          <div style={{"padding":"20px","display":"flex","flexDirection":"column","gap":"16px"}}>
            <section>
              <div style={{"display":"flex","alignItems":"baseline","gap":"10px","marginBottom":"10px"}}>
                <h2 style={{"margin":"0","fontSize":"15px","fontWeight":"600"}}>
                  {v.glance}
                </h2>
                <span className="muted" style={{"fontSize":"13px"}}>
                  Click any tile to open its register
                </span>
              </div>
              <div className="tiles">
                {(v.tiles || []).map((t, $index) => (
                  <Fragment key={$index}>
                    <DcLink className="box tile" href={t?.h} onClick={t?.on}>
                      <span className="tl">
                        <span className="dot" style={sx(t?.c)}>
                          {t?.l}
                        </span>
                        <span className={t?.dcls}>
                          {t?.d}
                        </span>
                      </span>
                      <span className="tv">
                        {t?.v}
                      </span>
                      <span className="ts">
                        {t?.s}
                      </span>
                    </DcLink>
                  </Fragment>
                ))}
              </div>
            </section>
            <div style={{"display":"flex","flexWrap":"wrap","gap":"16px"}}>
              <section className="box" style={{"flex":"999 1 520px","minWidth":"0","display":"flex","flexDirection":"column"}}>
                <div className="bh">
                  <h2>
                    Sales vs purchase
                  </h2>
                  <span className="dot c-blue t2" style={{"fontSize":"13px"}}>
                    {v.ch?.s}
                  </span>
                  <span className="dot c-orange t2" style={{"fontSize":"13px"}}>
                    {v.ch?.p}
                  </span>
                </div>
                <div style={{"display":"flex","gap":"10px","padding":"18px 16px 14px"}} role="img" aria-label={v.ch?.aria}>
                  <div style={{"display":"flex","flexDirection":"column","justifyContent":"space-between","height":"186px","marginTop":"-6px","fontSize":"12px","textAlign":"right","width":"22px"}} className="muted">
                    {(v.ch?.ax || []).map((a, $index) => (
                      <Fragment key={$index}>
                        <span>
                          {a}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{"flex":"1","minWidth":"0"}}>
                    <div style={{"height":"180px","display":"flex","justifyContent":"space-between","alignItems":"flex-end","borderBottom":"1px solid var(--bd2)","background":"repeating-linear-gradient(to top, var(--bd) 0 1px, transparent 1px 45px)","padding":"0 4px"}}>
                      {(v.ch?.bars || []).map((b, $index) => (
                        <Fragment key={$index}>
                          <div className="bars" title={b?.t}>
                            <i style={sx(b?.s)} />
                            <i style={sx(b?.p)} />
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{"display":"flex","justifyContent":"space-between","padding":"6px 4px 0","fontSize":"12px"}} className="muted">
                      {(v.ch?.bars || []).map((b, $index) => (
                        <Fragment key={$index}>
                          <span style={sx(b?.ls)}>
                            {b?.w}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              <section className="box" style={{"flex":"1 1 360px","minWidth":"0","display":"flex","flexDirection":"column","gap":"14px","paddingBottom":"16px"}}>
                <div className="bh">
                  <h2>
                    Order pipeline
                  </h2>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    {v.pl?.sub}
                  </span>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"14px","padding":"4px 16px 0"}}>
                  {(v.pl?.st || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <div className="stage">
                        <span className={x?.dc}>
                          {x?.l}
                        </span>
                        <span className="tr">
                          <i style={sx(x?.w)} />
                        </span>
                        <span className="r">
                          {x?.n}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div style={{"margin":"4px 16px 0","paddingTop":"14px","borderTop":"1px solid var(--bd)","display":"flex","gap":"16px","fontSize":"13px"}}>
                  <span className="muted">
                    Avg order
                  </span>
                  <b style={{"fontWeight":"600"}}>
                    {v.pl?.avg}
                  </b>
                  <span className="muted">
                    Avg days to pay
                  </span>
                  <b style={{"fontWeight":"600"}}>
                    {v.pl?.days}
                  </b>
                </div>
              </section>
            </div>
            <div style={{"display":"flex","flexWrap":"wrap","gap":"16px"}}>
              <section id="ai" className="box" style={{"flex":"1 1 360px","minWidth":"0","display":"flex","flexDirection":"column"}}>
                <div className="bh">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
                  </svg>
                  <h2>
                    AI insights
                  </h2>
                  <span className="muted" style={{"fontSize":"12px"}}>
                    {v.ins?.when}
                  </span>
                </div>
                {(v.ins?.rows || []).map((x, $index) => (
                  <Fragment key={$index}>
                    <div className="act" style={sx(x?.st)}>
                      <span className={x?.dc} aria-hidden="true" />
                      <div>
                        <div>
                          {x?.t}
                        </div>
                        <DcLink href={x?.h} className="t2" style={{"fontSize":"13px","textDecoration":"underline"}} onClick={x?.on}>
                          {x?.a}
                        </DcLink>
                      </div>
                    </div>
                  </Fragment>
                ))}
                {' '}
                <label style={{"display":"flex","alignItems":"center","gap":"8px","margin":"auto 16px 16px","padding":"4px 4px 4px 12px","borderRadius":"10px","background":"var(--s2)"}}>
                  <input type="text" aria-label="Ask YarnFlow AI" placeholder="Ask: outstanding of Surat parties above 60 days" style={{"flex":"1","minWidth":"0","border":"0","outline":"0","background":"transparent","fontSize":"13px","height":"32px"}} value={v.ask} onChange={v.setAsk} />
                  <button className="btn pr ic" type="button" aria-label="Ask" style={{"width":"32px","height":"32px"}} onClick={v.doAsk}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </label>
              </section>
            </div>
            <section className="box">
              <div className="bh" style={{"paddingBottom":"12px"}}>
                <h2>
                  Recent activity
                </h2>
                <DcLink className="btn sm" href={v.allHref}>
                  View all
                </DcLink>
              </div>
              {(v.acts || []).map((x, $index) => (
                <Fragment key={$index}>
                  <div className="act" style={sx(x?.st)}>
                    <svg className="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                    <span style={{"flex":"1"}}>
                      <b style={{"fontWeight":"500"}}>
                        {x?.who}
                      </b>
                      {' '}
                      <span className="muted">
                        {x?.verb}
                      </span>
                      {' '}
                      <b style={{"fontWeight":"500"}}>
                        {x?.what}
                      </b>
                      {' '}
                      <span className="muted">
                        {x?.rest}
                      </span>
                    </span>
                    <span className="muted">
                      {x?.ago}
                    </span>
                  </div>
                </Fragment>
              ))}
            </section>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="dash" startOpen={true} />
        </div>
      </div>
      </>
    );
  }
}

export default function Main(props) {
  const theme = useTheme();
  return <MainView {...props} theme={theme} />;
}
