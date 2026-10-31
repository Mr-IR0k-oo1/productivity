import { create } from "zustand";
import { persist } from "zustand/middleware";

/** "system" follows the operating system; resolved in components/providers/ThemeSync.tsx. */
export type ThemeMode = "dark" | "light" | "system";

type UIState = {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  mobileMenuOpen: boolean;
  theme: ThemeMode;
  toggleSidebar: () => void;
  setSearchOpen: (value: boolean) => void;
  setMobileMenuOpen: (value: boolean) => void;
  toggleTheme: () => void;
  setTheme: (value: ThemeMode) => void;
};

export function resolveTheme(theme: ThemeMode): "dark" | "light" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      searchOpen: false,
      mobileMenuOpen: false,
      theme: "system",
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setSearchOpen: (value) => set({ searchOpen: value }),
      setMobileMenuOpen: (value) => set({ mobileMenuOpen: value }),
      toggleTheme: () =>
        set((state) => ({
          theme: resolveTheme(state.theme) === "dark" ? "light" : "dark",
        })),
      setTheme: (value) => set({ theme: value }),
    }),
    {
      name: "orbit-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);
