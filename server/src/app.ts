/**
 * Fastify application. `buildApp` is used by the server and by the tests
 * (which talk to it with app.inject — no network).
 *
 * Every /api request (except login & health) needs:
 *   Authorization: Bearer <token>
 *   X-Company-Id:  <company id>      (company the user has access to)
 *   X-FY-Id:       <financial year>  (optional — defaults to the latest FY)
 */
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { ZodError } from 'zod';
import { config } from './config.js';
import type { Db } from './db/index.js';
import { financialYears, userCompanies, users } from './db/schema.js';
import { AppError, badRequest, forbidden, notFound, unauthorized } from './lib/errors.js';
import type { Ctx, Role } from './services/context.js';
import { registerRoutes } from './routes/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** filled by the auth hook */
    auth?: { userId: number; role: Role };
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: number; role: Role };
    user: { sub: number; role: Role };
  }
}

export interface AppDeps {
  db: Db;
  logger?: boolean;
}

export async function buildApp({ db, logger = false }: AppDeps) {
  const app = Fastify({ logger: logger ? { level: 'info' } : false, ajv: { customOptions: { coerceTypes: true } } });
  await app.register(cors, { origin: config.corsOrigin, credentials: true });
  await app.register(jwt, { secret: config.jwtSecret, sign: { expiresIn: config.jwtExpiresIn } });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      const fields = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      return reply.status(422).send({ error: { code: 'VALIDATION', message: fields[0] ? `${fields[0].path || 'input'}: ${fields[0].message}` : 'Invalid input', fields } });
    }
    if (err instanceof AppError) return reply.status(err.status).send({ error: { code: err.code, message: err.message, details: err.details } });
    const pg = err as unknown as { code?: string; detail?: string };
    if (pg.code === '23505') return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Duplicate value: ' + (pg.detail ?? 'already exists') } });
    if (pg.code === '23503') return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Record is in use by other data' } });
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) app.log.error(err);
    return reply.status(status).send({ error: { code: status >= 500 ? 'INTERNAL' : 'BAD_REQUEST', message: status >= 500 ? 'Something went wrong on the server' : (err as Error).message } });
  });

  /** verify the bearer token; role is re-read from the DB so changes apply immediately */
  const authenticate = async (req: FastifyRequest) => {
    try {
      await req.jwtVerify();
    } catch {
      throw unauthorized();
    }
    const [u] = await db.select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, req.user.sub));
    if (!u || !u.isActive) throw unauthorized('Account disabled');
    req.auth = { userId: u.id, role: u.role as Role };
  };

  /** company + financial-year scope for the request */
  const scope = async (req: FastifyRequest): Promise<Omit<Ctx, 'db'>> => {
    if (!req.auth) await authenticate(req);
    const companyId = Number(req.headers['x-company-id']);
    if (!companyId) throw badRequest('Missing X-Company-Id header');
    const [link] = await db.select().from(userCompanies).where(and(eq(userCompanies.userId, req.auth!.userId), eq(userCompanies.companyId, companyId)));
    if (!link) throw forbidden('You do not have access to this company');
    let fyId = Number(req.headers['x-fy-id']);
    if (fyId) {
      const [fy] = await db.select().from(financialYears).where(and(eq(financialYears.id, fyId), eq(financialYears.companyId, companyId)));
      if (!fy) throw notFound('Financial year');
    } else {
      const [fy] = await db.select().from(financialYears).where(eq(financialYears.companyId, companyId)).orderBy(desc(financialYears.startDate)).limit(1);
      if (!fy) throw notFound('Financial year');
      fyId = fy.id;
    }
    return { userId: req.auth!.userId, role: req.auth!.role, companyId, fyId };
  };

  /** run a handler with a read context */
  const read = <T>(fn: (ctx: Ctx, req: FastifyRequest) => Promise<T>) => async (req: FastifyRequest) => fn({ ...(await scope(req)), db }, req);
  /** run a handler inside one database transaction */
  const write = <T>(fn: (ctx: Ctx, req: FastifyRequest) => Promise<T>, status = 200) => async (req: FastifyRequest, reply: FastifyReply) => {
    const s = await scope(req);
    const out = await db.transaction(async (tx) => fn({ ...s, db: tx }, req));
    reply.status(status);
    return out;
  };

  app.get('/api/health', async () => {
    await db.execute('select 1' as never);
    return { ok: true, service: 'yarnflow-api', time: new Date().toISOString() };
  });

  await registerRoutes(app, { db, authenticate, scope, read, write });
  app.setNotFoundHandler((req, reply) => reply.status(404).send({ error: { code: 'NOT_FOUND', message: `No route ${req.method} ${req.url}` } }));
  return app;
}

export type RouteKit = {
  db: Db;
  authenticate: (req: FastifyRequest) => Promise<void>;
  scope: (req: FastifyRequest) => Promise<Omit<Ctx, 'db'>>;
  read: <T>(fn: (ctx: Ctx, req: FastifyRequest) => Promise<T>) => (req: FastifyRequest) => Promise<T>;
  write: <T>(fn: (ctx: Ctx, req: FastifyRequest) => Promise<T>, status?: number) => (req: FastifyRequest, reply: FastifyReply) => Promise<T>;
};
