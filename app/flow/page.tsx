import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FlowConnector } from "@/components/flow/FlowConnector";
import { FlowStepCard } from "@/components/flow/FlowStepCard";
import { StepTimeline } from "@/components/flow/StepTimeline";
import { FLOW_STEPS } from "@/components/flow/flow-content";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Orbit | How It Works",
  description: "See how ideas turn into tasks, schedules, tracked work, and real results in Orbit.",
};

export default function FlowPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-16 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(18,18,18,0.96),rgba(10,10,10,0.98))] px-6 py-12 sm:px-10 lg:px-12">
          <div className="pointer-events-none absolute -left-12 top-16 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="relative">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-sky-400/80">How Orbit Works</p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                From idea to results in one visible, connected flow
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
                Explore how teams capture ideas, shape them into tasks, schedule the work, track real effort, and learn from the results without breaking context across tools.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  asChild
                  className="h-12 rounded-2xl bg-sky-600 px-6 text-base font-semibold text-white hover:bg-sky-500"
                >
                  <Link href="/auth">Start Free</Link>
                </Button>
                <Button asChild variant="secondary" className="h-12 rounded-2xl px-6 text-base">
                  <Link href={FLOW_STEPS[0].marketingHref}>
                    Explore the first step
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="text-sm text-zinc-500">Five connected steps</div>
                <div className="mt-3 text-3xl font-semibold text-white">Ideas to insights</div>
              </div>
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="text-sm text-zinc-500">Public product tour</div>
                <div className="mt-3 text-3xl font-semibold text-white">Safe for signed-out visitors</div>
              </div>
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="text-sm text-zinc-500">Direct live routes</div>
                <div className="mt-3 text-3xl font-semibold text-white">Jump into the real workspace</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12">
          <StepTimeline steps={FLOW_STEPS} />
        </div>

        <div className="mt-12 space-y-5 xl:hidden">
          {FLOW_STEPS.map((step, index) => (
            <div key={step.slug} className="space-y-3">
              <FlowStepCard step={step} />
              {index < FLOW_STEPS.length - 1 ? <FlowConnector orientation="vertical" /> : null}
            </div>
          ))}
        </div>

        <div className="mt-12 hidden xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center xl:gap-6">
          {FLOW_STEPS.map((step, index) => (
            <div key={step.slug} className="contents">
              <FlowStepCard step={step} align="center" />
              {index < FLOW_STEPS.length - 1 ? <FlowConnector /> : null}
            </div>
          ))}
        </div>

        <section className="mt-16 rounded-[2rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(18,18,18,0.95),rgba(10,10,10,0.95))] px-8 py-12 text-center sm:px-12">
          <h2 className="text-3xl font-semibold sm:text-4xl">Ready to get your team in flow?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Start with your next idea, bring the team into one calm workspace, and turn motion into measurable progress.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              className="h-14 rounded-2xl bg-sky-600 px-10 text-lg font-medium text-white hover:bg-sky-700"
            >
              <Link href="/auth">Start Free - No Credit Card Needed</Link>
            </Button>
            <Button asChild variant="secondary" className="h-14 rounded-2xl px-8 text-lg">
              <Link href={FLOW_STEPS[0].marketingHref}>View step details</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
