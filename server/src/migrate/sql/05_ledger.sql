-- Step 3e: the ledger. Every AccountLedger row of both databases becomes one ledger entry,
-- with the exact signed amount the old software sums for balances (TotAmt):
--   debit = TotAmt when positive, credit = -TotAmt when negative.
-- Each row is attached to its document; GST/TDS/TCS postings to the bill they belong to
-- (JV_Reff); opening rows to one opening document per database + company + date.
-- A row whose document cannot be found is NOT dropped: it gets a journal document of its own.
TRUNCATE public.ledger_entries RESTART IDENTITY;
DELETE FROM public.vouchers WHERE type = 'OPENING_BALANCE' OR (subtype IS NOT NULL AND extra ? '_unlinkedLedger');
SELECT mig.note('ledger: start');

CREATE TEMP TABLE acc AS SELECT legacy_code AS code, id FROM public.accounts WHERE company_id = 1;
CREATE UNIQUE INDEX ON acc (code); ANALYZE acc;
CREATE TEMP TABLE cc AS SELECT legacy_code AS code, id FROM public.cost_centers WHERE company_id = 1;

CREATE TEMP TABLE src_led AS
SELECT 'UMIYA20'::text AS db, l."Code" AS code, l."Ftype" AS ftype, mig.int(l."CompanyCode") AS comp, l."Pcode" AS pcode, l."BkCode" AS bkcode,
  mig.d(l."BillDate") AS d, mig.num0(l."TotAmt") AS amt, l."BillNo" AS billno, l."JV_Reff" AS reff, mig.s(l."Rmk") AS rmk,
  mig.int(l."Acc_YearCode") AS yr, l."CostcenterCode" AS ccode, l._row
FROM legacy_umiya20."AccountLedger" l
UNION ALL
SELECT 'UMIYA24', l."Code", l."Ftype", mig.int(l."CompanyCode"), l."Pcode", l."BkCode", mig.d(l."BillDate"), mig.num0(l."TotAmt"), l."BillNo",
  l."JV_Reff", mig.s(l."Rmk"), mig.int(l."Acc_YearCode"), l."CostcenterCode", l._row
FROM legacy_umiya24."AccountLedger" l;
ANALYZE src_led;
SELECT mig.note('ledger: rows collected');

-- which document each row belongs to
ALTER TABLE src_led ADD COLUMN vid integer;
CREATE TEMP TABLE vkey AS SELECT id, db, tbl, code, comp FROM mig.vmap;
CREATE INDEX ON vkey (tbl, code, db); ANALYZE vkey;
-- bills, receipts/payments (same database first, else the other one — e.g. a carried-forward bill)
UPDATE src_led s SET vid = coalesce(
    (SELECT id FROM vkey v WHERE v.tbl = t.tbl AND v.code = s.code AND v.db = s.db LIMIT 1),
    (SELECT id FROM vkey v WHERE v.tbl = t.tbl AND v.code = s.code LIMIT 1))
FROM (VALUES ('SAL','SalesMst'), ('SALRTN','SalesMst'), ('PUR','PurchaseMst'), ('PURRTN','PurchaseMst'), ('GENPUR','PurchaseMst'),
             ('GENSAL','PurchaseMst'), ('AUTPUR','PurchaseMst'), ('GENPURRTN','PurchaseMst'), ('GENSALRTN','PurchaseMst')) t(ft, tbl)
WHERE s.ftype = t.ft;
UPDATE src_led s SET vid = coalesce(
    (SELECT id FROM vkey v WHERE v.tbl = 'RecMst' AND v.code = s.code AND v.db = s.db LIMIT 1),
    (SELECT id FROM vkey v WHERE v.tbl = 'RecMst' AND v.code = s.code LIMIT 1))
WHERE s.vid IS NULL AND (s.ftype LIKE 'BANK%' OR s.ftype LIKE 'CASH%');
SELECT mig.note('ledger: bills and bank entries linked');
-- journals that are documents of their own
UPDATE src_led s SET vid = v.id FROM vkey v
WHERE s.vid IS NULL AND s.ftype NOT IN ('OPENING') AND v.tbl = 'JVMst' AND v.db = s.db AND v.code = s.code || '/' || s.comp;
-- GST / TDS / TCS postings: to the document named in JV_Reff (any table, same database first)
UPDATE src_led s SET vid = coalesce(
    (SELECT id FROM vkey v WHERE v.code = s.reff AND v.db = s.db AND v.tbl IN ('SalesMst', 'PurchaseMst', 'RecMst') ORDER BY (v.comp = s.comp) DESC LIMIT 1),
    (SELECT id FROM vkey v WHERE v.code = s.reff AND v.tbl IN ('SalesMst', 'PurchaseMst', 'RecMst') ORDER BY (v.comp = s.comp) DESC LIMIT 1),
    (SELECT id FROM vkey v WHERE v.tbl = 'JVMst' AND v.db = s.db AND v.code = s.reff || '/' || s.comp))
WHERE s.vid IS NULL AND coalesce(s.reff, '') <> '' AND s.ftype <> 'OPENING';
SELECT mig.note('ledger: journals and tax postings linked');

-- opening documents: one per database + company + date
INSERT INTO public.vouchers (company_id, fy_id, type, subtype, ledger_period, legacy_code, number, date, status, narration, extra)
SELECT o.comp, coalesce(mig.fy(o.comp, o.d + 1), mig.fy(o.comp, o.d), o.comp * 100 + 1), 'OPENING_BALANCE', 'OPENING',
  CASE o.db WHEN 'UMIYA20' THEN 20 ELSE 24 END, 'OPN01', 'OPENING ' || to_char(o.d, 'DD-MM-YYYY'), o.d, 'POSTED',
  'Opening balances (' || o.db || ')', jsonb_build_object('_db', o.db)
FROM (SELECT DISTINCT db, comp, d FROM src_led WHERE ftype = 'OPENING') o;
UPDATE src_led s SET vid = v.id FROM public.vouchers v
WHERE s.ftype = 'OPENING' AND v.type = 'OPENING_BALANCE' AND v.company_id = s.comp AND v.date = s.d AND v.extra->>'_db' = s.db;

-- anything still without a document gets one of its own (kept, reported in the reconciliation)
INSERT INTO public.vouchers (company_id, fy_id, type, subtype, ledger_period, legacy_code, number, date, status, narration, extra)
SELECT u.comp, coalesce(mig.fy(u.comp, u.d), u.comp * 100 + 1), 'JOURNAL', u.ftype, CASE u.db WHEN 'UMIYA20' THEN 20 ELSE 24 END,
  u.code, coalesce(u.billno, u.code), u.d, 'POSTED', 'Ledger entries without a document in the old software',
  jsonb_build_object('_db', u.db, '_unlinkedLedger', true, '_reff', u.reff)
FROM (SELECT DISTINCT ON (db, comp, code, ftype) db, comp, code, ftype, d, billno, reff FROM src_led WHERE vid IS NULL ORDER BY db, comp, code, ftype, d) u;
UPDATE src_led s SET vid = v.id FROM public.vouchers v
WHERE s.vid IS NULL AND v.extra ? '_unlinkedLedger' AND v.company_id = s.comp AND v.legacy_code = s.code AND v.subtype = s.ftype AND v.extra->>'_db' = s.db;
SELECT mig.note('ledger: openings and unlinked rows given documents');

INSERT INTO public.ledger_entries (company_id, fy_id, voucher_id, account_id, date, debit, credit, narration, ledger_period, subtype,
  contra_account_id, bill_no, cost_center_id, legacy_code, legacy_row)
SELECT s.comp, coalesce((SELECT id FROM public.financial_years f WHERE f.id = s.comp * 100 + s.yr), mig.fy(s.comp, s.d), s.comp * 100 + 1),
  s.vid, a.id, s.d, greatest(s.amt, 0), greatest(-s.amt, 0), s.rmk, CASE s.db WHEN 'UMIYA20' THEN 20 ELSE 24 END, s.ftype,
  (SELECT id FROM acc WHERE code = s.bkcode), left(s.billno, 60), (SELECT id FROM cc WHERE code = s.ccode), s.code, s._row
FROM src_led s LEFT JOIN acc a ON a.code = s.pcode;
SELECT mig.note('ledger: entries inserted');
