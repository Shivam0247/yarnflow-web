/** Document prints and the old saved report designs (data under the old field names). */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, type World } from './helpers.js';

let w: World;
beforeAll(async () => { w = await makeWorld('Prints'); });
afterAll(async () => (await getApp()).close());

describe('prints', () => {
  it('gives a bill everything its print shows', async () => {
    const bill = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-06-01', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 100, rate: 180 }] }));
    const p = await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill.id}/print`));
    expect(p.doc.number).toBe(bill.number);
    expect(p.party.id).toBe(w.customer.id);
    expect(p.delivery.id).toBe(w.customer.id);
    expect(p.company.name).toBeTruthy();
    expect(p.ledgerBalance).toBe(bill.netAmount);
  });

  it('lists the saved designs and feeds the outstanding design', async () => {
    const list = await w.api.ok(w.api.get('/report-designs'));
    expect(list.find((d: any) => d.regId === 1)).toMatchObject({ title: 'Outstanding', available: true });
    const x = await w.api.ok(w.api.get('/report-designs/1'));
    expect(x.xml).toContain('XtraReportsLayoutSerializer');
    const d = await w.api.ok(w.api.get('/report-designs/1/data?asOn=2026-12-31'));
    const row = d.rows.find((r: any) => r.P_Name === w.customer.name);
    expect(row).toBeTruthy();
    expect(row.PendingAmt).toBeGreaterThan(0);
    expect(row.Sal_NetAmt).toBe(row.ReceivedAmt + row.PendingAmt);
    expect(d.params.Creative_CompanyName).toBeTruthy();
  });
});
