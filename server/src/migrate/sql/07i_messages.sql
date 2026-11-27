-- WhatsApp: the old message templates (SmsTemplate, with the Party Wise Outstanding PDF that went with a sale order
-- to the party group) and the messages the old WhatsApp sender sent (WhatsUpMst), kept as the sent log.
DELETE FROM public.message_templates;
INSERT INTO public.message_templates (company_id, form_type, body, attach_pdf, extra_reports)
SELECT c.id, t."Sms_FormType", replace(coalesce(t."Sms_Template", ''), E'\r\n', E'\n'), coalesce(t."Sms_AttachedPdf", '0') = '1',
  (SELECT jsonb_agg(jsonb_build_object('report', s."SmsS_OsRpt", 'to', s."SmsS_ToSend")) FROM legacy_umiya24."SmsTemplateSubMst" s WHERE s."SmsS_Code" = t."Sms_Code")
FROM legacy_umiya24."SmsTemplate" t JOIN public.companies c ON c.legacy_code = coalesce(nullif(t."Sms_ComCode", ''), '1')
-- the fuller template of each form type (the later copies were saved with only their first line)
WHERE t."Sms_Code"::int IN (SELECT DISTINCT ON ("Sms_FormType") "Sms_Code"::int FROM legacy_umiya24."SmsTemplate" ORDER BY "Sms_FormType", length(coalesce("Sms_Template", '')) DESC, "Sms_Code"::int);
SELECT mig.note('whatsapp: templates');

DELETE FROM public.whatsapp_messages WHERE legacy;
INSERT INTO public.whatsapp_messages (company_id, form_type, msg_type, bill_no, mobile, body, caption, attachment, status, sent_at, is_manual, legacy, created_at)
SELECT coalesce(c.id, 1), coalesce(nullif(w."Wh_FType", ''), '-'), coalesce(nullif(w."Wh_Type", ''), 'TEXT'), left(w."Wh_BillId", 60), left(w."Wh_MobileNo", 20),
  CASE WHEN w."Wh_Type" = 'TEXT' THEN replace(w."Wh_Description", E'\r\n', E'\n') END, w."Wh_Caption",
  CASE WHEN w."Wh_Type" = 'PDF' THEN w."Wh_Description" END,
  CASE WHEN lower(w."Wh_Status") = 'sent' THEN 'SENT' WHEN coalesce(w."Wh_Status", '') IN ('', '{}') THEN 'FAILED' ELSE upper(left(w."Wh_Status", 12)) END,
  mig.ts(w."Wh_DateTime"), coalesce(w."Wh_IsManual", '') IN ('1', 'True'), true, coalesce(mig.ts(w."Wh_DateTime"), now())
FROM legacy_umiya24."WhatsUpMst" w LEFT JOIN public.companies c ON c.legacy_code = w."Wh_CompCode";
INSERT INTO public.whatsapp_messages (company_id, form_type, msg_type, bill_no, mobile, body, caption, attachment, status, sent_at, is_manual, legacy, created_at)
SELECT coalesce(c.id, 1), coalesce(nullif(w."Wh_FType", ''), '-'), coalesce(nullif(w."Wh_Type", ''), 'TEXT'), left(w."Wh_BillId", 60), left(w."Wh_MobileNo", 20),
  CASE WHEN w."Wh_Type" = 'TEXT' THEN replace(w."Wh_Description", E'\r\n', E'\n') END, w."Wh_Caption",
  CASE WHEN w."Wh_Type" = 'PDF' THEN w."Wh_Description" END,
  CASE WHEN lower(w."Wh_Status") = 'sent' THEN 'SENT' WHEN coalesce(w."Wh_Status", '') IN ('', '{}') THEN 'FAILED' ELSE upper(left(w."Wh_Status", 12)) END,
  mig.ts(w."Wh_DateTime"), coalesce(w."Wh_IsManual", '') IN ('1', 'True'), true, coalesce(mig.ts(w."Wh_DateTime"), now())
FROM legacy_umiya20."WhatsUpMst" w LEFT JOIN public.companies c ON c.legacy_code = w."Wh_CompCode";
SELECT mig.note('whatsapp: old sent log');
