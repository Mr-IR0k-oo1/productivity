"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const handleColorChange = useCallback(
    (color: string) => {
      onChange(color);
      setOpen(false);
    },
    [onChange],
  );

  const customInput = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-[var(--color-border-secondary)] bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="h-8 w-20 rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
          placeholder="#000000"
        />
      </div>
    ),
    [value, onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded border border-[var(--color-border-secondary)]"
              style={{ backgroundColor: value }}
            />
            <span className="text-xs text-[var(--color-text-secondary)]">{value}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorChange(color)}
                className={`h-6 w-6 rounded border border-[var(--color-border-secondary)] transition-transform hover:scale-110 ${
                  value.toLowerCase() === color.toLowerCase() ? "ring-2 ring-[var(--color-accent)]" : ""
                }`}
                style={{ backgroundColor: color }}
              >
                {value.toLowerCase() === color.toLowerCase() && (
                  <Check className="m-auto h-3.5 w-3.5 text-white" />
                )}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">Custom color</div>
            {customInput}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}