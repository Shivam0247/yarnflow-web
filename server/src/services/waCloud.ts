/**
 * Official WhatsApp Business Platform (Cloud API, direct with Meta).
 * - The old texts become approved "utility" templates (Meta needs a fixed wording with {{n}} blanks; a blank
 *   cannot hold line breaks, so the item lines go on one line each separated by " | ", and the PDF carries the detail).
 * - A bill's text and its PDF go as ONE message (PDF as the message's document header) — half the messages of the old way.
 * - Sending runs inside the YarnFlow server every few seconds: render the print page to PDF, upload it to WhatsApp,
 *   send the template, keep the WhatsApp id; Meta's webhook then reports delivered / read / failed.
 */
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { sql } from 'drizzle-orm';
import { requireRole, type Ctx } from './context.js';
import { badRequest } from '../lib/errors.js';
import type { Msg } from './whatsapp.js';

type Row = Record<string, unknown>;
type DB = Ctx['db'];
const S = (v: unknown) => String(v ?? '');

/* ------------------------------------------------------------------ templates */
interface Tpl { name: string; label: string; doc: boolean; body: string; example: string[] }
const PHONE = 'Phone No. : 9925204432';
export const TEMPLATES: Tpl[] = [
  { name: 'yf_sale_bill', label: 'Sale bill (text + bill PDF)', doc: true,
    body: `Dt. & Tm. : {{1}}\nCompany Name : {{2}}\nInv.No.: {{3}}\nDt: {{4}}\nParty: {{5}}\nCr.Days: {{6}}\nItems: {{7}}\n\nBest Regards. {{8}}\n${PHONE}`,
    example: ['21-11-2026 05:04:03 PM', 'SHREE UMIYA YARN PVT.LTD', 'GU24260/26-27', '21-11-2026', 'DHARMAJIVAN FAB (4-5)', '0', '54/36 POY A+ (ASE) Box: 24.00 Cops: 0.00 Weight: 1003.410 Rt: 144.50 Amt: 144835.21', 'SHREE UMIYA YARN PVT.LTD'] },
  { name: 'yf_sale_return', label: 'Sale return (text + PDF)', doc: true,
    body: `Dt. & Tm. : {{1}}\nCompany Name : {{2}}\nSale Return No.: {{3}}\nDt: {{4}}\nParty: {{5}}\nCr.Days: {{6}}\nItems: {{7}}\n\nBest Regards. {{8}}\n${PHONE}`,
    example: ['21-11-2026 05:04:03 PM', 'SHREE UMIYA YARN PVT.LTD', 'SR104/26-27', '21-11-2026', 'DHARMAJIVAN FAB (4-5)', '0', '54/36 POY A+ (ASE) Box: 2.00 Cops: 0.00 Weight: 80.100 Rt: 144.50 Amt: 11574.45', 'SHREE UMIYA YARN PVT.LTD'] },
  { name: 'yf_sale_order', label: 'Sale order', doc: false,
    body: '*Order Date :-* {{1}}\n*Order No:-* {{2}}\n*Party Group :-* {{3}}\n*Party Name :-* {{4}}\n*GST NO:-* {{5}}\n*Party Address:-* {{6}}\n*Dellevry adress:-* {{7}}\n*Party Owner Name:-* {{8}}\n*party Mo.No:-* {{9}}\n*Credit Day:-* {{10}}\n*Code:-* {{11}}\n*Remark:-* {{12}}\n*Broker:-* {{13}}\n*Staggering:-* {{14}}\n\n*Party group oustandig(Total Outstanding + Debit note Amount):-* {{15}}\n*Maximum outstanding days:-* {{16}}\n*Party Group Pending QtY:-* {{17}}\n\n*Items:-* {{18}}\n\nLate payment charge 18 %\nAny Complaint Whatsup On  -8511138026,9265714718, 6352736622, 9624041700\n*We would like to apologize in advance for the inconvenience.*',
    example: ['21-11-2026', 'SAL12845/26-27', 'SHIV LAXMI TEXTILES (349-350)', 'SHIV LAXMI TEXTILES', '24AAAAA0000A1Z5', 'PLOT NO 1, SACHIN GIDC', 'PLOT NO 1, SACHIN GIDC', 'VIJAY BHAI', '9825138741', '30', 'Not Block', 'URGENT', 'DIRECT', 'SUNDAY', '1096358', '34', '1955.99', 'Brand: WELLKNOWN Denier: 150 WELLFEEL Lot: 12 Grade: AA Qty: 500.000 Rate: 145.00' ] },
  { name: 'yf_bank_receipt', label: 'Bank receipt', doc: false,
    body: `Dt. & Tm. : {{1}}\nCompany Name : {{2}}\nMsg :Thank you for your payment\nAc: {{3}}\nInv.: {{4}}\nChq: {{5}}\nDt: {{6}}\nAmt: {{7}}\n\nBest Regards. {{8}}\n${PHONE}`,
    example: ['23-11-2026 12:49:33 PM', 'SHREE UMIYA YARN PVT.LTD', 'SHREE NAVDURGA TEXTILES(I-52)', 'DBT3248/26-27,DBT3419/26-27', '000123', '21-11-2026', '20265.00', 'SHREE UMIYA YARN PVT.LTD'] },
  { name: 'yf_bank_payment', label: 'Bank payment', doc: false,
    body: `Dt. & Tm. : {{1}}\nCompany Name : {{2}}\nMsg : {{3}}\nAc: {{4}}\nInv.: {{5}}\nChq: {{6}}\nDt: {{7}} Amt: {{8}}\n\nBest Regards. {{9}}\n${PHONE}`,
    example: ['23-11-2026 12:49:33 PM', 'SHREE UMIYA YARN PVT.LTD', 'Payment Made Through RTGS', 'RELIANCE INDUSTRIES LTD', '2690070904,2690070905', '000456', '21-11-2026', '450000.00', 'SHREE UMIYA YARN PVT.LTD'] },
  { name: 'yf_document', label: 'Document PDF (debit / credit note, party outstanding)', doc: true,
    body: `Document: {{1}}\n\nBest Regards. {{2}}\n${PHONE}`,
    example: ['Vch.No. - 3688 - OMKAR FILAMENTS(DEALER) - 16-11-2026', 'SHREE UMIYA YARN PVT.LTD'] }
];
const TPL = Object.fromEntries(TEMPLATES.map((t) => [t.name, t]));

/** a template blank: one line, no tabs, no 4+ spaces, never empty (Meta rejects those) */
const blank = (v: unknown, max = 900) => {
  let t = S(v).replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
  if (t.length > max) t = t.slice(0, max - 1) + '…';
  return t || '-';
};
const lineOf = (it: Row, keys: [string, string][]) => keys.map(([k, l]) => (l ? l + ': ' : '') + S(it[k]).trim()).join(' ');
function paramsOf(name: string, h: Row, items: Row[]): string[] {
  const join = (keys: [string, string][]) => {
    const all = items.map((it) => lineOf(it, keys));
    let out = all.join(' | ');
    if (out.length > 900) { let n = 0, s = ''; for (const x of all) { if ((s + ' | ' + x).length > 820) break; s = s ? s + ' | ' + x : x; n++; } out = s + ` | … ${all.length - n} more, see PDF`; }
    return out;
  };
  const billItems: [string, string][] = [['I_Name', ''], ['SalS_SqMt_Ft', 'Box'], ['Cops', 'Cops'], ['SALS_WEIGHT', 'Weight'], ['SalS_Rate', 'Rt'], ['Sals_Amt', 'Amt']];
  switch (name) {
    case 'yf_sale_bill': case 'yf_sale_return':
      return [h.UCreatedt, h.P_LegName, h.Billno, h.Sal_Date, h.P_Name, h.Sal_Crdays, join(billItems), h.P_LegName].map((x) => blank(x));
    case 'yf_sale_order':
      return [h.Sal_Date, h.Billno, h.PARTYGROUPNAME, h.P_Name, h.P_GSTNo, h.P_Add, h.DelP_Add, h.P_ContPerName, h.PartyMobileNo, h.Sal_Crdays, h.ISBLOCK, h.Rmk, h.BrokerName, h.Staggering,
        h.PARTYGROUPOS, h.PARTYGROUPMAXOSDAYS, h.PARTYGROUPPENDINGQTY, join([['Brand', 'Brand'], ['I_Name', 'Denier'], ['LotNo', 'Lot'], ['Grade', 'Grade'], ['SalS_Qty', 'Qty'], ['SalS_Rate', 'Rate']])].map((x) => blank(x));
    case 'yf_bank_receipt':
      return [h.UCreatedt, h.CompanyName, h.P_Name, h.RecS_BillNo, h.PCheckNo, h.Ch_Date, h.RecS_Amount, h.CompanyName].map((x) => blank(x));
    case 'yf_bank_payment':
      return [h.UCreatedt, h.CompanyName, h.ChequeMode, h.P_Name, h.RecS_BillNo, h.PCheckNo, h.Ch_Date, h.RecS_Amount, h.CompanyName].map((x) => blank(x));
    default:
      return [];
  }
}
/** what the person will read, for the outbox screen */
export function preview(name: string, params: string[]) {
  return S(TPL[name]?.body).replace(/\{\{(\d+)\}\}/g, (_m, n) => params[Number(n) - 1] ?? '');
}

/** the old text / PDF pair → one template message per person */
export function toCloud(msgs: Msg[]) {
  const out: (Omit<Msg, 'msgType'> & { msgType: string; meta: { template: string; params: string[]; filename?: string } })[] = [];
  const used = new Set<Msg>();
  for (const m of msgs) {
    if (used.has(m)) continue;
    const h = m.data?.head ?? {}, items = m.data?.items ?? [];
    let name = '', pdf: Msg | undefined;
    if (m.msgType === 'TEXT') {
      name = { SAL: 'yf_sale_bill', SALRTN: 'yf_sale_return', SalOrder: 'yf_sale_order', BANKREC: 'yf_bank_receipt', BANKPAY: 'yf_bank_payment' }[m.formType] ?? '';
      if (TPL[name]?.doc) pdf = msgs.find((x) => x.msgType === 'PDF' && x.mobile === m.mobile && x.attachment?.startsWith('/print/' + (m.formType === 'SAL' ? 'sale-bills' : 'sale-returns')));
      if (TPL[name]?.doc && !pdf) pdf = { ...m, msgType: 'PDF', caption: `Bill - ${h.Billno} - ${h.P_Name} - ${h.Sal_Date}`, attachment: `/print/${m.formType === 'SAL' ? 'sale-bills' : 'sale-returns'}/${m.voucherId}` };
    }
    if (!name) { name = 'yf_document'; pdf = m; }
    if (pdf) used.add(pdf);
    used.add(m);
    const params = name === 'yf_document' ? [blank(pdf?.caption), blank(h.P_LegName ?? h.CompanyName)] : paramsOf(name, h, items);
    const filename = pdf ? S(pdf.caption || m.billNo).replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120) + '.pdf' : undefined;
    out.push({ formType: m.formType, msgType: 'TEMPLATE', voucherId: m.voucherId, billNo: m.billNo, mobile: m.mobile, body: preview(name, params), caption: pdf?.caption, attachment: pdf?.attachment, meta: { template: name, params, filename } });
  }
  return out;
}

/* ------------------------------------------------------------------ settings */
export async function sendMode(ctx: Ctx) {
  const r = await ctx.db.execute<Row>(sql`select mode from whatsapp_settings where company_id = ${ctx.mcId}`);
  return S(r.rows[0]?.mode || 'linked');
}
const mask = (t: unknown) => (t ? '••••' + S(t).slice(-4) : '');
export async function getSettings(ctx: Ctx) {
  const r = (await ctx.db.execute<Row>(sql`select * from whatsapp_settings where company_id = ${ctx.mcId}`)).rows[0] ?? {};
  return { mode: r.mode ?? 'linked', phoneNumberId: r.phone_number_id ?? '', wabaId: r.waba_id ?? '', appId: r.app_id ?? '', accessToken: mask(r.access_token), appSecret: mask(r.app_secret),
    verifyToken: r.verify_token ?? '', apiVersion: r.api_version ?? 'v23.0', lang: r.lang ?? 'en', displayNumber: r.display_number ?? '', graphBase: r.graph_base ?? '',
    webhookUrl: '/api/whatsapp/webhook' };
}
export async function saveSettings(ctx: Ctx, b: Row) {
  requireRole(ctx, ['ADMIN'], 'change WhatsApp settings');
  const keep = (v: unknown) => (typeof v === 'string' && v.startsWith('••••') ? null : v === undefined ? null : S(v).trim());
  const mode = ['off', 'linked', 'cloud'].includes(S(b.mode)) ? S(b.mode) : 'linked';
  const verify = S(b.verifyToken).trim() || crypto.randomBytes(12).toString('hex');
  await ctx.db.execute(sql`insert into whatsapp_settings (company_id, mode, phone_number_id, waba_id, app_id, access_token, app_secret, verify_token, api_version, lang, graph_base, updated_at)
    values (${ctx.mcId}, ${mode}, ${S(b.phoneNumberId).trim()}, ${S(b.wabaId).trim()}, ${S(b.appId).trim()}, ${keep(b.accessToken)}, ${keep(b.appSecret)}, ${verify}, ${S(b.apiVersion || 'v23.0')}, ${S(b.lang || 'en')}, ${S(b.graphBase).trim() || null}, now())
    on conflict (company_id) do update set mode = excluded.mode, phone_number_id = excluded.phone_number_id, waba_id = excluded.waba_id, app_id = excluded.app_id,
      access_token = coalesce(excluded.access_token, whatsapp_settings.access_token), app_secret = coalesce(excluded.app_secret, whatsapp_settings.app_secret),
      verify_token = excluded.verify_token, api_version = excluded.api_version, lang = excluded.lang, graph_base = excluded.graph_base, updated_at = now()`);
  return getSettings(ctx);
}

/* ------------------------------------------------------------------ Graph API */
interface Conf { companyId: number; phoneNumberId: string; wabaId: string; appId: string; token: string; version: string; lang: string; base: string }
async function confOf(db: DB, companyId: number): Promise<Conf> {
  const r = (await db.execute<Row>(sql`select * from whatsapp_settings where company_id = ${companyId}`)).rows[0];
  if (!r?.access_token || !r.phone_number_id) throw badRequest('Fill in the WhatsApp phone number ID and access token first');
  return { companyId, phoneNumberId: S(r.phone_number_id), wabaId: S(r.waba_id), appId: S(r.app_id), token: S(r.access_token), version: S(r.api_version || 'v23.0'), lang: S(r.lang || 'en'), base: S(r.graph_base || 'https://graph.facebook.com') };
}
async function graph(c: Conf, method: string, path: string, body?: unknown, raw?: { data: Buffer | FormData; headers?: Record<string, string> }) {
  const url = `${c.base}/${c.version}/${path.replace(/^\//, '')}`;
  const init: RequestInit = { method, headers: { authorization: 'Bearer ' + c.token, ...(raw?.headers ?? {}), ...(body ? { 'content-type': 'application/json' } : {}) } };
  if (body) init.body = JSON.stringify(body);
  if (raw) init.body = raw.data as never;
  const r = await fetch(url, init);
  const j = (await r.json().catch(() => ({}))) as Row & { error?: { message?: string; error_user_msg?: string; code?: number } };
  if (!r.ok || j.error) throw new Error(j.error?.error_user_msg || j.error?.message || `WhatsApp API ${r.status}`);
  return j;
}

/** a tiny sample PDF Meta needs as the example of a document header */
function samplePdf() {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    '<< /Length 44 >>\nstream\nBT /F1 18 Tf 72 760 Td (Sample bill) Tj ET\nendstream', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf = '%PDF-1.4\n'; const off: number[] = [];
  objs.forEach((o, i) => { off.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(pdf);
}
/** Resumable Upload API → header_handle for the template example */
async function exampleHandle(c: Conf) {
  if (!c.appId) throw badRequest('Fill in the Meta App ID (needed once to send the sample PDF with the templates)');
  const pdf = samplePdf();
  const s = await graph(c, 'POST', `${c.appId}/uploads?file_name=sample.pdf&file_length=${pdf.length}&file_type=application/pdf`);
  const r = await fetch(`${c.base}/${c.version}/${S(s.id)}`, { method: 'POST', headers: { authorization: 'OAuth ' + c.token, file_offset: '0' }, body: pdf });
  const j = (await r.json()) as Row & { error?: { message?: string } };
  if (!r.ok || !j.h) throw new Error(j.error?.message || 'sample upload failed');
  return S(j.h);
}

/** send all YarnFlow templates to Meta for approval (already-submitted ones are skipped) */
export async function submitTemplates(ctx: Ctx) {
  const c = await confOf(ctx.db, ctx.mcId);
  if (!c.wabaId) throw badRequest('Fill in the WhatsApp Business Account ID first');
  const have = new Set((await templateStatus(ctx)).filter((t) => t.status !== 'NOT SUBMITTED').map((t) => t.name));
  let handle = '';
  const res: { name: string; result: string }[] = [];
  for (const t of TEMPLATES) {
    if (have.has(t.name)) { res.push({ name: t.name, result: 'already submitted' }); continue; }
    try {
      const components: Row[] = [];
      if (t.doc) { handle ||= await exampleHandle(c); components.push({ type: 'HEADER', format: 'DOCUMENT', example: { header_handle: [handle] } }); }
      components.push({ type: 'BODY', text: t.body, example: { body_text: [t.example] } });
      const r = await graph(c, 'POST', `${c.wabaId}/message_templates`, { name: t.name, language: c.lang, category: 'UTILITY', components });
      res.push({ name: t.name, result: S(r.status || 'PENDING') });
    } catch (e) { res.push({ name: t.name, result: 'error: ' + (e as Error).message }); }
  }
  return res;
}
export async function templateStatus(ctx: Ctx) {
  const c = await confOf(ctx.db, ctx.mcId);
  if (!c.wabaId) return TEMPLATES.map((t) => ({ name: t.name, label: t.label, status: 'NOT SUBMITTED', reason: '' }));
  const r = await graph(c, 'GET', `${c.wabaId}/message_templates?fields=name,status,language,category,rejected_reason&limit=200`);
  const list = (r.data as Row[]) ?? [];
  return TEMPLATES.map((t) => { const m = list.find((x) => x.name === t.name && S(x.language) === c.lang); return { name: t.name, label: t.label, status: S(m?.status || 'NOT SUBMITTED'), reason: S(m?.rejected_reason && m.rejected_reason !== 'NONE' ? m.rejected_reason : ''), category: S(m?.category) }; });
}
export const templateTexts = () => TEMPLATES.map((t) => ({ name: t.name, label: t.label, doc: t.doc, body: t.body, example: preview(t.name, t.example) }));

/** send one template message (and upload its PDF) — returns the WhatsApp message id */
async function sendTemplate(c: Conf, to: string, meta: { template: string; params: string[]; filename?: string }, pdf?: Buffer) {
  const components: Row[] = [];
  if (pdf) {
    const fd = new FormData();
    fd.append('messaging_product', 'whatsapp');
    fd.append('type', 'application/pdf');
    fd.append('file', new Blob([pdf], { type: 'application/pdf' }), meta.filename || 'document.pdf');
    const up = await graph(c, 'POST', `${c.phoneNumberId}/media`, undefined, { data: fd });
    components.push({ type: 'header', parameters: [{ type: 'document', document: { id: S(up.id), filename: meta.filename || 'document.pdf' } }] });
  }
  if (meta.params.length) components.push({ type: 'body', parameters: meta.params.map((text) => ({ type: 'text', text })) });
  const r = await graph(c, 'POST', `${c.phoneNumberId}/messages`, { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'template', template: { name: meta.template, language: { code: c.lang }, components } });
  return S((r.messages as Row[] | undefined)?.[0]?.id);
}

/** one test message to a number, from the setup screen */
export async function testSend(ctx: Ctx, to: string) {
  const c = await confOf(ctx.db, ctx.mcId);
  const num = S(to).replace(/\D/g, '');
  if (num.length < 10) throw badRequest('Enter a mobile number');
  const t = TPL.yf_bank_receipt;
  const id = await sendTemplate(c, num.length === 10 ? '91' + num : num, { template: t.name, params: t.example });
  return { ok: true, id };
}

/* ------------------------------------------------------------------ background sender */
type PdfMaker = (link: string, companyId: number) => Promise<Buffer>;
let running = false;
export function startCloudSender(db: DB, makePdf: PdfMaker, log: (m: string) => void, everyMs = 5000) {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const cos = (await db.execute<Row>(sql`select company_id from whatsapp_settings where mode = 'cloud' and access_token is not null and phone_number_id is not null`)).rows;
      for (const co of cos) {
        const mc = Number(co.company_id);
        const c = await confOf(db, mc).catch(() => null);
        if (!c) continue;
        await db.execute(sql`update whatsapp_messages set status = 'PENDING' where status = 'SENDING' and msg_type = 'TEMPLATE' and picked_at < now() - interval '10 minutes'`);
        const list = (await db.execute<Row>(sql`
          update whatsapp_messages m set status = 'SENDING', picked_at = now(), tries = m.tries + 1
          where m.id in (select id from whatsapp_messages where status = 'PENDING' and not legacy and msg_type = 'TEMPLATE' and mobile is not null
                           and company_id in (select id from companies where id = ${mc} or master_company_id = ${mc}) order by id limit 10 for update skip locked)
          returning m.id, m.mobile, m.attachment, m.meta, m.bill_no as "billNo", m.company_id as "companyId"`)).rows;
        for (const m of list.sort((a, b) => Number(a.id) - Number(b.id))) {
          try {
            const meta = m.meta as { template: string; params: string[]; filename?: string };
            const pdf = m.attachment ? await makePdf(S(m.attachment), Number(m.companyId)) : undefined;
            const wamid = await sendTemplate(c, S(m.mobile), meta, pdf);
            await db.execute(sql`update whatsapp_messages set status = 'SENT', sent_at = now(), error = null, wamid = ${wamid} where id = ${Number(m.id)}`);
          } catch (e) {
            const err = (e as Error).message.slice(0, 500);
            await db.execute(sql`update whatsapp_messages set status = case when tries >= 3 then 'FAILED' else 'PENDING' end, error = ${err} where id = ${Number(m.id)}`);
            log(`WhatsApp ${S(m.billNo)} → ${S(m.mobile)}: ${err}`);
          }
        }
      }
    } catch (e) { log('WhatsApp sender: ' + (e as Error).message); }
    finally { running = false; }
  };
  const t = setInterval(tick, everyMs);
  t.unref?.();
  return () => clearInterval(t);
}

/* ------------------------------------------------------------------ webhook (delivered / read / failed) */
export async function verifyWebhook(db: DB, q: Row) {
  if (q['hub.mode'] !== 'subscribe') return null;
  const r = await db.execute<Row>(sql`select 1 from whatsapp_settings where verify_token = ${S(q['hub.verify_token'])} and verify_token <> ''`);
  return r.rows.length ? S(q['hub.challenge']) : null;
}
export async function receiveWebhook(db: DB, raw: Buffer, signature: string | undefined) {
  const secrets = (await db.execute<Row>(sql`select app_secret from whatsapp_settings where app_secret is not null and app_secret <> ''`)).rows.map((r) => S(r.app_secret));
  if (secrets.length) {
    const ok = secrets.some((s) => { const want = 'sha256=' + crypto.createHmac('sha256', s).update(raw).digest('hex'); return !!signature && want.length === signature.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(signature)); });
    if (!ok) return { ok: false };
  }
  const body = JSON.parse(raw.toString('utf8') || '{}') as { entry?: { changes?: { value?: { statuses?: Row[] } }[] }[] };
  for (const e of body.entry ?? []) for (const ch of e.changes ?? []) for (const st of ch.value?.statuses ?? []) {
    const id = S(st.id), at = new Date(Number(st.timestamp) * 1000 || Date.now()).toISOString();
    if (st.status === 'delivered') await db.execute(sql`update whatsapp_messages set delivered_at = coalesce(delivered_at, ${at}::timestamptz), status = case when status in ('SENT', 'SENDING') then 'DELIVERED' else status end where wamid = ${id}`);
    else if (st.status === 'read') await db.execute(sql`update whatsapp_messages set read_at = coalesce(read_at, ${at}::timestamptz), delivered_at = coalesce(delivered_at, ${at}::timestamptz), status = 'READ' where wamid = ${id}`);
    else if (st.status === 'failed') { const er = (st.errors as Row[] | undefined)?.[0]; await db.execute(sql`update whatsapp_messages set status = 'FAILED', error = ${S(er?.title || er?.message || 'failed') + (er?.code ? ' (' + S(er.code) + ')' : '')} where wamid = ${id}`); }
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ PDF of a print page */
let browserP: Promise<{ newPage: () => Promise<any> }> | null = null;
export function pdfMaker(webUrl: string, sessionFor: (companyId: number) => Promise<Row>): PdfMaker {
  return async (link, companyId) => {
    if (!browserP) {
      const req = createRequire(import.meta.url);
      let pw: { chromium: { launch: (o?: Row) => Promise<{ newPage: () => Promise<any> }> } };
      try { pw = req('playwright'); } catch { pw = req(S(process.env.PLAYWRIGHT_PATH) || 'playwright-core'); }
      browserP = pw.chromium.launch({ args: ['--no-sandbox'] });
      browserP.catch(() => { browserP = null; });
    }
    const page = await (await browserP).newPage();
    try {
      await page.goto(webUrl + '/login', { waitUntil: 'domcontentloaded' });
      await page.evaluate((s: Row) => localStorage.setItem('yf-session', JSON.stringify(s)), await sessionFor(companyId));
      await page.goto(webUrl + link, { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForTimeout(1000);
      return Buffer.from(await page.pdf({ printBackground: true, preferCSSPageSize: true }));
    } finally { await page.close().catch(() => {}); }
  };
}
