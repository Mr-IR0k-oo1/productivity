"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";

import { priorityLabel, selectUpNext } from "@/components/dashboard/up-next";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { ErrorState } from "@/components/ui/error-state";
import { useTasksQuery } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

function dueText(dueDate: string | null) {
  if (!dueDate) return null;
  const date = parseISO(dueDate);
  if (Number.isNaN(date.getTime())) return null;
  const distance = formatDistanceToNowStrict(date);
  return isPast(date) ? { text: `${distance} late`, late: true } : { text: `in ${distance}`, late: false };
}

/** Three short bars, filled up to the priority with glowing accents */
function PriorityBars({ priority }: { priority: number | null | undefined }) {
  const level = priority === 1 ? 3 : priority === 3 ? 1 : 2;
  const color =
    priority === 1
      ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"
      : priority === 3
      ? "bg-slate-400"
      : "bg-amber-500";

  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-[3.5px] rounded-full transition-colors",
            bar === 1 ? "h-1.5" : bar === 2 ? "h-2.5" : "h-3.5",
            bar <= level ? color : "bg-[var(--color-border-secondary)]",
          )}
        />
      ))}
    </span>
  );
}

export function UpNextList() {
  const { userId } = useSessionContext();
  const tasksQuery = useTasksQuery();
  const { items, scope } = useMemo(() => selectUpNext(tasksQuery.data ?? [], userId), [tasksQuery.data, userId]);

  return (
    <section className="orbit-card flex flex-col overflow-hidden" aria-labelledby="up-next-heading">
      <div className="flex items-center justify-between border-b border-[var(--color-border-secondary)] px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 id="up-next-heading" className="text-base font-semibold text-[var(--color-text-primary)]">
            {scope === "mine" ? "Up next for you" : "Open issues"}
          </h2>
          {items.length > 0 && (
            <span className="rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              {items.length}
            </span>
          )}
        </div>
        <Link
          href="/tasks"
          className="group flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          <span>All issues</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {tasksQuery.error ? (
        <div className="p-5">
          <ErrorState
            title="Couldn't load issues"
            message={tasksQuery.error instanceof Error ? tasksQuery.error.message : "The issue list didn't load."}
            onRetry={() => void tasksQuery.refetch()}
            minHeight="min-h-[180px]"
          />
        </div>
      ) : tasksQuery.isLoading ? (
        <ul className="space-y-2 p-5" aria-busy="true">
          {[0, 1, 2, 3].map((key) => (
            <li key={key} className="h-11 animate-pulse rounded-xl bg-[var(--color-surface-hover)]" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">All clear</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Nothing open right now. Ready for more work?</p>
          <Link
            href="/backlog"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
          >
            Go to backlog →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border-secondary)]">
          {items.map((task) => {
            const due = dueText(task.dueDate);
            return (
              <li key={task.id}>
                <Link
                  href={`/tasks?taskId=${task.id}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:bg-[var(--color-surface-hover)]"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-strong)] shadow-2xs"
                    title={`${priorityLabel(task.priority)} priority`}
                  >
                    <PriorityBars priority={task.priority} />
                    <span className="sr-only">{priorityLabel(task.priority)} priority</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      {task.title}
                    </span>
                    {task.key ? (
                      <span className="mt-0.5 inline-block font-mono text-[11px] text-[var(--color-text-tertiary)]">
                        {task.key}
                      </span>
                    ) : null}
                  </span>
                  {due ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
                        due.late
                          ? "border border-rose-500/20 bg-rose-500/10 text-rose-500"
                          : "border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] text-[var(--color-text-tertiary)]",
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {due.text}
                    </span>
                  ) : (
                    <span />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
