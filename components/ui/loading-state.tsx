import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  description?: string;
  minHeight?: string;
}

export function LoadingState({
  label = "Loading",
  description,
  minHeight = "min-h-[55vh]",
}: LoadingStateProps) {
  return (
    <div
      className={`flex ${minHeight} items-center justify-center rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-8 text-center`}
    >
      <div className="space-y-3">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--accent)]" />
        <div>
          <p className="font-medium text-[var(--foreground)]">{label}</p>
          {description && (
            <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
