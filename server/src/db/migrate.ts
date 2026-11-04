/** Applies the SQL migrations in /drizzle. Usage: npm run db:migrate */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './index.js';

export async function runMigrations(url?: string) {
  const { db, pool } = createDb(url);
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');
  await migrate(db, { migrationsFolder: dir });
  await pool.end();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runMigrations()
    .then(() => console.log('✓ migrations applied'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
