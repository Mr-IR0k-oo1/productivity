-- Orbit Supabase Auth Hardening - Step 3
-- Ensure every app user has an owner workspace + membership.

create extension if not exists pgcrypto;

with users_without_workspace as (
  select
    u.id as user_id,
    substring(coalesce(nullif(u.full_name, ''), 'My') || ' Workspace' from 1 for 120) as workspace_name
  from public.users u
  left join public.workspace_members wm
    on wm.user_id = u.id and wm.is_active = true
  where wm.user_id is null
),
created_workspaces as (
  insert into public.workspaces (
    name,
    slug,
    owner_id,
    created_at,
    updated_at
  )
  select
    uw.workspace_name,
    substring(regexp_replace(lower(uw.workspace_name), '[^a-z0-9]+', '-', 'g') from 1 for 100)
      || '-'
      || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10),
    uw.user_id,
    now(),
    now()
  from users_without_workspace uw
  returning id, owner_id
)
insert into public.workspace_members (
  workspace_id,
  user_id,
  role,
  is_active,
  joined_at
)
select
  cw.id,
  cw.owner_id,
  'owner'::public.member_role,
  true,
  now()
from created_workspaces cw
on conflict (workspace_id, user_id) do nothing;

-- Post-check: should be zero for full backfill completion.
select count(*) as users_without_active_workspace
from public.users u
left join public.workspace_members wm
  on wm.user_id = u.id and wm.is_active = true
where wm.user_id is null;
