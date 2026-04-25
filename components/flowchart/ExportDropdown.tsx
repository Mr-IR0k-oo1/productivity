"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ExportDropdownProps = {
  onExport: (format: "png" | "svg" | "pdf" | "json") => void;
};

export default function ExportDropdown({ onExport }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((value) => !value)}>
        <Download className="h-4 w-4" />
        Export
      </Button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 min-w-[160px] rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2 shadow-2xl">
          {(["png", "svg", "pdf", "json"] as const).map((format) => (
            <button
              key={format}
              type="button"
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm capitalize text-[var(--color-text-primary)] hover:bg-[var(--color-surface-strong)]"
              onClick={() => {
                setOpen(false);
                onExport(format);
              }}
            >
              {format}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
