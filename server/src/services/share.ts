/**
 * The WhatsApp / email buttons on a bill, note, order, receipt or the outstanding report:
 * send that document (or that party's outstanding) to the party now. Messages go into the same log as the automatic ones
 * and are sent the same way (official WhatsApp API, or the office-PC sender; the company mail server for email).
 */
import { sql } from 'drizzle-orm';
import type { Ctx } from './context.js';
import { badRequest } from '../lib/errors.js';
import { buildMessages, waNumber, type Msg } from './whatsapp.js';
import { sendMode, toCloud } from './waCloud.js';
import { emailsOf, queueDocumentEmail } from './email.js';

type Row = Record<string, unknown>;
const S = (v: unknown) => String(v ?? '');
const dmy = (v: unknown) => (v ? S(v).slice(0, 10).split('-').reverse().join('-') : '');
const today = () => dmy(new Date(Date.now() + 330 * 60000).toISOString());

async function insertWa(ctx: Ctx, msgs: Msg[]) {
  const list: (Omit<Msg, 'msgType'> & { msgType: string; meta?: unknown })[] = (await sendMode(ctx)) === 'cloud' ? toCloud(msgs) : msgs;
  for (const m of list)
    await ctx.db.execute(sql`insert into whatsapp_messages (company_id, form_type, msg_type, voucher_id, bill_no, mobile, body, caption, attachment, status, user_id, is_manual, meta)
      values (${ctx.companyId}, ${m.formType}, ${m.msgType}, ${m.voucherId}, ${m.billNo}, ${m.mobile}, ${m.body ?? null}, ${m.caption ?? null}, ${m.attachment ?? null},
        ${m.mobile ? 'PENDING' : 'NO MOBILE'}, ${ctx.userId}, true, ${m.meta ? JSON.stringify(m.meta) : null}::jsonb)`);
  return list;
}

/** WhatsApp button on a document */
export async function whatsappDoc(ctx: Ctx, voucherId: number) {
  const msgs = await buildMessages(ctx, voucherId);
  if (!msgs.length) throw badRequest('There is no WhatsApp message for this kind of document');
  if (!msgs.some((m) => m.mobile)) throw badRequest('No WhatsApp number on this party — add the mobile in the party master');
  const sent = await insertWa(ctx, msgs);
  return { ok: true, to: [...new Set(sent.map((m) => m.mobile).filter(Boolean))].map((x) => '+' + x).join(', '), count: sent.length };
}

/** Email button on a document */
export async function emailDoc(ctx: Ctx, voucherId: number, to?: string) {
  const h = (await ctx.db.execute<Row>(sql`select v.type, v.number, v.date, p.name as party, p.email from vouchers v left join accounts p on p.id = v.party_id where v.id = ${voucherId}`)).rows[0];
  if (!h) throw badRequest('Document not found');
  if (['SALE_BILL', 'SALE_RETURN', 'DEBIT_NOTE', 'CREDIT_NOTE'].includes(S(h.type))) return queueDocumentEmail(ctx, voucherId, { to });
  // sale order, receipt, payment: the message text, as in the WhatsApp message
  const addr = emailsOf(to || h.email);
  if (!addr) throw badRequest('No email address on this party — add it in the party master');
  const text = (await buildMessages(ctx, voucherId)).find((m) => m.msgType === 'TEXT');
  if (!text?.body) throw badRequest('There is no email for this kind of document');
  const name = ({ SALES_ORDER: 'Sale Order', RECEIPT: 'Receipt', PAYMENT: 'Payment' } as Record<string, string>)[S(h.type)] ?? 'Document';
  await ctx.db.execute(sql`insert into email_messages (company_id, form_type, voucher_id, bill_no, to_email, subject, body, attachments, status, user_id)
    values (${ctx.companyId}, ${text.formType}, ${voucherId}, ${S(h.number)}, ${addr}, ${`${name} - ${h.number} - ${h.party} - ${dmy(h.date)}`}, ${text.body}, '[]'::jsonb, 'PENDING', ${ctx.userId})`);
  return { ok: true, to: addr };
}

/** WhatsApp / email button on the outstanding report: each chosen party (or party group) gets its own outstanding PDF */
export async function shareOutstanding(ctx: Ctx, b: { qs?: string; channel?: string }) {
  const p = new URLSearchParams(S(b.qs));
  const ids = (k: string) => S(p.get(k)).split(',').map(Number).filter((n) => n > 0);
  const parties = ids('parties'), groups = ids('partyGroups');
  if (!parties.length && !groups.length) throw badRequest('Choose the party or party group first, then send');
  const targets: { key: string; id: number; name: string; mobile: unknown; email: unknown }[] = [];
  if (groups.length) for (const r of (await ctx.db.execute<Row>(sql`select id, name, phone, email from persons where id in ${sql.raw('(' + groups.join(',') + ')')}`)).rows)
    targets.push({ key: 'partyGroups', id: Number(r.id), name: S(r.name), mobile: r.phone, email: r.email });
  if (parties.length) for (const r of (await ctx.db.execute<Row>(sql`select id, name, coalesce(nullif(extra->>'P_OMobile', ''), mobile) as mobile, email from accounts where id in ${sql.raw('(' + parties.join(',') + ')')}`)).rows)
    targets.push({ key: 'parties', id: Number(r.id), name: S(r.name), mobile: r.mobile, email: r.email });
  const base = new URLSearchParams(p); base.delete('parties'); base.delete('partyGroups');
  const done: string[] = [], missing: string[] = [];
  for (const t of targets) {
    const q = new URLSearchParams(base); q.set(t.key, String(t.id));
    const link = '/print/outstanding?' + q.toString();
    const caption = `Party Wise Outstanding - ${t.name} - ${today()}`;
    if (b.channel === 'email') {
      const addr = emailsOf(t.email);
      if (!addr) { missing.push(t.name); continue; }
      await ctx.db.execute(sql`insert into email_messages (company_id, form_type, bill_no, to_email, subject, body, attachments, status, user_id)
        values (${ctx.companyId}, 'OUTSTANDING', ${t.name.slice(0, 60)}, ${addr}, ${caption}, ${'Please find attached your outstanding statement.'},
          ${JSON.stringify([{ link, filename: caption.replace(/[\\/:*?"<>|]+/g, '_') + '.pdf' }])}::jsonb, 'PENDING', ${ctx.userId})`);
      done.push(t.name + ' (' + addr + ')');
    } else {
      const mobile = waNumber(t.mobile);
      if (!mobile) { missing.push(t.name); continue; }
      const co = (await ctx.db.execute<Row>(sql`select coalesce(legal_name, name) as n from companies where id = ${ctx.companyId}`)).rows[0];
      await insertWa(ctx, [{ formType: 'OUTSTANDING', msgType: 'PDF', voucherId: null as never, billNo: t.name.slice(0, 60), mobile, caption, attachment: link, data: { head: { P_LegName: co?.n, CompanyName: co?.n }, items: [] } }]);
      done.push(t.name + ' (+' + mobile + ')');
    }
  }
  if (!done.length) throw badRequest(`No ${b.channel === 'email' ? 'email address' : 'WhatsApp number'} for ${missing.join(', ')}`);
  return { ok: true, sent: done, missing };
}
