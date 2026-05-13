# Orbit

Modern dark-themed startup productivity platform with Next.js frontend and Hono backend in one deployable Vercel project.

## Tech Stack

- Frontend: Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn-style UI, Zustand, TanStack Query, Supabase JS
- Backend: Hono v4, Drizzle ORM, PostgreSQL (Supabase), Zod validation, Supabase Auth helpers

## Folder Structure

```text
app/
  layout.tsx
  providers.tsx
  globals.css
  dashboard/page.tsx
  ideas/page.tsx
  tasks/page.tsx
  tasks/[id]/focus/page.tsx
  calendar/page.tsx
  time/page.tsx
  reports/page.tsx
  settings/page.tsx
components/
  ui/
  layout/
  common/
  dashboard/
  features/
hooks/
lib/
  supabase/
  realtime/
src/
  index.ts
  routes/
    auth.ts
    workspace.ts
    ideas.ts
    tasks.ts
    calendar.ts
    time.ts
    reports.ts
  controllers/
  middleware/
  db/
    schema.ts
    index.ts
  lib/
    supabase.ts
  types/
api/
  [[...route]].ts
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL` (public app URL used by OAuth redirects; set to the live domain in production)
- `APP_URL`
- `API_URL`
- `NEXT_PUBLIC_DEFAULT_WORKSPACE_ID` (optional; if omitted, the app resolves the first accessible workspace from the API)
- `ORBIT_DISABLE_AUTH` (optional; local development auth bypass)
- `NEXT_PUBLIC_ORBIT_DISABLE_AUTH` (optional; local development auth bypass)

The browser reads the active Supabase session directly, keeps the current workspace id in local storage under `pf-workspace-id`, and falls back to the first accessible workspace when needed.

For local testing without login, set both `ORBIT_DISABLE_AUTH=true` and `NEXT_PUBLIC_ORBIT_DISABLE_AUTH=true`. Keep them `false` in production.

### `DATABASE_URL` for Vercel

Set only the connection URL value (no `DATABASE_URL=` prefix and no wrapping quotes).

- Correct:
  - `postgresql://postgres:your%40encoded%23password@db.<project-ref>.supabase.co:5432/postgres`
- Incorrect:
  - `"postgresql://..."`
  - `'postgresql://...'`
  - `DATABASE_URL=postgresql://...`

If your password contains reserved URL characters, URL-encode them (`@` -> `%40`, `#` -> `%23`, `%` -> `%25`, `?` -> `%3F`, `/` -> `%2F`).

## OAuth Setup (Supabase)

1. Open Supabase Dashboard for your project.
2. Go to Authentication > Providers.
3. Enable Google, GitHub, and Microsoft providers (Microsoft maps to provider key `azure` in Supabase JS).
4. Add redirect URLs for each enabled provider:

- `http://localhost:3000/auth/callback`
- `https://your-domain.com/auth/callback`

Orbit uses `/login` and `/register` as canonical auth entrypoints, with `/auth/callback` for OAuth completion and bootstrap.

## Supabase Canonical SQL Setup

Run this script in Supabase SQL Editor:

1. `scripts/supabase/orbit_canonical_setup.sql`

It creates/aligns Orbit schema objects, configures auth sync trigger behavior, backfills users/workspace membership, seeds starter tasks, and includes verification queries at the end.

Detailed guide: [`docs/supabase-auth-setup.md`](docs/supabase-auth-setup.md)

## Local Development

```bash
npm install
npm run dev
```

- `npm run dev` starts both the Next frontend and the Hono API server.
- If `API_URL` is omitted in local development, the Next app falls back to `http://localhost:8787`.
- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8787](http://localhost:8787)

## Validation Commands

```bash
npm run typecheck
npm run lint
npm run build
```

## Drizzle Commands

```bash
npm run db:generate
npm run db:push
```

## Vercel Deployment

1. Import this repository into Vercel.
2. Framework preset: Next.js.
3. Set all environment variables from `.env.example`.
4. Set `DATABASE_URL` in Production, Preview, and Development scopes.
5. Set `NEXT_PUBLIC_APP_URL` and `APP_URL` to your live domain in production, and to `http://localhost:3000` for local development.
6. Deploy.

The Next.js app serves UI and the Hono API through `api/[[...route]].ts` serverless handlers.

Runtime health checks:

- API liveness: `/health`
- DB-aware health check: `/api/health/db`

## Unfinished Work To Reach A Complete Product

### Launch Blockers (Must Complete Before V1)

- [ ] Fix ideas voting API parity by implementing `POST /api/ideas/:id/vote` (or remove the frontend vote mutation path).
- [ ] Fix time entry API parity by implementing create/update/delete endpoints for `/api/time/entries` used by the frontend.
- [ ] Replace scaffold-only time and reports blocks with fully data-backed analytics and remove scaffold placeholder copy.
- [ ] Replace local-only idea interactions (comments, dependency links, and prompt-based edits) with persisted backend flows.
- [ ] Replace pseudo task subtasks/comments UI with real persisted subtasks/comments/attachments behavior.
- [ ] Complete calendar field persistence for event kind/project/location/task linkage across create and edit flows.
- [ ] Resolve task/idea detail experience drift (documented structure vs current implementation) and finalize the route strategy.
- [ ] Add consistent user-facing error handling (form validation errors, mutation failures, and recovery UX) across all core workflows.

### Production Hardening (Must Complete Before Scale)

- [ ] Add automated tests (unit, API integration, and key E2E journeys) and include a test script in `package.json`.
- [ ] Add CI checks on pull requests for typecheck, lint, tests, and build.
- [ ] Add observability: structured API logs, error tracking, request tracing, and alerting.
- [ ] Harden security controls: auth rate limiting, authorization regression tests, and environment/secret validation.
- [ ] Add performance checks for heavy workspaces (tasks, calendar, reports, and flowcharts) and define performance budgets.
- [ ] Complete accessibility pass (keyboard navigation, focus states, ARIA labels, contrast, and screen reader checks).
- [ ] Expand documentation with API reference, troubleshooting, and release/runbook procedures.
- [ ] Validate backup and disaster recovery procedures, including tested restore steps.
- [ ] Run full cross-browser and mobile responsiveness QA before production release.

### Known Current Gaps

- Ideas vote mutation currently targets `/api/ideas/:id/vote`, but that route is not implemented.
- Frontend time entry create/update/delete calls target `/api/time/entries`, but backend currently exposes timer start/stop, read entries, and timesheet creation.
- Calendar currently falls back to demo events when API events are empty.
- Rich text editor remains scaffold-only and is not wired to persistence.
- Time and reports pages still contain scaffold-complete placeholder messaging.

## Suggested GitHub Issue Breakdown

Use this as a direct issue creation checklist to move from backlog to execution.

### Launch Blockers

- [ ] `feat(api): add ideas vote endpoint parity`
- [ ] `feat(api): add time entries create/update/delete endpoints`
- [ ] `feat(time): replace scaffold analytics with real data`
- [ ] `feat(reports): replace scaffold analytics with real data`
- [ ] `feat(ideas): persist comments, dependency links, and editing flows`
- [ ] `feat(tasks): persist subtasks, comments, and attachments in detail UX`
- [ ] `fix(calendar): persist kind/project/location/task linkage in create and edit`
- [ ] `fix(app): align task/idea detail route strategy and docs`
- [ ] `feat(ui): standardize validation and mutation error feedback`

### Production Hardening

- [ ] `test: add unit, integration, and e2e coverage for critical journeys`
- [ ] `ci: enforce lint/typecheck/test/build on pull requests`
- [ ] `ops: add structured logs, error tracking, tracing, and alerting`
- [ ] `security: add auth rate limits and authorization regression tests`
- [ ] `perf: define budgets and optimize heavy workspace screens`
- [ ] `a11y: complete keyboard, contrast, ARIA, and screen reader checks`
- [ ] `docs: add API reference, troubleshooting, and release runbook`
- [ ] `ops: validate backup and disaster recovery procedures`
- [ ] `qa: complete cross-browser and mobile release validation`

## Release Readiness Tracker

Default assignments below are role-based placeholders. Update names and exact dates after sprint kickoff.

| Workstream | Status | Owner | Target | Exit Criteria |
| --- | --- | --- | --- | --- |
| API Parity (Ideas + Time) | Planned | Backend Lead | Week 1 (Apr 22-Apr 28) | Frontend contracts and backend routes match for vote and time entry CRUD |
| Core Feature Completeness | Planned | Frontend Lead | Week 1-2 (Apr 22-May 5) | Time, reports, ideas, tasks, and calendar flows are fully persisted |
| UX Reliability | Planned | Frontend Lead | Week 2 (Apr 29-May 5) | Consistent validation, error handling, and recovery UX across main journeys |
| Testing | Planned | QA Lead | Week 3 (May 6-May 12) | Unit, integration, and E2E tests cover critical product paths |
| CI/CD | Planned | DevOps Lead | Week 3 (May 6-May 12) | PR checks block merges unless lint/typecheck/tests/build pass |
| Observability + Ops | Planned | DevOps Lead | Week 3 (May 6-May 12) | Logs, alerts, tracing, backup, and restore playbooks are operational |
| Security + A11y + Performance | Planned | Security + Frontend Leads | Week 3 (May 6-May 12) | Security checks, accessibility checks, and performance budgets pass |

## Suggested Milestone Timeline (3-Week Draft)

Use this draft to sequence workstream delivery. Adjust based on team capacity.

| Week | Primary Focus | Mapped Tracker Rows | Planned Outcomes |
| --- | --- | --- | --- |
| Week 1 (Apr 22-Apr 28) | API parity and persistence correctness | API Parity (Ideas + Time), Core Feature Completeness | Ideas voting endpoint parity, time entry CRUD parity, calendar create/edit field persistence complete |
| Week 2 (Apr 29-May 5) | Feature completeness and UX reliability | Core Feature Completeness, UX Reliability | Time/reports scaffold placeholders removed, ideas/tasks detail interactions persisted, standardized mutation/error handling |
| Week 3 (May 6-May 12) | Release hardening and ship gate | Testing, CI/CD, Observability + Ops, Security + A11y + Performance | Test suite and CI gates active, observability baseline enabled, security/a11y/perf checks passed, release docs and QA sign-off complete |

### Milestone Exit Gate

- [ ] All launch blocker checklist items are complete.
- [ ] All release tracker rows have owner, status, and target date assigned.
- [ ] No unresolved API/frontend contract mismatches remain.
- [ ] Production deployment, rollback, and recovery procedures are verified.
