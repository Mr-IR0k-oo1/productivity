"use client";

import { useEffect } from "react";

import { resolveTheme, useUIStore } from "@/stores/ui-store";

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeSync() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    applyTheme(resolveTheme(theme));

    if (theme !== "system" || !window.matchMedia) {
      return;
    }

    // Follow the OS live while no explicit choice is saved.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(resolveTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}
