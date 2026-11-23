CREATE INDEX IF NOT EXISTS "ledger_period_account" ON "ledger_entries" ("company_id", "ledger_period", "account_id", "date") INCLUDE ("debit", "credit");
