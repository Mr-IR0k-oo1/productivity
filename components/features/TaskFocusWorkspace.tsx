"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  SquareCheckBig,
  TimerReset,
} from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useTaskDetailQuery, useUpdateTaskMutation } from "@/hooks/useTasks";
import { useStartTimerMutation, useStopTimerMutation, useTimeEntriesQuery } from "@/hooks/useTimeEntries";
import { cn } from "@/lib/utils";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type TimerMode = "focus" | "break";

function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function priorityLabel(priority: number) {
  if (priority === 1) return "High";
  if (priority === 3) return "Low";
  return "Medium";
}

function priorityClass(priority: number) {
  if (priority === 1) return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  if (priority === 3) return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function statusClass(status: string) {
  if (status === "done") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "blocked") return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  if (status === "review") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (status === "in_progress") return "border-blue-500/30 bg-blue-500/10 text-blue-200";
  return "border-zinc-500/30 bg-zinc-500/10 text-zinc-200";
}

export function TaskFocusWorkspace({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { userId } = useSessionContext();
  const taskQuery = useTaskDetailQuery(taskId);
  const timeEntriesQuery = useTimeEntriesQuery();
  const updateTaskMutation = useUpdateTaskMutation();
  const startTimerMutation = useStartTimerMutation();
  const stopTimerMutation = useStopTimerMutation();

  const [mode, setMode] = useState<TimerMode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SECONDS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [timerEntryId, setTimerEntryId] = useState<string | null>(null);

  const task = taskQuery.data;

  const runningEntry = useMemo(() => timeEntriesQuery.data?.find((entry) => entry.isRunning) ?? null, [timeEntriesQuery.data]);
  const taskRunningEntry = runningEntry?.taskId === task?.id ? runningEntry : null;
  const phaseLength = mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
  const progressPercent = Math.max(0, Math.min(100, Math.round(((phaseLength - remainingSeconds) / phaseLength) * 100)));

  useEffect(() => {
    if (!taskRunningEntry) {
      return;
    }

    const startedAt = parseISO(taskRunningEntry.startedAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

    setMode("focus");
    setRemainingSeconds(Math.max(FOCUS_SECONDS - elapsedSeconds, 0));
    setIsRunning(true);
    setTimerEntryId(taskRunningEntry.id);
    setStatusMessage(null);
  }, [taskRunningEntry]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const stopBackendTimer = useCallback(async () => {
    const activeTimerId = timerEntryId ?? taskRunningEntry?.id;

    if (!activeTimerId) {
      return;
    }

    await stopTimerMutation.mutateAsync(activeTimerId);
    setTimerEntryId(null);
  }, [stopTimerMutation, taskRunningEntry?.id, timerEntryId]);

  const finishSession = useCallback(async () => {
    if (mode === "focus") {
      await stopBackendTimer();
      setMode("break");
      setIsRunning(false);
      setRemainingSeconds(BREAK_SECONDS);
      setStatusMessage("Focus block complete. Take a short break.");
      return;
    }

    setMode("focus");
    setIsRunning(false);
    setRemainingSeconds(FOCUS_SECONDS);
    setStatusMessage("Break complete. Start another focus block when you are ready.");
  }, [mode, stopBackendTimer]);

  useEffect(() => {
    if (!isRunning || remainingSeconds > 0) {
      return;
    }

    void finishSession();
  }, [finishSession, isRunning, remainingSeconds]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push("/tasks");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [router]);

  const startSession = async () => {
    setStatusMessage(null);

    if (mode === "focus") {
      if (runningEntry && runningEntry.taskId !== taskId) {
        await stopTimerMutation.mutateAsync(runningEntry.id);
      }

      if (!taskRunningEntry) {
        const response = await startTimerMutation.mutateAsync({
          taskId,
          description: task?.title ?? "Focus session",
        });

        setTimerEntryId(response.data.id);
      } else {
        setTimerEntryId(taskRunningEntry.id);
      }
    }

    setIsRunning(true);
  };

  const pauseSession = async () => {
    await stopBackendTimer();
    setIsRunning(false);
    setStatusMessage(mode === "focus" ? "Focus paused." : "Break paused.");
  };

  const resetSession = async () => {
    if (mode === "focus") {
      await stopBackendTimer();
    }

    setIsRunning(false);
    setTimerEntryId(null);
    setRemainingSeconds(mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
    setStatusMessage("Timer reset.");
  };

  const markDone = async () => {
    await stopBackendTimer();
    await updateTaskMutation.mutateAsync({ id: taskId, status: "done" });
    setStatusMessage("Task marked done.");
  };

  if (taskQuery.isLoading) {
    return <LoadingState label="Loading focus mode" description="Preparing the task you are about to work on." minHeight="min-h-screen" />;
  }

  if (taskQuery.error || !task) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_40%),linear-gradient(180deg,_rgba(9,9,11,1)_0%,_rgba(6,6,8,1)_100%)] p-6 md:p-8">
        <EmptyState
          title="Task not available"
          description={taskQuery.error instanceof Error ? taskQuery.error.message : "The requested task could not be found."}
          action={{ label: "Back to tasks", onClick: () => router.push("/tasks") }}
          minHeight="min-h-[calc(100vh-3rem)]"
        />
      </div>
    );
  }

  const metadata = (task.metadata ?? {}) as Record<string, unknown>;
  const estimateHours = typeof metadata.estimateHours === "number" ? metadata.estimateHours : 0;
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const dueLabel = dueDate
    ? `${isPast(dueDate) ? "Overdue" : "Due"} ${formatDistanceToNow(dueDate, { addSuffix: true })}`
    : "No due date set";
  const dueDateLabel = dueDate ? format(dueDate, "EEE, MMM d • p") : null;
  const isDone = task.status === "done";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_25%),linear-gradient(180deg,_rgba(9,9,11,1)_0%,_rgba(4,4,6,1)_100%)] text-[var(--foreground)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-8 md:py-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" onClick={() => router.push("/tasks")}>
            <ArrowLeft className="h-4 w-4" />
            Back to tasks
          </Button>

          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full border border-[color:var(--card-border)] bg-black/30 px-3 py-1.5">Escape returns to tasks</span>
            {runningEntry && runningEntry.taskId !== task.id ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-200">Timer active on another task</span>
            ) : null}
          </div>
        </div>

        <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px]">
          <Card className="border-white/10 bg-white/[0.03] shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <CardHeader className="space-y-4 border-b border-white/5 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className={cn("border", statusClass(task.status))}>
                  {task.status.replace(/_/g, " ")}
                </Badge>
                <Badge variant="default" className={cn("border", priorityClass(task.priority))}>
                  {priorityLabel(task.priority)} priority
                </Badge>
                {dueDateLabel ? <Badge variant="default">{dueDateLabel}</Badge> : null}
              </div>

              <div className="space-y-2">
                <CardTitle className="text-4xl font-semibold tracking-tight md:text-5xl">{task.title}</CardTitle>
                <CardDescription className="max-w-3xl text-base text-zinc-300">
                  {task.description || "This task does not have a description yet."}
                </CardDescription>
              </div>

              <div className="grid gap-3 text-sm text-zinc-300 md:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Due</p>
                  <p className="mt-1 font-medium text-zinc-100">{dueLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Focus mode</p>
                  <p className="mt-1 font-medium text-zinc-100">{mode === "focus" ? "Pomodoro focus block" : "Short break"}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">State</p>
                  <p className="mt-1 font-medium text-zinc-100">{isRunning ? "Timer running" : "Timer paused"}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/5 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Task details</p>
                    <dl className="mt-3 space-y-3 text-sm text-zinc-300">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-zinc-500">Task ID</dt>
                        <dd className="font-mono text-xs text-zinc-200">{task.id.slice(0, 8)}…</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-zinc-500">Estimate</dt>
                        <dd className="text-zinc-100">{estimateHours}h</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-zinc-500">Priority</dt>
                        <dd className="text-zinc-100">{priorityLabel(task.priority)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-zinc-500">Assigned</dt>
                        <dd className="text-zinc-100">{task.assigneeId === userId ? "You" : task.assigneeId ? "Another teammate" : "Unassigned"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quick actions</p>
                    <div className="mt-3 space-y-2">
                      <Button className="w-full justify-between" onClick={isRunning ? pauseSession : startSession} disabled={startTimerMutation.isPending || stopTimerMutation.isPending || updateTaskMutation.isPending}>
                        <span className="flex items-center gap-2">
                          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {mode === "focus" ? (isRunning ? "Pause focus" : timerEntryId ? "Resume focus" : "Start focus") : isRunning ? "Pause break" : "Start break"}
                        </span>
                        <span className="text-xs text-[var(--background)]/70">{formatRemaining(remainingSeconds)}</span>
                      </Button>

                      <Button variant="secondary" className="w-full justify-between" onClick={resetSession} disabled={startTimerMutation.isPending || stopTimerMutation.isPending}>
                        <span className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4" />
                          Reset timer
                        </span>
                        <span className="text-xs text-[var(--muted)]">{mode === "focus" ? "25 min" : "5 min"}</span>
                      </Button>

                      {!isDone ? (
                        <Button variant="secondary" className="w-full justify-between" onClick={markDone} disabled={updateTaskMutation.isPending}>
                          <span className="flex items-center gap-2">
                            <SquareCheckBig className="h-4 w-4" />
                            Mark done
                          </span>
                          <span className="text-xs text-[var(--muted)]">Close it out</span>
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Task already complete
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {statusMessage ? (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">{statusMessage}</div>
                ) : null}

                {startTimerMutation.error || stopTimerMutation.error || updateTaskMutation.error ? (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {startTimerMutation.error instanceof Error
                      ? startTimerMutation.error.message
                      : stopTimerMutation.error instanceof Error
                        ? stopTimerMutation.error.message
                        : updateTaskMutation.error instanceof Error
                          ? updateTaskMutation.error.message
                          : "Something went wrong."}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/5 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Checklist</p>
                  <div className="mt-3 space-y-3 text-sm text-zinc-300">
                    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
                      <Clock3 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <div>
                        <p className="font-medium text-zinc-100">Start with the next visible action</p>
                        <p className="text-zinc-400">Use the timer to stay on one concrete outcome until the block ends.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
                      <TimerReset className="mt-0.5 h-4 w-4 text-blue-300" />
                      <div>
                        <p className="font-medium text-zinc-100">Use the corner timer as a cue</p>
                        <p className="text-zinc-400">When it hits zero, pause, reset, or switch to a short break.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Navigation</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link href="/tasks" className="inline-flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-white/10">
                      <span className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to task list
                      </span>
                      <span className="text-xs text-zinc-500">Esc</span>
                    </Link>
                    <Link href="/my-day" className="inline-flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-white/10">
                      <span className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        Open My Day
                      </span>
                      <span className="text-xs text-zinc-500">Morning view</span>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sticky top-6 self-start border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pomodoro</p>
                  <CardTitle className="text-base">{mode === "focus" ? "Focus block" : "Short break"}</CardTitle>
                </div>
                <Badge variant="default" className="border-white/10 bg-white/10 text-zinc-100">
                  {isRunning ? "Running" : "Paused"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.75rem] border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_rgba(12,12,14,0.95)_55%)] p-5 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Time remaining</p>
                <div className="mt-4 text-5xl font-semibold tracking-tight text-white tabular-nums">{formatRemaining(remainingSeconds)}</div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500",
                      mode === "focus" ? "bg-emerald-400" : "bg-sky-400",
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                  {mode === "focus"
                    ? "Stay on the task until the block ends, then take a short break."
                    : "Use this break to breathe, stretch, or reset before the next block."}
                </p>
              </div>

              <div className="grid gap-2 text-sm text-zinc-300">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                  <span>Running timer</span>
                  <span className="text-zinc-100">{taskRunningEntry ? taskRunningEntry.description || "Focus session" : "None"}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                  <span>Focused task</span>
                  <span className="max-w-[180px] truncate text-zinc-100">{task.title}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                  <span>Due</span>
                  <span className="text-zinc-100">{dueLabel}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" onClick={isRunning ? pauseSession : startSession} disabled={startTimerMutation.isPending || stopTimerMutation.isPending}>
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isRunning ? "Pause timer" : mode === "focus" ? "Start focus" : "Start break"}
                </Button>

                <Button variant="secondary" className="w-full" onClick={resetSession} disabled={startTimerMutation.isPending || stopTimerMutation.isPending}>
                  <RotateCcw className="h-4 w-4" />
                  Reset {mode === "focus" ? "focus" : "break"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TaskFocusWorkspace;