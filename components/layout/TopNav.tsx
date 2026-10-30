"use client";

import { Command, Search } from "lucide-react";

import { useUIStore } from "@/stores/ui-store";

interface TopNavProps {
  pageTitle?: string;
}

export default function TopNav({ pageTitle = "Orbit" }: TopNavProps) {
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[color:var(--card-border)] bg-[var(--surface)] px-6">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">{pageTitle}</h2>

      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-8 items-center gap-2 rounded-md border border-[color:var(--card-border)] bg-[var(--background)] px-3 text-xs text-[var(--muted)] transition-colors hover:border-[var(--border-tertiary)] hover:text-[var(--foreground)]"
        type="button"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Search</span>
        <kbd className="ml-3 flex items-center gap-0.5 font-sans text-[10px] text-[var(--color-text-tertiary)]">
          <Command className="h-2.5 w-2.5" aria-hidden="true" />K
        </kbd>
      </button>
    </header>
  );
}
