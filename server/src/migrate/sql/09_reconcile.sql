-- Step 5: reconciliation. Every figure is recomputed independently from the untouched archive
-- (legacy_umiya20 / legacy_umiya24) and compared with YarnFlow. Results go to mig.recon;
-- a check passes only when the difference is exactly 0.
DROP TABLE IF EXISTS mig.recon;
CREATE TABLE mig.recon (id serial, area text, check_name text, scope text, old_value numeric, new_value numeric,
  diff numeric GENERATED ALWAYS AS (coalesce(new_value, 0) - coalesce(old_value, 0)) STORED, ok boolean GENERATED ALWAYS AS (coalesce(new_value, 0) = coalesce(old_value, 0)) STORED);
SELECT mig.note('reconcile: start');

/* 1. archive completeness: rows in archive = rows in export summary */
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Archive', 'rows archived', db || '.' || tbl, expected, loaded FROM legacy_meta.tables;

/* 2. masters: every old master row has a YarnFlow record */
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Masters', 'records', t.name, t.old, t.new FROM (
  SELECT 'Companies' AS name, (SELECT count(*) FROM legacy_umiya24."CompanyMst") AS old, (SELECT count(*) FROM public.companies) AS new
  UNION ALL SELECT 'Account groups', (SELECT count(*) FROM mig.latest('GroupMst', '"Gr_Code"')), (SELECT count(*) FROM public.account_groups)
  UNION ALL SELECT 'Parties', (SELECT count(*) FROM mig.latest('PartyMst', '"P_Code"')), (SELECT count(*) FROM public.accounts WHERE party_type <> 'Book')
  UNION ALL SELECT 'Book ledgers', (SELECT count(*) FROM mig.latest('BookMst', '"Bok_Code"')), (SELECT count(*) FROM public.accounts WHERE party_type = 'Book')
  UNION ALL SELECT 'Books (series)', (SELECT count(*) FROM mig.latest('BookMst', '"Bok_Code"')), (SELECT count(*) FROM public.books)
  UNION ALL SELECT 'Brokers / party groups / collectors', (SELECT count(*) FROM mig.latest('BrokerMst', '"Brk_Code"')), (SELECT count(*) FROM public.persons)
  UNION ALL SELECT 'Items', (SELECT count(*) FROM mig.latest('ItemMst', '"I_CODE"')), (SELECT count(*) FROM public.items)
  UNION ALL SELECT 'Item groups', (SELECT count(*) FROM mig.latest('ItemGroupMst', '"IG_Code"')), (SELECT count(*) FROM public.item_groups)
  UNION ALL SELECT 'Lots', (SELECT count(*) FROM mig.latest('LotMst', '"LOT_CODE"')), (SELECT count(*) FROM public.lots)
  UNION ALL SELECT 'Lookups (areas, cities, brands, grades …)', (SELECT count(*) FROM mig.latest('DescriptionMst', '"Desc_Code"')), (SELECT count(*) FROM public.lookups)
  UNION ALL SELECT 'Godowns', (SELECT count(*) FROM mig.latest('GodownMst', '"Godn_Code"')), (SELECT count(*) FROM public.godowns)) t;
SELECT mig.note('reconcile: masters');

/* 3. documents: count and value per old table, database and type */
CREATE TEMP TABLE old_docs AS
SELECT db, tbl, ftype, count(*) AS n, sum(coalesce(mig.num(j->>'Sal_NetAmt'), mig.num(j->>'Pur_NetAmt'), mig.num(j->>'Rec_NetAmt'), mig.num(j->>'Dspt_FinalAmt'),
  mig.num(j->>'AutoDbt_Amount'), mig.num(j->>'Oth_Amount'), 0)) AS amt
FROM (
  SELECT 'UMIYA20' AS db, 'SalesMst' AS tbl, "Sal_Type" AS ftype, to_jsonb(t) AS j FROM legacy_umiya20."SalesMst" t
  UNION ALL SELECT 'UMIYA24', 'SalesMst', "Sal_Type", to_jsonb(t) FROM legacy_umiya24."SalesMst" t WHERE NOT (coalesce("Sal_IsLastYearEntry", '0') = '1' AND "Sal_Code" IN (SELECT "Sal_Code" FROM legacy_umiya20."SalesMst"))
  UNION ALL SELECT 'UMIYA20', 'PurchaseMst', "Pur_Type", to_jsonb(t) FROM legacy_umiya20."PurchaseMst" t
  UNION ALL SELECT 'UMIYA24', 'PurchaseMst', "Pur_Type", to_jsonb(t) FROM legacy_umiya24."PurchaseMst" t WHERE NOT (coalesce("Pur_IsLastYearEntry", '0') = '1' AND "Pur_Code" IN (SELECT "Pur_Code" FROM legacy_umiya20."PurchaseMst"))
  UNION ALL SELECT 'UMIYA20', 'RecMst', "Rec_Type", to_jsonb(t) FROM legacy_umiya20."RecMst" t
  UNION ALL SELECT 'UMIYA24', 'RecMst', "Rec_Type", to_jsonb(t) FROM legacy_umiya24."RecMst" t
  UNION ALL SELECT 'UMIYA20', 'QuotationMst', "Sal_Type", to_jsonb(t) FROM legacy_umiya20."QuotationMst" t
  UNION ALL SELECT 'UMIYA24', 'QuotationMst', "Sal_Type", to_jsonb(t) FROM legacy_umiya24."QuotationMst" t
  UNION ALL SELECT 'UMIYA20', 'DispatchMst', "Dspt_Type", to_jsonb(t) FROM legacy_umiya20."DispatchMst" t
  UNION ALL SELECT 'UMIYA24', 'DispatchMst', "Dspt_Type", to_jsonb(t) FROM legacy_umiya24."DispatchMst" t
  UNION ALL SELECT 'UMIYA20', 'AutoDebitNoteMst', 'AUTODBNT', to_jsonb(t) FROM legacy_umiya20."AutoDebitNoteMst" t
  UNION ALL SELECT 'UMIYA24', 'AutoDebitNoteMst', 'AUTODBNT', to_jsonb(t) FROM legacy_umiya24."AutoDebitNoteMst" t
  UNION ALL SELECT 'UMIYA20', 'PendingAdjustmentMst', 'PENDADJ', to_jsonb(t) FROM legacy_umiya20."PendingAdjustmentMst" t
  UNION ALL SELECT 'UMIYA24', 'PendingAdjustmentMst', 'PENDADJ', to_jsonb(t) FROM legacy_umiya24."PendingAdjustmentMst" t) x
GROUP BY 1, 2, 3;
CREATE TEMP TABLE new_docs AS
SELECT r.legacy_db AS db, r.legacy_table AS tbl, v.subtype AS ftype, count(*) AS n,
  sum(CASE WHEN r.legacy_table = 'RecMst' THEN v.amount WHEN r.legacy_table = 'PendingAdjustmentMst' THEN v.amount ELSE v.net_amount END) AS amt
FROM public.legacy_refs r JOIN public.vouchers v ON v.id = r.entity_id
WHERE r.entity = 'voucher' AND r.legacy_table <> 'JVMst' GROUP BY 1, 2, 3;
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Documents', 'count', coalesce(o.db, n.db) || ' ' || coalesce(o.tbl, n.tbl) || ' ' || coalesce(o.ftype, n.ftype, ''), o.n, n.n
FROM old_docs o FULL JOIN new_docs n ON n.db = o.db AND n.tbl = o.tbl AND n.ftype IS NOT DISTINCT FROM o.ftype;
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Documents', 'total amount', coalesce(o.db, n.db) || ' ' || coalesce(o.tbl, n.tbl) || ' ' || coalesce(o.ftype, n.ftype, ''), o.amt, n.amt
FROM old_docs o FULL JOIN new_docs n ON n.db = o.db AND n.tbl = o.tbl AND n.ftype IS NOT DISTINCT FROM o.ftype;
-- journals: count of journal documents (excluding GST/TDS/TCS postings attached to bills)
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Documents', 'count', o.db || ' JVMst ' || o.ftype, o.n, (SELECT count(*) FROM public.legacy_refs r JOIN public.vouchers v ON v.id = r.entity_id
  WHERE r.entity = 'voucher' AND r.legacy_table = 'JVMst' AND r.legacy_db = o.db AND v.subtype = o.ftype)
FROM (SELECT db, ftype, count(*) n FROM (
  SELECT DISTINCT 'UMIYA20' AS db, "Jv_Type" AS ftype, "JV_Code", "ComCode" FROM legacy_umiya20."JVMst" WHERE NOT ("Jv_Type" IN ('CGST','SGST','IGST','TDS','TCSPAY','TCSREC') AND coalesce("JV_Reff", '') <> '')
  UNION ALL SELECT DISTINCT 'UMIYA24', "Jv_Type", "JV_Code", "ComCode" FROM legacy_umiya24."JVMst" WHERE NOT ("Jv_Type" IN ('CGST','SGST','IGST','TDS','TCSPAY','TCSREC') AND coalesce("JV_Reff", '') <> '')) x
  GROUP BY 1, 2) o;
-- carried-forward copies: each is linked to the document made from its UMIYA20 original
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Documents', 'carried-forward copies linked', 'UMIYA24 bills flagged IsLastYearEntry',
  (SELECT count(*) FROM legacy_umiya24."SalesMst" WHERE "Sal_IsLastYearEntry" = '1' AND "Sal_Code" IN (SELECT "Sal_Code" FROM legacy_umiya20."SalesMst"))
  + (SELECT count(*) FROM legacy_umiya24."PurchaseMst" WHERE "Pur_IsLastYearEntry" = '1' AND "Pur_Code" IN (SELECT "Pur_Code" FROM legacy_umiya20."PurchaseMst")),
  (SELECT count(*) FROM public.legacy_refs WHERE entity = 'voucher_copy');
SELECT mig.note('reconcile: documents');

/* 4. lines: count and amount per old line table and database */
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Lines', 'count', o.db || ' ' || o.tbl, o.n, (SELECT count(*) FROM public.legacy_refs r WHERE r.entity = 'voucher_line' AND r.legacy_db = o.db AND r.legacy_table = o.tbl)
FROM (SELECT 'UMIYA20' db, 'SalesSubMst' tbl, count(*) n FROM legacy_umiya20."SalesSubMst"
      UNION ALL SELECT 'UMIYA24', 'SalesSubMst', count(*) FROM legacy_umiya24."SalesSubMst" s WHERE "SalS_Code" NOT IN (
        SELECT "Sal_Code" FROM legacy_umiya24."SalesMst" WHERE "Sal_IsLastYearEntry" = '1' AND "Sal_Code" IN (SELECT "Sal_Code" FROM legacy_umiya20."SalesMst"))
      UNION ALL SELECT 'UMIYA20', 'PurchaseSubMst', count(*) FROM legacy_umiya20."PurchaseSubMst"
      UNION ALL SELECT 'UMIYA24', 'PurchaseSubMst', count(*) FROM legacy_umiya24."PurchaseSubMst" WHERE "PurS_Code" NOT IN (
        SELECT "Pur_Code" FROM legacy_umiya24."PurchaseMst" WHERE "Pur_IsLastYearEntry" = '1' AND "Pur_Code" IN (SELECT "Pur_Code" FROM legacy_umiya20."PurchaseMst"))
      UNION ALL SELECT 'UMIYA20', 'QuotationSubMst', count(*) FROM legacy_umiya20."QuotationSubMst"
      UNION ALL SELECT 'UMIYA24', 'QuotationSubMst', count(*) FROM legacy_umiya24."QuotationSubMst"
      UNION ALL SELECT 'UMIYA20', 'RecSubMst', count(*) FROM legacy_umiya20."RecSubMst"
      UNION ALL SELECT 'UMIYA24', 'RecSubMst', count(*) FROM legacy_umiya24."RecSubMst"
      UNION ALL SELECT 'UMIYA20', 'AutoDebitNoteSubMst', count(*) FROM legacy_umiya20."AutoDebitNoteSubMst"
      UNION ALL SELECT 'UMIYA24', 'AutoDebitNoteSubMst', count(*) FROM legacy_umiya24."AutoDebitNoteSubMst"
      UNION ALL SELECT 'UMIYA20', 'DispatchMst', count(*) FROM legacy_umiya20."DispatchMst"
      UNION ALL SELECT 'UMIYA24', 'DispatchMst', count(*) FROM legacy_umiya24."DispatchMst") o;
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Lines', 'line amount', o.db || ' ' || o.tbl, o.amt, (SELECT sum(vl.amount) FROM public.legacy_refs r JOIN public.voucher_lines vl ON vl.id = r.entity_id
  WHERE r.entity = 'voucher_line' AND r.legacy_db = o.db AND r.legacy_table = o.tbl)
FROM (SELECT 'UMIYA20' db, 'SalesSubMst' tbl, sum(mig.num0("SalS_Amt")) amt FROM legacy_umiya20."SalesSubMst"
      UNION ALL SELECT 'UMIYA20', 'PurchaseSubMst', sum(mig.num0("PurS_Amt")) FROM legacy_umiya20."PurchaseSubMst"
      UNION ALL SELECT 'UMIYA20', 'QuotationSubMst', sum(mig.num0("SalS_Amt")) FROM legacy_umiya20."QuotationSubMst"
      UNION ALL SELECT 'UMIYA24', 'QuotationSubMst', sum(mig.num0("SalS_Amt")) FROM legacy_umiya24."QuotationSubMst"
      UNION ALL SELECT 'UMIYA20', 'RecSubMst', sum(mig.num0("RecS_Amount")) FROM legacy_umiya20."RecSubMst"
      UNION ALL SELECT 'UMIYA24', 'RecSubMst', sum(mig.num0("RecS_Amount")) FROM legacy_umiya24."RecSubMst") o;
SELECT mig.note('reconcile: lines');

/* 5. ledger: every account's balance per database (period) and company, exact */
CREATE TEMP TABLE old_bal AS
SELECT 20 AS period, mig.int("CompanyCode") AS comp, "Pcode" AS code, sum(mig.num0("TotAmt")) AS bal, count(*) AS n FROM legacy_umiya20."AccountLedger" GROUP BY 1, 2, 3
UNION ALL
SELECT 24, mig.int("CompanyCode"), "Pcode", sum(mig.num0("TotAmt")), count(*) FROM legacy_umiya24."AccountLedger" GROUP BY 1, 2, 3;
CREATE TEMP TABLE new_bal AS
SELECT e.ledger_period AS period, e.company_id AS comp, a.legacy_code AS code, sum(e.debit - e.credit) AS bal, count(*) AS n
FROM public.ledger_entries e LEFT JOIN public.accounts a ON a.id = e.account_id GROUP BY 1, 2, 3;
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Ledger', 'entries', 'UMIYA' || p, (SELECT sum(n) FROM old_bal WHERE period = p), (SELECT sum(n) FROM new_bal WHERE period = p) FROM (VALUES (20), (24)) t(p);
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Ledger', 'accounts with a different balance', 'UMIYA' || p, 0,
  (SELECT count(*) FROM old_bal o FULL JOIN new_bal n ON n.period = o.period AND n.comp = o.comp AND n.code IS NOT DISTINCT FROM o.code
   WHERE coalesce(o.period, n.period) = p AND coalesce(o.bal, 0) <> coalesce(n.bal, 0))
FROM (VALUES (20), (24)) t(p);
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Ledger', 'sum of absolute balances', 'UMIYA' || p, (SELECT sum(abs(bal)) FROM old_bal WHERE period = p), (SELECT sum(abs(bal)) FROM new_bal WHERE period = p)
FROM (VALUES (20), (24)) t(p);
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Ledger', 'company trial balance (sum of all balances)', 'UMIYA' || o.period || ' company ' || o.comp, o.s, n.s
FROM (SELECT period, comp, sum(bal) s FROM old_bal GROUP BY 1, 2) o LEFT JOIN (SELECT period, comp, sum(bal) s FROM new_bal GROUP BY 1, 2) n USING (period, comp);
-- per posting type (SAL, CGST, TDS, OPENING …): total debit side per database
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Ledger', 'debit total by posting type', o.period || ' ' || o.ftype, o.dr, n.dr
FROM (SELECT 20 period, "Ftype" ftype, sum(greatest(mig.num0("TotAmt"), 0)) dr FROM legacy_umiya20."AccountLedger" GROUP BY 1, 2
      UNION ALL SELECT 24, "Ftype", sum(greatest(mig.num0("TotAmt"), 0)) FROM legacy_umiya24."AccountLedger" GROUP BY 1, 2) o
LEFT JOIN (SELECT ledger_period period, subtype ftype, sum(debit) dr FROM public.ledger_entries GROUP BY 1, 2) n USING (period, ftype);
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Ledger', 'entries whose account is not in the masters', 'all', 0, count(*) FROM public.ledger_entries WHERE account_id IS NULL;
SELECT mig.note('reconcile: ledger');

/* 6. settlements: count and amount per source table and database */
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Settlements', 'count', o.db || ' ' || o.tbl, o.n, (SELECT count(*) FROM public.bill_allocations a WHERE a.extra->>'_db' = o.db AND a.extra->>'_table' = o.tbl)
FROM (SELECT 'UMIYA20' db, 'RecSubBilladjustMst' tbl, count(*) n FROM legacy_umiya20."RecSubBilladjustMst"
      UNION ALL SELECT 'UMIYA24', 'RecSubBilladjustMst', count(*) FROM legacy_umiya24."RecSubBilladjustMst"
      UNION ALL SELECT 'UMIYA20', 'SalPurBillAdustMst', count(*) FROM legacy_umiya20."SalPurBillAdustMst"
      UNION ALL SELECT 'UMIYA24', 'SalPurBillAdustMst', count(*) FROM legacy_umiya24."SalPurBillAdustMst"
      UNION ALL SELECT 'UMIYA20', 'JVBillAdustMst', count(*) FROM legacy_umiya20."JVBillAdustMst"
      UNION ALL SELECT 'UMIYA24', 'JVBillAdustMst', count(*) FROM legacy_umiya24."JVBillAdustMst"
      UNION ALL SELECT 'UMIYA20', 'PendingAdjustmentSubMst', count(*) FROM legacy_umiya20."PendingAdjustmentSubMst"
      UNION ALL SELECT 'UMIYA24', 'PendingAdjustmentSubMst', count(*) FROM legacy_umiya24."PendingAdjustmentSubMst") o;
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Settlements', 'amount', o.db || ' ' || o.tbl, o.amt, (SELECT sum(amount) FROM public.bill_allocations a WHERE a.extra->>'_db' = o.db AND a.extra->>'_table' = o.tbl)
FROM (SELECT 'UMIYA20' db, 'RecSubBilladjustMst' tbl, sum(mig.num0("RecSS_BillRecAmt")) amt FROM legacy_umiya20."RecSubBilladjustMst"
      UNION ALL SELECT 'UMIYA24', 'RecSubBilladjustMst', sum(mig.num0("RecSS_BillRecAmt")) FROM legacy_umiya24."RecSubBilladjustMst"
      UNION ALL SELECT 'UMIYA20', 'SalPurBillAdustMst', sum(mig.num0("Adj_BillRecAmt")) FROM legacy_umiya20."SalPurBillAdustMst"
      UNION ALL SELECT 'UMIYA24', 'SalPurBillAdustMst', sum(mig.num0("Adj_BillRecAmt")) FROM legacy_umiya24."SalPurBillAdustMst"
      UNION ALL SELECT 'UMIYA20', 'JVBillAdustMst', sum(mig.num0("JVS_BillRecAmt")) FROM legacy_umiya20."JVBillAdustMst"
      UNION ALL SELECT 'UMIYA24', 'JVBillAdustMst', sum(mig.num0("JVS_BillRecAmt")) FROM legacy_umiya24."JVBillAdustMst"
      UNION ALL SELECT 'UMIYA20', 'PendingAdjustmentSubMst', sum(mig.num0("OthS_Amount")) FROM legacy_umiya20."PendingAdjustmentSubMst"
      UNION ALL SELECT 'UMIYA24', 'PendingAdjustmentSubMst', sum(mig.num0("OthS_Amount")) FROM legacy_umiya24."PendingAdjustmentSubMst") o;

/* 7. outstanding per sale bill per database — the old view SaleBillRecAmt recomputed from the archive */
CREATE TEMP TABLE adj_all AS
SELECT d, c, b, sum(amt) amt FROM (
  SELECT 'UMIYA20' d, mig.int("ComCode") c, "RecSS_BillCode" b, mig.num0("RecSS_BillRecAmt") amt FROM legacy_umiya20."RecSubBilladjustMst"
  UNION ALL SELECT 'UMIYA24', mig.int("ComCode"), "RecSS_BillCode", mig.num0("RecSS_BillRecAmt") FROM legacy_umiya24."RecSubBilladjustMst"
  UNION ALL SELECT 'UMIYA20', mig.int("ComCode"), "Adj_BillCode", mig.num0("Adj_BillRecAmt") FROM legacy_umiya20."SalPurBillAdustMst"
  UNION ALL SELECT 'UMIYA24', mig.int("ComCode"), "Adj_BillCode", mig.num0("Adj_BillRecAmt") FROM legacy_umiya24."SalPurBillAdustMst"
  UNION ALL SELECT 'UMIYA20', mig.int("ComCode"), "JVS_BillCode", mig.num0("JVS_BillRecAmt") FROM legacy_umiya20."JVBillAdustMst"
  UNION ALL SELECT 'UMIYA24', mig.int("ComCode"), "JVS_BillCode", mig.num0("JVS_BillRecAmt") FROM legacy_umiya24."JVBillAdustMst") a GROUP BY 1, 2, 3;
CREATE TEMP TABLE old_os AS
SELECT s.db, s.comp, s.code, s.net - s.opp - coalesce(a.amt, 0) AS pending
FROM (SELECT 'UMIYA20' db, mig.int("ComCode") comp, "Sal_Code" code, mig.num0("Sal_NetAmt") net, mig.num0("Sal_OpPaidAmt") opp
      FROM legacy_umiya20."SalesMst" WHERE "Sal_Type" = 'SAL' AND coalesce("Sal_IsCancleEinv", '0') = '0'
      UNION ALL SELECT 'UMIYA24', mig.int("ComCode"), "Sal_Code", mig.num0("Sal_NetAmt"), mig.num0("Sal_OpPaidAmt")
      FROM legacy_umiya24."SalesMst" WHERE "Sal_Type" = 'SAL' AND coalesce("Sal_IsCancleEinv", '0') = '0') s
LEFT JOIN adj_all a ON a.d = s.db AND a.c = s.comp AND a.b = s.code;
-- YarnFlow: bill amount minus settlements of the same period (UMIYA24 copies of carried bills via their link)
CREATE TEMP TABLE new_os AS
SELECT o.db, o.comp, o.code,
  v.net_amount - coalesce((SELECT sum(a.amount) FROM public.bill_allocations a WHERE a.bill_id = v.id AND a.ledger_period = CASE o.db WHEN 'UMIYA20' THEN 20 ELSE 24 END
                            AND a.company_id = o.comp AND a.kind <> 'PENDING'), 0) AS pending
FROM old_os o
JOIN public.legacy_refs r ON r.legacy_table = 'SalesMst' AND r.legacy_key = o.code AND r.entity IN ('voucher', 'voucher_copy') AND r.legacy_db = o.db
JOIN public.vouchers v ON v.id = r.entity_id AND v.company_id = o.comp;
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Outstanding', 'sale bills with a different pending amount', db, 0,
  (SELECT count(*) FROM old_os o LEFT JOIN new_os n USING (db, comp, code) WHERE o.db = t.db AND coalesce(n.pending, -1e18) <> o.pending)
FROM (VALUES ('UMIYA20'), ('UMIYA24')) t(db);
INSERT INTO mig.recon (area, check_name, scope, old_value, new_value)
SELECT 'Outstanding', 'total pending of sale bills', db, (SELECT sum(pending) FROM old_os WHERE old_os.db = t.db), (SELECT sum(pending) FROM new_os WHERE new_os.db = t.db)
FROM (VALUES ('UMIYA20'), ('UMIYA24')) t(db);
SELECT mig.note('reconcile: settlements and outstanding');

SELECT mig.note('reconcile: ' || (SELECT count(*) FROM mig.recon) || ' checks, ' || (SELECT count(*) FROM mig.recon WHERE NOT ok) || ' with a difference');
