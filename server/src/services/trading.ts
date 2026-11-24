/**
 * Trading stock as the old software counts it (SQL Server views Tradding_PendingPurChase,
 * Tradding_AllPendingSalesOrder, Tradding_AllPendingView), checked item by item against the old data:
 *  - stock     = each purchase line's weight − what was dispatched against it − what was returned from it
 *  - sale order pending     = approved, pending sales-order lines − dispatched / billed against the order
 *  - purchase order pending = approved, pending purchase-order lines − purchased against the order
 * Old documents are linked by the old codes kept on the lines; new ones by the line they were made from.
 */
import { sql } from 'drizzle-orm';
import { r2, r3 } from '../lib/money.js';
import type { Ctx } from './context.js';

type Row = Record<string, unknown>;
const N = (v: unknown) => Number(v ?? 0) || 0;
const idList = (v?: string) => (v ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);

interface Filters { companies?: string; costCenters?: string; items?: string }

function scope(ctx: Ctx, f: Filters, alias = 'v') {
  const co = idList(f.companies);
  const cc = idList(f.costCenters);
  return sql.raw(
    (co.length ? ` and ${alias}.company_id in (${co.join(',')})` : ` and ${alias}.company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId})`) +
      (cc.length ? ` and ${alias}.cost_center_id in (${cc.join(',')})` : '')
  );
}

/** pending purchase lines (Tradding_PendingPurChase) with what was dispatched / returned against each */
export function pendingPurchaseSql(ctx: Ctx, f: Filters, mode: 'stock' | 'pending' | 'clear' | 'lock' | 'all' = 'stock') {
  const flag =
    mode === 'stock' ? `l.extra->>'lock' is null and l.extra->>'stockClear' is null`
    : mode === 'lock' ? `l.extra->>'lock' is not null and l.extra->>'stockClear' is null`
    : `coalesce(l.extra->>'stockClear', '') <> 'OLDYEAR'`;
  return sql`
    with p as materialized (
      select l.id, v.id as "voucherId", v.legacy_code as pc, v.company_id as "companyId", v.number, v.date, v.party_id as "partyId", l.item_id as "itemId",
        coalesce(l.grade, '') as gr, btrim(coalesce(l.challan_no, '')) as ch, coalesce((l.extra->>'stockQty')::numeric, l.qty) as w, l.pcs, l.lot_no as lot,
        l.brand, l.rate, l.extra->>'lock' as lock, l.extra->>'stockClear' as clear
      from voucher_lines l join vouchers v on v.id = l.voucher_id join items it on it.id = l.item_id
      where v.type = 'PURCHASE_BILL' and v.status <> 'CANCELLED' and coalesce(l.extra->>'purType', 'PUR') in ('PUR', 'AUTPUR') and l.extra->>'grnCode' is null
        and coalesce(it.extra->>'I_ISTOCK', 'YES') <> 'NO' and ${sql.raw(flag)} ${scope(ctx, f)}
        ${idList(f.items).length ? sql.raw(` and l.item_id in (${idList(f.items).join(',')})`) : sql``}
    ), d as materialized (
      select l.extra->>'purCode' as pc, btrim(coalesce(l.extra->>'purChNo', '')) as ch, l.item_id, coalesce(l.grade, '') as gr, sum(l.qty) as q, sum(l.pcs) as b, count(*) as n
      from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.type = 'DISPATCH_SCHEDULE' and v.status <> 'CANCELLED' and l.extra ? 'purCode' group by 1, 2, 3, 4
    ), dn as materialized (  -- new dispatches made from a purchase line
      select l.source_line_id as pid, sum(l.qty) as q, sum(l.pcs) as b from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.type = 'DISPATCH_SCHEDULE' and v.status <> 'CANCELLED' and l.source_line_id is not null and not l.extra ? 'purCode' group by 1
    ), r as materialized (
      select l.extra->>'stkPurCode' as pc, l.item_id, coalesce(l.grade, '') as gr, sum(l.qty) as q, sum(l.pcs) as b, count(*) as n
      from voucher_lines l where l.extra ? 'stkPurCode' group by 1, 2, 3
    ), rn as materialized (  -- new purchase returns made from a purchase line
      select l.source_line_id as pid, sum(l.qty) as q, sum(l.pcs) as b from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.type = 'PURCHASE_RETURN' and v.status <> 'CANCELLED' and l.source_line_id is not null and not l.extra ? 'stkPurCode' group by 1
    )
    select p.*,
      coalesce(d.q, 0) * coalesce(r.n, 1) + coalesce(r.q, 0) * coalesce(d.n, 1) + coalesce(dn.q, 0) + coalesce(rn.q, 0) as "dispatchQty",
      p.w - (coalesce(d.q, 0) * coalesce(r.n, 1) + coalesce(r.q, 0) * coalesce(d.n, 1) + coalesce(dn.q, 0) + coalesce(rn.q, 0)) as "pendingQty",
      p.pcs - (coalesce(d.b, 0) * coalesce(r.n, 1) + coalesce(r.b, 0) * coalesce(d.n, 1) + coalesce(dn.b, 0) + coalesce(rn.b, 0)) as "pendingBox"
    from p
      left join d on d.pc = p.pc and d.ch = p.ch and d.item_id = p."itemId" and d.gr = p.gr
      left join r on r.pc = p.pc and r.item_id = p."itemId" and r.gr = p.gr
      left join dn on dn.pid = p.id left join rn on rn.pid = p.id`;
}

/** pending sales-order quantity per item (Tradding_AllPendingSalesOrder, status PENDING) */
function pendingSalesOrderSql(ctx: Ctx, f: Filters) {
  return sql`
    with o as materialized (
      select l.id, v.legacy_code as oc, coalesce(v.extra->>'orderTypeNo', '0') as ot, l.item_id, l.qty, l.pcs
      from vouchers v join voucher_lines l on l.voucher_id = v.id
      where v.type = 'SALES_ORDER' and coalesce(v.extra->>'approvedQ', case when v.status = 'PENDING_APPROVAL' then '0' else '1' end) <> '0'
        and coalesce(l.extra->>'st24', case when l.line_status = 'CLOSED' then 'CLOSE' else 'PENDING' end) = 'PENDING'
        ${scope(ctx, f)}
    ), d as materialized (
      select l.extra->>'orderCode' as oc, sum(l.qty) as q, sum(l.pcs) as b, count(*) as n from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.type = 'DISPATCH_SCHEDULE' and v.status <> 'CANCELLED' and l.extra ? 'orderCode' group by 1
    ), s as materialized (
      select l.extra->>'orderCode' as oc, l.item_id, sum(l.qty) as w, sum(l.pcs) as b, count(*) as n from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.type = 'SALE_BILL' and v.status <> 'CANCELLED' and l.extra ? 'orderCode' and not l.extra ? 'disptCode' group by 1, 2
    ), nw as materialized (  -- new dispatches / bills made from an order line
      select l.source_line_id as oid, sum(l.qty) as q, sum(l.pcs) as b from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.type in ('DISPATCH_SCHEDULE', 'SALE_BILL') and v.status <> 'CANCELLED' and l.source_line_id is not null and not l.extra ? 'orderCode' group by 1
    )
    select o.item_id as "itemId", sum(case when o.ot = '1'
        then o.pcs - (coalesce(d.b, 0) * coalesce(s.n, 1) + coalesce(s.b, 0) * coalesce(d.n, 1) + coalesce(nw.b, 0))
        else o.qty - (coalesce(d.q, 0) * coalesce(s.n, 1) + coalesce(s.w, 0) * coalesce(d.n, 1) + coalesce(nw.q, 0)) end) as pending
    from o left join d on d.oc = o.oc left join s on s.oc = o.oc and s.item_id = o.item_id left join nw on nw.oid = o.id
    group by o.item_id`;
}

/** pending purchase-order quantity per item (Tradding_AllPendingView, status PENDING) */
function pendingPurchaseOrderSql(ctx: Ctx, f: Filters) {
  return sql`
    with o as materialized (
      select l.id, v.legacy_code as oc, coalesce(v.extra->>'orderTypeNo', '0') as ot, l.item_id, l.qty, l.pcs
      from vouchers v join voucher_lines l on l.voucher_id = v.id
      where v.type = 'PURCHASE_ORDER' and coalesce(v.extra->>'approvedQ', case when v.status = 'PENDING_APPROVAL' then '0' else '1' end) <> '0'
        and coalesce(l.extra->>'st24', case when l.line_status = 'CLOSED' then 'CLOSE' else 'PENDING' end) = 'PENDING'
        ${scope(ctx, f)}
    ), p as materialized (
      select l.extra->>'poCode' as oc, l.item_id, sum(l.pcs) as b, sum(coalesce((l.extra->>'stockQty')::numeric, l.qty)) as w from voucher_lines l
      where l.extra ? 'poCode' group by 1, 2
    ), nw as materialized (
      select l.source_line_id as oid, sum(l.qty) as w, sum(l.pcs) as b from voucher_lines l join vouchers v on v.id = l.voucher_id
      where v.type = 'PURCHASE_BILL' and v.status <> 'CANCELLED' and l.source_line_id is not null and not l.extra ? 'poCode' group by 1
    )
    select o.item_id as "itemId", sum(case when o.ot = '1' then o.pcs - coalesce(p.b, 0) - coalesce(nw.b, 0) else o.qty - coalesce(p.w, 0) - coalesce(nw.w, 0) end) as pending
    from o left join p on p.oc = o.oc and p.item_id = o.item_id left join nw on nw.oid = o.id group by o.item_id`;
}

/** Final Reports → SOLD UNSOLD */
export async function soldUnsold(ctx: Ctx, f: Filters) {
  const stock = await ctx.db.execute<Row>(sql`select x."itemId", sum(x."pendingQty") as q from (${pendingPurchaseSql(ctx, f)}) x group by 1`);
  const so = await ctx.db.execute<Row>(pendingSalesOrderSql(ctx, f));
  const po = await ctx.db.execute<Row>(pendingPurchaseOrderSql(ctx, { ...f, costCenters: undefined }));
  const items = await ctx.db.execute<Row>(sql`select id, legacy_code as code, name from items where company_id = ${ctx.mcId}`);
  const m = new Map<number, { stock: number; so: number; po: number }>();
  const at = (id: unknown) => { const k = Number(id); if (!m.has(k)) m.set(k, { stock: 0, so: 0, po: 0 }); return m.get(k)!; };
  for (const r of stock.rows) at(r.itemId).stock += N(r.q);
  for (const r of so.rows) at(r.itemId).so += N(r.pending);
  for (const r of po.rows) at(r.itemId).po += N(r.pending);
  const rows = items.rows
    .map((it) => {
      const v = m.get(Number(it.id)) ?? { stock: 0, so: 0, po: 0 };
      const stockQ = r2(v.stock), soQ = r2(v.so), poQ = r2(v.po);
      return { itemId: Number(it.id), code: it.code, name: String(it.name ?? '').trim(), stock: stockQ, saleOrderPending: soQ, soldUnsold: r2(v.stock - v.so), purchasePending: poQ, unsoldAfterPurchase: r2(v.stock - v.so + v.po) };
    })
    .filter((r) => r.stock > 0 || r.purchasePending > 0 || r.saleOrderPending > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const t = (k: keyof (typeof rows)[number]) => rows.reduce((s, r) => s + Math.round(N(r[k]) * 100), 0) / 100;
  return { rows, totals: { stock: t('stock'), saleOrderPending: t('saleOrderPending'), soldUnsold: t('soldUnsold'), purchasePending: t('purchasePending'), unsoldAfterPurchase: t('unsoldAfterPurchase') } };
}

/** Purchase Stock Pending List (Pending Order Form → Stock-F9): Pending / Clear / Lock as the old screen */
export async function purchaseStock(ctx: Ctx, f: Filters & { mode?: string; from?: string; to?: string; q?: string }) {
  const mode = f.mode === 'clear' ? 'clear' : f.mode === 'lock' ? 'lock' : 'pending';
  const like = f.q ? '%' + f.q + '%' : null;
  const res = await ctx.db.execute<Row>(sql`
    select x.id, x.number, x.date, x.w, x.pcs, x.lot, x.brand, x.gr as grade, x.ch as "challanNo", x.rate, x.lock, x.clear,
      x."dispatchQty", x."pendingQty", x."pendingBox", it.name as "itemName", it.legacy_code as "itemCode", a.name as party,
      c.short_name as com, v.ref_no as "invNo", v.ref_date as "invDate", v.extra->>'avgRate' as "avgRate", v.vehicle_no as vehicle,
      t.name as transporter, dp.name as "deliveryParty", l.lr_no as "lrNo", l.challan_date as "challanDate", v.extra->>'supplier' as supplier
    from (${pendingPurchaseSql(ctx, f, mode === 'lock' ? 'lock' : 'all')}) x
      join items it on it.id = x."itemId" join vouchers v on v.id = x."voucherId" join voucher_lines l on l.id = x.id
      left join accounts a on a.id = x."partyId" left join companies c on c.id = x."companyId"
      left join transporters t on t.id = v.transporter_id left join accounts dp on dp.id = v.delivery_party_id
    where ${sql.raw(mode === 'pending' ? `x."pendingQty" > 0 and x.clear is null and x.lock is null`
      : mode === 'clear' ? `(abs(x."pendingQty") < 0.0005 or x.clear is not null) and x.clear is distinct from 'OLDYEAR'` : 'true')}
      ${f.from ? sql`and x.date >= ${f.from}` : sql``} ${f.to ? sql`and x.date <= ${f.to}` : sql``}
      ${like ? sql`and (it.name ilike ${like} or a.name ilike ${like} or x.number ilike ${like} or x.lot ilike ${like} or x.ch ilike ${like})` : sql``}
    order by x.date desc, x.number limit 5000`);
  const rows = res.rows.map((r) => ({ ...r, w: r3(N(r.w)), dispatchQty: r3(N(r.dispatchQty)), pendingQty: r3(N(r.pendingQty)), pendingBox: r3(N(r.pendingBox)) }));
  return { mode, rows, totals: { qty: r3(rows.reduce((s, r) => s + r.w, 0)), dispatched: r3(rows.reduce((s, r) => s + r.dispatchQty, 0)), pending: r3(rows.reduce((s, r) => s + r.pendingQty, 0)), box: r3(rows.reduce((s, r) => s + r.pendingBox, 0)) } };
}

/** Stock Clear (F11) / ReOpen (F12): mark purchase lines' remaining stock as cleared, or open it again */
export async function setStockClear(ctx: Ctx, body: { lineIds?: number[]; clear?: boolean }) {
  const ids = (body.lineIds ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!ids.length) return { updated: 0 };
  const res = await ctx.db.execute(sql`
    update voucher_lines l set extra = case when ${!!body.clear} then coalesce(l.extra, '{}'::jsonb) || '{"stockClear": "1"}'::jsonb else coalesce(l.extra, '{}'::jsonb) - 'stockClear' end
    from vouchers v where v.id = l.voucher_id and v.type = 'PURCHASE_BILL' and v.company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId})
      and l.id in ${sql.raw('(' + ids.join(',') + ')')} and coalesce(l.extra->>'stockClear', '') <> 'OLDYEAR'`);
  return { updated: res.rowCount ?? 0 };
}
