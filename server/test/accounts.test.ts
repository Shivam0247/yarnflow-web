/**
 * Accounts & reports: receipts with bill adjustment, journals, contra,
 * ledger, trial balance, P&L, balance sheet, outstanding & ageing, GST,
 * stock, dashboard, FY lock, company isolation, audit log.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, getApp, login, makeUser, makeWorld, postingsOf, type World } from './helpers.js';

let w: World;
let bill1: any, bill2: any;
beforeAll(async () => {
  w = await makeWorld('Accounts');
  bill1 = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-08-01', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 500, rate: 180 }] }));
  bill2 = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-09-01', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 200, rate: 180 }] }));
});
afterAll(async () => (await getApp()).close());

describe('receipts & bill-wise settlement', () => {
  let rc: any;
  it('adjusts a receipt against chosen bills, rest on account', async () => {
    rc = await w.api.ok(w.api.post('/vouchers/receipts', { date: '2026-09-10', partyId: w.customer.id, bankAccountId: w.bank.id, mode: 'NEFT', instrumentNo: 'UTR4471', amount: 100000, allocations: [{ billId: bill1.id, amount: 90000 }] }));
    expect(rc.status).toBe('POSTED');
    const post = await postingsOf(w.db, rc.id);
    expect(post).toEqual([
      { account: 'HDFC Current', debit: 100000, credit: 0 },
      { account: 'Surat Weavers', debit: 0, credit: 100000 }
    ]);
    expect((await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill1.id}`))).pending).toBe(bill1.netAmount - 90000);
  });

  it('refuses over-adjustment and bills of other parties', async () => {
    expect((await w.api.post('/vouchers/receipts', { date: '2026-09-11', partyId: w.customer.id, bankAccountId: w.bank.id, amount: 1000000, allocations: [{ billId: bill2.id, amount: bill2.netAmount + 1 }] })).status).toBe(422);
    expect((await w.api.post('/vouchers/receipts', { date: '2026-09-11', partyId: w.outCustomer.id, bankAccountId: w.bank.id, amount: 100, allocations: [{ billId: bill2.id, amount: 100 }] })).status).toBe(422);
    expect((await w.api.post('/vouchers/receipts', { date: '2026-09-11', partyId: w.customer.id, amount: 100 })).status).toBe(422); // bank needed
  });

  it('a bill cannot be reduced below what is already received', async () => {
    const r = await w.api.put(`/vouchers/sale-bills/${bill1.id}`, { date: '2026-08-01', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 10, rate: 180 }] });
    expect(r.status).toBe(409);
  });

  it('editing a receipt re-posts and deleting it re-opens the bill', async () => {
    const u = await w.api.ok(w.api.put(`/vouchers/receipts/${rc.id}`, { date: '2026-09-10', partyId: w.customer.id, bankAccountId: w.bank.id, amount: 50000, allocations: [{ billId: bill1.id, amount: 50000 }] }));
    expect(u.amount).toBe(50000);
    expect((await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill1.id}`))).pending).toBe(bill1.netAmount - 50000);
    expect((await w.api.del(`/vouchers/receipts/${rc.id}`)).status).toBe(200);
    expect((await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill1.id}`))).pending).toBe(bill1.netAmount);
  });

  it('outstanding & ageing by party and bill', async () => {
    const out = await w.api.ok(w.api.get('/reports/outstanding?side=receivable&asOn=2026-10-15'));
    const p = out.parties.find((x: any) => x.partyName === 'Surat Weavers');
    expect(p.total).toBe(bill1.netAmount + bill2.netAmount);
    expect(p.d61_90).toBe(bill1.netAmount); // 75 days old
    expect(p.d31_60).toBe(bill2.netAmount); // 44 days old
    expect(p.overdue).toBe(bill1.netAmount + bill2.netAmount); // both past 30 credit days
    const sum = await w.api.ok(w.api.get(`/accounts/${w.customer.id}/summary`));
    expect(sum.outstanding).toBe(p.total);
  });
});

describe('journals & ledgers', () => {
  it('rejects unbalanced or single-line journals', async () => {
    expect((await w.api.post('/vouchers/journals', { date: '2026-09-30', lines: [{ accountId: w.expense.id, debit: 100 }, { accountId: w.bank.id, credit: 90 }] })).status).toBe(422);
    expect((await w.api.post('/vouchers/journals', { date: '2026-09-30', lines: [{ accountId: w.expense.id, debit: 100 }] })).status).toBe(422);
    expect((await w.api.post('/vouchers/journals', { date: '2026-09-30', lines: [{ accountId: w.expense.id, debit: 100, credit: 100 }, { accountId: w.bank.id, credit: 0 }] })).status).toBe(422);
  });

  it('posts a journal and shows a running-balance ledger', async () => {
    await w.api.ok(w.api.post('/vouchers/journals', { date: '2026-09-30', narration: 'Rent for September', lines: [{ accountId: w.expense.id, debit: 25000 }, { accountId: w.bank.id, credit: 25000 }] }));
    await w.api.ok(w.api.post('/vouchers/contras', { date: '2026-09-30', lines: [{ accountId: (await w.api.ok(w.api.get('/masters/accounts?q=Cash'))).data[0].id, debit: 5000 }, { accountId: w.bank.id, credit: 5000 }] }));
    const l = await w.api.ok(w.api.get(`/reports/ledger/${w.bank.id}?from=2026-04-01&to=2027-03-31`));
    expect(l.opening).toBe(1000000);
    expect(l.closing).toBe(970000);
    expect(l.entries.at(-1).balance).toBe(970000);
    expect(l.entries[0].against).toBe('Office Rent');
    const cust = await w.api.ok(w.api.get(`/reports/ledger/${w.customer.id}`));
    expect(cust.closing).toBe(bill1.netAmount + bill2.netAmount);
    expect(cust.closingType).toBe('DR');
  });

  it('trial balance, P&L and balance sheet agree', async () => {
    const tb = await w.api.ok(w.api.get('/reports/trial-balance'));
    // this test company has openings (bank ₹10,00,000 + stock ₹11,10,000) without capital → TB shows exactly that difference
    expect(tb.openingStock).toBe(1110000);
    expect(tb.difference).toBe(2110000);
    const pl = await w.api.ok(w.api.get('/reports/profit-loss'));
    // sold 700 kg @180 that cost 170 (opening stock) → GP = 1,26,000 − 1,19,000 = 7,000
    expect(pl.grossProfit).toBe(7000);
    expect(pl.netProfit).toBe(7000 - 25000);
    const bs = await w.api.ok(w.api.get('/reports/balance-sheet'));
    expect(bs.difference).toBe(tb.difference);
    expect(bs.assets.find((a: any) => a.name === 'Closing stock').amount).toBe(5000 * 170 - 700 * 170 + 2000 * 130);
  });
});

describe('GST, stock & dashboard reports', () => {
  it('GSTR-1 lists B2B invoices and an HSN summary; GSTR-3B nets ITC', async () => {
    const g1 = await w.api.ok(w.api.get('/reports/gstr1?from=2026-04-01&to=2027-03-31'));
    expect(g1.b2b.map((r: any) => r.number)).toContain(bill1.number);
    const hsn = g1.hsn.find((h: any) => h.hsn === '5402');
    expect(hsn.qty).toBe(700);
    expect(hsn.taxable).toBe(126000);
    const g3 = await w.api.ok(w.api.get('/reports/gstr3b?from=2026-04-01&to=2027-03-31'));
    expect(g3.outward.cgst).toBe(3150);
    expect(g3.totalPayable).toBe(6300);
  });

  it('stock summary with value and stock ledger', async () => {
    const s = await w.api.ok(w.api.get(`/reports/stock?itemId=${w.item.id}`));
    expect(s.rows[0].qty).toBe(4300);
    expect(s.rows[0].rate).toBe(170);
    expect(s.rows[0].value).toBe(731000);
    const sl = await w.api.ok(w.api.get(`/reports/stock-ledger/${w.item.id}`));
    expect(sl.entries.at(-1).balance).toBe(4300);
  });

  it('dashboard aggregates the period', async () => {
    const d = await w.api.ok(w.api.get('/reports/dashboard?from=2026-04-01&to=2026-10-31'));
    expect(d.sales.count).toBe(2);
    expect(d.sales.qty).toBe(700);
    expect(d.receivable.total).toBe(bill1.netAmount + bill2.netAmount);
    expect(d.recent.length).toBeGreaterThan(0);
  });

  it('sales register with totals', async () => {
    const r = await w.api.ok(w.api.get('/vouchers/sale-bills'));
    expect(r.total).toBe(2);
    expect(r.totals.taxable).toBe(126000);
    expect(r.data[0].pending).toBeGreaterThan(0);
  });
});

describe('controls', () => {
  it('locked financial years refuse changes', async () => {
    await w.api.ok(w.api.patch(`/company/financial-years/${w.fy.id}`, { isLocked: true }));
    const r = await w.api.post('/vouchers/journals', { date: '2026-09-30', lines: [{ accountId: w.expense.id, debit: 1 }, { accountId: w.bank.id, credit: 1 }] });
    expect(r.status).toBe(423);
    expect((await w.api.del(`/vouchers/sale-bills/${bill2.id}`)).status).toBe(423);
    await w.api.ok(w.api.patch(`/company/financial-years/${w.fy.id}`, { isLocked: false }));
  });

  it('companies cannot see each other’s data', async () => {
    const other = await makeWorld('Isolated');
    const r = await other.api.get(`/vouchers/sale-bills/${bill1.id}`);
    expect(r.status).toBe(404);
    const r2 = await other.api.get(`/reports/ledger/${w.customer.id}`);
    expect(r2.status).toBe(404);
    // a user of the other company cannot send our company header
    const spy = new Client(w.app, other.api.token, w.company.id);
    expect((await spy.get('/vouchers/sale-bills')).status).toBe(403);
  });

  it('viewers can read reports but not post; the audit log records actions', async () => {
    const v = await makeUser(w.db, 'VIEWER', [w.company.id]);
    const c = await login(w.app, v.email, v.password, w.company.id);
    expect((await c.get('/reports/trial-balance')).status).toBe(200);
    expect((await c.post('/vouchers/receipts', { date: '2026-09-10', partyId: w.customer.id, bankAccountId: w.bank.id, amount: 1 })).status).toBe(403);
    expect((await c.get('/audit')).status).toBe(403);
    const audit = await w.api.ok(w.api.get('/audit?entity=sale-bills'));
    expect(audit.some((a: any) => a.summary.includes(bill1.number))).toBe(true);
  });

  it('unknown routes and types return 404 JSON', async () => {
    expect((await w.api.get('/vouchers/unknown-things')).status).toBe(404);
    expect((await w.api.get('/nothing-here')).status).toBe(404);
  });
});
