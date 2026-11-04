/** Production / dev entry point. In production it also serves the built web app. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { config } from './config.js';
import { createDb } from './db/index.js';

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
