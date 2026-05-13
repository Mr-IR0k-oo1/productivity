"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type SubtaskDTO = {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  position: number;
  createdAt: string;
};

export type CreateSubtaskPayload = {
  title: string;
  isDone?: boolean;
  position?: number;
};

export type UpdateSubtaskPayload = {
  title?: string;
  isDone?: boolean;
  position?: number;
};

function subtasksQueryKey(taskId: string) {
  return ["subtasks", taskId] as const;
}

export function useTaskSubtasks(taskId: string) {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const qKey = subtasksQueryKey(taskId);

  // Load subtasks
  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const res = await fetchApiJson<{ data: SubtaskDTO[] }>(
        `/api/subtasks/tasks/${taskId}`,
        {
          session: { workspaceId, authToken },
        }
      );
      return res.data;
    },
    enabled: isReady && !!userId && !!workspaceId && !!taskId,
  });

  // Create subtask
  const { mutate: createSubtask, isPending: isCreating } = useMutation({
    mutationFn: async (payload: CreateSubtaskPayload) => {
      const res = await fetchApiJson<{ data: SubtaskDTO }>(
        `/api/subtasks/tasks/${taskId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify(payload),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  // Toggle subtask completion - optimistic update
  const { mutate: toggleSubtask, isPending: isTogglingCompletion } = useMutation({
    mutationFn: async ({ id, isDone }: { id: string; isDone: boolean }) => {
      const res = await fetchApiJson<{ data: SubtaskDTO }>(
        `/api/subtasks/${id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify({ isDone }),
        }
      );
      return res.data;
    },
    // Optimistic update: flip the checkbox immediately
    onMutate: async ({ id, isDone }) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<SubtaskDTO[]>(qKey);
      queryClient.setQueryData<SubtaskDTO[]>(qKey, (old) =>
        old?.map((s) => (s.id === id ? { ...s, isDone } : s)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back on failure
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  // Update subtask title
  const { mutate: updateSubtask, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetchApiJson<{ data: SubtaskDTO }>(
        `/api/subtasks/${id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify({ title }),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  // Update subtask position
  const { mutate: updatePosition, isPending: isUpdatingPosition } = useMutation({
    mutationFn: async ({ id, position }: { id: string; position: number }) => {
      const res = await fetchApiJson<{ data: SubtaskDTO }>(
        `/api/subtasks/${id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify({ position }),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  // Delete subtask - optimistic removal
  const { mutate: deleteSubtask, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await fetchApiJson<void>(`/api/subtasks/${id}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });
    },
    // Optimistic: remove immediately from list
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<SubtaskDTO[]>(qKey);
      queryClient.setQueryData<SubtaskDTO[]>(qKey, (old) =>
        old?.filter((s) => s.id !== id) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const completedCount = (data ?? []).filter((s) => s.isDone).length;
  const totalCount = (data ?? []).length;

  return {
    subtasks: data ?? [],
    isLoading,
    isCreating,
    isTogglingCompletion,
    isUpdating,
    isUpdatingPosition,
    isDeleting,
    createSubtask,
    toggleSubtask,
    updateSubtask,
    updatePosition,
    deleteSubtask,
    completedCount,
    totalCount,
  };
}
