"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type TimeEntryDTO = {
  id: string;
  workspaceId: string;
  userId: string;
  taskId: string | null;
  timesheetId: string | null;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  isRunning: boolean;
  createdAt: string;
};

export const timeEntriesQueryKey = (workspaceId: string) => ["timeEntries", workspaceId] as const;

export function useTimeEntriesQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...timeEntriesQueryKey(workspaceId), userId ?? "anonymous"],
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: TimeEntryDTO[] }>("/api/time/entries", {
        session: { workspaceId, authToken },
      });

      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
  });
}

export function useStartTimerMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...timeEntriesQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: { taskId?: string; description?: string }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: TimeEntryDTO }>("/api/time/timer/start", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify(payload),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useStopTimerMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...timeEntriesQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: TimeEntryDTO }>("/api/time/timer/stop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify({ entryId }),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
