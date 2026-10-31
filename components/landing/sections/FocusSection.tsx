"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Volume2, Zap } from "lucide-react";

const PRESETS = [
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "60m", seconds: 60 * 60 },
];

export function FocusSection() {
  const [selectedDuration, setSelectedDuration] = useState(25 * 60);
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeString = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  const progress = ((selectedDuration - seconds) / selectedDuration) * 100;

  // Circular SVG params
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleSelectPreset = (newSecs: number) => {
    setSelectedDuration(newSecs);
    setSeconds(newSecs);
    setIsRunning(false);
  };

  return (
    <section id="focus" className="relative scroll-mt-20 border-t border-white/[0.08] bg-[#09090b] py-24 lg:py-32 text-white overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-2 items-center">
          {/* Left Text */}
          <div className="space-y-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">
              05 — Deep Work Engine
            </span>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.04em]">
              Make room for deep work.
            </h2>
            <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
              When it is time to build, Orbit eliminates distraction. Bind a focus timer directly to the task you are executing, log uninterrupted flow sessions, and review your daily focus metrics.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#8b5cf6]/20 text-[#8b5cf6] mt-0.5 shadow-sm">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Integrated Pomodoro & Focus Intervals</h4>
                  <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">Configurable 15m, 25m, 45m or 60m focus sessions bound to real sprint backlog issues.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#ff8a3d]/20 text-[#ff8a3d] mt-0.5 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Zero Context Fragmentation</h4>
                  <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">Time logged automatically rolls into sprint velocity metrics and project burndown curves.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Circular Focus Hardware Instrument */}
          <div className="relative">
            <div className="relative rounded-3xl border border-white/10 bg-[#14141c]/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#8b5cf6] animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Focus Session</span>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p.seconds)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
                        selectedDuration === p.seconds
                          ? "bg-[#8b5cf6] text-white shadow-sm"
                          : "text-[#a1a1aa] hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Binding Info */}
              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#09090b]/70 p-3.5 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-bold text-[#8b5cf6]">QTX-41 • LINKED ISSUE</span>
                  <p className="truncate text-xs font-medium text-white mt-0.5">Refactor authentication tokens & session rotation</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-[#ff8a3d] bg-[#ff8a3d]/10 px-2 py-0.5 rounded-full border border-[#ff8a3d]/20 ml-2">
                  High
                </span>
              </div>

              {/* Circular Dial Visualizer */}
              <div className="relative my-6 flex items-center justify-center">
                <svg className="h-56 w-56 -rotate-90 transform" viewBox="0 0 220 220">
                  {/* Track ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    className="text-white/10"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="url(#focus-gradient)"
                    fill="transparent"
                    className="transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="focus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ff8a3d" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
                    {timeString}
                  </p>
                  <p className="text-[11px] text-[#a1a1aa] mt-1">
                    {isRunning ? "Deep focus running..." : "Ready to focus"}
                  </p>
                </div>
              </div>

              {/* Soundwaves / pulse indicator when running */}
              {isRunning && (
                <div className="flex items-center justify-center gap-1 my-3">
                  <span className="h-2 w-1 rounded-full bg-[#8b5cf6] animate-pulse" />
                  <span className="h-4 w-1 rounded-full bg-[#8b5cf6] animate-pulse delay-75" />
                  <span className="h-3 w-1 rounded-full bg-[#ff8a3d] animate-pulse delay-150" />
                  <span className="h-5 w-1 rounded-full bg-[#ff8a3d] animate-pulse delay-200" />
                  <span className="h-2 w-1 rounded-full bg-[#8b5cf6] animate-pulse delay-100" />
                </div>
              )}

              {/* Action Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-8 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.5)] hover:shadow-[0_0_36px_rgba(139,92,246,0.7)] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isRunning ? "Pause" : "Start Session"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setSeconds(selectedDuration);
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-[#a1a1aa] hover:text-white hover:bg-white/[0.08] transition-colors active:scale-95"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
