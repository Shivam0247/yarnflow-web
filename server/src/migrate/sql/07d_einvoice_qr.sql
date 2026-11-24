-- The signed e-invoice QR (as returned by the IRP) that the old bill print shows,
-- kept on the document so the new print shows the very same QR code.
-- Old table EInvoiceQrCodeMst: one row per document number and company; UMIYA24 wins over UMIYA20.
CREATE TEMP TABLE eq AS
SELECT DISTINCT ON (com, num) com, num, qr FROM (
  SELECT 1 AS pri, mig.int(q."Einv_ComCode") AS com, btrim(q."Einv_SalCode") AS num, q."Einv_QRSign" AS qr, coalesce(q."Einv_CancleDt", '') AS cancelled
  FROM legacy_umiya24."EInvoiceQrCodeMst" q
  UNION ALL
  SELECT 2, mig.int(q."Einv_ComCode"), btrim(q."Einv_SalCode"), q."Einv_QRSign", coalesce(q."Einv_CancleDt", '')
  FROM legacy_umiya20."EInvoiceQrCodeMst" q
) x
WHERE coalesce(qr, '') <> '' AND cancelled = ''
ORDER BY com, num, pri;
CREATE INDEX ON eq (com, num);

UPDATE public.vouchers SET extra = extra - 'einvQr' WHERE extra ? 'einvQr' AND (type::text LIKE 'PURCHASE%' OR type::text = 'GENERAL_PURCHASE');
UPDATE public.vouchers v SET extra = coalesce(v.extra, '{}'::jsonb) || jsonb_build_object('einvQr', eq.qr)
FROM eq, public.companies c
WHERE c.legacy_code = eq.com::text AND v.company_id = c.id AND v.number = eq.num
  AND v.irn IS NOT NULL AND v.type::text NOT LIKE 'PURCHASE%' AND v.type::text <> 'GENERAL_PURCHASE'
  AND coalesce(v.extra->>'einvQr', '') IS DISTINCT FROM eq.qr;
SELECT mig.note('e-invoice signed QR codes kept on ' || (SELECT count(*) FROM public.vouchers WHERE extra ? 'einvQr') || ' documents');
