"use client";

import { useUIStore } from "@/stores/ui-store";
import { useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const pageShortcuts: Record<string, string> = {
  d: "/dashboard",
  i: "/ideas",
  t: "/tasks",
  c: "/calendar",
  m: "/my-day",
  f: "/flowcharts",
  r: "/reports",
  o: "/time",
  p: "/profile",
  s: "/settings",
};

export function useKeyboardShortcuts(enabled = true) {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const createButtonRef = useRef<HTMLButtonElement | null>(null);

  const registerSearchInput = useCallback((el: HTMLInputElement | null) => {
    searchInputRef.current = el;
  }, []);

  const registerCreateButton = useCallback((el: HTMLButtonElement | null) => {
    createButtonRef.current = el;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      if (ctrl && key === "k") {
        event.preventDefault();
        useUIStore.getState().setSearchOpen(true);
        return;
      }

      if (ctrl && key === "n") {
        event.preventDefault();
        createButtonRef.current?.click();
        return;
      }

      if (ctrl && key === "/") {
        event.preventDefault();
        return;
      }

      if (!ctrl && !shift && pageShortcuts[key] && pathname !== pageShortcuts[key]) {
        event.preventDefault();
        router.push(pageShortcuts[key]);
      }

      if (key === "?" || (shift && key === "/")) {
        event.preventDefault();
      }
    },
    [enabled, pathname, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { key: "Ctrl+K", description: "Focus search" },
      { key: "Ctrl+N", description: "Create new item" },
      { key: "D", description: "Go to Dashboard" },
      { key: "I", description: "Go to Ideas" },
      { key: "T", description: "Go to Tasks" },
      { key: "C", description: "Go to Calendar" },
      { key: "M", description: "Go to My Day" },
      { key: "F", description: "Go to Flowcharts" },
      { key: "R", description: "Go to Reports" },
      { key: "O", description: "Go to Time" },
      { key: "P", description: "Go to Profile" },
      { key: "S", description: "Go to Settings" },
    ],
    registerSearchInput,
    registerCreateButton,
  };
}