"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
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
  ListTodo,
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
import { OrbitMark } from "@/components/brand/OrbitMark";
import { useMarkNotificationsRead, useNotificationsQuery } from "@/hooks/useNotifications";
import { useProfileQuery } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { fetchApiJson } from "@/lib/api/client";
import { REMEMBER_ME_STORAGE_KEY, WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";


const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Day", href: "/my-day", icon: SunMedium },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Backlog", href: "/backlog", icon: ListTodo },
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
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const { workspaceRole } = useSessionContext();
  const isPrivilegedRole = workspaceRole === "owner" || workspaceRole === "admin";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => !("roles" in item) || isPrivilegedRole);
  const roleLabel = workspaceRole === "owner" ? "Owner" : workspaceRole === "admin" ? "Admin" : "Member";
  const profile = useProfileQuery().data;
  const displayName = profile?.fullName?.trim() || profile?.email || roleLabel;
  const userInitial = displayName.charAt(0).toUpperCase() || "?";
  const notifications = useNotificationsQuery().data ?? [];
  const hasUnread = notifications.some((notification) => !notification.isRead);
  const markRead = useMarkNotificationsRead();

  const handleSignOut = async () => {
    try {
      await fetchApiJson("/api/auth/logout", {
        method: "POST",
        session: {},
      });
    } catch {
      // Ignore cookie clearing failures and continue with the client sign-out.
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
        "hidden h-screen shrink-0 flex-col border-r border-[color:var(--card-border)] bg-[var(--surface)] transition-[width] duration-200 ease-out md:flex",
        isCollapsed ? "w-[64px]" : "w-[232px]",
      )}
    >
      {/* ── Brand Header ── */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <OrbitMark className="h-7 w-7" />
          {!isCollapsed && (
            <span className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">Orbit</span>
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
      <div className={cn("px-3 pb-2", isCollapsed && "px-2")}>
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
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-full items-center gap-2 rounded-md border border-[color:var(--card-border)] bg-[var(--background)] px-3 text-sm text-[var(--muted)] transition-colors hover:border-[var(--border-tertiary)] hover:text-[var(--foreground)]"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="flex-1 text-left">Search…</span>
            <span className="flex items-center gap-0.5 text-[10px]">
              <Command className="h-3 w-3" aria-hidden="true" />K
            </span>
          </button>
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
                  "group relative flex w-full items-center rounded-md transition-colors duration-150",
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
              {hasUnread && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
              )}
            </button>

            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--color-on-accent)]"
              title="View Profile"
            >
              {userInitial}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Link
                  href="/profile"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--color-on-accent)]"
                  title="View Profile"
                >
                  {userInitial}
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--foreground)]">{displayName}</p>
                  <p className="truncate text-[11px] text-[var(--muted)]">{roleLabel}</p>
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
                      {hasUnread && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6 shadow-2xl shadow-black/40 animate-scale-in">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold text-[var(--foreground)]">Notifications</Dialog.Title>
                        {hasUnread ? (
                          <button
                            type="button"
                            onClick={() => markRead.mutate("all")}
                            className="ml-auto mr-2 text-xs text-[var(--accent)] hover:underline"
                          >
                            Mark all read
                          </button>
                        ) : null}
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
                        {notifications.length === 0 ? (
                          <p className="py-8 text-center text-sm text-[var(--muted)]">You&apos;re all caught up.</p>
                        ) : (
                          notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={notification.link ?? "#"}
                              onClick={() => {
                                if (!notification.isRead) markRead.mutate(notification.id);
                                setNotificationsOpen(false);
                              }}
                              className={cn(
                                "block rounded-xl border border-[color:var(--card-border)] p-3 transition-colors hover:bg-[var(--surface-hover)]",
                                !notification.isRead && "border-l-2 border-l-blue-500"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className={cn("text-sm font-medium", notification.isRead ? "text-[var(--muted)]" : "text-[var(--foreground)]")}>
                                    {notification.title}
                                  </p>
                                  {notification.body ? <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{notification.body}</p> : null}
                                </div>
                                <span className="shrink-0 text-[11px] text-[var(--muted)]">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </Link>
                          ))
                        )}
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
