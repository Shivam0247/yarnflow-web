/**
 * The old software's journal form, used for journals, debit notes and credit notes:
 * account lines with debit / credit, posted against a second (expense) account; the TDS line's
 * other side is the party; a provisional note is not posted; adjustments settle bills.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApp, makeWorld, postingsOf, type World } from './helpers.js';

let w: World;
let L: Record<string, number>;
beforeAll(async () => {
  w = await makeWorld('Journal form');
  const lk = await w.api.ok(w.api.get('/lookups'));
  const by = (re: RegExp) => lk.ledgers.find((a: any) => re.test(a.name)).id;
  L = { disc: by(/Rate Difference/), cgst: by(/Output CGST/), sgst: by(/Output SGST/), tds: by(/TDS/) };
});
afterAll(async () => (await getApp()).close());

const net = (rows: { account: string; debit: number; credit: number }[]) => {
  const m: Record<string, number> = {};
  for (const r of rows) m[r.account] = Math.round(((m[r.account] ?? 0) + Number(r.debit) - Number(r.credit)) * 100) / 100;
  return m;
};

describe('journal form', () => {
  it('debit note: each line posts to its account on the other side and to the expense account on its own side; TDS against the party', async () => {
    const bill = await w.api.ok(w.api.post('/vouchers/sale-bills', { date: '2026-06-01', partyId: w.customer.id, lines: [{ itemId: w.item.id, lotNo: 'L1', grade: 'A+', qty: 100, rate: 180 }] }));
    const dn = await w.api.ok(w.api.post('/vouchers/debit-notes', {
      format: 'journal', date: '2026-07-01', partyId: w.customer.id, refNo: bill.number, narration: 'Late payment',
      extra: { secondAccountId: String(L.disc), tdsAccountId: String(L.tds), gstPct: '5', beforeTax: '1000', cgst: '25', sgst: '25' },
      lines: [
        { accountId: w.customer.id, credit: 1050, remark2: bill.number },
        { accountId: L.cgst, debit: 25 }, { accountId: L.sgst, debit: 25 }, { accountId: L.tds, debit: 10 }
      ],
      allocations: [{ billId: bill.id, amount: 1050 }]
    }));
    expect(dn.extra.jvFormat).toBe('1');
    expect(dn.amount).toBe(1050);
    expect(dn.netAmount).toBe(0);
    const n = net(await postingsOf(w.db, dn.id));
    expect(n['Surat Weavers']).toBe(1050 + 10);
    expect(n[Object.keys(n).find((k) => /TDS/.test(k))!]).toBe(-10);
    expect(n['Output CGST']).toBe(-25);
    expect(n['Output SGST']).toBe(-25);
    expect(Object.values(n).reduce((a, b) => a + b, 0)).toBeCloseTo(0, 2);
    expect((await w.api.ok(w.api.get(`/vouchers/sale-bills/${bill.id}`))).pending).toBe(bill.netAmount - 1050);

    // saving it again unchanged gives the same postings and keeps the old-software fields
    const again = await w.api.ok(w.api.put(`/vouchers/debit-notes/${dn.id}`, {
      format: 'journal', date: '2026-07-01', partyId: w.customer.id, refNo: bill.number, narration: 'Late payment', extra: { secondAccountId: String(L.disc), tdsAccountId: String(L.tds) },
      lines: dn.lines.map((l: any) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, remark2: l.remark2 })), allocations: [{ billId: bill.id, amount: 1050 }]
    }));
    expect(again.extra.gstPct).toBe('5');
    expect(net(await postingsOf(w.db, dn.id))).toEqual(n);
  });

  it('journal without a second account must balance; a provisional note is not posted', async () => {
    const bad = await w.api.post('/vouchers/journals', { format: 'journal', date: '2026-07-02', lines: [{ accountId: L.disc, debit: 100 }, { accountId: w.customer.id, credit: 90 }] });
    expect(bad.status).toBe(422);
    const jv = await w.api.ok(w.api.post('/vouchers/journals', { format: 'journal', date: '2026-07-02', lines: [{ accountId: L.disc, debit: 100 }, { accountId: w.customer.id, credit: 100 }] }));
    expect(net(await postingsOf(w.db, jv.id))['Surat Weavers']).toBe(-100);
    const pn = await w.api.ok(w.api.post('/vouchers/debit-notes', { format: 'journal', date: '2026-07-03', partyId: w.customer.id, extra: { secondAccountId: String(L.disc), provisional: 'Yes' }, lines: [{ accountId: w.customer.id, credit: 500 }] }));
    expect(await postingsOf(w.db, pn.id)).toEqual([]);
  });
});
