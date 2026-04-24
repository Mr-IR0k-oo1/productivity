import Link from "next/link";

import type { FlowStep, FlowStepSlug } from "@/components/flow/flow-content";
import { cn } from "@/lib/utils";

type StepTimelineProps = {
  steps: FlowStep[];
  currentSlug?: FlowStepSlug;
};

export function StepTimeline({ steps, currentSlug }: StepTimelineProps) {
  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Flow Timeline</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">See the whole journey at a glance</h2>
        </div>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {steps.map((step) => {
          const isCurrent = step.slug === currentSlug;

          return (
            <Link
              key={step.slug}
              href={step.marketingHref}
              className={cn(
                "rounded-[1.5rem] border px-4 py-5 transition-colors",
                isCurrent
                  ? cn("bg-zinc-900 text-white", step.accent.borderClassName)
                  : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:text-white",
              )}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Step {step.order}</div>
              <div className="mt-3 text-lg font-semibold tracking-tight">{step.title}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{step.detailEyebrow}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
