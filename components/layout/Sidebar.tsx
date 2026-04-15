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
  User,
  Workflow,
  X,
} from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { fetchApiJson } from "@/lib/api/client";
import { supabaseClient as supabase } from "@/lib/supabase/client";
import { WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";

const sampleNotifications = [
  { id: 1, title: "New task assigned", message: "You have been assigned to 'Design landing page'", time: "2 min ago", unread: true },
  { id: 2, title: "Meeting reminder", message: "Team standup starts in 15 minutes", time: "15 min ago", unread: true },
  { id: 3, title: "Task completed", message: "'Setup CI/CD pipeline' has been marked complete", time: "1 hour ago", unread: false },
  { id: 4, title: "New comment", message: "Alice commented on 'API integration'", time: "2 hours ago", unread: false },
];

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Flowcharts", href: "/flowcharts", icon: Workflow },
  { name: "Time", href: "/time", icon: Clock },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Admin", href: "/admin", icon: ShieldCheck, roles: ["owner", "admin"] as const },
];

const sidebarNavIconClass = "h-5 w-5 shrink-0";
const sidebarCollapsedNavIconClass = "h-[18px] w-[18px] shrink-0";

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
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <div
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-[color:var(--card-border)] bg-[var(--surface)] transition-all duration-300 md:flex",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex items-center justify-between border-b border-[color:var(--card-border)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-bold text-[var(--background)]">
            P
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">PulseForge</h1>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
          aria-label="Collapse"
          title="Collapse"
          type="button"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={cn("p-6", isCollapsed ? "px-4" : "px-6")}> 
        {isCollapsed ? (
          <button
            type="button"
            aria-label="Search"
            title="Search"
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
          >
            <Search className="h-5 w-5 shrink-0" />
          </button>
        ) : (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input type="text" placeholder="Search..." className="pl-11 pr-14" />
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-[var(--muted)]">
              <Command className="h-3 w-3" />K
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.name}
              title={item.name}
              className={cn(
                "group mb-1 flex w-full items-center rounded-2xl transition-all",
                isCollapsed ? "justify-center px-0 py-3.5" : "gap-3 px-4 py-3.5",
                isActive
                  ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon
                className={cn(
                  isCollapsed ? sidebarCollapsedNavIconClass : sidebarNavIconClass,
                  isActive ? "text-[var(--foreground)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]",
                )}
              />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-auto border-t border-[color:var(--card-border)]", isCollapsed ? "p-4" : "p-6")}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleTheme}
                className="rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                type="button"
                aria-label="Toggle theme"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
              </button>

              <button
                className="rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                type="button"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>

            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-strong)] text-lg font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent-soft)]"
              title="View Profile"
            >
              U
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-strong)] text-lg font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent-soft)]"
                  title="View Profile"
                >
                  U
                </Link>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{roleLabel}</p>
                  <p className="text-xs text-[var(--muted)]">you@example.com</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                  type="button"
                  aria-label="Toggle theme"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
                </button>

                <Dialog.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <Dialog.Trigger asChild>
                    <button
                      className="relative rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                      type="button"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {sampleNotifications.some((n) => n.unread) && (
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/40">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">Notifications</Dialog.Title>
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
                            aria-label="Close"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </Dialog.Close>
                      </div>
                      <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto">
                        {sampleNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "rounded-xl border border-[color:var(--card-border)] p-4 transition-colors hover:bg-[var(--surface-strong)]",
                              notification.unread && "border-l-2 border-l-blue-500"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className={cn("text-sm font-medium", notification.unread ? "text-[var(--foreground)]" : "text-[var(--muted)]")}>
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-xs text-[var(--muted)]">{notification.message}</p>
                              </div>
                              <span className="shrink-0 text-xs text-[var(--muted)]">{notification.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>

            <div className="mt-4 border-t border-[color:var(--card-border)] pt-4">
              <button
                onClick={handleSignOut}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
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
