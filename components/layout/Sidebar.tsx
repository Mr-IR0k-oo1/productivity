"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { fetchApiJson } from "@/lib/api/client";
import { supabaseClient as supabase } from "@/lib/supabase/client";
import { WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Time", href: "/time", icon: Clock },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Admin", href: "/admin", icon: ShieldCheck, roles: ["owner", "admin"] as const },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const { workspaceRole } = useSessionContext();
  const isPrivilegedRole = workspaceRole === "owner" || workspaceRole === "admin";
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

      <div className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            type="text"
            placeholder={isCollapsed ? "" : "Search..."}
            className="pl-11 pr-14"
          />
          {!isCollapsed && (
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-[var(--muted)]">
              <Command className="h-3 w-3" />K
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group mx-2 mb-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all",
                isActive
                  ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-[var(--foreground)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]",
                )}
              />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[color:var(--card-border)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-strong)] text-lg font-medium text-[var(--foreground)]">
              U
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{roleLabel}</p>
                <p className="text-xs text-[var(--muted)]">you@example.com</p>
              </div>
            )}
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

            <button
              className="rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-4 space-y-2 border-t border-[color:var(--card-border)] pt-4">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
            >
              <User className="h-4 w-4" />
              View Profile
            </Link>
            <button
              onClick={handleSignOut}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
