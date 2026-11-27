# YarnFlow: one image for the web app, the API and the data-loading commands.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
# the embedded database is only for running on a laptop; the server uses its own PostgreSQL
RUN npm pkg delete devDependencies.embedded-postgres && npm install --include=dev --no-audit && npm cache clean --force
COPY . .
RUN npm run build -w web
# headless Chromium: the server turns bill / outstanding print pages into PDFs for WhatsApp
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium
EXPOSE 4000
# apply database migrations, then serve the API + the built web app
CMD ["sh", "-c", "npm run db:migrate -w server && cd server && npx tsx src/db/ensure-admin.ts && exec npx tsx src/server.ts"]
