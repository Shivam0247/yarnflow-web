/** Amount in words, Indian style, as the old software printed it:
 *  158823 → "RUPEES  ONE LAKHS FIFTY-EIGHT THOUSAND EIGHT HUNDRED TWENTY-THREE ONLY" */
const ONES = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN',
  'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

function two(n: number) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
}
function three(n: number) {
  const h = Math.floor(n / 100), r = n % 100;
  return [h ? ONES[h] + ' HUNDRED' : '', r ? two(r) : ''].filter(Boolean).join(' ');
}

export function inWords(n: number) {
  n = Math.abs(n);
  let rupees = Math.floor(n + 1e-9);
  const paise = Math.round((n - rupees) * 100);
  const parts: string[] = [];
  const crore = Math.floor(rupees / 1e7); rupees %= 1e7;
  const lakh = Math.floor(rupees / 1e5); rupees %= 1e5;
  const thousand = Math.floor(rupees / 1e3); rupees %= 1e3;
  if (crore) parts.push((crore >= 100 ? three(crore) : two(crore)) + ' CRORES');
  if (lakh) parts.push(two(lakh) + ' LAKHS');
  if (thousand) parts.push(two(thousand) + ' THOUSAND');
  if (rupees) parts.push(three(rupees));
  const r = parts.join(' ') || 'ZERO';
  return 'RUPEES  ' + r + (paise ? ' AND ' + two(paise) + ' PAISE' : '') + ' ONLY';
}
