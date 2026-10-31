"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
];

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function FocusTimerWidget() {
  const [selectedDuration, setSelectedDuration] = useState(25 * 60);
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  const progress = (selectedDuration - seconds) / selectedDuration;
  const finished = seconds === 0;

  const handleSelectPreset = (newSecs: number) => {
    setSelectedDuration(newSecs);
    setSeconds(newSecs);
    setIsRunning(false);
  };

  return (
    <section
      className={cn(
        "orbit-card relative flex flex-col justify-between overflow-hidden p-6 transition-all",
        isRunning && "ring-1 ring-[var(--color-accent)]/40 shadow-[0_4px_24px_rgba(84,66,245,0.15)]",
      )}
      aria-labelledby="focus-heading"
    >
      {/* Running Ambient Light */}
      {isRunning && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent)]/20 blur-2xl" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 id="focus-heading" className="text-base font-semibold text-[var(--color-text-primary)]">
            Focus session
          </h2>
          {isRunning && (
            <span className="flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent)] animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              Active
            </span>
          )}
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-0.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleSelectPreset(p.seconds)}
              className={cn(
                "rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
                selectedDuration === p.seconds
                  ? "bg-[var(--color-accent)] text-white shadow-2xs font-semibold"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="my-5 flex items-end justify-between gap-4">
        <div>
          <p
            className="font-display text-[2.75rem] font-bold leading-none tracking-[-0.05em] tabular-nums text-[var(--color-text-primary)]"
            aria-live="polite"
          >
            {finished ? "Done" : formatTime(seconds)}
          </p>
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            {finished ? "Session complete! Great focus." : `${Math.round(selectedDuration / 60)} minutes session`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => (finished ? (setSeconds(selectedDuration), setIsRunning(true)) : setIsRunning(!isRunning))}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-strong)] text-white shadow-sm transition-all hover:shadow-[0_2px_14px_rgba(84,66,245,0.35)] active:scale-95"
            type="button"
            aria-label={isRunning ? "Pause focus session" : "Start focus session"}
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSeconds(selectedDuration);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] shadow-2xs transition-colors hover:border-[var(--color-border-tertiary)] hover:text-[var(--color-text-primary)] active:scale-95"
            type="button"
            aria-label="Reset focus session"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border-secondary)]"
          role="progressbar"
          aria-label="Focus session progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-flare)] transition-[width] duration-1000 ease-linear shadow-[0_0_8px_var(--color-accent)]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
