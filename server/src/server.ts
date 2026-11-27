/** Production / dev entry point. In production it also serves the built web app. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { config } from './config.js';
import { createDb } from './db/index.js';
import { sql } from 'drizzle-orm';
import * as admin from './services/admin.js';
import { pdfMaker, startCloudSender } from './services/waCloud.js';
import { startEmailSender } from './services/email.js';

const { db } = createDb();
const app = await buildApp({ db, logger: true });

// serve web/dist when it exists (single-process deployment)
const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
if (fs.existsSync(path.join(webDist, 'index.html'))) {
  const index = fs.readFileSync(path.join(webDist, 'index.html'));
  const types: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json' };
  app.get('/*', async (req, reply) => {
    const file = path.join(webDist, decodeURIComponent(req.url.split('?')[0]));
    if (file.startsWith(webDist) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return reply.type(types[path.extname(file)] ?? 'application/octet-stream').send(fs.readFileSync(file));
    }
    return reply.type('text/html').send(index);
  });
}

await app.listen({ port: config.port, host: config.host });

// official WhatsApp API sender: runs inside the server, sends queued messages every 5 seconds (only for companies set to "cloud")
const webUrl = process.env.WEB_URL || `http://127.0.0.1:${config.port}`;
const sessionFor = async (companyId: number) => {
  const u = (await db.execute<{ id: number; role: string }>(sql`select id, role from users where role = 'ADMIN' and is_active order by id limit 1`)).rows[0];
  const user = await admin.profile(db, u.id);
  const co = (user as { companies: { id: number; financialYears: { id: number }[] }[] }).companies.find((c) => c.id === companyId) ?? (user as { companies: { id: number; financialYears: { id: number }[] }[] }).companies[0];
  return { token: app.jwt.sign({ sub: u.id, role: u.role as never }), user, companyId: co.id, fyId: co.financialYears[0]?.id };
};
const makePdf = pdfMaker(webUrl, sessionFor);
if (process.env.WA_SENDER !== 'off') startCloudSender(db, makePdf, (m) => app.log.warn(m));
// email sender: same documents, through the company's mail server (only when email is switched on)
if (process.env.EMAIL_SENDER !== 'off') startEmailSender(db, makePdf, (m) => app.log.warn(m));
