"use client";

import { useMemo } from "react";
import { StatCard } from "@/components/common/StatCard";
import { ErrorState } from "@/components/ui/error-state";
import { GridSkeleton } from "@/components/ui/skeleton";
import { useIdeasQuery } from "@/hooks/useIdeas";
import { useTasksQuery } from "@/hooks/useTasks";
import { useTimeEntriesQuery } from "@/hooks/useTimeEntries";

interface Stat {
  title: string;
  value: string;
  trend: string;
  positive?: boolean;
}

export function DashboardStats() {
  const tasksQuery = useTasksQuery();
  const ideasQuery = useIdeasQuery();
  const timeEntriesQuery = useTimeEntriesQuery();

  const loading = tasksQuery.isLoading || ideasQuery.isLoading || timeEntriesQuery.isLoading;

  const error = tasksQuery.error ?? ideasQuery.error ?? timeEntriesQuery.error;

  const stats = useMemo<Stat[]>(() => {
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
        trend: `${completedTasks} completed`,
      },
      {
        title: "Active Ideas",
        value: String(activeIdeas),
        trend: `${ideas.length} total ideas`,
      },
      {
        title: "Hours Tracked",
        value: `${totalHours.toFixed(1)}h`,
        trend: `${timeEntries.length} time entries`,
      },
      {
        title: "Completion Rate",
        value: `${completionRate}%`,
        trend: completionRate >= 60 ? "Healthy execution pace" : "Room to improve",
        positive: completionRate >= 60,
      },
    ];
  }, [ideasQuery.data, tasksQuery.data, timeEntriesQuery.data]);

  if (loading) {
    return <GridSkeleton count={4} />;
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
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          trend={stat.trend}
          positive={stat.positive}
        />
      ))}
    </section>
  );
}

