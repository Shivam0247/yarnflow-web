-- Helpers used by every migration step. Conversions are exact:
-- numbers go text -> numeric (no binary floating point), dates keep the calendar date.
CREATE SCHEMA IF NOT EXISTS mig;

-- exact decimal from the exported text ('' / NULL -> NULL, '1E-05' -> 0.00001)
CREATE OR REPLACE FUNCTION mig.num(t text) RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL OR btrim(t) = '' THEN NULL ELSE btrim(t)::numeric END $$;
-- same, but 0 instead of NULL (for NOT NULL amount columns; the archive still has the original)
CREATE OR REPLACE FUNCTION mig.num0(t text) RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(mig.num(t), 0) $$;
CREATE OR REPLACE FUNCTION mig.int(t text) RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL OR btrim(t) = '' THEN NULL ELSE trunc(btrim(t)::numeric)::integer END $$;
-- 'yyyy-mm-dd hh:mm:ss.fff' -> date (calendar date exactly as stored)
CREATE OR REPLACE FUNCTION mig.d(t text) RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL OR btrim(t) = '' THEN NULL ELSE left(btrim(t), 10)::date END $$;
CREATE OR REPLACE FUNCTION mig.ts(t text) RETURNS timestamp LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL OR btrim(t) = '' THEN NULL ELSE btrim(t)::timestamp END $$;
CREATE OR REPLACE FUNCTION mig.b(t text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL OR btrim(t) = '' THEN NULL ELSE lower(btrim(t)) IN ('1', 'true', 'y', 'yes') END $$;
-- empty text -> NULL (only for optional descriptive fields; codes keep their exact text)
CREATE OR REPLACE FUNCTION mig.s(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL OR t = '' THEN NULL ELSE t END $$;
-- financial-year id of a company for a date (fy ids are company*100 + legacy YearCode)
CREATE OR REPLACE FUNCTION mig.fy(company integer, d date) RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT id FROM public.financial_years WHERE company_id = company AND d BETWEEN start_date AND end_date $$;
-- the database ("ledger period") that owns a date: UMIYA20 up to FY 2023-24, UMIYA24 after
CREATE OR REPLACE FUNCTION mig.period(d date) RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN d < DATE '2024-04-01' THEN 20 ELSE 24 END $$;

-- Latest version of every row of a master table across both databases, matched by key.
-- Works even when the two databases have different columns (rows are returned as jsonb).
CREATE OR REPLACE FUNCTION mig.latest(tbl text, keyexpr text)
RETURNS TABLE (db text, k text, j jsonb, _row bigint, _sha text) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT DISTINCT ON (k) db, k, j, _row, _sha FROM (
       SELECT ''UMIYA24''::text AS db, (%2$s)::text AS k, to_jsonb(t) - ''_row'' - ''_sha'' AS j, t._row, t._sha FROM legacy_umiya24.%1$I t
       UNION ALL
       SELECT ''UMIYA20'', (%2$s)::text, to_jsonb(t) - ''_row'' - ''_sha'', t._row, t._sha FROM legacy_umiya20.%1$I t) x
     WHERE k IS NOT NULL ORDER BY k, db DESC', tbl, keyexpr);
END $$;

-- progress messages from inside a step
CREATE OR REPLACE FUNCTION mig.note(t text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE '% %', to_char(clock_timestamp(), 'HH24:MI:SS'), t; END $$;
