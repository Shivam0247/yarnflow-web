/** Wipe the test database and apply migrations once before the suite. */
import 'dotenv/config';
import { resetDatabase } from '../src/db/reset.js';
import { runMigrations } from '../src/db/migrate.js';

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgres://yarnflow:yarnflow@localhost:5432/yarnflow_test';
  process.env.DATABASE_URL = url;
  await resetDatabase(url);
  await runMigrations(url);
}
