/**
 * Document engine — create / update / delete / workflow actions for every
 * voucher type (see types.ts). Everything happens in one DB transaction:
 *
 *   validate → number → calculate GST → save header + lines →
 *   post ledger (double entry) → post stock → bill-wise allocations →
 *   refresh order / schedule status → audit log
 */
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Tx } from '../db/index.js';
import {
  accounts, approvalLogs, auditLogs, billAllocations, books, companies, counters, financialYears, godowns, items,
  ledgerEntries, stockEntries, voucherLines, vouchers
} from '../db/schema.js';
import { addDays, today } from '../lib/dates.js';
import { badRequest, conflict, forbidden, locked, notFound, unprocessable } from '../lib/errors.js';
import { r2, r3, sum } from '../lib/money.js';
import { calcDocument } from './calc.js';
import { requireRole, type Ctx } from './context.js';
import { defaultBook, SYS, sysAccount } from './setup.js';
import { BILL_SQL, BILL_TYPES, isBill, ORDER_TYPES, TYPES, type TypeDef, type VoucherType } from './types.js';

/** over-delivery allowed against an order / schedule (yarn weights vary) */
export const TOLERANCE = 0.1;

/* ------------------------------------------------------------- input schema */
const num = z.coerce.number();
const optNum = z.coerce.number().optional().nullable();
const optStr = z.string().trim().max(240).optional().nullable();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const optDate = dateStr.optional().nullable().or(z.literal('').transform(() => null));

export const lineSchema = z.object({
  itemId: z.coerce.number().int().positive().optional().nullable(),
  accountId: z.coerce.number().int().positive().optional().nullable(),
  description: optStr,
  brand: optStr,
  lotNo: optStr,
  grade: optStr,
  hsn: optStr,
  unit: z.string().max(10).optional().nullable(),
  godownId: z.coerce.number().int().positive().optional().nullable(),
  pcs: optNum,
  cops: optNum,
  qty: optNum,
  rate: optNum,
  discPct: optNum,
  discAmount: optNum,
  freightPct: optNum,
  freightAmount: optNum,
  insurancePct: optNum,
  insuranceAmount: optNum,
  gstRate: optNum,
  amount: optNum,
  debit: optNum,
  credit: optNum,
  remark1: optStr,
  remark2: optStr,
  challanNo: optStr,
  challanDate: optDate,
  purchaseRef: optStr,
  purchaseInvNo: optStr,
  lrNo: optStr,
  sourceLineId: z.coerce.number().int().positive().optional().nullable()
});
export type LineIn = z.infer<typeof lineSchema>;

export const docSchema = z.object({
  bookId: z.coerce.number().int().positive().optional().nullable(),
  number: z.string().trim().max(40).optional().nullable(),
  date: dateStr,
  partyId: z.coerce.number().int().positive().optional().nullable(),
  deliveryPartyId: z.coerce.number().int().positive().optional().nullable(),
  brokerId: z.coerce.number().int().positive().optional().nullable(),
  brokerageRate: optNum,
  brokerageType: z.enum(['PER_KG', 'PERCENT']).optional(),
  millId: z.coerce.number().int().positive().optional().nullable(),
  salesPersonId: z.coerce.number().int().positive().optional().nullable(),
  costCenterId: z.coerce.number().int().positive().optional().nullable(),
  godownId: z.coerce.number().int().positive().optional().nullable(),
  toGodownId: z.coerce.number().int().positive().optional().nullable(),
  bankAccountId: z.coerce.number().int().positive().optional().nullable(),
  collectionPerson: optStr,
  collectionPersonId: z.coerce.number().int().positive().optional().nullable(),
  sourceId: z.coerce.number().int().positive().optional().nullable(),
  refNo: optStr,
  refDate: optDate,
  refName: optStr,
  doNo: optStr,
  opportunityNo: optStr,
  reason: optStr,
  creditDays: z.coerce.number().int().min(0).optional().nullable(),
  dueDate: optDate,
  expDeliveryDate: optDate,
  processType: optStr,
  orderType: optStr,
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']).optional(),
  terms: z.string().max(4000).optional().nullable(),
  transporterId: z.coerce.number().int().positive().optional().nullable(),
  vehicleNo: optStr,
  lrNo: optStr,
  lrDate: optDate,
  parcels: z.coerce.number().int().optional().nullable(),
  driverName: optStr,
  deliveryAddress: z.string().max(1000).optional().nullable(),
  distanceKm: z.coerce.number().int().optional().nullable(),
  placeOfSupply: z.string().length(2).optional().nullable(),
  reverseCharge: z.boolean().optional(),
  isTcs: z.boolean().optional(),
  tcsRate: optNum,
  tdsRate: optNum,
  currency: z.string().length(3).optional(),
  exchangeRate: optNum,
  addLess: optNum,
  discounts: z.array(z.object({ label: z.string().max(60), amount: num })).optional(),
  mode: z.enum(['NEFT', 'RTGS', 'CHEQUE', 'UPI', 'CASH', 'OTHER']).optional().nullable(),
  instrumentNo: optStr,
  instrumentDate: optDate,
  amount: optNum,
  remark: z.string().max(2000).optional().nullable(),
  narration: z.string().max(2000).optional().nullable(),
  ewbNo: optStr,
  lines: z.array(lineSchema).default([]),
  allocations: z.array(z.object({ billId: z.coerce.number().int().positive(), amount: num.positive() })).optional(),
  autoAdjust: z.boolean().optional()
});
export type DocIn = z.infer<typeof docSchema>;

/* ---------------------------------------------------------------- helpers */
async function audit(ctx: Ctx, entity: string, entityId: number, action: string, summary: string, data?: unknown) {
  await ctx.db.insert(auditLogs).values({ companyId: ctx.companyId, userId: ctx.userId, entity, entityId, action, summary, data: (data ?? null) as never });
}

export async function loadFy(ctx: Ctx) {
  const [fy] = await ctx.db.select().from(financialYears).where(and(eq(financialYears.id, ctx.fyId), eq(financialYears.companyId, ctx.companyId)));
  if (!fy) throw notFound('Financial year');
  return fy;
}

async function assertWritableFy(ctx: Ctx, date: string) {
  const fy = await loadFy(ctx);
  if (fy.isLocked) throw locked(`Financial year ${fy.label} is locked`);
  if (date < fy.startDate || date > fy.endDate) throw unprocessable(`Date must be within FY ${fy.label} (${fy.startDate} to ${fy.endDate})`);
  return fy;
}

async function nextNumber(ctx: Ctx, bookId: number, fyLabel: string) {
  const [book] = await ctx.db.select().from(books).where(eq(books.id, bookId));
  const res = await ctx.db.execute<{ last_number: number }>(sql`
    insert into counters (book_id, fy_id, last_number) values (${bookId}, ${ctx.fyId}, 1)
    on conflict (book_id, fy_id) do update set last_number = counters.last_number + 1
    returning last_number`);
  const seq = Number(res.rows[0].last_number);
  return { seq, number: formatNumber(book.prefix, book.padding, book.withFySuffix, seq, fyLabel) };
}

export const formatNumber = (prefix: string, padding: number, fySuffix: boolean, seq: number, fy: string) =>
  prefix + String(seq).padStart(padding, '0') + (fySuffix ? '/' + fy : '');

/** what the next number will be (not reserved) */
export async function peekNumber(ctx: Ctx, type: VoucherType, bookId?: number | null) {
  const book = bookId ? (await ctx.db.select().from(books).where(and(eq(books.id, bookId), eq(books.companyId, ctx.companyId))))[0] : await defaultBook(ctx.db, ctx.companyId, type);
  if (!book) throw notFound('Book');
  const fy = await loadFy(ctx);
  const [c] = await ctx.db.select().from(counters).where(and(eq(counters.bookId, book.id), eq(counters.fyId, ctx.fyId)));
  return { bookId: book.id, number: formatNumber(book.prefix, book.padding, book.withFySuffix, (c?.lastNumber ?? 0) + 1, fy.label) };
}

async function getAccount(ctx: Ctx, id: number | null | undefined, what: string) {
  if (!id) return null;
  const [a] = await ctx.db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.companyId, ctx.companyId)));
  if (!a) throw unprocessable(`${what} not found`);
  return a;
}

/** current ledger balance of an account (Dr positive), opening included */
export async function accountBalance(db: Tx, companyId: number, accountId: number, upto?: string) {
  const [a] = await db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.companyId, companyId)));
  if (!a) return 0;
  const opening = a.openingType === 'DR' ? a.openingBalance : -a.openingBalance;
  const res = await db.execute<{ bal: string }>(sql`
    select coalesce(sum(debit - credit), 0) as bal from ledger_entries
    where account_id = ${accountId} and company_id = ${companyId} ${upto ? sql`and date <= ${upto}` : sql``}`);
  return r2(opening + Number(res.rows[0].bal));
}

/** pending amount of a bill (net − TDS − settled) */
export async function billPending(db: Tx, billIds: number[], excludeVoucherId?: number) {
  if (!billIds.length) return new Map<number, number>();
  const rows = await db.execute<{ id: number; pending: string }>(sql`
    select v.id, v.net_amount - v.tds_amount - coalesce((
      select sum(a.amount) from bill_allocations a where a.bill_id = v.id
      ${excludeVoucherId ? sql`and a.voucher_id <> ${excludeVoucherId}` : sql``}
    ), 0) as pending
    from vouchers v where v.id in ${sql.raw('(' + billIds.map(Number).join(',') + ')')}`);
  return new Map(rows.rows.map((r) => [Number(r.id), r2(Number(r.pending))]));
}

/** available stock for an item / lot / grade (optionally in one godown) */
export async function stockAvailable(db: Tx, companyId: number, k: { itemId: number; lotNo?: string | null; grade?: string | null; godownId?: number | null }) {
  const res = await db.execute<{ q: string }>(sql`
    select coalesce(sum(qty_in - qty_out), 0) as q from stock_entries
    where company_id = ${companyId} and item_id = ${k.itemId}
      and coalesce(lot_no, '') = ${k.lotNo ?? ''} and coalesce(grade, '') = ${k.grade ?? ''}
      ${k.godownId ? sql`and godown_id = ${k.godownId}` : sql``}`);
  return r3(Number(res.rows[0].q));
}

/* --------------------------------------------- source line / pending logic */
interface SourceLine {
  id: number;
  voucherId: number;
  qty: number;
  pcs: number;
  orderLineId: number | null;
  lineStatus: string | null;
  vType: VoucherType;
  vStatus: string;
  vPartyId: number | null;
  vNumber: string;
}

async function loadSourceLines(db: Tx, companyId: number, ids: number[]) {
  if (!ids.length) return new Map<number, SourceLine>();
  const rows = await db
    .select({
      id: voucherLines.id, voucherId: voucherLines.voucherId, qty: voucherLines.qty, pcs: voucherLines.pcs,
      orderLineId: voucherLines.orderLineId, lineStatus: voucherLines.lineStatus,
      vType: vouchers.type, vStatus: vouchers.status, vPartyId: vouchers.partyId, vNumber: vouchers.number
    })
    .from(voucherLines)
    .innerJoin(vouchers, eq(vouchers.id, voucherLines.voucherId))
    .where(and(inArray(voucherLines.id, ids), eq(vouchers.companyId, companyId)));
  return new Map(rows.map((r) => [r.id, r as SourceLine]));
}

/**
 * Quantity already consumed from each source line by documents of `childTypes`
 * (e.g. schedule lines consumed by sale bills), optionally excluding one voucher.
 */
export async function consumedQty(db: Tx, lineIds: number[], childTypes: VoucherType[], by: 'source' | 'order', excludeVoucherId?: number) {
  if (!lineIds.length) return new Map<number, number>();
  const col = by === 'source' ? voucherLines.sourceLineId : voucherLines.orderLineId;
  const rows = await db
    .select({ lid: col, q: sql<string>`sum(${voucherLines.qty})`, p: sql<string>`sum(${voucherLines.pcs})` })
    .from(voucherLines)
    .innerJoin(vouchers, eq(vouchers.id, voucherLines.voucherId))
    .where(and(
      inArray(col, lineIds),
      inArray(vouchers.type, childTypes),
      ne(vouchers.status, 'CANCELLED'),
      excludeVoucherId ? ne(vouchers.id, excludeVoucherId) : undefined
    ))
    .groupBy(col);
  return new Map(rows.map((r) => [Number(r.lid), r3(Number(r.q))]));
}

/** child document types that consume a source type's lines */
const CONSUMERS: Partial<Record<VoucherType, { types: VoucherType[]; by: 'source' | 'order' }>> = {
  SALES_ORDER: { types: ['SALE_BILL'], by: 'order' },
  PURCHASE_ORDER: { types: ['PURCHASE_BILL'], by: 'order' },
  DISPATCH_SCHEDULE: { types: ['SALE_BILL'], by: 'source' },
  SALE_BILL: { types: ['SALE_RETURN'], by: 'source' },
  PURCHASE_BILL: { types: ['PURCHASE_RETURN'], by: 'source' }
};
/** for schedules against an order, how much of the order is already scheduled */
const SCHEDULED_BY: Partial<Record<VoucherType, VoucherType[]>> = { SALES_ORDER: ['DISPATCH_SCHEDULE'] };

/** voucher ids of the root orders behind some lines */
async function orderVouchersOf(db: Tx, orderLineIds: (number | null | undefined)[]) {
  const ids = [...new Set(orderLineIds.filter(Boolean))] as number[];
  if (!ids.length) return [];
  const rows = await db.select({ v: voucherLines.voucherId }).from(voucherLines).where(inArray(voucherLines.id, ids));
  return rows.map((r) => r.v);
}

/** Recompute OPEN / PARTIAL / COMPLETED for orders and schedules */
export async function refreshStatuses(db: Tx, voucherIds: number[]) {
  const ids = [...new Set(voucherIds.filter(Boolean))];
  if (!ids.length) return;
  const vs = await db.select().from(vouchers).where(inArray(vouchers.id, ids));
  for (const v of vs) {
    if (!ORDER_TYPES.includes(v.type as VoucherType)) continue;
    if (!['OPEN', 'PARTIAL', 'COMPLETED'].includes(v.status)) continue;
    const lines = await db.select().from(voucherLines).where(eq(voucherLines.voucherId, v.id));
    const cons = CONSUMERS[v.type as VoucherType]!;
    const used = await consumedQty(db, lines.map((l) => l.id), cons.types, cons.by);
    let anyDone = false;
    let allDone = lines.length > 0;
    for (const l of lines) {
      const u = used.get(l.id) ?? 0;
      if (u > 0) anyDone = true;
      const closed = l.lineStatus === 'CLOSED' || u >= l.qty * 0.995 - 0.0005;
      if (!closed) allDone = false;
    }
    const status = allDone ? 'COMPLETED' : anyDone ? 'PARTIAL' : 'OPEN';
    if (status !== v.status) await db.update(vouchers).set({ status, updatedAt: new Date() }).where(eq(vouchers.id, v.id));
  }
}

/* ------------------------------------------------------------ main engine */
interface Prepared {
  header: Record<string, unknown>;
  lines: Record<string, unknown>[];
  touchedOrders: number[];
  allocations: { billId: number; amount: number }[];
  approvalReasons: string[];
}

async function prepare(ctx: Ctx, def: TypeDef, input: DocIn, existingId?: number): Promise<Prepared> {
  const db = ctx.db;
  const [company] = await db.select().from(companies).where(eq(companies.id, ctx.companyId));

  // party
  const party = await getAccount(ctx, input.partyId, 'Party');
  if (def.party !== 'none' && def.lines !== 'journal' && !party) throw unprocessable('Select a party');
  if (party) {
    if (party.status === 'BLOCKED') throw unprocessable(`${party.name} is blocked — unblock the account first`);
    if (def.party === 'customer' && !['CUSTOMER', 'BROKER', 'OTHER'].includes(party.kind)) throw unprocessable(`${party.name} is not a customer account`);
    if (def.party === 'supplier' && !['SUPPLIER', 'BROKER', 'OTHER'].includes(party.kind)) throw unprocessable(`${party.name} is not a supplier / mill account`);
  }
  for (const [k, label] of [['deliveryPartyId', 'Delivery party'], ['brokerId', 'Broker'], ['millId', 'Supplier (mill)'], ['bankAccountId', 'Bank account']] as const) {
    await getAccount(ctx, input[k], label);
  }

  const stateCode = input.placeOfSupply || party?.stateCode || party?.gstin?.slice(0, 2) || company.stateCode;
  const interState = !!party && stateCode !== company.stateCode;

  // ---- lines
  const touchedOrders: number[] = [];
  let lines: Record<string, unknown>[] = [];
  if (def.lines === 'item') {
    const raw = input.lines.filter((l) => l.itemId || l.accountId || l.description || l.qty || l.amount);
    if (!raw.length) throw unprocessable('Add at least one item');
    const itemIds = [...new Set(raw.map((l) => l.itemId).filter(Boolean))] as number[];
    const itemRows = itemIds.length ? await db.select().from(items).where(and(inArray(items.id, itemIds), eq(items.companyId, ctx.companyId))) : [];
    const itemMap = new Map(itemRows.map((i) => [i.id, i]));
    const srcIds = raw.map((l) => l.sourceLineId).filter(Boolean) as number[];
    const src = await loadSourceLines(db, ctx.companyId, srcIds);

    // pending checks per source line
    const bySource = new Map<number, number>();
    raw.forEach((l) => l.sourceLineId && bySource.set(l.sourceLineId, (bySource.get(l.sourceLineId) ?? 0) + (Number(l.qty) || 0)));
    if (src.size) {
      const groups = new Map<VoucherType, number[]>();
      for (const s of src.values()) groups.set(s.vType, [...(groups.get(s.vType) ?? []), s.id]);
      for (const [stype, ids] of groups) {
        if (!def.sources.includes(stype)) throw unprocessable(`${def.label} cannot be made against a ${TYPES[stype].label.toLowerCase()}`);
        // how much of each source line is already used by documents of this type
        const by = ['SALES_ORDER', 'PURCHASE_ORDER'].includes(stype) && def.type !== 'DISPATCH_SCHEDULE' ? 'order' : 'source';
        const used = await consumedQty(db, ids, [def.type], by, existingId);
        for (const id of ids) {
          const s = src.get(id)!;
          if (['SALES_ORDER', 'PURCHASE_ORDER', 'DISPATCH_SCHEDULE'].includes(stype) && !['OPEN', 'PARTIAL'].includes(s.vStatus)) {
            throw unprocessable(`${s.vNumber} is ${s.vStatus.toLowerCase().replace('_', ' ')} — it cannot be used`);
          }
          if (party && s.vPartyId && s.vPartyId !== party.id) throw unprocessable(`${s.vNumber} belongs to another party`);
          if (s.lineStatus === 'CLOSED') throw unprocessable(`A line of ${s.vNumber} is closed`);
          const want = bySource.get(id) ?? 0;
          const left = r3(s.qty - (used.get(id) ?? 0));
          const allowed = ['SALE_RETURN', 'PURCHASE_RETURN', 'DISPATCH_SCHEDULE'].includes(def.type) ? left + 0.0005 : left * (1 + TOLERANCE) + 0.0005;
          if (want > allowed) {
            throw unprocessable(`Quantity ${want} is more than pending ${Math.max(0, left)} on ${s.vNumber}`, { sourceLineId: id, pending: left });
          }
        }
      }
    }

    lines = raw.map((l, i) => {
      const it = l.itemId ? itemMap.get(l.itemId) : undefined;
      if (l.itemId && !it) throw unprocessable(`Item on line ${i + 1} not found`);
      if (!it && !l.accountId && !l.description) throw unprocessable(`Line ${i + 1}: choose an item`);
      if (def.stock !== 0 && !it) throw unprocessable(`Line ${i + 1}: stock documents need a yarn item`);
      if (!(Number(l.qty) > 0) && !(Number(l.amount) > 0)) throw unprocessable(`Line ${i + 1}: enter a quantity`);
      const s = l.sourceLineId ? src.get(l.sourceLineId) : undefined;
      let orderLineId: number | null = null;
      if (s) {
        orderLineId = ['SALES_ORDER', 'PURCHASE_ORDER'].includes(s.vType) ? s.id : s.orderLineId;
        touchedOrders.push(s.voucherId);
      }
      return {
        lineNo: i + 1,
        itemId: it?.id ?? null,
        accountId: l.accountId ?? null,
        description: l.description ?? it?.name ?? null,
        brand: l.brand ?? null,
        lotNo: l.lotNo ?? null,
        grade: l.grade ?? null,
        hsn: l.hsn || it?.hsn || null,
        unit: l.unit || it?.unit || 'KG',
        godownId: l.godownId ?? input.godownId ?? null,
        pcs: Number(l.pcs) || 0,
        cops: Number(l.cops) || 0,
        qty: r3(Number(l.qty) || 0),
        rate: Number(l.rate) || 0,
        discPct: Number(l.discPct) || 0,
        discAmount: Number(l.discAmount) || 0,
        freightPct: Number(l.freightPct) || 0,
        freightAmount: Number(l.freightAmount) || 0,
        insurancePct: Number(l.insurancePct) || 0,
        insuranceAmount: Number(l.insuranceAmount) || 0,
        gstRate: l.gstRate ?? it?.gstRate ?? (def.posting === 'note' ? 0 : 5),
        amount: Number(l.amount) || 0,
        remark1: l.remark1 ?? null,
        remark2: l.remark2 ?? null,
        challanNo: l.challanNo ?? null,
        challanDate: l.challanDate ?? null,
        purchaseRef: l.purchaseRef ?? null,
        purchaseInvNo: l.purchaseInvNo ?? null,
        lrNo: l.lrNo ?? null,
        sourceLineId: l.sourceLineId ?? null,
        orderLineId
      };
    });
    touchedOrders.push(...(await orderVouchersOf(db, lines.map((l) => l.orderLineId as number | null))));
  } else if (def.lines === 'journal') {
    const raw = input.lines.filter((l) => l.accountId && (Number(l.debit) || Number(l.credit)));
    if (raw.length < 2) throw unprocessable('A voucher needs at least one debit and one credit line');
    for (const [i, l] of raw.entries()) {
      await getAccount(ctx, l.accountId, `Account on line ${i + 1}`);
      if (Number(l.debit) && Number(l.credit)) throw unprocessable(`Line ${i + 1}: enter either debit or credit`);
    }
    const dr = r2(sum(raw, (l) => Number(l.debit) || 0));
    const cr = r2(sum(raw, (l) => Number(l.credit) || 0));
    if (dr !== cr) throw unprocessable(`Debit (${dr}) and credit (${cr}) must be equal`);
    lines = raw.map((l, i) => ({ lineNo: i + 1, accountId: l.accountId, description: l.description ?? null, debit: r2(Number(l.debit) || 0), credit: r2(Number(l.credit) || 0), remark1: l.remark1 ?? null }));
  }

  // ---- totals
  const tdsRate = def.type === 'PURCHASE_BILL' ? Number(input.tdsRate ?? (party?.tdsApplicable ? party.tdsRate : 0)) || 0 : 0;
  const isTcs = input.isTcs ?? (def.posting === 'sale' ? !!party?.tcsApplicable : false);
  const tcsRate = isTcs ? Number(input.tcsRate ?? party?.tcsRate ?? 0.1) || 0 : 0;
  let totals: Record<string, number> = {};
  if (def.lines === 'item') {
    const c = calcDocument(lines as never[], { interState, tax: def.tax, isTcs, tcsRate, tdsRate, addLess: input.addLess ?? 0, discounts: input.discounts });
    lines = c.lines as never;
    totals = c.totals as never;
  } else if (def.lines === 'journal') {
    const amt = r2(sum(lines, (l) => Number(l.debit) || 0));
    totals = { netAmount: amt };
  } else {
    const amt = r2(Number(input.amount) || 0);
    if (!(amt > 0)) throw unprocessable('Enter an amount');
    if (!input.bankAccountId) throw unprocessable('Select the bank / cash account');
    totals = { netAmount: amt };
  }

  // ---- allocations (receipts / payments) & automatic ones (returns)
  let allocations: { billId: number; amount: number }[] = [];
  if (def.type === 'RECEIPT' || def.type === 'PAYMENT') {
    const side = def.type === 'RECEIPT' ? 'receivable' : 'payable';
    const kinds = BILL_TYPES[side];
    let req = input.allocations ?? [];
    if (input.autoAdjust && !req.length && party) {
      const open = await openBills(ctx, party.id, side, existingId);
      let left = totals.netAmount;
      req = [];
      for (const b of open) {
        if (left <= 0) break;
        const a = r2(Math.min(left, b.pending));
        req.push({ billId: b.id, amount: a });
        left = r2(left - a);
      }
    }
    if (req.length) {
      const bills = await db.select().from(vouchers).where(and(inArray(vouchers.id, req.map((a) => a.billId)), eq(vouchers.companyId, ctx.companyId)));
      const pend = await billPending(db, bills.map((b) => b.id), existingId);
      for (const a of req) {
        const b = bills.find((x) => x.id === a.billId);
        if (!b || !kinds.includes(b.type as VoucherType) || !isBill(b.type, party?.kind, side)) throw unprocessable(`Bill ${a.billId} cannot be adjusted here`);
        if (party && b.partyId !== party.id) throw unprocessable(`Bill ${b.number} belongs to another party`);
        if (a.amount > (pend.get(b.id) ?? 0) + 0.005) throw unprocessable(`Adjustment on ${b.number} is more than its pending ₹${pend.get(b.id)}`);
      }
      if (sum(req, (a) => a.amount) > totals.netAmount + 0.005) throw unprocessable('Adjusted amount is more than the voucher amount');
      allocations = req.map((a) => ({ billId: a.billId, amount: r2(a.amount) }));
    }
  }

  // ---- approval rules
  const approvalReasons: string[] = [];
  if (def.approval === 'credit' && party) {
    const bal = await accountBalance(db, ctx.companyId, party.id);
    if (party.status === 'ON_HOLD') approvalReasons.push(`${party.name} is on hold`);
    if (party.creditLimit > 0 && bal + (totals.netAmount ?? 0) > party.creditLimit) {
      approvalReasons.push(`Credit limit ₹${party.creditLimit} exceeded (outstanding ₹${bal} + this order ₹${totals.netAmount})`);
    }
    const overdue = await db.execute<{ n: string }>(sql`
      select count(*) as n from vouchers v
      where v.company_id = ${ctx.companyId} and v.party_id = ${party.id} and v.type in ('SALE_BILL','GENERAL_SALE')
        and v.due_date < ${addDays(today(), -30)}
        and v.net_amount - coalesce((select sum(a.amount) from bill_allocations a where a.bill_id = v.id), 0) > 1`);
    if (Number(overdue.rows[0].n) > 0) approvalReasons.push('Party has bills overdue by more than 30 days');
  }
  if (def.approval === 'amount' && (totals.netAmount ?? 0) > company.poApprovalLimit) {
    approvalReasons.push(`Order value ₹${totals.netAmount} is above the approval limit ₹${company.poApprovalLimit}`);
  }

  const creditDays = input.creditDays ?? party?.creditDays ?? 0;
  const header: Record<string, unknown> = {
    bookId: input.bookId ?? null,
    date: input.date,
    partyId: party?.id ?? null,
    deliveryPartyId: input.deliveryPartyId ?? null,
    brokerId: input.brokerId ?? party?.brokerId ?? null,
    brokerageRate: input.brokerageRate ?? party?.brokerageRate ?? 0,
    brokerageType: input.brokerageType ?? party?.brokerageType ?? 'PER_KG',
    millId: input.millId ?? null,
    salesPersonId: input.salesPersonId ?? party?.salesPersonId ?? null,
    costCenterId: input.costCenterId ?? null,
    godownId: input.godownId ?? null,
    toGodownId: input.toGodownId ?? null,
    bankAccountId: input.bankAccountId ?? null,
    collectionPerson: input.collectionPerson ?? null,
    collectionPersonId: input.collectionPersonId ?? (def.type === 'RECEIPT' ? party?.collectionPersonId ?? null : null),
    sourceId: input.sourceId ?? (touchedOrders[0] ?? null),
    refNo: input.refNo ?? null,
    refDate: input.refDate ?? null,
    refName: input.refName ?? null,
    doNo: input.doNo ?? null,
    opportunityNo: input.opportunityNo ?? null,
    reason: input.reason ?? null,
    creditDays,
    dueDate: input.dueDate ?? (def.bill || def.posting === 'note' || def.type === 'SALES_ORDER' ? addDays(input.date, creditDays) : null),
    expDeliveryDate: input.expDeliveryDate ?? null,
    processType: input.processType ?? null,
    orderType: input.orderType ?? null,
    priority: input.priority ?? 'NORMAL',
    terms: input.terms ?? null,
    transporterId: input.transporterId ?? (party?.transporterId || null),
    vehicleNo: input.vehicleNo ?? null,
    lrNo: input.lrNo ?? null,
    lrDate: input.lrDate ?? null,
    parcels: input.parcels ?? null,
    driverName: input.driverName ?? null,
    deliveryAddress: input.deliveryAddress ?? null,
    distanceKm: input.distanceKm ?? null,
    interState,
    placeOfSupply: party ? stateCode : null,
    reverseCharge: input.reverseCharge ?? false,
    isTcs,
    tcsRate,
    tdsRate,
    currency: input.currency ?? 'INR',
    exchangeRate: input.exchangeRate ?? 1,
    discounts: input.discounts ?? [],
    mode: input.mode ?? null,
    instrumentNo: input.instrumentNo ?? null,
    instrumentDate: input.instrumentDate ?? null,
    amount: def.lines === 'none' ? totals.netAmount : 0,
    remark: input.remark ?? null,
    narration: input.narration ?? null,
    ...totals
  };
  if (def.ewb) {
    header.ewbStatus = (totals.netAmount ?? 0) >= company.ewbThreshold ? 'PENDING' : 'NOT_REQUIRED';
    if (input.ewbNo) Object.assign(header, { ewbNo: input.ewbNo, ewbStatus: 'GENERATED' });
  }

  // a note made against a bill: a credit note to a customer / debit note to a supplier settles it
  if (def.posting === 'note' && input.sourceId && party) {
    const [b] = await db.select().from(vouchers).where(and(eq(vouchers.id, input.sourceId), eq(vouchers.companyId, ctx.companyId)));
    if (!b || b.partyId !== party.id) throw unprocessable('The bill does not belong to this party');
    const settles = (def.type === 'CREDIT_NOTE' && isBill(b.type, party.kind, 'receivable')) || (def.type === 'DEBIT_NOTE' && isBill(b.type, party.kind, 'payable'));
    if (settles) {
      const pend = (await billPending(db, [b.id], existingId)).get(b.id) ?? 0;
      const a = r2(Math.min(pend, totals.netAmount ?? 0));
      if (a > 0) allocations = [{ billId: b.id, amount: a }];
    }
  }

  // automatic allocation of a return against its bill
  if ((def.type === 'SALE_RETURN' || def.type === 'PURCHASE_RETURN') && touchedOrders.length) {
    const billId = touchedOrders[0];
    const pend = (await billPending(db, [billId], existingId)).get(billId) ?? 0;
    const a = r2(Math.min(pend, totals.netAmount ?? 0));
    if (a > 0) allocations = [{ billId, amount: a }];
  }

  return { header, lines, touchedOrders, allocations, approvalReasons };
}

/** open bills of a party, oldest first */
export async function openBills(ctx: Ctx, partyId: number, side: 'receivable' | 'payable', excludeVoucherId?: number) {
  const res = await ctx.db.execute(sql`
    select v.id, v.number, v.date, v.due_date as "dueDate", v.net_amount as net, v.tds_amount as tds, v.type
    from vouchers v join accounts p on p.id = v.party_id
    where v.company_id = ${ctx.companyId} and v.party_id = ${partyId} and ${sql.raw(BILL_SQL[side])}
    order by v.date, v.id`);
  const rows = res.rows.map((r: Record<string, unknown>) => ({ id: Number(r.id), number: r.number as string, date: r.date as string, dueDate: r.dueDate as string | null, net: Number(r.net), tds: Number(r.tds), type: r.type as string }));
  const pend = await billPending(ctx.db, rows.map((r) => r.id), excludeVoucherId);
  return rows.map((r) => ({ ...r, pending: pend.get(r.id) ?? 0 })).filter((r) => r.pending > 0.005);
}

/* ----------------------------------------------------------- posting */
async function post(ctx: Ctx, def: TypeDef, v: typeof vouchers.$inferSelect, lines: (typeof voucherLines.$inferSelect)[]) {
  const db = ctx.db;
  const S = (code: string) => sysAccount(db, ctx.companyId, code);
  const entries: { accountId: number; debit: number; credit: number; narration?: string }[] = [];
  const dr = (accountId: number, amt: number, narration?: string) => amt && entries.push({ accountId, debit: amt > 0 ? r2(amt) : 0, credit: amt < 0 ? r2(-amt) : 0, narration });
  const cr = (accountId: number, amt: number, narration?: string) => dr(accountId, -amt, narration);
  const book = v.bookId ? (await db.select().from(books).where(eq(books.id, v.bookId)))[0] : null;
  const narr = `${def.label} ${v.number}`;

  if (def.posting === 'sale' || def.posting === 'saleReturn' || def.posting === 'purchase' || def.posting === 'purchaseReturn') {
    const sign = def.posting === 'sale' || def.posting === 'purchaseReturn' ? 1 : -1; // +1 = party debited
    const isSale = def.posting === 'sale' || def.posting === 'saleReturn';
    const fallback = { sale: SYS.SALES, saleReturn: SYS.SALES_RETURN, purchase: SYS.PURCHASE, purchaseReturn: SYS.PURCHASE_RETURN }[def.posting];
    const main = book?.postingAccountId ?? (await S(def.type === 'GENERAL_SALE' ? SYS.GENERAL_SALES : def.type === 'GENERAL_PURCHASE' ? SYS.GENERAL_PURCHASE : fallback));
    // party
    dr(v.partyId!, sign * v.netAmount, narr);
    // revenue / cost — per line ledger when given (general sale / purchase), else book ledger
    const byAcc = new Map<number, number>();
    for (const l of lines) byAcc.set(l.accountId ?? main, (byAcc.get(l.accountId ?? main) ?? 0) + l.taxableAmount);
    const lineTaxable = sum([...byAcc.values()], (x) => x);
    const headerDisc = r2(lineTaxable - v.taxableAmount);
    if (headerDisc) byAcc.set(main, (byAcc.get(main) ?? 0) - headerDisc);
    for (const [acc, amt] of byAcc) cr(acc, sign * amt, narr);
    // taxes
    const [c, s, i] = isSale ? [SYS.CGST_OUT, SYS.SGST_OUT, SYS.IGST_OUT] : [SYS.CGST_IN, SYS.SGST_IN, SYS.IGST_IN];
    if (v.cgstAmount) cr(await S(c), sign * v.cgstAmount);
    if (v.sgstAmount) cr(await S(s), sign * v.sgstAmount);
    if (v.igstAmount) cr(await S(i), sign * v.igstAmount);
    if (v.tcsAmount) cr(await S(isSale ? SYS.TCS_PAYABLE : SYS.TCS_RECEIVABLE), sign * v.tcsAmount);
    if (v.addLess) cr(await S(SYS.OTHER_CHARGES), sign * v.addLess);
    if (v.roundOff) cr(await S(SYS.ROUND_OFF), sign * v.roundOff);
    // TDS deducted on purchase (194Q): party Dr, TDS payable Cr
    if (v.tdsAmount) {
      dr(v.partyId!, v.tdsAmount, `TDS on ${v.number}`);
      cr(await S(SYS.TDS_PAYABLE), v.tdsAmount, `TDS on ${v.number}`);
    }
  } else if (def.posting === 'note') {
    // DN debits the party, CN credits it; customer side uses output GST, supplier side input GST
    const party = (await db.select().from(accounts).where(eq(accounts.id, v.partyId!)))[0];
    const supplierSide = party?.kind === 'SUPPLIER';
    const sign = def.type === 'DEBIT_NOTE' ? 1 : -1;
    const fallback = def.type === 'DEBIT_NOTE' ? (supplierSide ? SYS.DISCOUNT_RECEIVED : SYS.INTEREST_RECEIVED) : supplierSide ? SYS.INTEREST_PAID : SYS.DISCOUNT_ALLOWED;
    const main = book?.postingAccountId ?? (await S(fallback));
    dr(v.partyId!, sign * v.netAmount, narr);
    const byAcc = new Map<number, number>();
    for (const l of lines) byAcc.set(l.accountId ?? main, (byAcc.get(l.accountId ?? main) ?? 0) + l.taxableAmount);
    for (const [acc, amt] of byAcc) cr(acc, sign * amt, narr);
    const [c, s, i] = supplierSide ? [SYS.CGST_IN, SYS.SGST_IN, SYS.IGST_IN] : [SYS.CGST_OUT, SYS.SGST_OUT, SYS.IGST_OUT];
    if (v.cgstAmount) cr(await S(c), sign * v.cgstAmount);
    if (v.sgstAmount) cr(await S(s), sign * v.sgstAmount);
    if (v.igstAmount) cr(await S(i), sign * v.igstAmount);
    if (v.addLess) cr(await S(SYS.OTHER_CHARGES), sign * v.addLess);
    if (v.roundOff) cr(await S(SYS.ROUND_OFF), sign * v.roundOff);
  } else if (def.posting === 'receipt') {
    dr(v.bankAccountId!, v.amount, narr);
    cr(v.partyId!, v.amount, narr);
  } else if (def.posting === 'payment') {
    dr(v.partyId!, v.amount, narr);
    cr(v.bankAccountId!, v.amount, narr);
  } else if (def.posting === 'journal') {
    for (const l of lines) {
      if (l.debit) dr(l.accountId!, l.debit, l.description ?? narr);
      if (l.credit) cr(l.accountId!, l.credit, l.description ?? narr);
    }
  }

  if (entries.length) {
    const d = r2(sum(entries, (e) => e.debit));
    const c = r2(sum(entries, (e) => e.credit));
    if (Math.abs(d - c) > 0.01) throw new Error(`Posting for ${v.number} does not balance (Dr ${d} / Cr ${c})`);
    await db.insert(ledgerEntries).values(entries.filter((e) => e.debit || e.credit).map((e) => ({ companyId: ctx.companyId, fyId: v.fyId, voucherId: v.id, date: v.date, accountId: e.accountId, debit: e.debit, credit: e.credit, narration: e.narration ?? narr })));
  }

  // stock
  if (def.stock !== 0) {
    let defGodown = v.godownId;
    if (!defGodown) {
      const [g] = await db.select().from(godowns).where(and(eq(godowns.companyId, ctx.companyId), eq(godowns.isDefault, true)));
      defGodown = g?.id ?? null;
    }
    const rows: (typeof stockEntries.$inferInsert)[] = [];
    for (const l of lines) {
      if (!l.itemId) continue;
      const base = { companyId: ctx.companyId, fyId: v.fyId, voucherId: v.id, voucherLineId: l.id, date: v.date, itemId: l.itemId, brand: l.brand, lotNo: l.lotNo, grade: l.grade, rate: l.rate, value: r2(l.qty * l.rate) };
      const g = l.godownId ?? defGodown;
      if (def.stock === 1) rows.push({ ...base, godownId: g, qtyIn: l.qty, pcsIn: l.pcs });
      else if (def.stock === -1) rows.push({ ...base, godownId: g, qtyOut: l.qty, pcsOut: l.pcs });
      else {
        rows.push({ ...base, godownId: g, qtyOut: l.qty, pcsOut: l.pcs });
        rows.push({ ...base, godownId: v.toGodownId, qtyIn: l.qty, pcsIn: l.pcs });
      }
    }
    if (def.stock === -1 || def.stock === 2) {
      // never allow stock to go negative
      const need = new Map<string, { k: { itemId: number; lotNo: string | null; grade: string | null; godownId: number | null }; q: number; name: string }>();
      for (const l of lines) {
        if (!l.itemId) continue;
        const godownId = def.stock === 2 ? l.godownId ?? defGodown : l.godownId ?? null;
        const key = [l.itemId, l.lotNo ?? '', l.grade ?? '', godownId ?? ''].join('|');
        const cur = need.get(key) ?? { k: { itemId: l.itemId, lotNo: l.lotNo, grade: l.grade, godownId }, q: 0, name: l.description ?? '' };
        cur.q += l.qty;
        need.set(key, cur);
      }
      for (const { k, q, name } of need.values()) {
        const avail = await stockAvailable(db, ctx.companyId, k);
        if (q > avail + 0.0005) throw unprocessable(`Not enough stock of ${name}${k.lotNo ? ' lot ' + k.lotNo : ''}${k.grade ? ' ' + k.grade : ''}: available ${avail} kg, needed ${r3(q)} kg`);
      }
    }
    if (rows.length) await db.insert(stockEntries).values(rows);
  }
}

async function clearPostings(db: Tx, voucherId: number) {
  await db.delete(ledgerEntries).where(eq(ledgerEntries.voucherId, voucherId));
  await db.delete(stockEntries).where(eq(stockEntries.voucherId, voucherId));
  await db.delete(billAllocations).where(eq(billAllocations.voucherId, voucherId));
}

/** documents built on this one (block edits / deletes) */
export async function dependents(db: Tx, voucherId: number) {
  const res = await db.execute<{ id: number; type: VoucherType; number: string; date: string }>(sql`
    select distinct c.id, c.type, c.number, c.date from voucher_lines cl
    join vouchers c on c.id = cl.voucher_id
    where cl.source_line_id in (select id from voucher_lines where voucher_id = ${voucherId})
       or cl.order_line_id in (select id from voucher_lines where voucher_id = ${voucherId})
    union
    select distinct c.id, c.type, c.number, c.date from bill_allocations a join vouchers c on c.id = a.voucher_id
    where a.bill_id = ${voucherId}
    order by date, id`);
  return res.rows.map((r) => ({ id: Number(r.id), type: r.type, number: r.number, date: r.date }));
}

/* ------------------------------------------------------------- public API */
export async function createDoc(ctx: Ctx, def: TypeDef, raw: unknown) {
  requireRole(ctx, def.write, `create a ${def.label.toLowerCase()}`);
  const input = docSchema.parse(raw);
  const fy = await assertWritableFy(ctx, input.date);
  const p = await prepare(ctx, def, input);

  const book = p.header.bookId
    ? (await ctx.db.select().from(books).where(and(eq(books.id, p.header.bookId as number), eq(books.companyId, ctx.companyId), eq(books.voucherType, def.type))))[0]
    : await defaultBook(ctx.db, ctx.companyId, def.type);
  if (!book) throw unprocessable('Book does not belong to this document type');

  let number = input.number?.trim();
  let seq = 0;
  if (number) {
    const dup = await ctx.db.select({ id: vouchers.id }).from(vouchers).where(and(eq(vouchers.companyId, ctx.companyId), eq(vouchers.fyId, ctx.fyId), eq(vouchers.type, def.type), eq(vouchers.number, number)));
    if (dup.length) throw conflict(`${def.label} ${number} already exists`);
  } else {
    ({ number, seq } = await nextNumber(ctx, book.id, fy.label));
  }

  const status = def.posting !== 'none' || def.stock !== 0 ? 'POSTED' : p.approvalReasons.length ? 'PENDING_APPROVAL' : 'OPEN';
  const [v] = await ctx.db
    .insert(vouchers)
    .values({ ...(p.header as object), companyId: ctx.companyId, fyId: ctx.fyId, type: def.type, bookId: book.id, number, seq, status: status as never, createdById: ctx.userId, updatedById: ctx.userId } as never)
    .returning();
  const lines = p.lines.length ? await ctx.db.insert(voucherLines).values(p.lines.map((l) => ({ ...l, voucherId: v.id })) as never).returning() : [];
  await post(ctx, def, v, lines);
  if (p.allocations.length) await ctx.db.insert(billAllocations).values(p.allocations.map((a) => ({ ...a, companyId: ctx.companyId, voucherId: v.id })));
  if (p.approvalReasons.length) await ctx.db.insert(approvalLogs).values({ voucherId: v.id, action: 'SUBMITTED', reason: p.approvalReasons.join('; '), userId: ctx.userId });
  await refreshStatuses(ctx.db, p.touchedOrders);
  await audit(ctx, def.slug, v.id, 'CREATE', `${def.label} ${number} created`);
  return getDoc(ctx, def, v.id);
}

export async function updateDoc(ctx: Ctx, def: TypeDef, id: number, raw: unknown) {
  requireRole(ctx, def.write, `edit a ${def.label.toLowerCase()}`);
  const input = docSchema.parse(raw);
  const old = await mustGet(ctx, def, id);
  await assertWritableFy(ctx, old.date);
  await assertWritableFy(ctx, input.date);
  if (['CANCELLED', 'LOCKED'].includes(old.status)) throw conflict(`${old.number} is ${old.status.toLowerCase()} and cannot be edited`);
  const deps = (await dependents(ctx.db, id)).filter((d) => !(def.bill && ['RECEIPT', 'PAYMENT'].includes(d.type)));
  if (deps.length) throw conflict(`${old.number} is already used in ${deps.map((d) => d.number).join(', ')} — change those first`);

  const oldLines = await ctx.db.select().from(voucherLines).where(eq(voucherLines.voucherId, id));
  const oldSources = (await loadSourceLines(ctx.db, ctx.companyId, oldLines.map((l) => l.sourceLineId).filter(Boolean) as number[]));
  await clearPostings(ctx.db, id);
  await ctx.db.delete(voucherLines).where(eq(voucherLines.voucherId, id));
  const p = await prepare(ctx, def, input, id);

  // bills that are already (partly) settled cannot drop below the settled amount
  if (def.bill) {
    const settled = r2((await ctx.db.select({ s: sql<string>`coalesce(sum(amount),0)` }).from(billAllocations).where(eq(billAllocations.billId, id)))[0].s as unknown as number);
    if (Number(settled) > (p.header.netAmount as number) - (p.header.tdsAmount as number ?? 0) + 0.005) throw conflict(`₹${settled} of this bill is already settled; the new amount cannot be lower`);
  }

  let status = old.status;
  if (def.approval && p.approvalReasons.length && !['PENDING_APPROVAL'].includes(old.status)) status = 'PENDING_APPROVAL';
  if (def.approval && !p.approvalReasons.length && ['PENDING_APPROVAL', 'REJECTED'].includes(old.status)) status = 'OPEN';
  const number = input.number?.trim() || old.number;
  await ctx.db
    .update(vouchers)
    .set({ ...(p.header as object), bookId: (p.header.bookId as number) ?? old.bookId, number, status: status as never, updatedById: ctx.userId, updatedAt: new Date() } as never)
    .where(eq(vouchers.id, id));
  const [v] = await ctx.db.select().from(vouchers).where(eq(vouchers.id, id));
  const lines = p.lines.length ? await ctx.db.insert(voucherLines).values(p.lines.map((l) => ({ ...l, voucherId: id })) as never).returning() : [];
  await post(ctx, def, v, lines);
  if (p.allocations.length) await ctx.db.insert(billAllocations).values(p.allocations.map((a) => ({ ...a, companyId: ctx.companyId, voucherId: id })));
  if (status === 'PENDING_APPROVAL' && old.status !== 'PENDING_APPROVAL') await ctx.db.insert(approvalLogs).values({ voucherId: id, action: 'SUBMITTED', reason: p.approvalReasons.join('; '), userId: ctx.userId });
  await refreshStatuses(ctx.db, [...p.touchedOrders, ...[...oldSources.values()].map((s) => s.voucherId), ...(await orderVouchersOf(ctx.db, oldLines.map((l) => l.orderLineId))), id]);
  await audit(ctx, def.slug, id, 'UPDATE', `${def.label} ${number} updated`);
  return getDoc(ctx, def, id);
}

export async function deleteDoc(ctx: Ctx, def: TypeDef, id: number) {
  requireRole(ctx, def.write, `delete a ${def.label.toLowerCase()}`);
  const old = await mustGet(ctx, def, id);
  await assertWritableFy(ctx, old.date);
  if (old.status === 'LOCKED') throw conflict(`${old.number} is locked`);
  const deps = await dependents(ctx.db, id);
  if (deps.length) throw conflict(`${old.number} is used in ${deps.map((d) => d.number).join(', ')} — delete those first`);
  const lines = await ctx.db.select().from(voucherLines).where(eq(voucherLines.voucherId, id));
  const src = await loadSourceLines(ctx.db, ctx.companyId, lines.map((l) => l.sourceLineId).filter(Boolean) as number[]);
  const orders = await orderVouchersOf(ctx.db, lines.map((l) => l.orderLineId));
  await ctx.db.delete(vouchers).where(eq(vouchers.id, id));
  await refreshStatuses(ctx.db, [...[...src.values()].map((s) => s.voucherId), ...orders]);
  await audit(ctx, def.slug, id, 'DELETE', `${def.label} ${old.number} deleted`, { number: old.number });
  return { ok: true };
}

/** Workflow actions: approve | reject | cancel | close | lock | unlock | reopen */
export async function docAction(ctx: Ctx, def: TypeDef, id: number, action: string, reason?: string) {
  const v = await mustGet(ctx, def, id);
  await assertWritableFy(ctx, v.date);
  const set = async (status: string, log?: string) => {
    await ctx.db.update(vouchers).set({ status: status as never, updatedById: ctx.userId, updatedAt: new Date(), ...(log === 'APPROVED' ? { approvedById: ctx.userId, approvedAt: new Date(), approvalNote: reason ?? null } : {}), ...(log === 'REJECTED' ? { approvalNote: reason ?? null } : {}) }).where(eq(vouchers.id, id));
    if (log) await ctx.db.insert(approvalLogs).values({ voucherId: id, action: log, reason: reason ?? null, userId: ctx.userId });
  };
  switch (action) {
    case 'approve':
    case 'reject': {
      requireRole(ctx, ['ADMIN'], 'approvals');
      if (v.status !== 'PENDING_APPROVAL') throw conflict(`${v.number} is not waiting for approval`);
      if (action === 'approve') {
        await set('OPEN', 'APPROVED');
        await refreshStatuses(ctx.db, [id]);
      } else {
        if (!reason) throw unprocessable('Give a reason for rejecting');
        await set('REJECTED', 'REJECTED');
      }
      break;
    }
    case 'cancel': {
      requireRole(ctx, def.write, 'cancel');
      if (!ORDER_TYPES.includes(def.type)) throw badRequest('Only orders and schedules can be cancelled; delete bills instead');
      const deps = await dependents(ctx.db, id);
      if (deps.length) throw conflict(`${v.number} already has ${deps.map((d) => d.number).join(', ')}`);
      await set('CANCELLED', 'CANCELLED');
      break;
    }
    case 'close': {
      requireRole(ctx, def.write, 'close');
      if (!ORDER_TYPES.includes(def.type) || !['OPEN', 'PARTIAL'].includes(v.status)) throw conflict(`${v.number} cannot be closed now`);
      await ctx.db.update(voucherLines).set({ lineStatus: 'CLOSED' }).where(eq(voucherLines.voucherId, id));
      await refreshStatuses(ctx.db, [id]);
      break;
    }
    case 'reopen': {
      requireRole(ctx, def.write, 'reopen');
      if (!ORDER_TYPES.includes(def.type)) throw badRequest('Only orders can be reopened');
      if (v.status === 'LOCKED') throw conflict('Unlock it first');
      await ctx.db.update(voucherLines).set({ lineStatus: null }).where(eq(voucherLines.voucherId, id));
      if (['CANCELLED', 'REJECTED', 'COMPLETED'].includes(v.status)) await set('OPEN', 'REOPENED');
      await refreshStatuses(ctx.db, [id]);
      break;
    }
    case 'lock':
      requireRole(ctx, ['ADMIN', 'ACCOUNTANT'], 'lock');
      await ctx.db.update(vouchers).set({ status: 'LOCKED', approvalNote: v.status }).where(eq(vouchers.id, id));
      break;
    case 'unlock': {
      requireRole(ctx, ['ADMIN', 'ACCOUNTANT'], 'unlock');
      if (v.status !== 'LOCKED') throw conflict(`${v.number} is not locked`);
      const prev = (v.approvalNote && ['OPEN', 'PARTIAL', 'COMPLETED', 'POSTED', 'PENDING_APPROVAL'].includes(v.approvalNote) ? v.approvalNote : def.posting !== 'none' ? 'POSTED' : 'OPEN');
      await ctx.db.update(vouchers).set({ status: prev as never, approvalNote: null }).where(eq(vouchers.id, id));
      await refreshStatuses(ctx.db, [id]);
      break;
    }
    default:
      throw badRequest(`Unknown action ${action}`);
  }
  await audit(ctx, def.slug, id, 'ACTION', `${def.label} ${v.number}: ${action}${reason ? ' — ' + reason : ''}`);
  return getDoc(ctx, def, id);
}

async function mustGet(ctx: Ctx, def: TypeDef, id: number) {
  const [v] = await ctx.db.select().from(vouchers).where(and(eq(vouchers.id, id), eq(vouchers.companyId, ctx.companyId), eq(vouchers.type, def.type)));
  if (!v) throw notFound(def.label);
  return v;
}

/* ------------------------------------------------------------------ reads */
export async function getDoc(ctx: Ctx, def: TypeDef, id: number) {
  const v = await mustGet(ctx, def, id);
  const db = ctx.db;
  const lines = await db
    .select({ l: voucherLines, itemName: items.name, itemCode: items.code, accountName: accounts.name })
    .from(voucherLines)
    .leftJoin(items, eq(items.id, voucherLines.itemId))
    .leftJoin(accounts, eq(accounts.id, voucherLines.accountId))
    .where(eq(voucherLines.voucherId, id))
    .orderBy(voucherLines.lineNo);
  const lineIds = lines.map((x) => x.l.id);
  // pending per line for orders / schedules / bills (returns)
  const cons = CONSUMERS[def.type];
  const used = cons ? await consumedQty(db, lineIds, cons.types, cons.by) : new Map<number, number>();
  const scheduled = SCHEDULED_BY[def.type] ? await consumedQty(db, lineIds, SCHEDULED_BY[def.type]!, 'source') : new Map<number, number>();
  const srcIds = lines.map((x) => x.l.sourceLineId).filter(Boolean) as number[];
  const src = await loadSourceLines(db, ctx.companyId, srcIds);

  const names = await nameMap(ctx, [v.partyId, v.deliveryPartyId, v.brokerId, v.millId, v.bankAccountId]);
  const party = v.partyId ? (await db.select().from(accounts).where(eq(accounts.id, v.partyId)))[0] : null;
  const allocations = await db
    .select({ billId: billAllocations.billId, amount: billAllocations.amount, number: vouchers.number, date: vouchers.date, net: vouchers.netAmount })
    .from(billAllocations)
    .innerJoin(vouchers, eq(vouchers.id, billAllocations.billId))
    .where(eq(billAllocations.voucherId, id));
  const settledBy = def.bill || def.posting === 'note'
    ? await db.select({ voucherId: billAllocations.voucherId, amount: billAllocations.amount, number: vouchers.number, date: vouchers.date, type: vouchers.type }).from(billAllocations).innerJoin(vouchers, eq(vouchers.id, billAllocations.voucherId)).where(eq(billAllocations.billId, id))
    : [];
  const isBillDoc = def.posting === 'note' ? isBill(def.type, party?.kind, def.type === 'DEBIT_NOTE' ? 'receivable' : 'payable') : !!def.bill;
  const pending = isBillDoc ? (await billPending(db, [id])).get(id) ?? 0 : null;
  const sourceDoc = v.sourceId ? (await db.select({ id: vouchers.id, number: vouchers.number, type: vouchers.type, date: vouchers.date }).from(vouchers).where(eq(vouchers.id, v.sourceId)))[0] ?? null : null;
  const approvals = await db.select().from(approvalLogs).where(eq(approvalLogs.voucherId, id)).orderBy(approvalLogs.at);

  return {
    ...v,
    typeSlug: def.slug,
    party: party ? { id: party.id, name: party.name, city: party.city, gstin: party.gstin, pan: party.pan, stateCode: party.stateCode, creditLimit: party.creditLimit, creditDays: party.creditDays, status: party.status } : null,
    partyName: names.get(v.partyId ?? 0) ?? null,
    deliveryPartyName: names.get(v.deliveryPartyId ?? 0) ?? null,
    brokerName: names.get(v.brokerId ?? 0) ?? null,
    millName: names.get(v.millId ?? 0) ?? null,
    bankAccountName: names.get(v.bankAccountId ?? 0) ?? null,
    source: sourceDoc,
    lines: lines.map(({ l, itemName, itemCode, accountName }) => {
      const u = used.get(l.id) ?? 0;
      const sc = scheduled.get(l.id) ?? 0;
      const s = l.sourceLineId ? src.get(l.sourceLineId) : undefined;
      return {
        ...l,
        itemName,
        itemCode,
        accountName,
        sourceNumber: s?.vNumber ?? null,
        doneQty: cons ? u : undefined,
        pendingQty: cons ? (l.lineStatus === 'CLOSED' ? 0 : r3(Math.max(0, l.qty - u))) : undefined,
        scheduledQty: SCHEDULED_BY[def.type] ? sc : undefined
      };
    }),
    allocations,
    settledBy,
    pending,
    dependents: await dependents(db, id),
    approvals
  };
}

async function nameMap(ctx: Ctx, ids: (number | null)[]) {
  const list = [...new Set(ids.filter(Boolean))] as number[];
  if (!list.length) return new Map<number, string>();
  const rows = await ctx.db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(inArray(accounts.id, list));
  return new Map(rows.map((r) => [r.id, r.name]));
}

export interface ListQuery {
  from?: string;
  to?: string;
  status?: string;
  partyId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
  view?: 'header' | 'lines';
  ewbStatus?: string;
}

/** Register data. view=lines → one row per item line with pending quantities (order registers). */
export async function listDocs(ctx: Ctx, def: TypeDef, qy: ListQuery) {
  const db = ctx.db;
  const pageSize = Math.min(Math.max(Number(qy.pageSize) || 100, 1), 1000);
  const page = Math.max(Number(qy.page) || 1, 1);
  const where = sql.join(
    [
      sql`v.company_id = ${ctx.companyId}`,
      sql`v.fy_id = ${ctx.fyId}`,
      sql`v.type = ${def.type}`,
      qy.from ? sql`v.date >= ${qy.from}` : undefined,
      qy.to ? sql`v.date <= ${qy.to}` : undefined,
      qy.status ? sql`v.status = ${qy.status}` : undefined,
      qy.ewbStatus ? sql`v.ewb_status = ${qy.ewbStatus}` : undefined,
      qy.partyId ? sql`v.party_id = ${qy.partyId}` : undefined,
      qy.q ? sql`(v.number ilike ${'%' + qy.q + '%'} or p.name ilike ${'%' + qy.q + '%'})` : undefined
    ].filter(Boolean) as ReturnType<typeof sql>[],
    sql` and `
  );

  const counts = await db.execute<{ status: string; n: string; ewb: string }>(sql`
    select v.status, v.ewb_status as ewb, count(*) as n from vouchers v left join accounts p on p.id = v.party_id
    where v.company_id = ${ctx.companyId} and v.fy_id = ${ctx.fyId} and v.type = ${def.type}
      ${qy.from ? sql`and v.date >= ${qy.from}` : sql``} ${qy.to ? sql`and v.date <= ${qy.to}` : sql``}
    group by v.status, v.ewb_status`);
  const byStatus: Record<string, number> = {};
  const byEwb: Record<string, number> = {};
  for (const r of counts.rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + Number(r.n);
    byEwb[r.ewb] = (byEwb[r.ewb] ?? 0) + Number(r.n);
  }

  const cons = CONSUMERS[def.type];
  if (qy.view === 'lines') {
    const consumers = cons ? sql.raw(`('${cons.types.join("','")}')`) : sql.raw(`('__none__')`);
    const col = sql.raw(cons?.by === 'order' ? 'order_line_id' : 'source_line_id');
    const rows = await db.execute(sql`
      select v.id, v.number, v.date, v.status, v.due_date as "dueDate", v.credit_days as "creditDays", v.party_id as "partyId",
             p.name as "partyName", p.city as "partyCity", pg.name as "partyGroupName", b.name as "brokerName", sp.name as "salesPersonName",
             m.name as "millName", v.net_amount as "netAmount", v.priority, v.exp_delivery_date as "expDeliveryDate",
             l.id as "lineId", l.line_no as "lineNo", l.item_id as "itemId", i.name as "itemName", i.denier, i.code as "itemCode",
             l.brand, l.lot_no as "lotNo", l.grade, l.unit, l.pcs, l.qty, l.rate, l.amount, l.taxable_amount as "taxableAmount", l.line_status as "lineStatus",
             coalesce((select sum(c.qty) from voucher_lines c join vouchers cv on cv.id = c.voucher_id
                       where c.${col} = l.id and cv.type in ${consumers} and cv.status <> 'CANCELLED'), 0) as "doneQty",
             (select count(distinct cv.id) from voucher_lines c join vouchers cv on cv.id = c.voucher_id
                       where c.${col} = l.id and cv.type in ${consumers} and cv.status <> 'CANCELLED') as "doneCount"
      from vouchers v
      join voucher_lines l on l.voucher_id = v.id
      left join items i on i.id = l.item_id
      left join accounts p on p.id = v.party_id
      left join accounts pg on pg.id = p.party_group_id
      left join accounts b on b.id = v.broker_id
      left join accounts m on m.id = v.mill_id
      left join sales_persons sp on sp.id = v.sales_person_id
      where ${where}
      order by v.date desc, v.id desc, l.line_no
      limit ${pageSize} offset ${(page - 1) * pageSize}`);
    const total = await db.execute<{ n: string }>(sql`select count(*) as n from vouchers v join voucher_lines l on l.voucher_id = v.id left join accounts p on p.id = v.party_id where ${where}`);
    const data = rows.rows.map((r: Record<string, unknown>) => {
      const qty = Number(r.qty), done = Number(r.doneQty);
      const closed = r.lineStatus === 'CLOSED' || ['CANCELLED', 'COMPLETED'].includes(r.status as string);
      return { ...r, qty, rate: Number(r.rate), pcs: Number(r.pcs), amount: Number(r.amount), taxableAmount: Number(r.taxableAmount), netAmount: Number(r.netAmount), doneQty: r3(done), doneCount: Number(r.doneCount), pendingQty: closed ? 0 : r3(Math.max(0, qty - done)) };
    });
    return { data, total: Number(total.rows[0].n), page, pageSize, counts: byStatus, ewbCounts: byEwb };
  }

  const rows = await db.execute(sql`
    select v.id, v.number, v.date, v.status, v.party_id as "partyId", p.name as "partyName", p.city as "partyCity", p.gstin as "partyGstin",
           v.ref_no as "refNo", v.due_date as "dueDate", v.total_qty as "totalQty", v.total_pcs as "totalPcs",
           v.taxable_amount as "taxableAmount", v.cgst_amount as "cgstAmount", v.sgst_amount as "sgstAmount", v.igst_amount as "igstAmount",
           v.tcs_amount as "tcsAmount", v.tds_amount as "tdsAmount", v.net_amount as "netAmount", v.amount, v.mode, v.instrument_no as "instrumentNo",
           v.ewb_status as "ewbStatus", v.ewb_no as "ewbNo", v.ewb_valid_till as "ewbValidTill", v.vehicle_no as "vehicleNo", v.lr_no as "lrNo",
           v.distance_km as "distanceKm", t.name as "transporterName", t.transporter_id as "transporterGstin",
           ba.name as "bankAccountName", src.number as "sourceNumber", v.remark, v.narration, v.created_at as "createdAt",
           (select string_agg(distinct coalesce(i.name, l.description), ', ') from voucher_lines l left join items i on i.id = l.item_id where l.voucher_id = v.id) as "itemNames",
           (select string_agg(distinct l.lot_no, ', ') from voucher_lines l where l.voucher_id = v.id) as "lots"
    from vouchers v
    left join accounts p on p.id = v.party_id
    left join accounts ba on ba.id = v.bank_account_id
    left join transporters t on t.id = v.transporter_id
    left join vouchers src on src.id = v.source_id
    where ${where}
    order by v.date desc, v.id desc
    limit ${pageSize} offset ${(page - 1) * pageSize}`);
  const agg = await db.execute<Record<string, string>>(sql`
    select count(*) as n, coalesce(sum(v.total_qty),0) as qty, coalesce(sum(v.taxable_amount),0) as taxable,
           coalesce(sum(v.cgst_amount + v.sgst_amount + v.igst_amount),0) as gst, coalesce(sum(v.net_amount),0) as net
    from vouchers v left join accounts p on p.id = v.party_id where ${where}`);
  const nums = ['totalQty', 'totalPcs', 'taxableAmount', 'cgstAmount', 'sgstAmount', 'igstAmount', 'tcsAmount', 'tdsAmount', 'netAmount', 'amount', 'distanceKm'];
  let data = rows.rows.map((r: Record<string, unknown>) => {
    for (const k of nums) if (r[k] !== null && r[k] !== undefined) r[k] = Number(r[k]);
    return r;
  });
  if (def.bill || def.posting === 'note') {
    const pend = await billPending(db, data.map((r) => Number(r.id)));
    data = data.map((r) => ({ ...r, pending: pend.get(Number(r.id)) ?? 0 }));
  }
  const a = agg.rows[0];
  return {
    data,
    total: Number(a.n),
    page,
    pageSize,
    totals: { qty: Number(a.qty), taxable: Number(a.taxable), gst: Number(a.gst), net: Number(a.net) },
    counts: byStatus,
    ewbCounts: byEwb
  };
}

export interface PendingLine {
  voucherId: number; number: string; date: string; partyId: number; partyName: string; deliveryPartyName: string | null;
  transporterId: number | null; transporterName: string | null; vehicleNo: string | null; sourceId: number | null; orderNumber: string | null;
  lineId: number; itemId: number; itemName: string; itemCode: string; brand: string | null; lotNo: string | null; grade: string | null;
  hsn: string | null; unit: string; pcs: number; cops: number; qty: number; rate: number; gstRate: number; discPct: number; freightPct: number;
  godownId: number | null; orderLineId: number | null; usedQty: number; pendingQty: number;
}

/** Lines still open on orders / schedules / bills — for "pick dispatch schedule", "pick order", returns */
export async function pendingLines(ctx: Ctx, sourceType: VoucherType, forType: VoucherType, partyId?: number) {
  const cons = forType === 'DISPATCH_SCHEDULE' ? { types: SCHEDULED_BY[sourceType] ?? [], by: 'source' as const } : CONSUMERS[sourceType];
  if (!cons) throw badRequest('Nothing to pick from this document type');
  const col = sql.raw(cons.by === 'order' && forType !== 'DISPATCH_SCHEDULE' ? 'order_line_id' : 'source_line_id');
  const types = sql.raw(`('${cons.types.join("','")}')`);
  const openOnly = ORDER_TYPES.includes(sourceType) ? sql`and v.status in ('OPEN','PARTIAL') and coalesce(l.line_status,'') <> 'CLOSED'` : sql``;
  const rows = await ctx.db.execute(sql`
    select v.id as "voucherId", v.number, v.date, v.party_id as "partyId", p.name as "partyName", dp.name as "deliveryPartyName",
           v.transporter_id as "transporterId", t.name as "transporterName", v.vehicle_no as "vehicleNo", v.source_id as "sourceId", sv.number as "orderNumber",
           l.id as "lineId", l.item_id as "itemId", i.name as "itemName", i.code as "itemCode", l.brand, l.lot_no as "lotNo", l.grade, l.hsn, l.unit,
           l.pcs, l.cops, l.qty, l.rate, l.gst_rate as "gstRate", l.disc_pct as "discPct", l.freight_pct as "freightPct", l.godown_id as "godownId",
           l.order_line_id as "orderLineId",
           coalesce((select sum(c.qty) from voucher_lines c join vouchers cv on cv.id = c.voucher_id
                     where c.${col} = l.id and cv.type in ${types} and cv.status <> 'CANCELLED'), 0) as used
    from vouchers v
    join voucher_lines l on l.voucher_id = v.id
    left join items i on i.id = l.item_id
    left join accounts p on p.id = v.party_id
    left join accounts dp on dp.id = v.delivery_party_id
    left join transporters t on t.id = v.transporter_id
    left join vouchers sv on sv.id = v.source_id
    where v.company_id = ${ctx.companyId} and v.type = ${sourceType} ${openOnly}
      ${partyId ? sql`and v.party_id = ${partyId}` : sql``}
    order by v.date, v.id, l.line_no`);
  return rows.rows
    .map((r: Record<string, unknown>) => {
      const qty = Number(r.qty), used = Number(r.used);
      return { ...r, qty, pcs: Number(r.pcs), cops: Number(r.cops), rate: Number(r.rate), gstRate: Number(r.gstRate), discPct: Number(r.discPct), freightPct: Number(r.freightPct), usedQty: r3(used), pendingQty: r3(qty - used) } as PendingLine;
    })
    .filter((r) => r.pendingQty > 0.0005);
}

export { forbidden };
