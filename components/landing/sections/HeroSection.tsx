"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, CheckCircle2, ChevronRight, Clock, Flame, Play, Sparkles, Zap } from "lucide-react";

import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { getAppUrl } from "@/lib/config/domains";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#09090b] pt-32 pb-24 md:pt-40 md:pb-32 text-white">
      {/* ── Ambient Celestial Cosmic Aura ── */}
      <div
        className="pointer-events-none absolute left-1/2 -top-24 h-[650px] w-[1200px] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.32),rgba(255,138,61,0.08)_45%,transparent_70%)] blur-3xl opacity-90"
        aria-hidden="true"
      />
      
      {/* Orbital trajectory lines */}
      <div
        className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 h-[780px] w-[780px] rounded-full border border-white/[0.04] stroke-dasharray-[4_8]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 h-[1020px] w-[1020px] rounded-full border border-white/[0.025]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        {/* Floating Announcement Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 pr-3.5 backdrop-blur-xl shadow-[0_4px_20px_rgba(139,92,246,0.15)] transition-all hover:border-white/20 hover:scale-[1.02]">
          <span className="flex items-center gap-1.5 rounded-full bg-[#8b5cf6]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#a78bfa] border border-[#8b5cf6]/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
            ORBIT 2.0
          </span>
          <span className="text-xs font-medium text-[#a1a1aa]">Productivity Operating System</span>
          <ChevronRight className="h-3 w-3 text-[#a1a1aa]" />
        </div>

        {/* Hero Title */}
        <h1 className="mx-auto max-w-4xl font-display text-[clamp(2.75rem,6.5vw,5.25rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-white">
          Your life,{" "}
          <span className="bg-gradient-to-r from-white via-[#e2e8f0] to-[#8b5cf6] bg-clip-text text-transparent">
            in orbit.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a1a1aa] md:text-lg">
          Stop managing scattered tools. Bring your tasks, projects, schedule, notes, and goals together in one workspace designed to help you move forward.
        </p>

        {/* Action CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={getAppUrl("/register")}
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] px-7 text-sm font-semibold text-white shadow-[0_0_36px_rgba(139,92,246,0.55)] transition-all hover:shadow-[0_0_48px_rgba(139,92,246,0.8)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Get started</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#modules"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/[0.09] hover:border-white/30 active:scale-[0.98]"
          >
            <span>Explore ORBIT</span>
          </a>
        </div>

        {/* Live Metrics Strip */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
          <div className="group rounded-2xl border border-white/[0.08] bg-[#14141c]/90 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-white/20 hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
              <span>Tasks today</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-display text-2xl font-bold text-white">08</span>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                6 completed
              </span>
            </div>
          </div>

          <div className="group rounded-2xl border border-white/[0.08] bg-[#14141c]/90 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-white/20 hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
              <span>Focus time</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6] shadow-[0_0_6px_#8b5cf6]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-display text-2xl font-bold text-white">4.5h</span>
              <span className="text-[11px] font-medium text-[#a78bfa] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-full border border-[#8b5cf6]/20">
                Deep work
              </span>
            </div>
          </div>

          <div className="group rounded-2xl border border-white/[0.08] bg-[#14141c]/90 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-white/20 hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
              <span>Today&apos;s priority</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d] shadow-[0_0_6px_#ff8a3d]" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="truncate text-xs font-semibold text-white">Complete project milestone</span>
            </div>
          </div>
        </div>

        {/* Floating Dashboard Preview with Ambient Violet Lighting */}
        <div className="relative mt-14">
          <div
            className="pointer-events-none absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.35),transparent_70%)] blur-3xl opacity-75"
            aria-hidden="true"
          />
          <DashboardPreview />
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 flex flex-col items-center gap-2 text-xs text-[#a1a1aa]">
          <span className="tracking-wide">Scroll to explore</span>
          <ArrowDown className="h-4 w-4 animate-bounce text-[#8b5cf6]" />
        </div>
      </div>
    </section>
  );
}
