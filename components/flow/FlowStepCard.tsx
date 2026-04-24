import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { FlowStep } from "@/components/flow/flow-content";
import { cn } from "@/lib/utils";

type FlowStepCardProps = {
  step: FlowStep;
  align?: "left" | "center";
};

export function FlowStepCard({ step, align = "left" }: FlowStepCardProps) {
  const Icon = step.icon;

  return (
    <Link
      href={step.marketingHref}
      className={cn(
        "group relative block overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#121212]/95 p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-[#161616]",
        step.accent.cardHoverClassName,
        align === "center" ? "text-center" : "text-left",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-12 top-0 h-24 blur-3xl", step.accent.glowClassName)} />
      <div className="relative">
        <div className={cn("mb-5 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]", step.accent.tagClassName)}>
          {step.detailEyebrow}
        </div>
        <div
          className={cn(
            "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl",
            step.accent.iconWrapClassName,
            align === "center" ? "mx-auto" : "",
          )}
        >
          <Icon className="h-9 w-9" />
        </div>
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white">{step.stepTitle}</h2>
        <p className="text-base leading-7 text-zinc-400">{step.description}</p>
        <div
          className={cn(
            "mt-8 inline-flex items-center gap-2 text-sm font-medium text-white transition-transform duration-200 group-hover:translate-x-1",
            align === "center" ? "justify-center" : "",
          )}
        >
          Explore {step.detailEyebrow}
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
