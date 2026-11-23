-- Step 3a: companies, financial years, account groups, accounts, people, per-company settings.
-- Masters are shared by all companies of the business (as in the old software) and kept
-- under the master company (CompId 1). UMIYA24 is the latest version of every master; a
-- master that exists only in UMIYA20 is taken from UMIYA20. Nothing is left out: the
-- complete original row is stored in `extra` and linked through legacy_refs.

TRUNCATE public.legacy_refs, public.account_companies, public.persons, public.ledger_entries, public.stock_entries,
  public.bill_allocations, public.voucher_lines, public.approval_logs, public.vouchers, public.counters, public.books,
  public.vehicles, public.transporters, public.items, public.brands, public.godowns, public.cost_centers,
  public.sales_persons, public.accounts, public.account_groups, public.user_companies, public.financial_years,
  public.audit_logs, public.companies RESTART IDENTITY CASCADE;

-- the full original row without the archive bookkeeping columns, empty values dropped
CREATE OR REPLACE FUNCTION mig.row(j jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_strip_nulls(j - '_row' - '_sha') $$;

-- lookup names of the old DescriptionMst codes (cities, states, areas, brands, grades …)
CREATE TEMP TABLE desc_names AS
  SELECT DISTINCT ON ("Desc_Code") "Desc_Code" AS code, "Desc_Name" AS name, "Desc_type" AS type
  FROM (SELECT *, 1 AS pri FROM legacy_umiya24."DescriptionMst" UNION ALL SELECT *, 2 FROM legacy_umiya20."DescriptionMst") d
  ORDER BY "Desc_Code", pri;
CREATE UNIQUE INDEX ON desc_names (code);

/* ------------------------------------------------------------ companies */
INSERT INTO public.companies (id, name, short_name, gstin, pan, address1, city, state, state_code, pincode, phone, email,
  bank_name, bank_account_no, ifsc, master_company_id, legacy_code, extra)
SELECT mig.int(c."CompId"), btrim(c."CompanyName"), mig.s(btrim(c."Com_Short")),
  left(mig.s(btrim(c."VattinNo")), 15), left(mig.s(btrim(c."panNo")), 10), mig.s(c."OffAdd"),
  (SELECT name FROM desc_names WHERE code = c."OffCity"), (SELECT name FROM desc_names WHERE code = c."OffState"),
  coalesce(left(mig.s(btrim(c."VattinNo")), 2), '24'), mig.s(c."offPinCode"), mig.s(c."offmobileno"), mig.s(c."offEmail"),
  mig.s(c."BANKNAME"), mig.s(c."ACCOUNTNO"), left(mig.s(c."IFSCCODE"), 15),
  CASE WHEN c."CompId" = '1' THEN NULL ELSE 1 END, c."CompId", mig.row(to_jsonb(c))
FROM legacy_umiya24."CompanyMst" c ORDER BY mig.int(c."CompId");
SELECT setval(pg_get_serial_sequence('public.companies', 'id'), (SELECT max(id) FROM public.companies));

INSERT INTO public.legacy_refs (entity, entity_id, legacy_db, legacy_table, legacy_key, legacy_row, legacy_sha)
SELECT 'company', mig.int("CompId"), 'UMIYA24', 'CompanyMst', "CompId", _row, _sha FROM legacy_umiya24."CompanyMst";

/* ------------------------------------------------ financial years (id = company*100 + YearCode) */
INSERT INTO public.financial_years (id, company_id, label, start_date, end_date, is_locked)
SELECT c.id * 100 + mig.int(y."YearCode"), c.id,
  to_char(mig.d(y."FromYear"), 'YY') || '-' || to_char(mig.d(y."ToYear"), 'YY'),
  mig.d(y."FromYear"), mig.d(y."ToYear"), mig.d(y."ToYear") < DATE '2026-04-01'
FROM public.companies c CROSS JOIN legacy_umiya24."YearMst" y;

/* ------------------------------------------------------- account groups (id = Gr_Code) */
CREATE TEMP TABLE src_groups AS
  SELECT DISTINCT ON ("Gr_Code") * FROM (
    SELECT g.*, 'UMIYA24' AS db FROM legacy_umiya24."GroupMst" g UNION ALL SELECT g.*, 'UMIYA20' FROM legacy_umiya20."GroupMst" g) x
  ORDER BY "Gr_Code", db DESC;
INSERT INTO public.account_groups (id, company_id, name, parent_id, nature, bill_wise, credit_control, affects_gross_profit, show_in_outstanding, sort_order)
SELECT mig.int("Gr_Code"), 1, btrim("Gr_Name"),
  NULLIF(NULLIF(mig.int("Gr_MainGroup"), mig.int("Gr_Code")), 0),
  (CASE WHEN "GR_GPNP" ILIKE '%INCOME%' AND "Gr_DefType" = 'C' THEN 'INCOME'
        WHEN "GR_GPNP" ILIKE '%INCOME%' OR "GR_GPNP" ILIKE '%EXPENSE%' THEN CASE WHEN "Gr_DefType" = 'C' THEN 'INCOME' ELSE 'EXPENSE' END
        WHEN "Gr_DefType" = 'C' THEN 'LIABILITY' ELSE 'ASSET' END)::group_nature,
  "Gr_Code" IN ('26','27','36','37','40','43','44','51','55','58','59','70','85'),
  "Gr_Code" IN ('27','43','44','59'),
  "GR_GPNP" ILIKE 'GROSS%', "Gr_Code" IN ('26','27','36','37','40','43','44','51','55','58','59','70','85'),
  coalesce(mig.int("GR_Position"), 0)
FROM src_groups ORDER BY mig.int("Gr_Code");
-- parents that point to a group which does not exist are kept in extra, not lost
UPDATE public.account_groups g SET parent_id = NULL WHERE parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.account_groups p WHERE p.id = g.parent_id);
SELECT setval(pg_get_serial_sequence('public.account_groups', 'id'), (SELECT max(id) FROM public.account_groups));
INSERT INTO public.legacy_refs SELECT 'account_group', mig.int("Gr_Code"), db, 'GroupMst', "Gr_Code", _row, _sha FROM src_groups;

/* ------------------------------------------------------------------ people (old BrokerMst) */
CREATE TEMP TABLE src_brokers AS
  SELECT DISTINCT ON ("Brk_Code") * FROM (
    SELECT b.*, 'UMIYA24' AS db FROM legacy_umiya24."BrokerMst" b UNION ALL SELECT b.*, 'UMIYA20' FROM legacy_umiya20."BrokerMst" b) x
  ORDER BY "Brk_Code", db DESC;
INSERT INTO public.persons (company_id, role, code, name, short_name, phone, email, address1, address2, city, pan, rate,
  credit_limit, credit_days, is_blocked, block_reason, remark, extra)
SELECT 1,
  (CASE upper("Brk_Type") WHEN 'MISTRY' THEN 'PARTY_GROUP' WHEN 'ARCHITECT' THEN 'BROKER' WHEN 'COLLECTOR' THEN 'COLLECTOR'
     WHEN 'SALEPERSON' THEN 'SALES_PERSON' WHEN 'GODOWN' THEN 'GODOWN_PERSON' ELSE 'BROKER' END)::person_role,
  "Brk_Code", coalesce(mig.s(btrim("Brk_Name")), "Brk_Code"), mig.s("Brk_ShortName"), mig.s("Brk_Phone"), mig.s("Brk_EmailId"),
  mig.s("Brk_ADD1"), mig.s("Brk_ADD2"), (SELECT name FROM desc_names WHERE code = "Brk_City"), left(mig.s(btrim("Brk_PanNo")), 10),
  mig.num("Brk_Rate"), mig.num("Brk_CrLimit"), mig.int("Brk_CrDays"), coalesce(mig.b("Brk_Block"), false), mig.s("Brk_BlockRmk"),
  mig.s("Brk_REMARK"), mig.row(to_jsonb(b) - 'db')
FROM src_brokers b;
INSERT INTO public.legacy_refs SELECT 'person', p.id, b.db, 'BrokerMst', b."Brk_Code", b._row, b._sha
FROM src_brokers b JOIN public.persons p ON p.company_id = 1 AND p.code = b."Brk_Code";

/* -------------------------------------------- accounts = parties (PartyMst) + book ledgers (BookMst) */
CREATE TEMP TABLE src_party AS
  SELECT DISTINCT ON ("P_Code") * FROM (
    SELECT p.*, 'UMIYA24' AS db FROM legacy_umiya24."PartyMst" p UNION ALL SELECT p.*, 'UMIYA20' FROM legacy_umiya20."PartyMst" p) x
  ORDER BY "P_Code", db DESC;
CREATE TEMP TABLE src_contact AS
  SELECT DISTINCT ON ("PS_Code") * FROM (
    SELECT c.*, 'UMIYA24' AS db FROM legacy_umiya24."Party_ContactMst" c UNION ALL SELECT c.*, 'UMIYA20' FROM legacy_umiya20."Party_ContactMst" c) x
  ORDER BY "PS_Code", db DESC;
CREATE TEMP TABLE src_book AS
  SELECT DISTINCT ON ("Bok_Code") * FROM (
    SELECT b.*, 'UMIYA24' AS db FROM legacy_umiya24."BookMst" b UNION ALL SELECT b.*, 'UMIYA20' FROM legacy_umiya20."BookMst" b) x
  ORDER BY "Bok_Code", db DESC;

CREATE OR REPLACE FUNCTION mig.kind(gr integer) RETURNS account_kind LANGUAGE sql IMMUTABLE AS $$
  SELECT (CASE
    WHEN gr IN (27, 43, 44, 59, 76, 83, 84) THEN 'CUSTOMER'
    WHEN gr IN (26, 36, 37, 39, 41, 51, 58, 70, 85) THEN 'SUPPLIER'
    WHEN gr IN (40, 55) THEN 'BROKER'
    WHEN gr IN (1, 2, 74) THEN 'BANK'
    WHEN gr = 4 THEN 'CASH'
    WHEN gr IN (7, 69) THEN 'TAX'
    WHEN gr = 22 THEN 'SALES'
    WHEN gr IN (19, 62, 64) THEN 'PURCHASE'
    WHEN gr IN (8, 9, 45, 46, 47, 48, 60, 72) THEN 'EXPENSE'
    WHEN gr IN (11, 12, 21, 49) THEN 'INCOME'
    WHEN gr IN (3, 20, 63, 65, 17, 53) THEN 'CAPITAL'
    WHEN gr IN (15, 23, 29, 66, 68, 71) THEN 'LOAN'
    WHEN gr IN (10, 13, 14, 24, 25, 35, 42, 50, 56, 57, 61, 73, 78, 79, 80, 81, 82) THEN 'ASSET'
    ELSE 'OTHER' END)::account_kind $$;

INSERT INTO public.accounts (company_id, group_id, code, name, alias, kind, party_type, gst_type, gstin, pan, address1, area, city, state,
  state_code, pincode, contact_person, mobile, phone, email, credit_limit, credit_days, bank_name, bank_account_no, ifsc,
  opening_balance, tds_applicable, tcs_applicable, status, notes, legacy_code, extra)
SELECT 1,
  coalesce((SELECT id FROM public.account_groups WHERE id = mig.int(p."P_GrCode")), 28),
  p."P_Code", coalesce(mig.s(btrim(p."P_Name")), p."P_Code"), mig.s(p."P_Alias"),
  CASE WHEN p."P_Type" = 'TranParty' THEN 'TRANSPORTER'::account_kind ELSE mig.kind(mig.int(p."P_GrCode")) END,
  coalesce(mig.s(p."P_Type"), 'Party'),
  (CASE WHEN coalesce(mig.b(p."P_IsSez"), false) THEN 'SEZ' WHEN mig.s(btrim(p."P_GSTNo")) IS NULL THEN 'UNREGISTERED' ELSE 'REGULAR' END)::gst_type,
  left(mig.s(btrim(p."P_GSTNo")), 15), left(mig.s(btrim(p."P_PANo")), 10),
  mig.s(c."P_OAdd"), (SELECT name FROM desc_names WHERE code = c."P_Area"), (SELECT name FROM desc_names WHERE code = c."P_OCity"),
  (SELECT name FROM desc_names WHERE code = c."P_OState"), lpad(mig.s(p."P_GstState"), 2, '0'), left(mig.s(p."P_PINCODE"), 10),
  mig.s(p."P_ContPerName"), left(coalesce(mig.s(p."P_Mobile"), mig.s(c."P_OMobile")), 20), left(mig.s(c."P_OTel"), 30), left(mig.s(c."P_Email"), 160),
  mig.num0(p."P_CrLimit"), coalesce(mig.int(p."P_CrDay"), 0), mig.s(p."P_BankName"), mig.s(p."P_BnkACNo"), left(mig.s(p."P_BnkIFSCcode"), 15),
  0 /* openings are ledger entries (OPENING); P_Opening stays in extra */, coalesce(mig.b(p."P_IsTdsReq"), false), coalesce(mig.b(p."P_TCSReq"), false),
  (CASE WHEN EXISTS (SELECT 1 FROM legacy_umiya24."BlockPartyMst" bl WHERE bl."Blok_PCode" = p."P_Code") THEN 'BLOCKED' ELSE 'ACTIVE' END)::record_status,
  mig.s(p."P_Rmk"), p."P_Code",
  mig.row(to_jsonb(p) - 'db') || jsonb_build_object('_contact', mig.row(to_jsonb(c) - 'db'))
FROM src_party p LEFT JOIN src_contact c ON c."PS_Code" = p."P_Code";

INSERT INTO public.accounts (company_id, group_id, code, name, kind, party_type, legacy_code, extra)
SELECT 1, coalesce((SELECT id FROM public.account_groups WHERE id = mig.int(b."Bok_Gcode")), 28), b."Bok_Code",
  coalesce(mig.s(btrim(b."Bok_Name")), b."Bok_Code"), mig.kind(mig.int(b."Bok_Gcode")), 'Book', b."Bok_Code", mig.row(to_jsonb(b) - 'db')
FROM src_book b WHERE NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.company_id = 1 AND a.legacy_code = b."Bok_Code");

-- links to people (party group = Mistry, broker = Architect, collector, sales person)
UPDATE public.accounts a SET
  party_group_id = (SELECT id FROM public.persons WHERE company_id = 1 AND code = p."P_MtryCode"),
  broker_id = (SELECT id FROM public.persons WHERE company_id = 1 AND code = p."P_BrCode"),
  collection_person_id = (SELECT id FROM public.persons WHERE company_id = 1 AND code = p."P_Collector"),
  sales_person_id = (SELECT id FROM public.persons WHERE company_id = 1 AND code = p."P_SalePerson")
FROM src_party p WHERE a.company_id = 1 AND a.legacy_code = p."P_Code";

INSERT INTO public.legacy_refs SELECT 'account', a.id, p.db, 'PartyMst', p."P_Code", p._row, p._sha
FROM src_party p JOIN public.accounts a ON a.company_id = 1 AND a.legacy_code = p."P_Code";
INSERT INTO public.legacy_refs SELECT 'account', a.id, b.db, 'BookMst', b."Bok_Code", b._row, b._sha
FROM src_book b JOIN public.accounts a ON a.company_id = 1 AND a.legacy_code = b."Bok_Code";

/* ---------------------------------------- per-company account settings (ObjectMapMst, CapitalRationMst) */
CREATE TEMP TABLE src_map AS
  SELECT DISTINCT ON ("Map_Code", "Map_CompCode") * FROM (
    SELECT m.*, 'UMIYA24' AS db FROM legacy_umiya24."ObjectMapMst" m UNION ALL SELECT m.*, 'UMIYA20' FROM legacy_umiya20."ObjectMapMst" m) x
  ORDER BY "Map_Code", "Map_CompCode", db DESC, mig.int("Map_Auto") DESC;
INSERT INTO public.account_companies (account_id, company_id, credit_days, credit_limit, lock_days, tds_applicable, tcs_applicable, rcm_applicable, extra)
SELECT a.id, mig.int(m."Map_CompCode"), mig.num(m."Map_PCrDay"), mig.num(m."Map_PCrLimit"), mig.num(m."Map_PLockDays"),
  mig.b(m."Map_PIsTdsReq"), mig.b(m."Map_PTCSReq"), mig.b(m."Map_PRCMReq"), mig.row(to_jsonb(m) - 'db')
FROM src_map m JOIN public.accounts a ON a.company_id = 1 AND a.legacy_code = m."Map_Code"
WHERE EXISTS (SELECT 1 FROM public.companies c WHERE c.id = mig.int(m."Map_CompCode"));
UPDATE public.account_companies ac SET capital_ratio = mig.num(r."Ration_Per")
FROM legacy_umiya24."CapitalRationMst" r JOIN public.accounts a ON a.company_id = 1 AND a.legacy_code = r."P_Code"
WHERE ac.account_id = a.id AND ac.company_id = mig.int(r."CompanyCode");
