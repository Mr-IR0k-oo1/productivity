"use client";

import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { useMemo } from "react";
import { Activity, CircleDot, Lightbulb, Timer } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { useIdeasQuery } from "@/hooks/useIdeas";
import { useTasksQuery } from "@/hooks/useTasks";
import { useTimeEntriesQuery } from "@/hooks/useTimeEntries";
import { cn } from "@/lib/utils";

type ActivityKind = "issue" | "idea" | "time";

const ICONS = { issue: CircleDot, idea: Lightbulb, time: Timer } as const;

const KIND_STYLES: Record<ActivityKind, { bg: string; text: string }> = {
  issue: { bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-500 dark:text-indigo-400" },
  idea: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-500 dark:text-amber-400" },
  time: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-500 dark:text-emerald-400" },
};

function ago(value: string) {
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? "just now" : `${formatDistanceToNowStrict(parsed)} ago`;
}

export function ActivityFeed() {
  const tasksQuery = useTasksQuery();
  const ideasQuery = useIdeasQuery();
  const timeEntriesQuery = useTimeEntriesQuery();

  const loading = tasksQuery.isLoading || ideasQuery.isLoading || timeEntriesQuery.isLoading;
  const error = tasksQuery.error ?? ideasQuery.error ?? timeEntriesQuery.error;

  const activity = useMemo(() => {
    const events: Array<{ id: string; kind: ActivityKind; verb: string; subject: string; at: string }> = [
      ...(tasksQuery.data ?? []).map((task) => ({
        id: `t-${task.id}`,
        kind: "issue" as const,
        verb: task.status === "done" ? "Completed" : "Updated",
        subject: task.key ? `${task.key} ${task.title}` : task.title,
        at: task.updatedAt,
      })),
      ...(ideasQuery.data ?? []).map((idea) => ({
        id: `i-${idea.id}`,
        kind: "idea" as const,
        verb: "New idea",
        subject: idea.title,
        at: idea.createdAt,
      })),
      ...(timeEntriesQuery.data ?? []).map((entry) => ({
        id: `e-${entry.id}`,
        kind: "time" as const,
        verb: entry.isRunning ? "Timer running" : "Logged time",
        subject: entry.description?.trim() || "Work session",
        at: entry.createdAt,
      })),
    ];

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
  }, [ideasQuery.data, tasksQuery.data, timeEntriesQuery.data]);

  return (
    <section className="orbit-card flex flex-col p-5" aria-labelledby="activity-heading">
      <div className="flex items-center justify-between border-b border-[var(--color-border-secondary)] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 id="activity-heading" className="text-base font-semibold text-[var(--color-text-primary)]">
            Recent activity
          </h2>
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorState
            title="Couldn't load activity"
            message={error instanceof Error ? error.message : "Recent activity didn't load."}
            onRetry={() => void Promise.all([tasksQuery.refetch(), ideasQuery.refetch(), timeEntriesQuery.refetch()])}
            minHeight="min-h-[160px]"
          />
        </div>
      ) : loading ? (
        <div className="mt-4 space-y-2.5" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-10 animate-pulse rounded-xl bg-[var(--color-surface-hover)]" />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Changes to issues, ideas and time will stream here.</p>
        </div>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {activity.map((item) => {
            const Icon = ICONS[item.kind];
            const style = KIND_STYLES[item.kind];

            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      style.bg,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", style.text)} aria-hidden="true" />
                  </div>
                  <p className="min-w-0 truncate text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">{item.verb}</span>{" "}
                    <span className="truncate">{item.subject}</span>
                  </p>
                </div>

                <time
                  dateTime={item.at}
                  className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-tertiary)]"
                >
                  {ago(item.at)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
