"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coffee,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

import { useTasksQuery } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function FocusModePage() {
  const { data: tasks = [] } = useTasksQuery();

  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [focusNotes, setFocusNotes] = useState("");
  const [ambientSound, setAmbientSound] = useState<"off" | "rain" | "whitenoise" | "cafe">("off");

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
      setCompletedSessions((c) => c + 1);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, remainingSeconds]);

  const setDuration = (minutes: number) => {
    setIsRunning(false);
    setTotalSeconds(minutes * 60);
    setRemainingSeconds(minutes * 60);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressPercent = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100);

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[var(--color-space)] text-[var(--color-space-text)] p-4 sm:p-8 select-none transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/my-day"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit Focus Mode</span>
        </Link>

        {/* Ambient Session Tag */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Deep Work Session</span>
          </span>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {completedSessions} session{completedSessions !== 1 ? "s" : ""} completed today
          </span>
        </div>
      </div>

      {/* Main Focus Area */}
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center text-center space-y-8 my-auto">
        {/* Active Task Selector */}
        <div className="w-full space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Focus Objective
          </span>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] text-center focus:border-[var(--color-accent)] focus:outline-hidden"
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.key ? `${task.key}: ` : ""}{task.title}
              </option>
            ))}
          </select>
        </div>

        {/* Large Timer Display */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Progress Ring Simulation */}
          <div className="relative flex h-64 w-64 items-center justify-center rounded-full border-4 border-[var(--color-surface-hover)] bg-[var(--color-surface-strong)]/40 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="font-mono text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)]">
                {isRunning ? "Focusing..." : "Paused"}
              </p>
            </div>
          </div>
        </div>

        {/* Timer Duration Controls */}
        <div className="flex items-center gap-2">
          {[
            { label: "25m Sprint", mins: 25 },
            { label: "50m Deep Work", mins: 50 },
            { label: "15m Recharge", mins: 15 },
          ].map((preset) => (
            <button
              key={preset.mins}
              type="button"
              onClick={() => setDuration(preset.mins)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                totalSeconds === preset.mins * 60
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-secondary)]",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "h-12 w-36 gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95",
              isRunning
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[var(--color-accent)] hover:opacity-90",
            )}
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            <span>{isRunning ? "Pause" : "Start Focus"}</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => setDuration(totalSeconds / 60)}
            className="h-12 w-12 rounded-xl p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[var(--color-border-secondary)]"
            title="Reset Timer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Notes & Ambient Bar */}
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-3">
          <input
            type="text"
            placeholder="Quick focus note or milestone scratchpad..."
            value={focusNotes}
            onChange={(e) => setFocusNotes(e.target.value)}
            className="w-full bg-transparent px-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
