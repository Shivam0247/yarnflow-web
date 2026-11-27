-- The old item ledger (Tradding_ItemLedger) counted a purchase carried into UMIYA24 only when UMIYA24 kept it as
-- stock (Pur_IsStock = 1). Keep that flag on the UMIYA20 purchase lines UMIYA24 carried.
CREATE TEMP TABLE ps24 AS
SELECT s."PurS_Code" AS pc, s."PurS_Icode" AS ic, btrim(coalesce(s."PurS_Challano", '')) AS ch, max(coalesce(nullif(m."Pur_IsStock", ''), '0')) AS st
FROM legacy_umiya24."PurchaseSubMst" s JOIN legacy_umiya24."PurchaseMst" m ON m."Pur_Code" = s."PurS_Code"
WHERE m."Pur_IsLastYearEntry" = '1' GROUP BY 1, 2, 3;
CREATE INDEX ON ps24 (pc, ic, ch);
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || jsonb_build_object('isStock24', ps24.st)
FROM public.vouchers v, public.items it, ps24, public.legacy_refs r
WHERE v.id = l.voucher_id AND v.type IN ('PURCHASE_BILL', 'GENERAL_PURCHASE', 'PURCHASE_RETURN') AND it.id = l.item_id
  AND r.entity = 'voucher_line' AND r.entity_id = l.id AND r.legacy_db = 'UMIYA20'
  AND ps24.pc = v.legacy_code AND ps24.ic = it.legacy_code AND ps24.ch = btrim(coalesce(l.challan_no, ''));
-- purchases imported from UMIYA24 itself that are last-year entries there: their own IsStock
UPDATE public.voucher_lines l SET extra = coalesce(l.extra, '{}'::jsonb) || jsonb_build_object('isStock24', coalesce(nullif(m."Pur_IsStock", ''), '0'))
FROM public.vouchers v, public.legacy_refs r, legacy_umiya24."PurchaseMst" m
WHERE v.id = l.voucher_id AND v.type IN ('PURCHASE_BILL', 'GENERAL_PURCHASE', 'PURCHASE_RETURN')
  AND r.entity = 'voucher' AND r.entity_id = v.id AND r.legacy_db = 'UMIYA24' AND m."Pur_Code" = v.legacy_code AND m."Pur_IsLastYearEntry" = '1';
SELECT mig.note('item ledger: carried purchases keep UMIYA24 IsStock');
