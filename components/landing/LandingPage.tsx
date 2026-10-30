import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  Bug,
  CheckSquare,
  Clock,
  KanbanSquare,
  Lightbulb,
  ListTodo,
  Workflow,
  Zap,
} from "lucide-react";

import { OrbitMark } from "@/components/brand/OrbitMark";

const sprintIssues = [
  { key: "ORB-41", title: "Checkout fails on Safari 18", type: "bug", status: "In progress", points: 3 },
  { key: "ORB-38", title: "Invite teammates by email", type: "story", status: "In review", points: 5 },
  { key: "ORB-36", title: "Usage export for finance", type: "story", status: "Done", points: 8 },
  { key: "ORB-35", title: "Rotate API keys from settings", type: "task", status: "To do", points: 2 },
  { key: "ORB-33", title: "Onboarding checklist copy", type: "task", status: "Done", points: 1 },
] as const;

const typeIcon = { bug: Bug, story: Bookmark, task: CheckSquare } as const;
const typeColor = { bug: "text-red-500", story: "text-emerald-600", task: "text-sky-600" } as const;

const features = [
  { icon: ListTodo, title: "Backlog and sprints", body: "Rank the backlog, plan a sprint, start it, and carry unfinished work into the next one." },
  { icon: KanbanSquare, title: "Board", body: "Drag issues across To do, In progress, In review and Done. Everyone sees the same board." },
  { icon: Zap, title: "Epics and story points", body: "Group work under epics, estimate in points, and watch each epic fill up as issues close." },
  { icon: BarChart3, title: "Burndown and velocity", body: "See whether the sprint will land, and how much your team really finishes per sprint." },
  { icon: Lightbulb, title: "Ideas that become issues", body: "Collect ideas, vote on them, and convert the good ones into issues with one click." },
  { icon: Workflow, title: "Flowcharts", body: "Sketch flows and architecture next to the work, and link diagram nodes to issues." },
  { icon: Clock, title: "Time tracking", body: "Run a timer on an issue or log hours after the fact. Reports add it all up." },
];

const roles = ["Owner", "Admin", "Member", "Viewer"] as const;
const permissions: Array<{ label: string; allowed: Record<(typeof roles)[number], boolean> }> = [
  { label: "See issues, boards and reports", allowed: { Owner: true, Admin: true, Member: true, Viewer: true } },
  { label: "Create and edit issues", allowed: { Owner: true, Admin: true, Member: true, Viewer: false } },
  { label: "Delete other people's issues", allowed: { Owner: true, Admin: true, Member: false, Viewer: false } },
  { label: "Plan, start and complete sprints", allowed: { Owner: true, Admin: true, Member: false, Viewer: false } },
  { label: "Invite people and change roles", allowed: { Owner: true, Admin: true, Member: false, Viewer: false } },
  { label: "Delete the workspace", allowed: { Owner: true, Admin: false, Member: false, Viewer: false } },
];

const signInOptions = ["GitHub", "Google", "Microsoft", "Apple", "GitLab", "Email and password"];

function SprintPreview() {
  const done = sprintIssues.filter((issue) => issue.status === "Done").reduce((sum, issue) => sum + issue.points, 0);
  const total = sprintIssues.reduce((sum, issue) => sum + issue.points, 0);

  return (
    <figure className="overflow-hidden rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] shadow-[var(--shadow-popover)]">
      <figcaption className="sr-only">An example sprint in Orbit</figcaption>
      <div className="flex items-center gap-3 border-b border-[var(--color-border-secondary)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Sprint 14</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Ship self-serve billing</p>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {done} of {total} points
        </p>
      </div>
      <div className="h-1 bg-[var(--color-surface-hover)]">
        <div className="h-full bg-[var(--color-accent)]" style={{ width: `${Math.round((done / total) * 100)}%` }} />
      </div>
      <svg viewBox="0 0 320 72" className="block h-20 w-full px-4 pt-3" aria-hidden="true">
        <line x1="0" y1="6" x2="320" y2="66" stroke="var(--color-border-tertiary)" strokeDasharray="4 4" />
        <polyline
          points="0,6 46,6 46,18 92,18 138,18 138,34 184,34 184,40 230,40"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
        />
      </svg>
      <ul className="divide-y divide-[var(--color-border-secondary)]">
        {sprintIssues.map((issue) => {
          const Icon = typeIcon[issue.type];
          return (
            <li key={issue.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Icon className={`h-4 w-4 shrink-0 ${typeColor[issue.type]}`} aria-hidden="true" />
              <span className="w-14 shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">{issue.key}</span>
              <span
                className={`min-w-0 flex-1 truncate ${
                  issue.status === "Done" ? "text-[var(--color-text-tertiary)] line-through" : "text-[var(--color-text-primary)]"
                }`}
              >
                {issue.title}
              </span>
              <span className="hidden w-20 text-xs text-[var(--color-text-secondary)] sm:inline">{issue.status}</span>
              <span className="flex h-6 w-7 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-primary)]">
                {issue.points}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <header className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <OrbitMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight">Orbit</span>
        </Link>
        <nav aria-label="Page sections" className="hidden flex-1 gap-6 text-sm text-[var(--color-text-secondary)] md:flex">
          <a href="#features" className="hover:text-[var(--color-text-primary)]">Features</a>
          <a href="#access" className="hover:text-[var(--color-text-primary)]">Roles</a>
          <a href="#self-hosting" className="hover:text-[var(--color-text-primary)]">Self-hosting</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] hover:bg-[var(--color-accent-strong)]"
          >
            Open Orbit
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
          <div>
            <h1 className="max-w-[16ch] text-[clamp(2.4rem,5.2vw,3.9rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Issue tracking your team will keep up to date.
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Orbit gives startups and growing companies sprints, a backlog, a board, ideas and flowcharts in one fast app. You
              host it, your data stays with you, and people sign in with the accounts they already use.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-md bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-on-accent)] hover:bg-[var(--color-accent-strong)]"
              >
                Create your workspace
              </Link>
              <a
                href="#self-hosting"
                className="rounded-md border border-[var(--color-border-tertiary)] px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              >
                How to run it
              </a>
            </div>
          </div>
          <SprintPreview />
        </section>

        <section id="features" className="border-t border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <h2 className="max-w-[24ch] text-3xl font-semibold tracking-[-0.02em]">Everything a product team plans with, in one place</h2>
            <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <dt className="flex items-center gap-2.5 font-semibold">
                    <Icon className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
                    {title}
                  </dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="access" className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.02em]">Clear roles, enforced on the server</h2>
              <p className="mt-4 max-w-[46ch] leading-relaxed text-[var(--color-text-secondary)]">
                Give contractors read-only access, let your team do the work, and keep sprint planning and member
                management with the people who run the project. Invite someone by email and they join the moment they sign up.
              </p>
              <p className="mt-6 text-sm text-[var(--color-text-secondary)]">Sign in with {signInOptions.join(", ")}.</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
              <table className="w-full min-w-[480px] text-sm">
                <caption className="sr-only">What each role can do</caption>
                <thead>
                  <tr className="border-b border-[var(--color-border-secondary)] text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                      Permission
                    </th>
                    {roles.map((role) => (
                      <th key={role} scope="col" className="px-3 py-3 text-center font-semibold">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-secondary)]">
                  {permissions.map((permission) => (
                    <tr key={permission.label}>
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        {permission.label}
                      </th>
                      {roles.map((role) => (
                        <td key={role} className="px-3 py-3 text-center">
                          {permission.allowed[role] ? (
                            <span className="text-[var(--color-accent)]" aria-label="Allowed">✓</span>
                          ) : (
                            <span className="text-[var(--color-text-tertiary)]" aria-label="Not allowed">–</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="self-hosting" className="border-t border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.02em]">Runs on your own machine</h2>
              <p className="mt-4 max-w-[46ch] leading-relaxed text-[var(--color-text-secondary)]">
                Orbit ships with a built-in database, so a laptop or a small server is enough to start. When you outgrow it,
                point it at your own Postgres. No third-party services, no data leaving your network.
              </p>
              <ul className="mt-6 space-y-2 text-[15px] text-[var(--color-text-secondary)]">
                <li>One person can use it without accounts at all.</li>
                <li>Set one secret to turn on sign-in for the whole team.</li>
                <li>Add GitHub, Google, Microsoft, Apple or GitLab sign-in with their client keys.</li>
              </ul>
            </div>
            <pre className="self-start overflow-x-auto rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-background)] p-5 font-mono text-[13px] leading-7 text-[var(--color-text-primary)]">
              <code>
                <span className="text-[var(--color-text-tertiary)]"># install and start</span>
                {"\n"}npm install
                {"\n"}npm run build
                {"\n"}npm start
                {"\n\n"}
                <span className="text-[var(--color-text-tertiary)]"># optional: turn on team sign-in</span>
                {"\n"}BETTER_AUTH_SECRET=&lt;32+ random characters&gt;
              </code>
            </pre>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <div className="flex flex-col items-start gap-6 rounded-xl bg-[var(--color-accent)] px-8 py-10 text-[var(--color-on-accent)] sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">Set up your workspace in a few minutes</h2>
              <p className="mt-2 opacity-80">Import nothing, configure nothing. Create a sprint and start working.</p>
            </div>
            <Link href="/register" className="rounded-md bg-[var(--color-on-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-accent)] hover:opacity-90">
              Create your workspace
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border-secondary)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-8 text-sm text-[var(--color-text-secondary)] sm:px-8">
          <span className="flex items-center gap-2">
            <OrbitMark className="h-5 w-5 rounded" />
            Orbit
          </span>
          <span className="ml-auto">Self-hosted work management for startups and companies.</span>
        </div>
      </footer>
    </div>
  );
}
