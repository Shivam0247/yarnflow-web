/** Make sure an administrator exists (first start of a new server). Never changes an existing user. */
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { config } from '../config.js';

const c = new pg.Client({ connectionString: config.databaseUrl });
await c.connect();
const email = process.env.YF_ADMIN_EMAIL ?? 'admin@yarnflow.in';
const r = await c.query(`INSERT INTO public.users (name, email, password_hash, role, is_active) VALUES ('Administrator', $1, $2, 'ADMIN', true)
  ON CONFLICT (email) DO NOTHING RETURNING id`, [email, await bcrypt.hash(process.env.YF_ADMIN_PASSWORD ?? 'Admin@123', 10)]);
if (r.rowCount) console.log(`✓ administrator ${email} created`);
await c.end();
