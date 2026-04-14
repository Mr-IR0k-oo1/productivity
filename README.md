# PulseForge

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
  ideas/[id]/page.tsx
  tasks/page.tsx
  tasks/[id]/page.tsx
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
- `APP_URL`
- `API_URL`

## Local Development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:8787

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
4. Deploy.

The Next.js app serves UI and the Hono API through `api/[[...route]].ts` serverless handlers.
