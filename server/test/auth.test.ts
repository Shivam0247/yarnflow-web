import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, getApp, login, makeUser, makeWorld, type World } from './helpers.js';

let w: World;
beforeAll(async () => {
  w = await makeWorld('Auth');
});
afterAll(async () => (await getApp()).close());

describe('authentication', () => {
  it('logs in and returns the profile with companies and financial years', async () => {
    const c = new Client(w.app);
    const r = await c.post('/auth/login', { email: w.admin.email, password: w.admin.password });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeTruthy();
    expect(r.body.user.role).toBe('ADMIN');
    expect(r.body.user.companies[0].financialYears[0].label).toBe('26-27');
  });

  it('rejects a wrong password', async () => {
    const r = await new Client(w.app).post('/auth/login', { email: w.admin.email, password: 'nope' });
    expect(r.status).toBe(401);
    expect(r.body.error.message).toMatch(/wrong email or password/i);
  });

  it('validates the login body', async () => {
    const r = await new Client(w.app).post('/auth/login', { email: 'not-an-email' });
    expect(r.status).toBe(422);
  });

  it('requires a token on protected routes', async () => {
    const r = await new Client(w.app, '', w.company.id).get('/masters/accounts');
    expect(r.status).toBe(401);
  });

  it('requires the company header', async () => {
    const r = await new Client(w.app, w.api.token).get('/masters/accounts');
    expect(r.status).toBe(400);
    expect(r.body.error.message).toMatch(/X-Company-Id/);
  });

  it('blocks companies the user has no access to', async () => {
    const other = await makeWorld('Other co');
    const r = await new Client(w.app, w.api.token, other.company.id).get('/masters/accounts');
    expect(r.status).toBe(403);
  });

  it('returns /auth/me', async () => {
    const me = await w.api.ok(w.api.get('/auth/me'));
    expect(me.email).toBe(w.admin.email);
  });

  it('changes the password', async () => {
    const u = await makeUser(w.db, 'SALES', [w.company.id]);
    const c = await login(w.app, u.email, u.password, w.company.id);
    expect((await c.post('/auth/change-password', { currentPassword: 'bad', newPassword: 'NewSecret@1' })).status).toBe(422);
    expect((await c.post('/auth/change-password', { currentPassword: u.password, newPassword: 'NewSecret@1' })).status).toBe(200);
    expect((await new Client(w.app).post('/auth/login', { email: u.email, password: 'NewSecret@1' })).status).toBe(200);
  });

  it('disabled users are signed out immediately', async () => {
    const u = await makeUser(w.db, 'SALES', [w.company.id]);
    const c = await login(w.app, u.email, u.password, w.company.id);
    expect((await c.get('/masters/accounts')).status).toBe(200);
    await w.api.ok(w.api.patch(`/users/${u.id}`, { isActive: false }));
    expect((await c.get('/masters/accounts')).status).toBe(401);
  });
});

describe('users (admin)', () => {
  it('admin can create a user; others cannot', async () => {
    const created = await w.api.ok(w.api.post('/users', { name: 'New Accountant', email: `acc${Date.now()}@t.in`, password: 'Account@123', role: 'ACCOUNTANT' }));
    expect(created.companyIds).toContain(w.company.id);
    const acc = await login(w.app, created.email, 'Account@123', w.company.id);
    expect((await acc.get('/users')).status).toBe(403);
    expect((await acc.post('/users', { name: 'x', email: 'x@t.in', password: 'Account@123', role: 'ADMIN' })).status).toBe(403);
  });

  it('rejects short passwords and duplicate emails', async () => {
    expect((await w.api.post('/users', { name: 'a', email: `s${Date.now()}@t.in`, password: 'short', role: 'SALES' })).status).toBe(422);
    expect((await w.api.post('/users', { name: 'a', email: w.admin.email, password: 'Longenough1', role: 'SALES' })).status).toBe(409);
  });

  it('an admin cannot remove their own admin role', async () => {
    const r = await w.api.patch(`/users/${w.admin.id}`, { role: 'SALES' });
    expect(r.status).toBe(422);
  });
});

describe('companies & financial years', () => {
  it('creates a company with chart of accounts, books and FY', async () => {
    const c = await w.api.ok(w.api.post('/companies', { name: 'New Branch', gstin: '24AAJFU2290K1Z8', fyLabel: '26-27' }));
    const scoped = new Client(w.app, w.api.token, c.id);
    const groups = await scoped.ok(scoped.get('/masters/groups'));
    expect(groups.data.map((g: any) => g.name)).toContain('Sundry Debtors');
    const books = await scoped.ok(scoped.get('/masters/books?voucherType=SALE_BILL'));
    expect(books.data.length).toBeGreaterThan(0);
    const next = await scoped.ok(scoped.get('/vouchers/sales-orders/next-number'));
    expect(next.number).toBe('SAL00001/26-27');
  });

  it('adds a financial year and updates settings', async () => {
    const fy = await w.api.ok(w.api.post('/company/financial-years', { label: '27-28' }));
    expect(fy.startDate).toBe('2027-04-01');
    expect((await w.api.post('/company/financial-years', { label: '27-28' })).status).toBe(409);
    const c = await w.api.ok(w.api.patch('/company', { poApprovalLimit: 250000 }));
    expect(c.poApprovalLimit).toBe(250000);
  });

  it('health check works without login', async () => {
    const r = await new Client(w.app).get('/health');
    expect(r.body.ok).toBe(true);
  });
});
