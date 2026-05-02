"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface UpcomingItem {
  id: string;
  title: string;
  time: string;
  type: "event" | "deadline";
}

// Placeholder data – will be replaced with real calendar/task queries
const placeholderItems: UpcomingItem[] = [
  { id: "1", title: "Team standup", time: "10:00 AM", type: "event" },
  { id: "2", title: "Design review deadline", time: "2:00 PM", type: "deadline" },
  { id: "3", title: "Client sync call", time: "4:30 PM", type: "event" },
];

export function UpcomingWidget() {
  const items = useMemo(() => placeholderItems, []);

  return (
    <div className="orbit-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Coming Up</h3>
        <Link
          href="/calendar"
          className="group flex items-center gap-1 text-xs text-[var(--accent)] transition-colors hover:text-[var(--foreground)]"
        >
          Calendar
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 py-2.5 transition-colors hover:border-[var(--border-tertiary)]"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                item.type === "event"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {item.type === "event" ? (
                <Calendar className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[var(--foreground)]">{item.title}</p>
              <p className="text-[11px] text-[var(--muted)]">{item.time}</p>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-8 w-8 text-[var(--muted)]" />
          <p className="mt-2 text-sm text-[var(--muted)]">Nothing scheduled today</p>
        </div>
      )}
    </div>
  );
}
