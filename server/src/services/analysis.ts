/**
 * Business analysis reports a yarn trader runs every day:
 * sales / purchase analysis (any grouping), pending orders, brokerage,
 * collections, day book, interest on overdue bills (+ interest debit notes),
 * group summary, TDS / TCS.
 */
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { accountGroups } from '../db/schema.js';
import { daysBetween, today } from '../lib/dates.js';
import { unprocessable } from '../lib/errors.js';
import { r2, r3, sum } from '../lib/money.js';
import type { Ctx } from './context.js';
import { createDoc, loadFy } from './documents.js';
import { outstanding } from './reports.js';
import { TYPES } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const N = (v: unknown) => Number(v ?? 0);

async function range(ctx: Ctx, from?: string, to?: string) {
  const fy = await loadFy(ctx);
  return { from: from || fy.startDate, to: to || fy.endDate };
}

/* ------------------------------------------------------ sales / purchase analysis */
const DIMS = {
  party: { sql: 'p.name', label: 'Party' },
  partyGroup: { sql: "coalesce(pg.name, p.name)", label: 'Party group' },
  group: { sql: 'g.name', label: 'Account group' },
  item: { sql: "coalesce(i.name, l.description, '—')", label: 'Item' },
  itemType: { sql: "coalesce(i.type::text, '—')", label: 'Yarn type' },
  brand: { sql: "coalesce(l.brand, '—')", label: 'Brand' },
  lot: { sql: "coalesce(l.lot_no, '—')", label: 'Lot' },
  hsn: { sql: "coalesce(l.hsn, i.hsn, '—')", label: 'HSN' },
  month: { sql: "to_char(v.date::date, 'YYYY-MM')", label: 'Month' },
  date: { sql: 'v.date::text', label: 'Date' },
  broker: { sql: "coalesce(b.name, '(direct)')", label: 'Broker' },
  salesPerson: { sql: "coalesce(sp.name, '(not set)')", label: 'Sales person' },
  city: { sql: "coalesce(p.city, '—')", label: 'City' },
  state: { sql: "coalesce(p.state, p.state_code, '—')", label: 'State' }
} as const;
export type Dim = keyof typeof DIMS;

export const analysisQuery = z.object({
  side: z.enum(['sales', 'purchase']).default('sales'),
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.string().default('party'),
  partyId: z.coerce.number().optional(),
  itemId: z.coerce.number().optional(),
  brokerId: z.coerce.number().optional(),
  salesPersonId: z.coerce.number().optional()
});

export async function salesAnalysis(ctx: Ctx, raw: unknown) {
  const q = analysisQuery.parse(raw ?? {});
  const { from, to } = await range(ctx, q.from, q.to);
  const dims = q.groupBy.split(',').map((d) => d.trim()).filter(Boolean) as Dim[];
  for (const d of dims) if (!DIMS[d]) throw unprocessable(`Unknown grouping "${d}". Use: ${Object.keys(DIMS).join(', ')}`);
  const [inTypes, retType] = q.side === 'sales' ? ["('SALE_BILL','GENERAL_SALE')", "'SALE_RETURN'"] : ["('PURCHASE_BILL','GENERAL_PURCHASE')", "'PURCHASE_RETURN'"];
  const keys = dims.map((d, i) => `${DIMS[d].sql} as k${i}`).join(', ');
  const groupCols = dims.map((_, i) => `k${i}`).join(', ');
  const res = await ctx.db.execute(sql`
    select ${sql.raw(keys)},
      sum(case when v.type = ${sql.raw(retType)} then -l.qty else l.qty end) as qty,
      sum(case when v.type = ${sql.raw(retType)} then -l.pcs else l.pcs end) as pcs,
      sum(case when v.type = ${sql.raw(retType)} then -l.taxable_amount else l.taxable_amount end) as taxable,
      sum(case when v.type = ${sql.raw(retType)} then -(l.cgst_amount + l.sgst_amount + l.igst_amount) else l.cgst_amount + l.sgst_amount + l.igst_amount end) as gst,
      sum(case when v.type = ${sql.raw(retType)} then -l.amount else l.amount end) as amount,
      sum(case when v.type = ${sql.raw(retType)} then l.taxable_amount else 0 end) as returns,
      count(distinct v.id) filter (where v.type <> ${sql.raw(retType)}) as bills
    from vouchers v join voucher_lines l on l.voucher_id = v.id
      join accounts p on p.id = v.party_id join account_groups g on g.id = p.group_id
      left join accounts pg on pg.id = p.party_group_id left join items i on i.id = l.item_id
      left join accounts b on b.id = coalesce(v.broker_id, p.broker_id) left join sales_persons sp on sp.id = coalesce(v.sales_person_id, p.sales_person_id)
    where v.company_id = ${ctx.companyId} and (v.type in ${sql.raw(inTypes)} or v.type = ${sql.raw(retType)})
      and v.date between ${from} and ${to}
      ${q.partyId ? sql`and v.party_id = ${q.partyId}` : sql``} ${q.itemId ? sql`and l.item_id = ${q.itemId}` : sql``}
      ${q.brokerId ? sql`and coalesce(v.broker_id, p.broker_id) = ${q.brokerId}` : sql``}
      ${q.salesPersonId ? sql`and coalesce(v.sales_person_id, p.sales_person_id) = ${q.salesPersonId}` : sql``}
    group by ${sql.raw(groupCols)} order by ${sql.raw(dims.length === 1 && (dims[0] === 'month' || dims[0] === 'date') ? 'k0' : 'taxable desc')}`);
  const rows = res.rows.map((r: Row) => {
    const qty = r3(N(r.qty));
    const taxable = r2(N(r.taxable));
    return { keys: dims.map((_, i) => r['k' + i]), label: dims.map((_, i) => r['k' + i]).join(' · '), qty, pcs: r3(N(r.pcs)), taxable, gst: r2(N(r.gst)), amount: r2(N(r.amount)), returns: r2(N(r.returns)), bills: N(r.bills), avgRate: qty ? r2(taxable / qty) : 0 };
  });
  const total = { qty: r3(sum(rows, (r) => r.qty)), taxable: r2(sum(rows, (r) => r.taxable)), gst: r2(sum(rows, (r) => r.gst)), amount: r2(sum(rows, (r) => r.amount)), returns: r2(sum(rows, (r) => r.returns)) };
  return { side: q.side, from, to, groupBy: dims, labels: dims.map((d) => DIMS[d].label), rows: rows.map((r) => ({ ...r, share: total.taxable ? r2((r.taxable / total.taxable) * 100) : 0 })), total };
}

/* ---------------------------------------------------------- pending orders */
export async function pendingOrders(ctx: Ctx, raw: unknown) {
  const q = z.object({ type: z.enum(['sales', 'purchase']).default('sales'), groupBy: z.enum(['order', 'party', 'item', 'broker', 'salesPerson']).default('order'), asOn: z.string().optional() }).parse(raw ?? {});
  const [otype, btype] = q.type === 'sales' ? ['SALES_ORDER', 'SALE_BILL'] : ['PURCHASE_ORDER', 'PURCHASE_BILL'];
  const asOn = q.asOn ?? today();
  const res = await ctx.db.execute(sql`
    select v.id, v.number, v.date, v.exp_delivery_date as "expDeliveryDate", v.status, p.name as "partyName", i.name as "itemName",
      l.brand, l.lot_no as "lotNo", l.grade, l.qty, l.rate, b.name as "brokerName", sp.name as "salesPersonName",
      coalesce((select sum(c.qty) from voucher_lines c join vouchers cv on cv.id = c.voucher_id where c.order_line_id = l.id and cv.type = ${btype}), 0) as done,
      coalesce((select sum(c.qty) from voucher_lines c join vouchers cv on cv.id = c.voucher_id where c.source_line_id = l.id and cv.type = 'DISPATCH_SCHEDULE' and cv.status <> 'CANCELLED'), 0) as scheduled
    from vouchers v join voucher_lines l on l.voucher_id = v.id join accounts p on p.id = v.party_id left join items i on i.id = l.item_id
      left join accounts b on b.id = v.broker_id left join sales_persons sp on sp.id = v.sales_person_id
    where v.company_id = ${ctx.companyId} and v.type = ${otype} and v.status in ('OPEN','PARTIAL') and coalesce(l.line_status,'') <> 'CLOSED' and v.date <= ${asOn}
    order by v.date, v.id`);
  const lines = res.rows
    .map((r: Row): Row => {
      const pending = r3(N(r.qty) - N(r.done));
      return { ...r, qty: N(r.qty), rate: N(r.rate), done: r3(N(r.done)), scheduled: r3(N(r.scheduled)), pending, value: r2(pending * N(r.rate)), ageDays: daysBetween(r.date as string, asOn), late: !!r.expDeliveryDate && (r.expDeliveryDate as string) < asOn };
    })
    .filter((r) => r.pending > 0.0005);
  const keyOf = { order: (r: Row) => r.number, party: (r: Row) => r.partyName, item: (r: Row) => r.itemName, broker: (r: Row) => r.brokerName ?? '(direct)', salesPerson: (r: Row) => r.salesPersonName ?? '(not set)' }[q.groupBy];
  const map = new Map<string, { key: string; orders: Set<unknown>; qty: number; pending: number; value: number; oldest: string; lines: typeof lines }>();
  for (const l of lines) {
    const k = String(keyOf(l));
    const g = map.get(k) ?? { key: k, orders: new Set(), qty: 0, pending: 0, value: 0, oldest: l.date as string, lines: [] };
    g.orders.add(l.id);
    g.qty = r3(g.qty + l.qty);
    g.pending = r3(g.pending + l.pending);
    g.value = r2(g.value + l.value);
    if ((l.date as string) < g.oldest) g.oldest = l.date as string;
    g.lines.push(l);
    map.set(k, g);
  }
  const groups = [...map.values()].map((g) => ({ ...g, orders: g.orders.size })).sort((a, b) => b.pending - a.pending);
  return { type: q.type, groupBy: q.groupBy, asOn, groups, total: { pending: r3(sum(lines, (l) => l.pending)), value: r2(sum(lines, (l) => l.value)), lines: lines.length } };
}

/* --------------------------------------------------------------- brokerage */
export async function brokerage(ctx: Ctx, raw: unknown) {
  const q = z.object({ from: z.string().optional(), to: z.string().optional(), brokerId: z.coerce.number().optional() }).parse(raw ?? {});
  const { from, to } = await range(ctx, q.from, q.to);
  const res = await ctx.db.execute(sql`
    select v.id, v.type, v.number, v.date, p.name as "partyName", b.id as "brokerId", b.name as "brokerName",
      coalesce(nullif(v.brokerage_rate, 0), p.brokerage_rate, b.brokerage_rate, 0) as rate,
      coalesce(nullif(v.brokerage_type, ''), b.brokerage_type, 'PER_KG') as "rateType",
      case when v.type = 'SALE_RETURN' then -v.total_qty else v.total_qty end as qty,
      case when v.type = 'SALE_RETURN' then -v.taxable_amount else v.taxable_amount end as taxable,
      (select coalesce(sum(a.amount),0) from bill_allocations a where a.bill_id = v.id) as received, v.net_amount as net
    from vouchers v join accounts p on p.id = v.party_id join accounts b on b.id = coalesce(v.broker_id, p.broker_id)
    where v.company_id = ${ctx.companyId} and v.type in ('SALE_BILL','SALE_RETURN') and v.date between ${from} and ${to}
      ${q.brokerId ? sql`and b.id = ${q.brokerId}` : sql``}
    order by b.name, v.date`);
  const rows = res.rows.map((r: Row): Row => {
    const amount = r.rateType === 'PERCENT' ? r2((N(r.taxable) * N(r.rate)) / 100) : r2(N(r.qty) * N(r.rate));
    return { ...r, rate: N(r.rate), qty: r3(N(r.qty)), taxable: N(r.taxable), net: N(r.net), received: N(r.received), paidByParty: N(r.received) >= N(r.net) - 0.5, brokerage: amount };
  });
  const map = new Map<string, { brokerId: unknown; brokerName: string; qty: number; taxable: number; brokerage: number; earned: number; bills: number }>();
  for (const r of rows) {
    const g = map.get(String(r.brokerName)) ?? { brokerId: r.brokerId, brokerName: String(r.brokerName), qty: 0, taxable: 0, brokerage: 0, earned: 0, bills: 0 };
    g.qty = r3(g.qty + r.qty);
    g.taxable = r2(g.taxable + r.taxable);
    g.brokerage = r2(g.brokerage + r.brokerage);
    if (r.paidByParty) g.earned = r2(g.earned + r.brokerage); // payable once the party has paid
    g.bills += 1;
    map.set(String(r.brokerName), g);
  }
  return { from, to, brokers: [...map.values()].sort((a, b) => b.brokerage - a.brokerage), rows, total: r2(sum(rows, (r) => r.brokerage)) };
}

/* -------------------------------------------------------------- collections */
export async function collections(ctx: Ctx, raw: unknown) {
  const q = z.object({ from: z.string().optional(), to: z.string().optional(), side: z.enum(['receipts', 'payments']).default('receipts'), groupBy: z.enum(['collectionPerson', 'salesPerson', 'mode', 'bank', 'party', 'date', 'month', 'broker']).default('collectionPerson') }).parse(raw ?? {});
  const { from, to } = await range(ctx, q.from, q.to);
  const res = await ctx.db.execute(sql`
    select v.id, v.number, v.date, v.amount, v.mode, v.instrument_no as "instrumentNo", p.name as "partyName", ba.name as "bankName",
      coalesce(cp.name, pcp.name, '(not set)') as "collectionPerson", coalesce(psp.name, '(not set)') as "salesPerson", coalesce(b.name, '(direct)') as broker,
      (select coalesce(sum(a.amount),0) from bill_allocations a where a.voucher_id = v.id) as adjusted
    from vouchers v join accounts p on p.id = v.party_id left join accounts ba on ba.id = v.bank_account_id
      left join sales_persons cp on cp.id = v.collection_person_id left join sales_persons pcp on pcp.id = p.collection_person_id
      left join sales_persons psp on psp.id = p.sales_person_id left join accounts b on b.id = p.broker_id
    where v.company_id = ${ctx.companyId} and v.type = ${q.side === 'receipts' ? 'RECEIPT' : 'PAYMENT'} and v.date between ${from} and ${to}
    order by v.date, v.id`);
  const rows = res.rows.map((r: Row) => ({ ...r, amount: N(r.amount), adjusted: N(r.adjusted), onAccount: r2(N(r.amount) - N(r.adjusted)) }));
  const keyOf: Record<string, (r: Row) => unknown> = { collectionPerson: (r) => r.collectionPerson, salesPerson: (r) => r.salesPerson, mode: (r) => r.mode ?? '—', bank: (r) => r.bankName, party: (r) => r.partyName, date: (r) => r.date, month: (r) => String(r.date).slice(0, 7), broker: (r) => r.broker };
  const map = new Map<string, { key: string; count: number; amount: number; adjusted: number }>();
  for (const r of rows) {
    const k = String(keyOf[q.groupBy](r));
    const g = map.get(k) ?? { key: k, count: 0, amount: 0, adjusted: 0 };
    g.count += 1;
    g.amount = r2(g.amount + r.amount);
    g.adjusted = r2(g.adjusted + r.adjusted);
    map.set(k, g);
  }
  return { side: q.side, groupBy: q.groupBy, from, to, groups: [...map.values()].sort((a, b) => (q.groupBy === 'date' || q.groupBy === 'month' ? a.key.localeCompare(b.key) : b.amount - a.amount)), rows, total: r2(sum(rows, (r) => r.amount)) };
}

/* ------------------------------------------------------------------ day book */
export async function dayBook(ctx: Ctx, raw: unknown) {
  const q = z.object({ from: z.string().optional(), to: z.string().optional(), type: z.string().optional() }).parse(raw ?? {});
  const from = q.from ?? today();
  const to = q.to ?? from;
  const res = await ctx.db.execute(sql`
    select v.id, v.type, v.number, v.date, v.status, p.name as "partyName", v.total_qty as qty,
      case when v.type in ('RECEIPT','PAYMENT') then v.amount else v.net_amount end as amount, coalesce(v.narration, v.remark) as narration,
      (select coalesce(sum(debit),0) from ledger_entries e where e.voucher_id = v.id) as debit, u.name as "createdBy", v.created_at as "createdAt"
    from vouchers v left join accounts p on p.id = v.party_id left join users u on u.id = v.created_by_id
    where v.company_id = ${ctx.companyId} and v.date between ${from} and ${to} ${q.type ? sql`and v.type = ${q.type}` : sql``}
    order by v.date, v.created_at, v.id`);
  const rows = res.rows.map((r: Row): Row => ({ ...r, qty: N(r.qty), amount: N(r.amount), debit: N(r.debit), typeLabel: TYPES[r.type as keyof typeof TYPES]?.label ?? r.type, slug: TYPES[r.type as keyof typeof TYPES]?.slug }));
  const byType = new Map<string, { type: string; label: string; count: number; amount: number }>();
  for (const r of rows) {
    const g = byType.get(r.type as string) ?? { type: r.type as string, label: r.typeLabel as string, count: 0, amount: 0 };
    g.count += 1;
    g.amount = r2(g.amount + r.amount);
    byType.set(r.type as string, g);
  }
  return { from, to, rows, summary: [...byType.values()] };
}

/* ------------------------------------------------------- interest on overdue */
export const interestQuery = z.object({
  asOn: z.string().optional(),
  side: z.enum(['receivable', 'payable']).default('receivable'),
  /** % per annum; falls back to the party's interest rate, then 18% */
  rate: z.coerce.number().min(0).max(60).optional(),
  /** days after the due date before interest starts */
  graceDays: z.coerce.number().int().min(0).max(365).default(0),
  partyId: z.coerce.number().optional()
});

export async function interest(ctx: Ctx, raw: unknown) {
  const q = interestQuery.parse(raw ?? {});
  const asOn = q.asOn ?? today();
  const out = await outstanding(ctx, q.side, { asOn, partyId: q.partyId, basis: 'due' });
  const bills = out.bills
    .map((b) => {
      const days = Math.max(0, b.overdueDays - q.graceDays);
      const rate = q.rate ?? (N(b.interestRate) || 18);
      return { id: b.id, number: b.number, date: b.date, dueDate: b.dueDate, partyId: b.partyId, partyName: b.partyName, pending: b.pending, overdueDays: b.overdueDays, interestDays: days, rate, interest: r2((b.pending * rate * days) / 36500) };
    })
    .filter((b) => b.interest > 0);
  const map = new Map<number, { partyId: number; partyName: string; pending: number; interest: number; bills: number }>();
  for (const b of bills) {
    const g = map.get(b.partyId) ?? { partyId: b.partyId, partyName: b.partyName, pending: 0, interest: 0, bills: 0 };
    g.pending = r2(g.pending + b.pending);
    g.interest = r2(g.interest + b.interest);
    g.bills += 1;
    map.set(b.partyId, g);
  }
  return { asOn, side: q.side, graceDays: q.graceDays, parties: [...map.values()].sort((a, b) => b.interest - a.interest), bills, total: r2(sum(bills, (b) => b.interest)) };
}

/** Raise one interest debit note per party (no GST on interest) */
export async function createInterestNotes(ctx: Ctx, raw: unknown) {
  const body = interestQuery.extend({ partyIds: z.array(z.coerce.number().int()).min(1), date: z.string().optional() }).parse(raw ?? {});
  const rep = await interest(ctx, { ...body, side: 'receivable' });
  const created = [];
  for (const pid of body.partyIds) {
    const p = rep.parties.find((x) => x.partyId === pid);
    if (!p || p.interest < 1) continue;
    const bills = rep.bills.filter((b) => b.partyId === pid).map((b) => `${b.number} (${b.interestDays}d @${b.rate}%)`).join(', ');
    created.push(await createDoc(ctx, TYPES.DEBIT_NOTE, { date: body.date ?? rep.asOn, partyId: pid, reason: 'Interest on overdue bills', narration: `Interest on ${bills}`, lines: [{ description: 'Interest on overdue bills', qty: 1, rate: Math.round(p.interest), gstRate: 0 }] }));
  }
  return created;
}

/* ------------------------------------------------------------ group summary */
export async function groupSummary(ctx: Ctx, raw: unknown) {
  const q = z.object({ asOn: z.string().optional(), groupId: z.coerce.number().optional() }).parse(raw ?? {});
  const fy = await loadFy(ctx);
  const asOn = q.asOn ?? fy.endDate;
  const groups = await ctx.db.select().from(accountGroups).where(eq(accountGroups.companyId, ctx.companyId));
  const res = await ctx.db.execute(sql`
    select a.id, a.name, a.group_id as "groupId", g.nature,
      (case when g.nature in ('INCOME','EXPENSE') then 0 else case when a.opening_type = 'DR' then a.opening_balance else -a.opening_balance end end)
      + coalesce((select sum(debit - credit) from ledger_entries e where e.account_id = a.id and e.date <= ${asOn}
          and (g.nature not in ('INCOME','EXPENSE') or e.date >= ${fy.startDate})), 0) as bal,
      coalesce((select sum(debit) from ledger_entries e where e.account_id = a.id and e.date between ${fy.startDate} and ${asOn}), 0) as dr,
      coalesce((select sum(credit) from ledger_entries e where e.account_id = a.id and e.date between ${fy.startDate} and ${asOn}), 0) as cr
    from accounts a join account_groups g on g.id = a.group_id where a.company_id = ${ctx.companyId}`);
  const accs = res.rows.map((r: Row) => ({ id: Number(r.id), name: r.name as string, groupId: Number(r.groupId), balance: r2(N(r.bal)), debit: r2(N(r.dr)), credit: r2(N(r.cr)) }));
  const children = (pid: number | null) => groups.filter((g) => g.parentId === pid);
  const total = (gid: number): { balance: number; debit: number; credit: number } => {
    const own = accs.filter((a) => a.groupId === gid);
    const subs = children(gid).map((c) => total(c.id));
    return { balance: r2(sum(own, (a) => a.balance) + sum(subs, (s) => s.balance)), debit: r2(sum(own, (a) => a.debit) + sum(subs, (s) => s.debit)), credit: r2(sum(own, (a) => a.credit) + sum(subs, (s) => s.credit)) };
  };
  const parent = q.groupId ? groups.find((g) => g.id === q.groupId) : null;
  const rows = [
    ...children(q.groupId ?? null).map((g) => ({ kind: 'group', id: g.id, name: g.name, nature: g.nature, ...total(g.id) })),
    ...(q.groupId ? accs.filter((a) => a.groupId === q.groupId).map((a) => ({ kind: 'account', id: a.id, name: a.name, nature: parent?.nature, balance: a.balance, debit: a.debit, credit: a.credit })) : [])
  ].filter((r) => r.balance || r.debit || r.credit || r.kind === 'group');
  return { asOn, group: parent ? { id: parent.id, name: parent.name, parentId: parent.parentId } : null, rows: rows.map((r) => ({ ...r, closing: Math.abs(r.balance), closingType: r.balance >= 0 ? 'DR' : 'CR' })) };
}

/* ---------------------------------------------------------------- TDS / TCS */
export async function tdsTcs(ctx: Ctx, raw: unknown) {
  const q = z.object({ from: z.string().optional(), to: z.string().optional() }).parse(raw ?? {});
  const { from, to } = await range(ctx, q.from, q.to);
  const res = await ctx.db.execute(sql`
    select v.id, v.type, v.number, v.date, p.name as "partyName", p.pan, v.taxable_amount as taxable, v.tds_rate as "tdsRate", v.tds_amount as tds, v.tcs_rate as "tcsRate", v.tcs_amount as tcs
    from vouchers v join accounts p on p.id = v.party_id
    where v.company_id = ${ctx.companyId} and v.date between ${from} and ${to} and (v.tds_amount > 0 or v.tcs_amount > 0)
    order by v.date`);
  const rows = res.rows.map((r: Row) => ({ ...r, taxable: N(r.taxable), tdsRate: N(r.tdsRate), tds: N(r.tds), tcsRate: N(r.tcsRate), tcs: N(r.tcs) }));
  return { from, to, tds: rows.filter((r) => r.tds > 0), tcs: rows.filter((r) => r.tcs > 0), totalTds: r2(sum(rows, (r) => r.tds)), totalTcs: r2(sum(rows, (r) => r.tcs)) };
}

export { and };
