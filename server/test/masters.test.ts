import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, login, makeUser, makeWorld, type World } from './helpers.js';

let w: World;
beforeAll(async () => {
  w = await makeWorld('Masters');
});
afterAll(async () => (await getApp()).close());

describe('accounts master', () => {
  it('derives state code and PAN from GSTIN', async () => {
    const a = await w.api.ok(w.api.post('/masters/accounts', { name: 'Laxmi Creation', groupId: w.g('Out-station Debtors'), kind: 'CUSTOMER', gstin: '27aalfl2290m1z1' }));
    expect(a.gstin).toBe('27AALFL2290M1Z1');
    expect(a.stateCode).toBe('27');
    expect(a.pan).toBe('AALFL2290M');
    expect(a.groupName).toBe('Out-station Debtors');
  });

  it('validates GSTIN, PAN, pincode, IFSC and mobile', async () => {
    const base = { name: 'Bad', groupId: w.g('Sundry Debtors'), kind: 'CUSTOMER' };
    for (const bad of [{ gstin: '24ABC' }, { pan: 'ABC' }, { pincode: '39500' }, { ifsc: 'HDFC123' }, { mobile: 'abc' }]) {
      const r = await w.api.post('/masters/accounts', { ...base, ...bad });
      expect(r.status, JSON.stringify(bad)).toBe(422);
    }
    expect((await w.api.post('/masters/accounts', { kind: 'CUSTOMER' })).status).toBe(422);
  });

  it('rejects duplicate names (case-insensitive)', async () => {
    const r = await w.api.post('/masters/accounts', { name: 'SURAT WEAVERS', groupId: w.g('Sundry Debtors'), kind: 'CUSTOMER' });
    expect(r.status).toBe(409);
  });

  it('lists with search, kind filter and balances', async () => {
    const r = await w.api.ok(w.api.get('/masters/accounts?kind=CUSTOMER&q=weav'));
    expect(r.data).toHaveLength(1);
    expect(r.data[0].name).toBe('Surat Weavers');
    const bank = await w.api.ok(w.api.get(`/masters/accounts/${w.bank.id}`));
    expect(bank.balance).toBe(1000000);
    expect(bank.balanceType).toBe('DR');
  });

  it('updates and deletes unused accounts; in-use accounts cannot be deleted', async () => {
    const a = await w.api.ok(w.api.post('/masters/accounts', { name: 'Temp Party', groupId: w.g('Sundry Debtors'), kind: 'CUSTOMER' }));
    const u = await w.api.ok(w.api.patch(`/masters/accounts/${a.id}`, { creditLimit: 100000, status: 'ON_HOLD' }));
    expect(u.creditLimit).toBe(100000);
    expect(u.status).toBe('ON_HOLD');
    expect((await w.api.del(`/masters/accounts/${a.id}`)).status).toBe(200);
    expect((await w.api.get(`/masters/accounts/${a.id}`)).status).toBe(404);
    // the bank has an opening balance but is used by nothing yet → a broker linked from a customer is "in use"
    expect((await w.api.del(`/masters/accounts/${w.broker.id}`)).status).toBe(409);
  });

  it('protects system ledgers', async () => {
    const sys = (await w.api.ok(w.api.get('/masters/accounts?q=Output CGST'))).data[0];
    expect((await w.api.del(`/masters/accounts/${sys.id}`)).status).toBe(409);
    expect((await w.api.patch(`/masters/accounts/${sys.id}`, { groupId: w.g('Sundry Debtors') })).status).toBe(409);
  });
});

describe('groups, items, transporters, others', () => {
  it('shows the group tree with rolled-up counts', async () => {
    const gs = (await w.api.ok(w.api.get('/masters/groups'))).data;
    const debtors = gs.find((g: any) => g.name === 'Sundry Debtors');
    expect(debtors.accountCount).toBeGreaterThanOrEqual(3);
    expect(debtors.subGroupCount).toBe(2);
    const g = await w.api.ok(w.api.post('/masters/groups', { name: 'Ahmedabad Debtors', parentId: debtors.id, nature: 'ASSET', billWise: true }));
    expect(g.parentId).toBe(debtors.id);
    expect((await w.api.patch(`/masters/groups/${g.id}`, { parentId: g.id })).status).toBe(422);
  });

  it('validates yarn items (HSN, GST rate, unique code)', async () => {
    expect((await w.api.post('/masters/items', { code: 'X1', name: 'X', hsn: '54', gstRate: 5 })).status).toBe(422);
    expect((await w.api.post('/masters/items', { code: 'X1', name: 'X', hsn: '5402', gstRate: 7 })).status).toBe(422);
    expect((await w.api.post('/masters/items', { code: 'pfy-5024', name: 'dup', hsn: '5402', gstRate: 5 })).status).toBe(409);
    const items = (await w.api.ok(w.api.get('/masters/items?q=50/24'))).data;
    expect(items[0].stockQty).toBe(5000);
  });

  it('creates transporters, vehicles, godowns, sales persons, cost centers, brands', async () => {
    const t = await w.api.ok(w.api.post('/masters/transporters', { name: 'Jay Ambe Roadlines', transporterId: '24AAKFJ6619L1Z0', rateBasis: 'PER_BOX', rate: 45 }));
    expect(t.rateBasis).toBe('PER_BOX');
    const v = await w.api.ok(w.api.post('/masters/vehicles', { number: 'gj05ab1234', transporterId: t.id }));
    expect(v.number).toBe('GJ05AB1234');
    expect((await w.api.post('/masters/vehicles', { number: 'nonsense' })).status).toBe(422);
    expect((await w.api.post('/masters/godowns', { name: 'Pandesara' })).status).toBe(201);
    expect((await w.api.post('/masters/sales-persons', { name: 'Avi M', mobile: '98250 11111' })).status).toBe(201);
    expect((await w.api.post('/masters/cost-centers', { name: 'Export division' })).status).toBe(201);
    expect((await w.api.post('/masters/brands', { name: 'Reliance' })).status).toBe(201);
    const lk = await w.api.ok(w.api.get('/lookups'));
    expect(lk.customers.map((c: any) => c.name)).toContain('Surat Weavers');
    expect(lk.suppliers.length).toBe(2);
    expect(lk.banks.length).toBeGreaterThanOrEqual(2);
  });

  it('only one default book per voucher type', async () => {
    const b = await w.api.ok(w.api.post('/masters/books', { voucherType: 'SALE_BILL', name: 'Export bills', prefix: 'EXP', isDefault: true }));
    const books = (await w.api.ok(w.api.get('/masters/books?voucherType=SALE_BILL'))).data;
    expect(books.filter((x: any) => x.isDefault).map((x: any) => x.id)).toEqual([b.id]);
  });
});

describe('roles', () => {
  it('viewers are read-only; sales can add parties but not groups', async () => {
    const viewer = await makeUser(w.db, 'VIEWER', [w.company.id]);
    const v = await login(w.app, viewer.email, viewer.password, w.company.id);
    expect((await v.get('/masters/accounts')).status).toBe(200);
    expect((await v.post('/masters/accounts', { name: 'Nope', groupId: w.g('Sundry Debtors'), kind: 'CUSTOMER' })).status).toBe(403);
    const sales = await makeUser(w.db, 'SALES', [w.company.id]);
    const s = await login(w.app, sales.email, sales.password, w.company.id);
    expect((await s.post('/masters/accounts', { name: 'Sales Added Party', groupId: w.g('Sundry Debtors'), kind: 'CUSTOMER' })).status).toBe(201);
    expect((await s.post('/masters/groups', { name: 'Nope', nature: 'ASSET' })).status).toBe(403);
  });
});
