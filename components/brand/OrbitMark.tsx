import { cn } from "@/lib/utils";

/** Orbit's mark: a planet with one orbit, drawn in the accent colour. */
export function OrbitMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[var(--color-on-accent)]", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-24 12 12)" />
      </svg>
    </span>
  );
}
