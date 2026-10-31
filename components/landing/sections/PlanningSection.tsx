"use client";

import { Calendar, CheckSquare, ChevronRight, Flame, Layers, Sparkles, TrendingUp } from "lucide-react";

export function PlanningSection() {
  return (
    <section id="planning" className="scroll-mt-20 border-t border-white/[0.08] bg-[#0c0d14] py-24 lg:py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">
            06 — Intelligent Planning
          </span>
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            Turn intentions into execution.
          </h2>
          <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
            Eliminate morning friction. Orbit gives your team unambiguous priority queues, transparent workload visibility, and realistic capacity planning.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {/* Card 1: My Day Routine */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#14141c] p-6 space-y-4 shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8b5cf6]/20 text-[#8b5cf6]">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">My Day Daily Planning</h3>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Every morning, your assigned tasks due today and overdue items automatically group into one focused checklist.
            </p>
            <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span>Today&apos;s queue</span>
                <span className="text-[#8b5cf6] font-semibold">4 items</span>
              </div>
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span className="truncate">Deploy security patch v2.4</span>
              </div>
            </div>
          </div>

          {/* Card 2: Workload & Story Points */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#14141c] p-6 space-y-4 shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff8a3d]/20 text-[#ff8a3d]">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">Workload & Story Points</h3>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Estimate issues with Fibonacci story points. Orbit tallies team capacity before starting a sprint to prevent burnout.
            </p>
            <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span>Planned Capacity</span>
                <span className="text-emerald-400 font-semibold">28 / 30 pts</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-500 w-[93%]" />
              </div>
            </div>
          </div>

          {/* Card 3: Priority Management */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#14141c] p-6 space-y-4 shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">Priority Management</h3>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Three-tier priority indicators spotlight urgent blockers instantly. Overdue tasks are tagged with exact lateness alerts.
            </p>
            <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-semibold">High Priority</span>
                <span className="text-rose-400 text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">2 days late</span>
              </div>
              <p className="text-white font-medium truncate">Fix Safari 18 checkout error</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
