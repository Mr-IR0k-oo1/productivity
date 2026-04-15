"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { LoadingState } from "@/components/ui/loading-state";

const missionPills = ["Ideas", "Tasks", "Flowcharts"];
const highlights = [
  {
    title: "Capture ideas",
    description: "Turn sparks into structured notes before they get lost.",
  },
  {
    title: "Track tasks",
    description: "Keep the work visible and move it forward with clarity.",
  },
  {
    title: "Map flowcharts",
    description: "Sketch decisions and dependencies without leaving the workspace.",
  },
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
    <main className="page-animate mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted)]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            Private launchpad
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">PulseForge</p>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              Give your work a place to orbit.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Small launches compound faster than perfect plans. Build momentum with a workspace that keeps your ideas, tasks, and flowcharts in one calm place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/register">
                Register
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <p className="text-sm text-[var(--muted)]">Start in under a minute.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {missionPills.map((pill) => (
              <span key={pill} className="rounded-full border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--muted)]">
                {pill}
              </span>
            ))}
          </div>
        </section>

        <Card className="border-zinc-900 bg-zinc-950/60">
          <CardHeader className="border-b border-zinc-900 pb-4">
            <CardTitle className="text-xl">What’s inside</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-3">
              {highlights.map((item, index) => (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-100">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                <span>Momentum</span>
                <span>Ready</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-900">
                <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: "82%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}