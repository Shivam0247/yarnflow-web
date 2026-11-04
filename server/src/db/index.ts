import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import * as schema from './schema.js';

// numeric → JS number is handled by drizzle (mode: 'number'); make DATE come back as 'YYYY-MM-DD'
pg.types.setTypeParser(1082, (v: string) => v);

export type Db = NodePgDatabase<typeof schema>;
/** A db handle or an open transaction — services accept either */
export type Tx = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export function createDb(url = config.databaseUrl) {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  const db = drizzle(pool, { schema, casing: 'snake_case' });
  return { db, pool };
}

export { schema };
