import { create } from "zustand";

type UIState = {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  toggleSidebar: () => void;
  setSearchOpen: (value: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  searchOpen: false,
  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),
  setSearchOpen: (value) => set({ searchOpen: value }),
}));
