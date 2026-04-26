"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Toaster } from "sonner";

import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeSync } from "@/components/providers/ThemeSync";
import { useUIStore } from "@/stores/ui-store";
import { queryClient } from "@/lib/queryClient";

function ToasterWithTheme() {
  const theme = useUIStore((state) => state.theme);
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      richColors
      closeButton
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeSync />
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
      <ToasterWithTheme />
    </SessionProvider>
  );
}