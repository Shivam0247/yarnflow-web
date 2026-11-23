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
SELECT mig.note('users: done');
