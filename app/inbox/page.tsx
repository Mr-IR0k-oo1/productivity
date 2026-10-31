"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Filter,
  Inbox as InboxIcon,
  MessageSquare,
  Search,
  Sparkles,
  Tag,
  UserCheck,
  Zap,
} from "lucide-react";

import { useMarkNotificationsRead, useNotificationsQuery, type NotificationDTO } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type InboxTab = "all" | "unread" | "assignments" | "mentions" | "projects";

function getNotificationTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "assignment":
    case "assigned":
      return <UserCheck className="h-4 w-4 text-emerald-500" />;
    case "mention":
    case "mentioned":
      return <Tag className="h-4 w-4 text-blue-500" />;
    case "comment":
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case "deadline":
    case "due":
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Bell className="h-4 w-4 text-[var(--color-accent)]" />;
  }
}

export default function InboxPage() {
  const { data: notifications = [], isLoading, isError, refetch } = useNotificationsQuery();
  const markRead = useMarkNotificationsRead();
  const [activeTab, setActiveTab] = useState<InboxTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];

    if (activeTab === "unread") {
      list = list.filter((n) => !n.isRead);
    } else if (activeTab === "assignments") {
      list = list.filter((n) => n.type.toLowerCase().includes("assign"));
    } else if (activeTab === "mentions") {
      list = list.filter((n) => n.type.toLowerCase().includes("mention"));
    } else if (activeTab === "projects") {
      list = list.filter((n) => n.type.toLowerCase().includes("project"));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.body && n.body.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [notifications, activeTab, searchQuery]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                Inbox & Triage
              </h1>
              {unreadCount > 0 ? (
                <span className="flex h-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-2 text-xs font-bold text-white shadow-xs">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="flex h-5 items-center justify-center rounded-full bg-[var(--color-surface-strong)] px-2 text-xs font-medium text-[var(--color-text-tertiary)] border border-[var(--color-border-secondary)]">
                  All caught up
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
              Review your assignments, mentions, comments, and project updates in one centralized workspace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markRead.mutate("all")}
                disabled={markRead.isPending}
                className="gap-1.5 text-xs font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                <span>Mark all read</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar & Tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-secondary)] pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "all"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "unread"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("assignments")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "assignments"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Assignments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mentions")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "mentions"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Mentions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "projects"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Projects
            </button>
          </div>

          {/* Search within notifications */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <Input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)]"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-4"
                >
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <Card className="border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="text-sm font-semibold text-red-500">Failed to load inbox notifications</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 text-xs">
                Retry
              </Button>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]/40 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]">
                <Sparkles className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
                {activeTab === "unread" ? "Zero Unread Notifications" : "Inbox is Empty"}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-[var(--color-text-secondary)]">
                {activeTab === "unread"
                  ? "Great job! You have triaged all recent items. We will notify you when new events arrive."
                  : "No notifications found in this view. Updates related to your team or tasks will appear here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isUnread = !item.isRead;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative flex items-start gap-3.5 rounded-xl border p-4 transition-all duration-150",
                    isUnread
                      ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/10 shadow-xs hover:border-[var(--color-accent)]/50"
                      : "border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)]",
                  )}
                >
                  {/* Status Indicator */}
                  {isUnread && (
                    <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-accent)]" />
                  )}

                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] shadow-xs">
                    {getNotificationTypeIcon(item.type)}
                  </div>

                  {/* Content & Link */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={item.link || "#"}
                        onClick={() => {
                          if (isUnread) markRead.mutate(item.id);
                        }}
                        className="text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {item.title}
                      </Link>
                      <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-1.5">
                        {item.type}
                      </Badge>
                      {isUnread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                      )}
                    </div>

                    {item.body && (
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--color-text-tertiary)]">
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                      {item.link && (
                        <>
                          <span>•</span>
                          <Link
                            href={item.link}
                            onClick={() => {
                              if (isUnread) markRead.mutate(item.id);
                            }}
                            className="font-medium text-[var(--color-accent)] hover:underline"
                          >
                            Open item →
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Action: Mark as read */}
                  <div className="shrink-0 flex items-center">
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(item.id)}
                        className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">Read</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
  );
}
