"use client";

import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { useMemo } from "react";
import { Activity } from "lucide-react";

import { ActivityItem } from "@/components/common/ActivityItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TableSkeletonRow } from "@/components/ui/skeleton";
import { useIdeasQuery } from "@/hooks/useIdeas";
import { useTasksQuery } from "@/hooks/useTasks";
import { useTimeEntriesQuery } from "@/hooks/useTimeEntries";

interface ActivityEvent {
  user: string;
  text: string;
  timestamp: string;
}

function toRelativeTimestamp(value: string): string {
  const parsed = parseISO(value);

  if (Number.isNaN(parsed.getTime())) {
    return "just now";
  }

  return `${formatDistanceToNowStrict(parsed)} ago`;
}

export function ActivityFeed() {
  const tasksQuery = useTasksQuery();
  const ideasQuery = useIdeasQuery();
  const timeEntriesQuery = useTimeEntriesQuery();

  const loading = tasksQuery.isLoading || ideasQuery.isLoading || timeEntriesQuery.isLoading;
  const error = tasksQuery.error ?? ideasQuery.error ?? timeEntriesQuery.error;

  const activity = useMemo<ActivityEvent[]>(() => {
    const taskEvents = (tasksQuery.data ?? []).map((task) => ({
      user: "TS",
      text: `Task updated: ${task.title}`,
      at: task.updatedAt,
    }));

    const ideaEvents = (ideasQuery.data ?? []).map((idea) => ({
      user: "ID",
      text: `Idea captured: ${idea.title}`,
      at: idea.createdAt,
    }));

    const timeEvents = (timeEntriesQuery.data ?? []).map((entry) => ({
      user: "TM",
      text: entry.isRunning
        ? `Timer started: ${entry.description?.trim() || "Focus session"}`
        : `Time logged: ${entry.description?.trim() || "Work session"}`,
      at: entry.createdAt,
    }));

    return [...taskEvents, ...ideaEvents, ...timeEvents]
      .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
      .slice(0, 6)
      .map((event) => ({
        user: event.user,
        text: event.text,
        timestamp: toRelativeTimestamp(event.at),
      }));
  }, [ideasQuery.data, tasksQuery.data, timeEntriesQuery.data]);

  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-[var(--muted)]">
          Latest updates from your workspace
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            title="Activity Failed"
            message={error instanceof Error ? error.message : "Failed to load activity"}
            onRetry={() => {
              void Promise.all([tasksQuery.refetch(), ideasQuery.refetch(), timeEntriesQuery.refetch()]);
            }}
            minHeight="min-h-[200px]"
          />
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <TableSkeletonRow key={i} />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="No activity yet"
            description="When your team takes action, you'll see it here"
            minHeight="min-h-[200px]"
          />
        ) : (
          <div className="space-y-2">
            {activity.map((item, index) => (
              <ActivityItem
                key={`${item.user}-${index}`}
                user={item.user}
                text={item.text}
                timestamp={item.timestamp}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

