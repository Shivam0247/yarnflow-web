/**
 * Before YarnFlow is reachable from the internet: any login still using a well-known starting password
 * (Admin@123, Accounts@123, Sales@123, Purchase@123, or YF_ADMIN_PASSWORD's default) gets a new random password,
 * printed once here. Logins whose password was already changed are not touched.
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { createDb } from '../db/index.js';

const DEFAULTS = ['Admin@123', 'Accounts@123', 'Sales@123', 'Purchase@123'];
const { db } = createDb() as never as { db: any };
const users = (await db.execute(sql`select id, email, password_hash from users where is_active`)).rows as { id: number; email: string; password_hash: string }[];
const changed: string[] = [];
for (const u of users) {
  let weak = false;
  for (const d of DEFAULTS) if (await bcrypt.compare(d, u.password_hash)) { weak = true; break; }
  if (!weak) continue;
  const pw = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 10) + '#7';
  await db.execute(sql`update users set password_hash = ${await bcrypt.hash(pw, 10)} where id = ${u.id}`);
  changed.push(`   ${u.email.padEnd(28)} ${pw}`);
}
if (changed.length) {
  console.log('\n\x1b[33m⚠  These logins still had the starting password. New passwords (write them down now):\x1b[0m');
  console.log(changed.join('\n') + '\n');
} else console.log('✓ No login uses a starting password.');
process.exit(0);
