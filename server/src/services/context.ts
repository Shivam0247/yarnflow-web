import type { Tx } from '../db/index.js';
import { forbidden } from '../lib/errors.js';

export type Role = 'ADMIN' | 'ACCOUNTANT' | 'SALES' | 'PURCHASE' | 'VIEWER';

/** Who is acting, in which company and financial year. Passed to every service. */
export interface Ctx {
  db: Tx;
  userId: number;
  role: Role;
  companyId: number;
  fyId: number;
  /** company whose masters (accounts, items, groups, books …) this company shares */
  mcId: number;
  /** ledger period of the selected year: balances are always taken within one period
   *  (20 = books migrated from UMIYA20, up to FY 2023-24; 24 = UMIYA24 era onwards) */
  period: number;
}

/** ledger period that a financial year starting on `start` belongs to */
export const periodOf = (start: string) => (start < '2024-04-01' ? 20 : 24);

export function requireRole(ctx: Pick<Ctx, 'role'>, roles: Role[], what = 'this action') {
  if (!roles.includes(ctx.role)) throw forbidden(`Your role (${ctx.role.toLowerCase()}) cannot do ${what}`);
}

export const MASTER_WRITE: Role[] = ['ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE'];
export const SETUP_WRITE: Role[] = ['ADMIN', 'ACCOUNTANT'];
