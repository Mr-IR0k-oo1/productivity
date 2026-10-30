"use client";

import { useMemo } from "react";
import {
  CheckSquare,
  Lightbulb,
  Clock,
  TrendingUp,
} from "lucide-react";


import { ErrorState } from "@/components/ui/error-state";
import { useIdeasQuery } from "@/hooks/useIdeas";
import { useTasksQuery } from "@/hooks/useTasks";
import { useTimeEntriesQuery } from "@/hooks/useTimeEntries";

interface StatCardData {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-5">
      <div className="h-3 w-20 rounded bg-zinc-800" />
      <div className="h-7 w-14 rounded bg-zinc-800" />
    </div>
  );
}

function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon;

  return (
    <div className="p-5">
      <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {stat.title}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">{stat.value}</p>
      <p className="mt-0.5 text-xs text-[var(--muted)]">{stat.subtitle}</p>
    </div>
  );
}

export function DashboardStats() {
  const tasksQuery = useTasksQuery();
  const ideasQuery = useIdeasQuery();
  const timeEntriesQuery = useTimeEntriesQuery();

  const loading = tasksQuery.isLoading || ideasQuery.isLoading || timeEntriesQuery.isLoading;

  const error = tasksQuery.error ?? ideasQuery.error ?? timeEntriesQuery.error;

  const stats = useMemo<StatCardData[]>(() => {
    const tasks = tasksQuery.data ?? [];
    const ideas = ideasQuery.data ?? [];
    const timeEntries = timeEntriesQuery.data ?? [];

    const completedTasks = tasks.filter((task) => task.status === "done").length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const activeIdeas = ideas.filter((idea) => idea.status !== "archived" && idea.status !== "converted").length;

    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0) / 60;

    return [
      {
        title: "Issues",
        value: String(tasks.length),
        subtitle: `${completedTasks} completed`,
        icon: CheckSquare,
      },
      {
        title: "Active ideas",
        value: String(activeIdeas),
        subtitle: `${ideas.length} total ideas`,
        icon: Lightbulb,
      },
      {
        title: "Hours logged",
        value: `${totalHours.toFixed(1)}h`,
        subtitle: `${timeEntries.length} entries`,
        icon: Clock,
      },
      {
        title: "Completion",
        value: `${completionRate}%`,
        subtitle: `${completedTasks} of ${tasks.length} issues done`,
        icon: TrendingUp,
      },
    ];
  }, [ideasQuery.data, tasksQuery.data, timeEntriesQuery.data]);

  if (loading) {
    return (
      <section className="orbit-card grid divide-y divide-[var(--color-border-secondary)] sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Statistics Failed"
        message={error instanceof Error ? error.message : "Failed to load statistics"}
        onRetry={() => {
          void Promise.all([tasksQuery.refetch(), ideasQuery.refetch(), timeEntriesQuery.refetch()]);
        }}
        minHeight="min-h-[200px]"
      />
    );
  }

  return (
    <section className="orbit-card grid divide-y divide-[var(--color-border-secondary)] sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x" aria-label="Workspace summary">
      {stats.map((stat) => (
        <StatCard key={stat.title} stat={stat} />
      ))}
    </section>
  );
}
