import { Check } from "lucide-react";

import type { FlowStepAccent } from "@/components/flow/flow-content";
import { cn } from "@/lib/utils";

type BenefitListProps = {
  items: string[];
  accent: FlowStepAccent;
  title?: string;
};

export function BenefitList({
  items,
  accent,
  title = "Why teams use this step",
}: BenefitListProps) {
  return (
    <section className={cn("rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-6", accent.borderClassName)}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <span className={cn("mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full", accent.iconWrapClassName)}>
              <Check className="h-4 w-4" />
            </span>
            <p className="text-sm leading-7 text-zinc-300">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
