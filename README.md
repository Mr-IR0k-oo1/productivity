# Orbit

Orbit is a [Quantrix Studio](https://quantrix.studio) product. Planning and issue tracking for product teams: backlog and sprints, a board, epics and story points, burndown and velocity, ideas, flowcharts, calendar and time tracking.

For development, everything runs locally with an embedded database; no hosted service is required.

## Quick start

```bash
npm install
npm run dev        # web on http://localhost:3000, API on http://localhost:8787
```

Production:

```bash
npm run build
npm start
```

With no configuration the app runs as a single user, with a built-in Postgres-compatible database (PGlite) stored in `.orbit-data/`. Migrations run automatically on start.

## Team sign-in

Set `BETTER_AUTH_SECRET` (32+ random characters) in `.env.local` to turn on accounts. People sign up with email and password. The first account takes over the data created in single-user mode.

Add any of these providers by setting their client ID and secret (see `env.example`): GitHub, Google, Microsoft, Apple, GitLab. Register the callback URL `${APP_URL}/api/auth/callback/<provider>` with each one. Apple requires an HTTPS domain and an Apple Developer account, so it can't be used on `localhost`.

Auth is handled by [Better Auth](https://better-auth.com), with sessions in httpOnly cookies, stored in the same database.

## Roles

| | Owner | Admin | Member | Viewer |
|---|:-:|:-:|:-:|:-:|
| Read everything | ✓ | ✓ | ✓ | ✓ |
| Create and edit issues, comments, ideas | ✓ | ✓ | ✓ | |
| Delete other people's issues and ideas | ✓ | ✓ | | |
| Manage sprints, projects, settings | ✓ | ✓ | | |
| Invite people and change roles | ✓ | ✓ | | |
| Delete the workspace | ✓ | | | |

Rules live in `src/lib/permissions.ts` and are enforced by the API. Inviting an email with no account creates a pending invite, which is applied when that person signs up.

## API

Create a key in **Settings → Advanced / Developer → API keys**, then send it as a bearer token:

```bash
curl -H "Authorization: Bearer orb_…" http://localhost:8787/api/tasks
```

A key acts as the person who made it, in that workspace only, and never with more than their role allows. "Read only" keys can only make `GET` requests. Keys can expire, are revoked from the same screen, and stop working if their owner leaves the workspace. Only a SHA-256 hash of each key is stored.

## Configuration

See `env.example`. The main switches:

| Variable | Effect |
|---|---|
| `BETTER_AUTH_SECRET` | Turns on accounts and sign-in |
| `DATABASE_URL` | Use your own Postgres instead of the built-in database (requires `BETTER_AUTH_SECRET`) |
| `ORBIT_DATA_DIR` | Where the built-in database and uploads live (default `.orbit-data`) |
| `APP_URL` | Public URL, used for OAuth callbacks |

Back up a local install by stopping it and copying `ORBIT_DATA_DIR`.

## Development

```bash
npm run typecheck
npm run lint
npm test
npm run db:generate   # after changing src/db/schema.ts
```

- Web: Next.js 15 App Router, React 19, Tailwind 4, TanStack Query
- API: Hono 4 (`src/index.ts`), Drizzle ORM, Zod
- Database: PGlite locally, any Postgres via `DATABASE_URL`
- Desktop build: Tauri (`npm run build:desktop`)

## Still to do

- Ideas: tags, impact and the "related ideas" mind map are still client-only; idea-to-task dependency links have no API yet.
- Typed issue links (blocks, relates to, duplicates), watchers, saved filters, custom workflows and releases.
- End-to-end tests and CI.
