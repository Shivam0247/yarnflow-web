-- Registers total what later documents took from each line (bills against an order, returns against a bill),
-- which needs only the type and status of those documents. Read from the 3 GB vouchers table that is a full
-- scan (~0.9 s on every register load); this small index answers it on its own (index-only scan).
-- Kept out of schema.ts because drizzle cannot express INCLUDE columns.
CREATE INDEX IF NOT EXISTS "voucher_id_type_status" ON "vouchers" ("id") INCLUDE ("type", "status");
