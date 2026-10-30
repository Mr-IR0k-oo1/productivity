"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { ArrowRight, Calendar, Clock } from "lucide-react";

import { buildUpcoming } from "@/components/dashboard/upcoming";
import { useCalendarQuery } from "@/hooks/useCalendar";
import { useTasksQuery } from "@/hooks/useTasks";

function formatWhen(date: Date) {
  const time = format(date, "h:mm a");
  if (isToday(date)) return `Today, ${time}`;
  if (isTomorrow(date)) return `Tomorrow, ${time}`;
  return format(date, "EEE MMM d, h:mm a");
}

export function UpcomingWidget() {
  const calendarQuery = useCalendarQuery();
  const tasksQuery = useTasksQuery();

  const items = useMemo(
    () => buildUpcoming(calendarQuery.data ?? [], tasksQuery.data ?? []),
    [calendarQuery.data, tasksQuery.data],
  );
  const isLoading = calendarQuery.isLoading || tasksQuery.isLoading;

  return (
    <div className="orbit-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Coming up</h3>
        <Link
          href="/calendar"
          className="group flex items-center gap-1 text-xs text-[var(--accent)] transition-colors hover:text-[var(--foreground)]"
        >
          Calendar
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2.5" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-[52px] animate-pulse rounded-lg bg-[var(--surface-strong)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-8 w-8 text-[var(--muted)]" aria-hidden="true" />
          <p className="mt-2 text-sm text-[var(--muted)]">Nothing scheduled in the next 7 days</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-lg border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 py-2.5 transition-colors hover:border-[var(--border-tertiary)]"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    item.type === "event" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                  }`}
                  aria-hidden="true"
                >
                  {item.type === "event" ? <Calendar className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--foreground)]">{item.title}</span>
                  <span className="block text-[11px] text-[var(--muted)]">
                    {item.type === "deadline" ? "Due " : ""}
                    {formatWhen(item.at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
