import { describe, expect, it } from 'vitest';
import { amountInWords, calcDocument, calcLine } from '../src/services/calc.js';
import { addDays, fyLabel, fyRange } from '../src/lib/dates.js';

describe('GST calculation', () => {
  it('splits 5% GST into CGST + SGST for intra-state', () => {
    const l = calcLine({ qty: 619.43, rate: 152.25, gstRate: 5 }, { interState: false, tax: true });
    expect(l.basicAmount).toBe(94308.22);
    expect(l.cgstAmount).toBe(2357.71);
    expect(l.sgstAmount).toBe(2357.71);
    expect(l.igstAmount).toBe(0);
    expect(l.amount).toBe(99023.64);
  });

  it('charges IGST for inter-state', () => {
    const l = calcLine({ qty: 100, rate: 200, gstRate: 5 }, { interState: true, tax: true });
    expect(l.igstAmount).toBe(1000);
    expect(l.cgstAmount + l.sgstAmount).toBe(0);
    expect(l.amount).toBe(21000);
  });

  it('applies discount %, freight % and insurance before tax', () => {
    const l = calcLine({ qty: 100, rate: 100, discPct: 2, freightPct: 1, insuranceAmount: 50, gstRate: 5 }, { interState: false, tax: true });
    expect(l.discAmount).toBe(200);
    expect(l.freightAmount).toBe(98); // 1% of 9,800
    expect(l.taxableAmount).toBe(9948);
    expect(l.cgstAmount).toBe(248.7);
  });

  it('does not tax documents without tax (dispatch schedule)', () => {
    const l = calcLine({ qty: 10, rate: 10, gstRate: 5 }, { interState: false, tax: false });
    expect(l.amount).toBe(100);
  });

  it('rounds the net amount and records round off', () => {
    const { totals } = calcDocument([{ qty: 619.43, rate: 152.25, gstRate: 5 }], { interState: false, tax: true });
    expect(totals.netAmount).toBe(99024);
    expect(totals.roundOff).toBe(0.36);
    expect(totals.taxableAmount).toBe(94308.22);
  });

  it('adds TCS on the invoice value and deducts nothing from net for TDS', () => {
    const { totals } = calcDocument([{ qty: 1000, rate: 100, gstRate: 5 }], { interState: false, tax: true, isTcs: true, tcsRate: 0.1, tdsRate: 0.1 });
    expect(totals.tcsAmount).toBe(105);
    expect(totals.netAmount).toBe(105105);
    expect(totals.tdsAmount).toBe(100);
  });

  it('order-level discounts reduce taxable value and tax proportionally', () => {
    const { totals } = calcDocument([{ qty: 100, rate: 100, gstRate: 5 }], { interState: false, tax: true, discounts: [{ label: 'Cash discount', amount: 1000 }] });
    expect(totals.taxableAmount).toBe(9000);
    expect(totals.cgstAmount).toBe(225);
    expect(totals.discountAmount).toBe(1000);
    expect(totals.netAmount).toBe(9450);
  });

  it('writes amounts in Indian words', () => {
    expect(amountInWords(99024)).toBe('Rupees Ninety Nine Thousand Twenty Four Only');
    expect(amountInWords(17_60_545)).toBe('Rupees Seventeen Lakh Sixty Thousand Five Hundred Forty Five Only');
    expect(amountInWords(1_23_45_678)).toBe('Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only');
  });
});

describe('dates', () => {
  it('derives the Indian financial year', () => {
    expect(fyLabel('2026-10-23')).toBe('26-27');
    expect(fyLabel('2027-03-31')).toBe('26-27');
    expect(fyLabel('2026-03-31')).toBe('25-26');
    expect(fyRange('26-27')).toEqual({ startDate: '2026-04-01', endDate: '2027-03-31' });
    expect(addDays('2026-10-23', 15)).toBe('2026-11-07');
  });
});
