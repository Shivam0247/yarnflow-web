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

## 3. Rules that make re-runs easy

- **Legacy keys.** Every migrated row stores `legacy_db`, `legacy_table` and
  `legacy_id` (or the composite key) in a `legacy_ref` table. A later run upserts
  by that key. Records that already exist are updated, new ones are added, and
  records deleted in the old system are reported. Nothing is duplicated.
- **Mapping as code.** The legacy-to-YarnFlow field mapping lives in versioned
  files, not in one-off scripts. Running the final export means running the same
  command on a new folder:
  `npm run migrate -- --from /path/YarnFlowExport_<date>`.
- **Unknown data is kept.** Any column with no YarnFlow field yet is not
  dropped. It goes into the record's `extra` JSON, keyed by the legacy column
  name, so no value is lost and it can be promoted to a real field later.
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

## 4. Go-live procedure

1. Run the trial export, then migrate and reconcile. Fix the mappings until the
   reconcile report is clean.
2. Use YarnFlow alongside the old software for checking.
3. On cut-over day, stop entries in the old software and run the export again.
4. Run `npm run migrate -- --from <new export>`. The new export loads with the
   same mappings. Check that the reconcile report is clean.
5. Start working in YarnFlow.
