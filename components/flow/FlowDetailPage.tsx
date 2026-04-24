import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BenefitList } from "@/components/flow/BenefitList";
import { FeatureHighlightCard } from "@/components/flow/FeatureHighlightCard";
import { InteractiveDemo } from "@/components/flow/InteractiveDemo";
import { StepTimeline } from "@/components/flow/StepTimeline";
import {
  FLOW_STEPS,
  getNextFlowStep,
  type FlowStep,
} from "@/components/flow/flow-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FlowDetailPageProps = {
  step: FlowStep;
};

export function FlowDetailPage({ step }: FlowDetailPageProps) {
  const Icon = step.icon;
  const nextStep = getNextFlowStep(step.slug);

  return (
    <main className="min-h-screen overflow-hidden bg-[#090909] px-6 py-14 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(18,18,18,0.95),rgba(9,9,9,0.98))] px-6 py-10 sm:px-10 lg:px-12">
          <div className={cn("pointer-events-none absolute right-10 top-10 h-40 w-40 rounded-full blur-3xl", step.accent.glowClassName)} />
          <div className="relative">
            <Link
              href="/flow"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the full flow
            </Link>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <div className={cn("inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]", step.accent.tagClassName)}>
                  {step.detailEyebrow}
                </div>
                <div
                  className={cn(
                    "mt-6 flex h-16 w-16 items-center justify-center rounded-2xl",
                    step.accent.iconWrapClassName,
                  )}
                >
                  <Icon className="h-9 w-9" />
                </div>
                <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {step.detailTitle}
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
                  {step.detailDescription}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button
                    asChild
                    className={cn("h-12 rounded-2xl px-6 text-base font-semibold", step.accent.buttonClassName)}
                  >
                    <Link href={step.appHref}>{step.appLabel}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="h-12 rounded-2xl px-6 text-base"
                  >
                    <Link href={nextStep.marketingHref}>
                      Next Step
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className={cn("rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6", step.accent.borderClassName)}>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Where this step leads</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{nextStep.stepTitle}</h2>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{nextStep.description}</p>
                <div className="mt-6 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
                  <div className="text-sm text-zinc-500">Live product route</div>
                  <div className="mt-2 text-lg font-semibold text-white">{step.appHref}</div>
                  <div className="mt-1 text-sm text-zinc-400">{step.appLabel}</div>
                </div>
                <div className="mt-5 flex items-center justify-between rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-zinc-100">Next marketing page</div>
                    <div className="mt-1 text-sm text-zinc-500">{nextStep.marketingHref}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-zinc-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12">
          <InteractiveDemo variant={step.demoVariant} />
        </div>

        <section className="mt-12 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6 lg:grid-cols-3">
            {step.highlights.map((highlight) => (
              <FeatureHighlightCard
                key={highlight.title}
                highlight={highlight}
                accent={step.accent}
              />
            ))}
          </div>
          <BenefitList items={step.benefits} accent={step.accent} />
        </section>

        <div className="mt-12">
          <StepTimeline steps={FLOW_STEPS} currentSlug={step.slug} />
        </div>

        <section className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 px-6 py-6 sm:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Keep exploring</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Return to the full journey or continue to the next step
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="h-11 rounded-2xl px-5">
              <Link href="/flow">Back to Flow</Link>
            </Button>
            <Button
              asChild
              className={cn("h-11 rounded-2xl px-5 text-base font-semibold", step.accent.buttonClassName)}
            >
              <Link href={nextStep.marketingHref}>
                Continue to {nextStep.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
