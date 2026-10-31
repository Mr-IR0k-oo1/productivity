"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { format } from "date-fns";

import {
  buildSprintOrbit,
  describeDaysLeft,
  pickActiveSprint,
  polar,
  type OrbitDot,
} from "@/components/dashboard/sprint-orbit";
import { ErrorState } from "@/components/ui/error-state";
import { useSprintsQuery } from "@/hooks/useSprints";
import { useTasksQuery } from "@/hooks/useTasks";
import type { TaskStatus } from "@/types/task-status";

const SIZE = 260;
const C = SIZE / 2;
const RING = 100;
const TRACK = 118;

const STATUS_LABEL: Record<TaskStatus, string> = {
  done: "Done",
  review: "In review",
  in_progress: "In progress",
  todo: "To do",
};

const LEGEND_ORDER: TaskStatus[] = ["done", "review", "in_progress", "todo"];

/** One glyph per status, shared by the ring and the legend so they read as the same thing. */
function StatusDot({ status, cx, cy, r }: { status: TaskStatus; cx: number; cy: number; r: number }) {
  const stroke = Math.max(1.5, r * 0.38);
  if (status === "done") {
    return <circle cx={cx} cy={cy} r={r} fill="var(--color-accent)" className="orbit-glow" />;
  }
  if (status === "review") {
    return (
      <>
        <circle cx={cx} cy={cy} r={r - stroke / 2} fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r * 0.35} fill="var(--color-accent)" />
      </>
    );
  }
  if (status === "in_progress") {
    return <circle cx={cx} cy={cy} r={r - stroke / 2} fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth={stroke} />;
  }
  return <circle cx={cx} cy={cy} r={r * 0.72} fill="var(--color-border-tertiary)" />;
}

function LegendGlyph({ status }: { status: TaskStatus }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <StatusDot status={status} cx={8} cy={8} r={6} />
    </svg>
  );
}

function arcPath(r: number, from: number, to: number) {
  const start = polar(C, C, r, from);
  const end = polar(C, C, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M${start.x} ${start.y}A${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

function OrbitRing({ dots, elapsed, label }: { dots: OrbitDot[]; elapsed: number | null; label: string }) {
  // Keep dots from overlapping once a sprint holds many issues.
  const spacing = dots.length > 0 ? (2 * Math.PI * RING) / dots.length : Infinity;
  const r = Math.max(2.5, Math.min(7, spacing / 2.8));
  const elapsedAngle = elapsed === null ? null : Math.max(0.5, elapsed * 360);
  const satellite = elapsedAngle === null ? null : polar(C, C, TRACK, Math.min(elapsedAngle, 359.5));
  const gradientId = `orbit-trail-${useId().replace(/:/g, "")}`;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full max-w-[260px] overflow-visible" role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-flare)" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={RING - 22} fill="none" stroke="var(--color-border-secondary)" strokeWidth="1" strokeDasharray="1 6" opacity="0.7" />
      <circle cx={C} cy={C} r={RING} fill="none" stroke="var(--color-border-secondary)" strokeWidth="1.5" />
      <circle cx={C} cy={C} r={TRACK} fill="none" stroke="var(--color-border-secondary)" strokeWidth="1" strokeDasharray="2 5" />
      {elapsedAngle !== null && elapsedAngle < 360 ? (
        <path
          d={arcPath(TRACK, 0, Math.min(elapsedAngle, 359.5))}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="orbit-glow"
        />
      ) : null}
      {satellite ? (
        <g>
          <circle cx={satellite.x} cy={satellite.y} r="9" fill="var(--color-flare)" opacity="0.35" className="animate-pulse" />
          <circle cx={satellite.x} cy={satellite.y} r="5.5" fill="var(--color-flare)" stroke="var(--color-surface)" strokeWidth="2.5" className="flare-glow" />
        </g>
      ) : null}
      {dots.map((dot) => {
        const point = polar(C, C, RING, dot.angle);
        return (
          <g key={dot.id}>
            <title>{`${dot.key ? `${dot.key} ` : ""}${dot.title} (${STATUS_LABEL[dot.status]})`}</title>
            <StatusDot status={dot.status} cx={point.x} cy={point.y} r={r} />
          </g>
        );
      })}
    </svg>
  );
}

export function SprintOrbitPanel() {
  const sprintsQuery = useSprintsQuery();
  const tasksQuery = useTasksQuery();

  const orbit = useMemo(() => {
    const sprint = pickActiveSprint(sprintsQuery.data ?? []);
    return sprint ? buildSprintOrbit(sprint, tasksQuery.data ?? []) : null;
  }, [sprintsQuery.data, tasksQuery.data]);

  const isLoading = sprintsQuery.isLoading || tasksQuery.isLoading;
  const error = sprintsQuery.error ?? tasksQuery.error;

  if (error) {
    return (
      <ErrorState
        title="Couldn't load the sprint"
        message={error instanceof Error ? error.message : "The sprint or its issues didn't load."}
        onRetry={() => void Promise.all([sprintsQuery.refetch(), tasksQuery.refetch()])}
        minHeight="min-h-[300px]"
      />
    );
  }

  if (isLoading) {
    return (
      <section className="space-panel orbit-hero grid min-h-[300px] items-center gap-8 p-6 sm:grid-cols-[260px_1fr]" aria-busy="true">
        <div className="mx-auto aspect-square w-full max-w-[260px] animate-pulse rounded-full border-[10px] border-[var(--color-border-secondary)]" />
        <div className="space-y-3">
          <div className="h-6 w-40 animate-pulse rounded bg-[var(--color-border-secondary)]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[var(--color-border-secondary)]" />
        </div>
      </section>
    );
  }

  if (!orbit) {
    return (
      <section className="space-panel orbit-hero grid items-center gap-8 p-6 sm:grid-cols-[220px_1fr] sm:p-8" aria-labelledby="sprint-heading">
        <OrbitRing dots={[]} elapsed={null} label="No sprint is running" />
        <div className="max-w-sm">
          <h2 id="sprint-heading" className="font-display text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
            No sprint running
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Pick issues from the backlog and start a sprint. Its progress shows up here, one dot per issue.
          </p>
          <Link
            href="/backlog"
            className="mt-5 inline-flex h-9 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)]"
          >
            Plan a sprint
          </Link>
        </div>
      </section>
    );
  }

  const { sprint, dots, counts, elapsed, daysLeft } = orbit;
  const total = dots.length;
  const done = counts.done;
  const dates =
    sprint.startDate && sprint.endDate
      ? `${format(new Date(sprint.startDate), "MMM d")} to ${format(new Date(sprint.endDate), "MMM d")}`
      : null;
  const ringLabel = `${sprint.name}: ${done} of ${total} issues done, ${describeDaysLeft(daysLeft).toLowerCase()}`;

  return (
    <section className="space-panel orbit-hero grid items-center gap-x-10 gap-y-6 p-6 sm:grid-cols-[260px_1fr] sm:p-8" aria-labelledby="sprint-heading">
      <div className="relative mx-auto w-full max-w-[260px]">
        <OrbitRing dots={dots} elapsed={elapsed} label={ringLabel} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-[2.6rem] font-semibold leading-none tracking-[-0.05em] tabular-nums text-[var(--color-text-primary)]">
            {done}
            <span className="text-[var(--color-text-tertiary)]">/{total}</span>
          </p>
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">issues done</p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <span className={daysLeft !== null && daysLeft < 0 ? "font-medium text-[var(--color-error)]" : "font-medium text-[var(--color-flare)]"}>
            {describeDaysLeft(daysLeft)}
          </span>
          {dates ? <span className="text-[var(--color-text-tertiary)]">, {dates}</span> : null}
        </p>
        <h2 id="sprint-heading" className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-text-primary)]">
          {sprint.name}
        </h2>
        {sprint.goal ? (
          <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--color-text-secondary)]">{sprint.goal}</p>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:max-w-sm">
          {LEGEND_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <LegendGlyph status={status} />
              <dt className="text-sm text-[var(--color-text-secondary)]">{STATUS_LABEL[status]}</dt>
              <dd className="ml-auto text-sm font-medium tabular-nums text-[var(--color-text-primary)]">{counts[status]}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-[var(--color-border-secondary)] pt-4 text-xs">
          {sprint.totalPoints > 0 ? (
            <span className="rounded-lg bg-white/5 px-2.5 py-1.5 font-medium text-[var(--color-text-secondary)]">
              <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{sprint.donePoints}</span> /{" "}
              <span className="tabular-nums">{sprint.totalPoints}</span> points
            </span>
          ) : null}
          <Link
            href="/backlog"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)]/20 px-3 py-1.5 font-semibold text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30 transition-all hover:bg-[var(--color-accent)]/30 hover:shadow-xs"
          >
            Open sprint board →
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center rounded-lg border border-[var(--color-border-secondary)] bg-white/5 px-3 py-1.5 font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-tertiary)] hover:text-white"
          >
            Burndown chart
          </Link>
        </div>
      </div>
    </section>
  );
}
