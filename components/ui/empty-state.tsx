import { Inbox } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  minHeight?: string;
}

export function EmptyState({
  icon = <Inbox className="h-12 w-12" />,
  title,
  description,
  action,
  minHeight = "min-h-[55vh]",
}: EmptyStateProps) {
  return (
    <div
      className={`flex ${minHeight} items-center justify-center rounded-3xl border border-dashed border-[color:var(--card-border)] bg-[var(--surface-strong)]/50 p-8 text-center`}
    >
      <div className="space-y-3">
        <div className="flex justify-center text-[var(--muted)]">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            type="button"
            className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-strong)]"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
