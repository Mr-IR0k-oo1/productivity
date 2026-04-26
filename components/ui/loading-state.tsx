import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  description?: string;
  minHeight?: string;
  fullPage?: boolean;
}

export function LoadingState({
  label = "Loading",
  description,
  minHeight = "min-h-[200px]",
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex ${minHeight} ${fullPage ? "min-h-screen" : ""} items-center justify-center rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-8 text-center`}
    >
      <div className="space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-accent)]" />
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{label}</p>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}