-- Orbit canonical Supabase setup script
-- Run this entire script in Supabase SQL Editor.
-- Safe to rerun: uses IF NOT EXISTS / ON CONFLICT patterns where possible.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('owner', 'admin', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('todo', 'in_progress', 'review', 'done');
  end if;

  if not exists (select 1 from pg_type where typname = 'idea_status') then
    create type public.idea_status as enum ('draft', 'validated', 'archived', 'converted');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  full_name varchar(120),
  job_title varchar(120),
  email varchar(255) not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  slug varchar(120) not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'member',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  title varchar(200) not null,
  summary text,
  content text,
  status public.idea_status not null default 'draft',
  converted_task_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete set null,
  creator_id uuid not null references public.users(id) on delete cascade,
  assignee_id uuid references public.users(id) on delete set null,
  title varchar(200) not null,
  description text,
  status public.task_status not null default 'todo',
  priority integer not null default 2,
  due_date timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title varchar(200) not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.task_dependencies (
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete cascade,
  uploader_id uuid not null references public.users(id) on delete cascade,
  file_name varchar(255) not null,
  file_path text not null,
  mime_type varchar(100),
  file_size integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  approved_at timestamptz,
  approved_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  timesheet_id uuid references public.timesheets(id) on delete set null,
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  is_running boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  creator_id uuid not null references public.users(id) on delete cascade,
  title varchar(200) not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location varchar(150),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  entity_type varchar(60) not null,
  entity_id uuid,
  action varchar(100) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.flowcharts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  name varchar(200) not null,
  data jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Alignment for already-existing databases.
alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists full_name varchar(120);
alter table public.users add column if not exists job_title varchar(120);
alter table public.users add column if not exists email varchar(255);
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.workspaces add column if not exists owner_id uuid;
alter table public.workspaces add column if not exists created_at timestamptz not null default now();
alter table public.workspaces add column if not exists updated_at timestamptz not null default now();

alter table public.workspace_members add column if not exists role public.member_role not null default 'member';
alter table public.workspace_members add column if not exists is_active boolean not null default true;
alter table public.workspace_members add column if not exists joined_at timestamptz not null default now();

alter table public.tasks add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.tasks add column if not exists status public.task_status not null default 'todo';
alter table public.tasks add column if not exists priority integer not null default 2;
alter table public.tasks add column if not exists due_date timestamptz;
alter table public.tasks add column if not exists started_at timestamptz;
alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists created_at timestamptz not null default now();
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

create unique index if not exists users_auth_user_id_unique_idx on public.users(auth_user_id);
create unique index if not exists users_email_unique_idx on public.users(email);
create unique index if not exists users_email_lower_unique_idx on public.users(lower(email));
create unique index if not exists workspaces_slug_unique_idx on public.workspaces(slug);

create index if not exists workspace_members_workspace_idx on public.workspace_members(workspace_id);
create index if not exists ideas_workspace_idx on public.ideas(workspace_id);
create index if not exists ideas_author_idx on public.ideas(author_id);
create index if not exists tasks_workspace_status_idx on public.tasks(workspace_id, status);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);
create index if not exists subtasks_task_idx on public.subtasks(task_id);
create index if not exists timesheets_workspace_user_idx on public.timesheets(workspace_id, user_id);
create index if not exists time_entries_workspace_user_idx on public.time_entries(workspace_id, user_id);
create index if not exists calendar_events_workspace_start_idx on public.calendar_events(workspace_id, starts_at);
create index if not exists activity_log_workspace_idx on public.activity_log(workspace_id);
create index if not exists flowcharts_workspace_idx on public.flowcharts(workspace_id);
create index if not exists flowcharts_creator_idx on public.flowcharts(creator_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_touch_updated_at on public.users;
create trigger trg_users_touch_updated_at
before update on public.users
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_workspaces_touch_updated_at on public.workspaces;
create trigger trg_workspaces_touch_updated_at
before update on public.workspaces
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_workspace_settings_touch_updated_at on public.workspace_settings;
create trigger trg_workspace_settings_touch_updated_at
before update on public.workspace_settings
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_ideas_touch_updated_at on public.ideas;
create trigger trg_ideas_touch_updated_at
before update on public.ideas
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_tasks_touch_updated_at on public.tasks;
create trigger trg_tasks_touch_updated_at
before update on public.tasks
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_calendar_events_touch_updated_at on public.calendar_events;
create trigger trg_calendar_events_touch_updated_at
before update on public.calendar_events
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_flowcharts_touch_updated_at on public.flowcharts;
create trigger trg_flowcharts_touch_updated_at
before update on public.flowcharts
for each row execute procedure public.touch_updated_at();

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
    return new;
end;
$$;

drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute procedure public.sync_auth_user_to_public_users();

-- Backfill auth users -> public.users.
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

-- Ensure each user has an active workspace membership.
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
on conflict (workspace_id, user_id) do update
set role = excluded.role, is_active = true;

commit;

-- Minimal seed block:
-- 1) first auth user
-- 2) matching public.users
-- 3) one owner workspace + membership
-- 4) starter tasks across statuses
do $$
declare
  v_auth_user_id uuid;
  v_user_id uuid;
  v_workspace_id uuid;
begin
  select au.id
  into v_auth_user_id
  from auth.users au
  order by au.created_at asc
  limit 1;

  if v_auth_user_id is null then
    raise notice 'Seed skipped: no auth.users row available yet.';
    return;
  end if;

  select u.id
  into v_user_id
  from public.users u
  where u.auth_user_id = v_auth_user_id
  limit 1;

  if v_user_id is null then
    raise notice 'Seed skipped: matching public.users row not found.';
    return;
  end if;

  select wm.workspace_id
  into v_workspace_id
  from public.workspace_members wm
  where wm.user_id = v_user_id
    and wm.is_active = true
  order by wm.joined_at asc
  limit 1;

  if v_workspace_id is null then
    insert into public.workspaces (name, slug, owner_id, created_at, updated_at)
    values (
      'Orbit Starter Workspace',
      'orbit-starter-' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8),
      v_user_id,
      now(),
      now()
    )
    returning id into v_workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role, is_active, joined_at)
    values (v_workspace_id, v_user_id, 'owner', true, now())
    on conflict (workspace_id, user_id) do update
    set role = 'owner', is_active = true;
  end if;

  if not exists (
    select 1
    from public.tasks t
    where t.workspace_id = v_workspace_id
      and t.title in (
        'Plan weekly sprint goals',
        'Build dashboard task widgets',
        'Review task dependency handling',
        'Publish Orbit task polish release'
      )
  ) then
    insert into public.tasks (
      workspace_id,
      creator_id,
      assignee_id,
      title,
      description,
      status,
      priority,
      due_date,
      metadata,
      created_at,
      updated_at
    )
    values
      (
        v_workspace_id,
        v_user_id,
        v_user_id,
        'Plan weekly sprint goals',
        'Define the top priorities for Orbit task execution this week.',
        'todo',
        2,
        now() + interval '1 day',
        jsonb_build_object(
          'labels', jsonb_build_array('planning'),
          'subtasksDone', 0,
          'subtasksTotal', 3,
          'comments', 0,
          'estimateHours', 2,
          'progress', 0,
          'recurring', false,
          'dependency', null,
          'startDate', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'isMilestone', false,
          'assigneeName', 'You'
        ),
        now(),
        now()
      ),
      (
        v_workspace_id,
        v_user_id,
        v_user_id,
        'Build dashboard task widgets',
        'Ship live task counters and sync behavior.',
        'in_progress',
        1,
        now() + interval '2 day',
        jsonb_build_object(
          'labels', jsonb_build_array('frontend'),
          'subtasksDone', 1,
          'subtasksTotal', 4,
          'comments', 1,
          'estimateHours', 6,
          'progress', 35,
          'recurring', false,
          'dependency', null,
          'startDate', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'isMilestone', false,
          'assigneeName', 'You'
        ),
        now(),
        now()
      ),
      (
        v_workspace_id,
        v_user_id,
        v_user_id,
        'Review task dependency handling',
        'Validate self/cross-workspace guardrails.',
        'review',
        2,
        now() + interval '3 day',
        jsonb_build_object(
          'labels', jsonb_build_array('backend'),
          'subtasksDone', 2,
          'subtasksTotal', 3,
          'comments', 2,
          'estimateHours', 3,
          'progress', 70,
          'recurring', false,
          'dependency', null,
          'startDate', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'isMilestone', false,
          'assigneeName', 'You'
        ),
        now(),
        now()
      ),
      (
        v_workspace_id,
        v_user_id,
        v_user_id,
        'Publish Orbit task polish release',
        'Release stable task stack improvements.',
        'done',
        3,
        now() - interval '1 day',
        jsonb_build_object(
          'labels', jsonb_build_array('release'),
          'subtasksDone', 4,
          'subtasksTotal', 4,
          'comments', 3,
          'estimateHours', 1,
          'progress', 100,
          'recurring', false,
          'dependency', null,
          'startDate', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'isMilestone', true,
          'assigneeName', 'You'
        ),
        now(),
        now()
      );
  end if;
end $$;

-- Verification queries:
select 'users_count' as check_name, count(*)::bigint as value from public.users
union all
select 'workspaces_count', count(*)::bigint from public.workspaces
union all
select 'workspace_members_count', count(*)::bigint from public.workspace_members
union all
select 'tasks_count', count(*)::bigint from public.tasks;

select count(*) as users_without_active_workspace
from public.users u
left join public.workspace_members wm
  on wm.user_id = u.id and wm.is_active = true
where wm.user_id is null;

select count(*) as users_without_auth_user
from public.users u
left join auth.users au on au.id = u.auth_user_id
where au.id is null;
