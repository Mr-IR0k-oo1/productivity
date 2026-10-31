"use client";

import Link from "next/link";
import { format, formatDistanceToNow, endOfDay, isPast, isToday, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, Clock3, Flame, Play, TimerReset, TriangleAlert } from "lucide-react";
import { useMemo } from "react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useTasksQuery } from "@/hooks/useTasks";
import { useTimeEntriesQuery } from "@/hooks/useTimeEntries";
import { cn } from "@/lib/utils";

function priorityLabel(priority: number) {
  if (priority === 1) return "High";
  if (priority === 3) return "Low";
  return "Medium";
}

function priorityClass(priority: number) {
  if (priority === 1) return "border-rose-500/30 bg-rose-500/10 text-[var(--color-error)]";
  if (priority === 3) return "border-sky-500/30 bg-sky-500/10 text-[var(--color-info)]";
  return "border-emerald-500/30 bg-emerald-500/10 text-[var(--color-success)]";
}

function formatDueLabel(dueDate: string | null) {
  if (!dueDate) {
    return "No due date";
  }

  const parsed = parseISO(dueDate);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid due date";
  }

  if (isToday(parsed)) {
    return `Today at ${format(parsed, "p")}`;
  }

  return isPast(parsed) ? `Overdue ${formatDistanceToNow(parsed, { addSuffix: true })}` : format(parsed, "EEE, MMM d • p");
}

export function MyDayWorkspace() {
  const { isReady, userId } = useSessionContext();
  const tasksQuery = useTasksQuery({ assigneeId: userId ?? undefined });
  const timeEntriesQuery = useTimeEntriesQuery();

  const runningEntry = useMemo(() => timeEntriesQuery.data?.find((entry) => entry.isRunning) ?? null, [timeEntriesQuery.data]);

  const tasks = useMemo(() => {
    const todayEnd = endOfDay(new Date());

    return (tasksQuery.data ?? [])
      .filter((task) => task.status !== "done" && task.dueDate && parseISO(task.dueDate) <= todayEnd)
      .sort((left, right) => {
        const leftDue = left.dueDate ? parseISO(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightDue = right.dueDate ? parseISO(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

        if (leftDue !== rightDue) {
          return leftDue - rightDue;
        }

        return left.priority - right.priority;
      });
  }, [tasksQuery.data]);

  const overdueCount = tasks.filter((task) => task.dueDate && isPast(parseISO(task.dueDate))).length;
  const dueTodayCount = tasks.filter((task) => task.dueDate && isToday(parseISO(task.dueDate))).length;

  if (!isReady) {
    return <LoadingState label="Loading My Day" description="Preparing your morning priorities." minHeight="min-h-screen" />;
  }

  return (
    <div className="space-y-6 page-animate">
      <section className="rounded-[2rem] border border-[color:var(--card-border)] bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_30%),linear-gradient(135deg,_rgba(12,12,14,0.96),_rgba(6,6,8,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="default" className="border-white/10 bg-white/10 text-[var(--color-text-primary)]">
              My Day
            </Badge>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] md:text-5xl">Start with the work that matters most.</h1>
              <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-secondary)] md:text-base">
                Tasks assigned to you that are due today or already overdue, plus the timer that is currently running.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <p className="text-xs text-[var(--color-text-tertiary)]">Due today</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{dueTodayCount}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <p className="text-xs text-[var(--color-text-tertiary)]">Overdue</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-error)]">{overdueCount}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <p className="text-xs text-[var(--color-text-tertiary)]">Timer</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{runningEntry ? "Live" : "Idle"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-white/10 bg-white/[0.03] shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Active timer</CardTitle>
                <p className="text-sm text-[var(--color-text-secondary)]">What is currently on the clock.</p>
              </div>
              <Badge variant="default" className="border-white/10 bg-white/10 text-[var(--color-text-primary)]">
                <Clock3 className="mr-1 h-3.5 w-3.5" />
                {runningEntry ? "Running" : "Paused"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {runningEntry ? (
              <>
                <div className="rounded-3xl border border-white/5 bg-black/20 p-4">
                  <p className="text-xs text-[var(--color-text-tertiary)]">Session</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">{runningEntry.description || "Focus session"}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Started {formatDistanceToNow(parseISO(runningEntry.startedAt), { addSuffix: true })}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button asChild>
                    <Link href={runningEntry.taskId ? `/tasks?taskId=${encodeURIComponent(runningEntry.taskId)}` : "/time"}>
                      <Play className="h-4 w-4" />
                      Open task
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link href="/time">
                      <TimerReset className="h-4 w-4" />
                      Time page
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Flame className="h-8 w-8" />}
                title="No timer is running"
                description="Pick a task below and start a focus block from its detail page."
                action={{ label: "Open tasks", onClick: () => (window.location.href = "/tasks") }}
                minHeight="min-h-[240px]"
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Today&apos;s priorities</CardTitle>
              <p className="text-sm text-[var(--color-text-secondary)]">Only what needs attention now.</p>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/tasks">
                Open tasks
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {!tasksQuery.isLoading && tasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-8 w-8" />}
                title="Nothing urgent today"
                description="No assigned tasks are due today or overdue. You can use this window to clear the queue or work ahead."
                action={{ label: "Browse tasks", onClick: () => (window.location.href = "/tasks") }}
                minHeight="min-h-[280px]"
              />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
                  const overdue = Boolean(dueDate && isPast(dueDate));

                  return (
                    <article
                      key={task.id}
                      className={cn(
                        "group rounded-3xl border border-white/5 bg-black/20 p-4 transition-all hover:border-white/10 hover:bg-white/[0.05]",
                        overdue && "border-rose-500/20 bg-rose-500/[0.06]",
                      )}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default" className={cn("border", priorityClass(task.priority))}>
                              {priorityLabel(task.priority)}
                            </Badge>
                            <Badge variant="default" className={cn("border", overdue ? "border-rose-500/30 bg-rose-500/10 text-[var(--color-error)]" : "border-white/10 bg-white/10 text-[var(--color-text-primary)]")}>
                              {overdue ? (
                                <span className="flex items-center gap-1">
                                  <TriangleAlert className="h-3.5 w-3.5" />
                                  Overdue
                                </span>
                              ) : (
                                "Due today"
                              )}
                            </Badge>
                            <Badge variant="default" className="border-white/10 bg-white/10 text-[var(--color-text-primary)]">
                              {task.status.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{task.title}</h3>
                            <p className="mt-1 max-w-3xl text-sm text-[var(--color-text-secondary)]">
                              {(typeof task.description === 'string' ? task.description : null) || "No description yet."}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 md:items-end">
                          <div className="text-sm text-[var(--color-text-secondary)]">
                            <p>{formatDueLabel(task.dueDate)}</p>
                          </div>
                          <Button asChild className="md:w-auto">
                            <Link href={`/tasks?taskId=${encodeURIComponent(task.id)}`}>
                              Focus task
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {tasksQuery.error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {tasksQuery.error instanceof Error ? tasksQuery.error.message : "Failed to load today&apos;s tasks."}
        </div>
      ) : null}
    </div>
  );
}

export default MyDayWorkspace;