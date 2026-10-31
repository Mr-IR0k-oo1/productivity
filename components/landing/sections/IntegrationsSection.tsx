"use client";

import { Calendar, Code, FileText, GitBranch, Key, MessageSquare, Shield, Webhook } from "lucide-react";

const integrations = [
  {
    name: "Google Calendar & iCal",
    icon: Calendar,
    tag: "Available",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Export deliverables, focus blocks, and sprint milestones directly to your native calendar.",
  },
  {
    name: "REST API & Webhooks",
    icon: Webhook,
    tag: "Native",
    tagColor: "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20",
    description: "Scoped SHA-256 hashed API keys to automate issue creation, task syncing, and reporting.",
  },
  {
    name: "GitHub & Git Workflows",
    icon: GitBranch,
    tag: "Supported",
    tagColor: "bg-white/10 text-white border-white/20",
    description: "Mention issue keys like QTX-41 in commit messages and pull requests to track development.",
  },
  {
    name: "Single Sign-On (SSO)",
    icon: Shield,
    tag: "Built-in",
    tagColor: "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20",
    description: "Enterprise OAuth with Google, GitHub, and email OTP with server-enforced role permissions.",
  },
  {
    name: "Slack & Messaging",
    icon: MessageSquare,
    tag: "Webhook Ready",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description: "Stream sprint completions and critical notifications directly into team chat channels.",
  },
  {
    name: "Markdown & Docs",
    icon: FileText,
    tag: "Native",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Full TipTap rich text support with code blocks, headings, checklists, and export capabilities.",
  },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="scroll-mt-20 border-t border-white/[0.08] bg-[#0c0d14] py-24 lg:py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">
            08 — Ecosystem & APIs
          </span>
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            Works with your ecosystem.
          </h2>
          <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
            Connect Orbit with the tools your team relies on daily. Extensible via secure API keys, calendar subscriptions, and developer webhooks.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="group rounded-3xl border border-white/[0.08] bg-[#14141c] p-6 transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8b5cf6]/10 text-[#8b5cf6] transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-white">{item.name}</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
