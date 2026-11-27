-- Email: the old outgoing mail server (EMailConfig — the password is NOT copied; enter a Gmail app password in YarnFlow)
-- and every email the old software sent (EmailLogMst, UMIYA24 + UMIYA20), kept as the sent log.
INSERT INTO public.email_settings (company_id, mode, host, port, secure, username, from_name, forms)
SELECT c.id, 'off', e."Mail_OutSrv", coalesce(nullif(e."Mail_OutPort", '')::int, 587), coalesce(nullif(e."Mail_OutPort", ''), '587') = '465', e."Mail_ID", c.name,
  '["SAL","SALRTN","SalOrder","DBNT","CRNT"]'::jsonb
FROM legacy_umiya24."EMailConfig" e JOIN public.companies c ON c.legacy_code = e."ComCode" AND c.master_company_id IS NULL
ON CONFLICT (company_id) DO NOTHING;
SELECT mig.note('email: mail server settings');

DELETE FROM public.email_messages WHERE legacy;
INSERT INTO public.email_messages (company_id, form_type, bill_no, to_email, subject, body, is_html, status, error, sent_at, legacy, created_at)
SELECT coalesce(c.id, 1),
  CASE split_part(m."EmailCaption", ' - ', 1) WHEN 'Bill' THEN 'SAL' WHEN 'Sale Bill' THEN 'SAL' WHEN 'Sale Order' THEN 'SalOrder' WHEN 'Sale Return Bill' THEN 'SALRTN'
    WHEN 'Debit Note Voucher' THEN 'DBNT' WHEN 'Credit Note Voucher' THEN 'CRNT' WHEN 'Vch.No.' THEN 'NOTE' ELSE left(split_part(m."EmailCaption", ' - ', 1), 20) END,
  left(m."EmailFromToBill", 60), left(m."EmailId", 300), m."EmailCaption", replace(m."EmailTemplt", E'\r\n', E'\n'), m."EmailTemplt" ILIKE '%<html%',
  CASE WHEN lower(m."EmailStatus") = 'sent' THEN 'SENT' ELSE 'FAILED' END, CASE WHEN lower(m."EmailStatus") <> 'sent' THEN m."EmailStatus" END,
  CASE WHEN lower(m."EmailStatus") = 'sent' THEN timezone('Asia/Kolkata', mig.ts(m."EmailDt")) END, true, coalesce(timezone('Asia/Kolkata', mig.ts(m."EmailDt")), now())
FROM (SELECT * FROM legacy_umiya24."EmailLogMst" UNION ALL SELECT * FROM legacy_umiya20."EmailLogMst") m
LEFT JOIN public.companies c ON c.legacy_code = m."EmailComCode";
SELECT mig.note('email: old sent log');
