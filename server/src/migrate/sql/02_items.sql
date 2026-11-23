-- Step 3b: item groups, items, brands, lots, godowns, cost centers, vehicles, transporters.
-- Shared masters under the master company (1). UMIYA24 version wins, UMIYA20-only rows are added.

CREATE TEMP TABLE desc_all AS SELECT * FROM mig.latest('DescriptionMst', '"Desc_Code"');

CREATE TEMP TABLE units AS SELECT k AS code, btrim(j->>'Unit_Name') AS name FROM mig.latest('UnitMst', '"Unit_Code"');

/* ------------------------------------------------------------- item groups (id = IG_Code) */
CREATE TEMP TABLE src_ig AS SELECT * FROM mig.latest('ItemGroupMst', '"IG_Code"');
INSERT INTO public.item_groups (id, company_id, name, hsn, gst_rate, unit, is_service, legacy_code, extra)
SELECT mig.int((j->>'IG_Code')), 1, btrim((j->>'IG_Name')), mig.s((j->>'IG_HSNCODE')), mig.num((j->>'IG_IGST')), (SELECT name FROM units WHERE code = (j->>'IG_Unit')),
  coalesce(mig.b((j->>'IG_IsServiceGrp')), false), (j->>'IG_Code'), mig.row(g.j)
FROM src_ig g;
SELECT setval(pg_get_serial_sequence('public.item_groups', 'id'), (SELECT max(id) FROM public.item_groups));
INSERT INTO public.legacy_refs SELECT 'item_group', mig.int((j->>'IG_Code')), db, 'ItemGroupMst', (j->>'IG_Code'), _row, _sha FROM src_ig;

/* ------------------------------------------------------------------ brands (DescriptionMst Brand) */
INSERT INTO public.brands (company_id, name, legacy_code, extra)
SELECT 1, btrim((j->>'Desc_Name')), (j->>'Desc_Code'), mig.row(d.j) FROM desc_all d WHERE (j->>'Desc_type') = 'Brand';
INSERT INTO public.legacy_refs SELECT 'brand', b.id, d.db, 'DescriptionMst', (d.j->>'Desc_Code'), d._row, d._sha
FROM desc_all d JOIN public.brands b ON b.company_id = 1 AND b.legacy_code = (d.j->>'Desc_Code');

/* -------------------------------------------------------------------- items */
CREATE TEMP TABLE src_item AS SELECT * FROM mig.latest('ItemMst', '"I_CODE"');
INSERT INTO public.items (company_id, code, name, description, type, denier, brand_id, hsn, gst_rate, unit, rate, min_stock,
  is_general, is_active, group_id, legacy_code, extra)
SELECT 1, (i.j->>'I_CODE'), coalesce(mig.s(btrim((i.j->>'I_NAME'))), (i.j->>'I_CODE')), left(mig.s((i.j->>'I_Desc')), 240),
  (CASE WHEN g.is_service THEN 'SERVICE' ELSE 'OTHER' END)::yarn_type,
  left(mig.s((i.j->>'I_Denier')), 20), (SELECT id FROM public.brands WHERE company_id = 1 AND legacy_code = (i.j->>'I_Brand')),
  coalesce(left(mig.s(btrim((i.j->>'I_HSNCODE'))), 10), ''), coalesce(mig.num((i.j->>'I_IGST')), 0), coalesce((SELECT name FROM units WHERE code = (i.j->>'I_UOM')), ''),
  mig.num0((i.j->>'I_SRate')), mig.num0((i.j->>'I_MinimumStockQty')), coalesce(g.is_service, false),
  coalesce(upper((i.j->>'I_BLOCK')), 'NO') <> 'YES', mig.int((i.j->>'I_Group')), (i.j->>'I_CODE'), mig.row(i.j - 'I_ImgByte')
    || CASE WHEN mig.s((i.j->>'I_ImgByte')) IS NOT NULL THEN jsonb_build_object('I_ImgByte', (i.j->>'I_ImgByte')) ELSE '{}'::jsonb END
FROM src_item i LEFT JOIN public.item_groups g ON g.id = mig.int((i.j->>'I_Group'));
INSERT INTO public.legacy_refs SELECT 'item', it.id, i.db, 'ItemMst', (i.j->>'I_CODE'), i._row, i._sha
FROM src_item i JOIN public.items it ON it.company_id = 1 AND it.legacy_code = (i.j->>'I_CODE');

/* --------------------------------------------------------------------- lots */
CREATE TEMP TABLE src_lot AS SELECT * FROM mig.latest('LotMst', '"LOT_CODE"');
INSERT INTO public.lots (company_id, number, item_id, party_id, brand_id, is_active, legacy_code, extra)
SELECT 1, coalesce(mig.s((l.j->>'LOT_NMBR')), (l.j->>'LOT_CODE')),
  (SELECT id FROM public.items WHERE company_id = 1 AND legacy_code = (l.j->>'I_CODE')),
  (SELECT id FROM public.accounts WHERE company_id = 1 AND legacy_code = (l.j->>'P_CODE')),
  (SELECT id FROM public.brands WHERE company_id = 1 AND legacy_code = (l.j->>'Lot_Brand')),
  coalesce(mig.b((l.j->>'Lot_IsActive')), true), (l.j->>'LOT_CODE'), mig.row(l.j)
FROM src_lot l;
INSERT INTO public.legacy_refs SELECT 'lot', x.id, l.db, 'LotMst', (l.j->>'LOT_CODE'), l._row, l._sha
FROM src_lot l JOIN public.lots x ON x.company_id = 1 AND x.legacy_code = (l.j->>'LOT_CODE');

/* ------------------------------------------------------------------- godowns */
CREATE TEMP TABLE src_godown AS SELECT * FROM mig.latest('GodownMst', '"Godn_Code"');
INSERT INTO public.godowns (company_id, name, is_default, legacy_code, extra)
SELECT 1, btrim((j->>'Godn_Name')), (j->>'Godn_Code') = '1', (j->>'Godn_Code'), mig.row(g.j) FROM src_godown g;
INSERT INTO public.legacy_refs SELECT 'godown', x.id, g.db, 'GodownMst', (g.j->>'Godn_Code'), g._row, g._sha
FROM src_godown g JOIN public.godowns x ON x.company_id = 1 AND x.legacy_code = (g.j->>'Godn_Code');

/* ------------------------------------------------------- cost centers and vehicles (DescriptionMst) */
INSERT INTO public.cost_centers (company_id, name, legacy_code, extra)
SELECT 1, btrim((j->>'Desc_Name')), (j->>'Desc_Code'), mig.row(d.j) FROM desc_all d WHERE (j->>'Desc_type') = 'CostCenter';
INSERT INTO public.vehicles (company_id, number, legacy_code, extra)
SELECT 1, left(coalesce(mig.s(btrim((j->>'Desc_Name'))), (j->>'Desc_Code')), 20), (j->>'Desc_Code'), mig.row(d.j) FROM desc_all d WHERE (j->>'Desc_type') = 'Vehical';
INSERT INTO public.legacy_refs SELECT 'cost_center', x.id, d.db, 'DescriptionMst', (d.j->>'Desc_Code'), d._row, d._sha
FROM desc_all d JOIN public.cost_centers x ON x.company_id = 1 AND x.legacy_code = (d.j->>'Desc_Code');
INSERT INTO public.legacy_refs SELECT 'vehicle', x.id, d.db, 'DescriptionMst', (d.j->>'Desc_Code'), d._row, d._sha
FROM desc_all d JOIN public.vehicles x ON x.company_id = 1 AND x.legacy_code = (d.j->>'Desc_Code');

/* --------------------------------------- transporters = transport parties (P_Type TranParty) */
INSERT INTO public.transporters (company_id, name, gstin, mobile, address, city, account_id, legacy_code)
SELECT 1, a.name, a.gstin, a.mobile, a.address1, a.city, a.id, a.legacy_code
FROM public.accounts a WHERE a.company_id = 1 AND a.party_type = 'TranParty';

/* ---------------------------------------------- all other lookup values (areas, grades, banks …) */
-- kept as a lookup table so every DescriptionMst value is available by code
DROP TABLE IF EXISTS public.lookups;
CREATE TABLE public.lookups (code text PRIMARY KEY, type text, name text, extra jsonb);
INSERT INTO public.lookups SELECT (j->>'Desc_Code'), (j->>'Desc_type'), btrim((j->>'Desc_Name')), mig.row(d.j) FROM desc_all d;
INSERT INTO public.legacy_refs (entity, entity_id, legacy_db, legacy_table, legacy_key, legacy_row, legacy_sha)
SELECT 'lookup', 0, d.db, 'DescriptionMst', (d.j->>'Desc_Code'), d._row, d._sha FROM desc_all d
ON CONFLICT DO NOTHING;
