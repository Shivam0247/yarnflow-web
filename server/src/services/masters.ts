/**
 * Master data: account groups, accounts (parties / ledgers), yarn items,
 * brands, transporters, vehicles, godowns, sales persons, cost centers, books.
 * One generic CRUD driven by a zod schema per master.
 */
import { and, asc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import {
  accountGroups, accounts, auditLogs, books, brands, costCenters, godowns, items, salesPersons, transporters, vehicles
} from '../db/schema.js';
import { conflict, notFound, unprocessable } from '../lib/errors.js';
import { r2 } from '../lib/money.js';
import { MASTER_WRITE, requireRole, SETUP_WRITE, type Ctx, type Role } from './context.js';

const s = (max = 160) => z.string().trim().max(max);
const optS = (max = 160) => s(max).optional().nullable().transform((v) => (v === '' ? null : v));
const optId = z.coerce.number().int().positive().optional().nullable();
const money = z.coerce.number().min(0);
const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'GSTIN format looks wrong (e.g. 24AABCK1234F1Z5)')
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));
const pan = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN format looks wrong (e.g. AABCK1234F)')
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));
const mobile = z
  .string()
  .trim()
  .regex(/^[0-9 +\-]{6,20}$/, 'Mobile number looks wrong')
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));
const email = z.string().trim().email().optional().nullable().or(z.literal('').transform(() => null));

export const groupSchema = z.object({
  name: s(120).min(1, 'Group name is required'),
  parentId: optId,
  nature: z.enum(['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE']),
  billWise: z.boolean().optional(),
  creditControl: z.boolean().optional(),
  affectsGrossProfit: z.boolean().optional(),
  showInOutstanding: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional()
});

export const accountSchema = z.object({
  groupId: z.coerce.number().int().positive({ message: 'Choose a group' }),
  code: optS(30),
  name: s(160).min(1, 'Account name is required'),
  alias: optS(160),
  printName: optS(200),
  kind: z.enum(['CUSTOMER', 'SUPPLIER', 'BROKER', 'TRANSPORTER', 'BANK', 'CASH', 'TAX', 'SALES', 'PURCHASE', 'EXPENSE', 'INCOME', 'CAPITAL', 'LOAN', 'ASSET', 'OTHER']),
  partyGroupId: optId,
  gstType: z.enum(['REGULAR', 'COMPOSITION', 'UNREGISTERED', 'CONSUMER', 'SEZ', 'EXPORT']).optional(),
  gstin,
  pan,
  address1: optS(400),
  address2: optS(400),
  area: optS(80),
  city: optS(80),
  state: optS(60),
  stateCode: z.string().regex(/^[0-9]{2}$/).optional().nullable().or(z.literal('').transform(() => null)),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits').optional().nullable().or(z.literal('').transform(() => null)),
  contactPerson: optS(120),
  mobile,
  phone: optS(30),
  email,
  creditLimit: money.optional(),
  creditDays: z.coerce.number().int().min(0).max(365).optional(),
  interestRate: z.coerce.number().min(0).max(60).optional(),
  brokerId: optId,
  brokerageRate: z.coerce.number().min(0).optional(),
  brokerageType: z.enum(['PER_KG', 'PERCENT']).optional(),
  transporterId: optId,
  salesPersonId: optId,
  bankName: optS(120),
  bankAccountNo: optS(40),
  ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC looks wrong (e.g. HDFC0001234)').optional().nullable().or(z.literal('').transform(() => null)),
  openingBalance: money.optional(),
  openingType: z.enum(['DR', 'CR']).optional(),
  tdsApplicable: z.boolean().optional(),
  tdsRate: z.coerce.number().min(0).max(30).optional(),
  tcsApplicable: z.boolean().optional(),
  tcsRate: z.coerce.number().min(0).max(10).optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'BLOCKED', 'INACTIVE']).optional(),
  notes: optS(2000)
});

export const itemSchema = z.object({
  code: s(40).min(1, 'Item code is required'),
  name: s(160).min(1, 'Item name is required'),
  description: optS(240),
  type: z.enum(['FDY', 'POY', 'DTY', 'VISCOSE', 'NYLON', 'SPUN', 'COTTON', 'OTHER', 'SERVICE']).optional(),
  denier: optS(20),
  filament: optS(20),
  lustre: optS(10),
  brandId: optId,
  hsn: z.string().trim().regex(/^[0-9]{4,8}$/, 'HSN must be 4–8 digits'),
  gstRate: z.coerce.number().refine((v) => [0, 0.25, 3, 5, 12, 18, 28].includes(v), 'GST rate must be 0, 0.25, 3, 5, 12, 18 or 28'),
  unit: z.enum(['KG', 'PCS', 'MTR', 'BOX', 'NOS']).optional(),
  stdBoxKg: z.coerce.number().min(0).optional(),
  conesPerBox: z.coerce.number().int().min(0).optional(),
  rate: money.optional(),
  minStock: z.coerce.number().min(0).optional(),
  isGeneral: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const brandSchema = z.object({ name: s(120).min(1), millAccountId: optId, location: optS(120) });

export const transporterSchema = z.object({
  name: s(160).min(1, 'Transporter name is required'),
  transporterId: optS(20),
  gstin,
  contactPerson: optS(120),
  mobile,
  address: optS(400),
  city: optS(80),
  routes: optS(400),
  rateBasis: z.enum(['PER_KG', 'PER_BOX', 'PER_TRIP']).optional(),
  rate: money.optional(),
  accountId: optId,
  status: z.enum(['ACTIVE', 'ON_HOLD', 'BLOCKED', 'INACTIVE']).optional()
});

export const vehicleSchema = z.object({
  number: z.string().trim().toUpperCase().regex(/^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{0,3}[ -]?[0-9]{1,4}$/, 'Vehicle number looks wrong (e.g. GJ05AB1234)'),
  transporterId: optId,
  driverName: optS(120),
  driverMobile: mobile
});

export const godownSchema = z.object({ name: s(120).min(1), address: optS(400), city: optS(80), isDefault: z.boolean().optional(), isActive: z.boolean().optional() });
export const salesPersonSchema = z.object({ name: s(120).min(1), mobile, email, isActive: z.boolean().optional() });
export const costCenterSchema = z.object({ name: s(120).min(1), isDefault: z.boolean().optional() });
export const bookSchema = z.object({
  voucherType: z.enum(['SALES_ORDER', 'PURCHASE_ORDER', 'DISPATCH_SCHEDULE', 'SALE_BILL', 'PURCHASE_BILL', 'SALE_RETURN', 'PURCHASE_RETURN', 'GENERAL_SALE', 'GENERAL_PURCHASE', 'RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL', 'DEBIT_NOTE', 'CREDIT_NOTE', 'STOCK_TRANSFER', 'OPENING_STOCK']),
  name: s(120).min(1),
  prefix: z.string().trim().min(1).max(12),
  padding: z.coerce.number().int().min(1).max(8).optional(),
  withFySuffix: z.boolean().optional(),
  postingAccountId: optId,
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional()
});

interface MasterDef {
  slug: string;
  label: string;
  table: PgTable & { id: never; companyId: never };
  schema: z.ZodObject<z.ZodRawShape>;
  write: Role[];
  search: string[];
  order: string;
  /** foreign keys inside the company that must exist */
  refs?: Record<string, PgTable>;
}

export const MASTERS: Record<string, MasterDef> = {
  groups: { slug: 'groups', label: 'Group', table: accountGroups as never, schema: groupSchema, write: SETUP_WRITE, search: ['name'], order: 'sortOrder', refs: { parentId: accountGroups } },
  accounts: { slug: 'accounts', label: 'Account', table: accounts as never, schema: accountSchema, write: MASTER_WRITE, search: ['name', 'alias', 'code', 'gstin', 'city', 'mobile'], order: 'name', refs: { groupId: accountGroups, partyGroupId: accounts, brokerId: accounts, transporterId: transporters, salesPersonId: salesPersons } },
  items: { slug: 'items', label: 'Yarn item', table: items as never, schema: itemSchema, write: MASTER_WRITE, search: ['name', 'code', 'description', 'denier', 'hsn'], order: 'code', refs: { brandId: brands } },
  brands: { slug: 'brands', label: 'Brand', table: brands as never, schema: brandSchema, write: MASTER_WRITE, search: ['name'], order: 'name', refs: { millAccountId: accounts } },
  transporters: { slug: 'transporters', label: 'Transporter', table: transporters as never, schema: transporterSchema, write: MASTER_WRITE, search: ['name', 'transporterId', 'city', 'routes', 'mobile'], order: 'name', refs: { accountId: accounts } },
  vehicles: { slug: 'vehicles', label: 'Vehicle', table: vehicles as never, schema: vehicleSchema, write: MASTER_WRITE, search: ['number', 'driverName'], order: 'number', refs: { transporterId: transporters } },
  godowns: { slug: 'godowns', label: 'Godown', table: godowns as never, schema: godownSchema, write: SETUP_WRITE, search: ['name', 'city'], order: 'name' },
  'sales-persons': { slug: 'sales-persons', label: 'Sales person', table: salesPersons as never, schema: salesPersonSchema, write: SETUP_WRITE, search: ['name', 'mobile'], order: 'name' },
  'cost-centers': { slug: 'cost-centers', label: 'Cost center', table: costCenters as never, schema: costCenterSchema, write: SETUP_WRITE, search: ['name'], order: 'name' },
  books: { slug: 'books', label: 'Book', table: books as never, schema: bookSchema, write: SETUP_WRITE, search: ['name', 'prefix'], order: 'name', refs: { postingAccountId: accounts } }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const col = (t: PgTable, k: string) => (t as any)[k];

async function checkRefs(ctx: Ctx, def: MasterDef, data: Record<string, unknown>) {
  for (const [k, table] of Object.entries(def.refs ?? {})) {
    const v = data[k];
    if (!v) continue;
    const rows = await ctx.db.select({ id: col(table, 'id') }).from(table).where(and(eq(col(table, 'id'), v), eq(col(table, 'companyId'), ctx.companyId)));
    if (!rows.length) throw unprocessable(`${k.replace(/Id$/, '')} not found`);
  }
}

async function audit(ctx: Ctx, entity: string, entityId: number, action: string, summary: string) {
  await ctx.db.insert(auditLogs).values({ companyId: ctx.companyId, userId: ctx.userId, entity, entityId, action, summary });
}

export async function listMaster(ctx: Ctx, def: MasterDef, q: { q?: string; kind?: string; type?: string; groupId?: number; voucherType?: string; active?: string; page?: number; pageSize?: number }) {
  const t = def.table;
  const conds: (SQL | undefined)[] = [eq(col(t, 'companyId'), ctx.companyId)];
  if (q.q) conds.push(or(...def.search.map((k) => ilike(col(t, k), '%' + q.q + '%'))));
  if (q.kind && def.slug === 'accounts') conds.push(inArray(accounts.kind, q.kind.split(',') as never));
  if (q.groupId && def.slug === 'accounts') conds.push(eq(accounts.groupId, Number(q.groupId)));
  if (q.type && def.slug === 'items') conds.push(eq(items.type, q.type as never));
  if (q.voucherType && def.slug === 'books') conds.push(eq(books.voucherType, q.voucherType as never));
  const pageSize = Math.min(Number(q.pageSize) || 500, 2000);
  const page = Math.max(Number(q.page) || 1, 1);
  const where = and(...conds);
  const data = await ctx.db.select().from(t).where(where).orderBy(asc(col(t, def.order)), asc(col(t, 'id'))).limit(pageSize).offset((page - 1) * pageSize);
  const [{ n }] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(t).where(where);
  if (def.slug === 'accounts') return { data: await decorateAccounts(ctx, data as (typeof accounts.$inferSelect)[]), total: n, page, pageSize };
  if (def.slug === 'items') return { data: await decorateItems(ctx, data as (typeof items.$inferSelect)[]), total: n, page, pageSize };
  if (def.slug === 'groups') return { data: await decorateGroups(ctx, data as (typeof accountGroups.$inferSelect)[]), total: n, page, pageSize };
  if (def.slug === 'transporters') return { data: await decorateTransporters(ctx, data as (typeof transporters.$inferSelect)[]), total: n, page, pageSize };
  return { data, total: n, page, pageSize };
}

/** add group name + closing balance */
async function decorateAccounts(ctx: Ctx, rows: (typeof accounts.$inferSelect)[]) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const bal = await ctx.db.execute<{ account_id: number; b: string }>(sql`
    select account_id, sum(debit - credit) as b from ledger_entries where company_id = ${ctx.companyId} and account_id in ${sql.raw('(' + ids.join(',') + ')')} group by account_id`);
  const bm = new Map(bal.rows.map((r) => [Number(r.account_id), Number(r.b)]));
  const groups = await ctx.db.select({ id: accountGroups.id, name: accountGroups.name }).from(accountGroups).where(eq(accountGroups.companyId, ctx.companyId));
  const gm = new Map(groups.map((g) => [g.id, g.name]));
  return rows.map((r) => {
    const b = r2((r.openingType === 'DR' ? r.openingBalance : -r.openingBalance) + (bm.get(r.id) ?? 0));
    return { ...r, groupName: gm.get(r.groupId) ?? null, balance: Math.abs(b), balanceType: b >= 0 ? 'DR' : 'CR', balanceSigned: b };
  });
}

async function decorateItems(ctx: Ctx, rows: (typeof items.$inferSelect)[]) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const st = await ctx.db.execute<{ item_id: number; q: string }>(sql`
    select item_id, sum(qty_in - qty_out) as q from stock_entries where company_id = ${ctx.companyId} and item_id in ${sql.raw('(' + ids.join(',') + ')')} group by item_id`);
  const sm = new Map(st.rows.map((r) => [Number(r.item_id), Number(r.q)]));
  const bs = await ctx.db.select().from(brands).where(eq(brands.companyId, ctx.companyId));
  const bm = new Map(bs.map((b) => [b.id, b.name]));
  return rows.map((r) => ({ ...r, brandName: r.brandId ? bm.get(r.brandId) ?? null : null, stockQty: sm.get(r.id) ?? 0 }));
}

async function decorateGroups(ctx: Ctx, rows: (typeof accountGroups.$inferSelect)[]) {
  const counts = await ctx.db.execute<{ group_id: number; n: string; b: string }>(sql`
    select a.group_id, count(*) as n,
      sum(case when a.opening_type = 'DR' then a.opening_balance else -a.opening_balance end
          + coalesce((select sum(debit - credit) from ledger_entries e where e.account_id = a.id), 0)) as b
    from accounts a where a.company_id = ${ctx.companyId} group by a.group_id`);
  const cm = new Map(counts.rows.map((r) => [Number(r.group_id), { n: Number(r.n), b: Number(r.b) }]));
  // roll up to parents
  const byId = new Map(rows.map((r) => [r.id, r]));
  const total = new Map<number, { n: number; b: number }>();
  for (const r of rows) {
    let cur: typeof r | undefined = r;
    const own = cm.get(r.id) ?? { n: 0, b: 0 };
    while (cur) {
      const t = total.get(cur.id) ?? { n: 0, b: 0 };
      total.set(cur.id, { n: t.n + own.n, b: t.b + own.b });
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
  }
  return rows.map((r) => {
    const t = total.get(r.id) ?? { n: 0, b: 0 };
    return { ...r, parentName: r.parentId ? byId.get(r.parentId)?.name ?? null : null, accountCount: t.n, balance: Math.abs(r2(t.b)), balanceType: t.b >= 0 ? 'DR' : 'CR', subGroupCount: rows.filter((x) => x.parentId === r.id).length };
  });
}

async function decorateTransporters(ctx: Ctx, rows: (typeof transporters.$inferSelect)[]) {
  if (!rows.length) return [];
  const st = await ctx.db.execute<{ transporter_id: number; transit: string; total: string }>(sql`
    select transporter_id, count(*) filter (where ewb_status in ('GENERATED','PARTB_PENDING')) as transit, count(*) as total
    from vouchers where company_id = ${ctx.companyId} and type = 'SALE_BILL' and transporter_id is not null group by transporter_id`);
  const m = new Map(st.rows.map((r) => [Number(r.transporter_id), { transit: Number(r.transit), total: Number(r.total) }]));
  return rows.map((r) => ({ ...r, inTransit: m.get(r.id)?.transit ?? 0, bills: m.get(r.id)?.total ?? 0 }));
}

export async function getMaster(ctx: Ctx, def: MasterDef, id: number) {
  const t = def.table;
  const [row] = await ctx.db.select().from(t).where(and(eq(col(t, 'id'), id), eq(col(t, 'companyId'), ctx.companyId)));
  if (!row) throw notFound(def.label);
  if (def.slug === 'accounts') return (await decorateAccounts(ctx, [row as never]))[0];
  if (def.slug === 'items') return (await decorateItems(ctx, [row as never]))[0];
  return row;
}

async function uniqueCheck(ctx: Ctx, def: MasterDef, data: Record<string, unknown>, exceptId?: number) {
  const keys = def.slug === 'items' ? ['code'] : ['groups', 'accounts', 'brands'].includes(def.slug) ? ['name'] : def.slug === 'vehicles' ? ['number'] : [];
  for (const k of keys) {
    if (!data[k]) continue;
    const t = def.table;
    const rows = await ctx.db.select({ id: col(t, 'id') }).from(t).where(and(eq(col(t, 'companyId'), ctx.companyId), sql`lower(${col(t, k)}) = lower(${data[k] as string})`));
    if (rows.some((r: { id: number }) => r.id !== exceptId)) throw conflict(`${def.label} with this ${k} already exists`);
  }
}

function deriveAccount(data: Record<string, unknown>) {
  // GSTIN → state code + PAN
  const g = data.gstin as string | null | undefined;
  if (g) {
    if (!data.stateCode) data.stateCode = g.slice(0, 2);
    if (!data.pan) data.pan = g.slice(2, 12);
  }
  return data;
}

export async function createMaster(ctx: Ctx, def: MasterDef, raw: unknown) {
  requireRole(ctx, def.write, `add a ${def.label.toLowerCase()}`);
  let data = def.schema.parse(raw) as Record<string, unknown>;
  if (def.slug === 'accounts') data = deriveAccount(data);
  await checkRefs(ctx, def, data);
  await uniqueCheck(ctx, def, data);
  if (data.isDefault) await clearDefault(ctx, def, data);
  const [row] = await ctx.db.insert(def.table).values({ ...data, companyId: ctx.companyId } as never).returning();
  await audit(ctx, def.slug, (row as { id: number }).id, 'CREATE', `${def.label} ${(data.name ?? data.number ?? data.code) as string} created`);
  return getMaster(ctx, def, (row as { id: number }).id);
}

export async function updateMaster(ctx: Ctx, def: MasterDef, id: number, raw: unknown) {
  requireRole(ctx, def.write, `edit a ${def.label.toLowerCase()}`);
  const existing = (await getMaster(ctx, def, id)) as Record<string, unknown>;
  let data = def.schema.partial().parse(raw) as Record<string, unknown>;
  if (def.slug === 'accounts') data = deriveAccount(data);
  if (existing.isSystem && ('nature' in data || 'groupId' in data || 'kind' in data)) {
    if ((data.nature && data.nature !== existing.nature) || (data.groupId && data.groupId !== existing.groupId) || (data.kind && data.kind !== existing.kind)) {
      throw conflict('System records are used by automatic postings; their group / type cannot change');
    }
  }
  if (def.slug === 'groups' && data.parentId === id) throw unprocessable('A group cannot be under itself');
  await checkRefs(ctx, def, data);
  await uniqueCheck(ctx, def, data, id);
  if (data.isDefault) await clearDefault(ctx, def, data);
  const t = def.table;
  await ctx.db.update(t).set({ ...data, updatedAt: new Date() } as never).where(and(eq(col(t, 'id'), id), eq(col(t, 'companyId'), ctx.companyId)));
  await audit(ctx, def.slug, id, 'UPDATE', `${def.label} ${(existing.name ?? existing.number ?? existing.code) as string} updated`);
  return getMaster(ctx, def, id);
}

async function clearDefault(ctx: Ctx, def: MasterDef, data: Record<string, unknown>) {
  const t = def.table;
  const extra = def.slug === 'books' ? eq(books.voucherType, data.voucherType as never) : undefined;
  await ctx.db.update(t).set({ isDefault: false } as never).where(and(eq(col(t, 'companyId'), ctx.companyId), extra));
}

/** where each master is referenced — blocks deleting records in use */
const USAGE: Record<string, string[]> = {
  accounts: [
    'select 1 from vouchers where party_id = $1 or delivery_party_id = $1 or broker_id = $1 or mill_id = $1 or bank_account_id = $1',
    'select 1 from voucher_lines where account_id = $1',
    'select 1 from ledger_entries where account_id = $1',
    'select 1 from accounts where party_group_id = $1 or broker_id = $1'
  ],
  groups: ['select 1 from accounts where group_id = $1', 'select 1 from account_groups where parent_id = $1'],
  items: ['select 1 from voucher_lines where item_id = $1', 'select 1 from stock_entries where item_id = $1'],
  transporters: ['select 1 from vouchers where transporter_id = $1', 'select 1 from vehicles where transporter_id = $1'],
  godowns: ['select 1 from stock_entries where godown_id = $1', 'select 1 from vouchers where godown_id = $1 or to_godown_id = $1'],
  'sales-persons': ['select 1 from vouchers where sales_person_id = $1'],
  'cost-centers': ['select 1 from vouchers where cost_center_id = $1'],
  books: ['select 1 from vouchers where book_id = $1'],
  brands: ['select 1 from items where brand_id = $1']
};

export async function deleteMaster(ctx: Ctx, def: MasterDef, id: number) {
  requireRole(ctx, def.write, `delete a ${def.label.toLowerCase()}`);
  const existing = (await getMaster(ctx, def, id)) as Record<string, unknown>;
  if (existing.isSystem) throw conflict('System records cannot be deleted');
  for (const q of USAGE[def.slug] ?? []) {
    const res = await ctx.db.execute(sql.raw(q.replace(/\$1/g, String(Number(id))) + ' limit 1'));
    if (res.rows.length) throw conflict(`${def.label} is in use and cannot be deleted — mark it inactive instead`);
  }
  const t = def.table;
  await ctx.db.delete(t).where(and(eq(col(t, 'id'), id), eq(col(t, 'companyId'), ctx.companyId)));
  await audit(ctx, def.slug, id, 'DELETE', `${def.label} ${(existing.name ?? existing.number ?? existing.code) as string} deleted`);
  return { ok: true };
}
