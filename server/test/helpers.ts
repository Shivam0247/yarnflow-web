/**
 * Test kit: builds the real Fastify app against the test database and
 * creates an isolated company ("world") per test file with users,
 * parties, items, opening stock — then talks to it over HTTP (app.inject).
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { createDb, type Db } from '../src/db/index.js';
import { userCompanies, users } from '../src/db/schema.js';
import { clearSysCache, createCompany } from '../src/services/setup.js';

const url = process.env.TEST_DATABASE_URL ?? 'postgres://yarnflow:yarnflow@localhost:5432/yarnflow_test';
let shared: { app: FastifyInstance; db: Db; close: () => Promise<void> } | null = null;

export async function getApp() {
  if (!shared) {
    const { db, pool } = createDb(url);
    clearSysCache();
    const app = await buildApp({ db });
    shared = { app, db, close: async () => { await app.close(); await pool.end(); shared = null; } };
  }
  return shared;
}

export interface Res<T = any> { status: number; body: T }

export class Client {
  constructor(private app: FastifyInstance, public token = '', public companyId = 0, public fyId = 0) {}
  async req<T = any>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Res<T>> {
    const r = await this.app.inject({
      method: method as never,
      url: '/api' + path,
      payload: body === undefined ? undefined : (body as object),
      headers: {
        ...(this.token ? { authorization: 'Bearer ' + this.token } : {}),
        ...(this.companyId ? { 'x-company-id': String(this.companyId) } : {}),
        ...(this.fyId ? { 'x-fy-id': String(this.fyId) } : {}),
        ...headers
      }
    });
    return { status: r.statusCode, body: r.body ? JSON.parse(r.body) : null };
  }
  get<T = any>(p: string) { return this.req<T>('GET', p); }
  post<T = any>(p: string, b?: unknown) { return this.req<T>('POST', p, b ?? {}); }
  put<T = any>(p: string, b: unknown) { return this.req<T>('PUT', p, b); }
  patch<T = any>(p: string, b: unknown) { return this.req<T>('PATCH', p, b); }
  del<T = any>(p: string) { return this.req<T>('DELETE', p); }
  /** expect a 2xx and return the body */
  async ok<T = any>(r: Promise<Res<T>>): Promise<T> {
    const x = await r;
    if (x.status >= 300) throw new Error(`HTTP ${x.status}: ${JSON.stringify(x.body)}`);
    return x.body;
  }
}

let seq = 0;
export async function login(app: FastifyInstance, email: string, password: string, companyId = 0, fyId = 0) {
  const c = new Client(app);
  const r = await c.post('/auth/login', { email, password });
  if (r.status !== 200) throw new Error('login failed ' + JSON.stringify(r.body));
  return new Client(app, r.body.token, companyId, fyId);
}

export async function makeUser(db: Db, role: string, companyIds: number[], password = 'Secret@123') {
  seq += 1;
  const email = `${role.toLowerCase()}${seq}.${Date.now()}@test.in`;
  const [u] = await db.insert(users).values({ name: `${role} ${seq}`, email, role: role as never, passwordHash: await bcrypt.hash(password, 4) }).returning();
  for (const c of companyIds) await db.insert(userCompanies).values({ userId: u.id, companyId: c });
  return { ...u, email, password };
}

/** A fresh company with everything a flow test needs. */
export async function makeWorld(name = 'Test Yarn') {
  const { app, db } = await getApp();
  seq += 1;
  const { company, fy } = await db.transaction((tx) => createCompany(tx, { name: `${name} ${seq}`, gstin: '24AAKCS4471M1Z5', stateCode: '24', city: 'Surat', fyLabel: '26-27' }));
  const admin = await makeUser(db, 'ADMIN', [company.id]);
  const api = await login(app, admin.email, admin.password, company.id, fy.id);
  const lk = await api.ok(api.get('/masters/groups'));
  const g = (n: string) => lk.data.find((x: any) => x.name === n).id;
  const mk = (body: any) => api.ok(api.post('/masters/accounts', body));
  const broker = await mk({ name: 'Test Broker', groupId: g('Brokers'), kind: 'BROKER', stateCode: '24' });
  const customer = await mk({ name: 'Surat Weavers', groupId: g('Surat Debtors'), kind: 'CUSTOMER', gstin: '24AABCK1234F1Z5', city: 'Surat', creditLimit: 5000000, creditDays: 30, brokerId: broker.id });
  const outCustomer = await mk({ name: 'Bhiwandi Looms', groupId: g('Out-station Debtors'), kind: 'CUSTOMER', gstin: '27AALFL2290M1Z1', city: 'Bhiwandi', creditLimit: 5000000, creditDays: 30 });
  const smallCustomer = await mk({ name: 'Small Credit Fab', groupId: g('Surat Debtors'), kind: 'CUSTOMER', gstin: '24ABHPO5521K1Z8', creditLimit: 50000, creditDays: 15 });
  const supplier = await mk({ name: 'Silvassa Mills', groupId: g('Yarn Mills'), kind: 'SUPPLIER', gstin: '26ABCDE1234F1Z9', tdsApplicable: true, tdsRate: 0.1, creditDays: 30 });
  const localSupplier = await mk({ name: 'Surat Yarn Mill', groupId: g('Yarn Mills'), kind: 'SUPPLIER', gstin: '24AAKFB2290Q1Z6', creditDays: 15 });
  const bank = await mk({ name: 'HDFC Current', groupId: g('Bank Accounts'), kind: 'BANK', openingBalance: 1000000, openingType: 'DR' });
  const expense = await mk({ name: 'Office Rent', groupId: g('Indirect Expenses'), kind: 'EXPENSE' });
  const item = await api.ok(api.post('/masters/items', { code: 'PFY-5024', name: '50/24 SD CAT', type: 'FDY', denier: '50', filament: '24', lustre: 'SD', hsn: '5402', gstRate: 5, rate: 180, stdBoxKg: 62 }));
  const item2 = await api.ok(api.post('/masters/items', { code: 'PFY-7536', name: '75/36 FDY', type: 'FDY', denier: '75', filament: '36', hsn: '5402', gstRate: 5, rate: 136 }));
  const service = await api.ok(api.post('/masters/items', { code: 'SRV-1', name: 'Brokerage service', type: 'SERVICE', hsn: '9961', gstRate: 18, unit: 'NOS', isGeneral: true }));
  const transporter = await api.ok(api.post('/masters/transporters', { name: 'Navkar Roadlines', transporterId: '24AAJFN3381Q1Z6', rate: 3.2 }));
  // opening stock: 5,000 kg of lot L1 (A+) and 2,000 kg of 75/36
  await api.ok(api.post('/vouchers/opening-stock', { date: '2026-04-01', lines: [
    { itemId: item.id, lotNo: 'L1', grade: 'A+', brand: 'Reliance', qty: 5000, pcs: 80, rate: 170 },
    { itemId: item2.id, lotNo: 'M1', grade: 'A', brand: 'Reliance', qty: 2000, pcs: 33, rate: 130 }
  ] }));
  return { app, db, api, company, fy, admin, g, broker, customer, outCustomer, smallCustomer, supplier, localSupplier, bank, expense, item, item2, service, transporter };
}

export type World = Awaited<ReturnType<typeof makeWorld>>;

/** Σ debit − Σ credit of a voucher's postings must be 0 */
export async function postingsOf(db: Db, voucherId: number) {
  const r = await db.execute<{ account: string; debit: string; credit: string }>(
    `select a.name as account, e.debit, e.credit from ledger_entries e join accounts a on a.id = e.account_id where e.voucher_id = ${Number(voucherId)} order by e.id` as never
  );
  return r.rows.map((x) => ({ account: x.account, debit: Number(x.debit), credit: Number(x.credit) }));
}

export async function stockOf(db: Db, itemId: number, lotNo?: string) {
  const r = await db.execute<{ q: string }>(`select coalesce(sum(qty_in - qty_out),0) as q from stock_entries where item_id = ${Number(itemId)} ${lotNo ? `and lot_no = '${lotNo.replace(/'/g, "''")}'` : ''}` as never);
  return Number(r.rows[0].q);
}

export { eq };
