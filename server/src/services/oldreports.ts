/**
 * The old software's saved report designs (DevExpress .repx under Creatives\DevExpressReports, listed
 * in RegisterReportsMst) with data under the field names those designs bind to, so each prints as
 * before. Designs are kept in assets/report-designs (<Reg_Id>.repx + index.json).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { notFound, unprocessable } from '../lib/errors.js';
import { r2 } from '../lib/money.js';
import type { Ctx } from './context.js';
import { getCompany } from './admin.js';
import { loadFy } from './documents.js';
import * as rep from './reports.js';
import * as trading from './trading.js';

type Row = Record<string, unknown>;
export interface DesignMeta { regId: number; title: string; type: string; mode: string; groups: string | null; fields: string; company: number; page: string | null }

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/report-designs');
let index: DesignMeta[] | null = null;
const designs = () => (index ??= JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8')) as DesignMeta[]);

/** the kinds of data this build can feed (the rest are listed but not yet available) */
const DATASETS: Record<string, (ctx: Ctx, q: Q) => Promise<Row[]>> = {};
type Q = Record<string, string | undefined>;

export function listDesigns() {
  return designs().map((d) => ({ ...d, available: !!dataset(d) }));
}
function dataset(d: DesignMeta) {
  return DATASETS[d.type === 'Outstanding' ? 'Outstanding' : 'R' + d.regId];
}
export function designXml(regId: number) {
  const d = designs().find((x) => x.regId === regId);
  if (!d) throw notFound('Report design');
  return fs.readFileSync(path.join(DIR, `${regId}.repx`), 'utf8');
}

const dmy = (s: unknown) => (s ? String(s).slice(0, 10).split('-').reverse().join('-') : '');
const N = (v: unknown) => Number(v ?? 0) || 0;

export async function reportData(ctx: Ctx, regId: number, q: Q) {
  const d = designs().find((x) => x.regId === regId);
  if (!d) throw notFound('Report design');
  const fn = dataset(d);
  if (!fn) throw unprocessable(`"${d.title}" is not available yet`);
  const company = await getCompany(ctx);
  const fy = await loadFy(ctx);
  const from = q.from || fy.startDate, to = q.to || q.asOn || new Date().toISOString().slice(0, 10);
  const rows = await fn(ctx, { ...q, userFrom: q.from, from, to });
  const params = {
    Creative_CompanyName: company.name,
    Creative_CompanyNameAddress: [company.address1, company.address2].filter(Boolean).join(', '),
    Creative_ReportTitle: d.title,
    Creative_GstNo: company.gstin ? 'GST No : ' + company.gstin : '',
    Creative_PhoneNo: company.phone ? 'Phone No : ' + company.phone : '',
    Creative_FromToDT: d.type === 'Outstanding' ? 'As On : ' + dmy(to) : `From : ${dmy(from)}  To : ${dmy(to)}`,
    Creative_CostCenter: ''
  };
  return { design: d, params, rows };
}

/* ------------------------------------------------------------------ outstanding (Reg_Type "Outstanding") */
const FTYPE: Record<string, string> = { SALE_BILL: 'SAL', GENERAL_SALE: 'SAL', DEBIT_NOTE: 'DBNT', INTEREST_DEBIT_NOTE: 'DBNT', OPENING_BILL: 'OPN', PURCHASE_BILL: 'PUR', GENERAL_PURCHASE: 'PUR', CREDIT_NOTE: 'CRNT' };

DATASETS.Outstanding = async (ctx, q) => {
  const side = q.side === 'payable' ? 'payable' : 'receivable';
  const asOn = q.to!;
  const out = await rep.outstanding(ctx, side, { asOn, partyId: Number(q.partyId) || undefined, groupId: Number(q.groupId) || undefined });
  const bills = out.bills as unknown as (Row & { id: number; pending: number; net: number; days: number })[];
  if (!bills.length) return [];
  const ids = bills.map((b) => Number(b.id));
  const company = await getCompany(ctx);
  const more = new Map<number, Row>();
  for (let i = 0; i < ids.length; i += 5000) {
    const chunk = ids.slice(i, i + 5000);
    const res = await ctx.db.execute<Row>(sql`
      select v.id, v.subtype, v.credit_days as "crDays", v.ref_no as "orderNo", v.ref_date as "orderDate", coalesce(v.remark, v.narration) as remark,
        v.taxable_amount as taxable, v.extra->>'avgRate' as "avgRate", t.name as transporter, a.gstin, a.mobile,
        (select it.name from voucher_lines l join items it on it.id = l.item_id where l.voucher_id = v.id order by l.line_no limit 1) as item,
        (select l.brand from voucher_lines l where l.voucher_id = v.id and l.brand is not null order by l.line_no limit 1) as brand,
        (select max(r.date) from bill_allocations al join vouchers r on r.id = al.voucher_id where al.bill_id = v.id and r.date <= ${asOn}) as "recDate"
      from vouchers v left join transporters t on t.id = v.transporter_id left join accounts a on a.id = v.party_id
      where v.id in ${sql.raw('(' + chunk.join(',') + ')')}`);
    for (const r of res.rows) more.set(Number(r.id), r);
  }
  return bills.map((b) => {
    const m = more.get(Number(b.id)) ?? {};
    const qty = N(b.qty);
    return {
      ComCode: company.id, Com_Short: company.shortName ?? '',
      BillDt: b.date, BillDate: b.date, BillNo: b.number, Ftype: FTYPE[String(b.type)] ?? m.subtype ?? b.type,
      P_Name: b.partyName, Partys: b.partyName, PartyName: b.partyName, Mistry: b.partyGroupName ?? b.partyName, PartyGroup: b.partyGroupName ?? b.partyName,
      Gname: b.groupName, Architect: b.brokerName ?? '', CollectionName: b.collectionPersonName ?? '', SalesPersonName: b.salesPersonName ?? '',
      PartyMobile: m.mobile ?? b.mobile ?? '', GstNo: m.gstin ?? '',
      I_NAME: m.item ?? '', Brand: m.brand ?? '', Qty: qty, Sal_AvgRate: m.avgRate != null ? N(m.avgRate) : qty ? r2(b.net / qty) : 0,
      Sal_NetAmt: b.net, TaxableAmt: N(m.taxable), ReceivedAmt: r2(b.net - b.pending), PendingAmt: b.pending, JVAmt: 0,
      Sal_Crdays: N(m.crDays ?? b.creditDays), DiffDays: b.days, Rec_Date: m.recDate ?? '',
      TraspoterName: m.transporter ?? '', OrderNo: m.orderNo ?? '', OrderDate: m.orderDate ?? '', Sal_Rmk: m.remark ?? ''
    };
  });
};

/* ------------------------------------------------------------------ sale registers (776, 854, 357, 832) */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function saleLines(ctx: Ctx, q: Q): Promise<Row[]> {
  const company = await getCompany(ctx);
  const res = await ctx.db.execute<Row>(sql`
    select v.id, v.number, v.date, v.net_amount as net, v.vehicle_no as vehicle, v.credit_days as "crDays", v.extra->>'avgRate' as "avgRate",
      b.name as book, p.name as party, p.gstin, t.name as transporter, br.name as broker, cp.name as collector, u.name as username,
      concat_ws(', ', dp.address1, dp.address2, dp.city) as "dlyAddress",
      l.line_no as "lineNo", l.pcs, l.qty, l.rate, l.basic_amount as basic, l.taxable_amount as taxable, l.cgst_amount as cgst, l.sgst_amount as sgst,
      l.igst_amount as igst, l.amount, l.hsn, l.brand, l.grade, l.lot_no as lot, it.name as item,
      count(*) over (partition by v.id) as "nLines"
    from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id
      left join books b on b.id = v.book_id left join accounts p on p.id = v.party_id left join accounts dp on dp.id = coalesce(v.delivery_party_id, v.party_id)
      left join transporters t on t.id = v.transporter_id left join persons br on br.id = v.broker_id
      left join persons cp on cp.id = coalesce(v.collection_person_id, p.collection_person_id) left join users u on u.id = v.created_by_id
    where v.company_id = ${ctx.companyId} and v.type = 'SALE_BILL' and v.status <> 'CANCELLED' and v.date between ${q.from} and ${q.to}
    order by v.date, v.number, l.line_no`);
  return res.rows.map((r) => {
    const one = N(r.nLines) === 1;
    const net = one ? N(r.net) : N(r.amount);
    return {
      Com_Short: company.shortName ?? '', Billno: r.number, Sal_Date: r.date, Bok_Name: r.book, P_Name: r.party, P_GSTNo: r.gstin ?? '',
      I_Name: r.item ?? '', Brand: r.brand ?? '', Grade: r.grade ?? '', LOT_NMBR: r.lot ?? '', Sals_HsnCode: r.hsn ?? '',
      SalS_SqMt_Ft: N(r.pcs), SalS_weight: N(r.qty), SalS_Rate: N(r.rate), Sals_BasicAmt: N(r.basic), Sals_TaxableAmt: N(r.taxable),
      CGSTAMT: N(r.cgst), SGSTAMT: N(r.sgst), IGSTAMT: N(r.igst), Sal_NetAmt: net,
      Sal_VehicleNo: r.vehicle ?? '', TRASPORT_NAME: r.transporter ?? '', DP_OAdd: r.dlyAddress ?? '', username: r.username ?? '',
      ArchName: r.broker ?? '', CollectionPerson: r.collector ?? '', Sal_Crdays: N(r.crDays),
      Sal_AvgRate: r.avgRate != null ? N(r.avgRate) : N(r.qty) ? r2(net / N(r.qty)) : 0
    };
  });
}
for (const id of [776, 854, 357, 832]) DATASETS['R' + id] = saleLines;

/* ------------------------------------------------------------------ receipts against bills (914 daily, 920 monthly) */
async function receiptBills(ctx: Ctx, q: Q): Promise<Row[]> {
  const company = await getCompany(ctx);
  const res = await ctx.db.execute<Row>(sql`
    select r.id, r.number as "recNo", r.date as "recDate", r.amount as "recAmt", r.instrument_no as "chkNo", r.extra->>'partyBank' as "partyBank",
      coalesce(r.remark, r.narration) as remark, bank.name as bank, p.name as party, p.mobile, pg.name as "partyGroup", br.name as broker, cp.name as collector,
      bl.number as "billNo", bl.date as "billDate", bl.type as "billType", bl.net_amount as "billNet", bl.amount as "billAmt", bl.credit_days as "crDays",
      bl.total_pcs as pcs, bl.total_qty as qty, bl.extra->>'billNo' as "dnBill",
      (select l.brand from voucher_lines l where l.voucher_id = bl.id and l.brand is not null order by l.line_no limit 1) as brand,
      a.amount as paid, coalesce(a.tds_amount, 0) as tds
    from bill_allocations a join vouchers r on r.id = a.voucher_id join vouchers bl on bl.id = a.bill_id
      left join accounts bank on bank.id = r.bank_account_id left join accounts p on p.id = r.party_id left join persons pg on pg.id = p.party_group_id
      left join persons br on br.id = coalesce(bl.broker_id, p.broker_id) left join persons cp on cp.id = p.collection_person_id
    where r.company_id = ${ctx.companyId} and r.type = 'RECEIPT' and r.status <> 'CANCELLED' and r.date between ${q.from} and ${q.to}
    order by r.date, r.number, bl.date`);
  return res.rows.map((r) => {
    const bd = String(r.billDate).slice(0, 10), rd = String(r.recDate).slice(0, 10);
    const billDays = Math.round((Date.parse(rd) - Date.parse(bd)) / 864e5);
    const led = N(r.billNet) || N(r.billAmt);
    const ft = FTYPE[String(r.billType)] ?? String(r.billType);
    const d = new Date(rd);
    return {
      Com_Short: company.shortName ?? '', PartyName: r.party, P_Name: r.party, PartyGroup: r.partyGroup ?? r.party, BankName: r.bank ?? '', P_OMobile: r.mobile ?? '',
      Architect: r.broker ?? '', CollectionName: r.collector ?? '', BillNo: r.billNo, BillDate: bd, Brand: r.brand ?? '',
      AutoDbtS_Pcs: N(r.pcs), AutoDbtS_Qty: N(r.qty), RecSS_RecDate: rd, Rec_Date: rd, BillDays: billDays, TOTALDAYS: billDays,
      CrDays: N(r.crDays), DiffDays: billDays - N(r.crDays), Ftype: ft, Ledamt: led, BIllPaidAmt: N(r.paid), JvPaidAmt: 0, TdsAmt: N(r.tds),
      Balance: 0, SecondAccount: '', AutoDbtS_DbntNo: ft === 'DBNT' ? r.billNo : '', DebitNoteAmt: ft === 'DBNT' ? led : 0,
      ChkNo: r.chkNo ?? '', Rec_NetAmt: N(r.recAmt), PartyBank: r.partyBank ?? '', Remarks: r.remark ?? '', Rem: r.remark ?? '',
      RecNo: r.recNo, RecMonth: `${MON[d.getMonth()]}-${d.getFullYear()}`
    };
  });
}
DATASETS.R914 = receiptBills;
DATASETS.R920 = receiptBills;

/* ------------------------------------------------------------------ trading stock (Pending Order form prints) */
const companiesOf = (q: Q) => q.companies || undefined;

/** Brandwise Sold-UnSold (808 with LockQty, 865 without) */
async function brandSoldUnsold(ctx: Ctx, q: Q): Promise<Row[]> {
  const rows = await trading.soldUnsoldByBrand(ctx, { companies: companiesOf(q) });
  return rows.map((r) => ({ I_Name: r.name, Brand: r.brand, SO_Qty: r.so, Stock: r.stock, LockQty: r.lock, PO_Qty: r.po, Bal_Qty: r.bal }));
}
DATASETS.R808 = brandSoldUnsold;
DATASETS.R865 = brandSoldUnsold;

const STATUS_OF = (mode: string, r: Row) =>
  mode === 'all' ? (r.clear || Math.abs(N(r.pendingQty)) < 0.0005 ? 'CLEAR' : r.lock ? 'LOCK' : 'PENDING') : ({ pending: 'PENDING', clear: 'CLEAR', lock: 'LOCK' } as Record<string, string>)[mode] ?? 'PENDING';

/** purchase stock lines (809 bank stock, 849 purchase stock, 888 item wise): status Pending / Clear / Lock / All */
async function purchaseStockLines(ctx: Ctx, q: Q): Promise<Row[]> {
  const mode = q.mode || 'pending';
  const { rows } = await trading.purchaseStock(ctx, { mode, companies: companiesOf(q), from: q.userFrom || undefined, to: q.to, all: true });
  return (rows as Row[]).map((r) => {
    const rate = N(r.rate);
    return {
      Pur_Id: r.number, Pur_Date: r.date, P_Name: r.party ?? '', DeliveryParty: r.deliveryParty ?? '', SupplierName: r.supplier ?? '', Transpoter: r.transporter ?? '',
      I_Name: String(r.itemName ?? '').trim(), Brand: r.brand ?? '', LOT_NMBR: r.lot ?? '', Grade: r.grade ?? '',
      PurS_Challano: r.challanNo ?? '', Purs_ChDate: r.challanDate ?? '', Pur_Invno: r.invNo ?? '', Pur_LrNo: r.lrNo ?? '', Vehicel: r.vehicle ?? '',
      Pur_Box: N(r.pcs), Purs_Weight: N(r.w), DispatchQty: N(r.dispatchQty), DispatchBox: r2(N(r.pcs) - N(r.pendingBox)), PendingBox: N(r.pendingBox), PendingQty: N(r.pendingQty),
      Purs_Rate: rate, PurS_Rate: rate, Pur_AvgRate: r.avgRate != null ? N(r.avgRate) : rate,
      StockValue: r2(N(r.pendingQty) * rate), BillAmt: r2(N(r.w) * rate), CompanyName: r.com ?? '', Pur_Status: STATUS_OF(mode, r)
    };
  });
}
for (const id of [809, 849, 888]) DATASETS['R' + id] = purchaseStockLines;

/** Stock Summary (835 company wise, 839 all company): summed per brand + item + lot + grade (+ company for 835) */
function stockSummary(byCompany: boolean) {
  return async (ctx: Ctx, q: Q): Promise<Row[]> => {
    const lines = await purchaseStockLines(ctx, q);
    const m = new Map<string, Row>();
    for (const r of lines) {
      const k = [r.Brand, r.I_Name, r.LOT_NMBR, r.Grade, r.Pur_Status, byCompany ? r.CompanyName : ''].join('|');
      const g = m.get(k) ?? { Brand: r.Brand, I_Name: r.I_Name, LOT_NMBR: r.LOT_NMBR, Grade: r.Grade, Pur_Status: r.Pur_Status, CompanyName: byCompany ? r.CompanyName : '', Purs_Weight: 0, DispatchQty: 0, PendingQty: 0 };
      g.Purs_Weight = N(g.Purs_Weight) + N(r.Purs_Weight); g.DispatchQty = N(g.DispatchQty) + N(r.DispatchQty); g.PendingQty = N(g.PendingQty) + N(r.PendingQty);
      m.set(k, g);
    }
    const c = (a: unknown, b: unknown) => String(a ?? '').localeCompare(String(b ?? ''));
    return [...m.values()].sort((a, b) => c(a.Brand, b.Brand) || c(a.I_Name, b.I_Name) || c(a.LOT_NMBR, b.LOT_NMBR) || c(a.Grade, b.Grade));
  };
}
DATASETS.R835 = stockSummary(true);
DATASETS.R839 = stockSummary(false);

/* ------------------------------------------------------------------ pending orders */
/** Purchase Order Summary (841): pending purchase-order lines grouped by brand */
DATASETS.R841 = async (ctx, q) => {
  const res = await ctx.db.execute<Row>(sql`
    select v.number, v.date, v.credit_days as "crDays", x."ordQty", x."purQty", x.pending, x.brand, l.rate, it.name as item, p.name as party
    from (${trading.pendingPurchaseOrderLinesSql(ctx, { companies: companiesOf(q) })}) x
      join vouchers v on v.id = x."voucherId" join voucher_lines l on l.id = x.id join items it on it.id = x."itemId" left join accounts p on p.id = v.party_id
    where x.pending > 0.0005 order by x.brand, v.date, v.number`);
  return res.rows.map((r) => ({ Sal_Id: r.number, Sal_Date: r.date, P_Name: r.party ?? '', I_Name: r.item, Brand: r.brand ?? '', Ord_Qty: N(r.ordQty), PurQty: N(r.purQty), SalS_Rate: N(r.rate), PendingQty: N(r.pending), Ord_CrDays: N(r.crDays) }));
};

/** Daily Sale Soda (887): pending sales-order lines by order date, with the party's outstanding */
DATASETS.R887 = async (ctx, q) => {
  const res = await ctx.db.execute<Row>(sql`
    select v.number, v.date, v.credit_days as "crDays", v.party_id as "partyId", x."ordQty", x.pending, x.brand, l.rate, l.grade, l.lot_no as lot, it.name as item,
      p.name as party, concat_ws(', ', p.address1, p.address2, p.city) as "partyAdd", concat_ws(', ', dp.name, dp.address1, dp.address2, dp.city) as "dlyAdd",
      p.mobile, p.extra->>'P_Gradation' as gradation, pg.name as "partyGroup", br.name as broker, v.brokerage_rate as "brkKgs"
    from (${trading.pendingSalesOrderLinesSql(ctx, { companies: companiesOf(q) })}) x
      join vouchers v on v.id = x."voucherId" join voucher_lines l on l.id = x.id join items it on it.id = x."itemId"
      left join accounts p on p.id = v.party_id left join accounts dp on dp.id = v.delivery_party_id left join persons pg on pg.id = p.party_group_id
      left join persons br on br.id = coalesce(v.broker_id, p.broker_id)
    where x.pending > 0.0005 and v.date between ${q.from} and ${q.to} order by v.date, v.number`);
  const os = await rep.outstanding(ctx, 'receivable', { asOn: q.to });
  const party = new Map<number, { amt: number; due: number }>();
  for (const b of os.bills as unknown as { partyId: number; pending: number; overdueDays: number }[]) {
    const t = party.get(b.partyId) ?? { amt: 0, due: 0 };
    t.amt += N(b.pending); if (N(b.pending) > 0) t.due = Math.max(t.due, N(b.overdueDays));
    party.set(b.partyId, t);
  }
  return res.rows.map((r) => {
    const o = party.get(Number(r.partyId)) ?? { amt: 0, due: 0 };
    return {
      Ord_Id: r.number, Ord_Date: r.date, Mistry: r.partyGroup ?? r.party, P_Name: r.party, PARTY_ADD: [r.party, r.partyAdd].filter(Boolean).join(', '), DELPARTY_ADD: r.dlyAdd ?? '',
      Sals_Status: 'PENDING', Brk_Name: r.broker ?? '', Architect: r.broker ?? '', Sal_BrkKgs: N(r.brkKgs), Brand: r.brand ?? '', Sals_LotNumber: r.lot ?? '', I_Name: r.item,
      SalS_Rate: N(r.rate), Grade: r.grade ?? '', Ord_CrDays: N(r.crDays), Ord_Qty: N(r.ordQty), DispSchQty: r2(N(r.ordQty) - N(r.pending)), PendingQty: N(r.pending),
      OsAmount: r2(o.amt), OsDueDays: o.due, PGQty: 0, P_OMobile: r.mobile ?? '', P_Gradation: r.gradation ?? ''
    };
  });
};

/** Sale Order Register detail (524): every sales-order line in the period, grouped by broker */
DATASETS.R524 = async (ctx, q) => {
  const res = await ctx.db.execute<Row>(sql`
    select v.number, v.date, v.created_at as "createdAt", b.name as book, p.name as party, t.name as transporter, dp.name as dly, pg.name as "partyGroup",
      it.name as item, l.remark1 as remark, l.qty, l.rate, l.lot_no as lot, l.grade, l.extra->>'st24' as st24, l.line_status as "lineStatus", br.name as broker
    from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id left join books b on b.id = v.book_id
      left join accounts p on p.id = v.party_id left join accounts dp on dp.id = v.delivery_party_id left join persons pg on pg.id = p.party_group_id
      left join transporters t on t.id = v.transporter_id left join persons br on br.id = coalesce(v.broker_id, p.broker_id)
    where v.company_id = ${ctx.companyId} and v.type = 'SALES_ORDER' and v.status <> 'CANCELLED' and v.date between ${q.from} and ${q.to}
    order by br.name, v.date, v.number, l.line_no`);
  return res.rows.map((r) => ({
    BROKER: r.broker ?? '', BOOK_NAME: r.book ?? '', PARTY_NAME: r.party ?? '', TRANSPORTER: r.transporter ?? '', DLY_PARTY: r.dly ?? '', MISTRY: r.partyGroup ?? '',
    I_NAME: r.item ?? '', ITEM_REMARKS: r.remark ?? '', QTY: N(r.qty), RATE: N(r.rate), LOT_NMBR: r.lot ?? '', GRADE: r.grade ?? '', ORD_NO: r.number, ORD_DATE: r.date,
    UCreatedt: r.createdAt, Sals_Status: r.st24 ?? (r.lineStatus === 'CLOSED' ? 'CLOSE' : 'PENDING')
  }));
};

/* ------------------------------------------------------------------ purchase register summary (400) */
DATASETS.R400 = async (ctx, q) => {
  const res = await ctx.db.execute<Row>(sql`
    select v.id, v.legacy_code as code, v.number, v.date, v.due_date as due, v.net_amount as net, v.vehicle_no as vehicle, p.name as party, t.name as transporter, br.name as broker,
      it.name as item, it.legacy_code as "itemCode", l.challan_no as ch, l.remark1 as remark, l.qty, l.pcs, l.rate, l.taxable_amount as taxable, l.lot_no as lot, l.grade, l.amount,
      count(*) over (partition by v.id) as "nLines"
    from vouchers v join voucher_lines l on l.voucher_id = v.id left join items it on it.id = l.item_id left join accounts p on p.id = v.party_id
      left join transporters t on t.id = v.transporter_id left join persons br on br.id = v.broker_id
    where v.company_id = ${ctx.companyId} and v.type in ('PURCHASE_BILL', 'GENERAL_PURCHASE') and v.status <> 'CANCELLED' and v.date between ${q.from} and ${q.to}
    order by p.name, it.name, v.date, v.number, l.line_no`);
  return res.rows.map((r) => ({
    Pur_Code: r.code ?? r.id, Billno: r.number, BillDATE: r.date, P_Name: r.party ?? '', I_Name: r.item ?? '', PurS_Icode: r.itemCode ?? '', PurS_Challano: r.ch ?? '', PurS_Rmk: r.remark ?? '',
    ArchCode: r.broker ?? '', Purs_Weight: N(r.qty), LOT_NMBR: r.lot ?? '', Desc_Name1: r.grade ?? '', PurS_SqMt_Ft: N(r.pcs), PurS_Rate: N(r.rate), PurS_TaxableAmt: N(r.taxable),
    DueDate: r.due ?? '', NETAMT: N(r.nLines) === 1 ? N(r.net) : N(r.amount), TRASPORT_NAME: r.transporter ?? '', Vehicle_Name: r.vehicle ?? ''
  }));
};
