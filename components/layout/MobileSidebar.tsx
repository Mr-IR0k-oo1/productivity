"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Blocks,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  MoonStar,
  Search,
  Settings,
  ShieldCheck,
  SunMedium,
  Target,
  Users2,
  Workflow,
  X,
  Zap,
} from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useNotificationsQuery } from "@/hooks/useNotifications";
import { useProfileQuery } from "@/hooks/useProfile";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Day", href: "/my-day", icon: SunMedium },
  { name: "Inbox", href: "/inbox", icon: Bell, isInbox: true },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Documents", href: "/docs", icon: BookOpen },
  { name: "Backlog", href: "/backlog", icon: ListTodo },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Team", href: "/teams", icon: Users2 },
  { name: "Time", href: "/time", icon: Clock },
  { name: "Flowcharts", href: "/flowcharts", icon: Workflow },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Automations", href: "/automations", icon: Zap },
  { name: "Integrations", href: "/integrations", icon: Blocks },
];

const managementNavItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Admin", href: "/admin", icon: ShieldCheck, roles: ["owner", "admin"] as const },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const mobileMenuOpen = useUIStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((state) => state.setMobileMenuOpen);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const { workspaceRole } = useSessionContext();
  const isPrivilegedRole = workspaceRole === "owner" || workspaceRole === "admin";
  const visibleManagementItems = managementNavItems.filter((item) => !("roles" in item) || isPrivilegedRole);
  const roleLabel = workspaceRole === "owner" ? "Owner" : workspaceRole === "admin" ? "Admin" : "Member";
  const profile = useProfileQuery().data;
  const displayName = profile?.fullName?.trim() || profile?.email || roleLabel;
  const userInitial = displayName.charAt(0).toUpperCase() || "?";
  const notifications = useNotificationsQuery().data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!mobileMenuOpen) return null;

  const handleClose = () => setMobileMenuOpen(false);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="space-panel fixed inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-[color:var(--card-border)] bg-[var(--color-space)] shadow-2xl animate-slide-in-left">
        {/* Brand & Close */}
        <div className="flex h-14 items-center justify-between border-b border-[color:var(--card-border)] px-4">
          <Link href="/dashboard" onClick={handleClose} aria-label="Orbit dashboard">
            <BrandLogo className="text-[var(--color-space-text)]" />
          </Link>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-[var(--color-space-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-white"
            type="button"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 pb-1">
          <WorkspaceSwitcher isCollapsed={false} />
        </div>

        {/* Quick Search */}
        <div className="px-3 py-1">
          <button
            type="button"
            onClick={() => {
              handleClose();
              setSearchOpen(true);
            }}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 text-xs text-[var(--color-space-muted)] transition-colors hover:text-white"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search workspace…</span>
            <kbd className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--color-accent)]/20 text-white shadow-xs ring-1 ring-[var(--color-accent)]/40 font-semibold"
                      : "text-[var(--color-space-muted)] hover:bg-[var(--surface-hover)] hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-[var(--color-accent)]" : "text-[var(--color-space-muted)]",
                    )}
                  />
                  <span>{item.name}</span>
                  {item.isInbox && unreadCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                  {isActive && !item.isInbox && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 pt-2 border-t border-[var(--color-border-secondary)]">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Admin & Setup
            </div>
            {visibleManagementItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--color-accent)]/20 text-white shadow-xs ring-1 ring-[var(--color-accent)]/40 font-semibold"
                      : "text-[var(--color-space-muted)] hover:bg-[var(--surface-hover)] hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-[var(--color-accent)]" : "text-[var(--color-space-muted)]",
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Profile & Actions */}
        <div className="border-t border-[color:var(--card-border)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              onClick={handleClose}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-white">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-[var(--color-space-muted)]">{roleLabel}</p>
              </div>
            </Link>

            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--color-space-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-white"
              type="button"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
