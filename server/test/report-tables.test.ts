import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, type World } from './helpers.js';

let w: World;
beforeAll(async () => { w = await makeWorld('Tables'); });
afterAll(async () => (await getApp()).close());


describe('report tables', () => {
  it('lists every report and serves each as a uniform table', async () => {
    const list = await w.api.ok(w.api.get('/reports/list'));
    expect(list.length).toBeGreaterThan(30);
    for (const r of list) {
      const t = await w.api.ok(w.api.get(`/reports/table/${r.key}`));
      expect(t.title).toBe(r.title);
      expect(Array.isArray(t.cols)).toBe(true);
      expect(t.cols.length).toBeGreaterThan(0);
      expect(Array.isArray(t.rows)).toBe(true);
    }
  });
  it('404s an unknown report', async () => {
    expect((await w.api.get('/reports/table/nope')).status).toBe(404);
  });
});
