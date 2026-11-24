/**
 * "PARTY GROUPWISE SALES OUTSTANDING - UNPAID", the old software's outstanding print (Crystal), over
 * all the selected companies together: unpaid bills dated From–To, pending as on To, grouped by party
 * group (or collection person / broker / sales person), then party, with the party's contact, mobile,
 * collection person, address and ledger balance.
 */
import { sql } from 'drizzle-orm';
import { r2 } from '../lib/money.js';
import { daysBetween } from '../lib/dates.js';
import type { Ctx } from './context.js';
import { getCompany } from './admin.js';
import { billInPeriod } from './bills.js';
import { loadFy } from './documents.js';

type Row = Record<string, unknown>;
const N = (v: unknown) => Number(v ?? 0) || 0;
export type OsBy = 'group' | 'collector' | 'broker' | 'salesperson';
const TITLE: Record<OsBy, string> = {
  group: 'PARTY GROUPWISE SALES OUTSTANDING - UNPAID',
  collector: 'COLLECTION PERSONWISE SALES OUTSTANDING - UNPAID',
  broker: 'BROKERWISE SALES OUTSTANDING - UNPAID',
  salesperson: 'SALES PERSONWISE SALES OUTSTANDING - UNPAID'
};
const KINDS: Record<string, string> = {
  sale: "v.type = 'SALE_BILL'",
  debit: "(v.type = 'INTEREST_DEBIT_NOTE' or (v.type = 'DEBIT_NOTE' and p.kind <> 'SUPPLIER'))",
  all: "(v.type in ('SALE_BILL', 'GENERAL_SALE', 'INTEREST_DEBIT_NOTE') or (v.type = 'DEBIT_NOTE' and p.kind <> 'SUPPLIER'))"
};

export async function outstandingPrint(ctx: Ctx, q: Record<string, string | undefined>) {
  const by = (['group', 'collector', 'broker', 'salesperson'].includes(q.by ?? '') ? q.by : 'group') as OsBy;
  const kind = KINDS[q.kind ?? 'sale'] ? (q.kind ?? 'sale') : 'sale';
  const fy = await loadFy(ctx);
  const from = q.from || fy.startDate;
  const to = q.to || new Date().toISOString().slice(0, 10);
  const company = await getCompany(ctx);
  const all = (await ctx.db.execute<Row>(sql`select id, short_name as short, name from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId} order by id`)).rows;
  const picked = (q.companies ?? '').split(',').map(Number).filter((n) => all.some((c) => Number(c.id) === n));
  const companyIds = picked.length ? picked : all.map((c) => Number(c.id));
  const like = (q.only ?? '').trim();

  const res = await ctx.db.execute<Row>(sql`
    with b as (
      select v.* from vouchers v join accounts p on p.id = v.party_id
      where v.company_id in ${sql.raw('(' + companyIds.join(',') + ')')} and ${sql.raw(KINDS[kind])} and ${billInPeriod(ctx)}
        and v.status <> 'CANCELLED' and v.date between ${from} and ${to} and v.net_amount > 0
        ${q.partyId ? sql`and v.party_id = ${Number(q.partyId)}` : sql``}
    ), s as (
      select a.bill_id, sum(a.amount) as settled from bill_allocations a
      where a.bill_id in (select id from b) and a.ledger_period = ${ctx.period} and a.kind is distinct from 'PENDING' and a.date <= ${to}
      group by a.bill_id
    )
    select v.id, v.company_id as "companyId", c.short_name as com, v.type, v.number, v.date, v.net_amount as net, v.total_qty as qty,
      v.credit_days as "crDays", v.extra->>'avgRate' as "avgRate", v.party_id as "partyId",
      coalesce(bk.name, 'DIRECT') as broker, coalesce(sp.name, psp.name, '') as "salesPerson", coalesce(cp.name, '') as collector,
      coalesce(pg.name, p.name) as "partyGroup",
      case when v.type = 'INTEREST_DEBIT_NOTE' then coalesce(v.extra->>'secondAccount', (select t.extra->>'secondAccount' from vouchers t
        where t.company_id = v.company_id and t.number = v.number and t.type = 'DEBIT_NOTE' limit 1)) else v.extra->>'secondAccount' end as "secondAccount",
      (select it.name from voucher_lines l join items it on it.id = l.item_id where l.voucher_id = v.id order by l.line_no limit 1) as item,
      (select l.brand from voucher_lines l where l.voucher_id = v.id and coalesce(l.brand, '') <> '' order by l.line_no limit 1) as brand,
      v.net_amount - coalesce(s.settled, 0) as pending
    from b v left join s on s.bill_id = v.id join companies c on c.id = v.company_id join accounts p on p.id = v.party_id
      left join persons pg on pg.id = p.party_group_id left join persons bk on bk.id = v.broker_id
      left join persons sp on sp.id = v.sales_person_id left join persons psp on psp.id = p.sales_person_id
      left join persons cp on cp.id = p.collection_person_id
    where v.net_amount - coalesce(s.settled, 0) > 0.005
    order by v.date, v.number`);

  let bills = res.rows.map((r) => {
    const qty = N(r.qty), net = N(r.net), pending = r2(N(r.pending));
    const isDn = String(r.type).includes('DEBIT_NOTE');
    const item = isDn ? [r.item, r.secondAccount].filter(Boolean).join(' ') : [r.item, r.brand].filter(Boolean).join(' ');
    const groupKey = by === 'group' ? r.partyGroup : by === 'collector' ? r.collector : by === 'broker' ? r.broker : r.salesPerson;
    return {
      id: Number(r.id), com: r.com, companyId: Number(r.companyId), date: r.date, number: r.number, broker: r.broker, item, partyId: Number(r.partyId),
      rate: isDn ? 0 : r.avgRate != null ? N(r.avgRate) : qty ? r2(net / qty) : 0, qty: isDn ? 0 : qty,
      net, received: r2(net - pending), pending, crDays: N(r.crDays), days: daysBetween(String(r.date).slice(0, 10), to),
      group: String(groupKey || (by === 'group' ? '' : 'NOT ASSIGNED'))
    };
  });
  if (like) bills = bills.filter((b) => b.group.toLowerCase().includes(like.toLowerCase()));

  const partyIds = [...new Set(bills.map((b) => b.partyId))];
  const parties: Record<number, Row> = {};
  if (partyIds.length) {
    const pr = await ctx.db.execute<Row>(sql`
      select a.id, a.name, a.contact_person as contact, coalesce(nullif(a.extra->>'P_Mobile', ''), a.mobile) as mobile,
        concat_ws(', ', nullif(a.address1, ''), nullif(a.address2, '')) as address,
        cp.name as collector, (case when a.opening_type = 'DR' then a.opening_balance else -a.opening_balance end) as opening,
        (select jsonb_object_agg(x.company_id, x.bal) from (select e.company_id, sum(e.debit - e.credit) as bal from ledger_entries e
          where e.account_id = a.id and e.ledger_period = ${ctx.period} and e.date <= ${to} group by e.company_id) x) as balances
      from accounts a left join persons cp on cp.id = a.collection_person_id
      where a.id in ${sql.raw('(' + partyIds.join(',') + ')')}`);
    // the old print shows the party's ledger balance in the company of its first bill
    for (const r of pr.rows) {
      const bal = (r.balances ?? {}) as Record<string, number>;
      const first = bills.filter((b) => b.partyId === Number(r.id)).sort((x, y) => String(x.date).localeCompare(String(y.date)) || x.companyId - y.companyId || String(x.number).localeCompare(String(y.number)))[0];
      const { balances: _b, opening, ...rest } = r;
      parties[Number(r.id)] = { ...rest, balance: r2(N(bal[String(first?.companyId)]) + (first?.companyId === ctx.mcId ? N(opening) : 0)) };
    }
  }
  return {
    title: TITLE[by], by, kind, from, to,
    company: { name: company.name, address: [company.address1, company.address2].filter(Boolean).join(', ') },
    companies: all.map((c) => ({ id: Number(c.id), short: c.short, name: c.name, on: companyIds.includes(Number(c.id)) })),
    bills, parties
  };
}
