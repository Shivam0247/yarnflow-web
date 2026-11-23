/**
 * Bill-wise outstanding, the same way the old software computed it:
 *   pending = bill amount − everything settled against it in the same books (ledger period):
 *   receipts / payments, journals, debit / credit notes, returns, TDS, and amounts paid before the
 *   books began. A bill carried forward into the next books (carried_to_period) is outstanding there too.
 */
import { sql } from 'drizzle-orm';

type P = { period: number };
const raw = (s: string) => sql.raw(s);

/** the bill belongs to the outstanding of this ledger period */
export const billInPeriod = (ctx: P, v = 'v') => raw(`(${v}.ledger_period = ${Number(ctx.period)} or ${v}.carried_to_period = ${Number(ctx.period)})`);

/** amount settled on the bill within this period (pending adjustments are not settlements) */
export const settledSql = (ctx: P, v = 'v', o: { asOn?: string; excludeVoucherId?: number } = {}) => sql`coalesce((select sum(a.amount) from bill_allocations a
  where a.bill_id = ${raw(v)}.id and a.ledger_period = ${Number(ctx.period)} and a.kind is distinct from 'PENDING'
  ${o.asOn ? sql`and a.date <= ${o.asOn}` : sql``} ${o.excludeVoucherId ? sql`and a.voucher_id is distinct from ${o.excludeVoucherId}` : sql``}), 0)`;

/** pending amount of the bill within this period */
export const pendingSql = (ctx: P, v = 'v', o: { asOn?: string; excludeVoucherId?: number } = {}) => sql`(${raw(v)}.net_amount - ${settledSql(ctx, v, o)})`;
