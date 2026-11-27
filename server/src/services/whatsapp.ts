/**
 * WhatsApp messages as the old software sent them: the old templates (SmsTemplate, kept in message_templates)
 * filled with {#Field#} values and a ---ITEMDETAIL--- block per item, queued when a document is saved
 * (sale bill / return: text + bill PDF; sale order: text + the party group's outstanding PDF; bank receipt /
 * payment: text; debit / credit note: PDF). The outbox is sent by a provider, or one click at a time.
 */
import { sql } from 'drizzle-orm';
import { notFound } from '../lib/errors.js';
import type { Ctx } from './context.js';
import { sendMode, toCloud } from './waCloud.js';

type Row = Record<string, unknown>;
const N = (v: unknown) => Number(v ?? 0) || 0;
const fx = (v: unknown, d: number) => N(v).toFixed(d);
const dmy = (v: unknown) => (v ? String(v).slice(0, 10).split('-').reverse().join('-') : '');
/** "20-11-2026 12:15:34 PM" as the old UCreatedt was written */
function stamp(v: unknown) {
  const d = v ? new Date(String(v)) : new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const ist = new Date(d.getTime() + 330 * 60000);
  const h = ist.getUTCHours();
  return `${p(ist.getUTCDate())}-${p(ist.getUTCMonth() + 1)}-${ist.getUTCFullYear()} ${p(h % 12 || 12)}:${p(ist.getUTCMinutes())}:${p(ist.getUTCSeconds())} ${h < 12 ? 'AM' : 'PM'}`;
}
/** first mobile number of a party, as 91XXXXXXXXXX */
export function waNumber(m: unknown) {
  const first = String(m ?? '').split(/[,/;\s]+/).map((x) => x.replace(/\D/g, '')).find((x) => x.length >= 10);
  if (!first) return null;
  const ten = first.slice(-10);
  return '91' + ten;
}

/** fill an old template: {#Field#} from the header, ---ITEMDETAIL--- … ---ITEMDETAIL--- once per item */
export function fillTemplate(body: string, head: Row, items: Row[] = [], style: 'bill' | 'order' = 'bill') {
  const put = (t: string, vals: Row) => t.replace(/\{#([A-Za-z_0-9]+)#\}/g, (_m, k: string) => String(vals[k] ?? vals[k.toUpperCase()] ?? ''));
  const parts = body.split('---ITEMDETAIL---');
  if (parts.length >= 3) {
    const [before, tpl, ...after] = parts;
    // each item as the old sender wrote it: the block without its first line break, then one blank line
    const block = style === 'order'
      ? items.map((it) => put(tpl.replace(/^\r?\n/, '').replace(/\r?\n$/, ''), { ...head, ...it })).join('\n\n')
      : items.map((it) => put(tpl.replace(/^\r?\n/, ''), { ...head, ...it }) + '\n').join('');
    return put(before, head) + block + put(after.join(''), head);
  }
  return put(body, head);
}

const FORM_OF: Record<string, string> = { SALE_BILL: 'SAL', SALE_RETURN: 'SALRTN', SALES_ORDER: 'SalOrder', RECEIPT: 'BANKREC', PAYMENT: 'BANKPAY', DEBIT_NOTE: 'DBNT', CREDIT_NOTE: 'CRNT' };
const SLUG_OF: Record<string, string> = { SALE_BILL: 'sale-bills', SALE_RETURN: 'sale-returns', DEBIT_NOTE: 'debit-notes', CREDIT_NOTE: 'credit-notes' };

async function template(ctx: Ctx, form: string) {
  const r = await ctx.db.execute<Row>(sql`select body, attach_pdf as "attachPdf", extra_reports as "extraReports", is_active as "isActive" from message_templates
    where company_id = ${ctx.mcId} and form_type = ${form}`);
  return r.rows[0] as { body: string; attachPdf: boolean; extraReports: { report: string; to: string }[] | null; isActive: boolean } | undefined;
}

/** party-group outstanding (bills + debit notes) and its oldest days, as the sale-order message shows them */
async function groupOutstanding(ctx: Ctx, groupId: number | null, partyId: number, asOf: string) {
  const r = await ctx.db.execute<Row>(sql`
    select coalesce(sum(v.net_amount - coalesce(s.settled, 0)), 0) as os, coalesce(max(${asOf}::date - v.date) filter (where v.net_amount - coalesce(s.settled, 0) > 0.005), 0) as days
    from vouchers v join accounts p on p.id = v.party_id
      left join lateral (select sum(a.amount) as settled from bill_allocations a where a.bill_id = v.id and a.ledger_period = ${ctx.period} and a.kind is distinct from 'PENDING' and (a.date is null or a.date <= ${asOf}::date)) s on true
    where v.type in ('SALE_BILL', 'GENERAL_SALE', 'DEBIT_NOTE', 'INTEREST_DEBIT_NOTE') and v.status <> 'CANCELLED' and v.net_amount > 0
      and v.date >= '2024-04-01' and v.date <= ${asOf}::date and ${groupId ? sql`p.party_group_id = ${groupId}` : sql`p.id = ${partyId}`}
      and v.net_amount - coalesce(s.settled, 0) > 0.005`);
  return { os: Math.round(N(r.rows[0]?.os)), days: N(r.rows[0]?.days) };
}

export interface Msg { formType: string; msgType: 'TEXT' | 'PDF'; voucherId: number; billNo: string; mobile: string | null; body?: string; caption?: string; attachment?: string; data?: { head: Row; items: Row[] } }

/** the messages the old sender would queue for a saved document */
export async function buildMessages(ctx: Ctx, voucherId: number): Promise<Msg[]> {
  const h = (await ctx.db.execute<Row>(sql`
    select v.*, p.name as party, coalesce(nullif(p.extra->>'P_OMobile', ''), p.mobile) as "partyMobile", p.gstin, p.address1, p.address2, p.city, p.contact_person as "contact", p.credit_days as "pCrDays",
      p.party_group_id as "groupId", p.extra as "pExtra", p.status as "pStatus", pg.name as "groupName", pg.phone as "groupPhone",
      dp.address1 as "dAddress1", dp.address2 as "dAddress2", dp.city as "dCity", br.name as broker, c.name as "companyName", coalesce(c.legal_name, c.name) as "legalName",
      bk.name as "bankName"
    from vouchers v left join accounts p on p.id = v.party_id left join persons pg on pg.id = p.party_group_id
      left join accounts dp on dp.id = coalesce(v.delivery_party_id, v.party_id) left join persons br on br.id = v.broker_id
      left join companies c on c.id = v.company_id left join accounts bk on bk.id = v.bank_account_id
    where v.id = ${voucherId}`)).rows[0];
  if (!h) throw notFound('Document');
  const form = FORM_OF[String(h.type)];
  if (!form) return [];
  if ((form === 'BANKREC' || form === 'BANKPAY') && !['BANKREC', 'BANKPAY'].includes(String(h.subtype))) return [];
  const t = await template(ctx, form);
  if (!t || !t.isActive) return [];
  const lines = (await ctx.db.execute<Row>(sql`select l.*, it.name as item from voucher_lines l left join items it on it.id = l.item_id where l.voucher_id = ${voucherId} order by l.line_no`)).rows;
  const to = waNumber(h.partyMobile);
  const out: Msg[] = [];
  const base = { formType: form, voucherId, billNo: String(h.number) };
  let head: Row = { UCreatedt: stamp(h.created_at), CompanyName: h.companyName, P_LegName: h.legalName, Billno: h.number, Sal_Date: dmy(h.date), P_Name: h.party, Sal_Crdays: N(h.credit_days ?? h.pCrDays) };
  let items: Row[] = [];

  if (form === 'SAL' || form === 'SALRTN') {
    items = lines.map((l) => ({ I_Name: l.item, SalS_SqMt_Ft: fx(l.pcs, 2), Cops: fx(l.cops, 2), SALS_WEIGHT: fx(l.qty, 3), SalS_Rate: fx(l.rate, 2), Sals_Amt: fx(l.amount, 2) }));
  } else if (form === 'SalOrder') {
    const ex = (h.pExtra ?? {}) as Row;
    const asOf = (await ctx.db.execute<Row>(sql`select (timezone('Asia/Kolkata', coalesce(${h.created_at ?? null}::timestamptz, now())))::date::text as d`)).rows[0].d as string;
    const g = await groupOutstanding(ctx, h.groupId ? Number(h.groupId) : null, Number(h.party_id), asOf);
    const pend = await ctx.db.execute<Row>(sql`
      select coalesce(sum(greatest(l.qty - coalesce((select sum(d.qty) from voucher_lines d where d.order_line_id = l.id), 0), 0)), 0) as q
      from vouchers v join voucher_lines l on l.voucher_id = v.id join accounts p on p.id = v.party_id
      where v.type = 'SALES_ORDER' and v.status in ('OPEN', 'PENDING_APPROVAL') and v.id <> ${voucherId} and v.created_at < ${String(h.created_at ?? new Date().toISOString())}::timestamptz
        and ${h.groupId ? sql`p.party_group_id = ${Number(h.groupId)}` : sql`p.id = ${Number(h.party_id)}`}
        and coalesce(l.extra->>'st24', case when l.line_status = 'CLOSED' then 'CLOSE' else 'PENDING' end) = 'PENDING'`);
    head = {
      ...head, PARTYGROUPNAME: h.groupName ?? h.party, P_GSTNo: h.gstin ?? '', P_Add: [h.address1, h.address2].filter(Boolean).join(', '),
      DelP_Add: [h.dAddress1, h.dAddress2].filter(Boolean).join(', '), P_ContPerName: h.contact ?? '', PartyMobileNo: String(h.partyMobile ?? ''),
      ISBLOCK: h.pStatus === 'BLOCKED' || ex.P_Block === '1' ? 'Block' : 'Not Block', Rmk: h.remark ?? '', BrokerName: h.broker ?? 'DIRECT', Staggering: ex.P_OffDay ?? '',
      PARTYGROUPOS: g.os, PARTYGROUPMAXOSDAYS: g.days, PARTYGROUPPENDINGQTY: Math.round(N(pend.rows[0]?.q) * 1000) / 1000
    };
    items = lines.map((l) => ({ Brand: l.brand ?? '', I_Name: l.item, LotNo: l.lot_no ?? '', Grade: l.grade ?? '', SalS_Qty: fx(l.qty, 3), SalS_Rate: fx(l.rate, 2) }));
  } else if (form === 'BANKREC' || form === 'BANKPAY') {
    // receipts list our bill numbers; payments list the supplier's own bill numbers (as the old message did)
    const bills = await ctx.db.execute<Row>(sql`select string_agg(${form === 'BANKPAY' ? sql`coalesce(nullif(b.ref_no, ''), b.number)` : sql`b.number`}, ',' order by ${form === 'BANKPAY' ? sql`coalesce(nullif(b.ref_no, ''), b.number)` : sql`b.date, b.number`}) as n from bill_allocations a join vouchers b on b.id = a.bill_id where a.voucher_id = ${voucherId}`);
    const mode = String((h.extra as Row | null)?.modeName ?? h.mode ?? '').toUpperCase();
    head = {
      ...head, RecS_BillNo: String(bills.rows[0]?.n ?? (h.extra as Row | null)?.billNo ?? ''), PCheckNo: h.instrument_no ?? '', Ch_Date: dmy(h.instrument_date ?? h.date),
      RecS_Amount: fx(Math.abs(N(h.amount ?? h.net_amount)), 2),
      ChequeMode: mode === 'CHEQUE' ? 'Payment Made Through Cheque, Please Collect Cheque From Office.' : 'Payment Made Through ' + mode
    };
  }
  if (t.body.trim()) out.push({ ...base, msgType: 'TEXT', mobile: to, body: fillTemplate(t.body, head, items, form === 'SalOrder' ? 'order' : 'bill').replace(/\r/g, '') });
  if (t.attachPdf && SLUG_OF[String(h.type)]) {
    const caption = form === 'SAL' || form === 'SALRTN' ? `Bill - ${h.number} - ${h.party} - ${dmy(h.date)}` : `Vch.No. - ${h.number} - ${h.party} - ${dmy(h.date)}`;
    out.push({ ...base, msgType: 'PDF', mobile: to, caption, attachment: `/print/${SLUG_OF[String(h.type)]}/${voucherId}` });
  }
  for (const x of t.extraReports ?? []) {
    if (x.report === 'Party Wise Outstanding') {
      const mobile = waNumber(x.to === 'Party Group' ? h.groupPhone ?? h.partyMobile : h.partyMobile);
      const filter = h.groupId ? `partyGroups=${h.groupId}` : `parties=${h.party_id}`;
      out.push({ ...base, msgType: 'PDF', mobile, caption: 'Party Wise Outstanding', attachment: `/print/outstanding?by=party&kind=all&${filter}` });
    }
  }
  for (const m of out) m.data = { head, items };
  return out;
}

/** queue a saved document's messages (once); never stops the save */
export async function enqueueFor(ctx: Ctx, voucherId: number) {
  try {
    await ctx.db.transaction(async (tx) => {
      const c = { ...ctx, db: tx } as Ctx;
      const done = await tx.execute<Row>(sql`select 1 from whatsapp_messages where voucher_id = ${voucherId} and not legacy limit 1`);
      if (done.rows.length) return;
      const raw = await buildMessages(c, voucherId);
      // official WhatsApp API: one approved-template message per person (text + PDF together); otherwise the old text / PDF pair
      const msgs: (Omit<Msg, 'msgType'> & { msgType: string; meta?: unknown })[] = (await sendMode(c)) === 'cloud' ? toCloud(raw) : raw;
      for (const m of msgs)
        await tx.execute(sql`insert into whatsapp_messages (company_id, form_type, msg_type, voucher_id, bill_no, mobile, body, caption, attachment, status, user_id, meta)
          values (${ctx.companyId}, ${m.formType}, ${m.msgType}, ${m.voucherId}, ${m.billNo}, ${m.mobile}, ${m.body ?? null}, ${m.caption ?? null}, ${m.attachment ?? null}, ${m.mobile ? 'PENDING' : 'NO MOBILE'}, ${ctx.userId}, ${m.meta ? JSON.stringify(m.meta) : null}::jsonb)`);
    });
  } catch {
    /* a message problem never blocks saving the document */
  }
}

export async function listMessages(ctx: Ctx, q: { status?: string; form?: string; from?: string; to?: string; q?: string; limit?: string; legacy?: string }) {
  const like = q.q ? '%' + q.q + '%' : null;
  const r = await ctx.db.execute<Row>(sql`
    select m.id, m.form_type as "formType", m.msg_type as "msgType", m.voucher_id as "voucherId", m.bill_no as "billNo", m.mobile, m.body, m.caption, m.attachment,
      m.status, m.error, m.sent_at as "sentAt", m.delivered_at as "deliveredAt", m.read_at as "readAt", m.created_at as "createdAt", m.legacy, u.name as "user", c.short_name as com
    from whatsapp_messages m left join users u on u.id = m.user_id left join companies c on c.id = m.company_id
    where m.company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId})
      and m.legacy = ${q.legacy === '1'} ${q.status === 'SENT' ? sql`and m.status in ('SENT', 'DELIVERED', 'READ')` : q.status ? sql`and m.status = ${q.status}` : sql``} ${q.form ? sql`and m.form_type = ${q.form}` : sql``}
      ${q.from ? sql`and m.created_at >= ${q.from}::date` : sql``} ${q.to ? sql`and m.created_at < ${q.to}::date + 1` : sql``}
      ${like ? sql`and (m.bill_no ilike ${like} or m.mobile ilike ${like} or m.body ilike ${like} or m.caption ilike ${like})` : sql``}
    order by m.created_at desc, m.id desc limit ${Math.min(Number(q.limit) || 500, 5000)}`);
  const counts = await ctx.db.execute<Row>(sql`select status, count(*) as n from whatsapp_messages where not legacy and company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId}) group by 1`);
  return { rows: r.rows, counts: Object.fromEntries(counts.rows.map((x) => [x.status, Number(x.n)])), sender: senderStatus() };
}

export async function markSent(ctx: Ctx, id: number, status = 'SENT') {
  await ctx.db.execute(sql`update whatsapp_messages set status = ${status}, sent_at = case when ${status} = 'SENT' then now() else sent_at end, is_manual = true
    where id = ${id} and company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId})`);
  return { ok: true };
}

export async function templates(ctx: Ctx) {
  return (await ctx.db.execute<Row>(sql`select id, form_type as "formType", body, attach_pdf as "attachPdf", extra_reports as "extraReports", is_active as "isActive"
    from message_templates where company_id = ${ctx.mcId} order by form_type`)).rows;
}
export async function saveTemplate(ctx: Ctx, body: { formType?: string; body?: string; attachPdf?: boolean; isActive?: boolean }) {
  if (!body.formType) return { ok: false };
  await ctx.db.execute(sql`insert into message_templates (company_id, form_type, body, attach_pdf, is_active) values (${ctx.mcId}, ${body.formType}, ${body.body ?? ''}, ${!!body.attachPdf}, ${body.isActive ?? true})
    on conflict (company_id, form_type) do update set body = excluded.body, attach_pdf = excluded.attach_pdf, is_active = excluded.is_active, updated_at = now()`);
  return { ok: true };
}

/* ---- automatic sender (the old "WhatsApp Sender" program): it picks up queued messages, sends them, reports back ---- */
const SCOPE = (ctx: Ctx) => sql`company_id in (select id from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId})`;

/** hand the next messages to the sender; a message picked but not reported in 10 minutes goes back in the queue */
export async function claim(ctx: Ctx, limit = 10) {
  await ctx.db.execute(sql`update whatsapp_messages set status = 'PENDING' where status = 'SENDING' and picked_at < now() - interval '10 minutes' and ${SCOPE(ctx)}`);
  const r = await ctx.db.execute<Row>(sql`
    update whatsapp_messages m set status = 'SENDING', picked_at = now(), tries = m.tries + 1
    where m.id in (select id from whatsapp_messages where status = 'PENDING' and not legacy and mobile is not null and msg_type in ('TEXT', 'PDF') and ${SCOPE(ctx)}
                   order by id limit ${Math.min(Math.max(limit, 1), 50)} for update skip locked)
    returning m.id, m.form_type as "formType", m.msg_type as "msgType", m.mobile, m.body, m.caption, m.attachment, m.bill_no as "billNo"`);
  return r.rows.sort((a, b) => Number(a.id) - Number(b.id));
}

/** the sender reports each message: sent, or failed with the reason (failed ones are retried up to 3 times) */
export async function report(ctx: Ctx, id: number, body: { ok?: boolean; error?: string }) {
  if (body.ok) await ctx.db.execute(sql`update whatsapp_messages set status = 'SENT', sent_at = now(), error = null where id = ${id} and ${SCOPE(ctx)}`);
  else await ctx.db.execute(sql`update whatsapp_messages set status = case when tries >= 3 then 'FAILED' else 'PENDING' end, error = ${String(body.error ?? 'failed').slice(0, 500)} where id = ${id} and ${SCOPE(ctx)}`);
  return { ok: true };
}

/** put a failed or skipped message back in the queue */
export async function retry(ctx: Ctx, id: number) {
  await ctx.db.execute(sql`update whatsapp_messages set status = 'PENDING', tries = 0, error = null where id = ${id} and not legacy and mobile is not null and ${SCOPE(ctx)}`);
  return { ok: true };
}

/** sender heartbeat, so the screen can show whether the sender is running */
let lastBeat: { at: string; info: string } | null = null;
export function beat(info: string) { lastBeat = { at: new Date().toISOString(), info: String(info ?? '').slice(0, 200) }; return { ok: true }; }
export function senderStatus() { return lastBeat; }
