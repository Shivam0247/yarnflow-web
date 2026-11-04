/* eslint-disable */
// Assistant — converted 1:1 from the YarnFlow design (Assistant.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, sx } from '@/dc/runtime';

import CSS from './Assistant.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { open: null, view: null, msgs: null, draft: '', busy: false, w: null, ctxOn: true, fb: {}, note: {}, drag: false }; }
  D() {
    if (this._d) return this._d;
    const svg = (d) => '--ic: url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>') + '")';
    const IC = {
      rate: svg('<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>'),
      stock: svg('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>'),
      list: svg('<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>'),
      msg: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
      truck: svg('<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>'),
      bill: svg('<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 8h8"/><path d="M8 12h8"/>'),
      alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'),
      check: svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
      file: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>')
    };
    const TC = { violet: ['rgba(139,92,246,.16)', '#A78BFA'], blue: ['rgba(59,130,246,.16)', '#60A5FA'], green: ['rgba(16,185,129,.16)', '#34D399'], amber: ['rgba(245,158,11,.16)', '#FBBF24'], red: ['rgba(239,68,68,.15)', '#F87171'], cyan: ['rgba(6,182,212,.16)', '#22D3EE'] };
    const AC = { red: '#EF4444', amb: '#F59E0B', grn: '#10B981', blu: '#6366F1' };
    const R = (a, b, c) => ({ a, b, c: c ? 'ai-' + c : '' });
    const S = (t, d, ic, col) => ({ t, d, ic, col });
    const I = (sev, t, v, d, act, when) => ({ sev, t, v, d, act, when: when || 'Now' });
    const CTX = {
      soe: { ctx: 'SAL11838 · Bhagwati Filaments', short: 'this sales order', line: 'I can read this sales order for Bhagwati Filaments. Ask me anything before you save it.',
        sugg: [S('Last rates for these items', 'What you charged Bhagwati before', 'rate', 'violet'), S('Stock available for this order', 'Free stock after other pending orders', 'stock', 'green'), S('Pending orders of this party', 'Open orders you can add to', 'list', 'blue'), S('Draft a payment reminder', 'WhatsApp text for the overdue bill', 'msg', 'amber')],
        ins: [I('red', 'Overdue payment from this party', '₹ 1,04,200', 'Bill SB-1142 is 6 days late. Consider holding dispatch until it clears.', 'Send reminder', '6 d'), I('amb', '50/48 FDY rate is below your last sale', '₹ 140.00 vs 141.50', 'You are giving ₹ 1.50/kg less than on 11 Mar.', 'Use ₹ 141.50'), I('amb', '50/48 FDY stock is short', '650 kg short', '2,950 kg is free after other pending orders.', 'Make purchase order'), I('grn', 'Credit is healthy', '27% used', '₹ 21,87,460 still available on a ₹ 30 L limit.', 'View ledger')] },
      poe: { ctx: 'PUR2210 · Garden Silk Mills', short: 'this purchase order', line: 'I can read this purchase order to Garden Silk Mills. Ask me to compare rates or check pending kg.',
        sugg: [S('Compare mill rates for 75/36 FDY', 'Latest offers from 3 mills', 'rate', 'violet'), S('Pending kg with Garden Silk', 'What the mill still owes you', 'list', 'blue'), S('Stock cover after this order', 'Days of stock at current sales pace', 'stock', 'green'), S('Draft order message to the mill', 'Ready to send on email or WhatsApp', 'msg', 'amber')],
        ins: [I('amb', '75/36 FDY rate is rising', '₹ 117.50 → 119.00', 'Up 1.3% in 6 months. Reliance is offering ₹ 118.40 this week.', 'Compare rates'), I('red', 'Old order still pending', '6,892 kg', 'PUR0979 from July is not fully delivered yet.', 'Remind mill', '108 d'), I('blu', 'Payable to this mill', '₹ 6,20,500', 'Next payment of ₹ 3,20,500 is due on 07 Nov.', 'Plan payment')] },
      so: { ctx: 'Sales order register', short: 'sales orders', line: 'I can read your sales order register. Ask about pending, held or late orders.',
        sugg: [S('Orders on hold to approve', 'Waiting for your approval', 'check', 'amber'), S('Pending orders older than 15 days', 'Orders that are running late', 'alert', 'red'), S('Pending kg by party', 'Who has the most to dispatch', 'list', 'blue'), S('Today’s dispatch plan', 'Orders due to go out today', 'truck', 'green')],
        ins: [I('amb', 'Orders waiting for approval', '4 orders · ₹ 18.6 L', 'One of them takes Jigita Fab LLP to 92% of its credit limit.', 'Open Hold tab'), I('red', 'Pending for more than 15 days', '12 orders', 'The oldest is SAL11702 for Bhagwati Filaments, 22 days.', 'Show orders'), I('grn', 'Due to dispatch today', '21,400 kg', '7 orders, 2 vehicles booked with Navkar Roadlines.', 'Make sale bills')] },
      po: { ctx: 'Purchase order register', short: 'purchase orders', line: 'I can read your purchase orders. Ask which mills are late or what is on hold.',
        sugg: [S('Orders on hold to approve', 'Above ₹ 10 L, need approval', 'check', 'amber'), S('Which mills are late?', 'Orders past the promised date', 'alert', 'red'), S('Pending kg by mill', 'What each mill still owes', 'list', 'blue'), S('Rate trend of 75/36 FDY', 'Last 6 months', 'rate', 'violet')],
        ins: [I('amb', 'Orders on hold', '2 orders · ₹ 31.2 L', 'Both are above the ₹ 10 L approval limit.', 'Open Hold tab'), I('red', 'Late from mills', '9,800 kg', '5 orders are past their delivery date.', 'Remind mills'), I('grn', 'Arriving this week', '8 orders', '42,600 kg expected at Sachin GIDC godown.', 'View schedule')] },
      disp: { ctx: 'Sale bills', short: 'sale bills', line: 'I can read your sale bills and e-way bills. Ask about billing, Part B or unpaid bills.',
        sugg: [S('Generate pending e-way bills', 'Part A for 4 bills in one go', 'bill', 'violet'), S('Bills without Part B', 'Waiting for the transporter', 'truck', 'amber'), S('Today’s billing total', 'Value and kg billed today', 'list', 'blue'), S('Unpaid bills older than 30 days', 'For follow-up calls', 'alert', 'red')],
        ins: [I('red', 'E-way bill not generated', '4 bills', 'These bills cannot leave the godown yet.', 'Generate all 4'), I('amb', 'Part B pending with transporter', '3 bills', 'Navkar Roadlines has 2 of them.', 'Remind transporters'), I('grn', 'Billed today', '₹ 12.4 L', '18 bills, 21,400 kg.', 'Open register')] },
      ewb: { ctx: 'E-way bills', short: 'e-way bills', line: 'I can read your e-way bills. Ask me to generate, extend or check Part B.',
        sugg: [S('Generate pending e-way bills', 'Part A for 4 bills in one go', 'bill', 'violet'), S('Which e-way bill expires today?', 'Extend before midnight', 'alert', 'red'), S('Bills without Part B', 'Waiting for the transporter', 'truck', 'amber'), S('Today’s billing total', 'Value and kg billed today', 'list', 'blue')],
        ins: [I('red', 'Pending generation', '4 bills', 'Part A is ready for all of them.', 'Generate all 4'), I('red', 'Expiring today', '1 e-way bill', 'EWB 3410 2287 6612 for SB-1131 expires at 11:59 pm.', 'Extend validity'), I('amb', 'Part B pending', '3 bills', 'Transporters have not added vehicle numbers yet.', 'Remind transporters')] },
      pb: { ctx: 'Purchase bills', short: 'purchase bills', line: 'I can read your purchase bills. Ask about short weight, dues or unmatched bills.',
        sugg: [S('Short weight by mill', 'This month, in kg and %', 'stock', 'amber'), S('Payments due this week', 'To mills, by date', 'list', 'blue'), S('Bills not matched to an order', 'Need a purchase order link', 'alert', 'red'), S('Rate trend of 75/36 FDY', 'Last 6 months', 'rate', 'violet')],
        ins: [I('amb', 'Short weight this month', '1,240 kg · 2.1%', 'Most of it from Garden Silk Mills.', 'Raise debit note'), I('blu', 'Due to mills this week', '₹ 14.8 L', '4 payments between Mon and Fri.', 'Plan payments'), I('red', 'Bill not matched to an order', '1 bill', 'PB-0881 from Sanathan has no purchase order.', 'Link order')] },
      dash: { ctx: 'Dashboard', short: 'your business today', line: 'Here is your day at a glance. Ask me anything about sales, stock or money.',
        sugg: [S('Summarise today', 'Sales, purchase and collections', 'list', 'violet'), S('Who owes us the most?', 'Largest overdue balances', 'alert', 'red'), S('Low stock yarns', 'Less than a week left', 'stock', 'amber'), S('Rate trend of 75/36 FDY', 'Last 6 months', 'rate', 'blue')],
        ins: [I('grn', 'Sales today', '₹ 12.4 L', '18 bills, 12% above your daily average.', 'Open sale bills'), I('red', 'Overdue receivable', '₹ 42.8 L', 'Jigita Fab LLP alone owes ₹ 9.6 L for 41 days.', 'Send reminders'), I('amb', 'Yarns running low', '3 items', '67/72 FDY has only 4 days of stock left.', 'Make purchase order')] }
    };
    const ALIAS = { soa: 'so', poa: 'po', appr: 'so' };
    const NAMES = { pay: 'Payments', led: 'Ledger', out: 'Outstanding', stock: 'Stock', rep: 'Reports', mast: 'Masters', acc: 'Account master', grp: 'Group master', yarn: 'Yarn master', trn: 'Transporter master', soa: 'Sales orders on hold', poa: 'Purchase orders on hold', appr: 'Approvals' };
    const A = (t, cardT, rows, src, acts) => ({ t, cardT, rows, src, acts });
    const ANS = {
      'last rates for these items': A('You gave Bhagwati Filaments these rates on recent orders. Today’s 50/48 FDY rate is ₹ 1.50 lower than last time.', 'Last rates · Bhagwati Filaments', [R('50/24 SD CAT · 21 May', '₹ 179.60'), R('50/24 SD CAT · 02 Apr', '₹ 176.00'), R('50/48 FDY · 11 Mar', '₹ 141.50'), R('50/48 FDY · this order', '₹ 140.00', 'amb')], ['SAL02722', 'SAL01988', 'SAL01650'], ['Use last rates', 'Keep current']),
      'stock available for this order': A('50/24 SD CAT is fully covered. 50/48 FDY is 650 kg short after other pending orders.', 'Free stock', [R('50/24 SD CAT · lot 356C9S', '12,400 kg', 'grn'), R('50/48 FDY · lot 338C1M', '2,950 kg · 650 short', 'red')], ['Stock · Sachin GIDC'], ['Reserve stock', 'Make purchase order']),
      'pending orders of this party': A('Bhagwati Filaments has 3 open orders. You can add their balance to this order.', 'Open orders', [R('SAL02722 · 50/24 SD CAT', '700 kg'), R('SAL02688 · 75/36 FDY', '2,400 kg'), R('SAL02610 · 50/48 FDY', '1,100 kg')], ['Sales order register'], ['Add to this order', 'Open register']),
      'draft a payment reminder': A('Here is a short WhatsApp message for Ramesh Agarwal:\n\n“Namaste Rameshbhai, ₹ 1,04,200 against bill SB-1142 was due on 17 Oct. Kindly arrange the payment this week. – Shree Umiya Yarn”', '', [], ['Ledger · Bhagwati Filaments'], ['Send on WhatsApp', 'Copy text']),
      'compare mill rates for 75/36 fdy': A('Reliance is cheapest this week, ₹ 0.60/kg below Garden Silk.', 'Offers for 75/36 FDY', [R('Reliance Industries', '₹ 118.40', 'grn'), R('Garden Silk Mills', '₹ 119.00'), R('Sanathan Textiles', '₹ 119.75')], ['Rate history'], ['Switch to Reliance', 'Keep Garden Silk']),
      'pending kg with garden silk': A('Garden Silk Mills still owes you 7,742 kg on two old orders.', 'Pending from mill', [R('PUR0979 · 50/24 FDY', '6,892 kg', 'amb'), R('PUR0724 · 67/72 FDY', '850 kg')], ['PUR0979', 'PUR0724'], ['Send reminder to mill']),
      'stock cover after this order': A('This order takes both yarns above two weeks of stock.', 'Days of stock', [R('75/36 FDY', '9 → 23 days', 'grn'), R('67/72 FDY', '4 → 11 days')], ['Stock', 'Sales last 30 days'], []),
      'draft order message to the mill': A('“Please supply 6,000 kg 75/36 FDY (A1) at ₹ 119.00 and 2,400 kg 67/72 FDY (1ST) at ₹ 121.50, delivered to our Sachin GIDC godown within 7 days. PO PUR2210/26-27.”', '', [], ['This purchase order'], ['Email to mill', 'Copy text']),
      'orders on hold to approve': A('4 orders are waiting for you. Check Jigita Fab LLP first: approving it takes them to 92% of their credit limit.', 'On hold', [R('SAL11831 · Jigita Fab LLP', '₹ 6.2 L', 'red'), R('SAL11829 · Shree Rudraksha Poly', '₹ 4.8 L'), R('SAL11826 · Maruti Weaves', '₹ 4.1 L'), R('SAL11820 · Krishna Texfab', '₹ 3.5 L')], ['Sales order register'], ['Open Hold tab', 'Approve 3 safe ones']),
      'pending orders older than 15 days': A('12 orders are older than 15 days. These three are the biggest.', 'Running late', [R('SAL11702 · Bhagwati Filaments', '4,200 kg · 22 d', 'red'), R('SAL11688 · Maruti Weaves', '3,100 kg · 19 d', 'red'), R('SAL11650 · Krishna Texfab', '2,050 kg · 16 d', 'amb')], ['Sales order register'], ['Show all 12']),
      'pending kg by party': A('Bhagwati Filaments has the most waiting to be dispatched.', 'Pending kg', [R('Bhagwati Filaments', '18,450 kg'), R('Jigita Fab LLP', '11,200 kg'), R('Shree Rudraksha Poly', '8,760 kg')], ['Sales order register'], ['Open report']),
      'today’s dispatch plan': A('7 orders are due today, 21,400 kg in total. 2 vehicles are booked with Navkar Roadlines.', 'Dispatch today', [R('Morning · Sachin GIDC', '4 orders · 12,100 kg'), R('Evening · Pandesara', '3 orders · 9,300 kg')], ['Dispatch schedule'], ['Make sale bills']),
      'generate pending e-way bills': A('4 sale bills need an e-way bill. Part A is ready for all of them and the transporter will fill Part B.', 'Ready to generate', [R('SB-1151 · Bhagwati Filaments', '₹ 3.4 L'), R('SB-1150 · Jigita Fab LLP', '₹ 2.1 L'), R('SB-1149 · Maruti Weaves', '₹ 1.8 L'), R('SB-1147 · Krishna Texfab', '₹ 1.2 L')], ['Sale bills'], ['Generate all 4']),
      'bills without part b': A('These are waiting for the transporter to add the vehicle.', 'Part B pending', [R('SB-1144 · Navkar Roadlines', '2 h ago', 'amb'), R('SB-1143 · Jay Ambe Roadlines', '5 h ago', 'amb'), R('SB-1140 · Navkar Roadlines', '1 day ago', 'red')], ['E-way bill portal'], ['Remind transporters']),
      'summarise today': A('Sales ₹ 12.4 L from 18 bills, purchases ₹ 8.1 L and collections ₹ 6.7 L. 4 orders are on hold and 4 e-way bills are pending.', 'Today', [R('Sales', '₹ 12.4 L', 'grn'), R('Purchase', '₹ 8.1 L'), R('Collections', '₹ 6.7 L'), R('Needs action', '8 items', 'amb')], ['Day book'], ['Open approvals', 'Open e-way bills']),
      'who owes us the most?': A('Jigita Fab LLP has the largest and oldest overdue balance.', 'Overdue', [R('Jigita Fab LLP', '₹ 9.6 L · 41 d', 'red'), R('Maruti Weaves', '₹ 6.3 L · 28 d', 'red'), R('Bhagwati Filaments', '₹ 1.0 L · 6 d', 'amb')], ['Outstanding'], ['Draft reminders']),
      'low stock yarns': A('These yarns have less than a week of stock at your current selling pace.', 'Running low', [R('67/72 FDY', '4 days', 'red'), R('50/48 FDY', '6 days', 'amb'), R('80/72 SD', '6 days', 'amb')], ['Stock', 'Sales last 30 days'], ['Make purchase order']),
      'rate trend of 75/36 fdy': A('75/36 FDY is up 1.3% in 6 months. Reliance is cheapest this week.', 'Rate, ₹/kg', [R('May', '₹ 117.50'), R('Jul', '₹ 118.10'), R('Oct', '₹ 119.00', 'amb')], ['Purchase bills'], [])
    };
    const KEYS = [['rate', 'rate trend of 75/36 fdy'], ['stock', 'low stock yarns'], ['e-way', 'generate pending e-way bills'], ['eway', 'generate pending e-way bills'], ['owe', 'who owes us the most?'], ['overdue', 'who owes us the most?'], ['hold', 'orders on hold to approve'], ['approv', 'orders on hold to approve'], ['pending', 'pending kg by party'], ['dispatch', 'today’s dispatch plan'], ['today', 'summarise today']];
    const HIST = [{ h: 'Today', items: [['Last rates for Bhagwati Filaments', 'Sales order · 11:42'], ['Generate pending e-way bills', 'E-way bills · 10:15']] }, { h: 'Yesterday', items: [['Who owes us the most?', 'Dashboard · 18:20'], ['Compare mill rates for 75/36 FDY', 'Purchase order · 12:05']] }, { h: 'This week', items: [['Short weight by mill', 'Purchase bills · Tue'], ['Pending orders older than 15 days', 'Sales orders · Mon']] }];
    this._d = { IC, TC, AC, R, CTX, ALIAS, NAMES, ANS, KEYS, HIST };
    return this._d;
  }
  /* live layer: real answers from the books when the app is signed in */
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  async loadIns() { const api = this.api(); if (!api) return; try { this.setState({ liveIns: await api.get('/assistant/insights') }); } catch (e) {} }
  componentDidMount() {
    this.loadIns();
    this._ev = (e) => { if (e && e.detail) this.ask(e.detail); }; try { window.addEventListener('yf-ask', this._ev); } catch (e) {}
    try { const v = window.localStorage.getItem('yf-ai-open'); if (v !== null && !this.props.startOpen) this.setState({ open: v === '1' }); const w = parseInt(window.localStorage.getItem('yf-ai-w') || '', 10); if (w >= 320 && w <= 640) this.setState({ w }); } catch (e) {}
    this._key = (e) => { if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); this.setOpen(!this.isOpen()); } };
    try { window.addEventListener('keydown', this._key); } catch (e) {}
  }
  componentWillUnmount() { try { window.removeEventListener('keydown', this._key); window.removeEventListener('yf-ask', this._ev); } catch (e) {} }
  componentDidUpdate() { if (!this._scroll) return; this._scroll = false; try { const el = document.getElementById('ai-body'); if (el) el.scrollTop = el.scrollHeight; } catch (e) {} }
  isOpen() { return this.state.open ?? !!this.props.startOpen; }
  setOpen(o, view) { try { window.localStorage.setItem('yf-ai-open', o ? '1' : '0'); } catch (e) {} const s = { open: o }; if (view) s.view = view; this.setState(s); }
  width() { return this.state.w ?? 384; }
  saveW(w) { try { window.localStorage.setItem('yf-ai-w', String(w)); } catch (e) {} }
  data() {
    const { CTX, ALIAS, NAMES } = this.D(); const k = this.props.page || 'soe';
    if (this.api()) {
      const S = (t, d, ic, col) => ({ t, d, ic, col });
      const LBL = { soe: 'Sales order', poe: 'Purchase order', so: 'Sales orders', po: 'Purchase orders', disp: 'Sale bills', ewb: 'E-way bills', pb: 'Purchase bills', dash: 'Dashboard' };
      const name = LBL[k] || NAMES[k] || 'YarnFlow';
      return { ctx: name, short: name.toLowerCase(), line: 'Ask me about outstanding, stock, rates, orders or bills — answers come straight from your books.',
        sugg: [S('Summarise today', 'Sales, purchase and collections', 'list', 'violet'), S('Who owes us the most?', 'Largest overdue balances', 'alert', 'red'), S('Low stock yarns', 'Less than a month of free stock', 'stock', 'amber'), S('Orders on hold to approve', 'Waiting for your decision', 'check', 'amber'), S('Pending e-way bills', 'Bills that cannot leave yet', 'bill', 'blue'), S('Payments due to mills this week', 'Payable in the next 7 days', 'list', 'cyan')],
        ins: this.state.liveIns || [] };
    }
    if (CTX[k]) return CTX[k];
    const b = CTX[ALIAS[k]] || CTX.dash;
    return NAMES[k] ? Object.assign({}, b, { ctx: NAMES[k], short: NAMES[k].toLowerCase(), line: 'I can read your ' + NAMES[k].toLowerCase() + '. Ask me anything about it.' }) : b;
  }
  now() { try { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); } catch (e) { return ''; } }
  seed() {
    if (this.state.msgs) return this.state.msgs;
    const demo = this.props.demo; if (!demo) return [];
    const q = demo === 'chat' ? this.data().sugg[0].t : demo;
    return [{ who: 'user', t: q }, Object.assign({ who: 'bot', time: '11:42' }, this.answer(q))];
  }
  answer(q) {
    const { R, ANS, KEYS } = this.D(); const l = String(q).toLowerCase();
    let a = ANS[l];
    if (!a) { const hit = KEYS.find(([k]) => l.indexOf(k) >= 0); a = hit ? ANS[hit[1]] : null; }
    if (!a) a = { t: 'I searched orders, bills and ledgers for “' + q + '”. This is what matched.', cardT: 'Matches', rows: [R('Sales orders', '6'), R('Sale bills', '14'), R('Parties', '2')], src: ['Search'], acts: ['Show results'] };
    return a;
  }
  ask(text) {
    const q = String(text || '').trim(); if (!q || this.state.busy) return;
    const msgs = this.seed().concat([{ who: 'user', t: q }]);
    this._scroll = true; this.setState({ msgs, draft: '', busy: true, view: 'chat', open: true });
    const api = this.api();
    if (api) {
      try { const h = JSON.parse(window.localStorage.getItem('yf-ai-hist') || '[]'); h.unshift({ t: q, s: this.data().ctx + ' · ' + this.now() }); window.localStorage.setItem('yf-ai-hist', JSON.stringify(h.slice(0, 20))); } catch (e) {}
      api.post('/assistant/ask', { q }).then((a) => { this._scroll = true; this.setState({ busy: false, msgs: (this.state.msgs || []).concat([Object.assign({ who: 'bot', time: this.now() }, a)]) }); })
        .catch((e) => { this._scroll = true; this.setState({ busy: false, msgs: (this.state.msgs || []).concat([{ who: 'bot', time: this.now(), t: api.message(e), cardT: '', rows: [], src: [], acts: [] }]) }); });
      return;
    }
    const a = this.answer(q);
    setTimeout(() => { this._scroll = true; this.setState({ busy: false, msgs: (this.state.msgs || []).concat([Object.assign({ who: 'bot', time: this.now() }, a)]) }); }, 900);
  }
  say(t) { this._scroll = true; this.setState({ view: 'chat', open: true, msgs: this.seed().concat([{ who: 'bot', time: this.now(), t, cardT: '', rows: [], src: [], acts: [] }]) }); }
  /** action buttons: open the screen that does the job (app) or acknowledge (canvas) */
  act(l) {
    const api = this.api(); if (!api) { this.say('✓ ' + l + ' — done. You can undo this from History.'); return; }
    const sfx = (this.props.theme ?? 'dark') === 'light' ? 'Light' : '';
    const T = [[/ledger/i, 'Ledger'], [/reminder|outstanding/i, 'Outstanding'], [/payment|pay/i, 'Payments'], [/approv/i, 'Approvals'], [/e-way|generate/i, 'EwayBills'], [/purchase order/i, 'PurchaseOrderEntry'], [/purchase orders/i, 'PurchaseOrderList'], [/sale bills/i, 'SaleBillList'], [/stock/i, 'Stock'], [/report/i, 'Reports'], [/register/i, 'SalesOrderList'], [/dashboard/i, 'Main']];
    const hit = T.find(([re]) => re.test(l));
    if (hit) { if (/payment/i.test(l)) try { window.localStorage.setItem('yf-pay-kind', /record payment|plan/i.test(l) ? 'p' : 'r'); } catch (e) {} try { const a = document.createElement('a'); a.href = hit[1] + sfx + '.dc.html'; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
    else this.say('Open the relevant screen from the menu to ' + l.toLowerCase() + '.');
  }
  startResize(e) {
    const x0 = e.clientX, w0 = this.width();
    const mv = (ev) => { const w = Math.max(320, Math.min(640, w0 + (x0 - ev.clientX))); this.setState({ w, drag: true }); };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); this.setState({ drag: false }); this.saveW(this.width()); };
    try { window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); e.preventDefault(); } catch (err) {}
  }
  renderVals() {
    const { IC, TC, AC, HIST } = this.D();
    const theme = this.props.theme ?? 'dark';
    const open = this.isOpen();
    const d = this.data();
    const view = this.state.view || this.props.startView || 'chat';
    const list = this.seed();
    const lastBot = list.map((m) => m.who).lastIndexOf('bot');
    const light = theme === 'light';
    const tile = (c) => { const t = TC[c] || TC.violet; return 'background: ' + t[0] + '; color: ' + (light ? 'color-mix(in srgb, ' + t[1] + ' 70%, #000)' : t[1]); };
    const msgs = list.map((m, i) => ({
      isUser: m.who === 'user', isBot: m.who === 'bot', text: m.t, time: m.time || '',
      cardT: m.cardT || '', cardN: m.rows && m.rows.length ? m.rows.length + (m.rows.length === 1 ? ' row' : ' rows') : '',
      rows: m.rows || [], hasRows: !!(m.rows && m.rows.length),
      src: m.src || [], hasSrc: !!(m.src && m.src.length),
      acts: (m.acts || []).map((l, j) => ({ l, cls: j === 0 ? 'ai-act pri' : 'ai-act', go: () => this.act(l) })),
      hasActs: !!(m.acts && m.acts.length),
      hasTb: m.who === 'bot' && i === lastBot && !this.state.busy,
      upCls: this.state.fb[i] === 'up' ? 'ai-ib ai-on' : 'ai-ib', downCls: this.state.fb[i] === 'down' ? 'ai-ib ai-on' : 'ai-ib',
      up: () => this.setState({ fb: Object.assign({}, this.state.fb, { [i]: 'up' }), note: Object.assign({}, this.state.note, { [i]: 'Thanks for the feedback' }) }),
      down: () => this.setState({ fb: Object.assign({}, this.state.fb, { [i]: 'down' }), note: Object.assign({}, this.state.note, { [i]: 'Noted. Try Regenerate or rephrase.' }) }),
      copy: () => { try { navigator.clipboard.writeText(m.t); } catch (e) {} this.setState({ note: Object.assign({}, this.state.note, { [i]: 'Copied' }) }); },
      redo: () => { const q = [...list.slice(0, i)].reverse().find((x) => x.who === 'user'); if (q) { this.setState({ msgs: list.slice(0, i - 1) }); setTimeout(() => this.ask(q.t), 0); } },
      note: this.state.note[i] || ''
    }));
    const insAll = d.ins.map((n) => ({ t: n.t, v: n.v, d: n.d, act: n.act, when: n.when, ac: '--ac: ' + AC[n.sev], ask: () => this.ask(n.t), doIt: () => this.act(n.act) }));
    const userCount = list.filter((m) => m.who === 'user').length;
    const w = this.width();
    const draftOk = !!String(this.state.draft || '').trim();
    const hr = (() => { try { return new Date().getHours(); } catch (e) { return 10; } })();
    return {
      rootCls: 'ai ' + theme,
      rootStyle: 'width: ' + (open ? w : 48) + 'px',
      closed: !open, opened: open, badge: d.ins.length,
      openChat: () => this.setOpen(true, 'chat'), openIns: () => this.setOpen(true, 'insights'), openHist: () => this.setOpen(true, 'history'),
      openNew: () => { this.setOpen(true, 'chat'); this.setState({ msgs: [], draft: '', busy: false }); },
      close: () => this.setOpen(false),
      newChat: () => this.setState({ msgs: [], draft: '', busy: false, view: 'chat', fb: {}, note: {} }),
      isWide: w >= 520, notWide: w < 520, wideLabel: w >= 520 ? 'Make narrower' : 'Make wider',
      toggleWide: () => { const nw = w >= 520 ? 384 : 560; this.saveW(nw); this.setState({ w: nw }); },
      gripCls: this.state.drag ? 'ai-grip ai-on' : 'ai-grip', startResize: (e) => this.startResize(e),
      tabChat: view === 'chat' ? 'ai-tab ai-on' : 'ai-tab', tabIns: view === 'insights' ? 'ai-tab ai-on' : 'ai-tab', tabHist: view === 'history' ? 'ai-tab ai-on' : 'ai-tab',
      goChat: () => this.setState({ view: 'chat' }), goIns: () => this.setState({ view: 'insights' }), goHist: () => this.setState({ view: 'history' }),
      showEmpty: view === 'chat' && userCount === 0 && !this.state.busy,
      showMsgs: view === 'chat' && (userCount > 0 || this.state.busy),
      showIns: view === 'insights', showHist: view === 'history', showCmp: view !== 'history',
      greet: hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening',
      heroLine: d.line, ctx: d.ctx, ctxShort: d.short,
      topIns: insAll.slice(0, 2), ins: insAll,
      sugg: d.sugg.map((s) => ({ t: s.t, d: s.d, ic: IC[s.ic], tile: tile(s.col), go: () => this.ask(s.t) })),
      refine: ['Shorter', 'Show only overdue', 'Share on WhatsApp'].map((l) => ({ l, go: () => this.ask(l) })),
      hist: (this.api() ? [{ h: 'Recent', items: (() => { try { return JSON.parse(window.localStorage.getItem('yf-ai-hist') || '[]').map((x) => [x.t, x.s]); } catch (e) { return []; } })() }] : HIST).map((g) => ({ h: g.h, items: g.items.map(([t, s]) => ({ t, s, go: () => this.ask(t) })) })),
      userName: this.api() && this.api().user ? String(this.api().user.name || '').split(' ')[0] : 'Avi',
      msgs, busy: this.state.busy, fileIc: IC.file,
      ctxOn: this.state.ctxOn, ctxOff: !this.state.ctxOn,
      dropCtx: () => this.setState({ ctxOn: false }), addCtx: () => this.setState({ ctxOn: true }),
      draft: this.state.draft, noDraft: !draftOk, sendCls: draftOk ? 'ai-send ai-grad' : 'ai-send',
      setDraft: (e) => this.setState({ draft: e.target.value }),
      keyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.ask(this.state.draft); } },
      send: () => this.ask(this.state.draft),
      mention: () => this.setState({ draft: (this.state.draft || '') + '@' })
    };
  }
}

/* ----- view ----- */
class AssistantView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <aside className={v.rootCls} style={sx(v.rootStyle)} aria-label="AI assistant">
        {v.closed ? (
          <>
            <nav className="ai-rail" aria-label="AI assistant shortcuts">
              <button className="ai-orb ai-grad" type="button" onClick={v.openChat} title="Ask YarnFlow AI · Ctrl J" aria-label="Open AI assistant">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
                  <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
                </svg>
                <span className="ai-badge">
                  {v.badge}
                </span>
              </button>
              {' '}
              <button className="ai-rb" type="button" onClick={v.openIns} title="Insights for this screen" aria-label="Insights">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
                </svg>
                <span className="ai-dt" />
              </button>
              {' '}
              <button className="ai-rb" type="button" onClick={v.openNew} title="New chat" aria-label="New chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M12 7v6" />
                  <path d="M9 10h6" />
                </svg>
              </button>
              {' '}
              <button className="ai-rb" type="button" onClick={v.openHist} title="Chat history" aria-label="Chat history">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </button>
              {' '}
              <span className="ai-sep" />
              {' '}
              <button className="ai-rb" type="button" onClick={v.openChat} title="Open panel" aria-label="Open panel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M15 3v18" />
                  <path d="m11 15-3-3 3-3" />
                </svg>
              </button>
            </nav>
          </>
        ) : null}
        {' '}
        {v.opened ? (
          <>
            <div className="ai-panel">
              <div className={v.gripCls} onPointerDown={v.startResize} role="separator" aria-orientation="vertical" aria-label="Resize AI panel" title="Drag to resize" />
              <header className="ai-hd">
                <span className="ai-av ai-grad">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
                  </svg>
                </span>
                <div className="ai-tt">
                  <b>
                    YarnFlow AI
                  </b>
                  <span className="ai-beta">
                    BETA
                  </span>
                </div>
                <button className="ai-ib" type="button" onClick={v.newChat} title="New chat" aria-label="New chat">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M12 7v6" />
                    <path d="M9 10h6" />
                  </svg>
                </button>
                {' '}
                <button className="ai-ib" type="button" onClick={v.toggleWide} title={v.wideLabel} aria-label={v.wideLabel}>
                  {v.isWide ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 14h6v6" />
                        <path d="M20 10h-6V4" />
                        <path d="m14 10 7-7" />
                        <path d="m3 21 7-7" />
                      </svg>
                    </>
                  ) : null}
                  {' '}
                  {v.notWide ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 3h6v6" />
                        <path d="M9 21H3v-6" />
                        <path d="m21 3-7 7" />
                        <path d="m3 21 7-7" />
                      </svg>
                    </>
                  ) : null}
                </button>
                {' '}
                <button className="ai-ib" type="button" onClick={v.close} title="Close · Ctrl J" aria-label="Close AI panel">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M15 3v18" />
                    <path d="m8 9 3 3-3 3" />
                  </svg>
                </button>
              </header>
              <div className="ai-tabs" role="tablist">
                <button className={v.tabChat} type="button" role="tab" onClick={v.goChat}>
                  Chat
                </button>
                {' '}
                <button className={v.tabIns} type="button" role="tab" onClick={v.goIns}>
                  {"Insights "}
                  <span className="ai-n">
                    {v.badge}
                  </span>
                </button>
                {' '}
                <button className={v.tabHist} type="button" role="tab" onClick={v.goHist}>
                  History
                </button>
              </div>
              <div className="ai-body" id="ai-body">
                {v.showEmpty ? (
                  <>
                    <div className="ai-hero">
                      <h3>
                        {v.greet}{", "}
                        <span>
                          {v.userName}
                        </span>
                      </h3>
                      <p>
                        {v.heroLine}
                      </p>
                    </div>
                    <div className="ai-sec">
                      <div className="ai-sect">
                        Worth a look
                        <button type="button" onClick={v.goIns}>
                          {"See all "}{v.badge}
                        </button>
                      </div>
                      {(v.topIns || []).map((n, $index) => (
                        <Fragment key={$index}>
                          <div className="ai-ins" style={sx(n?.ac)}>
                            <div className="ai-ih">
                              <b>
                                {n?.t}
                              </b>
                              <em>
                                {n?.when}
                              </em>
                            </div>
                            <p>
                              {n?.d}
                            </p>
                            <div className="ai-acts">
                              <button className="ai-act" type="button" onClick={n?.ask}>
                                Ask about this
                              </button>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div className="ai-sec">
                      <div className="ai-sect">
                        Ask about this screen
                      </div>
                      {(v.sugg || []).map((s, $index) => (
                        <Fragment key={$index}>
                          <button className="ai-sug" type="button" onClick={s?.go}>
                            <span className="ai-tl" style={sx(s?.tile)}>
                              <span className="ai-ico" style={sx(s?.ic)} />
                            </span>
                            <span className="ai-tx">
                              <b>
                                {s?.t}
                              </b>
                              <span>
                                {s?.d}
                              </span>
                            </span>
                            <svg className="ai-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </>
                ) : null}
                {' '}
                {v.showMsgs ? (
                  <>
                    {(v.msgs || []).map((m, $index) => (
                      <Fragment key={$index}>
                        {m?.isUser ? (
                          <>
                            <div className="ai-u">
                              {m?.text}
                            </div>
                          </>
                        ) : null}
                        {' '}
                        {m?.isBot ? (
                          <>
                            <div className="ai-m">
                              <div className="ai-mh">
                                <i className="ai-grad">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
                                  </svg>
                                </i>
                                <b>
                                  YarnFlow AI
                                </b>
                                <span>
                                  {m?.time}
                                </span>
                              </div>
                              <p>
                                {m?.text}
                              </p>
                              {m?.hasRows ? (
                                <>
                                  <div className="ai-card">
                                    <div className="ai-ch">
                                      <span>
                                        {m?.cardT}
                                      </span>
                                      <span>
                                        {m?.cardN}
                                      </span>
                                    </div>
                                    {(m?.rows || []).map((r, $index) => (
                                      <Fragment key={$index}>
                                        <div className="ai-r">
                                          <span>
                                            {r?.a}
                                          </span>
                                          <b className={r?.c}>
                                            {r?.b}
                                          </b>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                              {' '}
                              {m?.hasSrc ? (
                                <>
                                  <div className="ai-src">
                                    <em>
                                      Sources
                                    </em>
                                    {(m?.src || []).map((x, $index) => (
                                      <Fragment key={$index}>
                                        <span>
                                          <span className="ai-ico" style={sx(v.fileIc)} />
                                          {x}
                                        </span>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                              {' '}
                              {m?.hasActs ? (
                                <>
                                  <div className="ai-acts">
                                    {(m?.acts || []).map((a, $index) => (
                                      <Fragment key={$index}>
                                        <button className={a?.cls} type="button" onClick={a?.go}>
                                          {a?.l}
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                              {' '}
                              {m?.hasTb ? (
                                <>
                                  <div className="ai-tb">
                                    <button className="ai-ib" type="button" onClick={m?.copy} title="Copy" aria-label="Copy answer">
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect x="9" y="9" width="13" height="13" rx="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                      </svg>
                                    </button>
                                    {' '}
                                    <button className={m?.upCls} type="button" onClick={m?.up} title="Good answer" aria-label="Good answer">
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M7 10v12" />
                                        <path d="M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 4 3.9z" />
                                      </svg>
                                    </button>
                                    {' '}
                                    <button className={m?.downCls} type="button" onClick={m?.down} title="Bad answer" aria-label="Bad answer">
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"transform":"rotate(180deg)"}}>
                                        <path d="M7 10v12" />
                                        <path d="M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 4 3.9z" />
                                      </svg>
                                    </button>
                                    {' '}
                                    <button className="ai-ib" type="button" onClick={m?.redo} title="Regenerate" aria-label="Regenerate answer">
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                                        <path d="M21 3v5h-5" />
                                      </svg>
                                    </button>
                                    {' '}
                                    <span className="ai-ok">
                                      {m?.note}
                                    </span>
                                  </div>
                                  <div className="ai-ref">
                                    {(v.refine || []).map((f, $index) => (
                                      <Fragment key={$index}>
                                        <button type="button" onClick={f?.go}>
                                          {f?.l}
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </>
                        ) : null}
                      </Fragment>
                    ))}
                    {' '}
                    {v.busy ? (
                      <>
                        <div className="ai-think">
                          <div className="ai-dots" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                          </div>
                          Checking orders, stock and ledgers…
                        </div>
                      </>
                    ) : null}
                  </>
                ) : null}
                {' '}
                {v.showIns ? (
                  <>
                    <div className="ai-sect">
                      {"For "}{v.ctxShort}{" · updated just now"}
                    </div>
                    {(v.ins || []).map((n, $index) => (
                      <Fragment key={$index}>
                        <div className="ai-ins" style={sx(n?.ac)}>
                          <div className="ai-ih">
                            <b>
                              {n?.t}
                            </b>
                            <em>
                              {n?.when}
                            </em>
                          </div>
                          <span className="ai-big">
                            {n?.v}
                          </span>
                          <p>
                            {n?.d}
                          </p>
                          <div className="ai-acts">
                            <button className="ai-act pri" type="button" onClick={n?.doIt}>
                              {n?.act}
                            </button>
                            <button className="ai-act" type="button" onClick={n?.ask}>
                              Ask AI
                            </button>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </>
                ) : null}
                {' '}
                {v.showHist ? (
                  <>
                    <label className="ai-srch">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <input type="search" placeholder="Search chats" aria-label="Search chats" />
                    </label>
                    {' '}
                    {(v.hist || []).map((g, $index) => (
                      <Fragment key={$index}>
                        <div className="ai-sec">
                          <div className="ai-sect">
                            {g?.h}
                          </div>
                          {(g?.items || []).map((h, $index) => (
                            <Fragment key={$index}>
                              <button className="ai-hi" type="button" onClick={h?.go}>
                                <b>
                                  {h?.t}
                                </b>
                                <span>
                                  {h?.s}
                                </span>
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </Fragment>
                    ))}
                  </>
                ) : null}
              </div>
              {v.showCmp ? (
                <>
                  <div className="ai-cmp">
                    <div className="ai-box">
                      <div className="ai-ctxr">
                        {v.ctxOn ? (
                          <>
                            <span className="ai-chip" title="The AI can read this screen">
                              <span className="ai-ico" style={sx(v.fileIc)} />
                              <span>
                                {v.ctx}
                              </span>
                              <button type="button" onClick={v.dropCtx} aria-label="Remove this screen from context">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                                  <path d="M18 6 6 18" />
                                  <path d="m6 6 12 12" />
                                </svg>
                              </button>
                            </span>
                          </>
                        ) : null}
                        {' '}
                        {v.ctxOff ? (
                          <>
                            <button className="ai-add" type="button" onClick={v.addCtx}>
                              + Add this screen
                            </button>
                          </>
                        ) : null}
                      </div>
                      <textarea className="ai-ta" value={v.draft} onChange={v.setDraft} onKeyDown={v.keyDown} placeholder="Ask about rates, stock, parties, bills…" aria-label="Message YarnFlow AI" />
                      <div className="ai-tools">
                        <button className="ai-ib" type="button" title="Attach a file" aria-label="Attach a file">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                        </button>
                        {' '}
                        <button className="ai-ib" type="button" onClick={v.mention} title="Mention a party, order or bill" aria-label="Mention a record">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
                          </svg>
                        </button>
                        {' '}
                        <button className="ai-ib" type="button" title="Voice input" aria-label="Voice input">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="2" width="6" height="12" rx="3" />
                            <path d="M19 10a7 7 0 0 1-14 0" />
                            <path d="M12 19v3" />
                          </svg>
                        </button>
                        {' '}
                        <span className="ai-sp" />
                        <span className="ai-k">
                          Enter to send
                        </span>
                        {' '}
                        <button className={v.sendCls} type="button" onClick={v.send} disabled={v.noDraft} aria-label="Send">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 19V5" />
                            <path d="m5 12 7-7 7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="ai-note">
                      AI can make mistakes. Check figures before saving.
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </aside>
      </>
    );
  }
}

export default function Assistant(props) {
  const theme = useTheme();
  return <AssistantView {...props} theme={theme} />;
}
