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
export type OsBy = 'group' | 'collector' | 'broker' | 'salesperson' | 'party' | 'broker+party' | 'broker+group' | 'collector+party' | 'collector+group' | 'salesperson+party' | 'state+party' | 'city+party';
const BY_LIST: OsBy[] = ['group', 'collector', 'broker', 'salesperson', 'party', 'broker+party', 'broker+group', 'collector+party', 'collector+group', 'salesperson+party', 'state+party', 'city+party'];
const TITLE: Record<OsBy, string> = {
  group: 'PARTY GROUPWISE SALES OUTSTANDING',
  collector: 'COLLECTION PERSONWISE SALES OUTSTANDING',
  broker: 'BROKERWISE SALES OUTSTANDING',
  salesperson: 'SALES PERSONWISE SALES OUTSTANDING',
  party: 'PARTYWISE SALES OUTSTANDING',
  'broker+party': 'BROKER + PARTYWISE SALES OUTSTANDING',
  'broker+group': 'BROKER + PARTY GROUPWISE SALES OUTSTANDING',
  'collector+party': 'COLLECTION PERSON + PARTYWISE SALES OUTSTANDING',
  'collector+group': 'COLLECTION PERSON + PARTY GROUPWISE SALES OUTSTANDING',
  'salesperson+party': 'SALES PERSON + PARTYWISE SALES OUTSTANDING',
  'state+party': 'STATE + PARTYWISE SALES OUTSTANDING',
  'city+party': 'CITY + PARTYWISE SALES OUTSTANDING'
};
const CHOICE: Record<string, string> = { pending: 'UNPAID', clear: 'PAID', all: 'ALL' };
/** old transaction types (Ftype) → document types of the bills they print */
const TYPES: Record<string, string> = {
  SAL: "v.type = 'SALE_BILL'",
  GENSAL: "v.type = 'GENERAL_SALE'",
  DBNT: "(v.type = 'INTEREST_DEBIT_NOTE' or (v.type = 'DEBIT_NOTE' and p.kind <> 'SUPPLIER'))"
};
const KIND_TYPES: Record<string, string[]> = { sale: ['SAL'], debit: ['DBNT'], all: ['SAL', 'GENSAL', 'DBNT'] };
const ids = (v?: string) => (v ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
const strs = (v?: string) => (v ?? '').split('|').map((x) => x.trim()).filter(Boolean);
const inList = (col: string, list: number[] | string[], not?: string) => {
  if (!list.length) return sql``;
  const vals = (list as (number | string)[]).map((x) => (typeof x === 'number' ? String(x) : `'${String(x).replace(/'/g, "''")}'`)).join(',');
  return sql.raw(` and ${not === '1' ? 'not ' : ''}coalesce(${col} in (${vals}), false)`);
};
interface Para { f: string; op: string; a: number; b?: number }

export async function outstandingPrint(ctx: Ctx, q: Record<string, string | undefined>) {
  const by = (BY_LIST.includes(q.by as OsBy) ? q.by : 'group') as OsBy;
  const kind = KIND_TYPES[q.kind ?? ''] ? (q.kind as string) : 'sale';
  const types = (q.types ? q.types.split(',').filter((t) => TYPES[t]) : KIND_TYPES[kind]);
  const typeSql = '(' + (types.length ? types : ['SAL']).map((t) => TYPES[t]).join(' or ') + ')';
  const choice = CHOICE[q.choice ?? ''] ? (q.choice as string) : 'pending';
  const recFrom = q.recFrom || null, recTo = q.recTo || null;
  const dueWise = q.due === '1';
  let para: Para[] = [];
  try { para = q.para ? (JSON.parse(q.para) as Para[]).filter((x) => x && x.f && x.op) : []; } catch { para = []; }
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
      where v.company_id in ${sql.raw('(' + companyIds.join(',') + ')')} and ${sql.raw(typeSql)} and ${billInPeriod(ctx)}
        and v.status <> 'CANCELLED' and v.net_amount > 0
        ${dueWise ? sql`and coalesce(v.due_date, v.date) between ${from} and ${to}` : sql`and v.date between ${from} and ${to}`}
        ${q.partyId ? sql`and v.party_id = ${Number(q.partyId)}` : sql``}
        ${inList('v.party_id', ids(q.parties), q.notParties)} ${inList('v.book_id', ids(q.books))} ${inList('p.group_id', ids(q.groups))}
        ${inList('upper(p.state)', strs(q.states).map((x) => x.toUpperCase()), q.notStates)} ${inList('upper(p.city)', strs(q.cities).map((x) => x.toUpperCase()), q.notCities)}
        ${inList('upper(p.area)', strs(q.areas).map((x) => x.toUpperCase()), q.notAreas)}
        ${inList('v.broker_id', ids(q.brokers), q.notBrokers)} ${inList('p.party_group_id', ids(q.partyGroups), q.notPartyGroups)}
        ${inList('coalesce(v.sales_person_id, p.sales_person_id)', ids(q.salesPersons), q.notSalesPersons)} ${inList('p.collection_person_id', ids(q.collectors), q.notCollectors)}
        ${inList('v.transporter_id', ids(q.transporters))}
        ${ids(q.items).length ? sql.raw(` and ${q.notItems === '1' ? 'not ' : ''}exists (select 1 from voucher_lines l where l.voucher_id = v.id and l.item_id in (${ids(q.items).join(',')}))`) : sql``}
        ${strs(q.brands).length ? sql.raw(` and exists (select 1 from voucher_lines l where l.voucher_id = v.id and upper(l.brand) in (${strs(q.brands).map((x) => `'${x.toUpperCase().replace(/'/g, "''")}'`).join(',')}))`) : sql``}
    ), s as (
      select a.bill_id, sum(a.amount) as settled,
        sum(a.amount) filter (where ${recFrom ? sql`a.date >= ${recFrom}` : sql`true`} and ${recTo ? sql`a.date <= ${recTo}` : sql`true`}) as "inRange",
        max(a.date) as "lastRec"
      from bill_allocations a
      where a.bill_id in (select id from b) and a.ledger_period = ${ctx.period} and a.kind is distinct from 'PENDING' and a.date <= ${recTo ?? to}
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
      v.net_amount - coalesce(s.settled, 0) as pending, coalesce(s."inRange", 0) as "inRange", s."lastRec", v.due_date as "dueDate",
      upper(coalesce(p.state, '')) as state, upper(coalesce(p.city, '')) as city
    from b v left join s on s.bill_id = v.id join companies c on c.id = v.company_id join accounts p on p.id = v.party_id
      left join persons pg on pg.id = p.party_group_id left join persons bk on bk.id = v.broker_id
      left join persons sp on sp.id = v.sales_person_id left join persons psp on psp.id = p.sales_person_id
      left join persons cp on cp.id = p.collection_person_id
    where ${sql.raw(choice === 'pending' ? 'v.net_amount - coalesce(s.settled, 0) > 0.005' : choice === 'clear' ? 'abs(v.net_amount - coalesce(s.settled, 0)) <= 0.005' : 'true')}
      ${recFrom || recTo ? sql`and coalesce(s."inRange", 0) > 0` : sql``}
    order by v.date, v.number`);

  let bills = res.rows.map((r) => {
    const qty = N(r.qty), net = N(r.net), pending = r2(N(r.pending));
    const isDn = String(r.type).includes('DEBIT_NOTE');
    const item = isDn ? [r.item, r.secondAccount].filter(Boolean).join(' ') : [r.item, r.brand].filter(Boolean).join(' ');
    const first = by.split('+')[0];
    const key = (k: string) => String((k === 'group' ? r.partyGroup : k === 'collector' ? r.collector : k === 'broker' ? r.broker : k === 'salesperson' ? r.salesPerson : k === 'state' ? r.state : k === 'city' ? r.city : '') || 'NOT ASSIGNED');
    const groupKey = by === 'party' ? '' : by === 'broker+group' ? key('broker') + ' / ' + key('group') : by === 'collector+group' ? key('collector') + ' / ' + key('group') : key(first);
    return {
      id: Number(r.id), com: r.com, companyId: Number(r.companyId), date: r.date, number: r.number, broker: r.broker, item, partyId: Number(r.partyId),
      rate: isDn ? 0 : r.avgRate != null ? N(r.avgRate) : qty ? r2(net / qty) : 0, qty: isDn ? 0 : qty,
      net, received: r2(net - pending), pending, crDays: N(r.crDays), days: daysBetween(String(r.date).slice(0, 10), to),
      group: String(groupKey), partyGroup: String(r.partyGroup ?? ''), brokerName: String(r.broker ?? ''), lastRec: r.lastRec ?? null, dueDate: r.dueDate ?? null
    };
  });
  // Outstanding Para: conditions on the bill, or on the party / party group / broker totals
  if (para.length) {
    const sum = (k: (b: (typeof bills)[number]) => string) => { const m = new Map<string, number>(); for (const b of bills) m.set(k(b), (m.get(k(b)) ?? 0) + b.pending); return m; };
    const pOs = sum((b) => String(b.partyId)), gOs = sum((b) => b.partyGroup), bOs = sum((b) => b.brokerName);
    const val = (b: (typeof bills)[number], f: string) => f === 'Sal_NetAmt' ? b.net : f === 'Sal_AvgRate' ? b.rate : f === 'Outstanding' ? b.pending : f === 'Sal_Crdays' ? b.crDays
      : f === 'BillDays' ? b.days : f === 'PartyOs' ? pOs.get(String(b.partyId)) ?? 0 : f === 'PartyGroupOs' ? gOs.get(b.partyGroup) ?? 0 : f === 'BrokerOs' ? bOs.get(b.brokerName) ?? 0 : 0;
    const ok = (v: number, c: Para) => c.op === '=' ? Math.abs(v - c.a) < 0.005 : c.op === '<>' ? Math.abs(v - c.a) >= 0.005 : c.op === '>' ? v > c.a : c.op === '>=' ? v >= c.a
      : c.op === '<' ? v < c.a : c.op === '<=' ? v <= c.a : c.op === 'between' ? v >= c.a && v <= (c.b ?? c.a) : true;
    bills = bills.filter((b) => para.every((c) => ok(val(b, c.f), c)));
  }
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
    title: TITLE[by] + ' - ' + (choice === 'pending' ? ' UNPAID' : CHOICE[choice]).trim(), by, kind, from, to, choice,
    company: { name: company.name, address: [company.address1, company.address2].filter(Boolean).join(', ') },
    companies: all.map((c) => ({ id: Number(c.id), short: c.short, name: c.name, on: companyIds.includes(Number(c.id)) })),
    bills, parties
  };
}

/** lists for the Report Selection tabs that the lookups don't carry */
export async function outstandingFilters(ctx: Ctx) {
  const q = async (s: ReturnType<typeof sql>) => (await ctx.db.execute<Row>(s)).rows;
  const companies = await q(sql`select id, short_name as code, name from companies where id = ${ctx.mcId} or master_company_id = ${ctx.mcId} order by id`);
  const groups = await q(sql`select id, name from account_groups where company_id = ${ctx.mcId} order by name`);
  const places = await q(sql`select upper(trim(state)) as state, upper(trim(city)) as city, upper(trim(area)) as area from accounts
    where company_id = ${ctx.mcId} and kind = 'CUSTOMER' group by 1, 2, 3`);
  const uniq = (k: string) => [...new Set(places.map((r) => String(r[k] ?? '')).filter(Boolean))].sort();
  return { companies, groups, states: uniq('state'), cities: uniq('city'), areas: uniq('area') };
}
