/**
 * Everything a document's print needs in one call, laid out by the web print page exactly as the
 * old software's printed bill / note: the document, the company, the full party and delivery
 * party, transporter, agent, collection person, the party's ledger balance as on the bill date,
 * the purchase entry each line came from and the user who entered it.
 */
import { sql } from 'drizzle-orm';
import type { Ctx } from './context.js';
import { getCompany } from './admin.js';
import { accountBalance, getDoc } from './documents.js';
import type { TypeDef } from './types.js';

type Row = Record<string, unknown>;

async function one(ctx: Ctx, q: ReturnType<typeof sql>) {
  return ((await ctx.db.execute<Row>(q)).rows[0] ?? null) as Row | null;
}

const party = (ctx: Ctx, id: unknown) => id ? one(ctx, sql`
  select a.id, a.name, a.print_name as "printName", a.address1, a.address2, a.area, a.city, a.state, a.state_code as "stateCode",
    a.pincode, coalesce(nullif(a.extra->>'P_Mobile', ''), nullif(a.extra->'_contact'->>'P_OMobile', ''), a.mobile) as mobile, a.phone, a.email, a.gstin, a.pan, a.collection_person_id as "collectionPersonId", a.party_group_id as "partyGroupId",
    a.extra->>'P_Id' as "partyCode"
  from accounts a where a.id = ${Number(id)}`) : null;
const person = (ctx: Ctx, id: unknown) => id ? one(ctx, sql`select id, name, phone from persons where id = ${Number(id)}`) : null;

export async function printData(ctx: Ctx, def: TypeDef, id: number) {
  const doc = await getDoc(ctx, def, id) as Row & { lines: Row[]; extra: Row | null };
  const company = await getCompany(ctx);
  const p = await party(ctx, doc.partyId);
  const delivery = doc.deliveryPartyId && doc.deliveryPartyId !== doc.partyId ? await party(ctx, doc.deliveryPartyId) : p;
  const transporter = doc.transporterId ? await one(ctx, sql`select id, name, gstin, mobile from transporters where id = ${Number(doc.transporterId)}`) : null;
  const collector = await person(ctx, doc.collectionPersonId ?? p?.collectionPersonId);
  const partyGroup = await person(ctx, p?.partyGroupId);
  const salesPerson = await person(ctx, doc.salesPersonId);
  const user = doc.createdById ? await one(ctx, sql`select name from users where id = ${Number(doc.createdById)}`) : null;
  const period = Number(doc.ledgerPeriod ?? ctx.period);
  const ledgerBalance = doc.partyId ? await accountBalance({ ...ctx, period }, Number(doc.partyId), String(doc.date)) : null;
  // the purchase entry (number) each sold lot came from
  const codes = [...new Set(doc.lines.map((l) => (l.extra as Row | null)?.purEntryCode ?? (l.extra as Row | null)?.purchaseCode).filter(Boolean))] as string[];
  const purchases = codes.length
    ? (await ctx.db.execute<Row>(sql`select legacy_code as code, number from vouchers where company_id = ${ctx.companyId} and type in ('PURCHASE_BILL', 'GENERAL_PURCHASE') and legacy_code in ${sql.raw('(' + codes.map((c) => `'${c.replace(/'/g, "''")}'`).join(',') + ')')}`)).rows
    : [];
  const purchaseEntry = Object.fromEntries(purchases.map((r) => [r.code, r.number]));
  return { doc, company, party: p, delivery, transporter, collector, partyGroup, salesPerson, user: user?.name ?? null, ledgerBalance, purchaseEntry };
}
