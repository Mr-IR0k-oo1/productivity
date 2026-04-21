-- Orbit Supabase Auth Hardening - Step 1
-- Run in Supabase SQL Editor (as a privileged role) before app cutover.

-- Preflight: check for duplicate normalized emails.
-- If this returns rows, resolve manually before creating the unique index.
select lower(email) as normalized_email, count(*) as duplicate_count
from public.users
group by lower(email)
having count(*) > 1;

-- Enforce case-insensitive email uniqueness for app-side users.
create unique index if not exists users_email_lower_unique_idx on public.users (lower(email));

-- Keep public.users synchronized with auth.users lifecycle.
create or replace function public.sync_auth_user_to_public_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_avatar_url text;
begin
  if new.email is null then
    return new;
  end if;

  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name');
  v_avatar_url := new.raw_user_meta_data->>'avatar_url';

  insert into public.users (
    auth_user_id,
    email,
    full_name,
    avatar_url,
    created_at,
    updated_at
  )
  values (
    new.id,
    lower(new.email),
    nullif(v_full_name, ''),
    nullif(v_avatar_url, ''),
    now(),
    now()
  )
  on conflict (auth_user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();

  return new;
exception
  when unique_violation then
    -- Keep auth pipeline resilient even if historic app-side conflicts exist.
    return new;
end;
$$;

drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute procedure public.sync_auth_user_to_public_users();
