/** A returned (bounced) cheque: the receipt return opens the bills again, never more than is settled. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, type World } from './helpers.js';

let w: World;
beforeAll(async () => { w = await makeWorld('Receipt return'); });
afterAll(async () => (await getApp()).close());

describe('receipt return', () => {
  it('opens the settled bills again', async () => {
    const bank = w.bank.id;
    const bill = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-06-01', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 100, rate: 180 }] }));
    await w.api.ok(w.api.post('/vouchers/receipts', { date: '2026-06-05', partyId: w.customer.id, bankAccountId: bank, mode: 'CHEQUE', amount: bill.netAmount, allocations: [{ billId: bill.id, amount: bill.netAmount }] }));
    expect((await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill.id}`))).pending).toBe(0);
    const settled = await w.api.ok(w.api.get(`/accounts/${w.customer.id}/open-bills?side=receivable&settled=1`));
    expect(settled.find((b: any) => b.id === bill.id).settled).toBe(bill.netAmount);

    const tooMuch = await w.api.post('/vouchers/receipt-returns', { date: '2026-06-08', partyId: w.customer.id, bankAccountId: bank, mode: 'CHEQUE', amount: bill.netAmount + 100, allocations: [{ billId: bill.id, amount: bill.netAmount + 100 }] });
    expect(tooMuch.status).toBe(422);
    const rr = await w.api.ok(w.api.post('/vouchers/receipt-returns', { date: '2026-06-08', partyId: w.customer.id, bankAccountId: bank, mode: 'CHEQUE', amount: bill.netAmount, allocations: [{ billId: bill.id, amount: bill.netAmount }] }));
    expect(rr.amount).toBe(bill.netAmount);
    expect((await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill.id}`))).pending).toBe(bill.netAmount);
  });
});
