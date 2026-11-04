/** Users, companies, financial years. */
import bcrypt from 'bcryptjs';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { Tx } from '../db/index.js';
import { auditLogs, companies, financialYears, userCompanies, users } from '../db/schema.js';
import { fyRange } from '../lib/dates.js';
import { conflict, notFound, unauthorized, unprocessable } from '../lib/errors.js';
import { requireRole, type Ctx, type Role } from './context.js';
import { createCompany } from './setup.js';

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export async function verifyLogin(db: Tx, raw: unknown) {
  const { email, password } = loginSchema.parse(raw);
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u || !u.isActive || !(await bcrypt.compare(password, u.passwordHash))) throw unauthorized('Wrong email or password');
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
  return u;
}

export async function profile(db: Tx, userId: number) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || !u.isActive) throw unauthorized('Account disabled');
  const comps = await accessibleCompanies(db, userId);
  return { id: u.id, name: u.name, email: u.email, mobile: u.mobile, role: u.role as Role, companies: comps };
}

export async function accessibleCompanies(db: Tx, userId: number) {
  const links = await db.select().from(userCompanies).where(eq(userCompanies.userId, userId));
  if (!links.length) return [];
  const cs = await db.select().from(companies).where(inArray(companies.id, links.map((l) => l.companyId))).orderBy(asc(companies.name));
  const fys = await db.select().from(financialYears).where(inArray(financialYears.companyId, cs.map((c) => c.id))).orderBy(desc(financialYears.startDate));
  return cs.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, gstin: c.gstin, city: c.city, stateCode: c.stateCode, financialYears: fys.filter((f) => f.companyId === c.id).map((f) => ({ id: f.id, label: f.label, startDate: f.startDate, endDate: f.endDate, isLocked: f.isLocked })) }));
}

/* ------------------------------------------------------------------ users */
const userBase = {
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  mobile: z.string().trim().max(20).optional().nullable(),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE', 'VIEWER']),
  isActive: z.boolean().optional(),
  companyIds: z.array(z.coerce.number().int().positive()).optional()
};
export const userCreateSchema = z.object({ ...userBase, password: z.string().min(8, 'Password must be at least 8 characters') });
export const userUpdateSchema = z.object({ ...userBase, password: z.string().min(8).optional() }).partial();

const publicUser = (u: typeof users.$inferSelect, companyIds: number[]) => ({ id: u.id, name: u.name, email: u.email, mobile: u.mobile, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt, companyIds });

export async function listUsers(ctx: Ctx) {
  requireRole(ctx, ['ADMIN'], 'manage users');
  const links = await ctx.db.select().from(userCompanies).where(eq(userCompanies.companyId, ctx.companyId));
  if (!links.length) return [];
  const us = await ctx.db.select().from(users).where(inArray(users.id, links.map((l) => l.userId))).orderBy(asc(users.name));
  const all = await ctx.db.select().from(userCompanies).where(inArray(userCompanies.userId, us.map((u) => u.id)));
  return us.map((u) => publicUser(u, all.filter((l) => l.userId === u.id).map((l) => l.companyId)));
}

export async function createUser(ctx: Ctx, raw: unknown) {
  requireRole(ctx, ['ADMIN'], 'manage users');
  const d = userCreateSchema.parse(raw);
  const dup = await ctx.db.select({ id: users.id }).from(users).where(eq(users.email, d.email));
  if (dup.length) throw conflict('A user with this email already exists');
  const [u] = await ctx.db.insert(users).values({ name: d.name, email: d.email, mobile: d.mobile ?? null, role: d.role, isActive: d.isActive ?? true, passwordHash: await bcrypt.hash(d.password, 10) }).returning();
  const cids = d.companyIds?.length ? d.companyIds : [ctx.companyId];
  await ctx.db.insert(userCompanies).values(cids.map((c) => ({ userId: u.id, companyId: c }))).onConflictDoNothing();
  await ctx.db.insert(auditLogs).values({ companyId: ctx.companyId, userId: ctx.userId, entity: 'users', entityId: u.id, action: 'CREATE', summary: `User ${u.email} (${u.role}) created` });
  return publicUser(u, cids);
}

export async function updateUser(ctx: Ctx, id: number, raw: unknown) {
  requireRole(ctx, ['ADMIN'], 'manage users');
  const d = userUpdateSchema.parse(raw);
  const [u] = await ctx.db.select().from(users).where(eq(users.id, id));
  if (!u) throw notFound('User');
  if (id === ctx.userId && (d.role && d.role !== 'ADMIN' || d.isActive === false)) throw unprocessable('You cannot remove your own admin access');
  const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  for (const k of ['name', 'email', 'mobile', 'role', 'isActive'] as const) if (d[k] !== undefined) (patch as Record<string, unknown>)[k] = d[k];
  if (d.password) patch.passwordHash = await bcrypt.hash(d.password, 10);
  await ctx.db.update(users).set(patch).where(eq(users.id, id));
  if (d.companyIds) {
    await ctx.db.delete(userCompanies).where(eq(userCompanies.userId, id));
    if (d.companyIds.length) await ctx.db.insert(userCompanies).values(d.companyIds.map((c) => ({ userId: id, companyId: c })));
  }
  await ctx.db.insert(auditLogs).values({ companyId: ctx.companyId, userId: ctx.userId, entity: 'users', entityId: id, action: 'UPDATE', summary: `User ${u.email} updated` });
  const [nu] = await ctx.db.select().from(users).where(eq(users.id, id));
  const links = await ctx.db.select().from(userCompanies).where(eq(userCompanies.userId, id));
  return publicUser(nu, links.map((l) => l.companyId));
}

export async function changePassword(db: Tx, userId: number, raw: unknown) {
  const d = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, 'New password must be at least 8 characters') }).parse(raw);
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || !(await bcrypt.compare(d.currentPassword, u.passwordHash))) throw unprocessable('Current password is wrong');
  await db.update(users).set({ passwordHash: await bcrypt.hash(d.newPassword, 10), updatedAt: new Date() }).where(eq(users.id, userId));
  return { ok: true };
}

/* ------------------------------------------------------- companies & FYs */
export const companySchema = z.object({
  name: z.string().trim().min(1).max(160),
  shortName: z.string().trim().max(60).optional().nullable(),
  legalName: z.string().trim().max(200).optional().nullable(),
  gstin: z.string().trim().toUpperCase().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'GSTIN format looks wrong').optional().nullable().or(z.literal('').transform(() => null)),
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/).optional().nullable().or(z.literal('').transform(() => null)),
  address1: z.string().max(400).optional().nullable(),
  address2: z.string().max(400).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(60).optional().nullable(),
  stateCode: z.string().regex(/^[0-9]{2}$/).optional(),
  pincode: z.string().regex(/^[0-9]{6}$/).optional().nullable().or(z.literal('').transform(() => null)),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('').transform(() => null)),
  bankName: z.string().max(120).optional().nullable(),
  bankAccountNo: z.string().max(40).optional().nullable(),
  ifsc: z.string().max(15).optional().nullable(),
  poApprovalLimit: z.coerce.number().min(0).optional(),
  ewbThreshold: z.coerce.number().min(0).optional()
});
const fyLabelSchema = z.string().regex(/^[0-9]{2}-[0-9]{2}$/, 'Use a label like 26-27');

export async function addCompany(db: Tx, userId: number, role: Role, raw: unknown) {
  requireRole({ role }, ['ADMIN'], 'create companies');
  const d = companySchema.extend({ fyLabel: fyLabelSchema }).parse(raw);
  const res = await createCompany(db, d as never, userId);
  if (d.poApprovalLimit !== undefined || d.ewbThreshold !== undefined) {
    await db.update(companies).set({ poApprovalLimit: d.poApprovalLimit, ewbThreshold: d.ewbThreshold }).where(eq(companies.id, res.company.id));
  }
  return res.company;
}

export async function getCompany(ctx: Ctx) {
  const [c] = await ctx.db.select().from(companies).where(eq(companies.id, ctx.companyId));
  if (!c) throw notFound('Company');
  return c;
}

export async function updateCompany(ctx: Ctx, raw: unknown) {
  requireRole(ctx, ['ADMIN'], 'edit company settings');
  const d = companySchema.partial().parse(raw);
  await ctx.db.update(companies).set({ ...d, updatedAt: new Date() }).where(eq(companies.id, ctx.companyId));
  return getCompany(ctx);
}

export async function addFinancialYear(ctx: Ctx, raw: unknown) {
  requireRole(ctx, ['ADMIN'], 'add financial years');
  const { label } = z.object({ label: fyLabelSchema }).parse(raw);
  const dup = await ctx.db.select().from(financialYears).where(and(eq(financialYears.companyId, ctx.companyId), eq(financialYears.label, label)));
  if (dup.length) throw conflict(`FY ${label} already exists`);
  const [fy] = await ctx.db.insert(financialYears).values({ companyId: ctx.companyId, label, ...fyRange(label) }).returning();
  return fy;
}

export async function setFyLock(ctx: Ctx, fyId: number, isLocked: boolean) {
  requireRole(ctx, ['ADMIN'], 'lock financial years');
  const [fy] = await ctx.db.select().from(financialYears).where(and(eq(financialYears.id, fyId), eq(financialYears.companyId, ctx.companyId)));
  if (!fy) throw notFound('Financial year');
  await ctx.db.update(financialYears).set({ isLocked, updatedAt: new Date() }).where(eq(financialYears.id, fyId));
  await ctx.db.insert(auditLogs).values({ companyId: ctx.companyId, userId: ctx.userId, entity: 'financial_years', entityId: fyId, action: 'ACTION', summary: `FY ${fy.label} ${isLocked ? 'locked' : 'unlocked'}` });
  return { ...fy, isLocked };
}
