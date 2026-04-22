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

### `DATABASE_URL` format (important for Vercel)

Use only the raw connection URL value. Do not include `DATABASE_URL=` in the Vercel value field.

- Correct:
  - `postgresql://postgres:your%40encoded%23password@db.<project-ref>.supabase.co:5432/postgres`
- Incorrect:
  - `"postgresql://..."`
  - `'postgresql://...'`
  - `DATABASE_URL=postgresql://...`

If the database password contains reserved URL characters, URL-encode them:

- `@` -> `%40`
- `#` -> `%23`
- `%` -> `%25`
- `?` -> `%3F`
- `/` -> `%2F`

In Vercel, set `DATABASE_URL` in all scopes:

- Production
- Preview
- Development

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

GitHub sign-in works best when the account exposes a verified email address. If GitHub hides the email, Orbit will stop at the callback step and show a clear recovery message on `/login`.

## 3) Canonical SQL Setup (single script)

Run this script in Supabase SQL Editor:

1. [`scripts/supabase/orbit_canonical_setup.sql`](/C:/Users/Kishanth/Documents/productivity/scripts/supabase/orbit_canonical_setup.sql)

What it does:

- creates/aligns Orbit enums, tables, indexes, and update triggers
- keeps `auth.users` -> `public.users` synchronized
- backfills existing auth identities and workspace memberships
- seeds one starter workspace and starter task set using the first available auth user
- includes post-run verification queries at the end of the script

Legacy split scripts are still available under `scripts/supabase/01..03` but are no longer the primary setup path.

## 4) Verify in Supabase

Run checks in SQL Editor (or use the verification block at the bottom of the canonical script):

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

select count(*) as tasks_total from public.tasks;
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
