/**
 * All REST routes (prefix /api). See docs/API.md for the full reference.
 */
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { RouteKit } from '../app.js';
import {
  accounts, approvalLogs, auditLogs, books, brands, costCenters, godowns, items, persons, transporters, users, vehicles, vouchers
} from '../db/schema.js';
import { badRequest, notFound } from '../lib/errors.js';
import * as admin from '../services/admin.js';
import { requireRole } from '../services/context.js';
import * as bankreco from '../services/bankreco.js';
import * as docs from '../services/documents.js';
import * as eway from '../services/eway.js';
import { printData } from '../services/print.js';
import * as oldrep from '../services/oldreports.js';
import { outstandingFilters, outstandingPrint } from '../services/outstandingPrint.js';
import * as savedq from '../services/savedQueries.js';
import * as trading from '../services/trading.js';
import { MASTERS, createMaster, deleteMaster, getMaster, listMaster, updateMaster } from '../services/masters.js';
import * as rep from '../services/reports.js';
import * as assistant from '../services/assistant.js';
import * as tables from '../services/tables.js';
import * as an from '../services/analysis.js';
import * as wa from '../services/whatsapp.js';
import * as wac from '../services/waCloud.js';
import * as mail from '../services/email.js';
import * as share from '../services/share.js';
import { mastersVersion, memo } from '../lib/cache.js';
import type { Ctx } from '../services/context.js';
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
  const { db, authenticate, read, write, scope } = kit;

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

  /**
   * Everything the entry forms need for their dropdowns, in one call.
   * compact=1 (what the app uses): masters only, built once per master version and sent with an ETag, so a
   * browser that already has this version gets a 304 instead of ~1.4 MB again. Balances change with every
   * document, so they come separately from /api/lookups/balances.
   */
  app.get('/api/lookups', async (req, reply) => {
    const ctx: Ctx = { ...(await scope(req)), db };
    if ((req.query as Record<string, string>).compact !== '1') {
      return memo(`lookups|${ctx.mcId}|${ctx.companyId}|${ctx.period}|false`, 600_000, () => lookupsNow(ctx, false));
    }
    const ver = mastersVersion();
    const tag = `"m${ver}-${ctx.mcId}-${ctx.companyId}"`;
    reply.header('Cache-Control', 'private, no-cache');
    reply.header('ETag', tag);
    // proxies that compress may mark the tag weak or add a suffix, so compare on the version itself
    if (String(req.headers['if-none-match'] ?? '').includes(tag.slice(1, -1))) return reply.status(304).send();
    const out = await memo(`masters|${ctx.mcId}|${ctx.companyId}`, 24 * 3_600_000, () => lookupsNow(ctx, true), { masters: true });
    return { ...out, ver };
  });
  /** closing balance (Dr +) of every account in the selected company and ledger period: { ids, b } */
  app.get('/api/lookups/balances', read((ctx) => memo(`balances|${ctx.companyId}|${ctx.period}`, 600_000, async () => {
    const r = await db.execute<{ id: number; b: string }>(sql`
      select account_id as id, round(sum(debit - credit), 2) as b from ledger_entries
      where company_id = ${ctx.companyId} and ledger_period = ${ctx.period} group by account_id having sum(debit - credit) <> 0`);
    return { ids: r.rows.map((x) => Number(x.id)), b: r.rows.map((x) => Number(x.b)) };
  })));
  async function lookupsNow(ctx: Ctx, compact: boolean) {
    const c = ctx.mcId; // masters are shared by the companies of one business
    const acc = await db
      .select({ id: accounts.id, code: sql<string>`coalesce(${accounts.extra}->>'P_Id', ${accounts.code})`, name: accounts.name, kind: accounts.kind, city: accounts.city, area: accounts.area, address1: accounts.address1, mobile: accounts.mobile, contactPerson: accounts.contactPerson, gstin: accounts.gstin, stateCode: accounts.stateCode, creditDays: accounts.creditDays, creditLimit: accounts.creditLimit, brokerId: accounts.brokerId, brokerageRate: accounts.brokerageRate, brokerageType: accounts.brokerageType, transporterId: accounts.transporterId, salesPersonId: accounts.salesPersonId, collectionPersonId: accounts.collectionPersonId, partyGroupId: accounts.partyGroupId, status: accounts.status, groupId: accounts.groupId, tdsApplicable: accounts.tdsApplicable, tdsRate: accounts.tdsRate, tcsApplicable: accounts.tcsApplicable })
      .from(accounts)
      .where(and(eq(accounts.companyId, c), ne(accounts.status, 'INACTIVE')))
      .orderBy(asc(accounts.name));
    // closing balance (Dr +) of every account in the selected company and ledger period, in one query
    // (the compact answer has no balances: they come from /api/lookups/balances)
    const bal = compact ? { rows: [] as { id: number; b: string }[] } : await db.execute<{ id: number; b: string }>(sql`
      select account_id as id, sum(debit - credit) as b from ledger_entries
      where company_id = ${ctx.companyId} and ledger_period = ${ctx.period} group by account_id`);
    const bm = new Map(bal.rows.map((r) => [Number(r.id), Number(r.b)]));
    const pgNames = new Map((await db.select({ id: persons.id, name: persons.name }).from(persons).where(and(eq(persons.companyId, c), eq(persons.role, 'PARTY_GROUP')))).map((p) => [p.id, p.name]));
    const company = (await db.execute(sql`select state_code as "stateCode" from companies where id = ${ctx.companyId}`)).rows[0];
    const accR = acc.map((a) => ({ ...a, balance: Math.round(((bm.get(a.id) ?? 0) + 0) * 100) / 100, partyGroupName: a.partyGroupId ? pgNames.get(a.partyGroupId) ?? null : null }));
    const by = (...k: string[]) => accR.filter((a) => k.includes(a.kind));
    // timestamps and the raw old-software fields (extra) are not used by any dropdown: leave them out
    const strip = <T extends Record<string, unknown>>(rows: T[]) => rows.map(({ createdAt, updatedAt, extra, ...r }) => r);
    if (compact) {
      // every account once, as columns + rows (each field name sent once). The extra columns are the ones the
      // old software's party lists showed: office address, office no., email, PAN, state, group, company.
      // the old data has placeholders ('0', ',', '-'): anything without a letter or digit is empty
      const clean = (x: unknown) => sql`(case when trim(${x}) ~ '[[:alnum:]]' and trim(${x}) <> '0' then trim(${x}) end)`;
      const more = await db.execute<Record<string, unknown>>(sql`
        select a.id, nullif(${clean(sql`a.extra->'_contact'->>'P_OAdd'`)}, trim(a.address1)) as "oAddress", ${clean(sql`a.extra->'_contact'->>'P_OTel'`)} as "officeNo",
               coalesce(${clean(sql`a.extra->'_contact'->>'P_OMobile'`)}, ${clean(sql`a.extra->>'P_OMobile'`)}) as "oMobile",
               coalesce(${clean(sql`a.email`)}, ${clean(sql`a.extra->'_contact'->>'P_Email'`)}) as email, ${clean(sql`a.pan`)} as pan,
               a.state, g.name as "groupName", co.name as "companyName"
        from accounts a join account_groups g on g.id = a.group_id
        left join companies co on co.legacy_code = a.extra->>'ComCode'
        where a.company_id = ${c} and a.status <> 'INACTIVE'`);
      const mm = new Map(more.rows.map((r) => [Number(r.id), r]));
      // office address only where it differs from address1; party group name comes from partyGroups on the client
      const rows = accR.map(({ balance, partyGroupName, ...a }) => ({ ...a, ...mm.get(a.id), id: a.id }));
      const cols = Object.keys(rows[0] ?? {});
      return {
        ledgers: { cols, rows: rows.map((r) => cols.map((k) => (r as Record<string, unknown>)[k] ?? null)) },
        companyStateCode: company?.stateCode ?? '24',
        transporters: strip(await db.select().from(transporters).where(and(eq(transporters.companyId, c), ne(transporters.status, 'INACTIVE'))).orderBy(asc(transporters.name))),
        vehicles: strip(await db.select().from(vehicles).where(eq(vehicles.companyId, c)).orderBy(asc(vehicles.number))),
        items: strip(await db.select().from(items).where(and(eq(items.companyId, c), eq(items.isActive, true))).orderBy(asc(items.name))),
        brands: strip(await db.select().from(brands).where(eq(brands.companyId, c)).orderBy(asc(brands.name))),
        godowns: strip(await db.select().from(godowns).where(and(eq(godowns.companyId, c), eq(godowns.isActive, true))).orderBy(asc(godowns.name))),
        persons: strip(await db.select().from(persons).where(and(eq(persons.companyId, c), inArray(persons.role, ['COLLECTOR', 'SALES_PERSON', 'BROKER']))).orderBy(asc(persons.name))),
        partyGroups: await db.select({ id: persons.id, name: persons.name, code: persons.code }).from(persons).where(and(eq(persons.companyId, c), eq(persons.role, 'PARTY_GROUP'))).orderBy(asc(persons.name)),
        costCenters: strip(await db.select().from(costCenters).where(eq(costCenters.companyId, c)).orderBy(asc(costCenters.name))),
        books: strip(await db.select().from(books).where(and(eq(books.companyId, c), eq(books.isActive, true))).orderBy(asc(books.name)))
      };
    }
    return {
      customers: by('CUSTOMER'),
      suppliers: by('SUPPLIER'),
      brokerAccounts: by('BROKER'),
      /** trading parties: every account that is not a book / bank / cash / tax ledger */
      parties: accR.filter((a) => !['BANK', 'CASH', 'TAX', 'SALES', 'PURCHASE'].includes(a.kind)),
      banks: by('BANK', 'CASH'),
      ledgers: accR,
      companyStateCode: company?.stateCode ?? '24',
      transporters: await db.select().from(transporters).where(and(eq(transporters.companyId, c), ne(transporters.status, 'INACTIVE'))).orderBy(asc(transporters.name)),
      vehicles: await db.select().from(vehicles).where(eq(vehicles.companyId, c)).orderBy(asc(vehicles.number)),
      items: await db.select().from(items).where(and(eq(items.companyId, c), eq(items.isActive, true))).orderBy(asc(items.name)),
      brands: await db.select().from(brands).where(eq(brands.companyId, c)).orderBy(asc(brands.name)),
      godowns: await db.select().from(godowns).where(and(eq(godowns.companyId, c), eq(godowns.isActive, true))).orderBy(asc(godowns.name)),
      collectionPersons: await db.select().from(persons).where(and(eq(persons.companyId, c), inArray(persons.role, ['COLLECTOR', 'SALES_PERSON']))).orderBy(asc(persons.name)),
      salesPersons: await db.select().from(persons).where(and(eq(persons.companyId, c), inArray(persons.role, ['SALES_PERSON', 'COLLECTOR']))).orderBy(asc(persons.name)),
      brokers: await db.select().from(persons).where(and(eq(persons.companyId, c), eq(persons.role, 'BROKER'), eq(persons.isBlocked, false))).orderBy(asc(persons.name)),
      partyGroups: await db.select({ id: persons.id, name: persons.name, code: persons.code }).from(persons).where(and(eq(persons.companyId, c), eq(persons.role, 'PARTY_GROUP'))).orderBy(asc(persons.name)),
      costCenters: await db.select().from(costCenters).where(eq(costCenters.companyId, c)).orderBy(asc(costCenters.name)),
      books: await db.select().from(books).where(and(eq(books.companyId, c), eq(books.isActive, true))).orderBy(asc(books.name))
    };
  }

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
  app.get('/api/vouchers/:slug/:id/print', read((ctx, req) => printData(ctx, typeOf(req), idParam(req))));
  app.get('/api/vouchers/:slug/:id/related', read((ctx, req) => docs.related(ctx, typeOf(req), idParam(req))));
  app.post('/api/vouchers/:slug', write((ctx, req) => docs.createDoc(ctx, typeOf(req), req.body), 201));
  app.put('/api/vouchers/:slug/:id', write((ctx, req) => docs.updateDoc(ctx, typeOf(req), idParam(req), req.body)));
  app.delete('/api/vouchers/:slug/:id', write((ctx, req) => docs.deleteDoc(ctx, typeOf(req), idParam(req))));
  app.patch('/api/vouchers/:slug/:id/extra', write((ctx, req) => docs.setExtra(ctx, typeOf(req), idParam(req), req.body)));
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
    for (const r of rows) if (r.partyId && !balances.has(r.partyId)) balances.set(r.partyId, await docs.accountBalance(ctx, r.partyId));
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
  app.get('/api/bank-reco', read((ctx, req) => bankreco.bankEntries(ctx, q(req) as never)));
  app.put('/api/bank-reco', write((ctx, req) => bankreco.setCleared(ctx, req.body)));
  app.get('/api/accounts/:id/open-bills', read((ctx, req) => {
    const side = q(req).side === 'payable' ? 'payable' : 'receivable';
    return docs.openBills(ctx, idParam(req), side, Number(q(req).exclude) || undefined, { settled: q(req).settled === '1' });
  }));
  app.get('/api/accounts/:id/summary', read(async (ctx, req) => {
    const id = idParam(req);
    const [a] = await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.companyId, ctx.mcId)));
    if (!a) throw notFound('Account');
    const balance = await docs.accountBalance(ctx, id);
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
  /** ?side=receivable|payable&groupBy=party|group|partyGroup|salesPerson|collectionPerson|broker|city|area|state
   *  &basis=bill|due&buckets=30,60,90,180&overdueOnly=1&minDays=&partyId=&groupId=&brokerId=&salesPersonId=&collectionPersonId=&asOn= */
  app.get('/api/reports/outstanding', read((ctx, req) => {
    const x = q(req);
    const n = (k: string) => Number(x[k]) || undefined;
    return rep.outstanding(ctx, x.side === 'payable' ? 'payable' : 'receivable', {
      asOn: x.asOn, partyId: n('partyId'), groupId: n('groupId'), brokerId: n('brokerId'), salesPersonId: n('salesPersonId'), collectionPersonId: n('collectionPersonId'),
      groupBy: (x.groupBy as never) || 'party', basis: x.basis === 'due' ? 'due' : 'bill', overdueOnly: x.overdueOnly === '1' || x.overdueOnly === 'true', minDays: n('minDays'),
      buckets: x.buckets ? x.buckets.split(',').map(Number).filter((v) => v > 0) : undefined
    });
  }));
  app.get('/api/reports/sales-analysis', read((ctx, req) => an.salesAnalysis(ctx, q(req))));
  app.get('/api/reports/pending-orders', read((ctx, req) => an.pendingOrders(ctx, q(req))));
  app.get('/api/reports/brokerage', read((ctx, req) => an.brokerage(ctx, q(req))));
  app.get('/api/reports/collections', read((ctx, req) => an.collections(ctx, q(req))));
  app.get('/api/reports/day-book', read((ctx, req) => an.dayBook(ctx, q(req))));
  app.get('/api/reports/interest', read((ctx, req) => an.interest(ctx, q(req))));
  app.post('/api/reports/interest/debit-notes', write((ctx, req) => an.createInterestNotes(ctx, req.body), 201));
  app.get('/api/reports/group-summary', read((ctx, req) => an.groupSummary(ctx, q(req))));
  app.get('/api/reports/tds-tcs', read((ctx, req) => an.tdsTcs(ctx, q(req))));
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
  app.post('/api/assistant/ask', read((ctx, req) => assistant.ask(ctx, String((req.body as { q?: string } | undefined)?.q ?? ''))));
  app.get('/api/assistant/insights', read((ctx) => assistant.insights(ctx)));
  app.get('/api/outstanding-print', read((ctx, req) => outstandingPrint(ctx, q(req))));
  app.get('/api/reports/sold-unsold', read((ctx, req) => trading.soldUnsold(ctx, q(req))));
  app.get('/api/reports/purchase-stock', read((ctx, req) => trading.purchaseStock(ctx, q(req))));
  app.get('/api/whatsapp/messages', read((ctx, req) => wa.listMessages(ctx, q(req))));
  app.post('/api/whatsapp/messages/:id/sent', write((ctx, req) => wa.markSent(ctx, idParam(req), String((req.body as { status?: string })?.status ?? 'SENT'))));
  // share buttons on documents and the outstanding report
  app.post('/api/share/whatsapp/:id', write((ctx, req) => share.whatsappDoc(ctx, idParam(req))));
  app.post('/api/share/email/:id', write((ctx, req) => share.emailDoc(ctx, idParam(req), (req.body as { to?: string })?.to)));
  app.post('/api/share/outstanding', write((ctx, req) => share.shareOutstanding(ctx, (req.body ?? {}) as never)));
  app.get('/api/email/messages', read((ctx, req) => mail.listEmails(ctx, q(req))));
  app.post('/api/email/messages/:id/retry', write((ctx, req) => mail.setStatus(ctx, idParam(req), 'PENDING')));
  app.post('/api/email/messages/:id/skip', write((ctx, req) => mail.setStatus(ctx, idParam(req), 'SKIPPED')));
  app.post('/api/email/document/:id', write((ctx, req) => mail.queueDocumentEmail(ctx, idParam(req), (req.body ?? {}) as never)));
  app.post('/api/email/queue/:id', write((ctx, req) => mail.enqueueEmailFor(ctx, idParam(req)).then(() => ({ ok: true }))));
  app.get('/api/email/settings', read((ctx) => mail.getSettings(ctx)));
  app.put('/api/email/settings', write((ctx, req) => mail.saveSettings(ctx, (req.body ?? {}) as never)));
  app.post('/api/email/test', write((ctx, req) => mail.testEmail(ctx, String((req.body as { to?: string })?.to ?? ''))));
  app.get('/api/whatsapp/settings', read((ctx) => wac.getSettings(ctx)));
  app.put('/api/whatsapp/settings', write((ctx, req) => wac.saveSettings(ctx, (req.body ?? {}) as never)));
  app.get('/api/whatsapp/cloud/templates', read(async (ctx) => {
    const texts = wac.templateTexts();
    try { return { texts, status: await wac.templateStatus(ctx) }; } catch (e) { return { texts, status: [], error: (e as Error).message }; }
  }));
  app.post('/api/whatsapp/cloud/templates/submit', write((ctx) => wac.submitTemplates(ctx)));
  app.post('/api/whatsapp/cloud/test', write((ctx, req) => wac.testSend(ctx, String((req.body as { to?: string })?.to ?? ''))));
  // Meta webhook: no login (Meta calls it); checked by the verify token / app secret signature
  await app.register(async (r) => {
    r.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    r.get('/api/whatsapp/webhook', async (req, reply) => {
      const ch = await wac.verifyWebhook(db, req.query as Record<string, unknown>);
      return ch === null ? reply.status(403).send('forbidden') : reply.type('text/plain').send(ch);
    });
    r.post('/api/whatsapp/webhook', async (req, reply) => {
      const res = await wac.receiveWebhook(db, req.body as Buffer, req.headers['x-hub-signature-256'] as string | undefined);
      return res.ok ? { ok: true } : reply.status(401).send({ ok: false });
    });
  });
  app.post('/api/whatsapp/claim', write((ctx, req) => { wa.beat(String((req.body as { info?: string })?.info ?? '')); return wa.claim(ctx, Number((req.body as { limit?: number })?.limit) || 10); }));
  app.post('/api/whatsapp/messages/:id/result', write((ctx, req) => wa.report(ctx, idParam(req), (req.body ?? {}) as never)));
  app.post('/api/whatsapp/messages/:id/retry', write((ctx, req) => wa.retry(ctx, idParam(req))));
  app.post('/api/whatsapp/queue/:id', write((ctx, req) => wa.enqueueFor(ctx, idParam(req)).then(() => ({ ok: true }))));
  app.get('/api/whatsapp/templates', read((ctx) => wa.templates(ctx)));
  app.put('/api/whatsapp/templates', write((ctx, req) => wa.saveTemplate(ctx, req.body as never)));
  app.get('/api/saved-queries', read(async (_ctx, req) => { const x = q(req); return savedq.listSaved(x.type || undefined, x.bookLists ? x.bookLists.split(',').map(Number) : undefined); }));
  app.get('/api/manage-desk/stock', read((ctx, req) => { const x = q(req); return savedq.deskStock(ctx, { from: x.from || '2000-04-01', to: x.to || new Date().toISOString().slice(0, 10), companies: x.companies, costCenters: x.costCenters, days: x.days }); }));
  app.get('/api/manage-desk/monthly', read((ctx, req) => { const x = q(req); const to = x.to || new Date().toISOString().slice(0, 10); return savedq.deskMonthly(ctx, { from: x.from || to.slice(0, 8) + '01', to, companies: x.companies, costCenters: x.costCenters }); }));
  app.get('/api/manage-desk/order-status', read((ctx, req) => { const x = q(req); const to = x.to || new Date().toISOString().slice(0, 10); return savedq.deskOrderStatus(ctx, { from: x.from || to.slice(0, 8) + '01', to, companies: x.companies, costCenters: x.costCenters }); }));
  app.get('/api/manage-desk/outstanding', read((ctx, req) => { const x = q(req); return savedq.deskOutstanding(ctx, { from: x.from || '2000-04-01', to: x.to || new Date().toISOString().slice(0, 10), companies: x.companies, costCenters: x.costCenters, type: x.type, layout: x.layout }); }));
  app.get('/api/saved-queries/:id/data', read((ctx, req) => { const x = q(req); return savedq.runSaved(ctx, Number((req.params as { id: string }).id), { from: x.from || '2000-04-01', to: x.to || new Date().toISOString().slice(0, 10), companies: x.companies, costCenters: x.costCenters, type: x.type, status: x.status }); }));
  app.get('/api/reports/purchase-stock-summary', read((ctx, req) => trading.purchaseStockSummary(ctx, q(req))));
  app.get('/api/reports/sold-unsold-brand', read((ctx, req) => trading.soldUnsoldByBrand(ctx, q(req))));
  app.put('/api/reports/purchase-stock/clear', write((ctx, req) => trading.setStockClear(ctx, req.body as { lineIds?: number[]; clear?: boolean })));
  app.get('/api/outstanding-print/filters', read((ctx) => outstandingFilters(ctx)));
  app.get('/api/report-designs', read(async () => oldrep.listDesigns()));
  app.get('/api/report-designs/:id', read(async (ctx, req) => ({ xml: oldrep.designXml(idParam(req)) })));
  app.get('/api/report-designs/:id/data', read((ctx, req) => oldrep.reportData(ctx, idParam(req), q(req))));
  app.get('/api/reports/list', read(async () => Object.entries(tables.REPORTS).map(([key, title]) => ({ key, title }))));
  app.get('/api/reports/table/:key', read((ctx, req) => tables.reportTable(ctx, p(req).key, q(req))));
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
