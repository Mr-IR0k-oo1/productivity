"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds

export function FocusTimerWidget() {
  const [seconds, setSeconds] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = ((FOCUS_DURATION - seconds) / FOCUS_DURATION) * 100;

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

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

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(FOCUS_DURATION);
  };

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="orbit-card flex flex-col items-center p-6">
      <div className="flex w-full items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Focus timer</h3>
        <span className="text-xs text-[var(--muted)]">25 minutes</span>
      </div>

      <div className="relative mt-6 flex items-center justify-center">
        <svg width="120" height="120" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="var(--color-border-secondary)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="absolute text-2xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
          {formatTime(seconds)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--color-on-accent)] transition-colors hover:bg-[var(--accent-strong)]"
          type="button"
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>

        <button
          onClick={handleReset}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--card-border)] bg-[var(--surface-strong)] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          type="button"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
