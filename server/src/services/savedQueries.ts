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
