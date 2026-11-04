/**
 * Sales cycle end to end:
 * sales order → (approval) → dispatch schedule → sale bill (GST, ledger, stock)
 * → e-way bill / e-invoice → sale return → order status.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, login, makeUser, makeWorld, postingsOf, stockOf, type World } from './helpers.js';

let w: World;
beforeAll(async () => {
  w = await makeWorld('Sales');
});
afterAll(async () => (await getApp()).close());

const soBody = (w: World, over: Record<string, unknown> = {}) => ({
  date: '2026-10-01',
  partyId: w.customer.id,
  expDeliveryDate: '2026-10-15',
  priority: 'URGENT',
  lines: [{ itemId: w.item.id, brand: 'Reliance', lotNo: 'L1', grade: 'A+', qty: 1000, pcs: 16, rate: 180 }],
  ...over
});

describe('sales order', () => {
  it('numbers, calculates GST and opens within credit limit', async () => {
    const next = await w.api.ok(w.api.get('/vouchers/sales-orders/next-number'));
    const so = await w.api.ok(w.api.post('/vouchers/sales-orders', soBody(w)));
    expect(so.number).toBe(next.number);
    expect(so.status).toBe('OPEN');
    expect(so.taxableAmount).toBe(180000);
    expect(so.cgstAmount).toBe(4500);
    expect(so.netAmount).toBe(189000);
    expect(so.brokerId).toBe(w.broker.id); // defaulted from the party
    expect(so.dueDate).toBe('2026-10-31'); // 30 credit days
    expect(so.lines[0].pendingQty).toBe(1000);
  });

  it('validates input', async () => {
    expect((await w.api.post('/vouchers/sales-orders', { date: '2026-10-01', lines: [] })).status).toBe(422);
    expect((await w.api.post('/vouchers/sales-orders', soBody(w, { lines: [] }))).status).toBe(422);
    expect((await w.api.post('/vouchers/sales-orders', soBody(w, { partyId: w.supplier.id }))).status).toBe(422);
    expect((await w.api.post('/vouchers/sales-orders', soBody(w, { date: '2025-10-01' }))).status).toBe(422); // outside FY
    expect((await w.api.post('/vouchers/sales-orders', soBody(w, { date: '01-10-2026' }))).status).toBe(422);
  });

  it('goes to approval when the credit limit is exceeded; only admins approve', async () => {
    const so = await w.api.ok(w.api.post('/vouchers/sales-orders', soBody(w, { partyId: w.smallCustomer.id })));
    expect(so.status).toBe('PENDING_APPROVAL');
    expect(so.approvals[0].reason).toMatch(/credit limit/i);
    const inbox = await w.api.ok(w.api.get('/approvals'));
    expect(inbox.find((x: any) => x.id === so.id).reasons).toMatch(/credit limit/i);

    // cannot schedule against an order waiting for approval
    const lines = await w.api.ok(w.api.get(`/vouchers/sales-orders/pending-lines?for=dispatch-schedules&partyId=${w.smallCustomer.id}`));
    expect(lines).toHaveLength(0);

    const sales = await makeUser(w.db, 'SALES', [w.company.id]);
    const s = await login(w.app, sales.email, sales.password, w.company.id);
    expect((await s.post(`/vouchers/sales-orders/${so.id}/actions/approve`)).status).toBe(403);
    expect((await w.api.post(`/vouchers/sales-orders/${so.id}/actions/reject`, {})).status).toBe(422); // reason needed
    const ok = await w.api.ok(w.api.post(`/vouchers/sales-orders/${so.id}/actions/approve`, { reason: 'Advance received' }));
    expect(ok.status).toBe('OPEN');
    expect(ok.approvedById).toBe(w.admin.id);
  });

  it('blocks orders for blocked parties and puts on-hold parties in approval', async () => {
    const p = await w.api.ok(w.api.post('/masters/accounts', { name: 'Hold Party', groupId: w.g('Surat Debtors'), kind: 'CUSTOMER', status: 'ON_HOLD' }));
    const so = await w.api.ok(w.api.post('/vouchers/sales-orders', soBody(w, { partyId: p.id })));
    expect(so.status).toBe('PENDING_APPROVAL');
    await w.api.ok(w.api.patch(`/masters/accounts/${p.id}`, { status: 'BLOCKED' }));
    expect((await w.api.post('/vouchers/sales-orders', soBody(w, { partyId: p.id }))).status).toBe(422);
  });
});

describe('dispatch schedule → sale bill', () => {
  let so: any, ds: any, sb: any;

  it('schedules against the order and refuses more than pending', async () => {
    so = await w.api.ok(w.api.post('/vouchers/sales-orders', soBody(w, { lines: [{ itemId: w.item.id, brand: 'Reliance', lotNo: 'L1', grade: 'A+', qty: 2000, pcs: 32, rate: 180 }] })));
    const pl = (await w.api.ok(w.api.get(`/vouchers/sales-orders/pending-lines?for=dispatch-schedules&partyId=${w.customer.id}`))).find((l: any) => l.voucherId === so.id);
    expect(pl.pendingQty).toBe(2000);
    const tooMuch = await w.api.post('/vouchers/dispatch-schedules', { date: '2026-10-02', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 2500, rate: 180, sourceLineId: pl.lineId }] });
    expect(tooMuch.status).toBe(422);
    expect(tooMuch.body.error.message).toMatch(/more than pending/);
    ds = await w.api.ok(w.api.post('/vouchers/dispatch-schedules', { date: '2026-10-02', partyId: w.customer.id, transporterId: w.transporter.id, vehicleNo: 'GJ05AB1234', lines: [{ itemId: w.item.id, brand: 'Reliance', lotNo: 'L1', grade: 'A+', qty: 1200, pcs: 20, rate: 180, sourceLineId: pl.lineId }] }));
    expect(ds.status).toBe('OPEN');
    expect(ds.taxableAmount).toBe(216000);
    expect(ds.cgstAmount).toBe(0); // schedules carry no tax
    expect(ds.source.id).toBe(so.id);
    const again = await w.api.ok(w.api.get(`/vouchers/sales-orders/${so.id}`));
    expect(again.lines[0].scheduledQty).toBe(1200);
  });

  it('rejects a schedule line belonging to another party', async () => {
    const pl = (await w.api.ok(w.api.get(`/vouchers/sales-orders/pending-lines?for=dispatch-schedules&partyId=${w.customer.id}`))).find((l: any) => l.voucherId === so.id);
    const r = await w.api.post('/vouchers/dispatch-schedules', { date: '2026-10-02', partyId: w.outCustomer.id, lines: [{ itemId: w.item.id, qty: 10, rate: 180, sourceLineId: pl.lineId }] });
    expect(r.status).toBe(422);
  });

  it('bills the schedule: GST, double-entry ledger, stock out, statuses', async () => {
    const before = await stockOf(w.db, w.item.id, 'L1');
    const dl = (await w.api.ok(w.api.get(`/vouchers/dispatch-schedules/pending-lines?for=sale-bills&partyId=${w.customer.id}`))).find((l: any) => l.voucherId === ds.id);
    expect(dl.orderNumber).toBe(so.number);
    sb = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-10-03', partyId: w.customer.id, transporterId: w.transporter.id, vehicleNo: 'GJ05AB1234', lrNo: 'NR-41022', distanceKm: 380, lines: [{ itemId: w.item.id, brand: 'Reliance', lotNo: 'L1', grade: 'A+', qty: 1199.5, pcs: 20, rate: 180, sourceLineId: dl.lineId }] }));
    expect(sb.status).toBe('POSTED');
    expect(sb.interState).toBe(false);
    expect(sb.taxableAmount).toBe(215910);
    expect(sb.cgstAmount).toBe(5397.75);
    expect(sb.netAmount).toBe(226706);
    expect(sb.roundOff).toBe(0.5);
    expect(sb.ewbStatus).toBe('PENDING'); // above ₹50,000
    expect(sb.pending).toBe(226706);
    expect(sb.lines[0].sourceLineId).toBe(dl.lineId);

    const post = await postingsOf(w.db, sb.id);
    const dr = post.reduce((a, e) => a + e.debit, 0);
    const cr = post.reduce((a, e) => a + e.credit, 0);
    expect(Math.round(dr * 100)).toBe(Math.round(cr * 100));
    expect(post.find((e) => e.account === 'Surat Weavers')!.debit).toBe(226706);
    expect(post.find((e) => e.account === 'Yarn Sales A/c')!.credit).toBe(215910);
    expect(post.find((e) => e.account === 'Output CGST')!.credit).toBe(5397.75);
    expect(post.find((e) => e.account === 'Round Off')!.credit).toBe(0.5);

    expect(await stockOf(w.db, w.item.id, 'L1')).toBe(before - 1199.5);
    expect((await w.api.ok(w.api.get(`/vouchers/dispatch-schedules/${ds.id}`))).status).toBe('COMPLETED');
    const o = await w.api.ok(w.api.get(`/vouchers/sales-orders/${so.id}`));
    expect(o.status).toBe('PARTIAL');
    expect(o.lines[0].doneQty).toBe(1199.5);
    expect(o.lines[0].pendingQty).toBe(800.5);
  });

  it('shows the order register line-wise with dispatched and pending', async () => {
    const reg = await w.api.ok(w.api.get('/vouchers/sales-orders?view=lines'));
    const row = reg.data.find((r: any) => r.id === so.id);
    expect(row.doneQty).toBe(1199.5);
    expect(row.pendingQty).toBe(800.5);
    expect(row.doneCount).toBe(1);
    expect(row.itemName).toBe('50/24 SD CAT');
    expect(reg.counts.PARTIAL).toBeGreaterThanOrEqual(1);
  });

  it('cannot edit or delete documents that others are built on', async () => {
    expect((await w.api.del(`/vouchers/sales-orders/${so.id}`)).status).toBe(409);
    expect((await w.api.del(`/vouchers/dispatch-schedules/${ds.id}`)).status).toBe(409);
    expect((await w.api.put(`/vouchers/sales-orders/${so.id}`, soBody(w))).status).toBe(409);
  });

  it('bills the rest directly against the order → order completes', async () => {
    const pl = (await w.api.ok(w.api.get(`/vouchers/sales-orders/pending-lines?for=sale-bills&partyId=${w.customer.id}`))).find((l: any) => l.voucherId === so.id);
    expect(pl.pendingQty).toBe(800.5);
    await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-10-04', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 800.5, rate: 180, sourceLineId: pl.lineId }] }));
    expect((await w.api.ok(w.api.get(`/vouchers/sales-orders/${so.id}`))).status).toBe('COMPLETED');
  });

  it('charges IGST to an out-of-state party', async () => {
    const b = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-10-05', partyId: w.outCustomer.id, lines: [{ itemId: w.item2.id, lotNo: 'M1', grade: 'A', qty: 100, rate: 140 }] }));
    expect(b.interState).toBe(true);
    expect(b.igstAmount).toBe(700);
    expect(b.cgstAmount).toBe(0);
    expect(b.ewbStatus).toBe('NOT_REQUIRED'); // ₹14,700 is under the threshold
    const post = await postingsOf(w.db, b.id);
    expect(post.find((e) => e.account === 'Output IGST')!.credit).toBe(700);
  });

  it('refuses to sell more than stock', async () => {
    const r = await w.api.post('/vouchers/sale-bills', { date: '2026-10-05', partyId: w.customer.id, lines: [{ itemId: w.item2.id, lotNo: 'M1', grade: 'A', qty: 99999, rate: 140 }] });
    expect(r.status).toBe(422);
    expect(r.body.error.message).toMatch(/not enough stock/i);
  });

  it('e-way bill: generate, part-B, extend, deliver; e-invoice', async () => {
    expect((await w.api.post(`/eway-bills/${sb.id}/generate`, {})).status).toBe(200);
    const again = await w.api.post(`/eway-bills/${sb.id}/generate`, {});
    expect(again.status).toBe(409);
    const bill = await w.api.ok(w.api.get(`/vouchers/sale-bills/${sb.id}`));
    expect(bill.ewbNo).toMatch(/^\d{12}$/);
    expect(bill.ewbStatus).toBe('GENERATED');
    expect(new Date(bill.ewbValidTill).getTime()).toBeGreaterThan(Date.now() + 24 * 3600 * 1000); // 380 km → 2 days
    const ext = await w.api.ok(w.api.post(`/eway-bills/${sb.id}/extend`, { days: 1 }));
    expect(new Date(ext.ewbValidTill).getTime()).toBeGreaterThan(new Date(bill.ewbValidTill).getTime());
    expect((await w.api.ok(w.api.post(`/eway-bills/${sb.id}/deliver`))).ewbStatus).toBe('DELIVERED');
    const inv = await w.api.ok(w.api.post(`/eway-bills/${sb.id}/einvoice`));
    expect(inv.irn).toHaveLength(64);
    expect((await w.api.post(`/eway-bills/${sb.id}/einvoice`)).status).toBe(409);
    const list = await w.api.ok(w.api.get('/eway-bills'));
    expect(list.data.some((r: any) => r.id === sb.id)).toBe(true);
  });

  it('bulk e-way generation and Part-B pending without a vehicle', async () => {
    const b = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-10-06', partyId: w.customer.id, transporterId: w.transporter.id, lines: [{ itemId: w.item2.id, lotNo: 'M1', grade: 'A', qty: 600, rate: 140 }] }));
    const res = await w.api.ok(w.api.post('/eway-bills/bulk-generate', { ids: [b.id] }));
    expect(res[0].ewbNo).toBeTruthy();
    const got = await w.api.ok(w.api.get(`/vouchers/sale-bills/${b.id}`));
    expect(got.ewbStatus).toBe('PARTB_PENDING');
    expect((await w.api.ok(w.api.post(`/eway-bills/${b.id}/part-b`, { vehicleNo: 'GJ05CT4120' }))).ewbStatus).toBe('GENERATED');
    expect((await w.api.ok(w.api.post(`/eway-bills/${b.id}/cancel`, { reason: 'Wrong vehicle' }))).ewbStatus).toBe('CANCELLED');
  });

  it('sale return: stock back, credit to party, settles the bill', async () => {
    const before = await stockOf(w.db, w.item.id, 'L1');
    const rl = (await w.api.ok(w.api.get(`/vouchers/sale-bills/pending-lines?for=sale-returns&partyId=${w.customer.id}`))).find((l: any) => l.voucherId === sb.id);
    expect(rl.pendingQty).toBe(1199.5);
    expect((await w.api.post('/vouchers/sale-returns', { date: '2026-10-07', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 2000, rate: 180, sourceLineId: rl.lineId }] })).status).toBe(422);
    const sr = await w.api.ok(w.api.post('/vouchers/sale-returns', { date: '2026-10-07', partyId: w.customer.id, reason: 'Quality issue', lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 100, rate: 180, sourceLineId: rl.lineId }] }));
    expect(sr.netAmount).toBe(18900);
    expect(await stockOf(w.db, w.item.id, 'L1')).toBe(before + 100);
    const post = await postingsOf(w.db, sr.id);
    expect(post.find((e) => e.account === 'Surat Weavers')!.credit).toBe(18900);
    expect(post.find((e) => e.account === 'Sales Return A/c')!.debit).toBe(18000);
    const bill = await w.api.ok(w.api.get(`/vouchers/sale-bills/${sb.id}`));
    expect(bill.pending).toBe(226706 - 18900);
    expect(bill.settledBy[0].number).toBe(sr.number);
  });

  it('order actions: close, reopen, cancel, lock', async () => {
    const o = await w.api.ok(w.api.post('/vouchers/sales-orders', soBody(w, { lines: [{ itemId: w.item2.id, qty: 50, rate: 140 }] })));
    expect((await w.api.ok(w.api.post(`/vouchers/sales-orders/${o.id}/actions/close`))).status).toBe('COMPLETED');
    expect((await w.api.ok(w.api.post(`/vouchers/sales-orders/${o.id}/actions/reopen`))).status).toBe('OPEN');
    expect((await w.api.ok(w.api.post(`/vouchers/sales-orders/${o.id}/actions/lock`))).status).toBe('LOCKED');
    expect((await w.api.put(`/vouchers/sales-orders/${o.id}`, soBody(w))).status).toBe(409);
    expect((await w.api.ok(w.api.post(`/vouchers/sales-orders/${o.id}/actions/unlock`))).status).toBe('OPEN');
    expect((await w.api.ok(w.api.post(`/vouchers/sales-orders/${o.id}/actions/cancel`))).status).toBe('CANCELLED');
  });

  it('edits an order (recalculates) and deletes an unused one', async () => {
    const o = await w.api.ok(w.api.post('/vouchers/sales-orders', soBody(w)));
    const u = await w.api.ok(w.api.put(`/vouchers/sales-orders/${o.id}`, soBody(w, { lines: [{ itemId: w.item.id, qty: 500, rate: 200 }] })));
    expect(u.number).toBe(o.number);
    expect(u.taxableAmount).toBe(100000);
    expect((await w.api.del(`/vouchers/sales-orders/${o.id}`)).status).toBe(200);
    expect((await w.api.get(`/vouchers/sales-orders/${o.id}`)).status).toBe(404);
  });

  it('keeps manual numbers unique', async () => {
    await w.api.ok(w.api.post('/vouchers/sales-orders', soBody(w, { number: 'SAL11842/26-27' })));
    expect((await w.api.post('/vouchers/sales-orders', soBody(w, { number: 'SAL11842/26-27' }))).status).toBe(409);
    const found = await w.api.ok(w.api.get('/find?number=SAL11842'));
    expect(found[0].slug).toBe('sales-orders');
  });

  it('purchase role cannot create sales documents', async () => {
    const u = await makeUser(w.db, 'PURCHASE', [w.company.id]);
    const c = await login(w.app, u.email, u.password, w.company.id);
    expect((await c.post('/vouchers/sales-orders', soBody(w))).status).toBe(403);
    expect((await c.get('/vouchers/sales-orders')).status).toBe(200);
  });
});
