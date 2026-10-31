"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Bell,
  Command,
  Menu,
  MoonStar,
  Plus,
  Search,
  Sparkles,
  SunMedium,
  X,
} from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { useMarkNotificationsRead, useNotificationsQuery } from "@/hooks/useNotifications";
import { useProfileQuery } from "@/hooks/useProfile";
import { QuickCreateDropdown } from "@/components/layout/QuickCreateDropdown";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface TopNavProps {
  pageTitle?: string;
}

export default function TopNav({ pageTitle = "Orbit" }: TopNavProps) {
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const setMobileMenuOpen = useUIStore((state) => state.setMobileMenuOpen);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const { workspaceRole } = useSessionContext();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useNotificationsQuery().data ?? [];
  const hasUnread = notifications.some((notification) => !notification.isRead);
  const markRead = useMarkNotificationsRead();

  const profile = useProfileQuery().data;
  const roleLabel = workspaceRole === "owner" ? "Owner" : workspaceRole === "admin" ? "Admin" : "Member";
  const displayName = profile?.fullName?.trim() || profile?.email || roleLabel;
  const userInitial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/85 px-4 backdrop-blur-xl sm:px-6 transition-colors">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] md:hidden"
          type="button"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-tertiary)] sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_6px_var(--color-accent)]" />
            Orbit
          </span>
          <span className="hidden text-xs text-[var(--color-border-tertiary)] sm:inline">/</span>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-3 text-xs text-[var(--color-text-secondary)] shadow-xs transition-all hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          type="button"
          aria-label="Search workspace"
        >
          <Search className="h-3.5 w-3.5 transition-transform group-hover:scale-110" aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1.5 hidden items-center gap-0.5 rounded border border-[var(--color-border-secondary)] bg-[var(--color-background)] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[var(--color-text-tertiary)] sm:flex">
            <Command className="h-2.5 w-2.5" aria-hidden="true" />K
          </kbd>
        </button>

        {/* Global Quick Create */}
        <QuickCreateDropdown />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] shadow-xs transition-colors hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </button>

        {/* Notifications Modal */}
        <Dialog.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <Dialog.Trigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] shadow-xs transition-colors hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {hasUnread && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-flare)] ring-2 ring-[var(--color-surface)] shadow-[0_0_8px_var(--color-flare)]" />
              )}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                    Notifications
                  </Dialog.Title>
                  {hasUnread && (
                    <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                      New
                    </span>
                  )}
                </div>
                {hasUnread ? (
                  <button
                    type="button"
                    onClick={() => markRead.mutate("all")}
                    className="ml-auto mr-3 text-xs font-medium text-[var(--color-accent)] hover:underline"
                  >
                    Mark all read
                  </button>
                ) : null}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-4 max-h-[380px] space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">All caught up</p>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">You have no new notifications.</p>
                  </div>
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
                        "block rounded-xl border border-[var(--color-border-secondary)] p-3.5 transition-all hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)]",
                        !notification.isRead && "border-l-4 border-l-[var(--color-accent)] bg-[var(--color-accent-soft)]/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium leading-snug",
                              notification.isRead
                                ? "text-[var(--color-text-secondary)]"
                                : "text-[var(--color-text-primary)] font-semibold",
                            )}
                          >
                            {notification.title}
                          </p>
                          {notification.body ? (
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2">
                              {notification.body}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="mt-4 border-t border-[var(--color-border-secondary)] pt-3 text-center">
                <Link
                  href="/inbox"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                >
                  Open Inbox & Triage →
                </Link>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* User Profile Avatar Link */}
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-secondary)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-strong)] text-xs font-semibold text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
          title={`Profile (${displayName})`}
        >
          {userInitial}
        </Link>
      </div>
    </header>
  );
}
