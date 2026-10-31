"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Flame, Plus } from "lucide-react";

import { summarizeDay } from "@/components/dashboard/summary";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useProfileQuery } from "@/hooks/useProfile";
import { useSprintsQuery } from "@/hooks/useSprints";
import { useTasksQuery } from "@/hooks/useTasks";

/** Greeting and date depend on the viewer's clock, so they render after mount to avoid hydration mismatches. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

function greetingFor(hour: number) {
  if (hour >= 17) return "Good evening";
  if (hour >= 12) return "Good afternoon";
  return "Good morning";
}

export function DashboardHeader() {
  const now = useNow();
  const { userId } = useSessionContext();
  const profile = useProfileQuery().data;
  const tasks = useTasksQuery().data;
  const sprints = useSprintsQuery().data;
  const firstName = profile?.fullName?.trim().split(/\s+/)[0];

  const summary = useMemo(
    () => (now && tasks && sprints ? summarizeDay(tasks, sprints, userId, now) : null),
    [now, tasks, sprints, userId],
  );

  const greeting = now ? greetingFor(now.getHours()) : "Welcome back";

  const activeSprint = useMemo(
    () => sprints?.find((s) => s.status === "active"),
    [sprints],
  );

  const highPriorityCount = useMemo(
    () => tasks?.filter((t) => t.status !== "done" && (t.priority === 1 || (t.priority as unknown) === "High")).length ?? 0,
    [tasks],
  );

  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] shadow-2xs" suppressHydrationWarning>
            <CalendarDays className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            {now ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Today"}
          </span>

          {activeSprint ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
              {activeSprint.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Workspace ready
            </span>
          )}

          {highPriorityCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              {highPriorityCount} high priority
            </span>
          )}
        </div>

        <h1 className="font-display text-[clamp(1.85rem,3.4vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--color-text-primary)]">
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>

        <p className="min-h-6 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
          {summary || "Here is the current flight trajectory for your sprint, tasks, and daily focus."}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <Link
          href="/tasks"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text-primary)] shadow-2xs transition-all hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)]"
        >
          <Plus className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          <span>New issue</span>
        </Link>

        <Link
          href="/my-day"
          className="group inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-4 text-xs font-semibold text-white shadow-xs transition-all hover:shadow-[0_4px_16px_rgba(84,66,245,0.3)] active:scale-[0.98]"
        >
          <span>Plan my day</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
