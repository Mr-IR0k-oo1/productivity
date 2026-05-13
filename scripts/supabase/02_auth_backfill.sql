-- Orbit Supabase Auth Hardening - Step 2
-- Backfill existing auth identities into public.users and normalize existing rows.

begin;

update public.users
set email = lower(email),
    updated_at = now()
where email <> lower(email);

insert into public.users (
  auth_user_id,
  email,
  full_name,
  avatar_url,
  created_at,
  updated_at
)
select
  au.id,
  lower(au.email),
  nullif(coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name'), ''),
  nullif(au.raw_user_meta_data->>'avatar_url', ''),
  now(),
  now()
from auth.users au
left join public.users u on u.auth_user_id = au.id
where au.email is not null
  and u.id is null
on conflict (auth_user_id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.users.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
  updated_at = now();

commit;

-- Post-check: these should normally be zero after backfill.
select count(*) as users_without_auth_user
from public.users u
left join auth.users au on au.id = u.auth_user_id
where au.id is null;
