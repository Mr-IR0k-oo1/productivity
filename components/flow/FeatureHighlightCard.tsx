import type { FlowHighlight, FlowStepAccent } from "@/components/flow/flow-content";
import { cn } from "@/lib/utils";

type FeatureHighlightCardProps = {
  highlight: FlowHighlight;
  accent: FlowStepAccent;
};

export function FeatureHighlightCard({ highlight, accent }: FeatureHighlightCardProps) {
  return (
    <article className={cn("rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-6", accent.borderClassName)}>
      <div className={cn("inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", accent.tagClassName)}>
        {highlight.eyebrow}
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{highlight.title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{highlight.description}</p>
    </article>
  );
}
