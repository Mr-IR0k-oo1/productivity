"use client";

import { formatDistanceToNow, isPast, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { CheckSquare } from "lucide-react";


import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TableSkeletonRow } from "@/components/ui/skeleton";
import { useTasksQuery } from "@/hooks/useTasks";

type QuickTask = {
  id: string;
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueLabel: string;
};

function mapPriority(priority: number | null | undefined): QuickTask["priority"] {
  if (priority === 1) return "high";
  if (priority === 2) return "medium";
  if (priority === 3) return "low";
  return "medium";
}

function toDueLabel(dueDate: string | null): string {
  if (!dueDate) {
    return "No due date";
  }

  const parsed = parseISO(dueDate);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid due date";
  }

  const relative = formatDistanceToNow(parsed, { addSuffix: true });
  return isPast(parsed) ? `Overdue ${relative}` : relative;
}

function priorityClasses(priority: QuickTask["priority"]) {
  if (priority === "urgent") return "border-rose-900 bg-rose-950/60 text-rose-300";
  if (priority === "high") return "border-amber-900 bg-amber-950/60 text-amber-300";
  if (priority === "medium") return "border-emerald-900 bg-emerald-950/60 text-emerald-300";
  return "border-zinc-800 bg-zinc-900 text-zinc-300";
}

export function QuickTasksList() {
  const tasksQuery = useTasksQuery();

  const tasks = useMemo<QuickTask[]>(() => {
    const pending = (tasksQuery.data ?? []).filter((task) => task.status !== "done");

    const sorted = pending.sort((left, right) => {
      const leftPriority = left.priority ?? 2;
      const rightPriority = right.priority ?? 2;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

      return leftDue - rightDue;
    });

    return sorted.slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      priority: mapPriority(task.priority),
      dueLabel: toDueLabel(task.dueDate),
    }));
  }, [tasksQuery.data]);

  return (
    <div className="orbit-card overflow-hidden">
      <div className="border-b border-[color:var(--card-border)] px-5 py-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Quick Tasks</h3>
        <p className="mt-0.5 text-xs text-[var(--muted)]">Your immediate priorities</p>
      </div>
      <div className="p-5">
        {tasksQuery.error ? (
          <ErrorState
            title="Tasks Failed"
            message={tasksQuery.error instanceof Error ? tasksQuery.error.message : "Failed to load tasks"}
            onRetry={() => {
              void tasksQuery.refetch();
            }}
            minHeight="min-h-[200px]"
          />
        ) : tasksQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <TableSkeletonRow key={i} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title="No tasks assigned"
            description="Create a new task or assign one to get started"
            action={{
              label: "Create Task",
              onClick: () => (window.location.href = "/tasks"),
            }}
            minHeight="min-h-[200px]"
          />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 py-2.5 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                    aria-label={task.title}
                  />
                  <p className="text-sm text-[var(--foreground)]">
                    {task.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${priorityClasses(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {task.dueLabel}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-1">
              <Link
                href="/tasks"
                className="text-sm font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
              >
                View all tasks
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

