"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  ChevronLeft,
  Clock,
  Command,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  MoonStar,
  Search,
  Settings,
  ShieldCheck,
  SunMedium,
  Workflow,
  X,
} from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { fetchApiJson } from "@/lib/api/client";
import { supabaseClient as supabase } from "@/lib/supabase/client";
import { REMEMBER_ME_STORAGE_KEY, WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";

const sampleNotifications = [
  { id: 1, title: "New task assigned", message: "You have been assigned to 'Design landing page'", time: "2 min ago", unread: true },
  { id: 2, title: "Meeting reminder", message: "Team standup starts in 15 minutes", time: "15 min ago", unread: true },
  { id: 3, title: "Task completed", message: "'Setup CI/CD pipeline' has been marked complete", time: "1 hour ago", unread: false },
  { id: 4, title: "New comment", message: "Alice commented on 'API integration'", time: "2 hours ago", unread: false },
];

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Day", href: "/my-day", icon: SunMedium },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Flowcharts", href: "/flowcharts", icon: Workflow },
  { name: "Time", href: "/time", icon: Clock },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Admin", href: "/admin", icon: ShieldCheck, roles: ["owner", "admin"] as const },
];

const sidebarNavIconClass = "h-[18px] w-[18px] shrink-0";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const { workspaceRole } = useSessionContext();
  const isPrivilegedRole = workspaceRole === "owner" || workspaceRole === "admin";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => !("roles" in item) || isPrivilegedRole);
  const roleLabel = workspaceRole === "owner" ? "Owner" : workspaceRole === "admin" ? "Admin" : "Member";

  const handleSignOut = async () => {
    try {
      await fetchApiJson("/api/auth/logout", {
        method: "POST",
        session: {},
      });
    } catch {
      // Ignore cookie clearing failures and continue with the client sign-out.
    }

    if (supabase) {
      await supabase.auth.signOut();
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <div
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-[color:var(--card-border)] bg-[var(--surface)] transition-all duration-300 ease-out md:flex",
        isCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* ── Brand Header ── */}
      <div className="flex items-center justify-between border-b border-[color:var(--card-border)] px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a7 7 0 0 1 0 14" />
            </svg>
          </div>
          {!isCollapsed && (
            <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Orbit</h1>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className={cn("px-3 pt-4 pb-2", isCollapsed && "px-2")}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex h-9 w-full items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <Input type="text" placeholder="Search..." className="h-9 rounded-lg border-none bg-[var(--surface-strong)] pl-9 pr-12 text-sm" />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[10px] text-[var(--muted)]">
              <Command className="h-3 w-3" />K
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <div className="space-y-0.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                title={item.name}
                className={cn(
                  "group relative flex w-full items-center rounded-lg transition-all duration-150",
                  isCollapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2",
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />
                )}
                <Icon
                  className={cn(
                    sidebarNavIconClass,
                    isActive ? "text-[var(--accent)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]",
                  )}
                />
                {!isCollapsed && <span className="text-[13px] font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className={cn("border-t border-[color:var(--card-border)]", isCollapsed ? "p-2" : "p-3")}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
              type="button"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </button>

            <button
              className="relative rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {sampleNotifications.some((n) => n.unread) && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
              )}
            </button>

            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-semibold text-white transition-transform hover:scale-105"
              title="View Profile"
            >
              U
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Link
                  href="/profile"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-semibold text-white transition-transform hover:scale-105"
                  title="View Profile"
                >
                  U
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--foreground)]">{roleLabel}</p>
                  <p className="truncate text-[11px] text-[var(--muted)]">you@example.com</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                  type="button"
                  aria-label="Toggle theme"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                </button>

                <Dialog.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <Dialog.Trigger asChild>
                    <button
                      className="relative rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                      type="button"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4" />
                      {sampleNotifications.some((n) => n.unread) && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6 shadow-2xl shadow-black/40 animate-scale-in">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold text-[var(--foreground)]">Notifications</Dialog.Title>
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </Dialog.Close>
                      </div>
                      <div className="mt-4 max-h-[400px] space-y-2 overflow-y-auto">
                        {sampleNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "rounded-xl border border-[color:var(--card-border)] p-3 transition-colors hover:bg-[var(--surface-hover)]",
                              notification.unread && "border-l-2 border-l-blue-500"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className={cn("text-sm font-medium", notification.unread ? "text-[var(--foreground)]" : "text-[var(--muted)]")}>
                                  {notification.title}
                                </p>
                                <p className="mt-0.5 text-xs text-[var(--muted)]">{notification.message}</p>
                              </div>
                              <span className="shrink-0 text-[11px] text-[var(--muted)]">{notification.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>

            <div className="mt-2 border-t border-[color:var(--card-border)] pt-2">
              <button
                onClick={handleSignOut}
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
