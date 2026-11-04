/**
 * Purchase cycle: purchase order (approval by amount) → purchase bill against
 * the order (TDS 194Q, input GST, stock in) → purchase return → payment.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, postingsOf, stockOf, type World } from './helpers.js';

let w: World;
beforeAll(async () => {
  w = await makeWorld('Purchase');
});
afterAll(async () => (await getApp()).close());

describe('purchase order → bill → return → payment', () => {
  let po: any, pb: any;

  it('needs approval above the company limit', async () => {
    const big = await w.api.ok(w.api.post('/vouchers/purchase-orders', { date: '2026-09-01', partyId: w.supplier.id, lines: [{ itemId: w.item.id, qty: 10000, rate: 165 }] }));
    expect(big.status).toBe('PENDING_APPROVAL');
    expect(big.interState).toBe(true); // Silvassa (26) → Surat (24)
    expect(big.igstAmount).toBe(82500);
    po = await w.api.ok(w.api.post('/vouchers/purchase-orders', { date: '2026-09-01', partyId: w.supplier.id, lines: [{ itemId: w.item.id, brand: 'Reliance', qty: 3000, pcs: 50, rate: 165 }] }));
    expect(po.status).toBe('OPEN');
  });

  it('bills against the order with TDS and posts input IGST', async () => {
    const before = await stockOf(w.db, w.item.id, 'R77');
    const pl = (await w.api.ok(w.api.get(`/vouchers/purchase-orders/pending-lines?for=purchase-bills&partyId=${w.supplier.id}`))).find((l: any) => l.voucherId === po.id);
    pb = await w.api.ok(w.api.post('/vouchers/purchase-bills', { date: '2026-09-10', partyId: w.supplier.id, refNo: 'RIL/INV/7781', refDate: '2026-09-09', lines: [{ itemId: w.item.id, brand: 'Reliance', lotNo: 'R77', grade: 'A+', qty: 2000, pcs: 33, rate: 165, sourceLineId: pl.lineId }] }));
    expect(pb.tdsRate).toBe(0.1); // from the supplier master
    expect(pb.taxableAmount).toBe(330000);
    expect(pb.igstAmount).toBe(16500);
    expect(pb.netAmount).toBe(346500);
    expect(pb.tdsAmount).toBe(330);
    expect(pb.pending).toBe(346170); // payable after TDS
    expect(await stockOf(w.db, w.item.id, 'R77')).toBe(before + 2000);
    const post = await postingsOf(w.db, pb.id);
    expect(post.find((e) => e.account === 'Yarn Purchase A/c')!.debit).toBe(330000);
    expect(post.find((e) => e.account === 'Input IGST')!.debit).toBe(16500);
    expect(post.find((e) => e.account === 'TDS Payable (194Q)')!.credit).toBe(330);
    const sup = post.filter((e) => e.account === 'Silvassa Mills');
    expect(sup.reduce((a, e) => a + e.credit - e.debit, 0)).toBe(346170);
    expect((await w.api.ok(w.api.get(`/vouchers/purchase-orders/${po.id}`))).status).toBe('PARTIAL');
  });

  it('allows a little over-receipt but not too much', async () => {
    const pl = (await w.api.ok(w.api.get(`/vouchers/purchase-orders/pending-lines?for=purchase-bills&partyId=${w.supplier.id}`))).find((l: any) => l.voucherId === po.id);
    expect(pl.pendingQty).toBe(1000);
    expect((await w.api.post('/vouchers/purchase-bills', { date: '2026-09-12', partyId: w.supplier.id, lines: [{ itemId: w.item.id, lotNo: 'R78', qty: 1200, rate: 165, sourceLineId: pl.lineId }] })).status).toBe(422);
    await w.api.ok(w.api.post('/vouchers/purchase-bills', { date: '2026-09-12', partyId: w.supplier.id, lines: [{ itemId: w.item.id, lotNo: 'R78', qty: 1050, rate: 165, sourceLineId: pl.lineId }] }));
    expect((await w.api.ok(w.api.get(`/vouchers/purchase-orders/${po.id}`))).status).toBe('COMPLETED');
  });

  it('purchase return: stock out, debit to supplier, settles the bill', async () => {
    const rl = (await w.api.ok(w.api.get(`/vouchers/purchase-bills/pending-lines?for=purchase-returns&partyId=${w.supplier.id}`))).find((l: any) => l.voucherId === pb.id);
    const pr = await w.api.ok(w.api.post('/vouchers/purchase-returns', { date: '2026-09-15', partyId: w.supplier.id, reason: 'Wrong denier', lines: [{ itemId: w.item.id, lotNo: 'R77', grade: 'A+', qty: 100, rate: 165, sourceLineId: rl.lineId }] }));
    expect(pr.igstAmount).toBe(825);
    expect(pr.netAmount).toBe(17325);
    const post = await postingsOf(w.db, pr.id);
    expect(post.find((e) => e.account === 'Silvassa Mills')!.debit).toBe(17325);
    expect(post.find((e) => e.account === 'Purchase Return A/c')!.credit).toBe(16500);
    expect((await w.api.ok(w.api.get(`/vouchers/purchase-bills/${pb.id}`))).pending).toBe(346170 - 17325);
  });

  it('payment with auto-adjust settles oldest bills first', async () => {
    const open = await w.api.ok(w.api.get(`/accounts/${w.supplier.id}/open-bills?side=payable`));
    expect(open[0].id).toBe(pb.id);
    const pay = await w.api.ok(w.api.post('/vouchers/payments', { date: '2026-09-20', partyId: w.supplier.id, bankAccountId: w.bank.id, mode: 'RTGS', instrumentNo: 'RTGS77812', amount: 400000, autoAdjust: true }));
    expect(pay.allocations[0].billId).toBe(pb.id);
    expect(pay.allocations[0].amount).toBe(346170 - 17325);
    expect(pay.allocations[1].amount).toBe(400000 - (346170 - 17325));
    const post = await postingsOf(w.db, pay.id);
    expect(post.find((e) => e.account === 'HDFC Current')!.credit).toBe(400000);
    const out = await w.api.ok(w.api.get(`/reports/outstanding?side=payable&partyId=${w.supplier.id}&asOn=2026-09-30`));
    expect(out.bills.find((b: any) => b.id === pb.id)).toBeUndefined();
  });

  it('general purchase posts to an expense ledger line', async () => {
    const gp = await w.api.ok(w.api.post('/vouchers/general-purchases', { date: '2026-09-21', partyId: w.localSupplier.id, refNo: 'PK/12', lines: [{ itemId: w.service.id, accountId: w.expense.id, qty: 1, rate: 10000 }] }));
    expect(gp.cgstAmount).toBe(900); // 18% service
    const post = await postingsOf(w.db, gp.id);
    expect(post.find((e) => e.account === 'Office Rent')!.debit).toBe(10000);
    expect(post.find((e) => e.account === 'Input CGST')!.debit).toBe(900);
  });

  it('godown transfer moves stock without changing the total', async () => {
    const g2 = await w.api.ok(w.api.post('/masters/godowns', { name: 'Pandesara' }));
    const total = await stockOf(w.db, w.item2.id);
    const st = await w.api.ok(w.api.post('/vouchers/stock-transfers', { date: '2026-09-22', toGodownId: g2.id, lines: [{ itemId: w.item2.id, lotNo: 'M1', grade: 'A', qty: 300 }] }));
    expect(st.status).toBe('POSTED');
    expect(await stockOf(w.db, w.item2.id)).toBe(total);
    const sum = await w.api.ok(w.api.get(`/reports/stock?itemId=${w.item2.id}&asOn=2026-09-30`));
    expect(sum.rows.find((r: any) => r.godownName === 'Pandesara').qty).toBe(300);
  });
});
