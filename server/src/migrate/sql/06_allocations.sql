-- Step 3f: bill-wise settlement (what was received / adjusted against each bill), exactly the
-- sources the old software sums in its outstanding (view AllBillAdjustDetail / BillAdjustmentDetails):
--   RecSubBilladjustMst  receipt / payment against a bill           kind RECEIPT
--   SalPurBillAdustMst   bill against bill (returns, purchases)     kind BILL
--   JVBillAdustMst       journal / debit note / credit note / TDS   kind JOURNAL
--   PendingAdjustmentSubMst  pending adjustments                    kind PENDING
--   Sal/Pur_OpPaidAmt on carried-forward bills                      kind OPENING_PAID
-- Each settlement keeps the database it came from (ledger_period), so outstanding of each
-- period equals the old database's own outstanding.
TRUNCATE public.bill_allocations RESTART IDENTITY;
SELECT mig.note('allocations: start');

-- every old document key -> YarnFlow voucher. Journals are keyed by JV_Code + company;
-- GST / TDS journals that were attached to their bill point to that bill.
CREATE TEMP TABLE dk (db text, key text, comp integer, vid integer);
INSERT INTO dk SELECT db, CASE WHEN tbl = 'JVMst' THEN split_part(code, '/', 1) ELSE code END, comp, id FROM mig.vmap;
INSERT INTO dk SELECT DISTINCT ON (j.db, j.code, j.comp) j.db, j.code, j.comp, p.vid
FROM (SELECT 'UMIYA20' AS db, "JV_Code" AS code, mig.int("ComCode") AS comp, "JV_Reff" AS reff FROM legacy_umiya20."JVMst"
        WHERE "Jv_Type" IN ('CGST','SGST','IGST','TDS','TCSPAY','TCSREC') AND coalesce("JV_Reff", '') <> ''
      UNION ALL
      SELECT 'UMIYA24', "JV_Code", mig.int("ComCode"), "JV_Reff" FROM legacy_umiya24."JVMst"
        WHERE "Jv_Type" IN ('CGST','SGST','IGST','TDS','TCSPAY','TCSREC') AND coalesce("JV_Reff", '') <> '') j
JOIN (SELECT db, code, id AS vid FROM mig.vmap WHERE tbl IN ('SalesMst', 'PurchaseMst', 'RecMst')) p ON p.db = j.db AND p.code = j.reff;
CREATE INDEX ON dk (key, db, comp);
ANALYZE dk;

-- resolve an old document code: same database + company first, then same database, then the other database
CREATE OR REPLACE FUNCTION pg_temp.res(k text, c integer, d text) RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT vid FROM dk WHERE key = k ORDER BY (db = d) DESC, (comp = c) DESC LIMIT 1 $$;

CREATE TEMP TABLE src_alloc (db text, tbl text, kind text, doc text, bill text, comp integer, party text, amount numeric,
  interest numeric, tds numeric, d date, j jsonb, _row bigint, _sha text);
INSERT INTO src_alloc SELECT 'UMIYA20', 'RecSubBilladjustMst', 'RECEIPT', "RecSS_Code", "RecSS_BillCode", mig.int("ComCode"), "RecSS_Pcode",
  mig.num0("RecSS_BillRecAmt"), mig.num("RecSS_Intrest"), mig.num("Rec_TDSAmt"), mig.d("RecSS_RecDate"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."RecSubBilladjustMst" t;
INSERT INTO src_alloc SELECT 'UMIYA24', 'RecSubBilladjustMst', 'RECEIPT', "RecSS_Code", "RecSS_BillCode", mig.int("ComCode"), "RecSS_Pcode",
  mig.num0("RecSS_BillRecAmt"), mig.num("RecSS_Intrest"), mig.num("Rec_TDSAmt"), mig.d("RecSS_RecDate"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."RecSubBilladjustMst" t;
INSERT INTO src_alloc SELECT 'UMIYA20', 'SalPurBillAdustMst', 'BILL', "Adj_Code", "Adj_BillCode", mig.int("ComCode"), "Adj_Pcode",
  mig.num0("Adj_BillRecAmt"), NULL, NULL, mig.d("Adj_RecDate"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."SalPurBillAdustMst" t;
INSERT INTO src_alloc SELECT 'UMIYA24', 'SalPurBillAdustMst', 'BILL', "Adj_Code", "Adj_BillCode", mig.int("ComCode"), "Adj_Pcode",
  mig.num0("Adj_BillRecAmt"), NULL, NULL, mig.d("Adj_RecDate"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."SalPurBillAdustMst" t;
INSERT INTO src_alloc SELECT 'UMIYA20', 'JVBillAdustMst', 'JOURNAL', "JVS_Code", "JVS_BillCode", mig.int("ComCode"), "JVS_Pcode",
  mig.num0("JVS_BillRecAmt"), NULL, NULL, mig.d("RecSS_RecDate"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."JVBillAdustMst" t;
INSERT INTO src_alloc SELECT 'UMIYA24', 'JVBillAdustMst', 'JOURNAL', "JVS_Code", "JVS_BillCode", mig.int("ComCode"), "JVS_Pcode",
  mig.num0("JVS_BillRecAmt"), NULL, NULL, mig.d("RecSS_RecDate"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."JVBillAdustMst" t;
INSERT INTO src_alloc SELECT 'UMIYA20', 'PendingAdjustmentSubMst', 'PENDING', "OthS_Code", "OthS_BillCode", mig.int("OthS_ComCode"), "OthS_PCode",
  mig.num0("OthS_Amount"), NULL, NULL, mig.d("OthS_Date"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."PendingAdjustmentSubMst" t;
INSERT INTO src_alloc SELECT 'UMIYA24', 'PendingAdjustmentSubMst', 'PENDING', "OthS_Code", "OthS_BillCode", mig.int("OthS_ComCode"), "OthS_PCode",
  mig.num0("OthS_Amount"), NULL, NULL, mig.d("OthS_Date"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."PendingAdjustmentSubMst" t;
-- amounts already paid before the database began (carried-forward bills of each database)
INSERT INTO src_alloc SELECT db, tbl, 'OPENING_PAID', NULL, code, comp, coalesce(j->>'Sal_Pcode', j->>'Pur_Pcode'),
  coalesce(mig.num(j->>'Sal_OpPaidAmt'), mig.num(j->>'Pur_OpPaidAmt')), NULL, NULL, NULL, NULL, _row, _sha
FROM (SELECT 'UMIYA20' AS db, 'SalesMst' AS tbl, "Sal_Code" AS code, mig.int("ComCode") AS comp, to_jsonb(t) AS j, _row, _sha FROM legacy_umiya20."SalesMst" t
        WHERE "Sal_IsLastYearEntry" = '1' AND mig.num("Sal_OpPaidAmt") <> 0
      UNION ALL SELECT 'UMIYA24', 'SalesMst', "Sal_Code", mig.int("ComCode"), to_jsonb(t), _row, _sha FROM legacy_umiya24."SalesMst" t
        WHERE "Sal_IsLastYearEntry" = '1' AND mig.num("Sal_OpPaidAmt") <> 0
      UNION ALL SELECT 'UMIYA20', 'PurchaseMst', "Pur_Code", mig.int("ComCode"), to_jsonb(t), _row, _sha FROM legacy_umiya20."PurchaseMst" t
        WHERE "Pur_IsLastYearEntry" = '1' AND mig.num("Pur_OpPaidAmt") <> 0
      UNION ALL SELECT 'UMIYA24', 'PurchaseMst', "Pur_Code", mig.int("ComCode"), to_jsonb(t), _row, _sha FROM legacy_umiya24."PurchaseMst" t
        WHERE "Pur_IsLastYearEntry" = '1' AND mig.num("Pur_OpPaidAmt") <> 0) x;
ANALYZE src_alloc;
SELECT mig.note('allocations: sources collected');

CREATE TEMP TABLE amap AS
SELECT a.*, pg_temp.res(a.bill, a.comp, a.db) AS bill_id, CASE WHEN a.doc IS NULL THEN NULL ELSE pg_temp.res(a.doc, a.comp, a.db) END AS vid
FROM src_alloc a;
SELECT mig.note('allocations: documents resolved');

-- a settlement whose bill cannot be found is kept against a placeholder bill (reported), never dropped
INSERT INTO public.vouchers (company_id, fy_id, type, subtype, ledger_period, legacy_code, number, date, status, narration, extra)
SELECT DISTINCT ON (m.db, m.comp, m.bill) coalesce(m.comp, 1), coalesce(mig.fy(coalesce(m.comp, 1), m.d), coalesce(m.comp, 1) * 100 + 1), 'JOURNAL', 'MISSINGBILL',
  CASE m.db WHEN 'UMIYA20' THEN 20 ELSE 24 END, m.bill, coalesce(m.bill, '-'), coalesce(m.d, DATE '1900-01-01'), 'POSTED',
  'Bill referenced by a settlement but not found in the old software', jsonb_build_object('_db', m.db, '_missingBill', true)
FROM amap m WHERE m.bill_id IS NULL;
UPDATE amap m SET bill_id = v.id FROM public.vouchers v
WHERE m.bill_id IS NULL AND v.subtype = 'MISSINGBILL' AND v.legacy_code IS NOT DISTINCT FROM m.bill AND v.company_id = coalesce(m.comp, 1)
  AND v.extra->>'_db' = m.db;

INSERT INTO public.bill_allocations (company_id, voucher_id, bill_id, amount, kind, date, interest, tds_amount, party_id, ledger_period, extra)
SELECT coalesce(m.comp, 1), m.vid, m.bill_id, m.amount, m.kind, m.d, m.interest, m.tds,
  (SELECT id FROM public.accounts WHERE company_id = 1 AND legacy_code = m.party), CASE m.db WHEN 'UMIYA20' THEN 20 ELSE 24 END,
  jsonb_build_object('_db', m.db, '_table', m.tbl, '_row', m._row)
FROM amap m;
SELECT mig.note('allocations: inserted');

-- receipt deductions (RecJVMst: discount / rate difference / brokerage booked while receiving) kept with the receipt
UPDATE public.vouchers v SET extra = coalesce(v.extra, '{}'::jsonb) || jsonb_build_object('deductions', x.rows)
FROM (SELECT vm.id, jsonb_agg(mig.row(r.j) ORDER BY r._row) AS rows
      FROM (SELECT 'UMIYA20' AS db, to_jsonb(t) - '_row' - '_sha' AS j, t._row FROM legacy_umiya20."RecJVMst" t
            UNION ALL SELECT 'UMIYA24', to_jsonb(t) - '_row' - '_sha', t._row FROM legacy_umiya24."RecJVMst" t) r
      JOIN mig.vmap vm ON vm.db = r.db AND vm.tbl = 'RecMst' AND vm.code = r.j->>'RecJV_Code'
      GROUP BY vm.id) x
WHERE v.id = x.id;
SELECT mig.note('allocations: receipt deductions attached');
