"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { BrandLogo, QuantrixCredit } from "@/components/brand/BrandLogo";
import { getAppUrl } from "@/lib/config/domains";

export function FinalCtaAndFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="relative border-t border-white/[0.08] bg-[#09090b] text-white">
      {/* 10 — Final CTA */}
      <section className="px-6 py-24 sm:py-32">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#14141c] p-8 sm:p-16 text-center shadow-2xl">
          {/* Ambient Lighting */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.35),transparent_70%)] blur-2xl"
            aria-hidden="true"
          />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3.5 py-1 text-xs font-semibold text-[#8b5cf6] mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Everything Connected
          </span>

          <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.25rem)] font-bold tracking-tight text-white leading-tight">
            Everything you need. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-white via-white to-[#a1a1aa] bg-clip-text text-transparent">One orbit.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base text-[#a1a1aa] leading-relaxed">
            Stop juggling fragmented tools. Bring your backlog, board, schedule, notes, and visual architecture into one cohesive environment.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={getAppUrl("/register")}
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-8 text-sm font-semibold text-white shadow-[0_0_32px_rgba(139,92,246,0.5)] transition-all hover:shadow-[0_0_48px_rgba(139,92,246,0.75)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start using ORBIT</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={getAppUrl("/login")}
              className="inline-flex h-12 items-center rounded-xl border border-white/15 bg-white/[0.04] px-8 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
            >
              Sign in to workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0c0d14] pt-16 pb-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="space-y-4 lg:col-span-2">
              <Link href="/" aria-label="ORBIT home">
                <BrandLogo />
              </Link>
              <p className="max-w-sm text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                ORBIT is a unified productivity operating system for managing tasks, sprints, ideas, time, and system flowcharts.
              </p>
              <div className="pt-2">
                <QuantrixCredit className="text-xs text-[#a1a1aa] hover:text-white" />
              </div>
            </div>

            {/* Product Column */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white">Product</p>
              <ul className="space-y-2 text-xs text-[#a1a1aa]">
                <li><a href="#modules" className="hover:text-white transition-colors">Core Modules</a></li>
                <li><a href="#workspace" className="hover:text-white transition-colors">Workspace Deck</a></li>
                <li><a href="#focus" className="hover:text-white transition-colors">Focus Sessions</a></li>
                <li><a href="#planning" className="hover:text-white transition-colors">Sprint Planning</a></li>
                <li><a href="#analytics" className="hover:text-white transition-colors">Burndown Analytics</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Plans & Pricing</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white">Resources</p>
              <ul className="space-y-2 text-xs text-[#a1a1aa]">
                <li><Link href="/features" className="hover:text-white transition-colors">Feature Catalog</Link></li>
                <li><Link href="/features/sprints" className="hover:text-white transition-colors">Sprint Guide</Link></li>
                <li><Link href="/features/flowcharts" className="hover:text-white transition-colors">Flowcharts Engine</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security Whitepaper</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Web App Dashboard</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white">Legal & Terms</p>
              <ul className="space-y-2 text-xs text-[#a1a1aa]">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Zero Cookie Policy</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">SOC2 Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-white/[0.08] pt-8 text-xs text-[#71717a] gap-4">
            <p>© {year} Quantrix Studio. ORBIT is a registered product of Quantrix.</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[#a1a1aa]">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
