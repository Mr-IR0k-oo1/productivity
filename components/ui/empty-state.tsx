"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const EmptyState = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-8 text-center",
        className,
      )}
      {...props}
    />
  ),
);
EmptyState.displayName = "EmptyState";