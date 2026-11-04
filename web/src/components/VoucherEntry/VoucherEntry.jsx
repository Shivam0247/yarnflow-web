/* eslint-disable */
// VoucherEntry — converted 1:1 from the YarnFlow design (VoucherEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './VoucherEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { rec: null, saved: false }; }
  VD() { if (this._vd) return this._vd;
// shared config for the five voucher types (embedded into VoucherEntry + VoucherList)
const KINDS = {
  ds: { mod: 'Sales', title: 'Dispatch schedule', reg: 'Dispatch schedule register', list: 'DispatchScheduleList', entry: 'DispatchScheduleEntry', view: 'DispatchScheduleView', no: 'DS24317/26-27', noun: 'schedule', nouns: 'schedules' },
  gs: { mod: 'Sales', title: 'General sale bill', reg: 'General sale register', list: 'GeneralSaleList', entry: 'GeneralSaleEntry', view: 'GeneralSaleView', no: 'BR51/26-27', noun: 'bill', nouns: 'bills' },
  sr: { mod: 'Sales', title: 'Sale return', reg: 'Sale return register', list: 'SaleReturnList', entry: 'SaleReturnEntry', view: 'SaleReturnView', no: 'R00199/26-27', noun: 'return', nouns: 'returns' },
  gp: { mod: 'Purchase', title: 'General purchase bill', reg: 'General purchase register', list: 'GeneralPurchaseList', entry: 'GeneralPurchaseEntry', view: 'GeneralPurchaseView', no: 'GENU00221/26-27', noun: 'bill', nouns: 'bills' },
  pr: { mod: 'Purchase', title: 'Purchase return', reg: 'Purchase return register', list: 'PurchaseReturnList', entry: 'PurchaseReturnEntry', view: 'PurchaseReturnView', no: 'PRT00056/26-27', noun: 'return', nouns: 'returns' }
};
const TITLE = (s) => String(s).toLowerCase().replace(/(^|[\s(.\-/&])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(Llp|Pvt|Ltd|P)\b/g, (w) => w.toUpperCase()).replace(/\bLtd\b/gi, 'Ltd');
const PARTIES = {
  ds: ['VSRK TEXTILES', 'SHIVAM TEXTILES', 'VIJAY ENTERPRISE', 'KIRTI TEXTILES', 'MAHESH TEXTILES', 'LALIT TEXTILES', 'SHREE SAI MARKETING', 'PARMESHWAR TEXTILES', 'KHAYATI TEX', 'BALAJI TEXTILES', 'RAMDEV FASHION', 'SIYA CORPORATION', 'HARSH TEXTILES', 'KUBER BHANDARI', 'KRISHNA FILAMENT', 'BAFNA TRADERS'],
  gs: ['RELIANCE INDUSTRIES LIMITED', 'WELLKNOWN POLYESTERS P LTD', 'FILATEX INDIA LTD', 'GARDEN SILK MILLS PRIVATE LIMITED', 'GOKULANAND PETROFIBRES', 'GTX PRIVATE LIMITED'],
  sr: ['OMLY FASHION', 'DIYA TEXTILES', 'ANKIT ENTERPRISE', 'JAY VEER ENTERPRISE', 'DABHI EMPIRE', 'MANGLUM TEXTILES', 'WIZARD WEAVES', 'SILICATE YARN', 'SUNSTAR NARROW FAB', 'SHREE BHAGWATI FABRICS', 'SHLOK FASHION', 'S V TEX FAB', 'BRAHMANI SILK HOUSE', 'DHANHARI TEXTILE', 'VRUNDAVAN ALLURE', 'MAHALAXMI TEXO FAB', 'KRISHNA FASHION', 'SIYA CORPORATION', 'SHOBHNA TEXTILES', 'BAFNA TRADERS'],
  gp: ['PUROHIT HANSRAJ VELAJI', 'DISHA TEXTECH & GENERAL TRADING', 'SHEKHAWATI ROAD CARRIER', 'DURGA KANWAR', 'SWASTIK TRANSPORT SERVICE', 'UNITED GUJARAT YARN DEALERS ASSOCIATION', 'SHAURYA TEMPO SERVICE', 'MAA ROADLINES', 'LALIT ROAD CARRIER', 'TRI WORLD EXIM SERVICES LLP', 'COMMERCIAL GOODS CARRIERS'],
  pr: ['SHREE DURGA SYNTEX PVT LTD', 'VINEET SYNTHETICS PVT LTD', 'SHREE RAM YARN TRADING CO', 'GLOBAL SIZER', 'DEVIKA FIBRES (P) LTD', 'SANATHAN TEXTILES LIMITED']
};
const ITEMS = [['50/24 FDY', 'Durga', 'F1', 'SDS3001', 154.5], ['55/48 FDY', 'Durga', 'F1', 'SDS3056', 154.25], ['50/48 FDY LBS', 'Durga', 'F1', 'SDS3011', 155.5], ['75/72 Roto', 'Durga', 'A1', 'TX3545', 161.75], ['50/48 FDY NLBS', 'Durga', 'F1', 'SDS3004', 154.5], ['75/36 FDY', 'Reliance', 'A+', '316C1S', 136], ['50/36 Bright', 'Sanathan', '1ST', 'D723A2', 176.25]];
const TRANS = ['Navkar Roadlines', 'Jay Ambe Roadlines', 'Shree Maruti Cargo', 'VRL Logistics', 'Shivam Transport Services', 'Kalptaru Transport'];
const AGENTS = ['Avi M', 'Aelish', 'Henil', 'Jeki R', 'Direct', 'Pranav'];
const COLP = ['Prakash P. RTGS', 'H.M (Umta)', 'Shaileshbhai', 'Hitesh B.', 'Ajay Joshi (Bhanu)', 'Urvarshibhai'];
const CITY = [['Surat', 'Palsana'], ['Surat', 'Kamrej'], ['Surat', 'Pandesara'], ['Surat', 'Sayan'], ['Surat', 'Varachha'], ['Surat', 'Pardi']];
const rnd = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
const z2 = (n) => String(n).padStart(2, '0');
const dstr = (d) => z2(d.getUTCDate()) + '-' + z2(d.getUTCMonth() + 1) + '-' + d.getUTCFullYear();
const gstin = (r) => ['24', '26', '27'][Math.floor(r() * 3)] + 'AA' + 'ABCDFGHJKLMPR'[Math.floor(r() * 13)] + 'C' + String(1000 + Math.floor(r() * 9000)) + 'K1Z' + 'ABCDEFGH'[Math.floor(r() * 8)];

function makeRows(kind) {
  const r = rnd({ ds: 11, gs: 23, sr: 37, gp: 41, pr: 53 }[kind]);
  const P = PARTIES[kind]; const out = [];
  const N = { ds: 52, gs: 50, sr: 48, gp: 46, pr: 40 }[kind];
  const start = Date.UTC(2026, 3, 6);
  for (let i = 0; i < N; i++) {
    const dt = new Date(start + Math.floor((i / N) * 200 + r() * 3) * 864e5);
    const p = TITLE(P[Math.floor(r() * P.length)]);
    if (kind === 'ds') {
      const it = ITEMS[Math.floor(r() * 5)]; const ct = [12, 16, 24, 25, 26, 32][Math.floor(r() * 6)]; const q = Math.round(ct * (38 + r() * 4) * 1000) / 1000;
      const st = ['Open', 'Open', 'Hold', 'Close', 'Close', 'Close', 'Cancel'][Math.floor(r() * 7)];
      out.push({ no: 'DS' + (24265 - N + i + 1) + '/26-27', dt: dstr(dt), p, dp: TITLE(P[Math.floor(r() * P.length)]), sup: 'Shree Durga Syntex', it: it[0], br: it[1], gr: it[2], lot: it[3], ct, q, rate: it[4], pch: '2326057' + String(100 + i), pinv: '2526057' + String(300 + i), st, appr: st === 'Hold' ? 'Pending' : 'Approved', lr: r() > 0.6 ? 'LR-' + (41000 + i * 7) : '', addr: ['15 to 20, Sahjanand Ind.', '6-7 Raj Ind. Estate', '28 Vishal Nagar', '42 Tirupati Ind.', '138 Harikrupa Ind.', 'Block C, Laxmi Ind.'][Math.floor(r() * 6)], amt: q * it[4] });
    } else if (kind === 'gs') {
      const amt = Math.round(800 + r() * (r() > 0.85 ? 2600000 : 380000));
      const st = r() > 0.7 ? 'Paid' : r() > 0.2 ? 'Unpaid' : 'Part paid';
      out.push({ no: 'BR' + z2(i + 1) + '/26-27', dt: dstr(dt), inv: 'BR' + z2(i + 1) + '/26-27', p: p + ' (Bro)', gst: gstin(r), pcs: 0, wt: 0, meter: Math.round(amt * (6 + r() * 900)) / 1000, amt, st, rcm: 'No', so: '', adj: '', einv: 'No', lock: r() > 0.9 ? 'Yes' : 'No', veh: '', tr: '' });
    } else if (kind === 'gp') {
      const svc = r() > 0.4; const amt = Math.round(800 + r() * (svc ? 120000 : 260000)); const wt = svc ? Math.round(amt * (0.4 + r())) : Math.round(r() * 4000);
      out.push({ no: 'GENU' + String(i + 1).padStart(5, '0') + '/26-27', dt: dstr(dt), inv: r() > 0.5 ? 'L' + (13000 + Math.floor(r() * 900)) : String(Math.floor(r() * 500)), p: TITLE(P[Math.floor(r() * P.length)]) + (svc ? ' (Transporter)' : ''), gst: gstin(r), pcs: svc ? 0 : Math.round(r() * 4000), wt, meter: wt, amt, st: r() > 0.6 ? 'Paid' : 'Unpaid', rcm: svc ? 'Yes' : 'No', so: '', adj: '', lock: r() > 0.85 ? 'Yes' : 'No' });
    } else if (kind === 'sr') {
      const it = ITEMS[Math.floor(r() * ITEMS.length)]; const pcs = [1, 2, 6, 12, 22, 24, 32, 34, 36, 52, 72][Math.floor(r() * 11)]; const wt = Math.round(pcs * (26 + r() * 20) * 1000) / 1000; const rate = Math.round((110 + r() * 75) * 100) / 100;
      const c = CITY[Math.floor(r() * CITY.length)]; const ag = AGENTS[Math.floor(r() * AGENTS.length)];
      out.push({ no: 'R' + String(i + 1).padStart(5, '0') + '/26-27', dt: dstr(dt), p, it: it[0], pcs, wt, amt: Math.round(wt * rate), rate, remark: r() > 0.85 ? 'Shade variation' : '', colp: COLP[Math.floor(r() * COLP.length)], adj: r() > 0.25 ? 'GU' + String(400 + Math.floor(r() * 40000)).padStart(5, '0') + '/26-27' : '', adjdt: dstr(new Date(dt.getTime() - Math.floor(r() * 40) * 864e5)), lr: r() > 0.8 ? String(11000 + Math.floor(r() * 900)) : '', veh: 'GJ' + ['19X', '16', '05B', '03B', '19Y'][Math.floor(r() * 5)] + '-' + (1000 + Math.floor(r() * 8999)), bk: ag, city: c[0], area: c[1], state: 'Gujarat', sp: ['Manoj', 'Aelish', 'Avi M'][Math.floor(r() * 3)], tr: TRANS[Math.floor(r() * TRANS.length)], irn: Math.floor(r() * 0xffffff).toString(16) + '…', sign: r() > 0.78 ? 'Received' : 'Pending' });
    } else {
      const it = ITEMS[Math.floor(r() * ITEMS.length)]; const pcs = [1, 2, 8, 13, 16, 22, 24, 31, 34, 35, 60, 69][Math.floor(r() * 12)]; const wt = Math.round(pcs * (28 + r() * 6) * 1000) / 1000; const rate = Math.round((120 + r() * 45) * 100) / 100;
      out.push({ no: 'PRT' + String(i + 1).padStart(5, '0') + '/26-27', dt: dstr(dt), inv: 'R' + String(i + 1).padStart(5, '0') + '/26-27', p, it: it[0], pcs, wt, amt: Math.round(wt * rate * 1.05), adj: r() > 0.55 ? 'DO26' + String(11031000 + Math.floor(r() * 9000)) : '', adjdt: r() > 0.5 ? dstr(new Date(dt.getTime() - Math.floor(r() * 30) * 864e5)) : '', gst: gstin(r), tr: TRANS[Math.floor(r() * TRANS.length)], st: r() > 0.5 ? 'Adjusted' : 'Pending' });
    }
  }
  return out.reverse();
}

    this._vd = { KINDS, makeRows, TITLE }; return this._vd; }
  componentDidMount() {
    if (this.props.mode !== 'view') return;
    const key = 'yf-view-' + (this.props.kind || 'ds');
    const rd = () => { try { const raw = window.localStorage.getItem(key); if (raw && raw !== this._raw) { this._raw = raw; this.setState({ rec: JSON.parse(raw), saved: false }); } } catch (e) {} };
    this._rd = rd; rd(); this._iv = setInterval(rd, 700);
    try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this._iv); try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }
  renderVals() {
    const theme = this.props.theme ?? 'dark'; const sfx = theme === 'light' ? 'Light' : '';
    const kind = this.props.kind || 'ds'; const view = this.props.mode === 'view';
    const { KINDS, makeRows } = this.VD(); const K = KINDS[kind];
    const inr = (n, d) => { const s = Number(n || 0).toFixed(d); let [i, f] = s.split('.'); let neg = i[0] === '-'; if (neg) i = i.slice(1); let l3 = i.slice(-3), rest = i.slice(0, -3); if (rest) l3 = ',' + l3; rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); return (neg ? '-' : '') + rest + l3 + (f ? '.' + f : ''); };
    const REC = view ? (this.state.rec || makeRows(kind)[0]) : null;
    // ---- header fields  [label, value, type, unit / alternative, role]
    const F = (l, v, t, x, role) => ({ l, v, t: t || 'in', x: x || '', role: role || '' });
    const FIELDS = {
      ds: [['Schedule', [F('Book', 'Dispatch schedule', 'sel', 'Dispatch schedule · job work'), F('Sch. no.', K.no, 'ro', '', 'no'), F('Sch. date', '24-10-2026', 'in', '', 'dt'), F('Order no.', '', 'in', 'e.g. SAL11838'), F('Order date', '', 'in', 'dd-mm-yyyy')]],
           ['Party', [F('Party', 'Shivam Textiles', 'sel', 'Balaji Textiles', 'party'), F('Delivery party', 'Same as party', 'sel', 'Balaji Textiles · Unit 2'), F('Supplier', 'Shree Durga Syntex', 'sel', 'Reliance Industries'), F('Agent', 'Direct', 'sel', 'Avi M'), F('Sales person', 'Manoj', 'sel', 'Avi M')]],
           ['Dispatch', [F('Transporter', 'Navkar Roadlines', 'sel', 'VRL Logistics'), F('Vehicle no.', '', 'in', 'GJ-05-AB-1234'), F('Del. date', '25-10-2026'), F('Credit days', '15', 'in', 'days'), F('Challan no. · date', '', 'in', 'CH-1181 · 24-10-2026')]]],
      gs: [['Bill', [F('Book', 'Brokerage income (Umiya)', 'sel', 'General sale (Umiya)'), F('Entry no.', K.no, 'ro', '', 'no'), F('Sale date', '24-10-2026', 'in', '', 'dt'), F('Inv. no.', K.no, 'in', '', 'inv'), F('Inv. date', '24-10-2026'), F('Advance settings', 'None', 'sel', 'Reverse charge')]],
           ['Party', [F('Party', 'Reliance Industries Ltd (Bro Silvassa)', 'sel', 'Wellknown Polyesters P Ltd', 'party'), F('Delivery party', 'Same as party', 'sel', 'Other'), F('Agent', 'Direct', 'sel', 'Avi M'), F('Sales person', 'Avi M', 'sel', 'Manoj'), F('Credit days', '30', 'in', 'days'), F('Due date', '23-11-2026', 'ro')]],
           ['Tax & account', [F('TCS applicability', 'Not applicable', 'sel', 'Applicable 0.1%'), F('D.O. no.', '', 'in', 'Delivery order no.'), F('Credit account', 'Brokerage income', 'sel', 'Commission income'), F('Collection person', 'Prakash P. RTGS', 'sel', 'Hitesh B.'), F('Currency', 'INR', 'sel', 'USD')]]],
      gp: [['Bill', [F('Book', 'General purchase (Umiya)', 'sel', 'Expense purchase'), F('Entry no.', K.no, 'ro', '', 'no'), F('Rec. date', '24-10-2026', 'in', '', 'dt'), F('Inv. no.', '', 'in', 'Supplier invoice no.', 'inv'), F('Inv. date', '24-10-2026'), F('Advance settings', 'None', 'sel', 'Reverse charge')]],
           ['Party', [F('Party', 'Swastik Transport Service (Transporter)', 'sel', 'Purohit Hansraj Velaji', 'party'), F('Delivery party', 'Our godown · Sachin GIDC', 'sel', 'Direct'), F('Agent', 'Direct', 'sel', 'Henil'), F('Sales person', '', 'sel', 'Meera Patel'), F('Credit days', '15', 'in', 'days'), F('Due date', '08-11-2026', 'ro')]],
           ['Tax & account', [F('TCS applicability', 'Not applicable', 'sel', 'Applicable'), F('D.O. no.', '', 'in', 'Delivery order no.'), F('Debit account', 'Freight inward', 'sel', 'Packing material'), F('T.D.S.', '194C · 2%', 'sel', 'None'), F('Currency', 'INR', 'sel', 'USD')]]],
      sr: [['Return', [F('Book', 'Sales yarn return', 'sel', 'Sales return · job work'), F('Bill no.', K.no, 'ro', '', 'no'), F('Bill date', '24-10-2026', 'in', '', 'dt'), F('Is TCS?', 'No', 'sel', 'Yes'), F('Credit days', '1', 'in', 'days'), F('Due date', '25-10-2026', 'ro')]],
           ['Party', [F('Party', 'Omly Fashion (34-35)', 'sel', 'Diya Textiles', 'party'), F('Delivery party', 'Same as party', 'sel', 'Other'), F('Agent', 'Direct', 'sel', 'Avi M'), F('Party group', 'Omly Fashion', 'ro'), F('Sales person', 'Manoj', 'sel', 'Aelish')]],
           ['Reference', [F('Against sale bill', 'GU00425/26-27', 'sel', 'GU00830/26-27'), F('Order no.', 'SAL02722', 'in'), F('Transporter', 'Navkar Roadlines', 'sel', 'VRL Logistics'), F('L.R. no.', '', 'in', 'LR no.'), F('Vehicle no.', 'GJ19X-4120')]]],
      pr: [['Return', [F('Book', 'Purchase yarn return', 'sel', 'Purchase return · job work'), F('Entry no.', K.no, 'ro', '', 'no'), F('Rec. date', '24-10-2026', 'in', '', 'dt'), F('Inv. no.', K.no, 'in', '', 'inv'), F('Inv. date', '24-10-2026'), F('TCS applicability', 'Not applicable', 'sel', 'Applicable')]],
           ['Party', [F('Party', 'Shree Durga Syntex Pvt Ltd', 'sel', 'Sanathan Textiles Limited', 'party'), F('Delivery party', 'Same as party', 'sel', 'Other'), F('Agent', 'Direct', 'sel', 'Henil'), F('Sales person', '', 'sel', 'Meera Patel'), F('Credit days', '30', 'in', 'days'), F('Due date', '23-11-2026', 'ro')]],
           ['Reference', [F('Against pur. bill', 'PUR21326/26-27', 'sel', 'PUR21311/26-27'), F('Debit note no.', 'DN-0441', 'in'), F('Transporter', 'Jay Ambe Roadlines', 'sel', 'Navkar Roadlines'), F('L.R. no.', 'LR-4410'), F('Vehicle no.', 'GJ05-CT-1184')]]]
    }[kind];
    const recVal = (f) => { if (!REC) return f.role === 'party' ? 'Select party…' : f.v; if (f.role === 'no') return REC.no; if (f.role === 'dt') return REC.dt; if (f.role === 'party') return REC.p; if (f.role === 'inv') return REC.inv || REC.no; return f.v; };
    const groups = FIELDS.map(([t, rows], gi) => ({ t, rows: rows.map((f) => { const v = (!REC && gi === 1 && f.t !== 'sel') ? '' : (!REC && gi === 1 && f.t === 'sel' && /Sales person/.test(f.l)) ? 'Select sales person' : recVal(f); const unit = f.t === 'in' && f.x === 'days' ? 'days' : ''; return { l: f.l, v, alt: f.x, isSel: f.t === 'sel', isIn: f.t === 'in', isRo: f.t === 'ro', ph: f.t === 'in' && f.x !== 'days' ? f.x : '', u: unit }; }) }));
    // ---- item columns  [key, label, right, total, decimals, input width]
    const C = (k, l, o) => Object.assign({ k, l, r: 0, t: 0, d: 2, w: 0 }, o || {});
    const RT = (d) => ({ r: 1, t: 1, d }), RN = (d) => ({ r: 1, d });
    const GST = [C('basic', 'Basic amt', RT(2)), C('disp', 'Dis %', RN(2)), C('dis', 'Dis \u20b9', RT(2)), C('frp', 'Freight %', RN(2)), C('fr', 'Freight \u20b9', RT(2)), C('tax', 'Taxable', RT(2)), C('igp', 'IGST %', RN(2)), C('ig', 'IGST \u20b9', RT(2)), C('cgp', 'CGST %', RN(2)), C('cg', 'CGST \u20b9', RT(2)), C('sgp', 'SGST %', RN(2)), C('sg', 'SGST \u20b9', RT(2))];
    const COLS = {
      ds: [C('name', 'Item name', { w: 150 }), C('brand', 'Brand'), C('lot', 'Lot no.'), C('hsn', 'HSN'), C('pid', 'Purchase id'), C('pinv', 'Pur. inv. no.'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('unit', 'Unit', { w: 56 }), C('grade', 'Grade', { w: 56 }), C('ordq', 'Ord. qty', RT(3)), C('salq', 'Sal. qty', RT(3)), C('rate', 'Rate', RN(2)), C('carton', 'Carton', RT(0)), C('schq', 'Sch. qty', RT(3)), C('pschq', 'Pending sch. qty', RT(3)), C('lr', 'LR no.'), C('remark', 'Remark'), C('box', 'Box / pallet'), C('cops', 'Cops', RT(0)), C('amt', 'Amount', RT(2))],
      gs: [C('code', 'Item code'), C('name', 'Item name', { w: 160 }), C('hsn', 'HSN'), C('unit', 'Unit', { w: 56 }), C('remark', 'Remark'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('qty', 'Qty', RT(2)), C('rate', 'Rate', RN(2))].concat(GST, [C('tcp', 'TCS %', RN(3)), C('tc', 'TCS \u20b9', RT(2)), C('amt', 'Amount', RT(2))]),
      gp: [C('code', 'Item code'), C('name', 'Item name', { w: 160 }), C('brand', 'Brand'), C('grade', 'Grade', { w: 56 }), C('hsn', 'HSN'), C('unit', 'Unit', { w: 56 }), C('lr', 'L.R. no.'), C('remark', 'Remark'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('lot', 'Lot no.'), C('carton', 'Carton', RT(0)), C('cops', 'Cops', RT(0)), C('qty', 'Weight / qty', RT(3)), C('rate', 'Rate', RN(2))].concat(GST, [C('amt', 'Amount', RT(2))]),
      sr: [C('code', 'Item id'), C('name', 'Item name', { w: 150 }), C('pid', 'Purchase id'), C('brand', 'Brand'), C('pinv', 'Pur. inv. no.'), C('hsn', 'HSN'), C('grade', 'Grade', { w: 56 }), C('unit', 'Unit', { w: 56 }), C('remark', 'Remark'), C('chno', 'Challan no.'), C('chdt', 'Challan date'), C('lot', 'Lot no.'), C('carton', 'Carton', RT(0)), C('cops', 'Cops', RT(0)), C('qty', 'Weight', RT(3)), C('rate', 'Rate', RN(2))].concat(GST, [C('amt', 'Amount', RT(2))]),
      pr: null
    };
    COLS.pr = COLS.gp;
    const cols = COLS[kind];
    const L = {
      ds: [{ name: '50/24 FDY', brand: 'Durga', lot: 'SDS3001', hsn: '5402', pid: 'P-2214', pinv: '2526057', chno: 'CH-1181', chdt: '24-10-2026', unit: 'Kg', grade: 'F1', ordq: 5000, salq: 3995.98, rate: 154.5, carton: 24, schq: 1004.02, lr: '', remark: '', box: 'Carton', cops: 96 },
           { name: '55/48 FDY', brand: 'Durga', lot: 'SDS3056', hsn: '5402', pid: 'P-2219', pinv: '2526061', chno: 'CH-1181', chdt: '24-10-2026', unit: 'Kg', grade: 'F1', ordq: 3000, salq: 2018.92, rate: 154.25, carton: 25, schq: 981.08, lr: '', remark: 'Urgent', box: 'Carton', cops: 100 }],
      gs: [{ code: 'BRK-01', name: 'Brokerage · yarn sale', hsn: '996111', unit: 'Nos', remark: 'Oct-26', chno: '', chdt: '', qty: 1, rate: 8220, disp: 0, frp: 0, gst: 18 },
           { code: 'BRK-02', name: 'Brokerage · FDY lots', hsn: '996111', unit: 'Nos', remark: 'Oct-26', chno: '', chdt: '', qty: 1, rate: 32809, disp: 0, frp: 0, gst: 18 }],
      gp: [{ code: 'GP-014', name: 'GTA freight · Surat–Silvassa', brand: '', grade: '', hsn: '996511', unit: 'Trip', lr: 'L13029', remark: '4 trips', chno: '', chdt: '', lot: '', carton: 0, cops: 0, qty: 4, rate: 7341.5, disp: 0, frp: 0, gst: 5 },
           { code: 'GP-022', name: 'Packing cartons · 5 ply', brand: 'Om Pack', grade: '', hsn: '4819', unit: 'Nos', lr: '', remark: '', chno: 'CH-77', chdt: '22-10-2026', lot: '', carton: 0, cops: 0, qty: 400, rate: 21.5, disp: 2, frp: 0, gst: 18 }],
      sr: [{ code: 'I-501', name: '50/48 FDY', pid: 'P-2201', brand: 'Reliance', pinv: 'RIL/88761', hsn: '5402', grade: 'A+', unit: 'Kg', remark: 'Shade issue', chno: 'CH-990', chdt: '09-04-2026', lot: '338C1M', carton: 6, cops: 72, qty: 345.58, rate: 152, disp: 0, frp: 0, gst: 5 },
           { code: 'I-418', name: '75/36 FDY', pid: 'P-2188', brand: 'Reliance', pinv: 'RIL/88540', hsn: '5402', grade: 'A+', unit: 'Kg', remark: 'Weak cops', chno: 'CH-987', chdt: '08-04-2026', lot: '316C1S', carton: 2, cops: 24, qty: 118.4, rate: 138, disp: 0, frp: 0, gst: 5 }],
      pr: [{ code: 'I-705', name: '75/72 Roto', brand: 'Shree Durga', grade: '1ST', hsn: '5402', unit: 'Kg', lr: 'LR-4410', remark: 'Short lot', chno: '', chdt: '', lot: 'TX3545', carton: 34, cops: 408, qty: 1010.34, rate: 142.74, disp: 0, frp: 0, gst: 5 },
           { code: 'I-702', name: '50/24 FDY', brand: 'Shree Durga', grade: 'F1', hsn: '5402', unit: 'Kg', lr: 'LR-4410', remark: '', chno: '', chdt: '', lot: 'SDS3001', carton: 12, cops: 144, qty: 351.22, rate: 154.5, disp: 0, frp: 0, gst: 5 }]
    }[kind].filter(() => view).map((x) => { const o = Object.assign({}, x);
      if (kind === 'ds') { o.pschq = Math.max(0, Math.round((o.ordq - o.salq - o.schq) * 1000) / 1000); o.amt = o.schq * o.rate; return o; }
      o.basic = o.qty * o.rate; o.dis = o.basic * o.disp / 100; o.fr = o.basic * o.frp / 100; o.tax = o.basic - o.dis + o.fr;
      const inter = kind === 'gp' && o.code === 'GP-014' ? false : false;
      o.igp = inter ? o.gst : 0; o.ig = inter ? o.tax * o.gst / 100 : 0; o.cgp = inter ? 0 : o.gst / 2; o.sgp = o.cgp; o.cg = inter ? 0 : o.tax * o.gst / 200; o.sg = o.cg; o.tcp = 0; o.tc = 0; o.amt = o.tax + o.ig + o.cg + o.sg + o.tc; return o; });
    const fmt = (c, v) => (typeof v === 'number' ? inr(v, c.d) : (v === '' || v == null ? '\u2014' : v));
    const lines = L.map((o, i) => ({ n: String(i + 1), cells: cols.map((c) => ({ v: fmt(c, o[c.k]), cls: (c.r ? 'r' : '') + (c.k === 'name' ? ' nm' : '') + (['hsn', 'chno', 'chdt', 'pid', 'pinv', 'lr', 'remark', 'code'].indexOf(c.k) >= 0 ? ' t2' : '') })) }));
    const tot = (k) => L.reduce((a, o) => a + (Number(o[k]) || 0), 0);
    const foot = cols.map((c, i) => ({ cls: c.r ? 'r' : '', v: i === 0 ? 'Total · ' + L.length + ' lines' : c.t ? inr(tot(c.k), c.d) : '' }));
    // ---- bottom boxes
    const KV = (a, b, big) => ({ a, b, c: big ? 'kv big' : 'kv' });
    const FL = (a, b, ph) => ({ a, b: b || '', ph: ph || '' });
    let boxes;
    if (kind === 'ds') {
      boxes = [{ t: 'Delivery', kv: [], gs: 'grid-template-columns: 1fr', fl: [FL('Delivery address', '28 Vishal Nagar, Sachin GIDC, Surat'), FL('Remarks', '', 'Shown on schedule print'), FL('Grade detail', 'F1 · 49 cartons')] },
               { t: 'Carton detail', kv: [KV('Cartons', inr(tot('carton'), 0)), KV('Cops', inr(tot('cops'), 0)), KV('Box / pallet', 'Carton'), KV('Avg kg / carton', inr(tot('schq') / Math.max(tot('carton'), 1), 3))], fl: [], gs: '' },
               { t: 'Schedule summary', kv: [KV('Ordered qty', inr(tot('ordq'), 3) + ' kg'), KV('Already sold', inr(tot('salq'), 3) + ' kg'), KV('Pending after this', inr(tot('pschq'), 3) + ' kg'), KV('Schedule amount', '\u20b9 ' + inr(tot('amt'), 2), 1)], fl: [], gs: '' }];
    } else {
      const g = tot('cg') + tot('sg') + tot('ig'); const net = Math.round(tot('amt'));
      const taxKV = [KV('Total CGST', '\u20b9 ' + inr(tot('cg'), 2)), KV('Total SGST', '\u20b9 ' + inr(tot('sg'), 2)), KV('Total IGST', '\u20b9 ' + inr(tot('ig'), 2)), KV('Total taxable', '\u20b9 ' + inr(tot('tax'), 2))]
        .concat(kind === 'gp' ? [KV('T.D.S. basic', '\u20b9 ' + inr(tot('tax'), 2)), KV('T.D.S. 2%', '\u20b9 ' + inr(tot('tax') * 0.02, 2))] : [KV('Total TCS', '\u20b9 0.00')], [KV('Average rate', inr(tot('basic') / Math.max(tot('qty'), 1), 2))]);
      const other = [FL('Transporter', kind === 'gs' ? '' : 'Navkar Roadlines'), FL('L.R. no.', '', 'LR no.'), FL('L.R. date', '', 'dd-mm-yyyy'), FL('No. of parcel', ''), FL('Driver name', ''), FL('E-way bill no.', '', '12 digits'), FL('Vehicle no.', '', 'GJ-05-AB-1234'), FL(kind === 'gp' || kind === 'pr' ? 'Godown' : 'IRN no.', kind === 'gp' || kind === 'pr' ? 'Sachin GIDC' : '')];
      boxes = [{ t: 'Tax summary', kv: taxKV, fl: [], gs: '' }, { t: 'Other details', kv: [], fl: other, gs: '' },
               { t: 'Amount', kv: [KV('Quantity', inr(tot('qty'), kind === 'gs' ? 2 : 3)), KV('Gross amount', '\u20b9 ' + inr(tot('basic'), 2)), KV('Discount', '\u2212 \u20b9 ' + inr(tot('dis'), 2)), KV('GST', '\u20b9 ' + inr(g, 2)), KV('Round off', (net - tot('amt') >= 0 ? '+ ' : '\u2212 ') + inr(Math.abs(net - tot('amt')), 2)), KV('Net amount', '\u20b9 ' + inr(net, 2), 1)], fl: [], gs: '' }];
    }
    const HB = { ds: ['Pending orders', 'Outstanding group-wise'], gs: ['Pending GRN', 'Order detail'], gp: ['Pending GRN', 'Pending approval'], sr: ['E-invoice', 'Pending challans'], pr: ['Pending GRN', 'Sales detail'] }[kind];
    const saved = this.state.saved;
    return {
      theme, kind, listHref: K.list + sfx + '.dc.html', aiPage: { ds: 'so', gs: 'disp', sr: 'disp', gp: 'pb', pr: 'pb' }[kind],
      crumb: view ? K.reg : K.mod + ' \u00b7 ' + K.title, title: view ? REC.no : 'New ' + K.title.charAt(0).toLowerCase() + K.title.slice(1),
      tagL: view ? (REC.st || REC.sign || 'Saved') : 'New', tagC: 'tag' + (view ? ' t-blue' : ''),
      hbtn: HB, detailsT: { ds: 'Schedule details', gs: 'Bill details', gp: 'Bill details', sr: 'Return details', pr: 'Return details' }[kind],
      groups, cols: cols.map((c, i) => ({ l: c.l, cls: c.r ? 'r' : '', ph: i === 0 ? (kind === 'ds' ? 'Search item' : 'Code') : (i === 1 && kind !== 'ds' ? 'Search item' : ''), dv: c.k === 'unit' ? (kind === 'gs' ? 'Nos' : 'Kg') : '', w: c.w ? 'width: ' + c.w + 'px' : (c.r ? 'width: 84px' : 'width: 96px') })),
      lines, nextN: String(L.length + 1), foot: L.length ? foot : cols.map((c2, i) => ({ cls: c2.r ? 'r' : '', v: i === 0 ? 'Total' : (c2.t ? inr(0, c2.d) : '') })), boxes,
      closeL: view ? 'Close' : 'Cancel', printL: view ? 'Print' : 'Save & print', saveL: view ? (saved ? '\u2713 Updated' : 'Update') : (saved ? '\u2713 Saved' : 'Save'),
      note: view ? (saved ? 'Changes saved to ' + REC.no : 'Editing ' + REC.no) : (saved ? 'Saved as ' + K.no : ''), save: () => this.setState({ saved: true })
    };
  }
}

/* ----- view ----- */
class VoucherEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active={v.kind} />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <DcLink className="m" href={v.listHref}>
                {v.crumb}
              </DcLink>
              <span className="m">
                /
              </span>
              <span>
                {v.title}
              </span>
              <span className={v.tagC}>
                {v.tagL}
              </span>
            </div>
            <DcLink className="btn" href={v.listHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M8 6h13" />
                <path d="M8 12h13" />
                <path d="M8 18h13" />
                <path d="M3 6h.01" />
                <path d="M3 12h.01" />
                <path d="M3 18h.01" />
              </svg>
              Show record
            </DcLink>
            {' '}
            {(v.hbtn || []).map((b, $index) => (
              <Fragment key={$index}>
                <button className="btn" type="button">
                  {b}
                </button>
              </Fragment>
            ))}
            {' '}
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Upload
            </button>
          </header>
          <div className="ent">
            <section className="sec">
              <div className="sh">
                <h2>
                  {v.detailsT}
                </h2>
              </div>
              <div className="props">
                {(v.groups || []).map((g, $index) => (
                  <Fragment key={$index}>
                    <div className="pg">
                      <div className="pgt">
                        {g?.t}
                      </div>
                      {(g?.rows || []).map((f, $index) => (
                        <Fragment key={$index}>
                          <div className="pr">
                            <label>
                              {f?.l}
                            </label>
                            {f?.isSel ? (
                              <>
                                <select className="pv" aria-label={f?.l}>
                                  <option>
                                    {f?.v}
                                  </option>
                                  <option>
                                    {f?.alt}
                                  </option>
                                </select>
                              </>
                            ) : null}
                            {f?.isIn ? (
                              <>
                                <input className="pv" type="text" value={f?.v} placeholder={f?.ph} aria-label={f?.l} />
                              </>
                            ) : null}
                            {f?.isRo ? (
                              <>
                                <input className="pv" type="text" value={f?.v} readOnly aria-label={f?.l} />
                              </>
                            ) : null}
                            <span className="unit">
                              {f?.u}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>
            </section>
            <section className="sec items">
              <div className="sh">
                <h2>
                  Items
                </h2>
              </div>
              <div className="tw">
                <table className="it">
                  <thead>
                    <tr>
                      <th>
                        #
                      </th>
                      {(v.cols || []).map((c, $index) => (
                        <Fragment key={$index}>
                          <th className={c?.cls}>
                            {c?.l}
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(v.lines || []).map((r, $index) => (
                      <Fragment key={$index}>
                        <tr>
                          <td className="n">
                            {r?.n}
                          </td>
                          {(r?.cells || []).map((x, $index) => (
                            <Fragment key={$index}>
                              <td className={x?.cls}>
                                {x?.v}
                              </td>
                            </Fragment>
                          ))}
                        </tr>
                      </Fragment>
                    ))}
                    <tr>
                      <td className="n">
                        {v.nextN}
                      </td>
                      {(v.cols || []).map((c, $index) => (
                        <Fragment key={$index}>
                          <td>
                            <input className="cin" type="text" aria-label={c?.l} placeholder={c?.ph} value={c?.dv} style={sx(c?.w)} />
                          </td>
                        </Fragment>
                      ))}
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td />
                      {(v.foot || []).map((x, $index) => (
                        <Fragment key={$index}>
                          <td className={x?.cls}>
                            {x?.v}
                          </td>
                        </Fragment>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
            <section className="sec">
              <div className="cols3">
                {(v.boxes || []).map((b, $index) => (
                  <Fragment key={$index}>
                    <div className="box">
                      <h3>
                        {b?.t}
                      </h3>
                      {(b?.kv || []).map((k, $index) => (
                        <Fragment key={$index}>
                          <div className={k?.c}>
                            <span>
                              {k?.a}
                            </span>
                            <span>
                              {k?.b}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                      <div className="flg" style={sx(b?.gs)}>
                        {(b?.fl || []).map((k, $index) => (
                          <Fragment key={$index}>
                            <div className="fl">
                              <label>
                                {k?.a}
                              </label>
                              <input className="inp" type="text" value={k?.b} placeholder={k?.ph} aria-label={k?.a} />
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </section>
          </div>
          <div className="actbar">
            <select className="inp" aria-label="More actions">
              <option>
                More…
              </option>
              <option>
                Party details
              </option>
              <option>
                Adjustment details
              </option>
            </select>
            {' '}
            <button className="btn no" type="button">
              Delete
            </button>
            <div style={{"flex":"1"}} />
            <span className="muted" style={{"fontSize":"13px"}}>
              {v.note}
            </span>
            {' '}
            <DcLink className="btn gh" href={v.listHref}>
              {v.closeL}
            </DcLink>
            {' '}
            <button className="btn" type="button">
              {v.printL}
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.save}>
              {v.saveL}
            </button>
          </div>
        </div>
        <div className="aiw">
          <Assistant page={v.aiPage} />
        </div>
      </div>
      </>
    );
  }
}

export default function VoucherEntry(props) {
  const theme = useTheme();
  return <VoucherEntryView {...props} theme={theme} />;
}
