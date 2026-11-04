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
}

export function requireRole(ctx: Pick<Ctx, 'role'>, roles: Role[], what = 'this action') {
  if (!roles.includes(ctx.role)) throw forbidden(`Your role (${ctx.role.toLowerCase()}) cannot do ${what}`);
}

export const MASTER_WRITE: Role[] = ['ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE'];
export const SETUP_WRITE: Role[] = ['ADMIN', 'ACCOUNTANT'];
