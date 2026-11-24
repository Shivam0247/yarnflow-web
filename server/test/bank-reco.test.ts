/** Bank reconciliation: clearing dates give the balance as per bank; the books do not change. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, type World } from './helpers.js';

let w: World;
beforeAll(async () => { w = await makeWorld('Bank reco'); });
afterAll(async () => (await getApp()).close());

describe('bank reconciliation', () => {
  it('lists entries, clears them and gives the bank balance', async () => {
    const rc = await w.api.ok(w.api.post('/vouchers/receipts', { date: '2026-06-05', partyId: w.customer.id, bankAccountId: w.bank.id, mode: 'CHEQUE', instrumentNo: '000111', amount: 5000 }));
    const q = `/bank-reco?bankId=${w.bank.id}&from=2026-06-01&to=2026-06-30`;
    const a = await w.api.ok(w.api.get(q));
    expect(a.rows.find((r: any) => r.id === rc.id).deposit).toBe(5000);
    expect(a.balance.bank).toBe(a.balance.book - 5000);
    expect(await w.api.ok(w.api.put('/bank-reco', { entries: [{ id: rc.id, clearedDate: '07-06-2026' }] }))).toEqual({ updated: 1 });
    const b = await w.api.ok(w.api.get(q));
    expect(b.rows.find((r: any) => r.id === rc.id)).toBeUndefined();
    expect(b.balance.bank).toBe(b.balance.book);
    expect((await w.api.ok(w.api.get(q + '&show=all'))).rows.find((r: any) => r.id === rc.id).clearedDate).toBe('07-06-2026');
    expect((await w.api.put('/bank-reco', { entries: [{ id: rc.id, clearedDate: '7/6/26' }] })).status).toBe(422);
  });
});
