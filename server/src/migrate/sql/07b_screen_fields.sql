-- Step 3i: every field the old screens show (see docs/old-software/screens.html) gets its value in YarnFlow.
-- Fields with a YarnFlow column of their own fill that column; the rest go to the document's / line's
-- `extra` under a fixed name the screen reads. Re-runnable: it only (re)sets these fields.
SELECT mig.note('screen fields: start');

-- helper: the archive row of every converted document / line of one old table (both databases)
CREATE OR REPLACE FUNCTION pg_temp.refs(ent text, tbl text) RETURNS TABLE (id integer, db text, rw integer) LANGUAGE sql STABLE AS $$
  SELECT entity_id, legacy_db, legacy_row FROM public.legacy_refs WHERE entity = ent AND legacy_table = tbl $$;
CREATE OR REPLACE FUNCTION pg_temp.jx(VARIADIC kv text[]) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(jsonb_object_agg(kv[i], btrim(kv[i + 1])) FILTER (WHERE kv[i + 1] IS NOT NULL AND btrim(kv[i + 1]) NOT IN ('', '0', '0.00', 'Null') AND kv[i + 1] NOT LIKE '01-01-1900%'), '{}'::jsonb)
  FROM generate_series(1, array_length(kv, 1), 2) i $$;
CREATE TEMP TABLE acc AS SELECT legacy_code AS code, id, name FROM public.accounts WHERE company_id = 1;
CREATE UNIQUE INDEX ON acc (code); ANALYZE acc;
CREATE TEMP TABLE tds AS SELECT "Tds_Code" AS code, btrim("Tds_Section") AS section FROM legacy_umiya24."TdsMst";

/* ---------------------------------------------------------------- purchase bills (PurchaseMst / PurchaseSubMst) */
CREATE TEMP TABLE pm AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher', 'PurchaseMst') r JOIN legacy_umiya20."PurchaseMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher', 'PurchaseMst') r JOIN legacy_umiya24."PurchaseMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.vouchers v SET
  delivery_party_id = coalesce((SELECT id FROM acc WHERE code = pm.j->>'Pur_DeleVedBy'), v.delivery_party_id),
  do_no = coalesce(left(mig.s(pm.j->>'Pur_DoNo'), 40), v.do_no),
  currency = coalesce((SELECT CASE WHEN name ILIKE '%rupee%' THEN 'INR' WHEN name ILIKE '%dollar%' THEN 'USD' WHEN name ILIKE '%euro%' THEN 'EUR' ELSE left(upper(name), 3) END
                       FROM public.lookups WHERE code = pm.j->>'Pur_CurrencyCode'), v.currency),
  tds_rate = coalesce(mig.num(pm.j->>'Pur_TDSPer'), v.tds_rate),
  extra = (coalesce(v.extra, '{}'::jsonb) - ARRAY['tdsSection','tdsAccount','gstTranType','netVat','avgRate','totalFreight','adjBillNo','adjBillDate']) || pg_temp.jx(
    'tdsSection', (SELECT section FROM tds WHERE code = pm.j->>'Pur_TDSSection'),
    'tdsAccount', (SELECT name FROM acc WHERE code = pm.j->>'Pur_TDSAccount'),
    'gstTranType', mig.s(pm.j->>'Pur_GstTranType'),
    'netVat', mig.s(pm.j->>'Pur_NetVat'),
    'avgRate', mig.s(pm.j->>'Pur_AvgRate'),
    'totalFreight', mig.s(pm.j->>'Pur_TotFrieght'),
    'adjBillNo', mig.s(pm.j->>'Pur_AdjBillNo'),
    'adjBillDate', to_char(mig.d(pm.j->>'Pur_AdjBillDt'), 'DD-MM-YYYY'))
FROM pm WHERE v.id = pm.id;
CREATE TEMP TABLE pl AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher_line', 'PurchaseSubMst') r JOIN legacy_umiya20."PurchaseSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher_line', 'PurchaseSubMst') r JOIN legacy_umiya24."PurchaseSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.voucher_lines l SET extra = (coalesce(l.extra, '{}'::jsonb) - ARRAY['tcsPct','cessPct','otherCharges','boxType','orderId','orderRate','avgRate','avgRateGst','grossAmt']) || pg_temp.jx(
    'tcsPct', mig.s(pl.j->>'Purs_TcsPer'),
    'cessPct', mig.s(pl.j->>'Purs_CessPer'),
    'otherCharges', mig.s(pl.j->>'Purs_OtherChrg'),
    'boxType', mig.s(pl.j->>'Purs_Boxtype'),
    'orderId', mig.s(pl.j->>'Purs_OrderId'),
    'orderRate', mig.s(pl.j->>'Purs_OrderRate'),
    'avgRate', mig.s(pl.j->>'PurS_AvgRate'),
    'avgRateGst', mig.s(pl.j->>'PurS_AvgRateGst'),
    'grossAmt', mig.s(pl.j->>'Pur_GrossAmt'))
FROM pl WHERE l.id = pl.id;
SELECT mig.note('screen fields: purchase bills');

/* ---------------------------------------------------------------- sale bills (SalesMst / SalesSubMst) */
CREATE TEMP TABLE per AS SELECT code, name FROM public.persons WHERE company_id = 1;
CREATE UNIQUE INDEX ON per (code); ANALYZE per;
CREATE TEMP TABLE sm AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher', 'SalesMst') r JOIN legacy_umiya20."SalesMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher', 'SalesMst') r JOIN legacy_umiya24."SalesMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.vouchers v SET
  extra = (coalesce(v.extra, '{}'::jsonb) - ARRAY['partyGroup','supplier','avgRate','netVat','gstTranType','cashCustomer','godownCompany']) || pg_temp.jx(
    'partyGroup', (SELECT name FROM per WHERE code = sm.j->>'Sal_Mistry'),
    'supplier', (SELECT name FROM acc WHERE code = sm.j->>'Sal_Supplier'),
    'avgRate', mig.s(sm.j->>'Sal_AvgRate'),
    'netVat', mig.s(sm.j->>'Sal_NetVat'),
    'gstTranType', mig.s(sm.j->>'Sal_GstTranType'),
    'cashCustomer', mig.s(sm.j->>'Sal_CashCusAdd'),
    'godownCompany', (SELECT name FROM per WHERE code = sm.j->>'Sal_Godown'))
FROM sm WHERE v.id = sm.id;
CREATE TEMP TABLE sl AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher_line', 'SalesSubMst') r JOIN legacy_umiya20."SalesSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher_line', 'SalesSubMst') r JOIN legacy_umiya24."SalesSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
-- the old sale screen keeps freight in the Ar columns and TCS in the M columns of the line
UPDATE public.voucher_lines l SET
  freight_pct = coalesce(nullif(mig.num0(sl.j->>'Sals_ArPer'), 0), l.freight_pct),
  freight_amount = coalesce(nullif(mig.num0(sl.j->>'Sals_ArAmt'), 0), l.freight_amount),
  tcs_amount = coalesce(nullif(mig.num0(sl.j->>'Sals_MAmt'), 0), l.tcs_amount),
  purchase_ref = coalesce(left(mig.s(sl.j->>'SalS_Com'), 40), l.purchase_ref),
  purchase_inv_no = coalesce(left(mig.s(sl.j->>'SalS_To'), 40), l.purchase_inv_no),
  extra = (coalesce(l.extra, '{}'::jsonb) - ARRAY['tcsPct','boxType','bomId','purchaseCode','orderId','avgRate','avgRateGst','grossAmt','brokeragePct','jobHsn','purChallan','purEntryCode']) || pg_temp.jx(
    'tcsPct', mig.s(sl.j->>'Sals_MPer'),
    'purChallan', mig.s(sl.j->>'SalS_BookeOn'),
    'purEntryCode', mig.s(sl.j->>'Sals_PurCode'),
    'boxType', mig.s(sl.j->>'Sals_Boxtype'),
    'bomId', mig.s(sl.j->>'SalS_BomId'),
    'purchaseCode', mig.s(sl.j->>'Sals_PurCodeMain'),
    'orderId', mig.s(sl.j->>'Sals_OrderId'),
    'avgRate', mig.s(sl.j->>'SalS_AvgRate'),
    'avgRateGst', mig.s(sl.j->>'SalS_AvgRateGst'),
    'grossAmt', mig.s(sl.j->>'SalS_GrossAmt'),
    'brokeragePct', mig.s(sl.j->>'SalS_BrkRagePer'),
    'jobHsn', mig.s(sl.j->>'SalS_JobHsn'))
FROM sl WHERE l.id = sl.id;
SELECT mig.note('screen fields: sale bills');

/* ---------------------------------------------------------------- dispatch schedules (DispatchMst: one row = header + its line) */
CREATE TEMP TABLE dm AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher', 'DispatchMst') r JOIN legacy_umiya20."DispatchMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher', 'DispatchMst') r JOIN legacy_umiya24."DispatchMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.vouchers v SET
  mill_id = coalesce((SELECT id FROM acc WHERE code = dm.j->>'Dispt_SupplierCode'), v.mill_id),
  ref_no = coalesce(left(mig.s(dm.j->>'Dispt_OrderCode'), 60), v.ref_no),
  ref_date = coalesce(mig.d(dm.j->>'Dspt_OrderDate'), v.ref_date),
  extra = (coalesce(v.extra, '{}'::jsonb) - ARRAY['saleBillNo','approved','actualChallanNo','actualChallanDate']) || pg_temp.jx(
    'saleBillNo', mig.s(dm.j->>'Dspt_SalId'),
    'approved', mig.s(dm.j->>'Dspt_IsApproved'),
    'actualChallanNo', mig.s(dm.j->>'Dspt_ActChallanNo'),
    'actualChallanDate', to_char(mig.d(dm.j->>'Dspt_ActChallanDt'), 'DD-MM-YYYY'))
FROM dm WHERE v.id = dm.id;
-- the schedule's item line: the supplier's challan / purchase it is dispatched from (the old item table)
UPDATE public.voucher_lines l SET
  challan_no = coalesce(left(mig.s(dm.j->>'Dispt_PurChNo'), 40), l.challan_no),
  challan_date = coalesce(mig.d(dm.j->>'Dispt_PurChDt'), l.challan_date),
  purchase_ref = coalesce(left(mig.s(dm.j->>'Dispt_PurID'), 40), l.purchase_ref),
  purchase_inv_no = coalesce(left(mig.s(dm.j->>'Dispt_InvNo'), 40), l.purchase_inv_no),
  remark2 = coalesce(left(mig.s(dm.j->>'Dspt_Boxtype'), 200), l.remark2),
  cops = coalesce(nullif(mig.num0(dm.j->>'Dspt_Cops'), 0), l.cops),
  extra = (coalesce(l.extra, '{}'::jsonb) - ARRAY['ordQty','purchaseCode','boxType']) || pg_temp.jx(
    'ordQty', mig.s(dm.j->>'Dispt_OrdQty'), 'purchaseCode', mig.s(dm.j->>'Dispt_PurCodeMain'), 'boxType', mig.s(dm.j->>'Dspt_Boxtype'))
FROM dm WHERE l.voucher_id = dm.id;
SELECT mig.note('screen fields: dispatch schedules');

/* ---------------------------------------------------------------- bank / cash receipts and payments (RecMst / RecSubMst) */
CREATE TEMP TABLE rm AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher', 'RecMst') r JOIN legacy_umiya20."RecMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher', 'RecMst') r JOIN legacy_umiya24."RecMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
-- the party, cheque and clearing of each entry sit on its (single) line in the old software
CREATE TEMP TABLE rs AS
SELECT DISTINCT ON (l.voucher_id) l.voucher_id AS id, x.j FROM (
  SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher_line', 'RecSubMst') r JOIN legacy_umiya20."RecSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
  UNION ALL
  SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher_line', 'RecSubMst') r JOIN legacy_umiya24."RecSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24') x
JOIN public.voucher_lines l ON l.id = x.id ORDER BY l.voucher_id, l.line_no;
UPDATE public.vouchers v SET
  party_id = coalesce(v.party_id, (SELECT id FROM acc WHERE code = rs.j->>'RecS_Pcode')),
  instrument_no = coalesce(v.instrument_no, left(mig.s(rs.j->>'RecS_Chkno'), 40)),
  instrument_date = coalesce(v.instrument_date, mig.d(rs.j->>'Rec_ChkDate')),
  extra = (coalesce(v.extra, '{}'::jsonb) - ARRAY['partyBank','cleared','clearedDate','billNo','lineRemark']) || pg_temp.jx(
    'partyBank', (SELECT name FROM public.lookups WHERE code = rs.j->>'RecS_PbnkAc'),
    'cleared', CASE WHEN rs.j->>'Clr_YN' = '1' THEN 'Yes' END,
    'clearedDate', to_char(mig.d(rs.j->>'Clr_Dt'), 'DD-MM-YYYY'),
    'billNo', mig.s(rs.j->>'RecS_BillNo'),
    'lineRemark', mig.s(rs.j->>'RecS_Rmk'))
FROM rs WHERE v.id = rs.id;
UPDATE public.vouchers v SET
  mode = coalesce((SELECT (CASE upper(name) WHEN 'CHEQUE' THEN 'CHEQUE' WHEN 'NEFT' THEN 'NEFT' WHEN 'RTGS' THEN 'RTGS' WHEN 'UPI' THEN 'UPI' WHEN 'CASH' THEN 'CASH' ELSE 'OTHER' END)::pay_mode
                   FROM public.lookups WHERE code = rm.j->>'Rec_CheqMode'), CASE WHEN rm.j->>'Rec_Type' LIKE 'CASH%' THEN 'CASH'::pay_mode END, v.mode),
  extra = (coalesce(v.extra, '{}'::jsonb) - ARRAY['slipNo','modeName','smsSent']) || pg_temp.jx(
    'smsSent', CASE WHEN rm.j->>'Rec_IsSmsSent' = '1' THEN 'Yes' END,
    'slipNo', mig.s(rm.j->>'Rec_Slip'),
    'modeName', (SELECT name FROM public.lookups WHERE code = rm.j->>'Rec_CheqMode'))
FROM rm WHERE v.id = rm.id;
SELECT mig.note('screen fields: receipts and payments');

/* ---------------------------------------------------------------- sales / purchase orders (QuotationMst / QuotationSubMst) */
CREATE TEMP TABLE qm AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher', 'QuotationMst') r JOIN legacy_umiya20."QuotationMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher', 'QuotationMst') r JOIN legacy_umiya24."QuotationMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.vouchers v SET
  mill_id = coalesce(v.mill_id, (SELECT id FROM acc WHERE code = qm.j->>'Sal_SupplierCode')),
  brokerage_rate = coalesce(nullif(v.brokerage_rate, 0), mig.num(qm.j->>'Sal_BrkKgs'), 0),
  order_mode = coalesce(v.order_mode, left(mig.s(qm.j->>'Sal_OrdBase'), 20)),
  ref_name = coalesce(v.ref_name, left(mig.s(qm.j->>'Sal_ReffName'), 120)),
  -- the old Order Type list (QuotationMst.Sal_OrderType is its position): Yarn, Beam, Spool, Pcs, Taka, Bag, Saree, Job, Stock taka, Stock saree
  order_type = (ARRAY['Yarn','Beam','Spool','Pcs','Taka','Bag','Saree','Job','Stock taka','Stock saree'])[coalesce(mig.int(qm.j->>'Sal_OrderType'), 0) + 1],
  extra = (coalesce(v.extra, '{}'::jsonb) - ARRAY['priority','approved','approvedOn','approvedBy','followUp','netVat','expDelDays']) || pg_temp.jx(
    'expDelDays', mig.s(qm.j->>'Sal_ExpDelDays'),
    'priority', mig.s(qm.j->>'Sal_Priority'),
    'approved', CASE WHEN qm.j->>'Sal_ApproveQuatation' = '1' THEN 'Yes' END,
    'approvedOn', to_char(mig.d(qm.j->>'Sal_ApproveDt'), 'DD-MM-YYYY'),
    'approvedBy', mig.s(qm.j->>'Sal_ApproveUserCode'),
    'followUp', mig.s(qm.j->>'Sal_FollowUpStatus'),
    'netVat', mig.s(qm.j->>'Sal_NetVat'))
FROM qm WHERE v.id = qm.id;
CREATE TEMP TABLE ql AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher_line', 'QuotationSubMst') r JOIN legacy_umiya20."QuotationSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher_line', 'QuotationSubMst') r JOIN legacy_umiya24."QuotationSubMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.voucher_lines l SET extra = (coalesce(l.extra, '{}'::jsonb) - ARRAY['netRate','freeQty','lastRate','avgRate','avgRateGst','grossAmt','closedOn']) || pg_temp.jx(
    'netRate', mig.s(ql.j->>'Sals_NetRate'),
    'freeQty', mig.s(ql.j->>'SalS_FreeQty'),
    'lastRate', mig.s(ql.j->>'SalS_LastRate'),
    'avgRate', mig.s(ql.j->>'SalS_AvgRate'),
    'avgRateGst', mig.s(ql.j->>'SalS_AvgRateGst'),
    'grossAmt', mig.s(ql.j->>'SalS_GrossAmt'),
    'closedOn', to_char(mig.d(ql.j->>'Sals_CloDate'), 'DD-MM-YYYY'))
FROM ql WHERE l.id = ql.id;
SELECT mig.note('screen fields: orders');

/* ---------------------------------------------------------------- journals, debit notes, credit notes (JVMst — the old journal form) */
CREATE TEMP TABLE cc AS SELECT legacy_code AS code, id FROM public.cost_centers WHERE company_id = 1;
CREATE TEMP TABLE jm AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher', 'JVMst') r JOIN legacy_umiya20."JVMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher', 'JVMst') r JOIN legacy_umiya24."JVMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.vouchers v SET
  amount = CASE WHEN v.amount = 0 THEN coalesce(mig.num(jm.j->>'JV_Amt'), 0) ELSE v.amount END,
  ref_date = coalesce(v.ref_date, nullif(mig.d(jm.j->>'Jv_AdBillDt'), DATE '1900-01-01')),
  credit_days = coalesce(nullif(v.credit_days, 0), mig.int(jm.j->>'Jv_CrDays'), 0),
  cost_center_id = coalesce(v.cost_center_id, (SELECT id FROM cc WHERE code = jm.j->>'CostcenterCode')),
  ack_no = coalesce(v.ack_no, left(mig.s(jm.j->>'JV_ACK_No'), 30)),
  extra = (coalesce(v.extra, '{}'::jsonb) - ARRAY['jvFormat','secondAccountId','secondAccount','tdsAccountId','tdsAccount','tdsSection','tdsPct','tdsAmt','gstPct',
           'beforeTax','cgstPct','cgst','sgstPct','sgst','igstPct','igst','tcsPct','tcs','billNo','billDate','hsn','gstTranType','partyVchNo','partyVchDate',
           'crNoteParty','provisional','autoNote','reason','einvCancelled','ackDate']) || jsonb_build_object('jvFormat', '1') || pg_temp.jx(
    'secondAccountId', (SELECT id::text FROM acc WHERE code = jm.j->>'Jv_SecndPcode'),
    'secondAccount', (SELECT name FROM acc WHERE code = jm.j->>'Jv_SecndPcode'),
    'tdsAccountId', (SELECT id::text FROM acc WHERE code = jm.j->>'Jv_TDSAccount'),
    'tdsAccount', (SELECT name FROM acc WHERE code = jm.j->>'Jv_TDSAccount'),
    'tdsSection', (SELECT section FROM tds WHERE code = jm.j->>'Jv_TDSSection'),
    'tdsPct', mig.s(jm.j->>'Jv_TDSPer'), 'tdsAmt', mig.s(jm.j->>'Jv_TDSAmt'),
    'gstPct', mig.s(jm.j->>'JvvatPer'), 'beforeTax', mig.s(jm.j->>'JvBeforeTax'),
    'cgstPct', mig.s(jm.j->>'Jv_CGstPer'), 'cgst', mig.s(jm.j->>'Jv_CGst'),
    'sgstPct', mig.s(jm.j->>'Jv_SGstPer'), 'sgst', mig.s(jm.j->>'Jv_SGst'),
    'igstPct', mig.s(jm.j->>'Jv_IGstPer'), 'igst', mig.s(jm.j->>'Jv_IGst'),
    'tcsPct', mig.s(jm.j->>'Jv_TcsPer'), 'tcs', mig.s(jm.j->>'Jv_TcsAmt'),
    'billNo', mig.s(jm.j->>'Jv_AdBillNo'), 'billDate', to_char(mig.d(jm.j->>'Jv_AdBillDt'), 'DD-MM-YYYY'),
    'hsn', mig.s(jm.j->>'JV_HsnCode'), 'gstTranType', mig.s(jm.j->>'Jv_GstTranType'),
    'partyVchNo', mig.s(jm.j->>'Jv_PartyDbNote'), 'partyVchDate', to_char(mig.d(jm.j->>'Jv_PartyDbNoteDt'), 'DD-MM-YYYY'),
    'crNoteParty', (SELECT name FROM acc WHERE code = jm.j->>'Jv_AutoCrPCode'),
    'provisional', CASE WHEN jm.j->>'Jv_IsProvisionalDebitNt' = '1' THEN 'Yes' END,
    'autoNote', CASE WHEN jm.j->>'Jv_IsAutoDebiteNote' = '1' THEN 'Yes' END,
    'reason', mig.s(jm.j->>'Jv_ReasonRmk'),
    'einvCancelled', CASE WHEN jm.j->>'Jv_IsCancleEinv' = '1' THEN 'Yes' END,
    'ackDate', to_char(mig.d(jm.j->>'Jv_ACK_Date'), 'DD-MM-YYYY'))
FROM jm WHERE v.id = jm.id;
CREATE TEMP TABLE jl AS
SELECT r.id, to_jsonb(t) AS j FROM pg_temp.refs('voucher_line', 'JVMst') r JOIN legacy_umiya20."JVMst" t ON t._row = r.rw WHERE r.db = 'UMIYA20'
UNION ALL
SELECT r.id, to_jsonb(t) FROM pg_temp.refs('voucher_line', 'JVMst') r JOIN legacy_umiya24."JVMst" t ON t._row = r.rw WHERE r.db = 'UMIYA24';
UPDATE public.voucher_lines l SET extra = (coalesce(l.extra, '{}'::jsonb) - ARRAY['usdRate','usdAmt','lineRemark']) || pg_temp.jx(
    'usdRate', mig.s(jl.j->>'JV_PerUsdRate'), 'usdAmt', mig.s(jl.j->>'JV_UsdAmt'), 'lineRemark', mig.s(jl.j->>'JV_PRmk'))
FROM jl WHERE l.id = jl.id AND (jl.j->>'JV_PerUsdRate' NOT IN ('0', '') OR coalesce(btrim(jl.j->>'JV_PRmk'), '') <> '' OR l.extra ?| ARRAY['usdRate','usdAmt','lineRemark']);
SELECT mig.note('screen fields: journals and notes');
