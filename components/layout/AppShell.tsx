"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

type AppShellProps = {
  children: ReactNode;
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/my-day": "My Day",
  "/ideas": "Ideas",
  "/tasks": "Tasks",
  "/calendar": "Calendar",
  "/flowcharts": "Flowcharts",
  "/time": "Time Tracking",
  "/reports": "Reports",
  "/settings": "Settings",
  "/admin": "Admin",
  "/profile": "Profile",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  
  for (const [route, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(`${route}/`)) return title;
  }
  
  return "Orbit";
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTaskFocusRoute = pathname === "/tasks" && searchParams.has("taskId");
  const isFlowchartEditorRoute = /^\/flowcharts\/[^/]+$/.test(pathname);
  const isPublicFlowchartRoute = /^\/f\/[^/]+$/.test(pathname);

  useKeyboardShortcuts(true);

  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/tasks/") ||
    isTaskFocusRoute ||
    isFlowchartEditorRoute ||
    isPublicFlowchartRoute
  ) {
    return <>{children}</>;
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
