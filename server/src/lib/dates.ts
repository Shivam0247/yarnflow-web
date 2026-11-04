/** Dates travel as 'YYYY-MM-DD' strings everywhere (API and DB). */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const today = () => isoDate(new Date());
export function addDays(date: string, days: number) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 864e5);
}
/** Indian FY label for a date: 2026-10-23 → "26-27" */
export function fyLabel(date: string) {
  const [y, m] = date.split('-').map(Number);
  const start = m >= 4 ? y : y - 1;
  return String(start % 100).padStart(2, '0') + '-' + String((start + 1) % 100).padStart(2, '0');
}
export function fyRange(label: string) {
  const s = 2000 + Number(label.slice(0, 2));
  return { startDate: `${s}-04-01`, endDate: `${s + 1}-03-31` };
}
