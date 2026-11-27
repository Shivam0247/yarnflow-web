// YarnFlow WhatsApp sender — the same job the old "WhatsApp Sender" did on the office server:
// every few seconds it takes the messages YarnFlow queued when a bill / order / receipt was saved,
// sends them from the office WhatsApp (text, and the bill PDF with its caption) and marks them Sent.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry-run');
const cfgFile = path.join(DIR, 'config.json');
if (!fs.existsSync(cfgFile)) { console.error('Copy config.example.json to config.json and fill in the YarnFlow address, login and company.'); process.exit(1); }
const C = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toLocaleString('en-IN'), '·', ...a);

/* ---- YarnFlow API ---- */
let session = null;
async function login() {
  const r = await fetch(C.apiUrl + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: C.email, password: C.password }) });
  if (!r.ok) throw new Error('YarnFlow login failed (' + r.status + ') — check email/password in config.json');
  const j = await r.json();
  const co = j.user.companies.find((c) => c.id === Number(C.companyId)) || j.user.companies[0];
  session = { token: j.token, user: j.user, companyId: co.id, fyId: co.financialYears[0]?.id };
}
async function api(method, p, body) {
  if (!session) await login();
  for (let i = 0; i < 2; i++) {
    const r = await fetch(C.apiUrl + p, { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + session.token, 'x-company-id': String(session.companyId), 'x-fy-id': String(session.fyId) }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401 && i === 0) { await login(); continue; }
    if (!r.ok) throw new Error(method + ' ' + p + ' → ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.json();
  }
}

/* ---- PDF of a YarnFlow print page (same print the user sees) ---- */
async function pdfOf(browser, link) {
  const page = await browser.newPage();
  try {
    await page.goto(C.webUrl + '/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate((s) => localStorage.setItem('yf-session', JSON.stringify(s)), session);
    await page.goto(C.webUrl + link, { waitUntil: 'networkidle0', timeout: 120000 });
    await sleep(1500);
    return Buffer.from(await page.pdf({ printBackground: true, preferCSSPageSize: true }));
  } finally { await page.close().catch(() => {}); }
}

/* ---- WhatsApp ---- */
let client = null, MessageMedia = null, browser = null;
if (!DRY) {
  const wa = await import('whatsapp-web.js');
  const qr = (await import('qrcode-terminal')).default;
  const { Client, LocalAuth } = wa.default || wa;
  MessageMedia = (wa.default || wa).MessageMedia;
  client = new Client({ authStrategy: new LocalAuth({ dataPath: path.join(DIR, '.wa-login') }), puppeteer: { headless: true, args: ['--no-sandbox'] } });
  client.on('qr', (q) => { log('Scan this with the office WhatsApp (Linked devices → Link a device):'); qr.generate(q, { small: true }); });
  client.on('auth_failure', (m) => log('WhatsApp login failed:', m));
  client.on('disconnected', (r) => { log('WhatsApp disconnected:', r, '— restarting'); process.exit(2); });
  const ready = new Promise((res) => client.on('ready', res));
  await client.initialize();
  await ready;
  browser = client.pupBrowser;
  log('WhatsApp connected as', client.info?.wid?.user);
} else {
  const { chromium } = await import('playwright').catch(() => ({}));
  if (chromium) { const b = await chromium.launch(); browser = { newPage: async () => { const p = await b.newPage(); const g = p.goto.bind(p); p.goto = (u, o) => g(u, { ...o, waitUntil: o?.waitUntil === 'networkidle0' ? 'networkidle' : o?.waitUntil }); return p; } }; }
  log('DRY RUN — nothing is sent to WhatsApp, messages are only checked and PDFs written to ./dry-run');
  fs.mkdirSync(path.join(DIR, 'dry-run'), { recursive: true });
}

async function sendOne(m) {
  const chat = m.mobile.replace(/\D/g, '') + '@c.us';
  if (m.msgType === 'PDF') {
    if (!m.attachment) throw new Error('no PDF link');
    const buf = await pdfOf(browser, m.attachment);
    const name = (m.caption || m.billNo || 'document').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120) + '.pdf';
    if (DRY) { fs.writeFileSync(path.join(DIR, 'dry-run', name), buf); return; }
    await client.sendMessage(chat, new MessageMedia('application/pdf', buf.toString('base64'), name), { caption: m.caption || '' });
  } else {
    if (DRY) { fs.appendFileSync(path.join(DIR, 'dry-run', 'texts.txt'), '--- ' + m.mobile + ' ' + m.billNo + '\n' + m.body + '\n'); return; }
    if (!(await client.isRegisteredUser(chat))) throw new Error('not on WhatsApp');
    await client.sendMessage(chat, m.body || '');
  }
}

log('Watching YarnFlow for new messages every', C.everySeconds || 5, 'seconds');
for (;;) {
  try {
    const list = await api('POST', '/whatsapp/claim', { limit: 10, info: (DRY ? 'dry-run ' : '') + (client?.info?.wid?.user || '') });
    for (const m of list) {
      try { await sendOne(m); await api('POST', '/whatsapp/messages/' + m.id + '/result', { ok: true }); log('✓', m.msgType, m.billNo, '→', m.mobile); }
      catch (e) { await api('POST', '/whatsapp/messages/' + m.id + '/result', { ok: false, error: String(e.message || e) }).catch(() => {}); log('✕', m.msgType, m.billNo, '→', m.mobile, e.message || e); }
      await sleep((C.gapSeconds ?? 2) * 1000);
    }
    if (DRY && process.argv.includes('--once')) process.exit(0);
  } catch (e) { log('YarnFlow not reachable:', e.message || e); }
  await sleep((C.everySeconds || 5) * 1000);
}
