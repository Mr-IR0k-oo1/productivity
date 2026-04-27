"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: EmptyStateAction;
  minHeight?: string;
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ action, children, className, description, icon, minHeight, title, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-8 text-center",
        minHeight,
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface-elevated)] text-[var(--foreground)]">
          {icon}
        </div>
      ) : null}
      {title ? <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3> : null}
      {description ? (
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">{description}</p>
      ) : null}
      {action ? (
        <Button type="button" className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
      {children}
    </div>
  ),
);
EmptyState.displayName = "EmptyState";
