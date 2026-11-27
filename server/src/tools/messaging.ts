/**
 * WhatsApp / email set-up from the server (there is no settings screen in YarnFlow on purpose).
 *
 *   npx tsx src/tools/messaging.ts show
 *   npx tsx src/tools/messaging.ts whatsapp --mode cloud --phone-number-id 1234 --waba-id 5678 --app-id 9012 --token EAAG... --app-secret abcd
 *   npx tsx src/tools/messaging.ts whatsapp --mode linked          (office-PC sender)   |  --mode off
 *   npx tsx src/tools/messaging.ts templates                       send the message wordings to Meta for approval, then show their status
 *   npx tsx src/tools/messaging.ts test-whatsapp 98XXXXXXXX
 *   npx tsx src/tools/messaging.ts email --user umiyayarnllp@gmail.com --password "abcd efgh ijkl mnop" --on [--forms SAL,SALRTN,SalOrder,DBNT,CRNT] [--limit 450]
 *   npx tsx src/tools/messaging.ts email --off
 *   npx tsx src/tools/messaging.ts test-email someone@example.com
 * Add --company <main company id> when it is not 1.
 */
import { sql } from 'drizzle-orm';
import { createDb } from '../db/index.js';
import * as wac from '../services/waCloud.js';
import * as mail from '../services/email.js';

const [cmd, ...rest] = process.argv.slice(2);
const arg = (k: string) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : undefined; };
const flag = (k: string) => rest.includes('--' + k);
const { db } = createDb() as never as { db: never };
const mc = Number(arg('company') ?? 1);
const admin = ((await (db as any).execute(sql`select id from users where role = 'ADMIN' and is_active order by id limit 1`)).rows[0] ?? {}).id;
const ctx = { db, companyId: mc, mcId: mc, fyId: 0, userId: admin, period: 24, role: 'ADMIN' } as never;
const out = (x: unknown) => console.log(JSON.stringify(x, null, 2));

try {
  if (cmd === 'show') { out({ whatsapp: await wac.getSettings(ctx), email: await mail.getSettings(ctx) }); }
  else if (cmd === 'whatsapp') {
    const cur = await wac.getSettings(ctx) as Record<string, unknown>;
    out(await wac.saveSettings(ctx, { ...cur, mode: arg('mode') ?? cur.mode, phoneNumberId: arg('phone-number-id') ?? cur.phoneNumberId, wabaId: arg('waba-id') ?? cur.wabaId, appId: arg('app-id') ?? cur.appId,
      accessToken: arg('token') ?? cur.accessToken, appSecret: arg('app-secret') ?? cur.appSecret, verifyToken: cur.verifyToken, displayNumber: arg('number') ?? cur.displayNumber, graphBase: arg('graph-base') ?? cur.graphBase }));
    console.log('Webhook for Meta: <your YarnFlow address>/api/whatsapp/webhook — verify token shown above');
  }
  else if (cmd === 'templates') { if (!flag('status-only')) out(await wac.submitTemplates(ctx)); out(await wac.templateStatus(ctx)); }
  else if (cmd === 'test-whatsapp') out(await wac.testSend(ctx, rest[0] ?? ''));
  else if (cmd === 'email') {
    const cur = await mail.getSettings(ctx) as Record<string, unknown>;
    out(await mail.saveSettings(ctx, { ...cur, mode: flag('on') ? 'auto' : flag('off') ? 'off' : cur.mode, host: arg('host') ?? cur.host, port: arg('port') ?? cur.port, secure: arg('port') === '465' || cur.secure,
      username: arg('user') ?? cur.username, password: arg('password') ?? cur.password, fromName: arg('from-name') ?? cur.fromName,
      forms: arg('forms') ? arg('forms')!.split(',') : cur.forms, dailyLimit: arg('limit') ?? cur.dailyLimit }));
  }
  else if (cmd === 'test-email') out(await mail.testEmail(ctx, rest[0] ?? ''));
  else console.log('Commands: show | whatsapp | templates | test-whatsapp <mobile> | email | test-email <address>   (see the top of this file)');
} catch (e) { console.error('✕', (e as Error).message); process.exitCode = 1; }
process.exit();
