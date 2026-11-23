# Migrating from the old "Creative" software (SQL Server) to YarnFlow

This is a **repeatable** pipeline. It can run as often as needed: first on a
trial export, and then on a final, up-to-date export at go-live. Every run
starts from the export folder and gives the same result.

## 1. Input: the export folder

Produced by `tools/export-old-db/Export-OldDatabase.ps1`. The tool is read-only
and runs on the office PC. The export folder contains:

```
YarnFlowExport_<date>/
  UMIYA24/  schema.json  modules.sql  summary.txt  data/dbo.<TABLE>.csv
  UMIYA20/  ...
```

## 2. Pipeline (`tools/migrate/`)

| Step | What it does | Re-run safe |
|---|---|---|
| **1 · Stage** | Loads each export into its own PostgreSQL schema `legacy_<db>_<date>` as an exact copy. It keeps the same tables, columns and rows, with types mapped and nothing transformed. | Yes. A new schema is made per export, and old ones are kept for comparison. |
| **2 · Verify stage** | Checks each table's row count against `summary.txt` and `schema.json` counts. Any difference stops the run. | Yes |
| **3 · Map** | Converts the staged rows into YarnFlow tables using the versioned mapping files in `tools/migrate/map/*.ts` (one per entity: groups, parties, brokers, items, lots, orders, bills, receipts, journals, notes, bill-adjustments, opening balances, and so on). | Yes |
| **4 · Load** | Writes the mapped rows into YarnFlow in one transaction, in dependency order: masters, then orders, then bills, then payments, then adjustments. | Yes. Rows are matched by legacy key, as described below. |
| **5 · Reconcile** | Compares YarnFlow against the old system: party balances, trial balance, outstanding (bill-wise), stock by item and lot, and register totals per month. It also checks that each legacy row is either migrated or listed with a reason. | Yes |

## 3. Design principle (owner's instruction)

YarnFlow keeps **its own clean, normalised database design**. It does **not**
copy the old table layout. The old structure is used only as a source to
read from. The one hard rule is that **no data may be lost or changed in
meaning**:

- Every legacy row that carries business data has a home in YarnFlow.
- Values are converted exactly. Amounts, quantities and dates are checked in
  the reconcile step.
- Anything not yet modelled stays in the permanent archive, and the record links to
  its exact original row, so nothing is dropped. Masters also carry their full
  original row in `extra`.

## 3a. Zero-difference guarantee (owner's instruction, 23 Nov 2026)

> "UMIYA20 and UMIYA24 data must stay same to same. No data loss, no
> corruption, no difference of any kind."

The guarantee rests on four layers. Every one must pass before go-live. A
single failing check blocks go-live; it never only produces a warning.

**Layer 1: Permanent exact archive.** Every legacy table from both databases
(all 690 tables, empty ones included) is loaded **unchanged** into read-only
PostgreSQL schemas `legacy_umiya20` and `legacy_umiya24`.
- Each value is stored as the exact text that SQL Server exported, and binary
  values (QR codes, images) are stored byte for byte.
- Each row gets a SHA-256 fingerprint.
- The archive is never edited or deleted, so the original data can always be
  shown or re-exported exactly.

**Layer 2: Exact conversion into the clean YarnFlow design.**
- Amounts, quantities and rates use `numeric` columns with enough precision to
  hold the legacy value exactly. There is no silent rounding, and the legacy
  `float` text is parsed as a decimal, never through binary floating point.
- Dates keep their date and time, and codes and numbers keep their exact text,
  including leading zeros and spaces.
- Every YarnFlow row links back to its archive row through `legacy_ref`, so
  each value can be traced to its source.

**Layer 3: Merging UMIYA20 and UMIYA24 without differences.**
- *Masters* (parties, brokers, items, groups, books and so on) are matched by
  legacy code. When the two databases disagree, for example the 493 parties
  renamed between them, UMIYA24 (the latest) becomes the current value and the
  UMIYA20 value is kept as history or alias. Both values stay visible.
- *Carried-forward bills*: UMIYA24 contains 5,719 old-year bills, flagged
  `IsLastYearEntry`, copied from UMIYA20 for outstanding. Each bill is migrated
  **once**. The UMIYA20 original is the bill, and the UMIYA24 copy supplies the
  later payment and adjustment state. The 288 copies that differ in amount or
  number are listed field by field in the report for the owner to confirm.
  Nothing is overwritten silently.
- *Year transactions* are taken from the database that owns that year:
  UMIYA20 for FY 2019-20 to 2023-24 and UMIYA24 for FY 2024-25 onwards.
  Opening balances come from UMIYA24's `OpeningBalMst` and are checked against
  UMIYA20's closing balances.

**Layer 4: Automated reconciliation, zero tolerance, accurate to the paisa.**

| Check | Compared against |
|---|---|
| Row count of every table | `summary.txt` |
| Row fingerprint of every archived row | Exported CSV |
| Sum of every amount and quantity column, per table, company and year | Legacy archive |
| Every voucher's header total compared with the sum of its lines | Legacy archive |
| Dr, Cr and balance of every account, per company and year | `AccountLedger` |
| Trial balance and P&L per company and year | Legacy views (`modules.sql`) |
| Outstanding per bill: amount, received, adjusted and due | `RecSubBilladjustMst`, `JVBillAdustMst`, `SalPurBillAdustMst` |
| GST totals: CGST, SGST, IGST, TDS and TCS per month | Legacy GST/JV lines |
| Order pending quantities, dispatch quantities and stock | Legacy orders and dispatch |
| Round trip: rebuild each legacy row's key fields from YarnFlow and compare | Archive (must match 100%) |

The migration report shows every check with old value, new value and
difference. Go-live is allowed only when every difference is exactly 0.

## 4. Rules that make re-runs easy

- **Legacy keys.** Every migrated row stores `legacy_db`, `legacy_table` and
  `legacy_id` (or the composite key) in a `legacy_ref` table. A later run upserts
  by that key. Records that already exist are updated, new ones are added, and
  records deleted in the old system are reported. Nothing is duplicated.
- **Mapping as code.** The legacy-to-YarnFlow field mapping lives in versioned
  files, not in one-off scripts. Running the final export means running the same
  command on a new folder:
  `npm run migrate -- --from /path/YarnFlowExport_<date>`.
- **Unknown data is kept.** Any column with no YarnFlow field yet stays in the
  archive (`legacy_umiya20` / `legacy_umiya24`), which is never deleted. Every
  YarnFlow row links to its archived row (`legacy_refs`, or `legacy_row` on ledger
  entries), so a value can always be shown or promoted to a real field later.
  The full row is not duplicated into transaction records, to save space.
- **The YarnFlow design follows the data.** Tables that actually hold rows
  decide which screens and fields YarnFlow gets. Schema changes are made with
  normal Drizzle migrations, so the database, API and UI stay in sync. Design
  files and React screens change together, following the design and code
  same-to-same rule.
- **Users' own new entries are protected.** Before go-live, YarnFlow is
  re-loaded from the latest export. After go-live, entries made in YarnFlow are
  never touched by a migration run, because they have no `legacy_ref`.
- **Every run writes a report** (`migration-report-<date>.html`). It contains
  counts per table, reconciliation results, rows skipped with reasons, and any
  differences from the previous run.

## 5. Go-live procedure

1. Run the trial export, then migrate and reconcile. Fix the mappings until the
   reconcile report is clean.
2. Use YarnFlow alongside the old software for checking.
3. On cut-over day, stop entries in the old software and run the export again.
4. Run `npm run migrate -- --from <new export>`. The new export loads with the
   same mappings. Check that the reconcile report is clean.
5. Start working in YarnFlow.
