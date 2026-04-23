"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type CalendarEventDTO = {
  id: string;
  workspaceId: string;
  creatorId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  taskId: string | null;
  kind: "meeting" | "focus" | "deadline" | "review" | "travel" | null;
  project: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCalendarEventPayload = {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  taskId?: string;
  kind?: CalendarEventDTO["kind"];
  project?: string | null;
  location?: string | null;
};

export type UpdateCalendarEventPayload = {
  id: string;
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  taskId?: string | null;
  kind?: CalendarEventDTO["kind"];
  project?: string | null;
  location?: string | null;
};

export const calendarQueryKey = (workspaceId: string) => ["calendar", workspaceId] as const;

export function useCalendarQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...calendarQueryKey(workspaceId), userId ?? "anonymous"],
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: CalendarEventDTO[] }>("/api/calendar", {
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
    retry: false,
  });
}

export function useCreateCalendarEventMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...calendarQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      startsAt: string;
      endsAt: string;
      taskId?: string;
      kind?: CalendarEventDTO["kind"];
      project?: string;
      location?: string;
    }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: CalendarEventDTO }>("/api/calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify(payload),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateCalendarEventMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...calendarQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      title?: string;
      description?: string | null;
      startsAt?: string;
      endsAt?: string;
      taskId?: string | null;
      kind?: CalendarEventDTO["kind"];
      project?: string | null;
      location?: string | null;
    }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      const { id, ...body } = payload;

      return fetchApiJson<{ data: CalendarEventDTO }>(`/api/calendar/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteCalendarEventMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...calendarQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      await fetchApiJson<undefined>(`/api/calendar/${eventId}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });

      return eventId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
