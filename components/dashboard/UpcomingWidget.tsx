"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, ChevronRight } from "lucide-react";

import { buildUpcoming, groupByDay } from "@/components/dashboard/upcoming";
import { useCalendarQuery } from "@/hooks/useCalendar";
import { useTasksQuery } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

export function UpcomingWidget() {
  const calendarQuery = useCalendarQuery();
  const tasksQuery = useTasksQuery();

  const groups = useMemo(
    () => groupByDay(buildUpcoming(calendarQuery.data ?? [], tasksQuery.data ?? [], new Date(), { limit: 6 })),
    [calendarQuery.data, tasksQuery.data],
  );
  const isLoading = calendarQuery.isLoading || tasksQuery.isLoading;

  return (
    <section className="orbit-card flex flex-col p-5" aria-labelledby="upcoming-heading">
      <div className="flex items-center justify-between border-b border-[var(--color-border-secondary)] pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 id="upcoming-heading" className="text-base font-semibold text-[var(--color-text-primary)]">
            Next 7 days
          </h2>
        </div>
        <Link
          href="/calendar"
          className="group flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          <span>Calendar</span>
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2.5" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-10 animate-pulse rounded-xl bg-[var(--color-surface-hover)]" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">No scheduled events or deadlines this week.</p>
          <Link
            href="/calendar"
            className="mt-3 text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            Open Calendar view →
          </Link>
        </div>
      ) : (
        <ol className="mt-4 space-y-4">
          {groups.map((group) => (
            <li key={group.label} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-[var(--color-border-secondary)]" />
              </div>

              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition-all hover:bg-[var(--color-surface-hover)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            item.type === "event"
                              ? "bg-[var(--color-info)] shadow-[0_0_6px_var(--color-info)]"
                              : "bg-[var(--color-warning)] shadow-[0_0_6px_var(--color-warning)]",
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                          {item.type === "deadline" ? (
                            <span className="text-xs text-[var(--color-text-tertiary)] font-normal mr-1.5">
                              Due:
                            </span>
                          ) : null}
                          {item.title}
                        </span>
                      </div>

                      <span className="shrink-0 rounded-md bg-[var(--color-surface-strong)] px-2 py-0.5 text-xs font-mono tabular-nums text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)]">
                        {format(item.at, "h:mm a")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
