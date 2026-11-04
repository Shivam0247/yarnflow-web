/**
 * Pure GST / amount calculation for item documents. No database access —
 * fully unit tested. Mirrors the columns on the entry screens:
 * Basic amt → Disc % / ₹ → Freight % / ₹ → Insurance → Taxable → GST → Amount.
 */
import { r2, r3, sum } from '../lib/money.js';

export interface LineInput {
  qty?: number;
  rate?: number;
  pcs?: number;
  cops?: number;
  discPct?: number;
  discAmount?: number;
  freightPct?: number;
  freightAmount?: number;
  insurancePct?: number;
  insuranceAmount?: number;
  gstRate?: number;
  /** for amount-only lines (general purchase of services) */
  amount?: number;
}

export interface LineCalc {
  basicAmount: number;
  discAmount: number;
  freightAmount: number;
  insuranceAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  amount: number;
}

export interface HeaderInput {
  interState: boolean;
  tax: boolean;
  isTcs?: boolean;
  tcsRate?: number;
  tdsRate?: number;
  addLess?: number;
  /** order-level discounts (quantity / cash / rate difference) */
  discounts?: { label: string; amount: number }[];
}

export interface Totals {
  totalQty: number;
  totalPcs: number;
  totalCops: number;
  grossAmount: number;
  discountAmount: number;
  freightAmount: number;
  insuranceAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  tcsAmount: number;
  tdsAmount: number;
  addLess: number;
  roundOff: number;
  netAmount: number;
}

export function calcLine(l: LineInput, h: Pick<HeaderInput, 'interState' | 'tax'>): LineCalc {
  const qty = Number(l.qty) || 0;
  const rate = Number(l.rate) || 0;
  const basic = qty || rate ? r2(qty * rate) : r2(Number(l.amount) || 0);
  const disc = l.discPct ? r2((basic * l.discPct) / 100) : r2(Number(l.discAmount) || 0);
  const afterDisc = basic - disc;
  const freight = l.freightPct ? r2((afterDisc * l.freightPct) / 100) : r2(Number(l.freightAmount) || 0);
  const ins = l.insurancePct ? r2((afterDisc * l.insurancePct) / 100) : r2(Number(l.insuranceAmount) || 0);
  const taxable = r2(afterDisc + freight + ins);
  const g = h.tax ? Number(l.gstRate) || 0 : 0;
  let cgst = 0, sgst = 0, igst = 0;
  if (g) {
    if (h.interState) igst = r2((taxable * g) / 100);
    else {
      cgst = r2((taxable * g) / 200);
      sgst = cgst;
    }
  }
  return {
    basicAmount: basic,
    discAmount: disc,
    freightAmount: freight,
    insuranceAmount: ins,
    taxableAmount: taxable,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    amount: r2(taxable + cgst + sgst + igst)
  };
}

export function calcDocument<T extends LineInput>(lines: T[], h: HeaderInput) {
  const calced = lines.map((l) => ({ ...l, ...calcLine(l, h) }));
  const lineTaxable = sum(calced, (l) => l.taxableAmount);
  const headerDisc = r2(sum(h.discounts ?? [], (d) => d.amount));
  // order-level discount reduces taxable value; tax scales down with it
  const factor = lineTaxable > 0 && headerDisc > 0 ? Math.max(0, (lineTaxable - headerDisc) / lineTaxable) : 1;
  const taxable = r2(lineTaxable - headerDisc);
  const cgst = r2(sum(calced, (l) => l.cgstAmount) * factor);
  const sgst = r2(sum(calced, (l) => l.sgstAmount) * factor);
  const igst = r2(sum(calced, (l) => l.igstAmount) * factor);
  const tcs = h.isTcs && h.tcsRate ? r2(((taxable + cgst + sgst + igst) * h.tcsRate) / 100) : 0;
  const addLess = r2(Number(h.addLess) || 0);
  const exact = r2(taxable + cgst + sgst + igst + tcs + addLess);
  const net = Math.round(exact);
  const tds = h.tdsRate ? Math.round((taxable * h.tdsRate) / 100) : 0;
  const totals: Totals = {
    totalQty: r3(sum(calced, (l) => Number(l.qty) || 0)),
    totalPcs: r3(sum(calced, (l) => Number(l.pcs) || 0)),
    totalCops: r3(sum(calced, (l) => Number(l.cops) || 0)),
    grossAmount: r2(sum(calced, (l) => l.basicAmount)),
    discountAmount: r2(sum(calced, (l) => l.discAmount) + headerDisc),
    freightAmount: r2(sum(calced, (l) => l.freightAmount)),
    insuranceAmount: r2(sum(calced, (l) => l.insuranceAmount)),
    taxableAmount: taxable,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    tcsAmount: tcs,
    tdsAmount: tds,
    addLess,
    roundOff: r2(net - exact),
    netAmount: net
  };
  return { lines: calced, totals };
}

/** "Rupees Ninety Nine Thousand Twenty Four Only" (Indian numbering) */
export function amountInWords(amount: number) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''));
  const three = (x: number) => (x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + two(x % 100) : '') : two(x));
  let v = Math.round(Math.abs(amount));
  const parts: string[] = [];
  const cr = Math.floor(v / 1e7); v %= 1e7;
  const l = Math.floor(v / 1e5); v %= 1e5;
  const t = Math.floor(v / 1e3); v %= 1e3;
  if (cr) parts.push(three(cr) + ' Crore');
  if (l) parts.push(two(l) + ' Lakh');
  if (t) parts.push(two(t) + ' Thousand');
  if (v) parts.push(three(v));
  return 'Rupees ' + (parts.join(' ') || 'Zero') + ' Only';
}
