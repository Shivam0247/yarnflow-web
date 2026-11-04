/**
 * Every report as one uniform table — { title, sub, cols, rows, total } — so a single
 * viewer (Reports screen) can show, print and export all of them.
 */
import { sql } from 'drizzle-orm';
import { notFound } from '../lib/errors.js';
import { daysBetween, today } from '../lib/dates.js';
import { r2, sum } from '../lib/money.js';
import * as an from './analysis.js';
import type { Ctx } from './context.js';
import { listDocs, loadFy } from './documents.js';
import * as rep from './reports.js';
import { TYPES } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export interface Col { k: string; l: string; t?: 'num' | 'qty' | 'money' | 'pct' | 'date' }
export interface Table { key: string; title: string; sub: string; cols: Col[]; rows: Row[]; total?: Row; note?: string }

const C = (k: string, l: string, t?: Col['t']): Col => ({ k, l, t });
const totals = (rows: Row[], cols: Col[], label: string) => {
  const t: Row = { [cols[0].k]: label };
  for (const c of cols) if (c.t === 'money' || c.t === 'qty' || c.t === 'num') t[c.k] = r2(sum(rows, (r) => Number(r[c.k]) || 0));
  return t;
};

export const REPORTS: Record<string, string> = {
  'sales-register': 'Sales register', 'party-sales': 'Party-wise sales', 'yarn-sales': 'Yarn-wise sales', 'broker-sales': 'Broker-wise sales', 'salesperson-sales': 'Sales person-wise sales',
  'month-sales': 'Month-wise sales', brokerage: 'Broker commission', 'pending-so': 'Pending sales orders',
  'purchase-register': 'Purchase register', 'mill-purchase': 'Mill-wise purchase', 'rate-history': 'Rate history', 'pending-po': 'Pending purchase orders', tds: 'TDS 194Q', tcs: 'TCS collected',
  'day-book': 'Day book', 'trial-balance': 'Trial balance', 'profit-loss': 'Profit & loss', 'balance-sheet': 'Balance sheet', 'group-summary': 'Group summary',
  'collections-person': 'Collection person-wise collection', 'collections-sales': 'Sales person-wise collection', 'collections-mode': 'Collection by mode', 'collections-month': 'Month-wise collection', payments: 'Payments made',
  interest: 'Interest on overdue bills', 'payment-behaviour': 'Payment behaviour',
  'stock-summary': 'Stock summary', 'lot-stock': 'Lot-wise stock', 'slow-moving': 'Slow-moving yarn', 'stock-valuation': 'Stock valuation', reorder: 'Reorder suggestions',
  gstr1: 'GSTR-1', gstr3b: 'GSTR-3B', 'gstr2b': 'GSTR-2B reconciliation', hsn: 'HSN summary', 'ewb-register': 'E-way bill register'
};

export async function reportTable(ctx: Ctx, key: string, q: Row): Promise<Table> {
  const title = REPORTS[key];
  if (!title) throw notFound('Report');
  const fy = await loadFy(ctx);
  const from: string = q.from || fy.startDate;
  const to: string = q.to || (fy.endDate < today() ? fy.endDate : today());
  const asOn: string = q.asOn || to;
  const period = `${from.split('-').reverse().join('-')} to ${to.split('-').reverse().join('-')}`;
  const base = { key, title, sub: period };

  const analysis = async (side: 'sales' | 'purchase', groupBy: string, label: string) => {
    const a = await an.salesAnalysis(ctx, { side, from, to, groupBy });
    const cols = [C('label', label), C('bills', 'Bills', 'num'), C('qty', 'Qty kg', 'qty'), C('avgRate', 'Avg rate', 'money'), C('taxable', 'Taxable', 'money'), C('gst', 'GST', 'money'), C('amount', 'Amount', 'money'), C('returns', 'Returns', 'money'), C('share', 'Share %', 'pct')];
    return { ...base, cols, rows: a.rows, total: { label: 'Total', qty: a.total.qty, taxable: a.total.taxable, gst: a.total.gst, amount: a.total.amount, returns: a.total.returns, bills: sum(a.rows, (r) => r.bills) } };
  };
  const register = async (slug: string) => {
    const def = Object.values(TYPES).find((t) => t.slug === slug)!;
    const r = await listDocs(ctx, def, { from, to, pageSize: 1000 } as never);
    const rows = (r.data as Row[]).filter((x) => x.status !== 'CANCELLED').map((x) => ({ ...x, gst: r2((x.cgstAmount || 0) + (x.sgstAmount || 0) + (x.igstAmount || 0)) }));
    const cols = [C('number', 'Bill no.'), C('date', 'Date', 'date'), C('partyName', 'Party'), C('partyGstin', 'GSTIN'), C('itemNames', 'Items'), C('totalQty', 'Qty kg', 'qty'), C('taxableAmount', 'Taxable', 'money'), C('cgstAmount', 'CGST', 'money'), C('sgstAmount', 'SGST', 'money'), C('igstAmount', 'IGST', 'money'), C('netAmount', 'Net', 'money'), C('pending', 'Pending', 'money')];
    return { ...base, cols, rows, total: totals(rows, cols, rows.length + ' bills') };
  };
  const pending = async (type: 'sales' | 'purchase') => {
    const p = await an.pendingOrders(ctx, { type, groupBy: 'order', asOn });
    const rows = p.groups.flatMap((g) => g.lines.map((l: Row) => ({ ...l, age: l.ageDays })));
    const cols = [C('number', 'Order'), C('date', 'Date', 'date'), C('partyName', type === 'sales' ? 'Party' : 'Mill'), C('itemName', 'Item'), C('qty', 'Ordered', 'qty'), C('done', type === 'sales' ? 'Dispatched' : 'Received', 'qty'), C('pending', 'Pending kg', 'qty'), C('rate', 'Rate', 'money'), C('value', 'Pending value', 'money'), C('age', 'Age days', 'num')];
    return { ...base, sub: 'As on ' + asOn.split('-').reverse().join('-'), cols, rows, total: totals(rows, cols, rows.length + ' lines') };
  };
  const collections = async (side: 'receipts' | 'payments', groupBy: string, label: string) => {
    const c = await an.collections(ctx, { from, to, side, groupBy });
    const rows = c.groups.map((g) => ({ ...g, onAccount: r2(g.amount - g.adjusted) }));
    const cols = [C('key', label), C('count', 'Entries', 'num'), C('amount', 'Amount', 'money'), C('adjusted', 'Against bills', 'money'), C('onAccount', 'On account', 'money')];
    return { ...base, cols, rows, total: totals(rows, cols, 'Total') };
  };
  const stock = async () => { const s = await rep.stockSummary(ctx, { asOn }); return { ...s, rows: s.rows as Row[] }; };

  switch (key) {
    case 'sales-register': return register('sale-bills');
    case 'purchase-register': return register('purchase-bills');
    case 'party-sales': return analysis('sales', 'party', 'Party');
    case 'yarn-sales': return analysis('sales', 'item', 'Yarn');
    case 'broker-sales': return analysis('sales', 'broker', 'Broker');
    case 'salesperson-sales': return analysis('sales', 'salesPerson', 'Sales person');
    case 'month-sales': return analysis('sales', 'month', 'Month');
    case 'mill-purchase': return analysis('purchase', 'party', 'Mill');
    case 'rate-history': {
      const a = await an.salesAnalysis(ctx, { side: 'purchase', from, to, groupBy: 'item,month' });
      const rows = a.rows.map((r) => ({ item: r.keys[0], month: r.keys[1], qty: r.qty, avgRate: r.avgRate, taxable: r.taxable }));
      return { ...base, cols: [C('item', 'Yarn'), C('month', 'Month'), C('qty', 'Qty kg', 'qty'), C('avgRate', 'Avg rate', 'money'), C('taxable', 'Taxable', 'money')], rows };
    }
    case 'brokerage': {
      const b = await an.brokerage(ctx, { from, to });
      const cols = [C('brokerName', 'Broker'), C('bills', 'Bills', 'num'), C('qty', 'Qty kg', 'qty'), C('taxable', 'Sale value', 'money'), C('brokerage', 'Brokerage', 'money'), C('earned', 'Payable now (party paid)', 'money')];
      return { ...base, cols, rows: b.brokers, total: totals(b.brokers, cols, 'Total') };
    }
    case 'pending-so': return pending('sales');
    case 'pending-po': return pending('purchase');
    case 'tds': case 'tcs': {
      const t = await an.tdsTcs(ctx, { from, to });
      const rows = key === 'tds' ? t.tds : t.tcs;
      const cols = [C('number', 'Bill'), C('date', 'Date', 'date'), C('partyName', 'Party'), C('pan', 'PAN'), C('taxable', 'Taxable', 'money'), C(key === 'tds' ? 'tdsRate' : 'tcsRate', 'Rate %', 'pct'), C(key, key.toUpperCase(), 'money')];
      return { ...base, cols, rows, total: totals(rows, cols, rows.length + ' bills') };
    }
    case 'day-book': {
      const d = await an.dayBook(ctx, { from, to });
      const cols = [C('date', 'Date', 'date'), C('typeLabel', 'Voucher'), C('number', 'No.'), C('partyName', 'Party'), C('narration', 'Narration'), C('qty', 'Qty kg', 'qty'), C('amount', 'Amount', 'money'), C('createdBy', 'Entered by')];
      return { ...base, cols, rows: d.rows, total: totals(d.rows, cols, d.rows.length + ' vouchers') };
    }
    case 'trial-balance': {
      const t = await rep.trialBalance(ctx, asOn);
      const rows = t.groups.flatMap((g) => [{ name: g.name, debit: g.debit, credit: g.credit, bold: true }, ...g.accounts.map((a: Row) => ({ name: '   ' + a.name, debit: a.debit, credit: a.credit }))]);
      return { ...base, sub: 'As on ' + asOn.split('-').reverse().join('-'), cols: [C('name', 'Particulars'), C('debit', 'Debit', 'money'), C('credit', 'Credit', 'money')], rows, total: { name: 'Total' + (t.difference ? ' (difference ' + t.difference + ')' : ''), debit: t.totalDebit, credit: t.totalCredit } };
    }
    case 'profit-loss': {
      const p = await rep.profitLoss(ctx, from, to);
      const L = (name: string, amount: number, bold = false) => ({ name, amount, bold });
      const rows = [L('Opening stock', -p.openingStock), ...p.trading.expense.map((x) => L('   ' + x.name, -x.amount)), ...p.trading.income.map((x) => L('   ' + x.name, x.amount)), L('Closing stock', p.closingStock), L('Gross profit', p.grossProfit, true),
        ...p.indirect.income.map((x) => L('   ' + x.name, x.amount)), ...p.indirect.expense.map((x) => L('   ' + x.name, -x.amount)), L('Net profit', p.netProfit, true)];
      return { ...base, cols: [C('name', 'Particulars'), C('amount', 'Amount (+ income / − expense)', 'money')], rows };
    }
    case 'balance-sheet': {
      const b = await rep.balanceSheet(ctx, asOn);
      const rows = [{ name: 'LIABILITIES', bold: true }, ...b.liabilities.flatMap((g) => [{ name: g.name, amount: g.amount, bold: true }, ...g.accounts.map((a) => ({ name: '   ' + a.name, amount: a.amount }))]), { name: 'Total liabilities', amount: b.totalLiabilities, bold: true },
        { name: 'ASSETS', bold: true }, ...b.assets.flatMap((g) => [{ name: g.name, amount: g.amount, bold: true }, ...g.accounts.map((a) => ({ name: '   ' + a.name, amount: a.amount }))]), { name: 'Total assets', amount: b.totalAssets, bold: true }];
      return { ...base, sub: 'As on ' + asOn.split('-').reverse().join('-'), cols: [C('name', 'Particulars'), C('amount', 'Amount', 'money')], rows, note: b.difference ? 'Difference ' + b.difference : undefined };
    }
    case 'group-summary': {
      const g = await an.groupSummary(ctx, { asOn });
      return { ...base, sub: 'As on ' + asOn.split('-').reverse().join('-'), cols: [C('name', 'Group / account'), C('debit', 'Debit', 'money'), C('credit', 'Credit', 'money'), C('closing', 'Closing', 'money'), C('closingType', 'Dr/Cr')], rows: g.rows };
    }
    case 'collections-person': return collections('receipts', 'collectionPerson', 'Collection person');
    case 'collections-sales': return collections('receipts', 'salesPerson', 'Sales person');
    case 'collections-mode': return collections('receipts', 'mode', 'Mode');
    case 'collections-month': return collections('receipts', 'month', 'Month');
    case 'payments': return collections('payments', 'party', 'Paid to');
    case 'interest': {
      const i = await an.interest(ctx, { asOn });
      const cols = [C('partyName', 'Party'), C('bills', 'Bills', 'num'), C('pending', 'Overdue amount', 'money'), C('interest', 'Interest', 'money')];
      const rows = i.parties.map((p: Row) => ({ ...p, bills: Array.isArray(p.bills) ? p.bills.length : p.bills }));
      return { ...base, sub: 'As on ' + asOn.split('-').reverse().join('-'), cols, rows, total: totals(rows, cols, 'Total') };
    }
    case 'payment-behaviour': {
      const res = await ctx.db.execute(sql`
        select p.name as "partyName", p.credit_days as "creditDays", count(*) as bills,
          avg(greatest(0, (rv.date::date - coalesce(b.due_date, b.date)::date))) as "avgLate",
          max(greatest(0, (rv.date::date - coalesce(b.due_date, b.date)::date))) as "maxLate", sum(a.amount) as paid
        from bill_allocations a join vouchers b on b.id = a.bill_id join vouchers rv on rv.id = a.voucher_id join accounts p on p.id = b.party_id
        where b.company_id = ${ctx.companyId} and rv.type = 'RECEIPT' and rv.date between ${from} and ${to}
        group by p.name, p.credit_days order by 4 desc`);
      const rows = res.rows.map((r: Row) => ({ ...r, bills: Number(r.bills), avgLate: Math.round(Number(r.avgLate)), maxLate: Number(r.maxLate), paid: Number(r.paid) }));
      return { ...base, cols: [C('partyName', 'Party'), C('creditDays', 'Credit days', 'num'), C('bills', 'Bills paid', 'num'), C('avgLate', 'Avg days late', 'num'), C('maxLate', 'Worst delay', 'num'), C('paid', 'Paid', 'money')], rows };
    }
    case 'stock-summary': {
      const s = await stock();
      const m = new Map<string, Row>();
      for (const r of s.rows) { const g = m.get(r.itemName) ?? { itemName: r.itemName, hsn: r.hsn, qty: 0, pcs: 0, value: 0, reserved: 0, lots: 0 }; g.qty += r.qty; g.pcs += r.pcs; g.value += r.value; g.reserved += r.reserved; g.lots += 1; m.set(r.itemName, g); }
      const rows = [...m.values()].map((g) => ({ ...g, free: r2(g.qty - g.reserved), qty: r2(g.qty), value: r2(g.value) }));
      const cols = [C('itemName', 'Yarn'), C('hsn', 'HSN'), C('lots', 'Lots', 'num'), C('pcs', 'Boxes', 'num'), C('qty', 'Stock kg', 'qty'), C('reserved', 'Scheduled', 'qty'), C('free', 'Free', 'qty'), C('value', 'Value', 'money')];
      return { ...base, sub: 'As on ' + asOn.split('-').reverse().join('-'), cols, rows, total: totals(rows, cols, 'Total') };
    }
    case 'lot-stock': case 'stock-valuation': case 'slow-moving': {
      const s = await stock();
      const rows = key === 'slow-moving' ? s.rows.filter((r) => r.ageDays >= 60).sort((a, b) => b.ageDays - a.ageDays) : s.rows;
      const cols = [C('itemName', 'Yarn'), C('brand', 'Brand'), C('lotNo', 'Lot'), C('grade', 'Grade'), C('godownName', 'Godown'), C('pcs', 'Boxes', 'num'), C('qty', 'Kg', 'qty'), C('rate', 'Avg cost', 'money'), C('value', 'Value', 'money'), C('ageDays', 'Age days', 'num')];
      return { ...base, sub: 'As on ' + asOn.split('-').reverse().join('-') + (key === 'stock-valuation' ? ' · weighted average cost' : ''), cols, rows, total: totals(rows, cols, rows.length + ' lots') };
    }
    case 'reorder': {
      const [s, p] = await Promise.all([stock(), an.pendingOrders(ctx, { type: 'sales', groupBy: 'item', asOn })]);
      const items = await ctx.db.execute(sql`select id, name, min_stock as "minStock" from items where company_id = ${ctx.companyId} and is_active and not is_general`);
      const stk = new Map<string, number>(); s.rows.forEach((r) => stk.set(r.itemName, (stk.get(r.itemName) ?? 0) + r.free));
      const need = new Map<string, number>(); p.groups.forEach((g) => need.set(g.key, g.pending));
      const rows = items.rows.map((i: Row) => { const free = r2(stk.get(i.name) ?? 0); const ord = r2(need.get(i.name) ?? 0); const min = Number(i.minStock); return { itemName: i.name, free, pendingOrders: ord, minStock: min, buy: r2(Math.max(0, ord + min - free)) }; }).filter((r) => r.buy > 0).sort((a, b) => b.buy - a.buy);
      return { ...base, sub: 'Free stock vs pending sales orders and minimum stock', cols: [C('itemName', 'Yarn'), C('free', 'Free stock', 'qty'), C('pendingOrders', 'Pending orders', 'qty'), C('minStock', 'Min stock', 'qty'), C('buy', 'Suggested purchase', 'qty')], rows };
    }
    case 'gstr1': {
      const g = await rep.gstr1(ctx, from, to);
      const rows = [...g.b2b.map((r) => ({ ...r, sec: 'B2B' })), ...g.b2c.map((r) => ({ ...r, sec: 'B2C' })), ...g.cdnr.map((r) => ({ ...r, sec: 'CDNR' }))];
      const cols = [C('sec', 'Section'), C('number', 'Invoice'), C('date', 'Date', 'date'), C('partyName', 'Party'), C('gstin', 'GSTIN'), C('taxable', 'Taxable', 'money'), C('cgst', 'CGST', 'money'), C('sgst', 'SGST', 'money'), C('igst', 'IGST', 'money'), C('net', 'Invoice value', 'money')];
      return { ...base, cols, rows, total: totals(rows, cols, rows.length + ' documents') };
    }
    case 'hsn': {
      const g = await rep.gstr1(ctx, from, to);
      const cols = [C('hsn', 'HSN'), C('description', 'Description'), C('unit', 'UQC'), C('rate', 'Rate %', 'pct'), C('qty', 'Qty', 'qty'), C('taxable', 'Taxable', 'money'), C('cgst', 'CGST', 'money'), C('sgst', 'SGST', 'money'), C('igst', 'IGST', 'money')];
      return { ...base, cols, rows: g.hsn, total: totals(g.hsn, cols, 'Total') };
    }
    case 'gstr3b': {
      const g = await rep.gstr3b(ctx, from, to);
      const rows = [{ name: '3.1(a) Outward taxable supplies', ...g.outward }, { name: '4(A) Eligible ITC', ...g.itc }, { name: 'Tax payable (after ITC)', taxable: null, ...g.payable }];
      return { ...base, cols: [C('name', 'Section'), C('taxable', 'Taxable', 'money'), C('cgst', 'CGST', 'money'), C('sgst', 'SGST', 'money'), C('igst', 'IGST', 'money')], rows, note: `Total payable ₹ ${g.totalPayable} · TCS collected ₹ ${g.tcsCollected} · TDS deducted ₹ ${g.tdsDeducted}` };
    }
    case 'gstr2b': {
      const r = await listDocs(ctx, TYPES.PURCHASE_BILL, { from, to, pageSize: 1000 } as never);
      const rows = (r.data as Row[]).map((x) => ({ ...x, gst: r2((x.cgstAmount || 0) + (x.sgstAmount || 0) + (x.igstAmount || 0)), check: !x.refNo ? 'Supplier invoice no. missing' : !x.partyGstin ? 'Supplier GSTIN missing' : 'Match with portal 2B' }));
      return { ...base, cols: [C('number', 'Entry'), C('date', 'Date', 'date'), C('partyName', 'Supplier'), C('partyGstin', 'GSTIN'), C('refNo', 'Invoice no.'), C('taxableAmount', 'Taxable', 'money'), C('gst', 'GST', 'money'), C('check', 'Check')], rows, note: 'Download GSTR-2B from the GST portal and tick off each invoice; entries flagged above need correction first.' };
    }
    case 'ewb-register': {
      const r = await listDocs(ctx, TYPES.SALE_BILL, { from, to, pageSize: 1000 } as never);
      const rows = (r.data as Row[]).filter((x) => x.ewbStatus !== 'NOT_REQUIRED').map((x) => ({ ...x, valid: x.ewbValidTill ? String(x.ewbValidTill).slice(0, 10) : '', days: x.ewbValidTill ? daysBetween(today(), String(x.ewbValidTill).slice(0, 10)) : null }));
      return { ...base, cols: [C('number', 'Bill'), C('date', 'Date', 'date'), C('partyName', 'Party'), C('netAmount', 'Value', 'money'), C('ewbNo', 'E-way bill'), C('ewbStatus', 'Status'), C('valid', 'Valid till', 'date'), C('vehicleNo', 'Vehicle'), C('transporterName', 'Transporter')], rows };
    }
  }
  throw notFound('Report');
}
