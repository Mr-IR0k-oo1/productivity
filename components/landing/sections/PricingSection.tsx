"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { getAppUrl } from "@/lib/config/domains";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-white/[0.08] bg-[#09090b] py-24 lg:py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">
            09 — Predictable Pricing
          </span>
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            Transparent plans for teams of every size.
          </h2>
          <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
            Start for free on your own infrastructure or cloud workspace. Upgrade as your team scales with advanced sprint telemetry and visual flowcharts.
          </p>

          {/* Billing Interval Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#14141c] p-1.5 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                !annual ? "bg-[#8b5cf6] text-white shadow-md" : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                annual ? "bg-[#8b5cf6] text-white shadow-md" : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#14141c] p-8 transition-transform hover:-translate-y-1 shadow-xl">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Community</span>
                <h3 className="font-display text-2xl font-bold text-white mt-1">Free Tier</h3>
                <p className="text-xs text-[#a1a1aa] mt-2">Essential productivity for individuals and small startups.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-white">$0</span>
                <span className="text-xs text-[#a1a1aa]">/ member forever</span>
              </div>

              <ul className="space-y-3 border-t border-white/[0.08] pt-6 text-sm text-[#a1a1aa]">
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Unlimited tasks and Kanban boards</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Basic sprint backlog and task tracking</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Integrated 25m Focus Session timer</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Local-first offline storage & sync</span>
                </li>
              </ul>
            </div>

            <Link
              href={getAppUrl("/register")}
              className="mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="relative flex flex-col justify-between rounded-3xl border border-[#8b5cf6]/40 bg-[#181826] p-8 transition-transform hover:-translate-y-1 shadow-[0_0_50px_rgba(139,92,246,0.2)]">
            <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ff8a3d] px-3 py-1 text-[11px] font-bold text-white shadow-lg">
              Most Popular
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">Growth & Scale</span>
                <h3 className="font-display text-2xl font-bold text-white mt-1">Pro Workspace</h3>
                <p className="text-xs text-[#a1a1aa] mt-2">Comprehensive sprint management, analytics, and architecture flowcharts.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-white">
                  {annual ? "$12" : "$15"}
                </span>
                <span className="text-xs text-[#a1a1aa]">/ member / month</span>
              </div>

              <ul className="space-y-3 border-t border-white/[0.08] pt-6 text-sm text-[#a1a1aa]">
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Real-time Sprint Orbit & Story Point burndown</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Interactive Flowcharts canvas with linked issues</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Granular role-based permissions (Owner, Admin, Member, Viewer)</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <Check className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Scoped SHA-256 REST API keys & Webhooks</span>
                </li>
              </ul>
            </div>

            <Link
              href={getAppUrl("/register")}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:shadow-[0_0_36px_rgba(139,92,246,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              <span>Start 14-day free trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
