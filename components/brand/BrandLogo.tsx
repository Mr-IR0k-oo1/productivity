import { QUANTRIX_SYMBOL_PATHS, QUANTRIX_WORDMARK_PATHS } from "@/components/brand/quantrix-paths";
import { cn } from "@/lib/utils";

/** The Quantrix Q symbol, cropped to its artwork and drawn in currentColor. */
export function QuantrixSymbol({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="355 277 543 681"
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {QUANTRIX_SYMBOL_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}

/** The QUANTRIX wordmark, drawn in currentColor. Height sets the size; width follows. */
export function QuantrixWordmark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 1678 212"
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {QUANTRIX_WORDMARK_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}

/**
 * Orbit's product mark: an open orbit ring with a satellite riding just outside the gap.
 * Drawn in currentColor; the satellite can take a second colour (the "flare").
 */
export function OrbitGlyph({ className, satelliteClassName }: { className?: string; satelliteClassName?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path d="M26.83 14.09A11 11 0 1 1 19.76 5.66" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="25.35" cy="8.16" r="2.8" fill="currentColor" className={satelliteClassName} />
    </svg>
  );
}

/** Orbit's mark on its own, for tight spaces (collapsed sidebar, auth screens). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <OrbitGlyph
      className={cn("h-7 w-7 shrink-0 text-[var(--color-accent)]", className)}
      satelliteClassName="fill-[var(--color-flare)]"
    />
  );
}

/** Orbit lockup: mark plus wordmark set in the display face. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className="h-7 w-7" />
      <span className="font-display text-[1.0625rem] font-semibold leading-none tracking-[-0.02em]">orbit</span>
    </span>
  );
}

/** "by QUANTRIX Studio" maker's credit, in currentColor. */
export function QuantrixCredit({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.6875rem] leading-none", className)}>
      <span>by</span>
      <QuantrixSymbol className="h-3 w-auto" />
      <QuantrixWordmark className="h-[0.5rem] w-auto" title="Quantrix" />
      <span>Studio</span>
    </span>
  );
}
