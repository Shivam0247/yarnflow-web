/**
 * E-way bill & e-invoice workflow on sale bills.
 *
 * The NIC portal calls are behind `EwbProvider`. The built-in provider
 * simulates the portal (numbers, validity, Part-B) so the whole flow works
 * offline; plug a GSP provider (e.g. via env EWB_PROVIDER) for live filing.
 */
import { createHash } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auditLogs, transporters, vouchers } from '../db/schema.js';
import { conflict, notFound, unprocessable } from '../lib/errors.js';
import { requireRole, type Ctx } from './context.js';
import { TYPES } from './types.js';

export interface EwbProvider {
  generate(bill: typeof vouchers.$inferSelect, opts: { distanceKm: number }): Promise<{ ewbNo: string; ewbDate: Date; validTill: Date }>;
  einvoice(bill: typeof vouchers.$inferSelect): Promise<{ irn: string; ackNo: string; ackDate: Date }>;
}

/** Offline simulator — same rules as the portal: 1 day per 200 km, valid till 23:59 */
export const simulatedProvider: EwbProvider = {
  async generate(bill, { distanceKm }) {
    const now = new Date();
    const days = Math.max(1, Math.ceil(distanceKm / 200));
    const till = new Date(now);
    till.setDate(till.getDate() + days);
    till.setHours(23, 59, 59, 0);
    const n = 321000000000 + ((bill.id * 7919 + now.getTime() / 1000) % 99999999);
    return { ewbNo: String(Math.floor(n)).padStart(12, '0'), ewbDate: now, validTill: till };
  },
  async einvoice(bill) {
    const irn = createHash('sha256').update(`${bill.companyId}|${bill.number}|${bill.date}|${bill.netAmount}`).digest('hex');
    return { irn, ackNo: String(112600000000000 + bill.id), ackDate: new Date() };
  }
};

let provider: EwbProvider = simulatedProvider;
export const setEwbProvider = (p: EwbProvider) => (provider = p);

export const generateSchema = z.object({
  transporterId: z.coerce.number().int().positive().optional().nullable(),
  vehicleNo: z.string().trim().toUpperCase().max(20).optional().nullable(),
  distanceKm: z.coerce.number().int().min(1).max(4000).optional()
});

const def = TYPES.SALE_BILL;

async function bill(ctx: Ctx, id: number) {
  const [v] = await ctx.db.select().from(vouchers).where(and(eq(vouchers.id, id), eq(vouchers.companyId, ctx.companyId), eq(vouchers.type, 'SALE_BILL')));
  if (!v) throw notFound('Sale bill');
  return v;
}

async function log(ctx: Ctx, id: number, summary: string) {
  await ctx.db.insert(auditLogs).values({ companyId: ctx.companyId, userId: ctx.userId, entity: 'eway', entityId: id, action: 'ACTION', summary });
}

export async function generateEwb(ctx: Ctx, id: number, raw: unknown) {
  requireRole(ctx, def.write, 'generate e-way bills');
  const input = generateSchema.parse(raw ?? {});
  const v = await bill(ctx, id);
  if (['GENERATED', 'PARTB_PENDING', 'DELIVERED'].includes(v.ewbStatus)) throw conflict(`E-way bill ${v.ewbNo} already exists for ${v.number}`);
  const transporterId = input.transporterId ?? v.transporterId;
  const vehicleNo = input.vehicleNo ?? v.vehicleNo;
  if (!transporterId && !vehicleNo) throw unprocessable('Give a transporter or a vehicle number');
  if (transporterId) {
    const [t] = await ctx.db.select().from(transporters).where(and(eq(transporters.id, transporterId), eq(transporters.companyId, ctx.companyId)));
    if (!t) throw unprocessable('Transporter not found');
  }
  const distanceKm = input.distanceKm ?? v.distanceKm ?? 10;
  const res = await provider.generate(v, { distanceKm });
  await ctx.db
    .update(vouchers)
    .set({ ewbNo: res.ewbNo, ewbDate: res.ewbDate, ewbValidTill: res.validTill, ewbStatus: vehicleNo ? 'GENERATED' : 'PARTB_PENDING', transporterId, vehicleNo, distanceKm, updatedAt: new Date() })
    .where(eq(vouchers.id, id));
  await log(ctx, id, `E-way bill ${res.ewbNo} generated for ${v.number}`);
  return (await bill(ctx, id));
}

export async function generateEwbBulk(ctx: Ctx, ids: number[]) {
  const done: { id: number; number: string; ewbNo?: string | null; error?: string }[] = [];
  const rows = await ctx.db.select().from(vouchers).where(and(inArray(vouchers.id, ids), eq(vouchers.companyId, ctx.companyId)));
  for (const r of rows) {
    try {
      const v = await generateEwb(ctx, r.id, {});
      done.push({ id: r.id, number: r.number, ewbNo: v.ewbNo });
    } catch (e) {
      done.push({ id: r.id, number: r.number, error: (e as Error).message });
    }
  }
  return done;
}

export async function updatePartB(ctx: Ctx, id: number, raw: unknown) {
  requireRole(ctx, def.write, 'update Part-B');
  const { vehicleNo } = z.object({ vehicleNo: z.string().trim().toUpperCase().min(6).max(20) }).parse(raw);
  const v = await bill(ctx, id);
  if (!['GENERATED', 'PARTB_PENDING'].includes(v.ewbStatus)) throw conflict('Generate the e-way bill first');
  await ctx.db.update(vouchers).set({ vehicleNo, ewbStatus: 'GENERATED', updatedAt: new Date() }).where(eq(vouchers.id, id));
  await log(ctx, id, `Part-B updated for ${v.number}: ${vehicleNo}`);
  return bill(ctx, id);
}

export async function cancelEwb(ctx: Ctx, id: number, reason?: string) {
  requireRole(ctx, def.write, 'cancel e-way bills');
  const v = await bill(ctx, id);
  if (!v.ewbNo || v.ewbStatus === 'CANCELLED') throw conflict('No active e-way bill');
  if (v.ewbDate && Date.now() - new Date(v.ewbDate).getTime() > 24 * 3600 * 1000) throw conflict('E-way bills can only be cancelled within 24 hours');
  await ctx.db.update(vouchers).set({ ewbStatus: 'CANCELLED', updatedAt: new Date() }).where(eq(vouchers.id, id));
  await log(ctx, id, `E-way bill ${v.ewbNo} cancelled${reason ? ': ' + reason : ''}`);
  return bill(ctx, id);
}

export async function extendEwb(ctx: Ctx, id: number, raw: unknown) {
  requireRole(ctx, def.write, 'extend e-way bills');
  const { days } = z.object({ days: z.coerce.number().int().min(1).max(15).default(1) }).parse(raw ?? {});
  const v = await bill(ctx, id);
  if (!v.ewbValidTill || !['GENERATED', 'EXPIRED'].includes(v.ewbStatus)) throw conflict('Nothing to extend');
  const till = new Date(v.ewbValidTill);
  till.setDate(till.getDate() + days);
  await ctx.db.update(vouchers).set({ ewbValidTill: till, ewbStatus: 'GENERATED', updatedAt: new Date() }).where(eq(vouchers.id, id));
  await log(ctx, id, `E-way bill ${v.ewbNo} extended by ${days} day(s)`);
  return bill(ctx, id);
}

export async function markDelivered(ctx: Ctx, id: number) {
  requireRole(ctx, def.write, 'close e-way bills');
  const v = await bill(ctx, id);
  if (v.ewbStatus !== 'GENERATED') throw conflict('Only active e-way bills can be closed');
  await ctx.db.update(vouchers).set({ ewbStatus: 'DELIVERED', updatedAt: new Date() }).where(eq(vouchers.id, id));
  await log(ctx, id, `E-way bill ${v.ewbNo} closed (delivered)`);
  return bill(ctx, id);
}

export async function generateEinvoice(ctx: Ctx, id: number) {
  requireRole(ctx, def.write, 'generate e-invoices');
  const v = await bill(ctx, id);
  if (v.irn) throw conflict(`IRN already generated for ${v.number}`);
  const res = await provider.einvoice(v);
  await ctx.db.update(vouchers).set({ irn: res.irn, ackNo: res.ackNo, ackDate: res.ackDate, updatedAt: new Date() }).where(eq(vouchers.id, id));
  await log(ctx, id, `E-invoice IRN generated for ${v.number}`);
  return bill(ctx, id);
}
