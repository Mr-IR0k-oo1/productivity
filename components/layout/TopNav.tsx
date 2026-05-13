"use client";

import { useEffect, useState } from "react";
import { Search, Command, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface TopNavProps {
  pageTitle?: string;
}

function useCurrentTime() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

export default function TopNav({ pageTitle = "Orbit" }: TopNavProps) {
  const searchOpen = useUIStore((state) => state.searchOpen);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const time = useCurrentTime();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[color:var(--card-border)] bg-[var(--surface)]/60 px-6 backdrop-blur-md">
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        <h2 className="text-[13px] font-semibold text-[var(--foreground)]">{pageTitle}</h2>
      </div>

      {/* Right: search + time */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--border-tertiary)] hover:text-[var(--foreground)]"
          type="button"
        >
          <Search className="h-3 w-3" />
          <span>Search</span>
          <span className="ml-2 flex items-center gap-0.5 text-[10px] opacity-50">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Sparkles className="h-3 w-3 text-[var(--accent)]" />
          <span>{time}</span>
        </div>
      </div>
    </header>
  );
}