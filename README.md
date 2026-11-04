# YarnFlow

Yarn trading ERP for **Shree Umiya Yarn Pvt Ltd, Surat**: sales, purchase, stock, accounts, GST, outstanding and reports. It supports several companies and financial years, user login and roles.

| Part | Stack | Folder |
|---|---|---|
| API | Node 20 + TypeScript, Fastify, Drizzle ORM, PostgreSQL 16, Zod, JWT | `server/` |
| Web app | React + Vite. Screens are converted 1:1 from the Claude Design file | `web/` |
| Design source | Claude Design `.dc.html` files. This is the single source of truth for the UI | `design/project/` |
| Converter | Turns design files into React screens | `tools/dc2react.mjs` |

## Quick start

**Easiest (Mac):** double-click `Start YarnFlow.command`. Or, on any OS with Node 20+, run `npm install && npm run local`. Either way the app starts its own database, so nothing else needs installing, and it opens at http://localhost:4000.

### With Docker / your own PostgreSQL

You need Node 20+ and Docker (or your own PostgreSQL 16).

```bash
docker compose up -d                 # PostgreSQL on :5432, also creates yarnflow_test
cp server/.env.example server/.env   # then set JWT_SECRET
npm install
npm run db:migrate                   # create tables
npm run db:seed                      # demo company, masters, a few months of vouchers
npm run dev                          # API on :4000, web on :5173
```

Open http://localhost:5173 and sign in with **admin@yarnflow.in / Admin@123**. Change the password after the first login.

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs the API test suite (102 tests) against `TEST_DATABASE_URL`. That database is wiped and rebuilt. |
| `npm run build` | Production build of the API (`server/dist`) and the web app (`web/dist`) |
| `npm start` | Runs the built API |
| `npm run db:reset` | Drops everything, then migrates and re-seeds |
| `npm run typecheck` | Type-checks both workspaces |
| `npm run sync-design` | Re-generates `web/src` from `design/project` (see below) |

### Environment (`server/.env`)

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Main database |
| `TEST_DATABASE_URL` | Throwaway database used by `npm test` |
| `JWT_SECRET` | Long random string. **Change it in production.** |
| `JWT_EXPIRES_IN` | Session length, for example `12h` |
| `PORT` | API port (default 4000) |
| `CORS_ORIGIN` | Allowed web origins, comma separated |

## What is in it

**Sales.** Sales order (credit-limit approval, pending tracking), dispatch schedule, sale bill made from schedules or orders, e-way bill and e-invoice (IRN) register, sale return and general sale.

**Purchase.** Purchase order (agent or direct), purchase bill made from orders, purchase return and general purchase.

**Accounts.** Receipts, payments, contra, journal, debit note and credit note (including interest debit notes). Bill-wise settlement against open bills, ledger, day book, trial balance, P&L, balance sheet and group summary.

**Outstanding.** Receivable and payable. Group by party, account group, party group, city, area, state, broker, sales person or collection person. Aging buckets (0–30 / 31–60 / 61–90 / 90+), overdue days, last payment and interest.

**Stock.** Item-wise, lot-wise and godown-wise stock, plus stock ledger, valuation, slow-moving and reorder lists, godown transfers and opening stock.

**Reports.** The reports page covers 36 reports:
- Sales and purchase registers.
- Party, yarn, broker, sales-person and month-wise sales.
- Mill-wise purchase, rate history and brokerage.
- Pending SO and PO.
- TDS and TCS.
- Collections by person, sales person, mode and month.
- Payment behaviour.
- GSTR-1, HSN, GSTR-3B, GSTR-2B and the e-way bill register.

**Masters.** Account groups, accounts (parties, brokers, mills, banks), yarn items, brands, transporters, vehicles, godowns, sales persons, cost centres and voucher books.

**Approvals.** Orders held for credit limit or rate go to an approval queue.

**Assistant.** A right-side panel that answers questions from the books. It is rule-based, so no external AI service is called. Examples:
- "Summarise today"
- "Who owes more than 60 days in Surat?"
- "Outstanding of Sujal Synthetics"
- "Low stock"
- "Rate trend of 75/36 RW"
- Pending orders, e-way bills due and payables due

The panel also shows daily insight cards.

**Roles.**

| Role | What it can do |
|---|---|
| `ADMIN` | Everything, including users and company setup |
| `ACCOUNTANT` | Accounts and setup masters |
| `SALES` / `PURCHASE` | Their own area plus masters |
| `VIEWER` | Read only |

Every change is written to the audit log.

## API

Every request except login needs these headers:

```
Authorization: Bearer <token from POST /api/auth/login>
X-Company-Id: <company id>
X-FY-Id: <financial year id>      (optional, defaults to the current FY)
```

Errors come back with a 4xx status as `{ "error": { "code", "message", "details" } }`. Validation errors use 422, and duplicates use 409.

### Auth, company, users

| Method | Path | |
|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Profile, companies and FYs |
| POST | `/api/auth/change-password` | |
| GET | `/api/companies`, `/api/company` | |
| POST / PATCH | `/api/company/financial-years[/:id]` | Open, lock or close an FY |
| GET / PATCH | `/api/users[/:id]` | Admin only |
| GET | `/api/audit` | Audit trail |

### Masters

`:slug` is one of `groups`, `accounts`, `items`, `brands`, `transporters`, `vehicles`, `godowns`, `sales-persons`, `cost-centers` or `books`.

| Method | Path | |
|---|---|---|
| GET | `/api/masters/:slug?q=&page=` | List and search |
| GET | `/api/masters/:slug/:id` | One record |
| POST | `/api/masters/:slug` | Create |
| PATCH / DELETE | `/api/masters/:slug/:id` | Update, delete. Delete is blocked when the record is in use. |
| GET | `/api/lookups` | Every dropdown list in one call |
| GET | `/api/accounts/:id/summary` | Balance, limit, overdue and last activity |
| GET | `/api/accounts/:id/open-bills` | Unsettled bills, for payment settlement |

### Vouchers

`:slug` is one of the following:
- Sales: `sales-orders`, `dispatch-schedules`, `sale-bills`, `sale-returns`, `general-sales`
- Purchase: `purchase-orders`, `purchase-bills`, `purchase-returns`, `general-purchases`
- Accounts: `receipts`, `payments`, `contras`, `journals`, `debit-notes`, `credit-notes`
- Stock: `stock-transfers`, `opening-stock`

| Method | Path | |
|---|---|---|
| GET | `/api/vouchers/:slug?from=&to=&party=&status=&q=&view=lines` | Register |
| GET | `/api/vouchers/:slug/next-number` | |
| GET | `/api/vouchers/:slug/pending-lines?party=` | Order or schedule lines still open, for making the next document |
| GET | `/api/vouchers/:slug/:id` | Full document with lines, taxes, ledger postings and settlements |
| POST / PUT / DELETE | `/api/vouchers/:slug[/:id]` | Create, edit, delete. Totals, GST, TDS/TCS, stock and ledger postings are all computed on the server. |
| POST | `/api/vouchers/:slug/:id/actions/:action` | `approve`, `reject`, `cancel`, `close` or `reopen`, with an optional `{ reason }` |
| PATCH | `/api/vouchers/:slug/:id/extra` | Free-form extra fields (remarks, transport details, and so on) |
| GET | `/api/vouchers/:slug/:id/related` | Linked order, schedule, bill, returns and payments |
| GET | `/api/find?number=` | Open any document by its number |
| GET | `/api/approvals` | Approval queue |

### E-way bills and e-invoice

| Method | Path | |
|---|---|---|
| GET | `/api/eway-bills` | Register with validity and status |
| POST | `/api/eway-bills/:id/generate`, `/part-b`, `/extend`, `/cancel`, `/deliver`, `/einvoice` | |
| POST | `/api/eway-bills/bulk-generate` | |

### Reports

| Method | Path | |
|---|---|---|
| GET | `/api/reports/dashboard` | Dashboard tiles and charts |
| GET | `/api/reports/outstanding?side=receivable\|payable&groupBy=party\|group\|partyGroup\|salesPerson\|collectionPerson\|broker\|city\|area\|state&asOn=` | Aging-wise outstanding |
| GET | `/api/reports/ledger/:id`, `/stock-ledger/:id` | |
| GET | `/api/reports/day-book`, `/trial-balance`, `/profit-loss`, `/balance-sheet`, `/group-summary` | |
| GET | `/api/reports/stock`, `/pending-orders`, `/sales-analysis`, `/collections`, `/brokerage`, `/interest`, `/tds-tcs` | |
| POST | `/api/reports/interest/debit-notes` | Raise interest debit notes in bulk |
| GET | `/api/reports/gstr1`, `/gstr3b`, `/register/:slug` | |
| GET | `/api/reports/list` | Catalogue of the reports below |
| GET | `/api/reports/table/:key?from=&to=&party=` | Any of the 36 report tables as `{ title, sub, cols, rows, total, note }` |

### Assistant

| Method | Path | |
|---|---|---|
| POST | `/api/assistant/ask` | `{ q }` → `{ t, cardT, rows, src, acts }` (answer text, card title, rows, sources, suggested actions) |
| GET | `/api/assistant/insights` | Insight cards for the panel |

## Design and code stay the same

The UI is designed in Claude Design. Each `design/project/*.dc.html` file is one screen and contains the markup, styles, sample data and screen logic.
- In the design canvas, a screen shows its sample data.
- In the running app, the same logic sees a signed-in session (`window.YF_API`) and loads live data from the API instead.

To change a screen:
1. Edit the design file.
2. Run `npm run sync-design`. This regenerates the matching `web/src/screens/<Screen>/` (and the shared `components/`), so the app always matches the design exactly.

Never hand-edit the generated screens. Change the design file and re-sync.

## Folder structure

```
server/
  src/app.ts            Fastify app: auth, company/FY context, error handling
  src/routes/index.ts   All HTTP routes
  src/services/         documents (vouchers), masters, reports, tables (36 reports),
                        assistant, eway, calc (GST/TDS/rounding), admin, setup
  src/db/               Drizzle schema, migrations runner, seed, reset
  drizzle/              SQL migrations
  test/                 vitest suites (auth, masters, sales/purchase flows, accounts, reports, assistant)
web/
  src/main.tsx          Router and login gate
  src/app/routes.ts     One route per design screen
  src/screens/          Generated screens (one folder each)
  src/components/       Generated shared parts: Sidebar, Assistant, VoucherList, VoucherEntry
design/project/         Claude Design source files
tools/dc2react.mjs      Design → React converter
```

## Web routes

| Area | Paths |
|---|---|
| Dashboard, approvals | `/`, `/approvals` |
| Sales | `/sales/orders`, `/sales/dispatch-schedules`, `/sales/bills`, `/sales/eway-bills`, `/sales/returns`, `/sales/general` |
| Purchase | `/purchase/orders`, `/purchase/bills`, `/purchase/returns`, `/purchase/general` |
| Accounts | `/accounts/payments`, `/accounts/debit-notes`, `/accounts/credit-notes`, `/accounts/ledger`, `/accounts/outstanding` |
| Reports, stock | `/reports`, `/stock` |
| Masters | `/masters`, `/masters/accounts`, `/masters/groups`, `/masters/yarn`, `/masters/transporters` |

Most registers also have `/new` and `/view` routes. Bills use `/new` (pick the order or schedule) and `/entry`.

## Theme

Use the Light/Dark switch at the bottom of the sidebar. The choice is saved; until one is picked, the app follows the system setting.
