-- When each old document was entered and last changed (UCreatedt / Udatetime, Indian time), so entry-date reports
-- (Daily Sales Checking by user entry date, REGISTER by receipt entry date, DN user date-time, WhatsApp texts) work as before.
CREATE TEMP TABLE et (db text, tbl text, k text, c timestamptz, u timestamptz);
INSERT INTO et SELECT 'UMIYA20', 'SalesMst', "Sal_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya20."SalesMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA20', 'PurchaseMst', "Pur_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya20."PurchaseMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA20', 'RecMst', "Rec_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya20."RecMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA20', 'QuotationMst', "Sal_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya20."QuotationMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA20', 'DispatchMst', "Dspt_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("CUDatetime"::text, ''), "UDatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("UDatetime"::text))) FROM legacy_umiya20."DispatchMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA20', 'JVMst', "JV_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya20."JVMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA20', 'AutoDebitNoteMst', "AutoDbt_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("AutoDbt_CDateTime"::text, ''), "AutoDbt_UDateTime"::text)))), max(timezone('Asia/Kolkata', mig.ts("AutoDbt_UDateTime"::text))) FROM legacy_umiya20."AutoDebitNoteMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA24', 'SalesMst', "Sal_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya24."SalesMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA24', 'PurchaseMst', "Pur_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya24."PurchaseMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA24', 'RecMst', "Rec_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya24."RecMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA24', 'QuotationMst', "Sal_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya24."QuotationMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA24', 'DispatchMst', "Dspt_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("CUDatetime"::text, ''), "UDatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("UDatetime"::text))) FROM legacy_umiya24."DispatchMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA24', 'JVMst', "JV_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("UCreatedt"::text, ''), "Udatetime"::text)))), max(timezone('Asia/Kolkata', mig.ts("Udatetime"::text))) FROM legacy_umiya24."JVMst" GROUP BY 3;
INSERT INTO et SELECT 'UMIYA24', 'AutoDebitNoteMst', "AutoDbt_Code"::text, min(timezone('Asia/Kolkata', mig.ts(coalesce(nullif("AutoDbt_CDateTime"::text, ''), "AutoDbt_UDateTime"::text)))), max(timezone('Asia/Kolkata', mig.ts("AutoDbt_UDateTime"::text))) FROM legacy_umiya24."AutoDebitNoteMst" GROUP BY 3;
CREATE INDEX ON et (db, tbl, k);
UPDATE public.vouchers v SET created_at = et.c, updated_at = coalesce(et.u, et.c)
FROM public.legacy_refs r, et
WHERE r.entity = 'voucher' AND r.entity_id = v.id AND et.db = r.legacy_db AND et.tbl = r.legacy_table AND et.k = r.legacy_key AND et.c IS NOT NULL;
-- journals / notes are kept per code + company ("35257/1")
UPDATE public.vouchers v SET created_at = et.c, updated_at = coalesce(et.u, et.c)
FROM public.legacy_refs r, et
WHERE r.entity = 'voucher' AND r.entity_id = v.id AND r.legacy_key LIKE '%/%' AND et.db = r.legacy_db AND et.tbl = r.legacy_table
  AND et.k = split_part(r.legacy_key, '/', 1) AND et.c IS NOT NULL;
SELECT mig.note('vouchers: entry date-times from the old documents');
