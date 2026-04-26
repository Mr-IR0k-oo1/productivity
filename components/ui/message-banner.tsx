import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
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
    iconColor: "text-[var(--color-success)]",
    borderColor: "border-[var(--color-success)]/30",
    bgColor: "bg-[var(--color-success)]/10",
    titleColor: "text-[var(--color-success)]",
    textColor: "text-[var(--color-success)]",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-[var(--color-error)]",
    borderColor: "border-[var(--color-error)]/30",
    bgColor: "bg-[var(--color-error)]/10",
    titleColor: "text-[var(--color-error)]",
    textColor: "text-[var(--color-error)]",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-[var(--color-warning)]",
    borderColor: "border-[var(--color-warning)]/30",
    bgColor: "bg-[var(--color-warning)]/10",
    titleColor: "text-[var(--color-warning)]",
    textColor: "text-[var(--color-warning)]",
  },
  info: {
    icon: Info,
    iconColor: "text-[var(--color-info)]",
    borderColor: "border-[var(--color-info)]/30",
    bgColor: "bg-[var(--color-info)]/10",
    titleColor: "text-[var(--color-info)]",
    textColor: "text-[var(--color-info)]",
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
      className={`flex items-start gap-3 rounded-xl border p-4 ${config.borderColor} ${config.bgColor}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor} mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-semibold ${config.titleColor}`}>{title}</h4>
        )}
        <p className={`text-sm ${title ? "mt-1" : ""} ${config.textColor}`}>
          {message}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            type="button"
            className={`mt-3 text-sm font-semibold underline hover:opacity-80 ${config.textColor}`}
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          type="button"
          className={`flex-shrink-0 ${config.iconColor} hover:opacity-80`}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}