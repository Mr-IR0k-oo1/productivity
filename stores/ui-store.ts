import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "dark" | "light";

type UIState = {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  theme: ThemeMode;
  toggleSidebar: () => void;
  setSearchOpen: (value: boolean) => void;
  toggleTheme: () => void;
  setTheme: (value: ThemeMode) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      searchOpen: false,
      theme: "dark",
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setSearchOpen: (value) => set({ searchOpen: value }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
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
