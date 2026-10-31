"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

type AppShellProps = {
  children: ReactNode;
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/my-day": "My Day",
  "/my-day/focus": "Focus Mode",
  "/inbox": "Inbox & Triage",
  "/projects": "Project Portfolio",
  "/teams": "Team Management",
  "/goals": "Goals & OKRs",
  "/docs": "Documents",
  "/ideas": "Ideas",
  "/backlog": "Backlog",
  "/tasks": "Tasks",
  "/calendar": "Calendar",
  "/flowcharts": "Flowcharts",
  "/time": "Time Tracking",
  "/reports": "Reports",
  "/automations": "Automations",
  "/integrations": "Integrations",
  "/settings/roles": "Roles & Permissions Matrix",
  "/settings/audit": "Audit Log",
  "/settings/billing": "Billing & Subscriptions",
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

  // Marketing, auth, and onboarding pages: rendered without the app shell.
  const isMarketingRoute =
    ["/privacy", "/terms", "/cookies", "/security", "/features"].includes(pathname) || pathname.startsWith("/features/");
  const isAuthOrOnboardingRoute =
    ["/login", "/register", "/onboarding", "/forgot-password", "/reset-password"].includes(pathname) ||
    pathname.startsWith("/onboarding/");

  useKeyboardShortcuts(true);

  if (
    pathname === "/" ||
    pathname.startsWith("/tasks/") ||
    isTaskFocusRoute ||
    isFlowchartEditorRoute ||
    isPublicFlowchartRoute ||
    isMarketingRoute ||
    isAuthOrOnboardingRoute
  ) {
    return <>{children}</>;
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Ambient background glows for rich depth */}
      <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--color-accent-soft)_0%,transparent_70%)] blur-3xl opacity-60" />
      <div className="pointer-events-none absolute bottom-0 left-64 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(242,102,43,0.06)_0%,transparent_70%)] blur-3xl opacity-40" />

      <Sidebar />
      <MobileSidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav pageTitle={pageTitle} />
        <CommandPalette />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
