/**
 * Email, as the old software sent it (EmailLogMst): with each saved sale bill / return, sale order and debit / credit note,
 * one email to the party's email address — subject "Bill - no - party - date" / "Sale Order - …" / "Vch.No. - …",
 * the same text as the WhatsApp message, and the document PDF attached. Sent by the YarnFlow server through the
 * company's mail server (Gmail: smtp.gmail.com, 587, with an app password).
 * A document can also be emailed by hand ("Please find attached copy", the old HTML email).
 */
import { sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import type { Ctx } from './context.js';
import { requireRole } from './context.js';
import { badRequest } from '../lib/errors.js';
import { buildMessages } from './whatsapp.js';

type Row = Record<string, unknown>;
type DB = Ctx['db'];
const S = (v: unknown) => String(v ?? '');
const SCOPE = (mc: number) => sql`company_id in (select id from companies where id = ${mc} or master_company_id = ${mc})`;
const dmy = (v: unknown) => (v ? S(v).slice(0, 10).split('-').reverse().join('-') : '');
const SUBJECT: Record<string, string> = { SAL: 'Bill', SALRTN: 'Bill', SalOrder: 'Sale Order', DBNT: 'Vch.No.', CRNT: 'Vch.No.' };
const DOC_NAME: Record<string, string> = { SALE_BILL: 'Sale Bill', SALE_RETURN: 'Sale Return Bill', DEBIT_NOTE: 'Debit Note Voucher', CREDIT_NOTE: 'Credit Note Voucher', SALES_ORDER: 'Sale Order' };
const SLUG: Record<string, string> = { SALE_BILL: 'sale-bills', SALE_RETURN: 'sale-returns', DEBIT_NOTE: 'debit-notes', CREDIT_NOTE: 'credit-notes', SALES_ORDER: 'sales-orders' };
/** first valid address(es) of a party's email field */
export const emailsOf = (v: unknown) => S(v).split(/[,;\s]+/).map((x) => x.trim()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).join(', ');

async function settingsRow(db: DB, mc: number) {
  return (await db.execute<Row>(sql`select * from email_settings where company_id = ${mc}`)).rows[0];
}
const fileName = (t: string) => t.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120) + '.pdf';

async function party(ctx: Ctx, voucherId: number) {
  return (await ctx.db.execute<Row>(sql`select v.type, v.number, v.date, p.name as party, p.email, c.name as "companyName", coalesce(c.legal_name, c.name) as "legalName"
    from vouchers v left join accounts p on p.id = v.party_id left join companies c on c.id = v.company_id where v.id = ${voucherId}`)).rows[0];
}

/** queue the automatic email of a saved document (once); never stops the save */
export async function enqueueEmailFor(ctx: Ctx, voucherId: number) {
  try {
    const st = await settingsRow(ctx.db, ctx.mcId);
    if (!st || st.mode !== 'auto') return;
    const forms = (st.forms as string[] | null) ?? [];
    const done = await ctx.db.execute(sql`select 1 from email_messages where voucher_id = ${voucherId} and not legacy limit 1`);
    if (done.rows.length) return;
    const msgs = await buildMessages(ctx, voucherId);
    const form = msgs[0]?.formType;
    if (!form || !SUBJECT[form] || !forms.includes(form)) return;
    const h = await party(ctx, voucherId);
    if (!h) return;
    const text = msgs.find((m) => m.msgType === 'TEXT');
    const pdfs = msgs.filter((m) => m.msgType === 'PDF' && m.attachment?.startsWith('/print/' + (SLUG[S(h.type)] ?? '-')));
    const subject = `${SUBJECT[form]} - ${h.number} - ${h.party} - ${dmy(h.date)}`;
    const to = emailsOf(h.email);
    await ctx.db.execute(sql`insert into email_messages (company_id, form_type, voucher_id, bill_no, to_email, subject, body, attachments, status, user_id)
      values (${ctx.companyId}, ${form}, ${voucherId}, ${S(h.number)}, ${to || null}, ${subject}, ${text?.body ?? ''},
        ${JSON.stringify(pdfs.map((p) => ({ link: p.attachment, filename: fileName(p.caption || subject) })))}::jsonb, ${to ? 'PENDING' : 'NO EMAIL'}, ${ctx.userId})`);
  } catch {
    /* an email problem never blocks saving the document */
  }
}

/** the old hand-sent email: "Hello All, This is Auto generated email … Please find attached copy" with the PDF */
export async function queueDocumentEmail(ctx: Ctx, voucherId: number, b: { to?: string }) {
  const h = await party(ctx, voucherId);
  if (!h || !DOC_NAME[S(h.type)]) throw badRequest('This document cannot be emailed');
  const to = emailsOf(b.to || h.email);
  if (!to) throw badRequest('No email address on the party — type one in');
  const u = (await ctx.db.execute<Row>(sql`select name from users where id = ${ctx.userId}`)).rows[0];
  const name = DOC_NAME[S(h.type)];
  const subject = `${name} - ${h.number} - ${h.party} - ${dmy(h.date)}`;
  const t = new Date(Date.now() + 330 * 60000);
  const hm = `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
  const esc = (x: unknown) => S(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
  const html = `<!DOCTYPE html><html><body style="margin:30px;background:#E9E9E9;font-family:Arial,sans-serif">
<div style="max-width:560px;background:#fff;border:1px solid #BFBFBF;padding:20px;box-shadow:10px 10px 5px #aaa">
<p>Hello All,</p><p>This is Auto generated email.</p>
<table style="border-collapse:collapse;margin:10px 0"><tr><th style="text-align:left;padding:4px 12px 4px 0">Document</th><th style="text-align:left;padding:4px 0">Document No</th></tr>
<tr><td style="padding:4px 12px 4px 0">${esc(name)}</td><td style="padding:4px 0">${esc(h.number)}</td></tr></table>
<p style="color:#8f9296;font-size:13px">Send By : ${esc(S(u?.name).toUpperCase())} On ${hm}</p>
<p>Please find attached copy. Please let me know if you have any concern</p>
<p>With Regards,<br>Account Department,<br>${esc(h.legalName)}</p></div></body></html>`;
  const r = await ctx.db.execute<Row>(sql`insert into email_messages (company_id, form_type, voucher_id, bill_no, to_email, subject, body, is_html, attachments, status, user_id)
    values (${ctx.companyId}, ${S(h.type)}, ${voucherId}, ${S(h.number)}, ${to}, ${subject}, ${html}, true,
      ${JSON.stringify([{ link: `/print/${SLUG[S(h.type)]}/${voucherId}`, filename: fileName(subject) }])}::jsonb, 'PENDING', ${ctx.userId}) returning id`);
  return { ok: true, id: r.rows[0].id, to };
}

export async function listEmails(ctx: Ctx, q: { status?: string; form?: string; from?: string; to?: string; q?: string; legacy?: string }) {
  const like = q.q ? '%' + q.q + '%' : null;
  const r = await ctx.db.execute<Row>(sql`
    select m.id, m.form_type as "formType", m.voucher_id as "voucherId", m.bill_no as "billNo", m.to_email as "to", m.subject, m.body, m.is_html as "isHtml", m.attachments,
      m.status, m.error, m.sent_at as "sentAt", m.created_at as "createdAt", m.legacy, u.name as "user"
    from email_messages m left join users u on u.id = m.user_id
    where ${SCOPE(ctx.mcId)} and m.legacy = ${q.legacy === '1'}
      ${q.status ? sql`and m.status = ${q.status}` : sql``} ${q.form ? sql`and m.form_type = ${q.form}` : sql``}
      ${q.from ? sql`and m.created_at >= ${q.from}::date` : sql``} ${q.to ? sql`and m.created_at < ${q.to}::date + 1` : sql``}
      ${like ? sql`and (m.bill_no ilike ${like} or m.to_email ilike ${like} or m.subject ilike ${like})` : sql``}
    order by m.created_at desc, m.id desc limit 500`);
  const counts = await ctx.db.execute<Row>(sql`select status, count(*) as n from email_messages where not legacy and ${SCOPE(ctx.mcId)} group by 1`);
  const st = await settingsRow(ctx.db, ctx.mcId);
  const today = await ctx.db.execute<Row>(sql`select count(*) as n from email_messages where status = 'SENT' and not legacy and sent_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata' and ${SCOPE(ctx.mcId)}`);
  return { rows: r.rows, counts: Object.fromEntries(counts.rows.map((x) => [x.status, Number(x.n)])), mode: st?.mode ?? 'off', sentToday: Number(today.rows[0]?.n ?? 0), dailyLimit: Number(st?.daily_limit ?? 450), pausedUntil: st?.paused_until ?? null };
}
export async function setStatus(ctx: Ctx, id: number, status: 'PENDING' | 'SKIPPED') {
  await ctx.db.execute(sql`update email_messages set status = ${status}, tries = 0, error = null where id = ${id} and not legacy and (${status} = 'SKIPPED' or to_email is not null) and ${SCOPE(ctx.mcId)}`);
  return { ok: true };
}

export async function getSettings(ctx: Ctx) {
  const r = (await settingsRow(ctx.db, ctx.mcId)) ?? {};
  return { mode: r.mode ?? 'off', host: r.host ?? 'smtp.gmail.com', port: r.port ?? 587, secure: !!r.secure, username: r.username ?? '', password: r.password ? '••••••••' : '',
    fromName: r.from_name ?? '', forms: r.forms ?? ['SAL', 'SALRTN', 'SalOrder', 'DBNT', 'CRNT'], dailyLimit: r.daily_limit ?? 450 };
}
export async function saveSettings(ctx: Ctx, b: Row) {
  requireRole(ctx, ['ADMIN'], 'change email settings');
  const pw = typeof b.password === 'string' && b.password && !b.password.startsWith('••') ? b.password.replace(/\s+/g, '') : null;
  const forms = Array.isArray(b.forms) ? b.forms.map(S).filter((f) => SUBJECT[f]) : ['SAL', 'SALRTN', 'SalOrder', 'DBNT', 'CRNT'];
  await ctx.db.execute(sql`insert into email_settings (company_id, mode, host, port, secure, username, password, from_name, forms, daily_limit, updated_at)
    values (${ctx.mcId}, ${b.mode === 'auto' ? 'auto' : 'off'}, ${S(b.host).trim() || 'smtp.gmail.com'}, ${Number(b.port) || 587}, ${!!b.secure}, ${S(b.username).trim()}, ${pw}, ${S(b.fromName).trim() || null},
      ${JSON.stringify(forms)}::jsonb, ${Number(b.dailyLimit) || 450}, now())
    on conflict (company_id) do update set mode = excluded.mode, host = excluded.host, port = excluded.port, secure = excluded.secure, username = excluded.username,
      password = coalesce(excluded.password, email_settings.password), from_name = excluded.from_name, forms = excluded.forms, daily_limit = excluded.daily_limit, paused_until = null, updated_at = now()`);
  return getSettings(ctx);
}

function transport(st: Row) {
  return nodemailer.createTransport({ host: S(st.host), port: Number(st.port), secure: !!st.secure, auth: { user: S(st.username), pass: S(st.password) }, connectionTimeout: 20000 });
}
export async function testEmail(ctx: Ctx, to: string) {
  const st = await settingsRow(ctx.db, ctx.mcId);
  if (!st?.password || !st.username) throw badRequest('Fill in the email address and app password, then Save');
  const addr = emailsOf(to) || S(st.username);
  try {
    await transport(st).sendMail({ from: { name: S(st.from_name || st.username), address: S(st.username) }, to: addr, subject: 'YarnFlow test email', text: 'Email from YarnFlow is working.' });
  } catch (e) { throw badRequest('Mail server: ' + (e as Error).message); }
  return { ok: true, to: addr };
}

/* ------------------------------------------------------------------ background sender */
type PdfMaker = (link: string, companyId: number) => Promise<Buffer>;
let busy = false;
export function startEmailSender(db: DB, makePdf: PdfMaker, log: (m: string) => void, everyMs = 10000) {
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const cos = (await db.execute<Row>(sql`select * from email_settings where mode = 'auto' and password is not null and coalesce(username, '') <> '' and (paused_until is null or paused_until < now())`)).rows;
      for (const st of cos) {
        const mc = Number(st.company_id);
        await db.execute(sql`update email_messages set status = 'PENDING' where status = 'SENDING' and picked_at < now() - interval '10 minutes' and ${SCOPE(mc)}`);
        const sent = Number((await db.execute<Row>(sql`select count(*) as n from email_messages where status = 'SENT' and not legacy and sent_at > now() - interval '24 hours' and ${SCOPE(mc)}`)).rows[0].n);
        const room = Number(st.daily_limit || 450) - sent;
        if (room <= 0) { await db.execute(sql`update email_settings set paused_until = now() + interval '1 hour' where company_id = ${mc}`); continue; }
        const list = (await db.execute<Row>(sql`
          update email_messages m set status = 'SENDING', picked_at = now(), tries = m.tries + 1
          where m.id in (select id from email_messages where status = 'PENDING' and not legacy and to_email is not null and ${SCOPE(mc)} order by id limit ${Math.min(5, room)} for update skip locked)
          returning m.id, m.to_email, m.subject, m.body, m.is_html, m.attachments, m.company_id, m.bill_no`)).rows;
        if (!list.length) continue;
        const tr = transport(st);
        for (const m of list.sort((a, b) => Number(a.id) - Number(b.id))) {
          try {
            const att = (m.attachments as { link: string; filename: string }[] | null) ?? [];
            const files = [];
            for (const a of att) files.push({ filename: a.filename, content: await makePdf(a.link, Number(m.company_id)), contentType: 'application/pdf' });
            await tr.sendMail({ from: { name: S(st.from_name || st.username), address: S(st.username) }, to: S(m.to_email), subject: S(m.subject),
              ...(m.is_html ? { html: S(m.body) } : { text: S(m.body) || ' ' }), attachments: files });
            await db.execute(sql`update email_messages set status = 'SENT', sent_at = now(), error = null where id = ${Number(m.id)}`);
          } catch (e) {
            const err = (e as Error).message.slice(0, 500);
            const limit = /5\.4\.5|limit exceeded|rate limit|too many/i.test(err);
            // a sending-limit error is not the message's fault: put it back and pause sending for an hour
            if (limit) {
              await db.execute(sql`update email_messages set status = 'PENDING', tries = greatest(tries - 1, 0), error = ${err} where id = ${Number(m.id)}`);
              await db.execute(sql`update email_settings set paused_until = now() + interval '1 hour' where company_id = ${mc}`);
              log('Email paused for an hour: ' + err);
              break;
            }
            await db.execute(sql`update email_messages set status = case when tries >= 3 then 'FAILED' else 'PENDING' end, error = ${err} where id = ${Number(m.id)}`);
            log(`Email ${S(m.bill_no)} → ${S(m.to_email)}: ${err}`);
          }
        }
        tr.close();
      }
    } catch (e) { log('Email sender: ' + (e as Error).message); }
    finally { busy = false; }
  };
  const t = setInterval(tick, everyMs);
  t.unref?.();
  return () => clearInterval(t);
}
