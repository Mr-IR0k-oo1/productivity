"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lightbulb, CheckSquare, GitBranch, Sparkles, Zap, Shield, Clock, Users, CheckCircle, FileText, BarChart3 } from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { LoadingState } from "@/components/ui/loading-state";

const missionPills = [
  { label: "Ideas", icon: Lightbulb, color: "text-amber-400" },
  { label: "Tasks", icon: CheckSquare, color: "text-emerald-400" },
  { label: "Flowcharts", icon: GitBranch, color: "text-blue-400" },
];

const highlights = [
  {
    icon: Lightbulb,
    title: "Capture ideas",
    description: "Turn sparks into structured notes before they get lost.",
    color: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: CheckSquare,
    title: "Track tasks",
    description: "Keep the work visible and move it forward with clarity.",
    color: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: GitBranch,
    title: "Map flowcharts",
    description: "Sketch decisions and dependencies without leaving the workspace.",
    color: "bg-blue-500/10 text-blue-400",
  },
];

const stats = [
  { label: "Teams shipped faster", value: "3x", icon: Zap },
  { label: "Secure by default", value: "SOC2", icon: Shield },
  { label: "Setup in", value: "< 1 min", icon: Clock },
  { label: "Active workspaces", value: "2.5k+", icon: Users },
];

export function LandingPage() {
  const router = useRouter();
  const { isReady, userId } = useSessionContext();

  useEffect(() => {
    if (isReady && userId) {
      router.replace("/dashboard");
    }
  }, [isReady, router, userId]);

  if (!isReady || userId) {
    return <div className="p-6"><LoadingState label="Loading" description="Preparing your workspace" /></div>;
  }

  return (
    <main className="page-animate relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/5 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-16">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section className="space-y-8">
            <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2 text-sm text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
              <span className="relative flex items-center gap-1">
                Private launchpad
                <span className="absolute -right-6 h-2 w-2 rounded-full bg-[var(--accent)] opacity-75 animate-pulse" />
              </span>
            </div>

            <div className="space-y-6">
              <p className="animate-fade-in text-xs uppercase tracking-[0.28em] text-[var(--muted)] [animation-delay:100ms]">
                PulseForge
              </p>
              <h1 className="animate-fade-in max-w-2xl text-5xl font-bold tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl [animation-delay:200ms]">
                <span className="bg-gradient-to-r from-[var(--foreground)] via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Give your work
                </span>
                <br />
                <span className="bg-gradient-to-r from-[var(--accent)] to-violet-400 bg-clip-text text-transparent">
                  a place to orbit.
                </span>
              </h1>
              <p className="animate-fade-in max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl [animation-delay:300ms]">
                Small launches compound faster than perfect plans. Build momentum with a workspace that keeps your ideas, tasks, and flowcharts in one calm place.
              </p>
            </div>

            <div className="animate-fade-in flex flex-wrap items-center gap-4 [animation-delay:400ms]">
              <Button className="group relative h-11 overflow-hidden px-6 text-base" asChild>
                <Link href="/register">
                  <span className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2">
                    Get started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>

              <Link href="/login" className="group flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
                Already have an account?
                <span className="underline underline-offset-4 transition-colors group-hover:text-[var(--accent)]">Sign in</span>
              </Link>
            </div>

            <div className="animate-fade-in flex flex-wrap gap-3 [animation-delay:500ms]">
              {missionPills.map((pill) => {
                const Icon = pill.icon;
                return (
                  <span
                    key={pill.label}
                    className="group inline-flex cursor-default items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-5 py-2.5 text-sm text-[var(--muted)] transition-all hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5"
                  >
                    <Icon className={`h-4 w-4 ${pill.color} transition-transform group-hover:scale-110`} />
                    {pill.label}
                  </span>
                );
              })}
            </div>

            <div className="animate-fade-in grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4 [animation-delay:600ms]">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-xl border border-[color:var(--card-border)] bg-[var(--surface)]/50 p-4">
                    <Icon className="mb-2 h-5 w-5 text-[var(--accent)]" />
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
                    <p className="text-xs text-[var(--muted)]">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <Card className="animate-fade-in border-zinc-800/50 bg-zinc-950/40 backdrop-blur-sm [animation-delay:300ms]">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                What&apos;s inside
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="group flex items-start gap-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/60"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-zinc-100">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.description}</p>
                      </div>
                      <span className="text-xs font-medium text-zinc-600">0{index + 1}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-100">Your momentum</span>
                  <span className="text-sm text-emerald-400">+12% this week</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>Progress</span>
                  <span>82%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-violet-500 transition-all duration-1000"
                    style={{ width: "82%" }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    On track
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
                    3 tasks remaining
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5">
                <p className="mb-3 text-sm font-medium text-zinc-100">Recent activity</p>
                <div className="space-y-3">
                  {[
                    { name: "Design review", action: "completed", time: "2h ago" },
                    { name: "API planning", action: "in progress", time: "4h ago" },
                    { name: "User research", action: "started", time: "1d ago" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{item.name}</span>
                      <span className="text-zinc-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
