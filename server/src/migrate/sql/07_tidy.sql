-- Step 3h: fit the converted data to YarnFlow's meaning of a few fields. The exact original
-- rows stay in the archive (legacy_umiya20 / legacy_umiya24), linked through legacy_refs.
SELECT mig.note('tidy: start');

-- 1. names and addresses typed with leading / trailing spaces or line breaks in the old software
CREATE OR REPLACE FUNCTION pg_temp.t(x text) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT nullif(regexp_replace(x, '^[\s]+|[\s]+$', '', 'g'), '') $$;
UPDATE public.accounts SET name = coalesce(pg_temp.t(name), name), alias = pg_temp.t(alias), print_name = pg_temp.t(print_name),
  address1 = pg_temp.t(address1), address2 = pg_temp.t(address2), area = pg_temp.t(area), city = pg_temp.t(city), contact_person = pg_temp.t(contact_person)
WHERE name ~ '^\s|\s$' OR alias ~ '^\s|\s$' OR print_name ~ '^\s|\s$' OR address1 ~ '^\s|\s$' OR address2 ~ '^\s|\s$'
   OR area ~ '^\s|\s$' OR city ~ '^\s|\s$' OR contact_person ~ '^\s|\s$';
UPDATE public.persons SET name = coalesce(pg_temp.t(name), name) WHERE name ~ '^\s|\s$';
UPDATE public.items SET name = coalesce(pg_temp.t(name), name) WHERE name ~ '^\s|\s$';
UPDATE public.account_groups SET name = coalesce(pg_temp.t(name), name) WHERE name ~ '^\s|\s$';
SELECT mig.note('tidy: names trimmed');

-- 2. quantity: yarn is billed by weight (kg). The old software keeps kg in Weight and a second unit in Qty;
-- YarnFlow's qty is the billed quantity, so qty = weight where a weight was entered (old Weight stays in
-- weight; the old Qty, where both were entered, is kept in extra._oldQty)
UPDATE public.voucher_lines SET extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('_oldQty', qty), qty = weight
WHERE weight IS NOT NULL AND weight <> 0 AND qty IS DISTINCT FROM weight AND qty <> 0 AND NOT coalesce(extra ? '_oldQty', false);
UPDATE public.voucher_lines SET qty = weight WHERE weight IS NOT NULL AND weight <> 0 AND qty = 0;
UPDATE public.vouchers SET extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('_oldQty', total_qty), total_qty = total_weight
WHERE total_weight IS NOT NULL AND total_weight <> 0 AND total_qty IS DISTINCT FROM total_weight AND total_qty <> 0 AND NOT coalesce(extra ? '_oldQty', false);
UPDATE public.vouchers SET total_qty = total_weight WHERE total_weight IS NOT NULL AND total_weight <> 0 AND total_qty = 0;
SELECT mig.note('tidy: quantities');

-- 3. bills the old software copied into UMIYA24 (linked copies) are outstanding in the UMIYA24 books too
UPDATE public.vouchers v SET carried_to_period = 24
FROM public.legacy_refs r WHERE r.entity = 'voucher_copy' AND r.legacy_db = 'UMIYA24' AND r.entity_id = v.id AND v.carried_to_period IS DISTINCT FROM 24;

-- 4. every settlement has a date (paid-before amounts: the bill's date; others without one: their document's date)
UPDATE public.bill_allocations a SET date = v.date FROM public.vouchers v
WHERE a.date IS NULL AND v.id = coalesce(a.voucher_id, a.bill_id);
SELECT mig.note('tidy: carried bills and settlement dates');

-- 5. orders and dispatch schedules: status as the old software had it, and bills linked to the order / schedule
--    lines they were made from (so "pending orders", "bills against this order" work as before)
CREATE TEMP TABLE ol AS   -- order lines: YarnFlow line id + old line status
SELECT r.entity_id AS id, r.legacy_db AS db, s."Sals_Status" AS st
FROM public.legacy_refs r JOIN legacy_umiya20."QuotationSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'QuotationSubMst'
UNION ALL
SELECT r.entity_id, r.legacy_db, s."Sals_Status"
FROM public.legacy_refs r JOIN legacy_umiya24."QuotationSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'QuotationSubMst';
UPDATE public.voucher_lines l SET line_status = 'CLOSED', extra = coalesce(l.extra, '{}'::jsonb) || jsonb_build_object('_oldStatus', ol.st)
FROM ol WHERE ol.id = l.id AND ol.st IN ('CLOSE', 'CANCEL', 'LOCK') AND l.line_status IS DISTINCT FROM 'CLOSED';
UPDATE public.vouchers v SET status = x.st::doc_status FROM (
  SELECT l.voucher_id, CASE WHEN bool_and(o.st = 'CANCEL') THEN 'CANCELLED' WHEN bool_and(o.st IN ('CLOSE', 'CANCEL', 'LOCK')) THEN 'COMPLETED'
                            WHEN bool_or(o.st IN ('CLOSE', 'LOCK')) THEN 'PARTIAL' ELSE 'OPEN' END AS st
  FROM ol o JOIN public.voucher_lines l ON l.id = o.id GROUP BY l.voucher_id) x
WHERE v.id = x.voucher_id AND v.status::text IS DISTINCT FROM x.st;
SELECT mig.note('tidy: order status');

-- dispatch schedules (challans): billed when the old row names its sale bill
CREATE TEMP TABLE billed_ds AS
SELECT r.entity_id AS id FROM public.legacy_refs r JOIN legacy_umiya20."DispatchMst" d ON d._row = r.legacy_row
WHERE r.entity = 'voucher' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'DispatchMst' AND coalesce(d."Dspt_SalCode", '') NOT IN ('', '0')
UNION
SELECT r.entity_id FROM public.legacy_refs r JOIN legacy_umiya24."DispatchMst" d ON d._row = r.legacy_row
WHERE r.entity = 'voucher' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'DispatchMst' AND coalesce(d."Dspt_SalCode", '') NOT IN ('', '0');
UPDATE public.vouchers v SET status = 'COMPLETED' FROM billed_ds b WHERE v.id = b.id AND v.status = 'OPEN';
UPDATE public.voucher_lines l SET line_status = 'CLOSED' FROM public.vouchers v
WHERE v.id = l.voucher_id AND v.type = 'DISPATCH_SCHEDULE' AND v.status = 'COMPLETED' AND l.line_status IS DISTINCT FROM 'CLOSED';
SELECT mig.note('tidy: dispatch status');

-- bill lines -> the order line (same order, same item, first such line) and the challan's line
CREATE TEMP TABLE bl AS
SELECT r.entity_id AS id, r.legacy_db AS db, 'SalesMst' AS tbl, s."Sals_OrderCode" AS ord, s."SalS_Dispt_Code" AS disp
FROM public.legacy_refs r JOIN legacy_umiya20."SalesSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'SalesSubMst'
UNION ALL
SELECT r.entity_id, r.legacy_db, 'SalesMst', s."Sals_OrderCode", s."SalS_Dispt_Code"
FROM public.legacy_refs r JOIN legacy_umiya24."SalesSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'SalesSubMst'
UNION ALL
SELECT r.entity_id, r.legacy_db, 'PurchaseMst', s."Purs_OrderCode", NULL
FROM public.legacy_refs r JOIN legacy_umiya20."PurchaseSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'PurchaseSubMst'
UNION ALL
SELECT r.entity_id, r.legacy_db, 'PurchaseMst', s."Purs_OrderCode", NULL
FROM public.legacy_refs r JOIN legacy_umiya24."PurchaseSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'PurchaseSubMst';
DELETE FROM bl WHERE coalesce(ord, '') IN ('', '0') AND coalesce(disp, '') IN ('', '0');
ANALYZE bl;
CREATE TEMP TABLE odoc AS SELECT id, db, tbl, code FROM mig.vmap WHERE tbl IN ('QuotationMst', 'DispatchMst');
CREATE INDEX ON odoc (tbl, code, db); ANALYZE odoc;
-- order / challan document of each bill line (same database first)
CREATE TEMP TABLE bl_doc AS
SELECT DISTINCT ON (bl.id) bl.id, o.id AS ord_vid FROM bl JOIN odoc o ON o.tbl = 'QuotationMst' AND o.code = bl.ord
WHERE coalesce(bl.ord, '') NOT IN ('', '0') ORDER BY bl.id, (o.db = bl.db) DESC;
CREATE TEMP TABLE bl_dsp AS
SELECT DISTINCT ON (bl.id) bl.id, o.id AS ds_vid FROM bl JOIN odoc o ON o.tbl = 'DispatchMst' AND o.code = bl.disp
WHERE coalesce(bl.disp, '') NOT IN ('', '0') ORDER BY bl.id, (o.db = bl.db) DESC;
-- the order line: same item first, then the first line
CREATE TEMP TABLE bl_ol AS
SELECT DISTINCT ON (d.id) d.id, ol2.id AS ol_id
FROM bl_doc d JOIN public.voucher_lines l ON l.id = d.id JOIN public.voucher_lines ol2 ON ol2.voucher_id = d.ord_vid
ORDER BY d.id, (ol2.item_id IS NOT DISTINCT FROM l.item_id) DESC, ol2.line_no;
CREATE TEMP TABLE bl_dl AS
SELECT DISTINCT ON (d.id) d.id, dl.id AS dl_id FROM bl_dsp d JOIN public.voucher_lines dl ON dl.voucher_id = d.ds_vid ORDER BY d.id, dl.line_no;
UPDATE public.voucher_lines l SET order_line_id = x.ol_id FROM bl_ol x WHERE l.id = x.id AND l.order_line_id IS NULL;
UPDATE public.voucher_lines l SET source_line_id = x.dl_id FROM bl_dl x WHERE l.id = x.id AND l.source_line_id IS NULL;
-- the bill header points at its order / schedule too
UPDATE public.vouchers v SET source_id = x.src FROM (
  SELECT l.voucher_id, min(sv.voucher_id) AS src FROM public.voucher_lines l JOIN public.voucher_lines sv ON sv.id = coalesce(l.source_line_id, l.order_line_id)
  WHERE l.source_line_id IS NOT NULL OR l.order_line_id IS NOT NULL GROUP BY l.voucher_id) x
WHERE v.id = x.voucher_id AND v.source_id IS NULL;
SELECT mig.note('tidy: bills linked to their orders and challans');

-- 6. books: the old "display" flag is not "in use" — a book used in the current books (UMIYA24 period) stays selectable
UPDATE public.books b SET is_active = true
WHERE NOT b.is_active AND EXISTS (SELECT 1 FROM public.vouchers v WHERE v.book_id = b.id AND v.ledger_period = 24);
SELECT mig.note('tidy: books in use active');

-- 7. payments: the old software keeps a payment's amount as a negative number; YarnFlow keeps every
--    document's amount positive (the type says which way the money went)
UPDATE public.vouchers SET amount = -amount, net_amount = -net_amount
WHERE type = 'PAYMENT' AND (amount < 0 OR net_amount < 0) AND amount <= 0 AND net_amount <= 0;
SELECT mig.note('tidy: payment amounts positive');
