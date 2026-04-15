import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  minHeight?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  minHeight = "min-h-[55vh]",
}: ErrorStateProps) {
  return (
    <div
      className={`flex ${minHeight} items-center justify-center rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8 text-center`}
    >
      <div className="space-y-3">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
        <div>
          <h3 className="text-lg font-semibold text-rose-200">{title}</h3>
          <p className="mt-1 text-sm text-rose-300">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/30"
          >
            <RotateCcw className="h-4 w-4" />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
