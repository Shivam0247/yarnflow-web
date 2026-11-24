-- The links the old trading stock reports work on (views Tradding_PendingPurChase, Tradding_AllPendingSalesOrder,
-- Tradding_AllPendingView): which purchase a dispatch / return took stock from, which order a sale / dispatch /
-- purchase was made against, and the old lock / stock-clear flags. Kept on the lines (extra) so the stock,
-- sold / unsold and pending-order reports give the old numbers.
CREATE TEMP TABLE pl AS
SELECT r.entity_id AS id, s."Purs_Lock" AS lk, s."Purs_StockClear" AS sc, s."Purs_Stk_PurCode" AS stk, s."Purs_OrderCode" AS po, s."Purs_GrnCode" AS grn, h."Pur_Type" AS pt
FROM public.legacy_refs r JOIN legacy_umiya20."PurchaseSubMst" s ON s._row = r.legacy_row LEFT JOIN legacy_umiya20."PurchaseMst" h ON h."Pur_Code" = s."PurS_Code"
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'PurchaseSubMst'
UNION ALL
SELECT r.entity_id, s."Purs_Lock", s."Purs_StockClear", s."Purs_Stk_PurCode", s."Purs_OrderCode", s."Purs_GrnCode", h."Pur_Type"
FROM public.legacy_refs r JOIN legacy_umiya24."PurchaseSubMst" s ON s._row = r.legacy_row LEFT JOIN legacy_umiya24."PurchaseMst" h ON h."Pur_Code" = s."PurS_Code"
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'PurchaseSubMst';
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'lock', CASE WHEN coalesce(pl.lk, '0') NOT IN ('', '0') THEN pl.lk END,
    'stockClear', CASE WHEN coalesce(pl.sc, '0') NOT IN ('', '0') THEN pl.sc END,
    'stkPurCode', nullif(nullif(btrim(pl.stk), ''), '0'),
    'poCode', nullif(nullif(btrim(pl.po), ''), '0'),
    'grnCode', nullif(nullif(btrim(pl.grn), ''), '0'),
    'purType', pl.pt))
FROM pl WHERE pl.id = l.id;
SELECT mig.note('stock links: purchase lines');

CREATE TEMP TABLE dl AS
SELECT r.entity_id AS id, d."Dspt_OrderNo" AS ord, d."Dispt_PurChNo" AS pch, d."Dispt_PurCode" AS pc FROM public.legacy_refs r JOIN legacy_umiya20."DispatchMst" d ON d._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'DispatchMst'
UNION ALL
SELECT r.entity_id, d."Dspt_OrderNo", d."Dispt_PurChNo", d."Dispt_PurCode" FROM public.legacy_refs r JOIN legacy_umiya24."DispatchMst" d ON d._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'DispatchMst';
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'orderCode', nullif(nullif(btrim(dl.ord), ''), '0'), 'purChNo', coalesce(btrim(dl.pch), ''), 'purCode', nullif(nullif(btrim(dl.pc), ''), '0')))
FROM dl WHERE dl.id = l.id;
SELECT mig.note('stock links: dispatch lines');

CREATE TEMP TABLE sl AS
SELECT r.entity_id AS id, s."Sals_OrderCode" AS ord, s."SalS_Dispt_Code" AS dsp FROM public.legacy_refs r JOIN legacy_umiya20."SalesSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'SalesSubMst'
UNION ALL
SELECT r.entity_id, s."Sals_OrderCode", s."SalS_Dispt_Code" FROM public.legacy_refs r JOIN legacy_umiya24."SalesSubMst" s ON s._row = r.legacy_row
WHERE r.entity = 'voucher_line' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'SalesSubMst';
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'orderCode', nullif(nullif(btrim(sl.ord), ''), '0'), 'disptCode', nullif(nullif(btrim(sl.dsp), ''), '0')))
FROM sl WHERE sl.id = l.id AND (coalesce(btrim(sl.ord), '') NOT IN ('', '0') OR coalesce(btrim(sl.dsp), '') NOT IN ('', '0'));
SELECT mig.note('stock links: sale lines');

CREATE TEMP TABLE qh AS
SELECT r.entity_id AS id, q."Sal_OrderType" AS ot, q."Sal_ApproveQuatation" AS ap FROM public.legacy_refs r JOIN legacy_umiya20."QuotationMst" q ON q._row = r.legacy_row
WHERE r.entity = 'voucher' AND r.legacy_db = 'UMIYA20' AND r.legacy_table = 'QuotationMst'
UNION ALL
SELECT r.entity_id, q."Sal_OrderType", q."Sal_ApproveQuatation" FROM public.legacy_refs r JOIN legacy_umiya24."QuotationMst" q ON q._row = r.legacy_row
WHERE r.entity = 'voucher' AND r.legacy_db = 'UMIYA24' AND r.legacy_table = 'QuotationMst';
UPDATE public.vouchers v SET extra = coalesce(v.extra, '{}'::jsonb) || jsonb_build_object('orderTypeNo', coalesce(nullif(btrim(qh.ot), ''), '0'), 'approvedQ', coalesce(nullif(btrim(qh.ap), ''), '0'))
FROM qh WHERE qh.id = v.id;
SELECT mig.note('stock links: order headers');

-- A purchase kept from UMIYA20 that UMIYA24 carried forward takes UMIYA24's lock / stock-clear (the current
-- state the old stock screens showed); one UMIYA24 never carried is closed stock of an old year.
CREATE TEMP TABLE p24 AS
SELECT s."PurS_Code" AS pc, s."PurS_Icode" AS ic, btrim(coalesce(s."PurS_Challano", '')) AS ch, mig.num0(s."Purs_Weight") AS w,
  max(coalesce(nullif(s."Purs_Lock", ''), '0')) AS lk, max(coalesce(nullif(s."Purs_StockClear", ''), '0')) AS sc
FROM legacy_umiya24."PurchaseSubMst" s GROUP BY 1, 2, 3, 4;
CREATE INDEX ON p24 (pc, ic, ch);
CREATE TEMP TABLE pc24 AS SELECT DISTINCT "Pur_Code" AS pc FROM legacy_umiya24."PurchaseMst";
CREATE INDEX ON pc24 (pc);
UPDATE public.voucher_lines l SET extra = (coalesce(l.extra, '{}'::jsonb) - 'lock' - 'stockClear') || jsonb_strip_nulls(jsonb_build_object(
    'lock', CASE WHEN p24.lk <> '0' THEN p24.lk END, 'stockClear', CASE WHEN p24.sc <> '0' THEN p24.sc END))
FROM public.vouchers v, public.items it, p24, public.legacy_refs r
WHERE v.id = l.voucher_id AND v.type = 'PURCHASE_BILL' AND it.id = l.item_id AND r.entity = 'voucher_line' AND r.entity_id = l.id AND r.legacy_db = 'UMIYA20'
  AND p24.pc = v.legacy_code AND p24.ic = it.legacy_code AND p24.ch = btrim(coalesce(l.challan_no, ''));
-- a UMIYA24 copy may carry only some lines of the purchase (the rest were closed there); its weight is the one counted
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || jsonb_build_object('stockQty', x.w)
FROM (SELECT l2.id, min(p24.w) AS w FROM public.voucher_lines l2 JOIN public.vouchers v ON v.id = l2.voucher_id AND v.type = 'PURCHASE_BILL'
        JOIN public.items it ON it.id = l2.item_id JOIN public.legacy_refs r ON r.entity = 'voucher_line' AND r.entity_id = l2.id AND r.legacy_db = 'UMIYA20'
        JOIN p24 ON p24.pc = v.legacy_code AND p24.ic = it.legacy_code AND p24.ch = btrim(coalesce(l2.challan_no, ''))
      WHERE NOT EXISTS (SELECT 1 FROM p24 q WHERE q.pc = v.legacy_code AND q.ic = it.legacy_code AND q.ch = btrim(coalesce(l2.challan_no, '')) AND q.w = l2.qty)
      GROUP BY l2.id HAVING count(*) = 1) x
WHERE x.id = l.id;
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || '{"stockClear": "OLDYEAR"}'::jsonb
FROM public.vouchers v, public.items it, public.legacy_refs r
WHERE v.id = l.voucher_id AND v.type = 'PURCHASE_BILL' AND it.id = l.item_id AND r.entity = 'voucher_line' AND r.entity_id = l.id AND r.legacy_db = 'UMIYA20'
  AND NOT EXISTS (SELECT 1 FROM p24 WHERE p24.pc = v.legacy_code AND p24.ic = it.legacy_code AND p24.ch = btrim(coalesce(l.challan_no, '')));
SELECT mig.note('stock links: carried purchases take the current year''s flags');

-- order lines: the status UMIYA24 shows now (an order kept from UMIYA20 that UMIYA24 did not carry is closed there)
CREATE TEMP TABLE q24 AS
SELECT s."SalS_Code" AS oc, s."SalS_Icode" AS ic, mig.num0(s."SalS_Qty") AS q, max(coalesce(s."Sals_Status", '')) AS st
FROM legacy_umiya24."QuotationSubMst" s GROUP BY 1, 2, 3;
CREATE INDEX ON q24 (oc, ic);
CREATE TEMP TABLE ql AS
SELECT l.id, CASE WHEN NOT EXISTS (SELECT 1 FROM legacy_umiya24."QuotationMst" h WHERE h."Sal_Code" = v.legacy_code) THEN 'NOT24'
  ELSE coalesce((SELECT q24.st FROM q24 WHERE q24.oc = v.legacy_code AND q24.ic = it.legacy_code ORDER BY (q24.q = l.qty) DESC LIMIT 1), 'NOT24') END AS st
FROM public.voucher_lines l JOIN public.vouchers v ON v.id = l.voucher_id AND v.type IN ('SALES_ORDER', 'PURCHASE_ORDER')
JOIN public.items it ON it.id = l.item_id JOIN public.legacy_refs r ON r.entity = 'voucher_line' AND r.entity_id = l.id;
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || jsonb_build_object('st24', ql.st) FROM ql WHERE ql.id = l.id;
SELECT mig.note('stock links: order line status as UMIYA24');
