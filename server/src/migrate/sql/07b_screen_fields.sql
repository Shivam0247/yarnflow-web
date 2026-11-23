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
