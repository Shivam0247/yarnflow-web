import { sql } from 'drizzle-orm';
import { createDb } from './src/db/index.js';
import * as wa from './src/services/whatsapp.js';
const { db } = createDb() as any;
const ctx: any = { db, companyId: 1, mcId: 1, fyId: 108, userId: 1, period: 24 };
const olds = (await db.execute(sql`select bill_no, body, form_type from whatsapp_messages where legacy and msg_type = 'TEXT' and form_type = 'SalOrder' and created_at >= '2026-11-18' order by random() limit 25`)).rows;
let same = 0, n = 0; const diffs: Record<string, number> = {};
for (const o of olds) {
  const v = (await db.execute(sql`select id from vouchers where type = 'SALES_ORDER' and number = ${o.bill_no} and date >= '2026-11-01' limit 1`)).rows[0];
  if (!v) continue; n++;
  const m = (await wa.buildMessages(ctx, Number(v.id))).find((x) => x.msgType === 'TEXT');
  const al = String(o.body).replace(/\r/g, '').split('\n'), bl = String(m?.body).split('\n');
  let ok = true;
  for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) { ok = false; const k = (al[i] ?? '').split(':-*')[0].slice(0, 40); diffs[k] = (diffs[k] ?? 0) + 1; if (diffs[k] <= 2) console.log(o.bill_no, JSON.stringify(al[i]), '|', JSON.stringify(bl[i])); }
  if (ok) same++;
}
console.log('identical', same, 'of', n, JSON.stringify(diffs));
process.exit(0);
