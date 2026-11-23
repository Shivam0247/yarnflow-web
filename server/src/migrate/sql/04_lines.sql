-- Step 3d: document lines. Every line row of the old software becomes one YarnFlow line
-- of the document it belongs to (matched by database + table + code). Lines of carried-forward
-- copies are not loaded twice: their document was made from UMIYA20.
TRUNCATE public.voucher_lines RESTART IDENTITY;
DELETE FROM public.legacy_refs WHERE entity = 'voucher_line';
SELECT mig.note('lines: start');

CREATE TEMP TABLE itm AS SELECT legacy_code AS code, id FROM public.items WHERE company_id = 1;
CREATE UNIQUE INDEX ON itm (code); ANALYZE itm;
CREATE TEMP TABLE acc AS SELECT legacy_code AS code, id FROM public.accounts WHERE company_id = 1;
CREATE UNIQUE INDEX ON acc (code); ANALYZE acc;
CREATE TEMP TABLE lot AS SELECT legacy_code AS code, number FROM public.lots WHERE company_id = 1;
CREATE UNIQUE INDEX ON lot (code); ANALYZE lot;
CREATE TEMP TABLE lk AS SELECT code, name FROM public.lookups;
CREATE UNIQUE INDEX ON lk (code); ANALYZE lk;
CREATE TEMP TABLE gd AS SELECT legacy_code AS code, id FROM public.godowns WHERE company_id = 1;
CREATE TEMP TABLE unit AS SELECT k AS code, btrim(j->>'Unit_Name') AS name FROM mig.latest('UnitMst', '"Unit_Code"');

-- all line rows of both databases as jsonb, with the document they belong to
CREATE TEMP TABLE src_line (db text, tbl text, doc_tbl text, doc_code text, line_no integer, j jsonb, _row bigint, _sha text);
INSERT INTO src_line SELECT 'UMIYA20', 'SalesSubMst', 'SalesMst', "SalS_Code", mig.int("SalS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."SalesSubMst" t;
INSERT INTO src_line SELECT 'UMIYA24', 'SalesSubMst', 'SalesMst', "SalS_Code", mig.int("SalS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."SalesSubMst" t;
INSERT INTO src_line SELECT 'UMIYA20', 'PurchaseSubMst', 'PurchaseMst', "PurS_Code", mig.int("PurS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."PurchaseSubMst" t;
INSERT INTO src_line SELECT 'UMIYA24', 'PurchaseSubMst', 'PurchaseMst', "PurS_Code", mig.int("PurS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."PurchaseSubMst" t;
INSERT INTO src_line SELECT 'UMIYA20', 'QuotationSubMst', 'QuotationMst', "SalS_Code", mig.int("SalS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."QuotationSubMst" t;
INSERT INTO src_line SELECT 'UMIYA24', 'QuotationSubMst', 'QuotationMst', "SalS_Code", mig.int("SalS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."QuotationSubMst" t;
INSERT INTO src_line SELECT 'UMIYA20', 'RecSubMst', 'RecMst', "RecS_Code", mig.int("RecS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."RecSubMst" t;
INSERT INTO src_line SELECT 'UMIYA24', 'RecSubMst', 'RecMst', "RecS_Code", mig.int("RecS_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."RecSubMst" t;
INSERT INTO src_line SELECT 'UMIYA20', 'AutoDebitNoteSubMst', 'AutoDebitNoteMst', "AutoDbtS_Code", mig.int("AutoDbtS_AutoNo"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."AutoDebitNoteSubMst" t;
INSERT INTO src_line SELECT 'UMIYA24', 'AutoDebitNoteSubMst', 'AutoDebitNoteMst', "AutoDbtS_Code", mig.int("AutoDbtS_AutoNo"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."AutoDebitNoteSubMst" t;
-- journal lines of the journals that are documents of their own
INSERT INTO src_line SELECT 'UMIYA20', 'JVMst', 'JVMst', "JV_Code" || '/' || "ComCode", mig.int("JV_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."JVMst" t;
INSERT INTO src_line SELECT 'UMIYA24', 'JVMst', 'JVMst', "JV_Code" || '/' || "ComCode", mig.int("JV_Auto"), to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."JVMst" t;
-- a dispatch challan is one row in the old software: its item line is the same row
INSERT INTO src_line SELECT 'UMIYA20', 'DispatchMst', 'DispatchMst', "Dspt_Code", 1, to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya20."DispatchMst" t;
INSERT INTO src_line SELECT 'UMIYA24', 'DispatchMst', 'DispatchMst', "Dspt_Code", 1, to_jsonb(t) - '_row' - '_sha', _row, _sha FROM legacy_umiya24."DispatchMst" t;
CREATE INDEX ON src_line (db, doc_tbl, doc_code);
ANALYZE src_line;
SELECT mig.note('lines: sources collected');

CREATE TEMP TABLE lmap AS
SELECT nextval(pg_get_serial_sequence('public.voucher_lines', 'id'))::integer AS id, v.id AS voucher_id, l.*
FROM src_line l JOIN mig.vmap v ON v.db = l.db AND v.tbl = l.doc_tbl AND v.code = l.doc_code;
SELECT mig.note('lines: matched to documents');

INSERT INTO public.voucher_lines (id, voucher_id, line_no, item_id, account_id, description, brand, lot_no, grade, hsn, unit, godown_id,
  pcs, cops, qty, weight, rate, basic_amount, disc_pct, disc_amount, freight_pct, freight_amount, insurance_pct, insurance_amount,
  taxable_amount, gst_rate, cgst_amount, sgst_amount, igst_amount, tcs_amount, amount, debit, credit,
  remark1, remark2, challan_no, challan_date, purchase_ref, lr_no, line_status, legacy_code, extra)
SELECT l.id, l.voucher_id, coalesce(l.line_no, 0),
  (SELECT id FROM itm WHERE code = coalesce(j->>'SalS_Icode', j->>'PurS_Icode', j->>'Dspt_ItemName', j->>'AutoDbtS_ICode', j->>'Jv_ICode', j->>'RecS_Icode')),
  (SELECT id FROM acc WHERE code = coalesce(j->>'RecS_Pcode', j->>'JV_Pcode', CASE WHEN l.tbl = 'PurchaseSubMst' THEN mig.s(j->>'Purs_Pcode') END, j->>'AutoDbtS_PCode')),
  left(coalesce(mig.s(j->>'SalS_Name'), mig.s(j->>'DsptS_itemName'), mig.s(j->>'AutoDbtS_BillNo')), 240),
  left((SELECT name FROM lk WHERE code = coalesce(j->>'Sals_Brand', j->>'Purs_Brand', j->>'Dispt_Brand')), 120),
  left(coalesce((SELECT number FROM lot WHERE code = coalesce(j->>'Sals_LotNo', j->>'PurS_LotNo', j->>'Dspt_LotNo')), mig.s(j->>'Dspt_PLotno')), 40),
  left((SELECT name FROM lk WHERE code = coalesce(j->>'SalS_Grade', j->>'Sals_Grade', j->>'Purs_Grade', j->>'Dispt_GradeCode')), 20),
  left(coalesce(mig.s(j->>'Sals_HsnCode'), mig.s(j->>'SalS_HsnCode'), mig.s(j->>'PurS_HsnCode'), mig.s(j->>'Dspt_HSNCode'), mig.s(j->>'Recs_HsnCode'), mig.s(j->>'JV_HsnCode')), 10),
  coalesce((SELECT name FROM unit WHERE code = coalesce(j->>'SalS_Ucode', j->>'PurS_Ucode', j->>'Dispt_Unit')), ''),
  (SELECT id FROM gd WHERE code = coalesce(j->>'SalS_Godown', j->>'Purs_Godown')),
  coalesce(mig.num(j->>'SalS_SqMt_Ft'), mig.num(j->>'PurS_SqMt_Ft'), mig.num(j->>'Dspt_TotBoxes'), mig.num(j->>'AutoDbtS_Pcs'), 0),
  coalesce(mig.num(j->>'Sals_Cops'), mig.num(j->>'PurS_Cops'), mig.num(j->>'Dspt_TotCops'), 0),
  coalesce(mig.num(j->>'SalS_Qty'), mig.num(j->>'PurS_Qty'), mig.num(j->>'Dspt_TotQty'), mig.num(j->>'AutoDbtS_Qty'), mig.num(j->>'JV_Qty'), 0),
  coalesce(mig.num(j->>'SalS_Weight'), mig.num(j->>'Purs_Weight'), mig.num(j->>'Dspt_Wt')),
  coalesce(mig.num(j->>'SalS_Rate'), mig.num(j->>'PurS_Rate'), mig.num(j->>'Dspt_Rate'), 0),
  coalesce(mig.num(j->>'Sals_BasicAmt'), mig.num(j->>'PurS_BasicAmt'), mig.num(j->>'Dspt_BasicAmt'), 0),
  coalesce(mig.num(j->>'SalS_DisPer'), mig.num(j->>'PurS_DisPer'), mig.num(j->>'AutoDbtS_DisPer'), 0),
  coalesce(mig.num(j->>'SalS_DisAmt'), mig.num(j->>'PurS_DisAmt'), mig.num(j->>'AutoDbtS_DisPer_Amt'), 0),
  coalesce(mig.num(j->>'Sals_FreightPer'), mig.num(j->>'Purs_FrieghtPer'), 0),
  coalesce(mig.num(j->>'Sals_FreightAmt'), mig.num(j->>'Purs_FrieghtAmt'), 0),
  coalesce(mig.num(j->>'Sals_InsurancePer'), mig.num(j->>'Purs_InsuPer'), 0),
  coalesce(mig.num(j->>'Sals_InsuranceAmt'), mig.num(j->>'Purs_InsuAmt'), 0),
  coalesce(mig.num(j->>'Sals_TaxableAmt'), mig.num(j->>'SalS_TaxableAmt'), mig.num(j->>'PurS_TaxableAmt'), mig.num(j->>'RecS_TaxableAmt'), mig.num(j->>'JvBeforeTax'), 0),
  coalesce(mig.num(j->>'SalS_VatPer'), mig.num(j->>'PurS_VatPer'), 0) + coalesce(mig.num(j->>'SalS_AdPer'), mig.num(j->>'PurS_AdPer'), 0)
    + coalesce(mig.num(j->>'SalS_ExPer'), mig.num(j->>'PurS_ExPer'), 0),
  coalesce(mig.num(j->>'SalS_VatAmt'), mig.num(j->>'PurS_VatAmt'), mig.num(j->>'Dspt_CGSTAmt'), mig.num(j->>'RecS_CGstAmt'), mig.num(j->>'Jv_CGst'), 0),
  coalesce(mig.num(j->>'SalS_AdAmt'), mig.num(j->>'PurS_AdAmt'), mig.num(j->>'Dspt_SGSTAmt'), mig.num(j->>'RecS_SGstAmt'), mig.num(j->>'Jv_SGst'), 0),
  coalesce(mig.num(j->>'SalS_ExAmt'), mig.num(j->>'PurS_ExAmt'), mig.num(j->>'Dspt_IGSTAmt'), mig.num(j->>'RecS_IGstAmt'), mig.num(j->>'Jv_IGst'), 0),
  coalesce(mig.num(j->>'Purs_TcsAmt'), mig.num(j->>'Jv_TcsAmt'), 0),
  coalesce(mig.num(j->>'SalS_Amt'), mig.num(j->>'PurS_Amt'), mig.num(j->>'RecS_Amount'), mig.num(j->>'Dspt_FinalAmt'), mig.num(j->>'AutoDbtS_FinalAmt'), mig.num(j->>'JV_Amt'), 0),
  CASE WHEN l.tbl = 'JVMst' AND upper(j->>'Jv_DC') IN ('DB', 'D', 'DR') THEN mig.num0(j->>'JV_Amt') ELSE 0 END,
  CASE WHEN l.tbl = 'JVMst' AND upper(j->>'Jv_DC') NOT IN ('DB', 'D', 'DR') THEN mig.num0(j->>'JV_Amt') ELSE 0 END,
  left(coalesce(mig.s(j->>'SalS_Rmk1'), mig.s(j->>'SalS_Rmk'), mig.s(j->>'PurS_Rmk'), mig.s(j->>'RecS_Chkno'), mig.s(j->>'Dspt_Remarks1')), 200),
  left(coalesce(mig.s(j->>'SalS_Rmk2'), mig.s(j->>'RecS_BillNo'), mig.s(j->>'Jv_BillNo')), 200),
  left(coalesce(mig.s(j->>'Sals_Challano'), mig.s(j->>'PurS_Challano'), mig.s(j->>'Dspt_ChallNo')), 40),
  coalesce(mig.d(j->>'Sals_ChDate'), mig.d(j->>'Purs_ChDate'), mig.d(j->>'Dspt_ChallDate')),
  left(coalesce(mig.s(j->>'Sals_PurCode'), mig.s(j->>'Purs_OrderCode'), mig.s(j->>'Dspt_SalCode')), 40),
  left(coalesce(mig.s(j->>'SalS_LrNo'), mig.s(j->>'Purs_LrNo'), mig.s(j->>'Dspt_Lrno')), 40),
  left(coalesce(mig.s(j->>'Sals_Status'), mig.s(j->>'PurS_Status')), 20),
  l.doc_code || '/' || coalesce(l.line_no::text, ''),
  NULL  -- the complete original row stays in the archive, linked through legacy_refs
FROM lmap l;
SELECT mig.note('lines: inserted');

INSERT INTO public.legacy_refs SELECT 'voucher_line', l.id, l.db, l.tbl, l.doc_code || '#' || l._row, l._row, l._sha FROM lmap l;

-- order rate break-ups (QuotationSubSMst: rate per grade / discounts) kept with the order line they belong to
UPDATE public.voucher_lines vl SET extra = coalesce(vl.extra, '{}'::jsonb) || jsonb_build_object('rateBreakup', x.rows)
FROM (
  SELECT v.id AS voucher_id, mig.int(s.j->>'SalSS_ItemAutoNo') AS line_no, jsonb_agg(mig.row(s.j) ORDER BY mig.int(s.j->>'SalSS_AutoNo')) AS rows
  FROM (SELECT 'UMIYA20' AS db, to_jsonb(t) - '_row' - '_sha' AS j FROM legacy_umiya20."QuotationSubSMst" t
        UNION ALL SELECT 'UMIYA24', to_jsonb(t) - '_row' - '_sha' FROM legacy_umiya24."QuotationSubSMst" t) s
  JOIN mig.vmap v ON v.db = s.db AND v.tbl = 'QuotationMst' AND v.code = s.j->>'SalSS_Code'
  GROUP BY v.id, mig.int(s.j->>'SalSS_ItemAutoNo')) x
WHERE vl.voucher_id = x.voucher_id AND vl.line_no = coalesce(x.line_no, 0);
SELECT mig.note('lines: order rate break-ups attached');
