-- Step 3g: users. The old software's users come over by name, INACTIVE and without their old
-- passwords (passwords are never copied); an administrator activates them and sets a new password.
-- The YarnFlow administrator (created by the runner if missing) gets access to every company.
SELECT mig.note('users: start');

-- old users (user_login): name, mobile, e-mail, role; inactive until a new password is set
INSERT INTO public.users (name, email, mobile, password_hash, role, is_active)
SELECT initcap(lower(btrim(u.j->>'username'))),
  lower(regexp_replace(btrim(u.j->>'username'), '[^A-Za-z0-9]+', '', 'g')) || '@umiya.local',
  left(mig.s(u.j->>'User_MobileNO'), 20), '!', (CASE WHEN u.j->>'User_Role' = '1' THEN 'ADMIN' ELSE 'ACCOUNTANT' END)::role, false
FROM mig.latest('user_login', '"empid"') u
WHERE NOT EXISTS (SELECT 1 FROM public.users x WHERE x.email = lower(regexp_replace(btrim(u.j->>'username'), '[^A-Za-z0-9]+', '', 'g')) || '@umiya.local');
INSERT INTO public.legacy_refs (entity, entity_id, legacy_db, legacy_table, legacy_key, legacy_row, legacy_sha)
SELECT 'user', x.id, u.db, 'user_login', u.k, u._row, u._sha
FROM mig.latest('user_login', '"empid"') u
JOIN public.users x ON x.email = lower(regexp_replace(btrim(u.j->>'username'), '[^A-Za-z0-9]+', '', 'g')) || '@umiya.local'
ON CONFLICT DO NOTHING;

-- every user gets every company (the old software restricted per company in its own settings; kept in the archive)
INSERT INTO public.user_companies (user_id, company_id)
SELECT u.id, c.id FROM public.users u CROSS JOIN public.companies c
ON CONFLICT DO NOTHING;
-- who entered each document (the old Uname), shown as "prepared by" on the prints
CREATE TEMP TABLE uref AS SELECT legacy_key AS emp, entity_id AS user_id FROM public.legacy_refs WHERE entity = 'user';
CREATE INDEX ON uref (emp);
DO $$
DECLARE t text; d text;
BEGIN
  FOREACH d IN ARRAY ARRAY['UMIYA20', 'UMIYA24'] LOOP
    FOREACH t IN ARRAY ARRAY['SalesMst', 'PurchaseMst', 'RecMst', 'QuotationMst', 'JVMst', 'DispatchMst'] LOOP
      EXECUTE format($q$
        UPDATE public.vouchers v SET created_by_id = u.user_id
        FROM public.legacy_refs r JOIN legacy_%s.%I o ON o._row = r.legacy_row JOIN uref u ON u.emp = btrim(o."Uname")
        WHERE r.entity = 'voucher' AND r.legacy_db = %L AND r.legacy_table = %L AND v.id = r.entity_id
          AND v.created_by_id IS DISTINCT FROM u.user_id$q$, lower(d), t, d, t);
    END LOOP;
  END LOOP;
END $$;
SELECT mig.note('users: documents linked to the user who entered them');
SELECT mig.note('users: done');
