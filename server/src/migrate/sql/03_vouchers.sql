-- Step 3c: documents (vouchers) and their lines.
-- Identity of an old document = (database, table, code). Bills carried forward from UMIYA20
-- into UMIYA24 (flagged IsLastYearEntry, same code) are converted ONCE from UMIYA20; the
-- UMIYA24 copy is linked to it (legacy_refs entity 'voucher_copy') and differences are reported.

TRUNCATE public.ledger_entries, public.stock_entries, public.bill_allocations, public.voucher_lines, public.vouchers, public.counters, public.books RESTART IDENTITY CASCADE;
DELETE FROM public.legacy_refs WHERE entity IN ('book', 'voucher', 'voucher_copy', 'voucher_line', 'ledger', 'allocation');

-- lookups by old code
CREATE TEMP TABLE acc AS SELECT legacy_code AS code, id FROM public.accounts WHERE company_id = 1;
CREATE UNIQUE INDEX ON acc (code);
ANALYZE acc;
CREATE TEMP TABLE per AS SELECT code, id FROM public.persons WHERE company_id = 1;
CREATE UNIQUE INDEX ON per (code);
ANALYZE per;
CREATE TEMP TABLE itm AS SELECT legacy_code AS code, id FROM public.items WHERE company_id = 1;
CREATE UNIQUE INDEX ON itm (code);
ANALYZE itm;
CREATE TEMP TABLE lot AS SELECT legacy_code AS code, number FROM public.lots WHERE company_id = 1;
CREATE UNIQUE INDEX ON lot (code);
ANALYZE lot;
CREATE TEMP TABLE lk AS SELECT code, name FROM public.lookups;
CREATE UNIQUE INDEX ON lk (code);
ANALYZE lk;
CREATE TEMP TABLE trn AS SELECT legacy_code AS code, id FROM public.transporters WHERE company_id = 1;
CREATE UNIQUE INDEX ON trn (code);
ANALYZE trn;
CREATE TEMP TABLE veh AS SELECT legacy_code AS code, number FROM public.vehicles WHERE company_id = 1;
CREATE UNIQUE INDEX ON veh (code);
ANALYZE veh;
CREATE TEMP TABLE unit AS SELECT k AS code, btrim(j->>'Unit_Name') AS name FROM mig.latest('UnitMst', '"Unit_Code"');

/* ---------------------------------------------------------------------- books (series) */
CREATE TEMP TABLE src_book AS SELECT * FROM mig.latest('BookMst', '"Bok_Code"');
INSERT INTO public.books (company_id, voucher_type, name, prefix, padding, with_fy_suffix, posting_account_id, is_active, legacy_type, account_id, legacy_code, extra)
SELECT coalesce((SELECT id FROM public.companies WHERE id = mig.int(b.j->>'ComCode')), 1), 'JOURNAL', coalesce(mig.s(btrim(b.j->>'Bok_Name')), b.k), '', 0, false,
  (SELECT id FROM acc WHERE code = b.k), coalesce(mig.b(b.j->>'Bok_IsDisplay'), true), mig.int(b.j->>'Bok_TraType'),
  (SELECT id FROM acc WHERE code = b.k), b.k, mig.row(b.j)
FROM src_book b;
CREATE TEMP TABLE bok AS SELECT legacy_code AS code, id FROM public.books;
CREATE UNIQUE INDEX ON bok (code);
ANALYZE bok;
INSERT INTO public.legacy_refs SELECT 'book', x.id, b.db, 'BookMst', b.k, b._row, b._sha FROM src_book b JOIN bok x ON x.code = b.k;

SELECT mig.note('books done');
/* ------------------------------------------------------------------ source documents */
-- one row per old document, both databases, as jsonb so differing column sets are no problem
CREATE TEMP TABLE src_doc (db text, tbl text, code text, comp integer, ftype text, j jsonb, _row bigint, _sha text);
INSERT INTO src_doc SELECT 'UMIYA20', 'SalesMst', "Sal_Code", mig.int("ComCode"), "Sal_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."SalesMst" t;
INSERT INTO src_doc SELECT 'UMIYA24', 'SalesMst', "Sal_Code", mig.int("ComCode"), "Sal_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."SalesMst" t;
INSERT INTO src_doc SELECT 'UMIYA20', 'PurchaseMst', "Pur_Code", mig.int("ComCode"), "Pur_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."PurchaseMst" t;
INSERT INTO src_doc SELECT 'UMIYA24', 'PurchaseMst', "Pur_Code", mig.int("ComCode"), "Pur_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."PurchaseMst" t;
INSERT INTO src_doc SELECT 'UMIYA20', 'RecMst', "Rec_Code", mig.int("ComCode"), "Rec_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."RecMst" t;
INSERT INTO src_doc SELECT 'UMIYA24', 'RecMst', "Rec_Code", mig.int("ComCode"), "Rec_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."RecMst" t;
INSERT INTO src_doc SELECT 'UMIYA20', 'QuotationMst', "Sal_Code", mig.int("ComCode"), "Sal_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."QuotationMst" t;
INSERT INTO src_doc SELECT 'UMIYA24', 'QuotationMst', "Sal_Code", mig.int("ComCode"), "Sal_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."QuotationMst" t;
INSERT INTO src_doc SELECT 'UMIYA20', 'DispatchMst', "Dspt_Code", mig.int("CompCode"), "Dspt_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."DispatchMst" t;
INSERT INTO src_doc SELECT 'UMIYA24', 'DispatchMst', "Dspt_Code", mig.int("CompCode"), "Dspt_Type", to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."DispatchMst" t;
INSERT INTO src_doc SELECT 'UMIYA20', 'AutoDebitNoteMst', "AutoDbt_Code", mig.int("AutoDbt_ComCode"), 'AUTODBNT', to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."AutoDebitNoteMst" t;
INSERT INTO src_doc SELECT 'UMIYA24', 'AutoDebitNoteMst', "AutoDbt_Code", mig.int("AutoDbt_ComCode"), 'AUTODBNT', to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."AutoDebitNoteMst" t;
INSERT INTO src_doc SELECT 'UMIYA20', 'PendingAdjustmentMst', "Oth_Code", mig.int("Oth_CompanyCode"), 'PENDADJ', to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."PendingAdjustmentMst" t;
INSERT INTO src_doc SELECT 'UMIYA24', 'PendingAdjustmentMst', "Oth_Code", mig.int("Oth_CompanyCode"), 'PENDADJ', to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."PendingAdjustmentMst" t;
-- journals: one document per (JV_Code, company); header taken from the first line.
-- GST / TDS / TCS journals that belong to a bill (JV_Reff) are attached to that bill instead (see ledger step).
INSERT INTO src_doc
SELECT DISTINCT ON (db, "JV_Code", "ComCode") db, 'JVMst', "JV_Code" || '/' || "ComCode", mig.int("ComCode"), "Jv_Type", j, _row, _sha FROM (
  SELECT 'UMIYA20' AS db, t."JV_Code", t."ComCode", t."Jv_Type", t."JV_Reff", mig.int(t."JV_Auto") AS auto, to_jsonb(t) - '_row' - '_sha' AS j, t._row, t._sha FROM legacy_umiya20."JVMst" t
  UNION ALL
  SELECT 'UMIYA24', t."JV_Code", t."ComCode", t."Jv_Type", t."JV_Reff", mig.int(t."JV_Auto"), to_jsonb(t) - '_row' - '_sha', t._row, t._sha FROM legacy_umiya24."JVMst" t) x
WHERE NOT ("Jv_Type" IN ('CGST', 'SGST', 'IGST', 'TDS', 'TCSPAY', 'TCSREC') AND coalesce("JV_Reff", '') <> '')
ORDER BY db, "JV_Code", "ComCode", auto, _row;

SELECT mig.note('source documents collected');
CREATE INDEX ON src_doc (tbl, code);
ANALYZE src_doc;

-- carried-forward copies: UMIYA24 rows flagged as last-year entries whose code exists in UMIYA20
CREATE TEMP TABLE cf AS
SELECT s.*, o._row AS orig_row FROM src_doc s
JOIN src_doc o ON o.db = 'UMIYA20' AND o.tbl = s.tbl AND o.code = s.code AND o.comp IS NOT DISTINCT FROM s.comp
WHERE s.db = 'UMIYA24' AND (mig.b(s.j->>'Sal_IsLastYearEntry') OR mig.b(s.j->>'Pur_IsLastYearEntry') OR mig.b(s.j->>'Jv_IsLastYear'));
ANALYZE cf;
DELETE FROM src_doc s USING cf WHERE s.db = cf.db AND s.tbl = cf.tbl AND s._row = cf._row;

SELECT mig.note('carried-forward copies separated');
/* ------------------------------------------------------------------ voucher headers */
CREATE TEMP TABLE vmap AS
SELECT nextval(pg_get_serial_sequence('public.vouchers', 'id'))::integer AS id, s.*,
  (CASE s.tbl
     WHEN 'SalesMst' THEN CASE WHEN s.ftype = 'SALRTN' THEN 'SALE_RETURN' ELSE 'SALE_BILL' END
     WHEN 'PurchaseMst' THEN CASE s.ftype WHEN 'PUR' THEN 'PURCHASE_BILL' WHEN 'AUTPUR' THEN 'PURCHASE_BILL' WHEN 'PURRTN' THEN 'PURCHASE_RETURN'
       WHEN 'GENPUR' THEN 'GENERAL_PURCHASE' WHEN 'GENSAL' THEN 'GENERAL_SALE' WHEN 'GENPURRTN' THEN 'PURCHASE_RETURN' WHEN 'GENSALRTN' THEN 'SALE_RETURN' ELSE 'PURCHASE_BILL' END
     WHEN 'RecMst' THEN CASE WHEN s.ftype LIKE '%RECRTN' THEN 'RECEIPT_RETURN' WHEN s.ftype LIKE '%PAYRTN' THEN 'PAYMENT_RETURN'
       WHEN s.ftype LIKE '%REC%' THEN 'RECEIPT' ELSE 'PAYMENT' END
     WHEN 'QuotationMst' THEN CASE WHEN s.ftype = 'PurOrder' THEN 'PURCHASE_ORDER' ELSE 'SALES_ORDER' END
     WHEN 'DispatchMst' THEN 'DISPATCH_SCHEDULE'
     WHEN 'AutoDebitNoteMst' THEN 'INTEREST_DEBIT_NOTE'
     WHEN 'PendingAdjustmentMst' THEN 'PENDING_ADJUSTMENT'
     WHEN 'JVMst' THEN CASE s.ftype WHEN 'DBNT' THEN 'DEBIT_NOTE' WHEN 'CRNT' THEN 'CREDIT_NOTE' ELSE 'JOURNAL' END
   END)::voucher_type AS vtype,
  (CASE s.tbl
     WHEN 'SalesMst' THEN mig.d(s.j->>'Sal_Date') WHEN 'PurchaseMst' THEN mig.d(s.j->>'Pur_Date') WHEN 'RecMst' THEN mig.d(s.j->>'Rec_VchDt')
     WHEN 'QuotationMst' THEN mig.d(s.j->>'Sal_Date') WHEN 'DispatchMst' THEN mig.d(s.j->>'Dspt_ChallDate')
     WHEN 'AutoDebitNoteMst' THEN mig.d(s.j->>'AutoDbt_Date') WHEN 'PendingAdjustmentMst' THEN mig.d(s.j->>'Oth_Date')
     WHEN 'JVMst' THEN mig.d(s.j->>'JV_VchDt') END) AS vdate,
  (CASE s.tbl
     WHEN 'SalesMst' THEN s.j->>'Sal_Id' WHEN 'PurchaseMst' THEN s.j->>'Pur_Id' WHEN 'RecMst' THEN s.j->>'Rec_VchNo'
     WHEN 'QuotationMst' THEN s.j->>'Sal_Id' WHEN 'DispatchMst' THEN s.j->>'Dspt_ChallNo'
     WHEN 'AutoDebitNoteMst' THEN s.j->>'AutoDbt_Id' WHEN 'PendingAdjustmentMst' THEN s.j->>'Oth_Id'
     WHEN 'JVMst' THEN s.j->>'JV_VchNo' END) AS vno,
  (CASE s.tbl
     WHEN 'SalesMst' THEN mig.int(s.j->>'Sal_YearCode') WHEN 'PurchaseMst' THEN mig.int(s.j->>'Pur_YearCode') WHEN 'RecMst' THEN mig.int(s.j->>'Rec_YearCode')
     WHEN 'QuotationMst' THEN mig.int(s.j->>'Sal_YearCode') WHEN 'DispatchMst' THEN mig.int(s.j->>'dspt_yearCode')
     WHEN 'PendingAdjustmentMst' THEN mig.int(s.j->>'Oth_YearCode') WHEN 'JVMst' THEN mig.int(s.j->>'JV_YearCode') END) AS vyear,
  (CASE s.tbl
     WHEN 'SalesMst' THEN s.j->>'Sal_Pcode' WHEN 'PurchaseMst' THEN s.j->>'Pur_Pcode'
     WHEN 'RecMst' THEN NULL WHEN 'QuotationMst' THEN s.j->>'Sal_Pcode' WHEN 'DispatchMst' THEN s.j->>'Dspt_PCode'
     WHEN 'AutoDebitNoteMst' THEN s.j->>'AutoDbt_PCode' WHEN 'PendingAdjustmentMst' THEN s.j->>'Oth_PCode' WHEN 'JVMst' THEN s.j->>'JV_Pcode' END) AS vparty,
  (CASE s.tbl
     WHEN 'SalesMst' THEN s.j->>'Sal_Bkcode' WHEN 'PurchaseMst' THEN s.j->>'Pur_Bkcode' WHEN 'RecMst' THEN coalesce(mig.s(s.j->>'Rec_BookCode'), s.j->>'Rec_BnkAc')
     WHEN 'QuotationMst' THEN s.j->>'Sal_Bkcode' WHEN 'DispatchMst' THEN s.j->>'Dspt_BookName'
     WHEN 'AutoDebitNoteMst' THEN s.j->>'AutoDbt_BookCode' WHEN 'PendingAdjustmentMst' THEN s.j->>'Oth_BkCode' WHEN 'JVMst' THEN s.j->>'Jv_BkCode' END) AS vbook
FROM src_doc s;
CREATE INDEX ON vmap (db, tbl, code);
ANALYZE vmap;
CREATE INDEX ON vmap (tbl, code);

SELECT mig.note('document map built');
-- financial year: the old YearCode when that year exists for the company, else by date
UPDATE vmap SET comp = 1 WHERE comp IS NULL OR NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = vmap.comp);
ALTER TABLE vmap ADD COLUMN fy integer;
UPDATE vmap SET fy = coalesce((SELECT id FROM public.financial_years f WHERE f.id = vmap.comp * 100 + vmap.vyear), mig.fy(vmap.comp, vmap.vdate), vmap.comp * 100 + 1);

SELECT mig.note('years resolved');
INSERT INTO public.vouchers (id, company_id, fy_id, type, subtype, ledger_period, legacy_code, book_id, number, date, status,
  party_id, delivery_party_id, broker_id, sales_person_id, collection_person_id, bank_account_id,
  ref_no, ref_date, credit_days, due_date, exp_delivery_date, transporter_id, vehicle_no, lr_no, lr_date, driver_name, delivery_address,
  total_pcs, total_cops, total_qty, total_weight, taxable_amount, cgst_amount, sgst_amount, igst_amount, tcs_amount, tds_amount,
  net_amount, amount, irn, ack_no, ack_date, ewb_no, remark, narration, extra)
SELECT v.id, v.comp, v.fy, v.vtype, v.ftype, CASE v.db WHEN 'UMIYA20' THEN 20 ELSE 24 END, v.code, (SELECT id FROM bok WHERE code = v.vbook),
  coalesce(v.vno, v.code), coalesce(v.vdate, DATE '1900-01-01'),
  (CASE WHEN mig.b(j->>'Sal_IsCancleEinv') OR mig.b(j->>'Pur_IsCancleEinv') OR mig.b(j->>'Jv_IsCancleEinv') OR mig.b(j->>'Sal_IsCancle') THEN 'CANCELLED'
        WHEN v.tbl = 'QuotationMst' THEN 'OPEN' WHEN v.tbl = 'DispatchMst' THEN 'OPEN' ELSE 'POSTED' END)::doc_status,
  (SELECT id FROM acc WHERE code = v.vparty),
  (SELECT id FROM acc WHERE code = coalesce(mig.s(j->>'Sal_DeleVedBy'), mig.s(j->>'Dspt_DelCode'), CASE WHEN v.tbl = 'QuotationMst' THEN mig.s(j->>'Sal_NoService') END)),
  (SELECT id FROM per WHERE code = coalesce(mig.s(j->>'Sal_Architect'), mig.s(j->>'Pur_Architect'), mig.s(j->>'Dspt_BrokerCode'), mig.s(j->>'Jv_BrokerCode'))),
  (SELECT id FROM per WHERE code = coalesce(mig.s(j->>'Sal_SalesPerson'), mig.s(j->>'Sal_SalesPersonCode'), mig.s(j->>'Pur_SalesPerson'), mig.s(j->>'Dspt_SalesPersonCode'), mig.s(j->>'Jv_SalePerCode'))),
  (SELECT id FROM per WHERE code = coalesce(mig.s(j->>'Sal_CollectionPerson'), mig.s(j->>'Rec_CollId'))),
  (SELECT id FROM acc WHERE code = mig.s(j->>'Rec_BnkAc')),
  left(coalesce(mig.s(j->>'Sal_SuppPONo'), mig.s(j->>'Pur_Invno'), mig.s(j->>'Sal_RefOrdNo'), mig.s(j->>'Dspt_OrderNo'), mig.s(j->>'Jv_BillNo'), mig.s(j->>'Oth_AdBillNo')), 60),
  coalesce(mig.d(j->>'Sal_SuppPODate'), mig.d(j->>'Pur_InvDt'), mig.d(j->>'Dspt_OrderDate')),
  coalesce(mig.int(j->>'Sal_Crdays'), mig.int(j->>'Pur_Crdays'), mig.int(j->>'Dispt_CrDays'), mig.int(j->>'Jv_CrDays'), 0),
  CASE WHEN v.tbl IN ('SalesMst', 'PurchaseMst') THEN coalesce(mig.d(j->>'Pur_DueDt'), v.vdate + coalesce(mig.int(j->>'Sal_Crdays'), mig.int(j->>'Pur_Crdays'), 0)) END,
  mig.d(j->>'Sal_ExpDlyDate'),
  (SELECT id FROM trn WHERE code = coalesce(mig.s(j->>'Sal_Transpoter'), mig.s(j->>'Pur_Transpoter'), mig.s(j->>'Dspt_Transpoter'))),
  left((SELECT number FROM veh WHERE code = coalesce(mig.s(j->>'Sal_VehicleNo'), mig.s(j->>'Pur_VehicalNo'), mig.s(j->>'Dspt_VehicalNo'))), 20),
  left(coalesce(mig.s(j->>'Sal_LrNo'), mig.s(j->>'Pur_LrNo'), mig.s(j->>'Dspt_Lrno')), 40), coalesce(mig.d(j->>'Sal_LrDate'), mig.d(j->>'Pur_LrDate'), mig.d(j->>'Dspt_LrDate')),
  left(coalesce(mig.s(j->>'Sal_DriverName'), mig.s(j->>'Pur_DriverName')), 120),
  coalesce(mig.s(j->>'Sal_DelAddress'), mig.s(j->>'Sal_DeliveryAddress'), mig.s(j->>'Dspt_DeliveryAddress'), mig.s(j->>'Pur_DelAdd')),
  coalesce(mig.num(j->>'Sal_TotPCS'), mig.num(j->>'Pur_TotPCS'), mig.num(j->>'Dspt_TotBoxes'), 0),
  coalesce(mig.num(j->>'Dspt_TotCops'), mig.num(j->>'Pur_TotCops'), 0),
  coalesce(mig.num(j->>'Sal_TotQty'), mig.num(j->>'Pur_TotQty'), mig.num(j->>'Dspt_TotQty'), 0),
  coalesce(mig.num(j->>'Sal_TotWeight'), mig.num(j->>'Pur_TotWeight'), mig.num(j->>'Dspt_Wt')),
  coalesce(mig.num(j->>'Sal_BfrVat4_1_Sum'), mig.num(j->>'Pur_BfrVat4_1_Sum'), mig.num(j->>'Dspt_BasicAmt'), 0),
  coalesce(mig.num(j->>'Sal_VatAmt_char'), mig.num(j->>'Pur_VatAmt_char'), mig.num(j->>'Dspt_CGSTAmt'), mig.num(j->>'AutoDbt_CGst'), 0),
  coalesce(mig.num(j->>'Sal_AddAmt_Ek'), mig.num(j->>'Pur_AddAmt_Ek'), mig.num(j->>'Dspt_SGSTAmt'), mig.num(j->>'AutoDbt_SGst'), 0),
  coalesce(mig.num(j->>'Sal_VatAmt_Bar'), mig.num(j->>'Pur_VatAmt_Bar'), mig.num(j->>'Dspt_IGSTAmt'), mig.num(j->>'AutoDbt_IGst'), 0),
  coalesce(mig.num(j->>'Sal_TCSAmt'), mig.num(j->>'Pur_TCSAmt'), 0),
  coalesce(mig.num(j->>'Sal_TDSAmt'), mig.num(j->>'Pur_TDSAmt'), mig.num(j->>'AutoDbt_TDSAmt'), 0),
  coalesce(mig.num(j->>'Sal_NetAmt'), mig.num(j->>'Pur_NetAmt'), mig.num(j->>'Rec_NetAmt'), mig.num(j->>'Dspt_FinalAmt'), mig.num(j->>'AutoDbt_Amount'), mig.num(j->>'Oth_Amount'), 0),
  coalesce(mig.num(j->>'Rec_NetAmt'), mig.num(j->>'Oth_Amount'), 0),
  left(coalesce(mig.s(j->>'Sal_IRN_No'), mig.s(j->>'Pur_IRN_No'), mig.s(j->>'JV_IRN_No'), mig.s(j->>'Dspt_IRN_No')), 80),
  left(coalesce(mig.s(j->>'Sal_ACK_No'), mig.s(j->>'Pur_ACK_No'), mig.s(j->>'JV_ACK_No'), mig.s(j->>'Dspt_ACK_No')), 30),
  coalesce(mig.ts(j->>'Sal_ACK_Date'), mig.ts(j->>'Pur_ACK_Date'), mig.ts(j->>'Jv_ACK_Date'), mig.ts(j->>'Dspt_ACK_Date')),
  left(coalesce(mig.s(j->>'Sal_EwayBillNo'), mig.s(j->>'Pur_EwayBillNo'), mig.s(j->>'Dspt_EwayBillNo')), 20),
  coalesce(mig.s(j->>'Sal_Rmk'), mig.s(j->>'Pur_Rmk'), mig.s(j->>'Rec_Rmk'), mig.s(j->>'Dspt_Remarks'), mig.s(j->>'Oth_Rmk')),
  mig.s(j->>'JV_MainRmk'),
  NULL  -- the complete original row stays in the archive, linked through legacy_refs
FROM vmap v;

SELECT mig.note('vouchers inserted');
INSERT INTO public.legacy_refs SELECT 'voucher', v.id, v.db, v.tbl, v.code, v._row, v._sha FROM vmap v;
-- link carried-forward copies to the voucher made from the UMIYA20 original
INSERT INTO public.legacy_refs SELECT 'voucher_copy', v.id, c.db, c.tbl, c.code, c._row, c._sha
FROM cf c JOIN vmap v ON v.db = 'UMIYA20' AND v.tbl = c.tbl AND v.code = c.code AND v.comp IS NOT DISTINCT FROM c.comp
ON CONFLICT DO NOTHING;

-- books take the voucher type their documents use most
UPDATE public.books b SET voucher_type = x.type FROM (
  SELECT DISTINCT ON (book_id) book_id, type FROM public.vouchers WHERE book_id IS NOT NULL GROUP BY book_id, type ORDER BY book_id, count(*) DESC) x
WHERE b.id = x.book_id;

-- keep vmap for the following steps
DROP TABLE IF EXISTS mig.vmap;
CREATE TABLE mig.vmap AS SELECT id, db, tbl, code, comp, fy, vtype, ftype, vdate FROM vmap;
CREATE INDEX ON mig.vmap (tbl, code, db);
CREATE INDEX ON mig.vmap (code);
