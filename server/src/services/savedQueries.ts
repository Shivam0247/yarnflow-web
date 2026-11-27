/**
 * The old software's saved query reports (RegMaster + RegSubMaster): the Manage Desk / dashboard tabs
 * (Orders, Bills, Bank-Cash, Debit / Credit Note) and the report menus that run a saved SQL.
 * Each old query is ported to YarnFlow's tables and returns the same column names, so the old grid
 * definition (caption, order, visible, decimals, Sum / Count) in assets/saved-queries.json applies as before.
 * Filters are added the way the old screen added them: date range, selected companies, cost centres,
 * plus the query's fixed conditions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql, type SQL } from 'drizzle-orm';
import { notFound, unprocessable } from '../lib/errors.js';
import { r2 } from '../lib/money.js';
import type { Ctx } from './context.js';
import * as rep from './reports.js';
import * as trading from './trading.js';
import { outstandingPrint } from './outstandingPrint.js';

type Row = Record<string, unknown>;
export interface SqCol { sel: string; cap: string; sum: string | null; filter: string | null; show: boolean; seq: number; dec: number | null; fmt: string | null }
export interface SqDef { regId: number; name: string; type: string | null; bookList: number; mode: string | null; cols: SqCol[] | null; conds: string[] | null }

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/saved-queries.json');
let defs: SqDef[] | null = null;
const all = () => (defs ??= JSON.parse(fs.readFileSync(FILE, 'utf8')) as SqDef[]);

export interface SqFilter { from: string; to: string; companies?: string; costCenters?: string; type?: string; status?: string }
type Port = (ctx: Ctx, f: SqFilter) => Promise<Row[]>;
const PORTS: Record<number, Port> = {};

/** field name the old grid bound to: the alias after the last dot */
export const fieldOf = (sel: string) => sel.replace(/[[\]]/g, '').split('.').pop()!.trim();

export function listSaved(type?: string, bookLists?: number[]) {
  return all()
    .filter((d) => (!type || d.type === type) && (!bookLists || bookLists.includes(d.bookList)))
    .map((d) => ({ regId: d.regId, name: d.name, type: d.type, bookList: d.bookList, mode: d.mode, available: !!PORTS[d.regId] }));
}

export async function runSaved(ctx: Ctx, regId: number, f: SqFilter) {
  const d = all().find((x) => x.regId === regId);
  if (!d) throw notFound('Report format');
  const port = PORTS[regId];
  if (!port) throw unprocessable(`"${d.name}" is not available yet`);
  const rows = await port(ctx, f);
  const cols = (d.cols ?? []).map((c) => ({ ...c, field: fieldOf(c.sel) }));
  // no grid definition saved: the old grid showed every column of the query
  const shown = cols.some((c) => c.show) ? cols : Object.keys(rows[0] ?? {}).map((k, i) => ({ sel: k, cap: k, sum: null, filter: null, show: true, seq: i, dec: null, fmt: null, field: k }));
  return { regId, name: d.name, mode: d.mode, cols: shown, rows };
}

/* ------------------------------------------------------------------ filters */
const ids = (v?: string) => (v ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
/** company + cost centre + date range on a voucher alias */
function scope(ctx: Ctx, f: SqFilter, v = 'v', dateCol = 'date'): SQL {
  const co = ids(f.companies), cc = ids(f.costCenters);
  return sql.raw(
    (co.length ? ` and ${v}.company_id in (${co.join(',')})` : ` and ${v}.company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId})`) +
      (cc.length ? ` and ${v}.cost_center_id in (${cc.join(',')})` : '') +
      ` and ${v}.${dateCol} between '${f.from.replace(/'/g, '')}' and '${f.to.replace(/'/g, '')}'`
  );
}
const N = (v: unknown) => Number(v ?? 0) || 0;

/** party-group outstanding as the old PartyGroupWiseOs view: amount and the largest overdue days per group */
async function groupOs(ctx: Ctx, asOn: string) {
  const os = await rep.outstanding(ctx, 'receivable', { asOn });
  const pg = await ctx.db.execute<Row>(sql`select id, coalesce(party_group_id, id) as g from accounts where company_id = ${ctx.mcId}`);
  const groupOf = new Map(pg.rows.map((r) => [Number(r.id), Number(r.g)]));
  const m = new Map<number, { amt: number; days: number }>();
  for (const b of os.bills as unknown as { partyId: number; pending: number; days: number }[]) {
    const g = groupOf.get(b.partyId) ?? b.partyId;
    const t = m.get(g) ?? { amt: 0, days: 0 };
    t.amt += N(b.pending); if (N(b.pending) > 0) t.days = Math.max(t.days, N(b.days));
    m.set(g, t);
  }
  return m;
}
/** party balance in a company (PBALANCE): debit − credit up to the date */
async function balances(ctx: Ctx, asOn: string) {
  const r = await ctx.db.execute<Row>(sql`select company_id as c, account_id as a, sum(debit - credit) as b from ledger_entries where ledger_period = ${ctx.period} and date <= ${asOn} group by 1, 2`);
  return new Map(r.rows.map((x) => [x.c + '|' + x.a, r2(N(x.b))]));
}

/* ------------------------------------------------------------------ bills (BookList 0–3): 237, 238, 239, 240 */
function saleBills(subtype: string): Port {
  return async (ctx, f) => {
    const bal = subtype === 'SAL' ? await balances(ctx, f.to) : null;
    const res = await ctx.db.execute<Row>(sql`
      select c.name as "CompanyName", cc.name as "CostCenter", v.date as "Sal_Date", v.number as "Sal_Id", it.name as "I_NAME", l.brand as "Desc_Name",
        l.qty as "SalS_Weight", l.rate as "SalS_Rate", v.company_id as "ComCode", v.cost_center_id as "CostcenterCode",
        coalesce((l.extra->>'grossAmt')::numeric, l.basic_amount) as "SalS_GrossAmt", p.name as "P_Name", v.remark as "Sal_Rmk",
        l.disc_pct as "DisPer", l.disc_amount as "DisAmt", 0 as "PalletDisPer", 0 as "PalletDisAmt", 0 as "Diskgs", 0 as "DiskgsAmt",
        pg.name as "Mistry", sp.name as "SalesPerson", v.party_id as pid
      from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id left join companies c on c.id = v.company_id
        left join cost_centers cc on cc.id = v.cost_center_id left join accounts p on p.id = v.party_id left join persons pg on pg.id = p.party_group_id
        left join persons sp on sp.id = coalesce(v.sales_person_id, p.sales_person_id)
      where v.subtype = ${subtype} and v.status <> 'CANCELLED' ${scope(ctx, f)}
      order by v.date, v.number, l.line_no`);
    return res.rows.map(({ pid, ...r }) => (bal ? { ...r, PartyBalance: bal.get(r.ComCode + '|' + pid) ?? 0 } : r));
  };
}
PORTS[237] = saleBills('SAL');
PORTS[239] = saleBills('SALRTN');

function purchaseBills(subtype: string): Port {
  return async (ctx, f) => {
    const res = await ctx.db.execute<Row>(sql`
      select c.name as "CompanyName", cc.name as "CostCenter", v.date as "Pur_Date", coalesce(nullif(v.ref_no, ''), v.number) as "Pur_Invno", it.name as "I_NAME", l.brand as "Desc_Name",
        round(l.qty, 3) as "PurS_Weight", round(l.rate, 3) as "PurS_Rate", v.company_id as "ComCode", v.cost_center_id as "CostcenterCode",
        coalesce((l.extra->>'grossAmt')::numeric, l.basic_amount) as "Pur_GrossAmt", p.name as "P_Name", v.remark as "Pur_Rmk"
      from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id left join companies c on c.id = v.company_id
        left join cost_centers cc on cc.id = v.cost_center_id left join accounts p on p.id = v.party_id
      where v.subtype = ${subtype} and v.status <> 'CANCELLED' ${scope(ctx, f)}
      order by v.date, v.number, l.line_no`);
    return res.rows;
  };
}
PORTS[238] = purchaseBills('PUR');
PORTS[240] = purchaseBills('PURRTN');

/* ------------------------------------------------------------------ orders (BookList 15 / 16): 235, 236, 252 */
const O_STATUS = sql.raw(`case when v.status = 'CANCELLED' then coalesce(l.extra->>'st24', 'CANCEL') when coalesce(v.extra->>'approvedQ', case when v.status = 'PENDING_APPROVAL' then '0' else '1' end) = '0' then 'HOLD'
  else coalesce(l.extra->>'st24', case when l.line_status = 'CLOSED' then 'CLOSE' else 'PENDING' end) end`);
const S_STATUS = sql.raw(`coalesce(l.extra->>'st24', case when v.status = 'CANCELLED' then 'CANCEL' when l.line_status = 'CLOSED' then 'CLOSE' else 'PENDING' end)`);

PORTS[235] = async (ctx, f) => {
  const [os, bal] = await Promise.all([groupOs(ctx, f.to), balances(ctx, f.to)]);
  const res = await ctx.db.execute<Row>(sql`
    select c.name as "CompanyName", cc.name as "CostCenter", v.date as "Sal_Date", v.number as "Sal_Id", it.name as "I_NAME", l.brand as "Desc_Name",
      l.qty as "SalS_Qty", l.rate as "SalS_Rate", ${S_STATUS} as "Sals_Status", v.company_id as "ComCode", v.cost_center_id as "Sal_CostCenter", p.name as "P_Name",
      sp.name as "SalesPerson", u.name as username, ${O_STATUS} as "O_Status", br.name as "Broker", coalesce((l.extra->>'lastRate')::numeric, 0) as "Pur_Rate",
      round(l.rate - coalesce((l.extra->>'lastRate')::numeric, 0), 2) as "DiffRate", pg.name as "Mistry", pg.phone as "MobileNo", pgc.contact as "ContactPerson",
      concat_ws(' ', p.address1, p.address2) as "P_OAdd", p.credit_days as "P_CrDay", coalesce(nullif(p.extra->>'P_LockDays', '')::numeric, 0) as "P_LockDays",
      coalesce(p.party_group_id, p.id) as g, p.id as pid
    from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id left join companies c on c.id = v.company_id
      left join cost_centers cc on cc.id = v.cost_center_id left join accounts p on p.id = v.party_id left join persons pg on pg.id = p.party_group_id
      left join lateral (select pg.extra->>'Brk_ContactPerson' as contact) pgc on true
      left join persons sp on sp.id = v.sales_person_id left join persons br on br.id = v.broker_id left join users u on u.id = v.created_by_id
    where v.type = 'SALES_ORDER' ${scope(ctx, f)}
    order by v.date, v.number, l.line_no`);
  return res.rows.map(({ g, pid, ...r }) => {
    const o = os.get(Number(g)) ?? { amt: 0, days: 0 };
    return { ...r, BALANCE: bal.get(r.ComCode + '|' + pid) ?? 0, OsAmount: r2(o.amt), DiffDays: Math.max(0, o.days - N(r.P_LockDays)) };
  });
};

PORTS[236] = async (ctx, f) => {
  const res = await ctx.db.execute<Row>(sql`
    select c.name as "CompanyName", cc.name as "CostCenter", v.date as "Sal_Date", v.number as "Sal_Id", it.name as "I_NAME", l.brand as "Desc_Name",
      l.qty as "SalS_Qty", l.rate as "SalS_Rate", v.company_id as "ComCode", v.cost_center_id as "Sal_CostCenter", p.name as "P_Name", sp.name as "SalesPerson",
      u.name as username, ${O_STATUS} as "O_Status", br.name as "Broker",
      (select string_agg(distinct l2.grade, ',') from voucher_lines l2 where l2.voucher_id = v.id and l2.grade is not null) as "Grade"
    from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id left join companies c on c.id = v.company_id
      left join cost_centers cc on cc.id = v.cost_center_id left join accounts p on p.id = v.party_id
      left join persons sp on sp.id = v.sales_person_id left join persons br on br.id = v.broker_id left join users u on u.id = v.created_by_id
    where v.type = 'PURCHASE_ORDER' ${scope(ctx, f)}
    order by v.date, v.number, l.line_no`);
  return res.rows;
};

/** Total Pending Booking: sales-order lines with what was dispatched, status as chosen (Pending by default) */
PORTS[252] = async (ctx, f) => {
  const status = (f.status || 'PENDING').toUpperCase();
  const os = await groupOs(ctx, f.to);
  const res = await ctx.db.execute<Row>(sql`
    select v.number as "Sal_Id", v.date as "Sal_Date", p.name as "P_Name", dp.name as "DelParty", su.name as "SuppName", it.name as "I_Name", l.brand as "Brand",
      l.lot_no as "Sals_LotNumber", l.lot_no as "Sals_LotNo", l.qty as "Ord_Qty", x."ordQty" - x.pending as "DispSchQty", x.pending as "PendingQty",
      round(l.rate, 2) as "SalS_Rate", br.name as "Architect", pg.name as "Mistry", ${S_STATUS} as "Sals_Status", v.remark as "Sal_Rmk", v.credit_days as "Ord_CrDays",
      v.brokerage_rate as "Sal_BrkPerRate", v.brokerage_rate as "Sal_BrkKgs", v.sales_person_id as "Sal_SalesPersonCode", sp.name as "Brk_Name",
      concat_ws(E'\\r\\n', p.name, concat_ws(' ', p.address1, p.address2)) as "PARTY_ADD", concat_ws(E'\\r\\n', dp.name, concat_ws(' ', dp.address1, dp.address2)) as "DELPARTY_ADD",
      l.grade as "Grade", p.mobile as "P_OMobile", v.company_id as "ComCode", v.cost_center_id as "Sal_CostCenter", p.id as "P_Code", dp.id as "Del_P_Code",
      it.id as "I_Code", coalesce(p.party_group_id, p.id) as "P_MtryCode", p.broker_id as "P_BrCode"
    from (${trading.pendingSalesOrderLinesSql(ctx, { companies: f.companies })}) x
      join vouchers v on v.id = x."voucherId" join voucher_lines l on l.id = x.id left join items it on it.id = x."itemId"
      left join accounts p on p.id = v.party_id left join accounts dp on dp.id = v.delivery_party_id left join accounts su on su.id = nullif(v.extra->>'supplierId', '')::int
      left join persons pg on pg.id = p.party_group_id left join persons br on br.id = v.broker_id left join persons sp on sp.id = v.sales_person_id
    where true ${scope(ctx, f)} and ${S_STATUS} = ${status}
    order by v.date, v.number, l.line_no`);
  const grpPending = new Map<number, number>();
  for (const r of res.rows) grpPending.set(Number(r.P_MtryCode), (grpPending.get(Number(r.P_MtryCode)) ?? 0) + N(r.PendingQty));
  return res.rows.map((r) => {
    const o = os.get(Number(r.P_MtryCode)) ?? { amt: 0, days: 0 };
    return { ...r, OsAmount: r2(o.amt), OsDueDays: o.days, PtyGrpPeningQty: Math.round((grpPending.get(Number(r.P_MtryCode)) ?? 0) * 1000) / 1000 };
  });
};

/** Dispatch Approval Report: approved dispatch-schedule lines */
PORTS[253] = async (ctx, f) => {
  const os = await groupOs(ctx, f.to);
  const res = await ctx.db.execute<Row>(sql`
    select row_number() over (order by v.id, l.line_no) as "AutoNo", cc.name as "CostCenter", b.name as "BookName", p.name as "Party_Name", dp.name as "Delivery_Party",
      br.name as "Broker", l.lot_no as "Lot_No", it.name as "ItemName", t.name as "Transporter", v.number as "Dspt_ChallNo", v.date as "Dspt_ChallDate",
      o.number as "Dspt_OrderNo", o.date as "Dspt_OrderDate", v.lr_no as "Dspt_Lrno", v.lr_date as "Dspt_LrDate", v.vehicle_no as "Dspt_VehicalNo",
      v.company_id as "CompCode", l.pcs as "Dspt_TotBoxes", l.qty as "Dspt_TotQty", l.cops as "Dspt_TotCops", l.rate as "Dspt_Rate", l.challan_no as "Dspt_Pchno",
      l.remark1 as "Dspt_Remarks", s.number as "Sal_Id", l.brand as "Brand", l.grade as "Grade", l.amount as "Dspt_FinalAmt", coalesce(p.party_group_id, p.id) as "P_MtryCode",
      pg.name as "Mistry", ua.name as "Dspt_IsApproved", v.approved_at as "Dspt_ApprovedDt", sp.name as "SalesPerson"
    from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id left join books b on b.id = v.book_id
      left join cost_centers cc on cc.id = v.cost_center_id left join accounts p on p.id = v.party_id left join accounts dp on dp.id = v.delivery_party_id
      left join persons pg on pg.id = p.party_group_id left join persons br on br.id = v.broker_id left join transporters t on t.id = v.transporter_id
      left join voucher_lines ol on ol.id = l.order_line_id left join vouchers o on o.id = ol.voucher_id left join persons sp on sp.id = o.sales_person_id
      left join users ua on ua.id = v.approved_by_id
      left join lateral (select s.number from voucher_lines sl join vouchers s on s.id = sl.voucher_id where sl.source_line_id = l.id and s.type = 'SALE_BILL' limit 1) s on true
    where v.type = 'DISPATCH_SCHEDULE' and v.status <> 'CANCELLED' and v.approved_at is not null ${scope(ctx, f)}
    order by v.id, l.line_no`);
  return res.rows.map((r) => {
    const o = os.get(Number(r.P_MtryCode)) ?? { amt: 0, days: 0 };
    return { ...r, OsAmount: r2(o.amt), OsDueDays: o.days };
  });
};

/* ------------------------------------------------------------------ debit / credit note registers: 258, 257 */
function noteRegister(types: string[]): Port {
  return async (ctx, f) => {
    const res = await ctx.db.execute<Row>(sql`
      select b.name as "Book_Name", cc.name as "Cost_Name", v.id as "JV_Code", v.number as "JV_VchNo", v.date as "JV_VchDt", p.name as "P_Name",
        v.extra->>'billNo' as "Jv_BillNo", abs(v.amount) as "DebitAmount", abs(v.amount) as "CreditAmount", coalesce(v.narration, v.remark) as "Narr_Text",
        v.subtype as "Jv_Type", coalesce(v.extra->>'secondAccount', sa.name) as "ExpAcc", coalesce((v.extra->>'beforeTax')::numeric, v.taxable_amount) as "TaxableAmt",
        (v.extra->>'cgstPct')::numeric as "Jv_CGstPer", v.cgst_amount as "JV_CGST", v.sgst_amount as "JV_SGST", (v.extra->>'sgstPct')::numeric as "Jv_SGstPer",
        (v.extra->>'igstPct')::numeric as "Jv_IGstPer", v.igst_amount as "JV_IGST", v.extra->>'tdsAccount' as "TDS_ACCOUNT", coalesce((v.extra->>'tdsAmt')::numeric, v.tds_amount) as "Jv_TDSAmt",
        v.cost_center_id as "COSTCENTERCODE", v.company_id as "COMCODE", v.extra->>'hsn' as "JV_HSNCODE", pg.name as "Mistry", p.extra->>'P_LegName' as "P_LegName"
      from vouchers v left join books b on b.id = v.book_id left join cost_centers cc on cc.id = v.cost_center_id left join accounts p on p.id = v.party_id
        left join persons pg on pg.id = p.party_group_id left join accounts sa on sa.id = nullif(v.extra->>'secondAccountId', '')::int
      where v.type in ${sql.raw('(' + types.map((t) => `'${t}'`).join(',') + ')')} and v.status <> 'CANCELLED' ${scope(ctx, f)}
      order by v.date, v.number`);
    return res.rows;
  };
}
PORTS[258] = noteRegister(['DEBIT_NOTE']);
PORTS[257] = noteRegister(['CREDIT_NOTE']);

/* ------------------------------------------------------------------ bank / cash: 249 daily receipt, 248 daily payment (RecMst_SubView) */
const REC_TYPES: Record<string, string[]> = { BANKREC: ['BANKREC', 'BANKRECON'], CASHREC: ['CASHREC'], BANKPAY: ['BANKPAY', 'BANKPAYON'], CASHPAY: ['CASHPAY'] };
function daily(kind: 'RECEIPT' | 'PAYMENT'): Port {
  return async (ctx, f) => {
    const t = REC_TYPES[f.type || (kind === 'RECEIPT' ? 'BANKREC' : 'BANKPAY')] ?? REC_TYPES.BANKREC;
    const res = await ctx.db.execute<Row>(sql`
      select v.number as "Vouchar_No", v.extra->>'slipNo' as "Slip_No", v.date as "Rec_VchDt", v.instrument_no as "Cheque_No", p.name as "Party_Name",
        bk.name as "Bank_Name", p.mobile as "Mobile",
        coalesce(v.extra->>'billNo', (select string_agg(b.number, ',' order by b.date) from bill_allocations al join vouchers b on b.id = al.bill_id where al.voucher_id = v.id)) as "Bill_No",
        v.extra->>'partyBank' as "PBankName", abs(coalesce(v.amount, v.net_amount)) as "Amount", v.company_id as "COMCODE", u.name as username, v.created_at as "Udatetime",
        trim(to_char(v.date, 'Month')) || '-' || to_char(v.date, 'YYYY') as "MONTHYEAR", v.cost_center_id as "CostcenterCode"
      from vouchers v left join accounts p on p.id = v.party_id left join accounts bk on bk.id = v.bank_account_id left join users u on u.id = v.created_by_id
      where v.type = ${kind} and v.subtype in ${sql.raw('(' + t.map((x) => `'${x}'`).join(',') + ')')} and v.status <> 'CANCELLED' ${scope(ctx, f)}
      order by v.date, v.number`);
    return res.rows;
  };
}
PORTS[249] = daily('RECEIPT');
PORTS[248] = daily('PAYMENT');

/* ------------------------------------------------------------------ purchase → dispatch → sale chain: 241, 247, 255, 254 */
/** purchase lines (PUR / AUTPUR) with the sale lines billed from them (old link: purchase code + challan + item + brand + grade) */
function purchaseSaleChain(ctx: Ctx, f: SqFilter, by: 'purchase' | 'sale') {
  const dateOn = by === 'purchase' ? scope(ctx, f, 'pv') : scope(ctx, f, 'sv');
  return sql`
    select pv.legacy_code as "Pur_Code", pv.number as "Pur_Id", pv.date as "Pur_Date", it.name as "I_NAME", pv.total_pcs as "PurS_SqMt_Ft", pv.total_qty as "PurS_Weight",
      sl.challan_no as "Dspt_ChallNo", sl.challan_date as "Dspt_ChallDate", sv.number as "Dspt_SalId", sv.legacy_code as "Sal_Code", sv.date as "Sal_Date",
      sl.qty as "SalS_Weight", sl.pcs as "SalS_SqMt_Ft", pv.company_id as "ComCode", pv.cost_center_id as "CostcenterCode", pl.brand as "BrandName", pl.grade as "GradeName",
      round(pl.rate, 2) as "PurS_Rate", round(sl.rate, 2) as "SalS_Rate", round(coalesce(sl.rate, 0) - coalesce(pl.rate, 0), 2) as "DiffRate", sl.basic_amount as "SalS_Amt", sl.taxable_amount as "Sals_TaxableAmt",
      pv.net_amount as "PurS_TaxableAmt", pv.net_amount as "Pur_NetAmt", coalesce(nullif(pv.ref_no, ''), pv.number) as "Pur_invNo", pv.ref_date as "Pur_InvDt",
      sv.date - pv.date as "DiffDays", pv.id as pid, coalesce(nullif(regexp_replace(sv.number, '\\D', '', 'g'), '')::numeric, 0) as snum
    from vouchers pv join voucher_lines pl on pl.voucher_id = pv.id left join items it on it.id = pl.item_id
      ${by === 'purchase' ? sql`left` : sql``} join voucher_lines sl on sl.extra->>'purchaseCode' = pv.legacy_code and btrim(coalesce(sl.extra->>'purChallan', '')) = btrim(coalesce(pl.challan_no, ''))
        and sl.item_id = pl.item_id and coalesce(sl.grade, '') = coalesce(pl.grade, '') and coalesce(sl.brand, '') = coalesce(pl.brand, '')
      ${by === 'purchase' ? sql`left` : sql``} join vouchers sv on sv.id = sl.voucher_id and sv.type = 'SALE_BILL' and sv.status <> 'CANCELLED'
    where pv.type = 'PURCHASE_BILL' and pv.subtype in ('PUR', 'AUTPUR') and pv.status <> 'CANCELLED' ${dateOn}`;
}
/** add the running balance of the purchase as the old window did (Pur_TotWeight − sales so far, by sale number) */
function withBalance(rows: Row[], profit: boolean) {
  const byPur = new Map<unknown, Row[]>();
  for (const r of rows) { const k = r.pid; if (!byPur.has(k)) byPur.set(k, []); byPur.get(k)!.push(r); }
  const out: Row[] = [];
  for (const list of byPur.values()) {
    list.sort((a, b) => N(a.snum) - N(b.snum));
    let w = 0, amt = 0;
    for (const { pid, snum, ...r } of list) {
      w += N(r.SalS_Weight); amt += N(r.SalS_Amt);
      const bal = Math.round((Math.round(N(r.PurS_Weight) * 100) / 100 - Math.round(w * 100) / 100) * 100) / 100;
      const extra: Row = { BalQty: r.Dspt_SalId ? bal : null };
      if (profit) { extra.Profit = r2(amt); extra.NetProfit = Math.abs(Math.round(w * 100) / 100 - Math.round(N(r.PurS_Weight) * 100) / 100) < 0.005 ? r2(amt - N(r.Pur_NetAmt)) : r2(w * N(r.DiffRate)); }
      out.push({ ...r, ...extra });
    }
  }
  return out.sort((a, b) => String(a.Pur_Id).localeCompare(String(b.Pur_Id)) || String(a.Dspt_SalId ?? '').localeCompare(String(b.Dspt_SalId ?? '')));
}
PORTS[241] = async (ctx, f) => withBalance((await ctx.db.execute<Row>(purchaseSaleChain(ctx, f, 'purchase'))).rows, false);
PORTS[247] = async (ctx, f) => withBalance((await ctx.db.execute<Row>(purchaseSaleChain(ctx, f, 'sale'))).rows, true);
PORTS[255] = async (ctx, f) => withBalance((await ctx.db.execute<Row>(purchaseSaleChain(ctx, f, 'sale'))).rows, true);

/** Sale VS Purchase Profit: each sale bill + item with the purchase line it was booked on */
PORTS[254] = async (ctx, f) => {
  const res = await ctx.db.execute<Row>(sql`
    select sv.legacy_code as "Sal_Code", sv.number as "Sal_Id", sv.date as "Sal_Date", sp.name as "SaleParty", it.name as "I_Name", sl.brand as "Brand", sl.grade as "Grade",
      sum(sl.pcs) as "SalS_SqMt_Ft", sum(sl.qty) as "SalS_Weight", max(sl.rate) as "SalS_Rate", round(sum(sl.taxable_amount), 2) as "SalS_TaxableAmt",
      round(sum(sl.taxable_amount) / nullif(sum(sl.qty), 0), 2) as "ActSalRate", round(sum(sl.qty) * round(sum(sl.taxable_amount) / nullif(sum(sl.qty), 0), 2), 2) as "SalS_Amt",
      pv.ref_date as "Pur_InvDt", pv.ref_no as "Pur_Invno", pv.number as "Pur_Id", pp.name as "PurParty", sum(sl.pcs) as "PurPcs", sum(sl.qty) as "PurQty",
      pl.qty as "Pur_TotWeight", pl.taxable_amount as "PurS_TaxableAmt", round(pl.taxable_amount / nullif(pl.qty, 0), 3) as "ActPurRate",
      round(round(pl.taxable_amount / nullif(pl.qty, 0), 3) * sum(sl.qty), 2) as "PurAmt",
      round(round(sum(sl.qty) * round(sum(sl.taxable_amount) / nullif(sum(sl.qty), 0), 3), 2) - round(pl.taxable_amount / nullif(pl.qty, 0), 3) * sum(sl.qty), 2) as "DiffRate",
      round((round(sum(sl.qty) * round(sum(sl.taxable_amount) / nullif(sum(sl.qty), 0), 3), 2) - round(pl.taxable_amount / nullif(pl.qty, 0), 3) * sum(sl.qty)) / nullif(sum(sl.qty), 0), 3) as "PerKgs",
      sv.company_id as "ComCode", sv.cost_center_id as "CostcenterCode"
    from vouchers sv join voucher_lines sl on sl.voucher_id = sv.id left join accounts sp on sp.id = sv.party_id left join items it on it.id = sl.item_id
      left join vouchers pv on pv.legacy_code = sl.extra->>'purchaseCode' and pv.type = 'PURCHASE_BILL'
      left join voucher_lines pl on pl.voucher_id = pv.id and btrim(coalesce(pl.challan_no, '')) = btrim(coalesce(sl.extra->>'purChallan', '')) and pl.item_id = sl.item_id and coalesce(pl.grade, '') = coalesce(sl.grade, '')
      left join accounts pp on pp.id = pv.party_id
    where sv.type = 'SALE_BILL' and sv.subtype = ${f.type || 'SAL'} and sv.status <> 'CANCELLED' ${scope(ctx, f, 'sv')}
    group by sv.legacy_code, sv.number, sv.date, sp.name, it.name, sl.brand, sl.grade, pv.ref_date, pv.ref_no, pv.number, pp.name, sv.company_id, sv.cost_center_id, pl.taxable_amount, pl.qty
    order by sv.date, sv.number, pv.number`);
  return res.rows;
};

/* ------------------------------------------------------------------ Manage Desk → Outstanding tab (OutStandingYarn grid) */
type DeskCol = { field: string; cap: string; sum?: 'Sum' | 'Count'; dec?: number };
const OS_LAYOUTS: Record<string, DeskCol[]> = {
  Datewise: [
    { field: 'BillDt', cap: 'Bill Date' }, { field: 'BillNo', cap: 'Bill No.', sum: 'Count' }, { field: 'Mistry', cap: 'Party Group' }, { field: 'P_Name', cap: 'Account Name' },
    { field: 'I_Name', cap: 'Item' }, { field: 'Brand', cap: 'Brand' }, { field: 'Qty', cap: 'Qty', sum: 'Sum' }, { field: 'PendingAmt', cap: 'Pending Amt', sum: 'Sum' },
    { field: 'Ftype', cap: 'Type' }, { field: 'Architect', cap: 'Broker' }, { field: 'CollectionName', cap: 'Collection Name' }, { field: 'DiffDays', cap: 'Diff Days', dec: 0 },
    { field: 'Sal_Crdays', cap: 'Cr days', dec: 0 }, { field: 'OverDueDays', cap: 'Over DueDays', dec: 0 }, { field: 'DueDt', cap: 'Due Date' }
  ],
  'PartyGroup+Party Wise Summary': [
    { field: 'Mistry', cap: 'Party Group' }, { field: 'P_Name', cap: 'Account Name' }, { field: 'I_Name', cap: 'Item' }, { field: 'Brand', cap: 'Brand' },
    { field: 'Qty', cap: 'Qty', sum: 'Sum' }, { field: 'PendingAmt', cap: 'Pending Amt', sum: 'Sum' }, { field: 'Ftype', cap: 'Type' }, { field: 'Architect', cap: 'Broker' }
  ],
  PartGroup_Broker_SalesPerone_Wise: [
    { field: 'Mistry', cap: 'Party Group' }, { field: 'Architect', cap: 'Broker' }, { field: 'SalesPersonName', cap: 'Sales Person Name' }, { field: 'PendingAmt', cap: 'Pending Amt', sum: 'Sum' },
    { field: 'DiffDays', cap: 'Diff Days', dec: 0 }, { field: 'Sal_Crdays', cap: 'Cr Days', dec: 0 }, { field: 'OverDueDays', cap: 'Over Due Days', dec: 0 }, { field: 'LockDays', cap: 'Lock Days', dec: 0 },
    { field: 'LockDaysWiseOverDueDy', cap: 'Lock Days Wise OverDue Days', dec: 0 }, { field: 'OsInPer', cap: 'O.S. In Per(%)', dec: 2 }
  ],
  Sales_Person_Wise: [
    { field: 'SalesPersonName', cap: 'Sales Person' }, { field: 'Mistry', cap: 'Party Group' }, { field: 'P_Name', cap: 'Account Name' }, { field: 'I_NAME', cap: 'Item' }, { field: 'Brand', cap: 'Brand' },
    { field: 'Qty', cap: 'Qty', sum: 'Sum' }, { field: 'Sal_NetAmt', cap: 'Bill Amt', sum: 'Sum' }, { field: 'ReceivedAmt', cap: 'Recieved Amt', sum: 'Sum' }, { field: 'PendingAmt', cap: 'Pending Amt', sum: 'Sum' },
    { field: 'Ftype', cap: 'Type' }, { field: 'Architect', cap: 'Broker' }
  ]
};
export const OS_TYPES: Record<string, { kind: string; subtypes: string[] }> = {
  SAL: { kind: 'sale', subtypes: ['SAL'] }, SALGEN: { kind: 'sale', subtypes: ['SAL', 'GENSAL', 'GENSALRTN'] }, DBNT: { kind: 'debit', subtypes: ['DBNT', 'AUTODBNT'] }
};
export async function deskOutstanding(ctx: Ctx, f: SqFilter & { layout?: string }) {
  const layout = OS_LAYOUTS[f.layout ?? ''] ? f.layout! : 'Datewise';
  const t = OS_TYPES[f.type ?? ''] ?? OS_TYPES.SAL;
  const d = await outstandingPrint(ctx, { kind: t.kind, from: f.from, to: f.to, by: 'party', companies: f.companies, costCenters: f.costCenters });
  const bills = (d.bills as unknown as Row[]).filter((b) => t.subtypes.includes(String(b.subtype)));
  const pids = [...new Set(bills.map((b) => Number(b.partyId)))];
  const lock = new Map<number, number>();
  if (pids.length) {
    const r = await ctx.db.execute<Row>(sql`select id, coalesce(nullif(extra->>'P_LockDays', '')::numeric, 0) as l from accounts where id in ${sql.raw('(' + pids.join(',') + ')')}`);
    for (const x of r.rows) lock.set(Number(x.id), N(x.l));
  }
  const parties = d.parties as unknown as Record<string, { name: string }>;
  const rows: Row[] = bills.map((b) => {
    const diff = N(b.days), cr = N(b.crDays), lk = lock.get(Number(b.partyId)) ?? 0;
    return {
      BillDt: b.date, BillNo: b.number, Mistry: b.partyGroup, P_Name: parties[String(b.partyId)]?.name ?? '', I_Name: b.itemName, I_NAME: b.itemName, Brand: b.brand,
      Qty: N(b.qty), Sal_NetAmt: N(b.net), ReceivedAmt: N(b.received), PendingAmt: N(b.pending), Ftype: b.subtype === 'AUTODBNT' ? 'DBNT' : b.subtype, Architect: b.brokerName,
      CollectionName: b.collector, SalesPersonName: b.salesPerson, DiffDays: diff, Sal_Crdays: cr, OverDueDays: diff > cr ? diff - cr : 0, DueDt: b.dueDate,
      LockDays: lk, LockDaysWiseOverDueDy: diff > lk ? diff - lk : 0
    };
  });
  let out = rows;
  if (layout === 'PartyGroup+Party Wise Summary' || layout === 'PartGroup_Broker_SalesPerone_Wise') {
    const keyOf = (r: Row) => (layout === 'PartyGroup+Party Wise Summary' ? [r.Mistry, r.P_Name] : [r.Mistry, r.Architect, r.SalesPersonName]).join('|');
    const m = new Map<string, Row>();
    for (const r of rows) {
      const k = keyOf(r); const g = m.get(k);
      if (!g) { m.set(k, { ...r }); continue; }
      g.Qty = N(g.Qty) + N(r.Qty); g.PendingAmt = r2(N(g.PendingAmt) + N(r.PendingAmt)); g.Sal_NetAmt = N(g.Sal_NetAmt) + N(r.Sal_NetAmt); g.ReceivedAmt = N(g.ReceivedAmt) + N(r.ReceivedAmt);
      if (N(r.DiffDays) > N(g.DiffDays)) Object.assign(g, { DiffDays: r.DiffDays, Sal_Crdays: r.Sal_Crdays, OverDueDays: r.OverDueDays, LockDaysWiseOverDueDy: r.LockDaysWiseOverDueDy });
    }
    out = [...m.values()];
    if (layout === 'PartGroup_Broker_SalesPerone_Wise') {
      const grp = new Map<string, number>();
      for (const r of out) grp.set(String(r.Mistry), (grp.get(String(r.Mistry)) ?? 0) + N(r.PendingAmt));
      out = out.map((r) => ({ ...r, OsInPer: grp.get(String(r.Mistry)) ? r2((N(r.PendingAmt) / grp.get(String(r.Mistry))!) * 100) : 0 }));
    }
    out.sort((a, b) => String(a.Mistry).localeCompare(String(b.Mistry)) || String(a.P_Name ?? a.Architect).localeCompare(String(b.P_Name ?? b.Architect)));
  }
  const cols = OS_LAYOUTS[layout].map((c, i) => ({ sel: c.field, cap: c.cap, sum: c.sum ?? null, filter: null, show: true, seq: i, dec: c.dec ?? null, fmt: null, field: c.field }));
  return { regId: 0, name: 'Outstanding - ' + layout, mode: 'DETAIL', cols, rows: out };
}
export const OS_LAYOUT_NAMES = Object.keys(OS_LAYOUTS);

/* ------------------------------------------------------------------ Manage Desk → Stock tab (ItemLedgerList on Tradding_ItemLedger) */
/** stock movements as the old item ledger counted them: purchases / general purchases / sale returns in; purchase returns,
 *  sale bills and dispatches not yet billed out. Before 01-04-2024 only the purchases UMIYA24 carried as stock. KGS lines count the weight. */
function itemLedgerSql(ctx: Ctx, f: SqFilter) {
  const co = ids(f.companies), cc = ids(f.costCenters);
  const scopeSql = sql.raw((co.length ? ` and v.company_id in (${co.join(',')})` : ` and v.company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId})`) + (cc.length ? ` and v.cost_center_id in (${cc.join(',')})` : ''));
  return sql`
    select l.item_id, coalesce(l.brand, '') as brand, coalesce(l.grade, '') as grade, v.date,
      case when v.type in ('PURCHASE_BILL', 'GENERAL_PURCHASE', 'SALE_RETURN') then 1 else -1 end as dir, coalesce(l.pcs, 0) as box,
      case when v.type = 'DISPATCH_SCHEDULE' then l.qty when coalesce(upper(l.unit), 'KGS') = 'KGS' then coalesce((l.extra->>'stockQty')::numeric, l.weight, l.qty) else l.qty end as q
    from vouchers v join voucher_lines l on l.voucher_id = v.id join items it on it.id = l.item_id
    where v.status <> 'CANCELLED' and coalesce(it.extra->>'I_ISTOCK', 'YES') <> 'NO' and v.date <= ${f.to} ${scopeSql} and (
      (v.type in ('PURCHASE_BILL', 'GENERAL_PURCHASE', 'PURCHASE_RETURN') and (v.type <> 'PURCHASE_BILL' or v.subtype = 'PUR') and (v.date >= '2024-04-01' or l.extra->>'isStock24' = '1'))
      or (v.type in ('SALE_BILL', 'SALE_RETURN') and (v.type <> 'SALE_BILL' or v.subtype = 'SAL') and v.date >= '2024-04-01')
      or (v.type = 'DISPATCH_SCHEDULE' and v.date >= '2024-04-01' and coalesce(v.extra->>'saleBillNo', '') = '' and not exists (select 1 from voucher_lines s where s.source_line_id = l.id)))`;
}
const STOCK_COLS: DeskCol[] = [
  { field: 'ICODE', cap: 'Item Code' }, { field: 'INAME', cap: 'Item Name' }, { field: 'Brand', cap: 'Brand' }, { field: 'Grade', cap: 'Grade' },
  { field: 'OpnBox', cap: 'Opn Box', sum: 'Sum', dec: 0 }, { field: 'OpnQty', cap: 'Opn Qty', sum: 'Sum', dec: 3 }, { field: 'InBox', cap: 'In Box', sum: 'Sum', dec: 0 },
  { field: 'InQty', cap: 'In Qty', sum: 'Sum', dec: 3 }, { field: 'OutBox', cap: 'Out Box', sum: 'Sum', dec: 0 }, { field: 'OutQty', cap: 'Out Qty', sum: 'Sum', dec: 3 },
  { field: 'CloBox', cap: 'Clo Box', sum: 'Sum', dec: 0 }, { field: 'CloQty', cap: 'Clo Qty', sum: 'Sum', dec: 3 }, { field: 'BillDays', cap: 'Over Due Stock', dec: 0 }
];
export async function deskStock(ctx: Ctx, f: SqFilter & { days?: string }) {
  const res = await ctx.db.execute<Row>(sql`
    select it.legacy_code as "ICODE", it.name as "INAME", x.brand as "Brand", x.grade as "Grade",
      sum(case when x.date < ${f.from} then x.dir * x.box else 0 end) as "OpnBox", round(sum(case when x.date < ${f.from} then x.dir * x.q else 0 end), 3) as "OpnQty",
      sum(case when x.date >= ${f.from} and x.dir = 1 then x.box else 0 end) as "InBox", round(sum(case when x.date >= ${f.from} and x.dir = 1 then x.q else 0 end), 3) as "InQty",
      sum(case when x.date >= ${f.from} and x.dir = -1 then x.box else 0 end) as "OutBox", round(sum(case when x.date >= ${f.from} and x.dir = -1 then x.q else 0 end), 3) as "OutQty",
      sum(x.dir * x.box) as "CloBox", round(sum(x.dir * x.q), 3) as "CloQty", x.item_id as iid
    from (${itemLedgerSql(ctx, f)}) x join items it on it.id = x.item_id
    group by it.legacy_code, it.name, x.brand, x.grade, x.item_id having round(sum(x.dir * x.q), 3) <> 0
    order by it.name, x.brand, x.grade`);
  // Over Due Stock: days since the oldest purchase that still has stock (item + brand + grade)
  const age = await ctx.db.execute<Row>(sql`select x."itemId" as iid, upper(btrim(coalesce(x.brand, ''))) as b, x.gr as g, min(x.date) as d
    from (${trading.pendingPurchaseSql(ctx, { companies: f.companies })}) x where x."pendingQty" > 0.0005 group by 1, 2, 3`);
  const oldest = new Map(age.rows.map((r) => [r.iid + '|' + r.b + '|' + r.g, String(r.d).slice(0, 10)]));
  const toMs = Date.parse(f.to);
  let rows = res.rows.map(({ iid, ...r }) => {
    const d = oldest.get(iid + '|' + String(r.Brand).toUpperCase().trim() + '|' + r.Grade);
    return { ...r, BillDays: d ? Math.round((toMs - Date.parse(d)) / 86400000) : null };
  });
  const minDays = Number(f.days) || 0;
  if (minDays > 0) rows = rows.filter((r) => N(r.BillDays) >= minDays);
  const cols = STOCK_COLS.map((c, i) => ({ sel: c.field, cap: c.cap, sum: c.sum ?? null, filter: null, show: true, seq: i, dec: c.dec ?? null, fmt: null, field: c.field }));
  return { regId: 0, name: 'Stock Report', mode: 'DETAIL', cols, rows };
}
