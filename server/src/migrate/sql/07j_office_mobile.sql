-- old "office mobile" (Party_ContactMst.P_OMobile) is what WhatsApp messages used
update accounts a set extra = coalesce(a.extra, '{}'::jsonb) || jsonb_build_object('P_OMobile', trim(c."P_OMobile"))
from legacy_refs r join legacy_umiya24."Party_ContactMst" c on c."PS_Code" = r.legacy_key
where r.entity = 'account' and r.legacy_db = 'UMIYA24' and r.entity_id = a.id and coalesce(trim(c."P_OMobile"), '') <> '';
