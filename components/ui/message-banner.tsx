import { AlertCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

type MessageType = "success" | "error" | "warning" | "info";

interface MessageBannerProps {
  type: MessageType;
  title?: string;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    borderClass: "border-emerald-500/40 bg-emerald-500/10",
    textClass: "text-emerald-400",
    titleClass: "text-emerald-200",
  },
  error: {
    icon: AlertCircle,
    borderClass: "border-rose-500/40 bg-rose-500/10",
    textClass: "text-rose-400",
    titleClass: "text-rose-200",
  },
  warning: {
    icon: AlertTriangle,
    borderClass: "border-amber-500/40 bg-amber-500/10",
    textClass: "text-amber-400",
    titleClass: "text-amber-200",
  },
  info: {
    icon: AlertCircle,
    borderClass: "border-blue-500/40 bg-blue-500/10",
    textClass: "text-blue-400",
    titleClass: "text-blue-200",
  },
};

export function MessageBanner({
  type,
  title,
  message,
  onDismiss,
  dismissible = true,
  action,
}: MessageBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const config = typeConfig[type];
  const Icon = config.icon;

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${config.borderClass}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${config.textClass} mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-medium ${config.titleClass}`}>{title}</h4>
        )}
        <p className={`text-sm ${title ? "mt-1" : ""} ${config.textClass}`}>
          {message}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            type="button"
            className={`mt-3 text-sm font-medium ${config.textClass} underline hover:opacity-80`}
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          type="button"
          className={`flex-shrink-0 ${config.textClass} hover:opacity-80`}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
