"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

type AppShellProps = {
  children: ReactNode;
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/my-day": "My Day",
  "/ideas": "Ideas",
  "/backlog": "Backlog",
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

  const router = useRouter();
  const { needsLogin } = useSessionContext();
  const isPublicRoute =
    pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/auth") || isPublicFlowchartRoute;

  useKeyboardShortcuts(true);

  useEffect(() => {
    if (needsLogin && !isPublicRoute) {
      router.replace("/login");
    }
  }, [isPublicRoute, needsLogin, router]);

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
        <CommandPalette />
        <main className="flex-1 overflow-y-auto bg-[var(--background)] px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
