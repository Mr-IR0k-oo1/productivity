"use client";

import { BarChart3, Clock, LineChart, Sparkles, TrendingUp, Zap } from "lucide-react";
import { ReportsVignette } from "@/components/landing/vignettes";

export function AnalyticsSection() {
  const weeklyData = [
    { day: "Mon", hours: 5.2 },
    { day: "Tue", hours: 6.8 },
    { day: "Wed", hours: 4.5 },
    { day: "Thu", hours: 7.1 },
    { day: "Fri", hours: 5.8 },
    { day: "Sat", hours: 2.1 },
    { day: "Sun", hours: 1.5 },
  ];

  return (
    <section id="analytics" className="scroll-mt-20 border-t border-white/[0.08] bg-[#09090b] py-24 lg:py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left: Burndown Chart & Metrics Preview */}
          <div className="space-y-6">
            <ReportsVignette />

            {/* Metric Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 text-left">
                <p className="text-[11px] font-semibold text-[#a1a1aa]">Completion</p>
                <p className="font-display text-2xl font-bold text-white mt-1">94%</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">+6% this sprint</p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 text-left">
                <p className="text-[11px] font-semibold text-[#a1a1aa]">Focus Hours</p>
                <p className="font-display text-2xl font-bold text-white mt-1">33h</p>
                <p className="text-[10px] text-[#8b5cf6] mt-0.5">Across 4 members</p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 text-left">
                <p className="text-[11px] font-semibold text-[#a1a1aa]">Velocity</p>
                <p className="font-display text-2xl font-bold text-white mt-1">28 pts</p>
                <p className="text-[10px] text-[#ff8a3d] mt-0.5">Target achieved</p>
              </div>
            </div>
          </div>

          {/* Right: Explanation */}
          <div className="space-y-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">
              07 — Progress & Analytics
            </span>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.04em]">
              See how far you have come.
            </h2>
            <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
              Objective sprint analytics calculated directly from actual commit and task data. Identify delivery bottlenecks, understand team velocity, and verify whether your sprint will land on target.
            </p>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6]/20 text-[#8b5cf6] mt-0.5">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Burndown Curves</h4>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Compare actual story point burn against ideal velocity curves daily.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6]/20 text-[#8b5cf6] mt-0.5">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Granular Time Allocation</h4>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Understand which issues consume the most engineering hours and identify scope creep early.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
