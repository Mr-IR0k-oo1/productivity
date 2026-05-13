"use client";

import { Lock } from "lucide-react";

export default function LockBadge({ locked }: { locked: boolean }) {
  if (!locked) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-2 top-2 rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface)]/90 p-1 text-[var(--color-text-secondary)] shadow-sm">
      <Lock className="h-3.5 w-3.5" />
    </div>
  );
}
