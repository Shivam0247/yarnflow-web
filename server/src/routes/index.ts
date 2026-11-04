/**
 * All REST routes (prefix /api). See docs/API.md for the full reference.
 */
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { RouteKit } from '../app.js';
import {
  accounts, approvalLogs, auditLogs, books, brands, costCenters, godowns, items, salesPersons, transporters, users, vehicles, vouchers
} from '../db/schema.js';
import { badRequest, notFound } from '../lib/errors.js';
import * as admin from '../services/admin.js';
import { requireRole } from '../services/context.js';
import * as docs from '../services/documents.js';
import * as eway from '../services/eway.js';
import { MASTERS, createMaster, deleteMaster, getMaster, listMaster, updateMaster } from '../services/masters.js';
import * as rep from '../services/reports.js';
import { BILL_TYPES, BY_SLUG, TYPES, type VoucherType } from '../services/types.js';

type Q = Record<string, string | undefined>;
const q = (req: FastifyRequest) => req.query as Q;
const p = (req: FastifyRequest) => req.params as Record<string, string>;
const idParam = (req: FastifyRequest) => {
  const id = Number(p(req).id);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid id');
  return id;
};
const typeOf = (req: FastifyRequest) => {
  const def = BY_SLUG[p(req).slug];
  if (!def) throw notFound(`Document type "${p(req).slug}"`);
  return def;
};
const masterOf = (req: FastifyRequest) => {
  const def = MASTERS[p(req).slug];
  if (!def) throw notFound(`Master "${p(req).slug}"`);
  return def;
};

export async function registerRoutes(app: FastifyInstance, kit: RouteKit) {
  const { db, authenticate, read, write } = kit;

  /* ------------------------------------------------------------- auth */
  app.post('/api/auth/login', async (req) => {
    const u = await admin.verifyLogin(db, req.body);
    const token = app.jwt.sign({ sub: u.id, role: u.role });
    return { token, user: await admin.profile(db, u.id) };
  });
  app.get('/api/auth/me', async (req) => {
    await authenticate(req);
    return admin.profile(db, req.auth!.userId);
  });
  app.post('/api/auth/change-password', async (req) => {
    await authenticate(req);
    return admin.changePassword(db, req.auth!.userId, req.body);
  });

  /* ------------------------------------------------- companies & years */
  app.get('/api/companies', async (req) => {
    await authenticate(req);
    return admin.accessibleCompanies(db, req.auth!.userId);
  });
  app.post('/api/companies', async (req, reply) => {
    await authenticate(req);
    const c = await db.transaction((tx) => admin.addCompany(tx, req.auth!.userId, req.auth!.role, req.body));
    reply.status(201);
    return c;
  });
  app.get('/api/company', read((ctx) => admin.getCompany(ctx)));
  app.patch('/api/company', write((ctx, req) => admin.updateCompany(ctx, req.body)));
  app.post('/api/company/financial-years', write((ctx, req) => admin.addFinancialYear(ctx, req.body), 201));
  app.patch('/api/company/financial-years/:id', write((ctx, req) => admin.setFyLock(ctx, idParam(req), z.object({ isLocked: z.boolean() }).parse(req.body).isLocked)));

  /* ------------------------------------------------------------- users */
  app.get('/api/users', read((ctx) => admin.listUsers(ctx)));
  app.post('/api/users', write((ctx, req) => admin.createUser(ctx, req.body), 201));
  app.patch('/api/users/:id', write((ctx, req) => admin.updateUser(ctx, idParam(req), req.body)));

  /* ----------------------------------------------------------- masters */
  app.get('/api/masters/:slug', read((ctx, req) => listMaster(ctx, masterOf(req), q(req) as never)));
  app.get('/api/masters/:slug/:id', read((ctx, req) => getMaster(ctx, masterOf(req), idParam(req))));
  app.post('/api/masters/:slug', write((ctx, req) => createMaster(ctx, masterOf(req), req.body), 201));
  app.patch('/api/masters/:slug/:id', write((ctx, req) => updateMaster(ctx, masterOf(req), idParam(req), req.body)));
  app.delete('/api/masters/:slug/:id', write((ctx, req) => deleteMaster(ctx, masterOf(req), idParam(req))));

  /** everything the entry forms need for their dropdowns, in one call */
  app.get('/api/lookups', read(async (ctx) => {
    const c = ctx.companyId;
    const acc = await db
      .select({ id: accounts.id, name: accounts.name, kind: accounts.kind, city: accounts.city, gstin: accounts.gstin, stateCode: accounts.stateCode, creditDays: accounts.creditDays, creditLimit: accounts.creditLimit, brokerId: accounts.brokerId, transporterId: accounts.transporterId, salesPersonId: accounts.salesPersonId, partyGroupId: accounts.partyGroupId, status: accounts.status, groupId: accounts.groupId })
      .from(accounts)
      .where(and(eq(accounts.companyId, c), ne(accounts.status, 'INACTIVE')))
      .orderBy(asc(accounts.name));
    const by = (...k: string[]) => acc.filter((a) => k.includes(a.kind));
    return {
      customers: by('CUSTOMER'),
      suppliers: by('SUPPLIER'),
      brokers: by('BROKER'),
      banks: by('BANK', 'CASH'),
      ledgers: acc,
      transporters: await db.select().from(transporters).where(and(eq(transporters.companyId, c), ne(transporters.status, 'INACTIVE'))).orderBy(asc(transporters.name)),
      vehicles: await db.select().from(vehicles).where(eq(vehicles.companyId, c)).orderBy(asc(vehicles.number)),
      items: await db.select().from(items).where(and(eq(items.companyId, c), eq(items.isActive, true))).orderBy(asc(items.name)),
      brands: await db.select().from(brands).where(eq(brands.companyId, c)).orderBy(asc(brands.name)),
      godowns: await db.select().from(godowns).where(and(eq(godowns.companyId, c), eq(godowns.isActive, true))).orderBy(asc(godowns.name)),
      salesPersons: await db.select().from(salesPersons).where(and(eq(salesPersons.companyId, c), eq(salesPersons.isActive, true))).orderBy(asc(salesPersons.name)),
      costCenters: await db.select().from(costCenters).where(eq(costCenters.companyId, c)).orderBy(asc(costCenters.name)),
      books: await db.select().from(books).where(and(eq(books.companyId, c), eq(books.isActive, true))).orderBy(asc(books.name))
    };
  }));

  /* ---------------------------------------------------------- vouchers */
  app.get('/api/vouchers/:slug', read((ctx, req) => docs.listDocs(ctx, typeOf(req), q(req) as never)));
  app.get('/api/vouchers/:slug/next-number', read((ctx, req) => docs.peekNumber(ctx, typeOf(req).type, Number(q(req).bookId) || null)));
  /** open lines of this document type that another document can be made from */
  app.get('/api/vouchers/:slug/pending-lines', read((ctx, req) => {
    const forType = BY_SLUG[q(req).for ?? '']?.type;
    if (!forType) throw badRequest('Pass ?for=<document slug>');
    return docs.pendingLines(ctx, typeOf(req).type, forType, Number(q(req).partyId) || undefined);
  }));
  app.get('/api/vouchers/:slug/:id', read((ctx, req) => docs.getDoc(ctx, typeOf(req), idParam(req))));
  app.post('/api/vouchers/:slug', write((ctx, req) => docs.createDoc(ctx, typeOf(req), req.body), 201));
  app.put('/api/vouchers/:slug/:id', write((ctx, req) => docs.updateDoc(ctx, typeOf(req), idParam(req), req.body)));
  app.delete('/api/vouchers/:slug/:id', write((ctx, req) => docs.deleteDoc(ctx, typeOf(req), idParam(req))));
  app.post('/api/vouchers/:slug/:id/actions/:action', write((ctx, req) => docs.docAction(ctx, typeOf(req), idParam(req), p(req).action, (req.body as { reason?: string } | undefined)?.reason)));
  /** find a document by number (any type) — powers "open record" links */
  app.get('/api/find', read(async (ctx, req) => {
    const number = q(req).number;
    if (!number) throw badRequest('Pass ?number=');
    const rows = await db.select({ id: vouchers.id, type: vouchers.type, number: vouchers.number, date: vouchers.date }).from(vouchers).where(and(eq(vouchers.companyId, ctx.companyId), sql`${vouchers.number} ilike ${number + '%'}`)).limit(20);
    return rows.map((r) => ({ ...r, slug: TYPES[r.type as VoucherType].slug }));
  }));

  /* ---------------------------------------------------------- approvals */
  app.get('/api/approvals', read(async (ctx) => {
    const rows = await db
      .select({ id: vouchers.id, type: vouchers.type, number: vouchers.number, date: vouchers.date, status: vouchers.status, netAmount: vouchers.netAmount, totalQty: vouchers.totalQty, partyId: vouchers.partyId, partyName: accounts.name, partyCity: accounts.city, creditLimit: accounts.creditLimit, createdById: vouchers.createdById, approvalNote: vouchers.approvalNote, updatedAt: vouchers.updatedAt })
      .from(vouchers)
      .leftJoin(accounts, eq(accounts.id, vouchers.partyId))
      .where(and(eq(vouchers.companyId, ctx.companyId), inArray(vouchers.status, ['PENDING_APPROVAL', 'REJECTED'])))
      .orderBy(desc(vouchers.date));
    const ids = rows.map((r) => r.id);
    const logs = ids.length ? await db.select({ voucherId: approvalLogs.voucherId, action: approvalLogs.action, reason: approvalLogs.reason, at: approvalLogs.at, userName: users.name }).from(approvalLogs).leftJoin(users, eq(users.id, approvalLogs.userId)).where(inArray(approvalLogs.voucherId, ids)).orderBy(asc(approvalLogs.at)) : [];
    const creators = await db.select({ id: users.id, name: users.name }).from(users);
    const balances = new Map<number, number>();
    for (const r of rows) if (r.partyId && !balances.has(r.partyId)) balances.set(r.partyId, await docs.accountBalance(db, ctx.companyId, r.partyId));
    return rows.map((r) => ({
      ...r,
      slug: TYPES[r.type as VoucherType].slug,
      typeLabel: TYPES[r.type as VoucherType].label,
      partyBalance: r.partyId ? balances.get(r.partyId) : null,
      createdBy: creators.find((u) => u.id === r.createdById)?.name ?? null,
      reasons: logs.filter((l) => l.voucherId === r.id && l.action === 'SUBMITTED').map((l) => l.reason).filter(Boolean).pop() ?? null,
      history: logs.filter((l) => l.voucherId === r.id)
    }));
  }));

  /* ------------------------------------------------------- e-way bills */
  app.get('/api/eway-bills', read(async (ctx, req) => {
    const res = await docs.listDocs(ctx, TYPES.SALE_BILL, { ...q(req), pageSize: Number(q(req).pageSize) || 500 } as never);
    const data = (res.data as Record<string, unknown>[]).filter((r) => r.ewbStatus !== 'NOT_REQUIRED');
    return { ...res, data, total: data.length };
  }));
  app.post('/api/eway-bills/bulk-generate', write((ctx, req) => eway.generateEwbBulk(ctx, z.object({ ids: z.array(z.coerce.number().int()) }).parse(req.body).ids)));
  app.post('/api/eway-bills/:id/generate', write((ctx, req) => eway.generateEwb(ctx, idParam(req), req.body)));
  app.post('/api/eway-bills/:id/part-b', write((ctx, req) => eway.updatePartB(ctx, idParam(req), req.body)));
  app.post('/api/eway-bills/:id/cancel', write((ctx, req) => eway.cancelEwb(ctx, idParam(req), (req.body as { reason?: string } | undefined)?.reason)));
  app.post('/api/eway-bills/:id/extend', write((ctx, req) => eway.extendEwb(ctx, idParam(req), req.body)));
  app.post('/api/eway-bills/:id/deliver', write((ctx, req) => eway.markDelivered(ctx, idParam(req))));
  app.post('/api/eway-bills/:id/einvoice', write((ctx, req) => eway.generateEinvoice(ctx, idParam(req))));

  /* ------------------------------------------------------------ accounts */
  app.get('/api/accounts/:id/open-bills', read((ctx, req) => {
    const side = q(req).side === 'payable' ? 'payable' : 'receivable';
    return docs.openBills(ctx, idParam(req), BILL_TYPES[side], Number(q(req).exclude) || undefined);
  }));
  app.get('/api/accounts/:id/summary', read(async (ctx, req) => {
    const id = idParam(req);
    const [a] = await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.companyId, ctx.companyId)));
    if (!a) throw notFound('Account');
    const balance = await docs.accountBalance(db, ctx.companyId, id);
    const side = a.kind === 'SUPPLIER' ? 'payable' : 'receivable';
    const out = await rep.outstanding(ctx, side, { partyId: id });
    const recent = await db.select({ id: vouchers.id, type: vouchers.type, number: vouchers.number, date: vouchers.date, amount: vouchers.amount, mode: vouchers.mode, netAmount: vouchers.netAmount }).from(vouchers).where(and(eq(vouchers.companyId, ctx.companyId), eq(vouchers.partyId, id))).orderBy(desc(vouchers.date), desc(vouchers.id)).limit(10);
    const fyTotals = await db.execute(sql`select type, count(*) as n, coalesce(sum(net_amount),0) as amt from vouchers where company_id = ${ctx.companyId} and fy_id = ${ctx.fyId} and party_id = ${id} group by type`);
    return {
      account: a,
      balance: Math.abs(balance),
      balanceType: balance >= 0 ? 'DR' : 'CR',
      outstanding: out.totals.total,
      overdue: out.totals.overdue,
      maxOverdueDays: Math.max(0, ...out.bills.map((b) => b.overdueDays)),
      creditUsedPct: a.creditLimit > 0 ? Math.round((Math.max(0, balance) / a.creditLimit) * 100) : null,
      bills: out.bills,
      recent,
      fyTotals: fyTotals.rows.map((r: Record<string, unknown>) => ({ type: r.type, count: Number(r.n), amount: Number(r.amt) }))
    };
  }));

  /* ------------------------------------------------------------- reports */
  app.get('/api/reports/ledger/:id', read((ctx, req) => rep.ledger(ctx, idParam(req), q(req).from, q(req).to)));
  app.get('/api/reports/trial-balance', read((ctx, req) => rep.trialBalance(ctx, q(req).asOn)));
  app.get('/api/reports/profit-loss', read((ctx, req) => rep.profitLoss(ctx, q(req).from, q(req).to)));
  app.get('/api/reports/balance-sheet', read((ctx, req) => rep.balanceSheet(ctx, q(req).asOn)));
  app.get('/api/reports/outstanding', read((ctx, req) => rep.outstanding(ctx, q(req).side === 'payable' ? 'payable' : 'receivable', { asOn: q(req).asOn, partyId: Number(q(req).partyId) || undefined })));
  app.get('/api/reports/stock', read((ctx, req) => rep.stockSummary(ctx, { itemId: Number(q(req).itemId) || undefined, godownId: Number(q(req).godownId) || undefined, asOn: q(req).asOn, q: q(req).q })));
  app.get('/api/reports/stock-ledger/:id', read((ctx, req) => rep.stockLedger(ctx, idParam(req), q(req).from, q(req).to)));
  app.get('/api/reports/gstr1', read(async (ctx, req) => {
    const fy = await docs.loadFy(ctx);
    return rep.gstr1(ctx, q(req).from ?? fy.startDate, q(req).to ?? fy.endDate);
  }));
  app.get('/api/reports/gstr3b', read(async (ctx, req) => {
    const fy = await docs.loadFy(ctx);
    return rep.gstr3b(ctx, q(req).from ?? fy.startDate, q(req).to ?? fy.endDate);
  }));
  app.get('/api/reports/dashboard', read((ctx, req) => rep.dashboard(ctx, q(req).from, q(req).to)));
  app.get('/api/reports/register/:slug', read((ctx, req) => docs.listDocs(ctx, typeOf(req), { ...q(req), pageSize: Number(q(req).pageSize) || 1000 } as never)));

  /* --------------------------------------------------------------- audit */
  app.get('/api/audit', read(async (ctx, req) => {
    requireRole(ctx, ['ADMIN', 'ACCOUNTANT'], 'view the audit log');
    const { entity, entityId, limit } = q(req);
    return db
      .select({ id: auditLogs.id, entity: auditLogs.entity, entityId: auditLogs.entityId, action: auditLogs.action, summary: auditLogs.summary, at: auditLogs.at, userName: users.name })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(and(eq(auditLogs.companyId, ctx.companyId), entity ? eq(auditLogs.entity, entity) : undefined, entityId ? eq(auditLogs.entityId, Number(entityId)) : undefined))
      .orderBy(desc(auditLogs.at))
      .limit(Math.min(Number(limit) || 100, 1000));
  }));
}
