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
  accentColor: string;
  glowColor: string;
}

function StatCardSkeleton() {
  return (
    <div className="orbit-card p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-20 rounded bg-zinc-800" />
        <div className="h-8 w-16 rounded bg-zinc-800" />
        <div className="h-3 w-24 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon;

  return (
    <div className="orbit-card group relative overflow-hidden p-5">
      {/* Subtle top accent line */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px] opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${stat.accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{stat.title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] animate-count-up">
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{stat.subtitle}</p>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
          style={{ backgroundColor: stat.glowColor }}
        >
          <Icon className="h-5 w-5" style={{ color: stat.accentColor }} />
        </div>
      </div>
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
        title: "Total Tasks",
        value: String(tasks.length),
        subtitle: `${completedTasks} completed`,
        icon: CheckSquare,
        accentColor: "#3b82f6",
        glowColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        title: "Active Ideas",
        value: String(activeIdeas),
        subtitle: `${ideas.length} total ideas`,
        icon: Lightbulb,
        accentColor: "#f59e0b",
        glowColor: "rgba(245, 158, 11, 0.1)",
      },
      {
        title: "Hours Tracked",
        value: `${totalHours.toFixed(1)}h`,
        subtitle: `${timeEntries.length} entries`,
        icon: Clock,
        accentColor: "#22c55e",
        glowColor: "rgba(34, 197, 94, 0.1)",
      },
      {
        title: "Completion Rate",
        value: `${completionRate}%`,
        subtitle: completionRate >= 60 ? "Healthy pace" : "Room to improve",
        icon: TrendingUp,
        accentColor: "#8b5cf6",
        glowColor: "rgba(139, 92, 246, 0.1)",
      },
    ];
  }, [ideasQuery.data, tasksQuery.data, timeEntriesQuery.data]);

  if (loading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    <section className="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} stat={stat} />
      ))}
    </section>
  );
}
