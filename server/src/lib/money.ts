/** Rounding helpers — money to paise, quantity to grams. */
export const r2 = (n: number) => Math.round((Number(n) || 0) * 100 + Number.EPSILON * 100) / 100;
export const r3 = (n: number) => Math.round((Number(n) || 0) * 1000 + Number.EPSILON * 1000) / 1000;
export const sum = <T>(list: T[], f: (x: T) => number) => list.reduce((a, x) => a + (Number(f(x)) || 0), 0);
export const n = (v: unknown) => (v === null || v === undefined || v === '' ? 0 : Number(v));
