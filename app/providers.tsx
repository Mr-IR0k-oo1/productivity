"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Toaster } from "sonner";

import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeSync } from "@/components/providers/ThemeSync";
import { queryClient } from "@/lib/queryClient";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeSync />
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
      />
    </SessionProvider>
  );
}
