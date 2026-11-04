import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, type World } from './helpers.js';

let w: World;
beforeAll(async () => {
  w = await makeWorld('Assistant');
  const bill = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: new Date().toISOString().slice(0, 10), partyId: w.customer.id, lines: [{ itemId: w.item2.id, lotNo: 'M1', grade: 'A', qty: 100, rate: 140 }] }));
  expect(bill.number).toBeTruthy();
});
afterAll(async () => (await getApp()).close());

describe('assistant', () => {
  it('summarises today from the books', async () => {
    const a = await w.api.ok(w.api.post('/assistant/ask', { q: 'Summarise today' }));
    expect(a.t).toMatch(/sales ₹ 14,700 from 1 bills/);
    expect(a.rows[0].a).toBe('Sales');
  });
  it('answers outstanding of a named party with its bills', async () => {
    const a = await w.api.ok(w.api.post('/assistant/ask', { q: `outstanding of ${w.customer.name}` }));
    expect(a.t).toContain(w.customer.name);
    expect(a.rows.length).toBeGreaterThan(0);
  });
  it('answers stock of an item', async () => {
    const a = await w.api.ok(w.api.post('/assistant/ask', { q: `stock of ${w.item2.name}` }));
    expect(a.t).toMatch(/kg in stock/);
  });
  it('falls back to a search and gives hints when nothing matches', async () => {
    const a = await w.api.ok(w.api.post('/assistant/ask', { q: 'zzzz qqqq' }));
    expect(a.t).toMatch(/could not match/);
  });
  it('builds insight cards', async () => {
    const ins = await w.api.ok(w.api.get('/assistant/insights'));
    expect(ins[0].t).toBe('Sales today');
    expect(ins[0].v).toBe('₹ 14,700');
  });
});
