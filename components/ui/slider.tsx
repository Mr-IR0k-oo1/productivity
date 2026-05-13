"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type SliderProps = React.ComponentPropsWithoutRef<"input"> & {
  label?: string;
  showValue?: boolean;
};

export function Slider({ className, label, showValue = true, value, onChange, ...props }: SliderProps) {
  const displayValue = value === undefined ? "" : Number(value).toFixed(2);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>{label}</span>
          {showValue && <span>{displayValue}</span>}
        </div>
      )}
      <div className="relative flex items-center">
        <input
          type="range"
          value={value}
          onChange={onChange}
          className={cn(
            "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-surface-strong)]",
            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-[var(--color-surface)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-accent)] [&::-moz-range-thumb]:border-0",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}