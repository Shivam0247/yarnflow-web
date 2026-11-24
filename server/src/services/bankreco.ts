/**
 * Bank reconciliation, as the old software's "Bank Reconsilation" screen: every entry in a bank account
 * for a period with its cheque, slip and clearing date; marking the date the bank cleared it gives the
 * balance as per the bank. The clearing date sits on the document (extra.clearedDate, dd-mm-yyyy) where the
 * old software kept it (RecSubMst.Clr_Dt); nothing in the books changes.
 */
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { unprocessable, notFound } from '../lib/errors.js';
import { r2 } from '../lib/money.js';
import type { Ctx } from './context.js';
import { requireRole } from './context.js';
import { audit, loadFy } from './documents.js';

const dmyToIso = (s: string | null | undefined) => {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(s ?? '').trim());
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
};
const isoToDmy = (s: string) => s.split('-').reverse().join('-');

export async function bankEntries(ctx: Ctx, q: { bankId?: string; from?: string; to?: string; show?: string }) {
  const bankId = Number(q.bankId);
  if (!bankId) throw unprocessable('Choose the bank');
  const fy = await loadFy(ctx);
  const from = q.from || fy.startDate, to = q.to || fy.endDate;
  const [bank] = (await ctx.db.execute<{ id: number; name: string }>(sql`select id, name from accounts where id = ${bankId}`)).rows;
  if (!bank) throw notFound('Bank');
  const per = Number(ctx.period);
  const rows = (await ctx.db.execute<Record<string, unknown>>(sql`
    select v.id, v.number, v.date, v.type, v.mode, v.instrument_no as "chequeNo", v.instrument_date as "chequeDate",
      coalesce(p.name, ca.name) as party, coalesce(v.narration, v.remark, e.narration) as remark, v.extra->>'partyBank' as "partyBank",
      v.extra->>'slipNo' as "slipNo", v.extra->>'clearedDate' as "clearedDate", bk.name as book,
      sum(e.debit) as deposit, sum(e.credit) as withdrawal
    from ledger_entries e join vouchers v on v.id = e.voucher_id
      left join accounts p on p.id = v.party_id left join accounts ca on ca.id = e.contra_account_id left join books bk on bk.id = v.book_id
    where e.company_id = ${ctx.companyId} and e.account_id = ${bankId} and e.ledger_period = ${per} and e.date between ${from} and ${to}
    group by v.id, p.name, ca.name, e.narration, bk.name
    order by v.date, v.id`)).rows;
  const list = rows.map((r) => {
    const cd = (r.clearedDate as string) || null;
    return { id: Number(r.id), number: r.number as string, date: String(r.date).slice(0, 10), type: r.type as string, mode: r.mode as string | null,
      chequeNo: (r.chequeNo as string) ?? null, party: (r.party as string) ?? null, remark: ((r.remark as string) ?? '').trim() || null, partyBank: (r.partyBank as string) ?? null,
      slipNo: (r.slipNo as string) ?? null, book: (r.book as string) ?? null, clearedDate: cd, clearedIso: dmyToIso(cd),
      deposit: r2(Number(r.deposit) || 0), withdrawal: r2(Number(r.withdrawal) || 0) };
  });
  // balances on the "to" date: as per books, and as per bank (only what the bank has cleared by then)
  const [bal] = (await ctx.db.execute<{ book: string }>(sql`
    select coalesce(sum(debit - credit), 0) as book from ledger_entries
    where company_id = ${ctx.companyId} and account_id = ${bankId} and ledger_period = ${per} and date <= ${to}`)).rows;
  const [unc] = (await ctx.db.execute<{ dep: string; wd: string }>(sql`
    select coalesce(sum(e.debit), 0) as dep, coalesce(sum(e.credit), 0) as wd
    from ledger_entries e join vouchers v on v.id = e.voucher_id
    where e.company_id = ${ctx.companyId} and e.account_id = ${bankId} and e.ledger_period = ${per} and e.date <= ${to}
      and e.date >= ${fy.startDate} and v.type in ('RECEIPT','PAYMENT','RECEIPT_RETURN','PAYMENT_RETURN','CONTRA')
      and (v.extra->>'clearedDate' is null or to_date(v.extra->>'clearedDate', 'DD-MM-YYYY') > ${to}::date)`)).rows;
  const book = r2(Number(bal.book));
  const shown = q.show === 'all' ? list : list.filter((r) => !r.clearedIso || r.clearedIso > to);
  return {
    bank, from, to, rows: shown,
    totals: { deposit: r2(shown.reduce((a, r) => a + r.deposit, 0)), withdrawal: r2(shown.reduce((a, r) => a + r.withdrawal, 0)) },
    balance: { book, unclearedDeposits: r2(Number(unc.dep)), unclearedWithdrawals: r2(Number(unc.wd)), bank: r2(book - Number(unc.dep) + Number(unc.wd)) }
  };
}

const setSchema = z.object({ entries: z.array(z.object({ id: z.number().int().positive(), clearedDate: z.string().max(10).nullable(), remark: z.string().max(240).optional() })).max(5000) });

export async function setCleared(ctx: Ctx, body: unknown) {
  requireRole(ctx, ['ADMIN', 'ACCOUNTANT'], 'reconcile the bank');
  const { entries } = setSchema.parse(body);
  let n = 0;
  for (const e of entries) {
    const iso = e.clearedDate ? dmyToIso(e.clearedDate) ?? (/^\d{4}-\d{2}-\d{2}$/.test(e.clearedDate) ? e.clearedDate : null) : null;
    if (e.clearedDate && !iso) throw unprocessable(`Clearing date must be dd-mm-yyyy (${e.clearedDate})`);
    const patch = iso ? { cleared: 'Yes', clearedDate: isoToDmy(iso) } : null;
    const res = await ctx.db.execute(sql`
      update vouchers set extra = ${patch ? sql`(coalesce(extra, '{}'::jsonb) - 'cleared' - 'clearedDate') || ${JSON.stringify(patch)}::jsonb` : sql`coalesce(extra, '{}'::jsonb) - 'cleared' - 'clearedDate'`}
      where id = ${e.id} and company_id = ${ctx.companyId}`);
    if (e.remark !== undefined) await ctx.db.execute(sql`update vouchers set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('recoRemark', ${e.remark}::text) where id = ${e.id} and company_id = ${ctx.companyId}`);
    n += res.rowCount ?? 0;
  }
  await audit(ctx, 'voucher', 0, 'UPDATE', `Bank reconciliation: ${n} entries`, { entries } as never);
  return { updated: n };
}
