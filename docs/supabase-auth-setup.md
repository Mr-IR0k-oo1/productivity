# Orbit Supabase Auth Setup Guide

This guide matches the rebuilt Orbit auth flow in this repo.

## 1) Environment Variables

Set these in local `.env` and in your deployed environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `APP_URL`
- `API_URL` (local dev only)
- `ORBIT_DISABLE_AUTH` (optional, local dev bypass only)
- `NEXT_PUBLIC_ORBIT_DISABLE_AUTH` (optional, local dev bypass only)

### Local dev auth bypass (optional)

If you want to test the product quickly without login:

- set `ORBIT_DISABLE_AUTH=true`
- set `NEXT_PUBLIC_ORBIT_DISABLE_AUTH=true`

When bypass is enabled, the app resolves auth/workspace context from your existing `public.users` + `workspace_members` rows. Keep this disabled in production.

## 2) Supabase Auth Provider Setup

In Supabase Dashboard:

1. Go to `Authentication -> URL Configuration`
2. Set **Site URL**:
   - local: `http://localhost:3000`
   - prod: your real app domain
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://<your-domain>/auth/callback`

Then enable providers in `Authentication -> Providers`:

- Google
- GitHub
- Microsoft (provider key: `azure`)

## 3) Auth Hardening SQL (Run in Order)

Run these scripts in Supabase SQL Editor:

1. [`scripts/supabase/01_auth_sync_and_indexes.sql`](/C:/Users/Kishanth/Documents/productivity/scripts/supabase/01_auth_sync_and_indexes.sql)
2. [`scripts/supabase/02_auth_backfill.sql`](/C:/Users/Kishanth/Documents/productivity/scripts/supabase/02_auth_backfill.sql)
3. [`scripts/supabase/03_workspace_backfill.sql`](/C:/Users/Kishanth/Documents/productivity/scripts/supabase/03_workspace_backfill.sql)

What they do:

- enforce case-insensitive email uniqueness on `public.users`
- sync `auth.users` -> `public.users` via trigger
- backfill existing auth identities
- ensure each user has at least one active owner workspace membership

## 4) Verify in Supabase

Run checks in SQL Editor:

```sql
select count(*) as users_total from public.users;
select count(*) as auth_users_total from auth.users;

select count(*) as users_without_auth
from public.users u
left join auth.users au on au.id = u.auth_user_id
where au.id is null;

select count(*) as users_without_workspace
from public.users u
left join public.workspace_members wm
  on wm.user_id = u.id and wm.is_active = true
where wm.user_id is null;
```

Expected:

- `users_without_auth = 0`
- `users_without_workspace = 0`

## 5) App Flow Expectations After Setup

- Canonical auth routes: `/login` and `/register`
- `/auth` is compatibility redirect
- OAuth callback: `/auth/callback`
- Backend auth API is mounted at `/api/auth/*`
- Magic-link login only works for existing accounts

## 6) Local Smoke Test

```bash
npm run typecheck
npm run dev
```

Test paths:

- `/register` -> create account + workspace
- `/login` -> password login
- `/login` -> Google/GitHub/Microsoft OAuth
- `/login` -> magic link
- `/auth/forgot-password` and `/auth/update-password`
