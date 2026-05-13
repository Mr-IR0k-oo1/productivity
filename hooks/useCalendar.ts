"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type EventKind = "meeting" | "focus" | "deadline" | "review" | "travel";

export type CalendarEventDTO = {
  id: string;
  workspaceId: string;
  creatorId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  taskId: string | null;
  kind: EventKind | null;
  project: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCalendarEventPayload = {
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  taskId?: string | null;
  kind?: EventKind | null;
  project?: string | null;
  location?: string | null;
};

export type UpdateCalendarEventPayload = Partial<CreateCalendarEventPayload> & {
  id: string;
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

/** Consolidated calendar events hook with create, update, delete */
export function useCalendarEvents() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...calendarQueryKey(workspaceId), userId ?? "anonymous"];

  // Load events
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: CalendarEventDTO[] }>("/api/calendar", {
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
    retry: false,
  });

  // Create event
  const { mutate: createEvent, isPending: isCreating } = useMutation({
    mutationFn: async (payload: CreateCalendarEventPayload) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      const response = await fetchApiJson<{ data: CalendarEventDTO }>("/api/calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description ?? null,
          startsAt: payload.startsAt,
          endsAt: payload.endsAt,
          taskId: payload.taskId ?? null,
          kind: payload.kind ?? null,
          project: payload.project ?? null,
          location: payload.location ?? null,
        }),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update event
  const { mutate: updateEvent, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: UpdateCalendarEventPayload) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      const { id, ...body } = payload;

      // Only send defined fields for partial patch
      const updateBody = Object.fromEntries(
        Object.entries({
          title: body.title,
          description: body.description,
          startsAt: body.startsAt,
          endsAt: body.endsAt,
          taskId: body.taskId,
          kind: body.kind,
          project: body.project,
          location: body.location,
        }).filter(([, v]) => v !== undefined)
      );

      const response = await fetchApiJson<{ data: CalendarEventDTO }>(
        `/api/calendar/${id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify(updateBody),
        }
      );
      return response.data;
    },
    // Optimistic update for drag-and-drop reschedules
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<CalendarEventDTO[]>(queryKey);
      queryClient.setQueryData<CalendarEventDTO[]>(queryKey, (old) =>
        old?.map((e) =>
          e.id === payload.id
            ? {
                ...e,
                ...(payload.title && { title: payload.title }),
                ...(payload.description !== undefined && { description: payload.description }),
                ...(payload.startsAt && { startsAt: payload.startsAt }),
                ...(payload.endsAt && { endsAt: payload.endsAt }),
                ...(payload.taskId !== undefined && { taskId: payload.taskId }),
                ...(payload.kind !== undefined && { kind: payload.kind }),
                ...(payload.project !== undefined && { project: payload.project }),
                ...(payload.location !== undefined && { location: payload.location }),
              }
            : e
        ) ?? []
      );
      return { prev };
    },
    onError: (_error, _payload, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKey, context.prev);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete event
  const { mutate: deleteEvent, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      await fetchApiJson<undefined>(`/api/calendar/${id}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });

      return id;
    },
    // Optimistic remove
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<CalendarEventDTO[]>(queryKey);
      queryClient.setQueryData<CalendarEventDTO[]>(queryKey, (old) =>
        old?.filter((e) => e.id !== id) ?? []
      );
      return { prev };
    },
    onError: (_error, _payload, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKey, context.prev);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    events: data ?? [],
    isLoading,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

// Legacy mutations for backward compatibility
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
      kind?: EventKind | null;
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
      kind?: EventKind | null;
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
