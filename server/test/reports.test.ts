/**
 * Debit / credit notes and the business reports: outstanding (all groupings,
 * buckets, basis, on-account), sales analysis, pending orders, brokerage,
 * collections, day book, interest + interest debit notes, group summary, TDS/TCS.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, postingsOf, type World } from './helpers.js';

let w: World;
let sp: any, cp: any, bill: any, bill2: any, outBill: any;
beforeAll(async () => {
  w = await makeWorld('Reports');
  sp = await w.api.ok(w.api.post('/masters/sales-persons', { name: 'Avi M' }));
  cp = await w.api.ok(w.api.post('/masters/sales-persons', { name: 'Prakash (collection)' }));
  await w.api.ok(w.api.patch(`/masters/accounts/${w.customer.id}`, { salesPersonId: sp.id, collectionPersonId: cp.id, interestRate: 18, brokerageRate: 0.5, brokerageType: 'PER_KG' }));
  await w.api.ok(w.api.patch(`/masters/accounts/${w.broker.id}`, { brokerageRate: 0.5 }));
  bill = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-06-01', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 1000, rate: 180 }] }));
  bill2 = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-09-20', partyId: w.customer.id, lines: [{ itemId: w.item2.id, lotNo: 'M1', grade: 'A', qty: 400, rate: 140 }] }));
  outBill = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-10-01', partyId: w.outCustomer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 200, rate: 185 }] }));
  await w.api.ok(w.api.post('/vouchers/sale-returns', { date: '2026-10-05', partyId: w.outCustomer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 20, rate: 185, sourceLineId: outBill.lines[0].id }] }));
});
afterAll(async () => (await getApp()).close());

describe('debit & credit notes', () => {
  it('credit note to a customer against a bill reduces its outstanding (GST reversed)', async () => {
    const cn = await w.api.ok(w.api.post('/vouchers/credit-notes', { date: '2026-06-15', partyId: w.customer.id, sourceId: bill.id, reason: 'Rate difference', lines: [{ description: 'Rate difference ₹2/kg on 1,000 kg', qty: 1000, rate: 2, gstRate: 5 }] }));
    expect(cn.taxableAmount).toBe(2000);
    expect(cn.cgstAmount).toBe(50);
    expect(cn.netAmount).toBe(2100);
    expect(cn.allocations[0].billId).toBe(bill.id);
    const post = await postingsOf(w.db, cn.id);
    expect(post.find((e) => e.account === 'Surat Weavers')!.credit).toBe(2100);
    expect(post.find((e) => e.account === 'Rate Difference & Discount Allowed')!.debit).toBe(2000);
    expect(post.find((e) => e.account === 'Output CGST')!.debit).toBe(50);
    expect((await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill.id}`))).pending).toBe(bill.netAmount - 2100);
  });

  it('debit note to a customer is a receivable bill of its own', async () => {
    const dn = await w.api.ok(w.api.post('/vouchers/debit-notes', { date: '2026-07-01', partyId: w.customer.id, reason: 'Freight recovery', creditDays: 15, lines: [{ description: 'Freight recovered', qty: 1, rate: 1500 }] }));
    expect(dn.netAmount).toBe(1500);
    expect(dn.pending).toBe(1500);
    expect(dn.dueDate).toBe('2026-07-16');
    const open = await w.api.ok(w.api.get(`/accounts/${w.customer.id}/open-bills?side=receivable`));
    expect(open.map((b: any) => b.id)).toContain(dn.id);
    const post = await postingsOf(w.db, dn.id);
    expect(post.find((e) => e.account === 'Surat Weavers')!.debit).toBe(1500);
    expect(post.find((e) => e.account === 'Interest Received')!.credit).toBe(1500);
    // a receipt can settle it
    await w.api.ok(w.api.post('/vouchers/receipts', { date: '2026-07-20', partyId: w.customer.id, bankAccountId: w.bank.id, amount: 1500, allocations: [{ billId: dn.id, amount: 1500 }] }));
    expect((await w.api.ok(w.api.get(`/vouchers/debit-notes/${dn.id}`))).pending).toBe(0);
  });

  it('debit note to a supplier settles their bill; credit note from a supplier is payable', async () => {
    const pb = await w.api.ok(w.api.post('/vouchers/purchase-bills', { date: '2026-08-01', partyId: w.localSupplier.id, refNo: 'SYM/101', lines: [{ itemId: w.item.id, lotNo: 'S1', qty: 500, rate: 160 }] }));
    const dn = await w.api.ok(w.api.post('/vouchers/debit-notes', { date: '2026-08-05', partyId: w.localSupplier.id, sourceId: pb.id, reason: 'Short weight', lines: [{ description: 'Short weight 10 kg', qty: 10, rate: 160, gstRate: 5 }] }));
    expect(dn.netAmount).toBe(1680);
    expect(dn.pending).toBeNull(); // settlement, not a bill
    const post = await postingsOf(w.db, dn.id);
    expect(post.find((e) => e.account === 'Surat Yarn Mill')!.debit).toBe(1680);
    expect(post.find((e) => e.account === 'Input CGST')!.credit).toBe(40);
    expect((await w.api.ok(w.api.get(`/vouchers/purchase-bills/${pb.id}`))).pending).toBe(pb.netAmount - 1680);
    const cn = await w.api.ok(w.api.post('/vouchers/credit-notes', { date: '2026-08-06', partyId: w.localSupplier.id, reason: 'Late payment interest', lines: [{ description: 'Interest', qty: 1, rate: 800 }] }));
    expect(cn.pending).toBe(800);
    const pay = await w.api.ok(w.api.get(`/accounts/${w.localSupplier.id}/open-bills?side=payable`));
    expect(pay.map((b: any) => b.id)).toEqual(expect.arrayContaining([pb.id, cn.id]));
  });

  it('a note cannot be made against another party’s bill', async () => {
    const r = await w.api.post('/vouchers/credit-notes', { date: '2026-08-06', partyId: w.outCustomer.id, sourceId: bill.id, lines: [{ description: 'x', qty: 1, rate: 10 }] });
    expect(r.status).toBe(422);
  });
});

describe('outstanding — groupings, buckets, on account', () => {
  it('party-wise with default buckets; net = ledger balance', async () => {
    const out = await w.api.ok(w.api.get('/reports/outstanding?side=receivable&asOn=2026-10-31'));
    expect(out.bucketLabels).toEqual(['0–30 days', '31–60 days', '61–90 days', '91–180 days', '180+ days']);
    const p = out.parties.find((x: any) => x.partyName === 'Surat Weavers');
    expect(p.billsPending).toBe(bill.netAmount - 2100 + bill2.netAmount);
    expect(p.buckets[3]).toBe(bill.netAmount - 2100); // 152 days
    expect(p.buckets[1]).toBe(bill2.netAmount); // 41 days
    const led = await w.api.ok(w.api.get(`/reports/ledger/${w.customer.id}?to=2026-10-31`));
    expect(p.net).toBe(led.closing);
    expect(p.onAccount).toBe(0);
    expect(out.totals.buckets.reduce((a: number, b: number) => a + b, 0)).toBe(out.totals.billsPending);
  });

  it('unadjusted receipts show as on-account', async () => {
    await w.api.ok(w.api.post('/vouchers/receipts', { date: '2026-10-10', partyId: w.outCustomer.id, bankAccountId: w.bank.id, amount: 5000 }));
    const out = await w.api.ok(w.api.get(`/reports/outstanding?side=receivable&partyId=${w.outCustomer.id}&asOn=2026-10-31`));
    const p = out.parties[0];
    expect(p.onAccount).toBe(-5000);
    expect(p.net).toBe(p.billsPending - 5000);
  });

  it('groups by account group, sales person, collection person, broker, city', async () => {
    for (const [g, key] of [['group', 'Surat Debtors'], ['salesPerson', 'Avi M'], ['collectionPerson', 'Prakash (collection)'], ['broker', 'Test Broker'], ['city', 'Surat'], ['partyGroup', 'Surat Weavers']]) {
      const out = await w.api.ok(w.api.get(`/reports/outstanding?side=receivable&groupBy=${g}&asOn=2026-10-31`));
      expect(out.groupBy).toBe(g);
      const grp = out.groups.find((x: any) => x.key === key);
      expect(grp, `${g} → ${key}`).toBeTruthy();
      expect(grp.parties.map((p: any) => p.partyName)).toContain('Surat Weavers');
    }
    const out = await w.api.ok(w.api.get('/reports/outstanding?side=receivable&groupBy=collectionPerson&asOn=2026-10-31'));
    expect(out.groups.find((x: any) => x.key === '(not set)').parties.map((p: any) => p.partyName)).toContain('Bhiwandi Looms');
  });

  it('custom buckets, due-date basis, filters and overdue only', async () => {
    const out = await w.api.ok(w.api.get(`/reports/outstanding?side=receivable&buckets=15,45&basis=due&asOn=2026-10-31&salesPersonId=${sp.id}`));
    expect(out.bucketLabels).toEqual(['0–15 days', '16–45 days', '45+ days']);
    expect(out.parties.map((p: any) => p.partyName)).toEqual(['Surat Weavers']);
    expect(out.basis).toBe('due');
    const od = await w.api.ok(w.api.get('/reports/outstanding?side=receivable&overdueOnly=1&asOn=2026-10-10'));
    expect(od.bills.every((b: any) => b.overdueDays > 0)).toBe(true);
    const old = await w.api.ok(w.api.get('/reports/outstanding?side=receivable&minDays=90&asOn=2026-10-31'));
    expect(old.bills.map((b: any) => b.id)).toEqual([bill.id]);
  });

  it('payables include supplier credit notes', async () => {
    const out = await w.api.ok(w.api.get('/reports/outstanding?side=payable&asOn=2026-10-31'));
    const p = out.parties.find((x: any) => x.partyName === 'Surat Yarn Mill');
    expect(p.bills).toBe(2);
  });
});

describe('analysis reports', () => {
  it('sales analysis by party, item, month and two levels', async () => {
    const byParty = await w.api.ok(w.api.get('/reports/sales-analysis?groupBy=party'));
    const sw = byParty.rows.find((r: any) => r.label === 'Surat Weavers');
    expect(sw.qty).toBe(1400);
    expect(sw.taxable).toBe(180000 + 56000);
    const bl = byParty.rows.find((r: any) => r.label === 'Bhiwandi Looms');
    expect(bl.qty).toBe(180); // 200 sold − 20 returned
    expect(bl.returns).toBe(3700);
    const byItem = await w.api.ok(w.api.get('/reports/sales-analysis?groupBy=item'));
    expect(byItem.rows.find((r: any) => r.label === '50/24 SD CAT').qty).toBe(1180);
    const byMonth = await w.api.ok(w.api.get('/reports/sales-analysis?groupBy=month'));
    expect(byMonth.rows.map((r: any) => r.label)).toEqual(['2026-06', '2026-09', '2026-10']);
    const two = await w.api.ok(w.api.get('/reports/sales-analysis?groupBy=salesPerson,item'));
    expect(two.labels).toEqual(['Sales person', 'Item']);
    expect(two.rows.find((r: any) => r.keys[0] === 'Avi M' && r.keys[1] === '75/36 FDY').qty).toBe(400);
    expect((await w.api.get('/reports/sales-analysis?groupBy=nonsense')).status).toBe(422);
    const pur = await w.api.ok(w.api.get('/reports/sales-analysis?side=purchase&groupBy=party'));
    expect(pur.rows[0].label).toBe('Surat Yarn Mill');
  });

  it('pending orders by party / item', async () => {
    const so = await w.api.ok(w.api.post('/vouchers/sales-orders', { date: '2026-10-01', partyId: w.customer.id, expDeliveryDate: '2026-10-10', lines: [{ itemId: w.item.id, qty: 750, rate: 182 }] }));
    // the party has a bill overdue by more than 30 days → the order waits for approval
    expect(so.status).toBe('PENDING_APPROVAL');
    expect(so.approvals[0].reason).toMatch(/overdue/);
    await w.api.ok(w.api.post(`/vouchers/sales-orders/${so.id}/actions/approve`, { reason: 'Cheque promised' }));
    const r = await w.api.ok(w.api.get('/reports/pending-orders?type=sales&groupBy=party&asOn=2026-10-31'));
    const g = r.groups.find((x: any) => x.key === 'Surat Weavers');
    expect(g.pending).toBe(750);
    expect(g.value).toBe(136500);
    expect(g.lines[0].late).toBe(true);
  });

  it('brokerage per broker (₹/kg)', async () => {
    const r = await w.api.ok(w.api.get('/reports/brokerage'));
    const b = r.brokers.find((x: any) => x.brokerName === 'Test Broker');
    expect(b.qty).toBe(1400);
    expect(b.brokerage).toBe(700);
  });

  it('collections by collection person and mode', async () => {
    await w.api.ok(w.api.post('/vouchers/receipts', { date: '2026-10-12', partyId: w.customer.id, bankAccountId: w.bank.id, mode: 'CHEQUE', amount: 50000, autoAdjust: true }));
    const r = await w.api.ok(w.api.get('/reports/collections?groupBy=collectionPerson'));
    expect(r.groups.find((g: any) => g.key === 'Prakash (collection)').amount).toBe(51500);
    const m = await w.api.ok(w.api.get('/reports/collections?groupBy=mode'));
    expect(m.groups.find((g: any) => g.key === 'CHEQUE').amount).toBe(50000);
  });

  it('day book lists every voucher of the day', async () => {
    const r = await w.api.ok(w.api.get('/reports/day-book?from=2026-10-01&to=2026-10-05'));
    expect(r.rows.map((x: any) => x.number)).toContain(outBill.number);
    expect(r.summary.find((s: any) => s.type === 'SALE_RETURN').count).toBe(1);
  });

  it('interest on overdue bills and one-click interest debit notes', async () => {
    const r = await w.api.ok(w.api.get(`/reports/interest?asOn=2026-10-31&partyId=${w.customer.id}`));
    const b = r.bills.find((x: any) => x.id === bill.id);
    // due 01-07 (30 days credit) → 122 days overdue at 18%
    expect(b.overdueDays).toBe(122);
    expect(b.interest).toBe(Math.round(b.pending * 18 * 122 / 365) / 100);
    const notes = await w.api.ok(w.api.post('/reports/interest/debit-notes', { asOn: '2026-10-31', partyIds: [w.customer.id] }));
    expect(notes).toHaveLength(1);
    expect(notes[0].netAmount).toBe(Math.round(r.parties[0].interest));
    expect(notes[0].narration).toContain(bill.number);
  });

  it('group summary drills from primary groups to accounts', async () => {
    const top = await w.api.ok(w.api.get('/reports/group-summary?asOn=2026-10-31'));
    const ca = top.rows.find((r: any) => r.name === 'Current Assets');
    expect(ca.kind).toBe('group');
    const debtors = await w.api.ok(w.api.get(`/reports/group-summary?asOn=2026-10-31&groupId=${w.g('Surat Debtors')}`));
    expect(debtors.rows.find((r: any) => r.name === 'Surat Weavers').closingType).toBe('DR');
  });

  it('TDS / TCS register', async () => {
    await w.api.ok(w.api.post('/vouchers/purchase-bills', { date: '2026-08-02', partyId: w.supplier.id, refNo: 'RIL/1', lines: [{ itemId: w.item.id, lotNo: 'T1', qty: 100, rate: 160 }] }));
    const r = await w.api.ok(w.api.get('/reports/tds-tcs'));
    expect(r.tds[0].tds).toBe(16);
    expect(r.totalTds).toBe(16);
  });
});
