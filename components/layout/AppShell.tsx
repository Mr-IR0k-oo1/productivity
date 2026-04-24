"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTaskFocusRoute = pathname === "/tasks" && searchParams.has("taskId");

  useKeyboardShortcuts(true);

  if (
    pathname === "/" ||
    pathname === "/flow" ||
    pathname.startsWith("/flow/") ||
    pathname === "/how-it-works" ||
    pathname.startsWith("/how-it-works/") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/tasks/") ||
    isTaskFocusRoute
  ) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
