/**
 * Reports built straight from ledger_entries / stock_entries / vouchers:
 * ledger, trial balance, profit & loss, balance sheet, outstanding & ageing,
 * stock summary / ledger, GSTR-1, GSTR-3B, dashboard.
 */
import { and, eq, sql } from 'drizzle-orm';
import { accountGroups, accounts, auditLogs, users } from '../db/schema.js';
import { addDays, daysBetween, today } from '../lib/dates.js';
import { notFound } from '../lib/errors.js';
import { r2, r3, sum } from '../lib/money.js';
import type { Ctx } from './context.js';
import { loadFy } from './documents.js';

type Row = Record<string, unknown>;
const N = (v: unknown) => Number(v ?? 0);

/* ------------------------------------------------------------------ ledger */
export async function ledger(ctx: Ctx, accountId: number, from?: string, to?: string) {
  const fy = await loadFy(ctx);
  from ??= fy.startDate;
  to ??= fy.endDate;
  const [acc] = await ctx.db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.companyId, ctx.companyId)));
  if (!acc) throw notFound('Account');
  const [grp] = await ctx.db.select().from(accountGroups).where(eq(accountGroups.id, acc.groupId));
  const before = await ctx.db.execute<{ b: string }>(sql`select coalesce(sum(debit - credit),0) as b from ledger_entries where account_id = ${accountId} and date < ${from}`);
  const opening = r2((acc.openingType === 'DR' ? acc.openingBalance : -acc.openingBalance) + N(before.rows[0].b));
  const rows = await ctx.db.execute(sql`
    select e.id, e.date, e.debit, e.credit, e.narration, v.id as "voucherId", v.type, v.number, v.ref_no as "refNo", v.total_qty as qty,
      (select string_agg(distinct a2.name, ', ') from ledger_entries e2 join accounts a2 on a2.id = e2.account_id
        where e2.voucher_id = e.voucher_id and e2.account_id <> e.account_id
          and sign(e2.debit - e2.credit) <> sign(e.debit - e.credit)) as against
    from ledger_entries e join vouchers v on v.id = e.voucher_id
    where e.account_id = ${accountId} and e.date between ${from} and ${to}
    order by e.date, v.id, e.id`);
  let bal = opening;
  const entries = rows.rows.map((r: Row) => {
    bal = r2(bal + N(r.debit) - N(r.credit));
    return { ...r, debit: N(r.debit), credit: N(r.credit), qty: N(r.qty), balance: Math.abs(bal), balanceType: bal >= 0 ? 'DR' : 'CR' };
  });
  const dr = r2(sum(entries, (e) => e.debit));
  const cr = r2(sum(entries, (e) => e.credit));
  return {
    account: { id: acc.id, name: acc.name, code: acc.code, groupName: grp?.name, gstin: acc.gstin, city: acc.city, creditLimit: acc.creditLimit, creditDays: acc.creditDays, brokerId: acc.brokerId, status: acc.status },
    from, to,
    opening: Math.abs(opening), openingType: opening >= 0 ? 'DR' : 'CR',
    entries,
    totalDebit: dr, totalCredit: cr,
    closing: Math.abs(r2(opening + dr - cr)), closingType: opening + dr - cr >= 0 ? 'DR' : 'CR'
  };
}

/* ----------------------------------------------------------- balances */
async function balances(ctx: Ctx, upto: string, from?: string) {
  // opening balance of every account + movements (from..upto). P&L accounts use only the period.
  const res = await ctx.db.execute(sql`
    select a.id, a.name, a.code, a.kind, a.group_id as "groupId", g.nature, g.affects_gross_profit as gp, g.name as "groupName",
      case when a.opening_type = 'DR' then a.opening_balance else -a.opening_balance end as opening,
      coalesce((select sum(debit - credit) from ledger_entries e where e.account_id = a.id and e.date <= ${upto}
        ${from ? sql`and e.date >= ${from}` : sql``}), 0) as movement,
      coalesce((select sum(debit) from ledger_entries e where e.account_id = a.id and e.date <= ${upto} ${from ? sql`and e.date >= ${from}` : sql``}), 0) as dr,
      coalesce((select sum(credit) from ledger_entries e where e.account_id = a.id and e.date <= ${upto} ${from ? sql`and e.date >= ${from}` : sql``}), 0) as cr
    from accounts a join account_groups g on g.id = a.group_id
    where a.company_id = ${ctx.companyId}`);
  return res.rows.map((r: Row) => {
    const pl = r.nature === 'INCOME' || r.nature === 'EXPENSE';
    const opening = pl ? 0 : N(r.opening);
    return { ...r, opening, debit: N(r.dr), credit: N(r.cr), closing: r2(opening + N(r.movement)) } as Row & { closing: number; opening: number; debit: number; credit: number; nature: string; groupId: number };
  });
}

async function groupTree(ctx: Ctx) {
  const gs = await ctx.db.select().from(accountGroups).where(eq(accountGroups.companyId, ctx.companyId)).orderBy(accountGroups.sortOrder);
  const top = (id: number): typeof gs[number] => {
    let g = gs.find((x) => x.id === id)!;
    while (g.parentId) g = gs.find((x) => x.id === g.parentId)!;
    return g;
  };
  return { gs, top };
}

export async function trialBalance(ctx: Ctx, asOn?: string) {
  const fy = await loadFy(ctx);
  asOn ??= fy.endDate;
  const bals = (await balances(ctx, asOn)).filter((b) => b.closing !== 0 || b.debit || b.credit);
  const { gs, top } = await groupTree(ctx);
  const rows = bals.map((b) => ({ id: b.id, name: b.name, groupName: b.groupName, primaryGroup: top(b.groupId).name, nature: b.nature, debit: b.closing > 0 ? b.closing : 0, credit: b.closing < 0 ? -b.closing : 0 }));
  const groups = gs.filter((g) => !g.parentId).map((g) => {
    const mine = rows.filter((r) => r.primaryGroup === g.name);
    return { name: g.name, nature: g.nature, debit: r2(sum(mine, (r) => r.debit)), credit: r2(sum(mine, (r) => r.credit)), accounts: mine };
  }).filter((g) => g.accounts.length);
  const openingStock = r2((await stockValue(ctx, addDays(fy.startDate, -1))) + (await openingVoucherStock(ctx, fy.startDate, asOn)));
  if (openingStock) groups.push({ name: 'Opening stock', nature: 'ASSET', debit: openingStock, credit: 0, accounts: [] });
  const totalDebit = r2(sum(groups, (g) => g.debit));
  const totalCredit = r2(sum(groups, (g) => g.credit));
  return { asOn, openingStock, groups, totalDebit, totalCredit, difference: r2(totalDebit - totalCredit) };
}

/* -------------------------------------------------------------- stock value */
export async function stockValue(ctx: Ctx, upto: string) {
  // weighted average purchase rate × closing qty, per item+lot+grade
  const res = await ctx.db.execute(sql`
    select item_id, lot_no, grade, sum(qty_in - qty_out) as qty,
      case when sum(qty_in) > 0 then sum(case when qty_in > 0 then value else 0 end) / nullif(sum(qty_in),0) else 0 end as rate
    from stock_entries where company_id = ${ctx.companyId} and date <= ${upto}
    group by item_id, lot_no, grade`);
  return r2(sum(res.rows as Row[], (r) => Math.max(0, N(r.qty)) * N(r.rate)));
}

/** value brought in by "Opening stock" vouchers (not a purchase) */
async function openingVoucherStock(ctx: Ctx, from: string, to: string) {
  const r = await ctx.db.execute(sql`
    select coalesce(sum(s.value),0) as v from stock_entries s join vouchers v on v.id = s.voucher_id
    where s.company_id = ${ctx.companyId} and v.type = 'OPENING_STOCK' and s.date between ${from} and ${to}`);
  return N((r.rows[0] as Row).v);
}

export async function profitLoss(ctx: Ctx, from?: string, to?: string) {
  const fy = await loadFy(ctx);
  from ??= fy.startDate;
  to ??= fy.endDate;
  const bals = (await balances(ctx, to, from)).filter((b) => b.nature === 'INCOME' || b.nature === 'EXPENSE');
  const { top } = await groupTree(ctx);
  const openingStock = r2((await stockValue(ctx, addDays(from, -1))) + (await openingVoucherStock(ctx, from, to)));
  const closingStock = await stockValue(ctx, to);
  const line = (b: Row & { closing: number; groupId: number }) => ({ id: b.id, name: b.name, group: top(b.groupId).name, amount: r2(b.nature === 'INCOME' ? -b.closing : b.closing) });
  const tradingInc = bals.filter((b) => b.nature === 'INCOME' && b.gp).map(line).filter((l) => l.amount);
  const tradingExp = bals.filter((b) => b.nature === 'EXPENSE' && b.gp).map(line).filter((l) => l.amount);
  const indirectInc = bals.filter((b) => b.nature === 'INCOME' && !b.gp).map(line).filter((l) => l.amount);
  const indirectExp = bals.filter((b) => b.nature === 'EXPENSE' && !b.gp).map(line).filter((l) => l.amount);
  const grossProfit = r2(sum(tradingInc, (l) => l.amount) + closingStock - openingStock - sum(tradingExp, (l) => l.amount));
  const netProfit = r2(grossProfit + sum(indirectInc, (l) => l.amount) - sum(indirectExp, (l) => l.amount));
  return { from, to, openingStock, closingStock, trading: { income: tradingInc, expense: tradingExp }, grossProfit, indirect: { income: indirectInc, expense: indirectExp }, netProfit };
}

export async function balanceSheet(ctx: Ctx, asOn?: string) {
  const fy = await loadFy(ctx);
  asOn ??= fy.endDate;
  const bals = (await balances(ctx, asOn)).filter((b) => b.nature === 'ASSET' || b.nature === 'LIABILITY');
  const { gs, top } = await groupTree(ctx);
  const pl = await profitLoss(ctx, fy.startDate, asOn);
  const side = (nature: string, signFlip: number) =>
    gs.filter((g) => !g.parentId && g.nature === nature).map((g) => {
      const mine = bals.filter((b) => top(b.groupId).id === g.id && b.closing !== 0).map((b) => ({ id: b.id, name: b.name, amount: r2(b.closing * signFlip) }));
      return { name: g.name, amount: r2(sum(mine, (m) => m.amount)), accounts: mine };
    }).filter((g) => g.accounts.length || g.amount);
  const assets = side('ASSET', 1);
  const liabilities = side('LIABILITY', -1);
  assets.push({ name: 'Closing stock', amount: pl.closingStock, accounts: [] });
  liabilities.push({ name: 'Profit & loss A/c', amount: pl.netProfit, accounts: [] });
  const totalAssets = r2(sum(assets, (a) => a.amount));
  const totalLiabilities = r2(sum(liabilities, (a) => a.amount));
  // opening stock (if any) is part of capital in opening balances; any residue is shown as difference
  return { asOn, assets, liabilities, totalAssets, totalLiabilities, difference: r2(totalAssets - totalLiabilities) };
}

/* ------------------------------------------------------- outstanding / ageing */
export async function outstanding(ctx: Ctx, side: 'receivable' | 'payable', opts: { asOn?: string; partyId?: number } = {}) {
  const asOn = opts.asOn ?? today();
  const types = side === 'receivable' ? sql`('SALE_BILL','GENERAL_SALE')` : sql`('PURCHASE_BILL','GENERAL_PURCHASE')`;
  const res = await ctx.db.execute(sql`
    select v.id, v.type, v.number, v.date, v.due_date as "dueDate", v.net_amount as net, v.tds_amount as tds, v.party_id as "partyId",
      p.name as "partyName", p.city, p.mobile, p.credit_limit as "creditLimit", p.credit_days as "creditDays", b.name as "brokerName",
      v.net_amount - v.tds_amount - coalesce((select sum(a.amount) from bill_allocations a join vouchers av on av.id = a.voucher_id
        where a.bill_id = v.id and av.date <= ${asOn}), 0) as pending
    from vouchers v join accounts p on p.id = v.party_id left join accounts b on b.id = p.broker_id
    where v.company_id = ${ctx.companyId} and v.type in ${types} and v.date <= ${asOn}
      ${opts.partyId ? sql`and v.party_id = ${opts.partyId}` : sql``}
    order by p.name, v.date, v.id`);
  const bills = res.rows
    .map((r: Row) => {
      const due = (r.dueDate as string) ?? (r.date as string);
      const age = daysBetween(due, asOn);
      return { ...r, net: N(r.net), tds: N(r.tds), pending: r2(N(r.pending)), creditLimit: N(r.creditLimit), days: daysBetween(r.date as string, asOn), overdueDays: Math.max(0, age) } as Row & { net: number; tds: number; pending: number; creditLimit: number; days: number; overdueDays: number };
    })
    .filter((b) => b.pending > 0.005);
  const bucket = (d: number) => (d <= 30 ? 'd0_30' : d <= 60 ? 'd31_60' : d <= 90 ? 'd61_90' : 'd90p');
  const parties = new Map<number, Row & { total: number; overdue: number; d0_30: number; d31_60: number; d61_90: number; d90p: number; bills: number; maxDays: number }>();
  for (const b of bills) {
    const id = Number(b.partyId);
    const p = parties.get(id) ?? { partyId: id, partyName: b.partyName, city: b.city, mobile: b.mobile, brokerName: b.brokerName, creditLimit: b.creditLimit, creditDays: b.creditDays, total: 0, overdue: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0, bills: 0, maxDays: 0 };
    p.total = r2(p.total + b.pending);
    if (b.overdueDays > 0) p.overdue = r2(p.overdue + b.pending);
    p[bucket(b.days)] = r2(p[bucket(b.days)] + b.pending);
    p.bills += 1;
    p.maxDays = Math.max(p.maxDays, b.days);
    parties.set(id, p);
  }
  const list = [...parties.values()].sort((a, b) => b.total - a.total);
  const totals = { total: r2(sum(list, (p) => p.total)), overdue: r2(sum(list, (p) => p.overdue)), d0_30: r2(sum(list, (p) => p.d0_30)), d31_60: r2(sum(list, (p) => p.d31_60)), d61_90: r2(sum(list, (p) => p.d61_90)), d90p: r2(sum(list, (p) => p.d90p)) };
  return { side, asOn, totals, parties: list, bills };
}

/* ------------------------------------------------------------------- stock */
export async function stockSummary(ctx: Ctx, opts: { itemId?: number; godownId?: number; asOn?: string; q?: string } = {}) {
  const asOn = opts.asOn ?? today();
  const res = await ctx.db.execute(sql`
    select s.item_id as "itemId", i.code as "itemCode", i.name as "itemName", i.description, i.type, i.hsn, i.min_stock as "minStock",
      max(s.brand) as brand, s.lot_no as "lotNo", s.grade, s.godown_id as "godownId", g.name as "godownName",
      sum(s.qty_in - s.qty_out) as qty, sum(s.pcs_in - s.pcs_out) as pcs,
      case when sum(s.qty_in) > 0 then sum(case when s.qty_in > 0 then s.value else 0 end) / nullif(sum(s.qty_in), 0) else 0 end as rate,
      min(s.date) filter (where s.qty_in > 0) as "firstIn"
    from stock_entries s join items i on i.id = s.item_id left join godowns g on g.id = s.godown_id
    where s.company_id = ${ctx.companyId} and s.date <= ${asOn}
      ${opts.itemId ? sql`and s.item_id = ${opts.itemId}` : sql``}
      ${opts.godownId ? sql`and s.godown_id = ${opts.godownId}` : sql``}
      ${opts.q ? sql`and (i.name ilike ${'%' + opts.q + '%'} or s.lot_no ilike ${'%' + opts.q + '%'})` : sql``}
    group by s.item_id, i.code, i.name, i.description, i.type, i.hsn, i.min_stock, s.lot_no, s.grade, s.godown_id, g.name
    having abs(sum(s.qty_in - s.qty_out)) > 0.0005
    order by i.name, s.lot_no`);
  // reserved = pending dispatch schedules for that item/lot/grade
  const reserved = await ctx.db.execute(sql`
    select l.item_id as "itemId", coalesce(l.lot_no,'') as lot, coalesce(l.grade,'') as grade,
      sum(l.qty - coalesce((select sum(c.qty) from voucher_lines c join vouchers cv on cv.id = c.voucher_id where c.source_line_id = l.id and cv.type = 'SALE_BILL'), 0)) as q
    from voucher_lines l join vouchers v on v.id = l.voucher_id
    where v.company_id = ${ctx.companyId} and v.type = 'DISPATCH_SCHEDULE' and v.status in ('OPEN','PARTIAL')
    group by l.item_id, coalesce(l.lot_no,''), coalesce(l.grade,'')`);
  const rm = new Map(reserved.rows.map((r: Row) => [`${r.itemId}|${r.lot}|${r.grade}`, Math.max(0, N(r.q))]));
  const rows = res.rows.map((r: Row) => {
    const qty = r3(N(r.qty));
    const rate = r2(N(r.rate));
    const res = Math.min(qty, rm.get(`${r.itemId}|${r.lotNo ?? ''}|${r.grade ?? ''}`) ?? 0);
    return { ...r, qty, pcs: r3(N(r.pcs)), rate, value: r2(qty * rate), reserved: r3(res), free: r3(qty - res), ageDays: r.firstIn ? daysBetween(r.firstIn as string, asOn) : 0, minStock: N(r.minStock) };
  });
  return { asOn, rows, totals: { qty: r3(sum(rows, (r) => r.qty)), pcs: r3(sum(rows, (r) => r.pcs)), value: r2(sum(rows, (r) => r.value)), reserved: r3(sum(rows, (r) => r.reserved)) } };
}

export async function stockLedger(ctx: Ctx, itemId: number, from?: string, to?: string) {
  const fy = await loadFy(ctx);
  from ??= fy.startDate;
  to ??= fy.endDate;
  const open = await ctx.db.execute<{ q: string }>(sql`select coalesce(sum(qty_in - qty_out),0) as q from stock_entries where company_id = ${ctx.companyId} and item_id = ${itemId} and date < ${from}`);
  const res = await ctx.db.execute(sql`
    select s.date, s.qty_in as "qtyIn", s.qty_out as "qtyOut", s.pcs_in as "pcsIn", s.pcs_out as "pcsOut", s.lot_no as "lotNo", s.grade, s.brand, s.rate,
      g.name as "godownName", v.id as "voucherId", v.type, v.number, p.name as "partyName"
    from stock_entries s join vouchers v on v.id = s.voucher_id left join godowns g on g.id = s.godown_id left join accounts p on p.id = v.party_id
    where s.company_id = ${ctx.companyId} and s.item_id = ${itemId} and s.date between ${from} and ${to}
    order by s.date, s.id`);
  let bal = N(open.rows[0].q);
  const opening = r3(bal);
  const entries = res.rows.map((r: Row) => {
    bal = r3(bal + N(r.qtyIn) - N(r.qtyOut));
    return { ...r, qtyIn: N(r.qtyIn), qtyOut: N(r.qtyOut), pcsIn: N(r.pcsIn), pcsOut: N(r.pcsOut), rate: N(r.rate), balance: bal };
  });
  return { itemId, from, to, opening, entries, closing: bal };
}

/* --------------------------------------------------------------------- GST */
export async function gstr1(ctx: Ctx, from: string, to: string) {
  const inv = await ctx.db.execute(sql`
    select v.id, v.type, v.number, v.date, p.name as "partyName", p.gstin, v.place_of_supply as pos, v.reverse_charge as rc,
      v.taxable_amount as taxable, v.cgst_amount as cgst, v.sgst_amount as sgst, v.igst_amount as igst, v.net_amount as net, v.irn
    from vouchers v left join accounts p on p.id = v.party_id
    where v.company_id = ${ctx.companyId} and v.type in ('SALE_BILL','GENERAL_SALE','SALE_RETURN') and v.date between ${from} and ${to}
    order by v.date, v.id`);
  const rows = inv.rows.map((r: Row) => ({ ...r, taxable: N(r.taxable), cgst: N(r.cgst), sgst: N(r.sgst), igst: N(r.igst), net: N(r.net) }) as Row & { taxable: number; cgst: number; sgst: number; igst: number; net: number });
  const b2b = rows.filter((r) => r.type !== 'SALE_RETURN' && r.gstin);
  const b2c = rows.filter((r) => r.type !== 'SALE_RETURN' && !r.gstin);
  const cdnr = rows.filter((r) => r.type === 'SALE_RETURN');
  const hsn = await ctx.db.execute(sql`
    select coalesce(l.hsn, i.hsn) as hsn, max(i.name) as description, l.unit,
      sum(case when v.type = 'SALE_RETURN' then -l.qty else l.qty end) as qty,
      sum(case when v.type = 'SALE_RETURN' then -l.taxable_amount else l.taxable_amount end) as taxable,
      sum(case when v.type = 'SALE_RETURN' then -l.cgst_amount else l.cgst_amount end) as cgst,
      sum(case when v.type = 'SALE_RETURN' then -l.sgst_amount else l.sgst_amount end) as sgst,
      sum(case when v.type = 'SALE_RETURN' then -l.igst_amount else l.igst_amount end) as igst, l.gst_rate as rate
    from voucher_lines l join vouchers v on v.id = l.voucher_id left join items i on i.id = l.item_id
    where v.company_id = ${ctx.companyId} and v.type in ('SALE_BILL','GENERAL_SALE','SALE_RETURN') and v.date between ${from} and ${to}
    group by coalesce(l.hsn, i.hsn), l.unit, l.gst_rate order by 1`);
  const tot = (list: Row[]) => ({ count: list.length, taxable: r2(sum(list, (r) => N(r.taxable))), cgst: r2(sum(list, (r) => N(r.cgst))), sgst: r2(sum(list, (r) => N(r.sgst))), igst: r2(sum(list, (r) => N(r.igst))) });
  return {
    from, to,
    b2b, b2c, cdnr,
    hsn: hsn.rows.map((r: Row) => ({ ...r, qty: r3(N(r.qty)), taxable: r2(N(r.taxable)), cgst: r2(N(r.cgst)), sgst: r2(N(r.sgst)), igst: r2(N(r.igst)), rate: N(r.rate) })),
    summary: { b2b: tot(b2b), b2c: tot(b2c), cdnr: tot(cdnr) }
  };
}

export async function gstr3b(ctx: Ctx, from: string, to: string) {
  const agg = async (types: string) => {
    const r = await ctx.db.execute(sql`
      select coalesce(sum(taxable_amount),0) as taxable, coalesce(sum(cgst_amount),0) as cgst, coalesce(sum(sgst_amount),0) as sgst, coalesce(sum(igst_amount),0) as igst
      from vouchers where company_id = ${ctx.companyId} and type in ${sql.raw(types)} and date between ${from} and ${to}`);
    const x = r.rows[0] as Row;
    return { taxable: r2(N(x.taxable)), cgst: r2(N(x.cgst)), sgst: r2(N(x.sgst)), igst: r2(N(x.igst)) };
  };
  const minus = (a: Awaited<ReturnType<typeof agg>>, b: Awaited<ReturnType<typeof agg>>) => ({ taxable: r2(a.taxable - b.taxable), cgst: r2(a.cgst - b.cgst), sgst: r2(a.sgst - b.sgst), igst: r2(a.igst - b.igst) });
  const outward = minus(await agg("('SALE_BILL','GENERAL_SALE')"), await agg("('SALE_RETURN')"));
  const itc = minus(await agg("('PURCHASE_BILL','GENERAL_PURCHASE')"), await agg("('PURCHASE_RETURN')"));
  const payable = { cgst: r2(Math.max(0, outward.cgst - itc.cgst)), sgst: r2(Math.max(0, outward.sgst - itc.sgst)), igst: r2(Math.max(0, outward.igst - itc.igst)) };
  const tcs = await ctx.db.execute(sql`select coalesce(sum(tcs_amount),0) as t from vouchers where company_id = ${ctx.companyId} and type in ('SALE_BILL','GENERAL_SALE') and date between ${from} and ${to}`);
  const tds = await ctx.db.execute(sql`select coalesce(sum(tds_amount),0) as t from vouchers where company_id = ${ctx.companyId} and type = 'PURCHASE_BILL' and date between ${from} and ${to}`);
  return { from, to, outward, itc, payable, totalPayable: r2(payable.cgst + payable.sgst + payable.igst), tcsCollected: r2(N((tcs.rows[0] as Row).t)), tdsDeducted: r2(N((tds.rows[0] as Row).t)) };
}

/* --------------------------------------------------------------- dashboard */
export async function dashboard(ctx: Ctx, from?: string, to?: string) {
  const fy = await loadFy(ctx);
  to ??= today() > fy.endDate ? fy.endDate : today();
  from ??= to;
  const sumOf = async (types: string, f = from!, t = to!) => {
    const r = await ctx.db.execute(sql`
      select coalesce(sum(net_amount),0) as amt, coalesce(sum(total_qty),0) as qty, coalesce(sum(total_pcs),0) as pcs, count(*) as n
      from vouchers where company_id = ${ctx.companyId} and type in ${sql.raw(types)} and date between ${f} and ${t}`);
    const x = r.rows[0] as Row;
    return { amount: r2(N(x.amt)), qty: r3(N(x.qty)), pcs: N(x.pcs), count: N(x.n) };
  };
  const cash = async (type: string) => {
    const r = await ctx.db.execute(sql`select coalesce(sum(amount),0) as a, count(*) as n from vouchers where company_id = ${ctx.companyId} and type = ${type} and date between ${from} and ${to}`);
    return { amount: r2(N((r.rows[0] as Row).a)), count: N((r.rows[0] as Row).n) };
  };
  const rec = await outstanding(ctx, 'receivable', { asOn: to });
  const pay = await outstanding(ctx, 'payable', { asOn: to });
  const pendingOrders = async (type: string, consumer: string) => {
    const r = await ctx.db.execute(sql`
      select coalesce(sum(l.qty - coalesce((select sum(c.qty) from voucher_lines c join vouchers cv on cv.id = c.voucher_id
        where c.order_line_id = l.id and cv.type = ${consumer}), 0)), 0) as q, count(distinct v.id) as n
      from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.company_id = ${ctx.companyId} and v.type = ${type} and v.status in ('OPEN','PARTIAL') and coalesce(l.line_status,'') <> 'CLOSED'`);
    return { qty: r3(Math.max(0, N((r.rows[0] as Row).q))), count: N((r.rows[0] as Row).n) };
  };
  const weekly = await ctx.db.execute(sql`
    select to_char(date_trunc('week', date::timestamp), 'IYYY-IW') as wk, min(date) as start,
      sum(case when type in ('SALE_BILL','GENERAL_SALE') then net_amount else 0 end) as sales,
      sum(case when type in ('PURCHASE_BILL','GENERAL_PURCHASE') then net_amount else 0 end) as purchase
    from vouchers where company_id = ${ctx.companyId} and date between ${addDays(to, -83)} and ${to}
      and type in ('SALE_BILL','GENERAL_SALE','PURCHASE_BILL','GENERAL_PURCHASE')
    group by 1 order by 1`);
  const pipeline = await ctx.db.execute(sql`
    select status, count(*) as n from vouchers where company_id = ${ctx.companyId} and fy_id = ${ctx.fyId} and type = 'SALES_ORDER' group by status`);
  const recent = await ctx.db
    .select({ id: auditLogs.id, entity: auditLogs.entity, entityId: auditLogs.entityId, action: auditLogs.action, summary: auditLogs.summary, at: auditLogs.at, userName: users.name })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.userId))
    .where(eq(auditLogs.companyId, ctx.companyId))
    .orderBy(sql`${auditLogs.at} desc`)
    .limit(12);
  const ewb = await ctx.db.execute(sql`select count(*) as n from vouchers where company_id = ${ctx.companyId} and type = 'SALE_BILL' and ewb_status in ('PENDING','PARTB_PENDING')`);
  const approvals = await ctx.db.execute(sql`select count(*) as n from vouchers where company_id = ${ctx.companyId} and status = 'PENDING_APPROVAL'`);
  const low = (await stockSummary(ctx, { asOn: to })).rows.filter((r) => r.minStock > 0 && r.qty < r.minStock);

  return {
    from, to,
    sales: await sumOf("('SALE_BILL','GENERAL_SALE')"),
    purchase: await sumOf("('PURCHASE_BILL','GENERAL_PURCHASE')"),
    salesReturn: await sumOf("('SALE_RETURN')"),
    purchaseReturn: await sumOf("('PURCHASE_RETURN')"),
    receipts: await cash('RECEIPT'),
    payments: await cash('PAYMENT'),
    receivable: rec.totals,
    payable: pay.totals,
    topDebtors: rec.parties.slice(0, 5).map((p) => ({ partyId: p.partyId, partyName: p.partyName, total: p.total, overdue: p.overdue, maxDays: p.maxDays })),
    pendingSalesOrders: await pendingOrders('SALES_ORDER', 'SALE_BILL'),
    pendingPurchaseOrders: await pendingOrders('PURCHASE_ORDER', 'PURCHASE_BILL'),
    weekly: weekly.rows.map((r: Row) => ({ week: r.wk, start: r.start, sales: r2(N(r.sales)), purchase: r2(N(r.purchase)) })),
    pipeline: Object.fromEntries(pipeline.rows.map((r: Row) => [r.status as string, N(r.n)])),
    ewbPending: N((ewb.rows[0] as Row).n),
    approvalsPending: N((approvals.rows[0] as Row).n),
    lowStock: low.slice(0, 10),
    recent
  };
}
