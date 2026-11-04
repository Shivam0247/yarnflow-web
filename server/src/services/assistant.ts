/**
 * YarnFlow assistant: answers everyday questions straight from the books.
 * Rule-based intent matching (no external model) so every figure is real and traceable.
 */
import { sql } from 'drizzle-orm';
import { addDays, today } from '../lib/dates.js';
import { r2 } from '../lib/money.js';
import * as an from './analysis.js';
import type { Ctx } from './context.js';
import { loadFy } from './documents.js';
import * as rep from './reports.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export interface Answer { t: string; cardT: string; rows: { a: string; b: string; c: string }[]; src: string[]; acts: string[] }
export interface Insight { sev: 'red' | 'amb' | 'grn' | 'blu'; t: string; v: string; d: string; act: string; when: string }

const inr = (n: number) => Math.round(n).toLocaleString('en-IN');
const L = (n: number) => (Math.abs(n) >= 1e7 ? '₹ ' + (n / 1e7).toFixed(2) + ' Cr' : Math.abs(n) >= 1e5 ? '₹ ' + (n / 1e5).toFixed(1) + ' L' : '₹ ' + inr(n));
const kg = (n: number) => inr(n) + ' kg';
const R = (a: string, b: string, c = '') => ({ a, b, c: c ? 'ai-' + c : '' });
const dmy = (d: string) => String(d).slice(0, 10).split('-').reverse().join('-');

async function findParty(ctx: Ctx, q: string) {
  const res = await ctx.db.execute(sql`select id, name, kind, city from accounts where company_id = ${ctx.companyId} and kind in ('CUSTOMER','SUPPLIER','BROKER','TRANSPORTER')`);
  const l = q.toLowerCase();
  const rows = res.rows as Row[];
  // longest name (or first word ≥ 4 letters) contained in the question
  const hit = rows.filter((r) => l.includes(String(r.name).toLowerCase())).sort((a, b) => b.name.length - a.name.length)[0]
    ?? rows.find((r) => { const w = String(r.name).toLowerCase().replace(/^(shree|shri|the)\s+/, '').split(/\s+/)[0]; return w.length >= 4 && l.includes(w); });
  return hit ?? null;
}
async function findItem(ctx: Ctx, q: string) {
  const res = await ctx.db.execute(sql`select id, name, code from items where company_id = ${ctx.companyId}`);
  const l = q.toLowerCase();
  return (res.rows as Row[]).filter((r) => l.includes(String(r.name).toLowerCase()) || l.includes(String(r.code).toLowerCase())).sort((a, b) => b.name.length - a.name.length)[0] ?? null;
}

export async function ask(ctx: Ctx, question: string): Promise<Answer> {
  const q = String(question || '').trim();
  const l = q.toLowerCase();
  const t = today();
  const fy = await loadFy(ctx);
  const party = await findParty(ctx, q);
  const item = await findItem(ctx, q);
  const has = (...w: string[]) => w.some((x) => l.includes(x));
  const days = Number((/(\d{2,3})\s*(\+|days|d\b)/.exec(l) || [])[1]) || 0;

  if (has('summar', 'today', 'aaj')) {
    const d = await rep.dashboard(ctx, t, t);
    return { t: `Today: sales ${L(d.sales.amount)} from ${d.sales.count} bills, purchase ${L(d.purchase.amount)}, receipts ${L(d.receipts.amount)}. ${d.approvalsPending} documents wait for approval and ${d.ewbPending} bills need an e-way bill.`, cardT: 'Today',
      rows: [R('Sales', L(d.sales.amount), 'grn'), R('Purchase', L(d.purchase.amount)), R('Receipts', L(d.receipts.amount)), R('Payments', L(d.payments.amount)), R('Approvals pending', String(d.approvalsPending), d.approvalsPending ? 'amb' : '')], src: ['Dashboard'], acts: ['Open dashboard'] };
  }
  if (party && has('outstanding', 'owe', 'due', 'balance', 'baki', 'pending amount', 'ledger')) {
    const side = party.kind === 'SUPPLIER' ? 'payable' : 'receivable';
    const o = await rep.outstanding(ctx, side, { partyId: party.id });
    const p = o.parties[0];
    const bills = o.bills.slice(0, 6);
    return { t: p ? `${party.name} ${side === 'receivable' ? 'owes us' : 'is owed'} ${L(p.net)}; ${L(p.overdue)} is overdue${p.maxDays ? ', oldest bill ' + p.maxDays + ' days' : ''}.` : `${party.name} has nothing outstanding.`, cardT: 'Bills · ' + party.name,
      rows: bills.map((b) => R(b.number + ' · ' + dmy(b.date as string), L(b.pending) + ' · ' + b.ageDays + ' d', b.overdueDays > 30 ? 'red' : b.overdueDays > 0 ? 'amb' : '')), src: ['Outstanding', 'Ledger · ' + party.name], acts: ['Open ledger', side === 'receivable' ? 'Send reminder' : 'Record payment'] };
  }
  if (has('owe', 'overdue', 'outstanding', 'receivable', 'collection', 'udhar')) {
    const o = await rep.outstanding(ctx, 'receivable', { minDays: days || undefined });
    let list = o.parties.filter((p) => p.billsPending > 0);
    const city = (o.parties.map((p) => String(p.city || '')).find((c) => c && l.includes(c.toLowerCase())));
    if (city) list = list.filter((p) => p.city === city);
    list.sort((a, b) => b.overdue - a.overdue || b.billsPending - a.billsPending);
    const tot = list.reduce((a, p) => a + p.billsPending, 0);
    return { t: `${list.length} part${list.length === 1 ? 'y owes' : 'ies owe'} ${L(tot)}${city ? ' in ' + city : ''}${days ? ' on bills older than ' + days + ' days' : ''}. ${list[0] ? list[0].partyName + ' has the largest overdue.' : ''}`, cardT: 'Overdue',
      rows: list.slice(0, 6).map((p) => R(p.partyName, L(p.overdue || p.billsPending) + ' · ' + p.maxDays + ' d', p.maxDays > 60 ? 'red' : p.maxDays > 30 ? 'amb' : '')), src: ['Outstanding'], acts: ['Open outstanding', 'Send reminders'] };
  }
  if (has('payable', 'pay to', 'due to mill', 'payments due', 'mills this week')) {
    const o = await rep.outstanding(ctx, 'payable', {});
    const soon = o.bills.filter((b) => b.dueDate && (b.dueDate as string) <= addDays(t, 7)).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    return { t: `${L(soon.reduce((a, b) => a + b.pending, 0))} is due to suppliers within a week (${soon.length} bills). Total payable ${L(o.totals.net)}.`, cardT: 'Due to mills',
      rows: soon.slice(0, 6).map((b) => R(b.partyName + ' · ' + b.number, L(b.pending) + ' · ' + dmy(b.dueDate as string), b.overdueDays > 0 ? 'red' : '')), src: ['Outstanding · payable'], acts: ['Plan payments'] };
  }
  if (has('low stock', 'running low', 'reorder', 'short')) {
    const s = await rep.stockSummary(ctx, { asOn: t });
    const sales = await an.salesAnalysis(ctx, { side: 'sales', from: addDays(t, -30), to: t, groupBy: 'item' });
    const per = new Map(sales.rows.map((r) => [String(r.keys[0]), r.qty / 30]));
    const m = new Map<string, number>(); s.rows.forEach((r: Row) => m.set(r.itemName, (m.get(r.itemName) ?? 0) + r.free));
    const cover = [...m.entries()].map(([name, free]) => ({ name, free, d: (per.get(name) ?? 0) > 0 ? free / (per.get(name) as number) : Infinity })).filter((x) => x.d < 30).sort((a, b) => a.d - b.d);
    return { t: cover.length ? `${cover.length} yarn${cover.length === 1 ? ' has' : 's have'} less than a month of free stock at the last 30 days' selling pace.` : 'Every yarn you sold in the last 30 days has more than a month of free stock.', cardT: 'Days of stock',
      rows: cover.slice(0, 6).map((x) => R(x.name, kg(x.free) + ' · ' + Math.round(x.d) + ' d', x.d < 7 ? 'red' : x.d < 15 ? 'amb' : '')), src: ['Stock', 'Sales last 30 days'], acts: ['Make purchase order'] };
  }
  if (item && has('rate', 'price', 'bhav', 'trend')) {
    const a = await an.salesAnalysis(ctx, { side: has('sale', 'sell', 'sold') ? 'sales' : 'purchase', from: fy.startDate, to: t, groupBy: 'month', itemId: item.id });
    const rows = a.rows.filter((r) => r.avgRate);
    const ch = rows.length > 1 ? ((rows.at(-1)!.avgRate - rows[0].avgRate) / rows[0].avgRate) * 100 : 0;
    return { t: rows.length ? `${item.name} ${has('sale', 'sell', 'sold') ? 'sale' : 'purchase'} rate moved ${ch >= 0 ? 'up' : 'down'} ${Math.abs(ch).toFixed(1)}% this year, last ₹ ${rows.at(-1)!.avgRate.toFixed(2)}/kg.` : `No ${has('sale', 'sell') ? 'sales' : 'purchases'} of ${item.name} this year.`, cardT: 'Rate, ₹/kg',
      rows: rows.slice(-6).map((r, i, arr) => R(String(r.keys[0]), '₹ ' + r.avgRate.toFixed(2), i === arr.length - 1 ? 'amb' : '')), src: [has('sale', 'sell') ? 'Sale bills' : 'Purchase bills'], acts: [] };
  }
  if (item && has('stock', 'kitna', 'available', 'lot')) {
    const s = await rep.stockSummary(ctx, { itemId: item.id, asOn: t });
    const tot = s.rows.reduce((a: number, r: Row) => a + r.qty, 0); const free = s.rows.reduce((a: number, r: Row) => a + r.free, 0);
    return { t: `${item.name}: ${kg(tot)} in stock, ${kg(free)} free after scheduled dispatches, across ${s.rows.length} lots.`, cardT: 'Lots',
      rows: s.rows.slice(0, 6).map((r: Row) => R((r.lotNo || '—') + ' · ' + (r.grade || '—') + ' · ' + (r.godownName || ''), kg(r.qty), r.free < r.qty * 0.3 ? 'amb' : 'grn')), src: ['Stock'], acts: ['Open stock'] };
  }
  if (has('hold', 'approv')) {
    const res = await ctx.db.execute(sql`select v.number, v.type, v.net_amount as net, p.name from vouchers v left join accounts p on p.id = v.party_id where v.company_id = ${ctx.companyId} and v.status = 'PENDING_APPROVAL' order by v.net_amount desc`);
    const rows = res.rows as Row[];
    return { t: rows.length ? `${rows.length} document${rows.length === 1 ? ' is' : 's are'} waiting for approval, worth ${L(rows.reduce((a, r) => a + Number(r.net), 0))}.` : 'Nothing is waiting for approval.', cardT: 'On hold',
      rows: rows.slice(0, 6).map((r) => R(r.number + ' · ' + (r.name || ''), L(Number(r.net)), 'amb')), src: ['Approvals'], acts: ['Open approvals'] };
  }
  if (has('e-way', 'eway', 'ewb', 'part b')) {
    const res = await ctx.db.execute(sql`select v.number, v.ewb_status as s, v.net_amount as net, p.name from vouchers v left join accounts p on p.id = v.party_id where v.company_id = ${ctx.companyId} and v.type = 'SALE_BILL' and v.ewb_status in ('PENDING','PARTB_PENDING') order by v.date desc`);
    const rows = res.rows as Row[]; const pend = rows.filter((r) => r.s === 'PENDING'); const pb = rows.filter((r) => r.s === 'PARTB_PENDING');
    return { t: `${pend.length} bill${pend.length === 1 ? ' needs' : 's need'} an e-way bill and ${pb.length} wait${pb.length === 1 ? 's' : ''} for Part B (vehicle).`, cardT: 'E-way bills',
      rows: rows.slice(0, 6).map((r) => R(r.number + ' · ' + (r.name || ''), (r.s === 'PENDING' ? 'Not generated · ' : 'Part B · ') + L(Number(r.net)), r.s === 'PENDING' ? 'red' : 'amb')), src: ['E-way bills'], acts: ['Generate all'] };
  }
  if (has('pending', 'dispatch', 'order')) {
    const purchase = has('purchase', 'mill', 'po');
    const p = await an.pendingOrders(ctx, { type: purchase ? 'purchase' : 'sales', groupBy: party ? 'order' : 'party', asOn: t });
    let groups = p.groups; if (party) groups = groups.filter((g) => g.lines.some((x: Row) => x.partyName === party.name));
    return { t: `${groups.length} ${party ? 'orders of ' + party.name : purchase ? 'mills' : 'parties'} have ${kg(groups.reduce((a, g) => a + g.pending, 0))} pending ${purchase ? 'to receive' : 'to dispatch'}.`, cardT: 'Pending kg',
      rows: groups.slice(0, 6).map((g) => R(String(g.key), kg(g.pending) + ' · ' + L(g.value), '')), src: [purchase ? 'Purchase orders' : 'Sales orders'], acts: ['Open register'] };
  }
  if (party && has('rate', 'last', 'price')) {
    const res = await ctx.db.execute(sql`select v.number, v.date, i.name, l.rate, l.qty from vouchers v join voucher_lines l on l.voucher_id = v.id left join items i on i.id = l.item_id
      where v.company_id = ${ctx.companyId} and v.party_id = ${party.id} and v.type in ('SALE_BILL','SALES_ORDER','PURCHASE_BILL','PURCHASE_ORDER') order by v.date desc limit 6`);
    return { t: `Last rates with ${party.name}.`, cardT: 'Last rates · ' + party.name, rows: (res.rows as Row[]).map((r) => R((r.name || '') + ' · ' + dmy(r.date), '₹ ' + Number(r.rate).toFixed(2))), src: ['Orders and bills'], acts: [] };
  }
  if (has('sale', 'sales', 'becha', 'month', 'top')) {
    const a = await an.salesAnalysis(ctx, { side: 'sales', from: has('month') ? t.slice(0, 8) + '01' : fy.startDate, to: t, groupBy: has('yarn', 'item') ? 'item' : 'party' });
    return { t: `Sales ${has('month') ? 'this month' : 'this year'}: ${L(a.total.taxable)} taxable, ${kg(a.total.qty)}.`, cardT: has('yarn', 'item') ? 'Top yarns' : 'Top parties', rows: a.rows.slice(0, 6).map((r) => R(String(r.label), L(r.taxable) + ' · ' + r.share + '%')), src: ['Sale bills'], acts: ['Open reports'] };
  }
  // fall back: search documents and parties by the words in the question
  const words = q.replace(/[^\w/ -]/g, ' ').split(/\s+/).filter((w) => w.length >= 3).slice(0, 4);
  const pat = words.length ? '%' + words.join('%') + '%' : '%';
  const docs = await ctx.db.execute(sql`select number, type, net_amount as net from vouchers where company_id = ${ctx.companyId} and number ilike ${pat} limit 5`);
  const parts = await ctx.db.execute(sql`select name, city from accounts where company_id = ${ctx.companyId} and name ilike ${pat} limit 5`);
  const rows = [...(docs.rows as Row[]).map((r) => R(r.number, L(Number(r.net)))), ...(parts.rows as Row[]).map((r) => R(r.name, r.city || ''))];
  return { t: rows.length ? `I searched orders, bills and parties for “${q}”. This is what matched.` : `I could not match “${q}”. Try: who owes us the most, stock of 50/24 SD CAT, rate trend of 75/36 FDY, outstanding of a party, orders on hold, pending e-way bills.`, cardT: rows.length ? 'Matches' : '', rows, src: ['Search'], acts: [] };
}

/** live "worth a look" cards for a screen */
export async function insights(ctx: Ctx): Promise<Insight[]> {
  const t = today();
  const d = await rep.dashboard(ctx, t, t);
  const out: Insight[] = [];
  out.push({ sev: 'grn', t: 'Sales today', v: L(d.sales.amount), d: `${d.sales.count} bills · ${kg(d.sales.qty)}${d.avgDailySales ? ', ' + (d.sales.amount >= d.avgDailySales ? 'above' : 'below') + ' your daily average of ' + L(d.avgDailySales) : ''}.`, act: 'Open sale bills', when: 'Now' });
  const top = d.topDebtors.filter((p) => p.overdue > 0).sort((a, b) => b.overdue - a.overdue)[0];
  if (d.receivable.overdue > 0) out.push({ sev: 'red', t: 'Overdue receivable', v: L(d.receivable.overdue), d: top ? `${top.partyName} alone owes ${L(top.overdue)} for ${top.maxDays} days.` : 'Across your customers.', act: 'Send reminders', when: 'Now' });
  if (d.approvalsPending) out.push({ sev: 'amb', t: 'Waiting for approval', v: String(d.approvalsPending), d: 'Orders and bills on hold need your decision.', act: 'Open approvals', when: 'Now' });
  if (d.ewbPending) out.push({ sev: 'red', t: 'E-way bills pending', v: d.ewbPending + ' bills', d: 'These bills cannot leave the godown yet.', act: 'Generate all', when: 'Now' });
  if (d.lowStock.length) out.push({ sev: 'amb', t: 'Below minimum stock', v: d.lowStock.length + ' lots', d: d.lowStock.slice(0, 2).map((r: Row) => r.itemName).join(', ') + '.', act: 'Make purchase order', when: 'Now' });
  if (d.pendingPurchaseOrders.qty > 0) out.push({ sev: 'blu', t: 'Pending from mills', v: kg(d.pendingPurchaseOrders.qty), d: `${d.pendingPurchaseOrders.count} purchase orders still to receive.`, act: 'Open purchase orders', when: 'Now' });
  return out.map((x) => ({ ...x, v: x.v })).slice(0, 5).map((x) => ({ ...x, d: x.d.replace(/\s+/g, ' ') })) as Insight[];
}

