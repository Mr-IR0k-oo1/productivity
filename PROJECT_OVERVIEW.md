# Orbit - Productivity Platform

**Version:** 0.1.0  
**Status:** In Development (Pre-Launch)  
**Last Updated:** 2026-04-24  
**Git User:** Mr-IR0k-oo1

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Features & Pages](#features--pages)
6. [API Routes](#api-routes)
7. [Database](#database)
8. [Environment Setup](#environment-setup)
9. [Development](#development)
10. [Git History](#git-history)
11. [Current State & Known Gaps](#current-state--known-gaps)
12. [Launch Blockers](#launch-blockers)
13. [Production Hardening](#production-hardening)
14. [Deployment](#deployment)

---

## Project Overview

**Orbit** is a modern, dark-themed startup productivity platform designed to help teams manage tasks, ideas, time tracking, and project workflows all in one place. It combines a Next.js frontend with a Hono backend, both deployable as a single Vercel serverless application.

### Key Goals
- Centralized workspace management for productivity
- Real-time collaboration features
- Task and project tracking
- Time management and reporting
- Idea voting and dependency tracking
- Calendar event management
- Beautiful dark UI with Tailwind CSS

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19 (latest)
- **Styling:** Tailwind CSS v4 + PostCSS v4
- **UI Components:** Radix UI, shadcn-style custom components
- **State Management:** Zustand v5
- **Data Fetching:** TanStack React Query v5
- **Drag & Drop:** dnd-kit (core + sortable)
- **Rich Text Editing:** TipTap v2
- **Charts:** Recharts
- **3D Graphics:** Three.js
- **Utilities:** date-fns, class-variance-authority, clsx
- **Form Validation:** Zod
- **Auth:** Supabase JS Client

### Backend
- **Runtime/Framework:** Hono v4 (lightweight HTTP framework)
- **Server:** @hono/node-server v1.14 (Node.js support)
- **Database ORM:** Drizzle ORM v0.45
- **Database:** PostgreSQL (via Supabase)
- **Database Management:** Drizzle Kit v0.31
- **Schema Validation:** Zod v3 (API request/response validation)
- **Middleware:** @hono/zod-validator for request validation

### DevOps & Build Tools
- **Package Manager:** npm
- **Task Runner:** concurrently (run frontend + backend simultaneously)
- **TypeScript:** v5.8 (strict mode)
- **Linting:** ESLint v9
- **Build Tool:** Node.js with Next.js built-in bundler
- **Runtime Compatibility:** TypeScript via tsx for Node.js

### Database & Auth
- **Hosting:** Supabase (PostgreSQL + Auth + Realtime)
- **Authentication:** Supabase Auth (Email, Google, GitHub, Microsoft/Azure OAuth)
- **Database Type:** PostgreSQL 15+
- **Migrations:** Drizzle Kit (SQL generation)
- **ORM Migrations:** Tracked via `src/db/schema.ts`

---

## Architecture

### Full-Stack Monorepo Architecture

```
Single Vercel Project
├── Frontend (Next.js 15 App Router)
│   ├── API Routes (Next.js serverless)
│   │   └── api/[[...route]].ts → proxies to Hono backend
│   ├── Pages (App Router)
│   ├── Components
│   ├── Hooks
│   ├── Utilities
│   └── Globals (CSS, providers)
│
├── Backend (Hono v4)
│   ├── Routes (separate modules for auth, tasks, ideas, etc.)
│   ├── Controllers (business logic)
│   ├── Middleware (auth, workspace validation)
│   ├── Database (Drizzle schema + migrations)
│   └── Types & Bindings
│
└── Shared
    ├── Zod schemas (validation)
    ├── Environment config
    └── Build tools (TypeScript, ESLint)
```

### Request Flow

**Local Development:**
- Browser → `http://localhost:3000` (Next.js dev server)
- API calls → `http://localhost:8787` (Hono backend, started separately)
- Frontend routes via Next.js App Router
- Environment rewrites for `/api/*` to backend

**Production (Vercel):**
- Browser → Vercel URL (all served via Next.js serverless)
- API calls → `api/[[...route]].ts` → Hono backend handlers
- Database → Supabase PostgreSQL (connection pooling via DATABASE_URL)
- Auth state → Supabase session (stored in browser local storage)

### Data Flow

1. **Frontend → Backend:** React components use TanStack Query for data fetching, sending requests to `/api/*` endpoints
2. **Backend → Database:** Hono routes use Drizzle ORM to query PostgreSQL via Supabase
3. **Realtime Updates:** Supabase Realtime listeners (configured but not fully wired in UI)
4. **Session Management:** Supabase Auth session stored in browser; API validates via JWT

---

## Directory Structure

### Root Level Files

```
productivity/
├── .env.example              # Environment variables template (SECRETS EXPOSED - DO NOT COMMIT)
├── .env.local                # Local environment overrides (gitignored)
├── .eslintrc.json            # ESLint configuration
├── .gitignore                # Git ignore patterns
├── drizzle.config.ts         # Drizzle ORM configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies & scripts
├── package-lock.json         # Locked dependency versions
├── postcss.config.mjs         # PostCSS configuration (Tailwind)
├── tsconfig.json             # TypeScript config (frontend)
├── tsconfig.api.json         # TypeScript config (backend)
├── vercel.json               # Vercel deployment config
├── tailwind.config.ts        # Tailwind CSS configuration
└── README.md                 # Original project README
```

### Frontend Structure (`app/` & `components/`)

```
app/
├── layout.tsx                # Root layout + providers
├── page.tsx                  # Home/landing page
├── providers.tsx             # React context providers (Query, Zustand, Supabase)
├── globals.css               # Global styles (Tailwind base)
│
├── dashboard/
│   └── page.tsx              # Main dashboard view
│
├── my-day/
│   └── page.tsx              # Today's focused view
│
├── tasks/
│   ├── page.tsx              # Tasks list view
│   └── [id]/
│       └── focus/
│           └── page.tsx      # Task detail/focus view
│
├── ideas/
│   └── page.tsx              # Ideas brainstorming page
│
├── calendar/
│   └── page.tsx              # Calendar event view
│
├── time/
│   └── page.tsx              # Time tracking page
│
├── reports/
│   └── page.tsx              # Analytics & reporting dashboard
│
├── flowcharts/
│   ├── page.tsx              # Flowchart list
│   └── [id]/
│       └── page.tsx          # Flowchart detail
│
├── settings/
│   └── page.tsx              # User & workspace settings
│
├── profile/
│   └── page.tsx              # User profile page
│
├── admin/
│   └── page.tsx              # Admin panel (workspace management)
│
└── auth/
    ├── page.tsx              # Auth layout
    ├── callback/
    │   └── page.tsx          # OAuth redirect handler
    ├── forgot-password/
    │   └── page.tsx          # Password reset request
    ├── update-password/
    │   └── page.tsx          # Password update flow
    ├── login/
    │   └── page.tsx          # Login page
    └── register/
        └── page.tsx          # Registration page

components/
├── ui/
│   ├── avatar.tsx            # Reusable avatar component
│   └── [other UI components] # Shadcn-style components
│
├── layout/
│   ├── [layout components]   # Navigation, sidebars, headers
│
├── common/
│   ├── [shared components]   # Reusable across pages
│
├── dashboard/
│   ├── [dashboard-specific]  # Dashboard-only components
│
└── features/
    ├── ActivityFeed.tsx      # Activity stream component
    ├── DashboardWidget.tsx   # Reusable dashboard card widget
    ├── DataTable.tsx         # Generic data table
    ├── RichTextEditor.tsx    # TipTap rich text editor wrapper
    ├── TimeTracker.tsx       # Time tracking widget
    └── [other features]      # Feature-specific components

hooks/
├── [custom React hooks]      # useQuery, useWorkspace, useTasks, etc.

lib/
├── utils.ts                  # UI utility functions (cn, etc.)
├── supabase/
│   ├── [client helpers]      # Supabase client setup & helpers
│
└── realtime/
    └── [realtime listeners]  # Supabase Realtime subscriptions
```

### Backend Structure (`src/`)

```
src/
├── index.ts                  # Hono app entry point & server startup
│
├── db/
│   ├── index.ts              # Database client initialization
│   └── schema.ts             # Drizzle ORM table schemas
│
├── routes/
│   ├── auth.ts               # Authentication endpoints
│   ├── workspace.ts          # Workspace CRUD & management
│   ├── tasks.ts              # Task CRUD endpoints
│   ├── projects.ts           # Project management endpoints
│   ├── tags.ts               # Tag management endpoints
│   ├── ideas.ts              # Idea voting & CRUD
│   ├── time.ts               # Time entry & timesheet endpoints
│   ├── calendar.ts           # Calendar event endpoints
│   ├── reports.ts            # Analytics & reporting endpoints
│   ├── subtasks.ts           # Subtask CRUD endpoints
│   ├── comments.ts           # Comment thread endpoints
│   ├── attachments.ts        # File attachment endpoints
│   ├── flowcharts.ts         # Flowchart/diagram endpoints
│   └── settings.ts           # Settings endpoints
│
├── controllers/
│   ├── auth-controller.ts    # Auth business logic
│   ├── tasks-controller.ts   # Task business logic
│   └── [other controllers]   # Domain-specific logic
│
├── middleware/
│   ├── auth.ts               # JWT verification middleware
│   └── workspace.ts          # Workspace context middleware
│
├── lib/
│   ├── supabase.ts           # Supabase server client
│   ├── auth.ts               # Auth helper functions
│   ├── workspace-slug.ts     # Workspace slug utilities
│   ├── workspace-access.ts   # Workspace permission checks
│   └── workspace-settings.ts # Workspace config helpers
│
└── types/
    ├── bindings.ts           # Hono context type bindings
    └── env.ts                # Environment variable types
```

### API Integration (`app/api/`)

```
app/
└── api/
    ├── [[...route]].ts       # Catch-all route for Hono backend
    │
    ├── flowcharts/
    │   ├── route.ts          # GET/POST flowcharts (Next.js API)
    │   └── [id]/
    │       └── route.ts      # GET/PUT/DELETE flowchart (Next.js API)
    │
    └── [other direct routes] # Direct Next.js API routes (override Hono)
```

---

## Features & Pages

### 1. **Dashboard** (`/dashboard`)
- Overview of all workspace data
- Quick actions & shortcuts
- Activity feed
- Widget-based layout
- **Status:** Partial (scaffold UI present, data integration in progress)

### 2. **My Day** (`/my-day`)
- Focused today view
- Quick task capture
- Time tracking widget
- Focus timer
- **Status:** Planned feature (framework exists, logic TBD)

### 3. **Tasks** (`/tasks`)
- Full task list with filters/search
- Kanban board view (potential)
- Task creation & editing
- Subtasks, comments, attachments
- **Detail View:** `/tasks/[id]/focus`
- **Status:** Partial (CRUD working, subtasks/comments need persistence)

### 4. **Ideas** (`/ideas`)
- Idea brainstorming & capture
- Voting system (planned)
- Dependency linking (local only, not persisted)
- Tagging and filtering
- **Status:** Partial (voting endpoint missing, comments/links local-only)

### 5. **Calendar** (`/calendar`)
- Month/week/day event view
- Event creation & editing
- Task linkage to calendar
- Project/location assignment
- **Status:** Partial (demo events shown, persistence needs field mapping)

### 6. **Time Tracking** (`/time`)
- Timer start/stop controls
- Time entry history
- Daily/weekly timesheet view
- Project time allocation
- **Status:** Scaffold (UI present, analytics placeholder)

### 7. **Reports** (`/reports`)
- Time analytics & charts
- Task completion trends
- Team insights
- Export capabilities (planned)
- **Status:** Scaffold (UI present, real data integration pending)

### 8. **Flowcharts** (`/flowcharts`)
- Diagram creation & editing (Three.js / @xyflow/react)
- Node/edge manipulation
- Export & sharing
- **Status:** In progress (CRUD routes exist, full UI implementation pending)

### 9. **Settings** (`/settings`)
- User profile settings
- Workspace settings & team management
- Notification preferences
- OAuth provider setup
- **Status:** Partial (UI present, some fields not persisted)

### 10. **Authentication**
- Login (`/auth/login`) — email/password + OAuth (Google, GitHub, Microsoft)
- Register (`/auth/register`) — account creation
- Password Reset (`/auth/forgot-password`, `/auth/update-password`)
- OAuth Callback (`/auth/callback`) — OAuth redirect handler
- **Status:** Functional (Supabase Auth integrated)

### 11. **Admin** (`/admin`)
- Workspace administration
- User & role management
- Billing & plan settings (planned)
- **Status:** Framework exists (full UI/logic TBD)

### 12. **Profile** (`/profile`)
- User account information
- Avatar & bio management
- Connected apps (OAuth status)
- **Status:** Basic implementation

---

## API Routes

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/auth/login` | Email/password login | ✅ Functional |
| POST | `/api/auth/register` | User registration | ✅ Functional |
| POST | `/api/auth/logout` | Clear session | ✅ Functional |
| POST | `/api/auth/refresh` | Refresh JWT token | ✅ Functional |
| GET | `/api/auth/me` | Get current user | ✅ Functional |

### Workspace Routes (`/api/workspace`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/workspace` | List user's workspaces | ✅ Functional |
| POST | `/api/workspace` | Create new workspace | ✅ Functional |
| GET | `/api/workspace/:id` | Get workspace details | ✅ Functional |
| PUT | `/api/workspace/:id` | Update workspace | ✅ Functional |
| DELETE | `/api/workspace/:id` | Delete workspace | ✅ Functional |
| GET | `/api/workspace/:id/members` | List workspace members | ✅ Functional |
| POST | `/api/workspace/:id/members` | Add member to workspace | ✅ Functional |

### Tasks Routes (`/api/tasks`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/tasks` | List tasks (with filtering) | ✅ Functional |
| POST | `/api/tasks` | Create task | ✅ Functional |
| GET | `/api/tasks/:id` | Get task details | ✅ Functional |
| PUT | `/api/tasks/:id` | Update task | ✅ Functional |
| DELETE | `/api/tasks/:id` | Delete task | ✅ Functional |

### Subtasks Routes (`/api/subtasks`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/subtasks` | List subtasks | ✅ Functional |
| POST | `/api/subtasks` | Create subtask | ✅ Functional |
| PUT | `/api/subtasks/:id` | Update subtask | ✅ Functional |
| DELETE | `/api/subtasks/:id` | Delete subtask | ✅ Functional |

### Ideas Routes (`/api/ideas`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/ideas` | List ideas (with filtering) | ✅ Functional |
| POST | `/api/ideas` | Create idea | ✅ Functional |
| GET | `/api/ideas/:id` | Get idea details | ✅ Functional |
| PUT | `/api/ideas/:id` | Update idea | ✅ Functional |
| DELETE | `/api/ideas/:id` | Delete idea | ✅ Functional |
| POST | `/api/ideas/:id/vote` | Vote on idea | ❌ **MISSING** |
| GET | `/api/ideas/:id/dependencies` | Get idea dependencies | ✅ Functional |

### Time Tracking Routes (`/api/time`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/time/entries` | List time entries | ✅ Functional |
| POST | `/api/time/entries` | Create time entry | ❌ **MISSING** |
| PUT | `/api/time/entries/:id` | Update time entry | ❌ **MISSING** |
| DELETE | `/api/time/entries/:id` | Delete time entry | ❌ **MISSING** |
| POST | `/api/time/timer/start` | Start timer | ✅ Functional |
| POST | `/api/time/timer/stop` | Stop timer | ✅ Functional |
| GET | `/api/time/timesheet` | Get timesheet summary | ✅ Functional |

### Calendar Routes (`/api/calendar`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/calendar/events` | List calendar events | ✅ Functional |
| POST | `/api/calendar/events` | Create event | ✅ Functional |
| GET | `/api/calendar/events/:id` | Get event details | ✅ Functional |
| PUT | `/api/calendar/events/:id` | Update event | ✅ Functional (fields incomplete) |
| DELETE | `/api/calendar/events/:id` | Delete event | ✅ Functional |

### Comments Routes (`/api/comments`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/comments` | List comments (filtered by parent) | ✅ Functional |
| POST | `/api/comments` | Create comment | ✅ Functional |
| PUT | `/api/comments/:id` | Update comment | ✅ Functional |
| DELETE | `/api/comments/:id` | Delete comment | ✅ Functional |

### Attachments Routes (`/api/attachments`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/attachments` | List attachments (filtered) | ✅ Functional |
| POST | `/api/attachments` | Upload attachment | ✅ Functional |
| DELETE | `/api/attachments/:id` | Delete attachment | ✅ Functional |

### Flowcharts Routes (`/api/flowcharts`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/flowcharts` | List flowcharts | ✅ Functional |
| POST | `/api/flowcharts` | Create flowchart | ✅ Functional |
| GET | `/api/flowcharts/:id` | Get flowchart details | ✅ Functional |
| PUT | `/api/flowcharts/:id` | Update flowchart | ✅ Functional |
| DELETE | `/api/flowcharts/:id` | Delete flowchart | ✅ Functional |

### Health Check Routes
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/health` | API liveness check | ✅ Functional |
| GET | `/api/health/db` | Database connectivity check | ✅ Functional |

### Other Routes
- **Reports:** `/api/reports` — Analytics data aggregation (scaffold)
- **Projects:** `/api/projects` — Project CRUD (framework)
- **Tags:** `/api/tags` — Tag management (framework)
- **Settings:** `/api/settings` — User/workspace settings (framework)

---

## Database

### Schema Overview (Drizzle ORM)

The database is managed via Drizzle ORM with PostgreSQL as the underlying database (Supabase).

**Core Tables:**

1. **`users`** — Supabase Auth users
   - Managed via Supabase Auth
   - Synced from `auth.users` via trigger

2. **`profiles`** — Extended user data
   - `id`, `user_id`, `display_name`, `avatar_url`, `bio`, `created_at`, `updated_at`

3. **`workspaces`** — Workspace isolation
   - `id`, `name`, `slug`, `description`, `owner_id`, `created_at`, `updated_at`

4. **`workspace_members`** — Workspace access control
   - `id`, `workspace_id`, `user_id`, `role`, `joined_at`

5. **`tasks`** — Main task records
   - `id`, `workspace_id`, `title`, `description`, `status`, `priority`, `assigned_to`, `due_date`, `project_id`, `created_by`, `created_at`, `updated_at`

6. **`subtasks`** — Task breakdown
   - `id`, `task_id`, `title`, `completed`, `created_by`, `created_at`, `updated_at`

7. **`ideas`** — Brainstorming & feature requests
   - `id`, `workspace_id`, `title`, `description`, `status`, `votes`, `created_by`, `created_at`, `updated_at`

8. **`calendar_events`** — Calendar entries
   - `id`, `workspace_id`, `title`, `description`, `start_time`, `end_time`, `kind`, `project_id`, `location`, `task_id`, `created_by`, `created_at`, `updated_at`

9. **`time_entries`** — Time tracking records
   - `id`, `workspace_id`, `task_id`, `user_id`, `duration_minutes`, `date`, `notes`, `created_at`, `updated_at`

10. **`projects`** — Project grouping
    - `id`, `workspace_id`, `name`, `description`, `status`, `created_by`, `created_at`, `updated_at`

11. **`tags`** — Tagging system
    - `id`, `workspace_id`, `name`, `color`, `created_at`, `updated_at`

12. **`comments`** — Comment threads
    - `id`, `parent_id`, `parent_type`, `content`, `created_by`, `created_at`, `updated_at`

13. **`attachments`** — File attachments
    - `id`, `parent_id`, `parent_type`, `file_url`, `file_name`, `uploaded_by`, `created_at`

14. **`flowcharts`** — Diagram/flowchart storage
    - `id`, `workspace_id`, `name`, `data` (JSON), `created_by`, `created_at`, `updated_at`

### Database Configuration

**Drizzle Config** (`drizzle.config.ts`):
- Schema location: `src/db/schema.ts`
- Dialect: PostgreSQL
- Database URL: Environment variable `DATABASE_URL`
- Output: `./drizzle/` (migrations folder)

**Database URL Format:**
```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

### Migrations

Migrations are managed via Drizzle Kit:
```bash
npm run db:generate  # Generate migration SQL from schema
npm run db:push     # Apply pending migrations to database
```

---

## Environment Setup

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Supabase Public Keys (used by browser)
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase Server Keys (backend only)
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database Connection
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Frontend URL (browser sees)
APP_URL=http://localhost:3000              # Backend URL (for OAuth redirects)
API_URL=http://localhost:8787              # Backend API URL (frontend uses)

# Optional: Auth Bypass (dev only)
ORBIT_DISABLE_AUTH=false                    # Disable server-side auth check
NEXT_PUBLIC_ORBIT_DISABLE_AUTH=false        # Disable client-side auth check

# Optional: Workspace Default
NEXT_PUBLIC_DEFAULT_WORKSPACE_ID=           # If set, use this workspace; else resolve from API
```

### Important Notes

- **SECRETS IN `.env.example`:** The `.env.example` file contains actual Supabase credentials for development. **Do not commit this to production repositories.**
- **DATABASE_URL Format:** Must be a connection URL string without `DATABASE_URL=` prefix or quotes:
  - ✅ Correct: `postgresql://postgres:user%40password@db.xyz.supabase.co:5432/postgres`
  - ❌ Wrong: `"postgresql://..."` or `DATABASE_URL=postgresql://...`
- **URL Encoding:** If password contains special characters, URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `?` → `%3F`
  - `/` → `%2F`

---

## Development

### Installation

```bash
# Install dependencies
npm install

# Verify TypeScript compilation
npm run typecheck

# Verify linting
npm run lint

# Build for production (next build)
npm run build
```

### Running Locally

```bash
# Start both frontend (port 3000) and backend (port 8787) concurrently
npm run dev

# OR run individually
npm run dev:web     # Frontend only: http://localhost:3000
npm run dev:api     # Backend only: http://localhost:8787
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start frontend + backend concurrently (development) |
| `npm run dev:web` | Start Next.js dev server only |
| `npm run dev:api` | Start Hono backend only |
| `npm run build` | Build Next.js production bundle |
| `npm run build:desktop` | Build Electron desktop version |
| `npm run start` | Run production Next.js server |
| `npm run typecheck` | Check TypeScript compilation (no emit) |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migration SQL |
| `npm run db:push` | Apply Drizzle migrations to database |

### Database Setup

1. **Create Supabase Project:** Go to [supabase.com](https://supabase.com)
2. **Run Canonical Setup SQL:**
   - In Supabase Dashboard → SQL Editor
   - Run: `scripts/supabase/orbit_canonical_setup.sql`
   - This creates tables, triggers, and seeds starter data
3. **Generate Migrations:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

### OAuth Setup (Supabase)

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable:
   - ✅ Google (get from Google Cloud Console)
   - ✅ GitHub (get from GitHub Developer Settings)
   - ✅ Microsoft (provider key: `azure`, get from Azure AD)
3. Add OAuth Redirect URLs for each provider:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://your-domain.com/auth/callback` (production)

### Code Quality

```bash
# Run all checks
npm run typecheck && npm run lint && npm run build

# Format & fix with ESLint
npx eslint . --fix
```

---

## Git History

**Current Branch:** `main`  
**Last 10 Commits:**

```
40f4295  24/04        # Most recent changes
8e495d1  24/04
bb18bf2  24/04
389f4fa  Update .env.example
b693e17  23/04
2ee954c  23/04
ed747d1  23/04
f228637  22/03
5cecb72  22/04
b8a9ac3  22/04
```

**Key Observations:**
- Frequent commits on April 24, 2026 (today)
- `.env.example` updated recently (credentials exposed in version control)
- Consistent development activity (multiple commits per day)
- No tag-based releases yet (pre-launch)

---

## Current State & Known Gaps

### ✅ What's Working

- **Authentication:** Email/password, OAuth (Google, GitHub, Microsoft)
- **Workspace Management:** CRUD for workspaces, member invites, roles
- **Tasks:** Create, read, update, delete tasks with basic properties
- **Ideas:** Create, read, update, delete ideas
- **Calendar Events:** Create, read events (some fields not persisted)
- **Time Tracking:** Timer start/stop, entry history reads
- **Comments & Attachments:** CRUD operations functional
- **Flowcharts:** CRUD routes exist, basic UI
- **Database:** PostgreSQL schema, Drizzle ORM, migrations working
- **Frontend UI:** Dark theme, responsive layout, component library functional
- **Build & Deployment:** Next.js and Hono fully integrated, Vercel-ready

### ❌ Known Gaps & Incomplete Features

#### **Frontend Issues**

1. **Ideas Voting:** Frontend attempts to vote via `POST /api/ideas/:id/vote`, but endpoint doesn't exist
2. **Time Entry CRUD:** Frontend time entry create/update/delete target missing backend endpoints
3. **Time & Reports:** Pages show placeholder/scaffold UI; real data integration pending
4. **Rich Text Editor:** TipTap component exists but not wired to persistence
5. **Idea Comments & Dependency Links:** Local state only (not persisted to database)
6. **Task Subtasks/Comments:** Scaffold UI; persistence incomplete
7. **Calendar Field Persistence:** Create/edit flows don't save `kind`, `project`, `location`, `task_id` correctly
8. **Task vs Idea Detail Routes:** Route strategy inconsistent between detail pages
9. **Error Handling:** No standardized user-facing error handling across mutations

#### **Backend Issues**

1. **Missing Endpoints:**
   - `POST /api/ideas/:id/vote` (ideas voting endpoint)
   - `POST /api/time/entries` (create time entry)
   - `PUT /api/time/entries/:id` (update time entry)
   - `DELETE /api/time/entries/:id` (delete time entry)

2. **Incomplete Features:**
   - Reports analytics aggregation (scaffold only)
   - Flowchart diagram data persistence (partial)
   - Settings persistence (some fields TBD)

### 📊 Feature Completion Matrix

| Feature | Frontend | Backend | DB | Status |
|---------|----------|---------|-----|--------|
| Authentication | ✅ | ✅ | ✅ | Functional |
| Workspaces | ✅ | ✅ | ✅ | Functional |
| Tasks (basic CRUD) | ✅ | ✅ | ✅ | Functional |
| Subtasks | ⚠️ | ⚠️ | ✅ | Partial |
| Task Comments | ⚠️ | ⚠️ | ✅ | Partial |
| Ideas | ✅ | ✅ | ✅ | Functional |
| Idea Voting | ❌ | ❌ | ✅ | Missing |
| Idea Comments | ⚠️ | ✅ | ✅ | Local-only |
| Calendar | ⚠️ | ⚠️ | ⚠️ | Partial |
| Time Tracking | ⚠️ | ⚠️ | ✅ | Partial |
| Time Entry CRUD | ❌ | ❌ | ✅ | Missing |
| Reports/Analytics | ❌ | ⚠️ | ✅ | Scaffold |
| Flowcharts | ⚠️ | ✅ | ✅ | In Progress |
| Settings | ⚠️ | ⚠️ | ⚠️ | Partial |

---

## Launch Blockers

Items that **must be completed before V1 release:**

- [ ] Implement `POST /api/ideas/:id/vote` endpoint
- [ ] Implement time entry CRUD endpoints (`POST`, `PUT`, `DELETE /api/time/entries`)
- [ ] Replace time & reports scaffold UI with real data-backed components
- [ ] Persist idea comments, dependency links, and editing workflows to backend
- [ ] Persist task subtasks, comments, and attachments in detail UX
- [ ] Complete calendar event persistence (all fields: `kind`, `project`, `location`, `task_id`)
- [ ] Align task/idea detail route strategy and update documentation
- [ ] Implement standardized user-facing error handling (validation, mutations, recovery UX)
- [ ] All API/frontend contracts must match exactly

---

## Production Hardening

Items that **must be completed before scaling:**

- [ ] **Testing:** Unit, API integration, and E2E tests for critical journeys
- [ ] **CI/CD:** Enforce lint/typecheck/test/build on pull requests
- [ ] **Observability:** Structured logging, error tracking, request tracing, alerting
- [ ] **Security:** Auth rate limiting, authorization regression tests, secret validation
- [ ] **Performance:** Define budgets for heavy screens (tasks, calendar, reports, flowcharts)
- [ ] **Accessibility:** Keyboard navigation, focus states, ARIA labels, contrast, screen reader support
- [ ] **Documentation:** API reference, troubleshooting guide, release & runbook procedures
- [ ] **Backup/DR:** Validate backup and tested restore procedures
- [ ] **QA:** Cross-browser and mobile responsiveness validation

---

## Deployment

### Vercel Deployment

1. **Import Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → "Import Git Repo"
   - Select this repository

2. **Framework:** Next.js (auto-detected)

3. **Environment Variables:**
   Set all variables from `.env.example` in Vercel project settings:
   - Scope: Production, Preview, Development
   - Include: All Supabase keys, DATABASE_URL, APP_URL, API_URL, etc.

4. **Production-Specific Settings:**
   - `DATABASE_URL`: Use your production Supabase connection URL
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g., `https://orbit.company.com`)
   - `APP_URL`: Same as above
   - `SUPABASE_*`: Use production Supabase project keys
   - `ORBIT_DISABLE_AUTH`: **Must be `false`** in production
   - `NEXT_PUBLIC_ORBIT_DISABLE_AUTH`: **Must be `false`** in production

5. **Deploy:**
   - Click "Deploy"
   - Vercel builds Next.js, bundles Hono backend into `/api` serverless handlers
   - Database pooling via Supabase connection

### Health Checks

**API is ready when:**
- `GET /health` returns `200 OK` (basic liveness)
- `GET /api/health/db` returns `200 OK` (database connectivity verified)

### Production Architecture

```
Vercel Serverless
├── Next.js 15 Frontend (Deployed)
│   ├── /app/* → Routes
│   ├── /api/[[...route]].ts → Hono handler
│   └── Static assets → CDN
│
├── Hono Backend (Serverless handlers)
│   ├── /api/auth → Auth routes
│   ├── /api/tasks → Task routes
│   ├── /api/ideas → Idea routes
│   └── [all backend routes]
│
└── Supabase PostgreSQL
    └── Connection pooling via DATABASE_URL
```

---

## File Manifest

### Root Configuration Files
- `package.json` — Project metadata, dependencies, scripts
- `package-lock.json` — Locked dependency versions
- `tsconfig.json` — Frontend TypeScript configuration
- `tsconfig.api.json` — Backend TypeScript configuration
- `next.config.ts` — Next.js configuration (rewrites, export, etc.)
- `postcss.config.mjs` — Tailwind CSS PostCSS pipeline
- `drizzle.config.ts` — Drizzle ORM configuration
- `vercel.json` — Vercel deployment config
- `.eslintrc.json` — ESLint rules
- `.gitignore` — Git ignore patterns
- `.env.example` — Environment variables template (**contains secrets**)

### Frontend Structure
- `app/` — Next.js App Router (pages, layouts, routes)
- `components/` — React components (UI, features, layout)
- `hooks/` — Custom React hooks
- `lib/` — Utilities, Supabase client, helpers

### Backend Structure
- `src/index.ts` — Hono app entry point
- `src/routes/` — API route handlers
- `src/controllers/` — Business logic
- `src/middleware/` — Auth, workspace validation
- `src/db/` — Schema, initialization
- `src/lib/` — Helper functions
- `src/types/` — TypeScript types

### Documentation
- `README.md` — Original project README
- `PROJECT_OVERVIEW.md` — This file (comprehensive overview)
- `docs/supabase-auth-setup.md` — Detailed Supabase setup guide
- `scripts/supabase/orbit_canonical_setup.sql` — Database initialization SQL

---

## Summary

**Orbit** is a nearly-complete productivity platform in active development. The core infrastructure (authentication, database, API routes, UI components) is solid. The main work remaining focuses on:

1. **API Parity:** 3-4 missing endpoints (ideas voting, time entry CRUD)
2. **Data Persistence:** Wiring frontend components to backend flows
3. **UX Reliability:** Standardized error handling & validation
4. **Production Readiness:** Tests, CI/CD, observability, security hardening

With focused effort on the launch blockers over 1-2 weeks, followed by production hardening, Orbit can reach **V1 production release within 3-4 weeks.**

---

**Last Generated:** 2026-04-24  
**Project Maintainer:** Mr-IR0k-oo1
