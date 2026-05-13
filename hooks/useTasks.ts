"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";
import { supabaseClient } from "@/lib/supabase/client";
import type { TaskStatus } from "@/types/task-status";
import { normalizeTaskViewMetadata, type TaskViewMetadata } from "@/types/task-view-metadata";

export type TaskDTO = {
  id: string;
  title: string;
  description: Record<string, unknown> | string | null;
  assigneeId: string | null;
  status: TaskStatus;
  priority: number;
  dueDate: string | null;
  metadata: TaskViewMetadata;
  createdAt: string;
  updatedAt: string;
};

export type TaskFilters = {
  status?: TaskDTO["status"];
  assigneeId?: string;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
};

export type UpdateTaskPayload = {
  id: string;
  title?: string;
  description?: Record<string, unknown> | string | null;
  assigneeId?: string | null;
  status?: TaskStatus;
  priority?: number;
  dueDate?: string | null;
  metadata?: Partial<TaskViewMetadata>;
};

export const tasksQueryKey = (workspaceId: string) => ["tasks", workspaceId] as const;

async function fetchFilteredTasks(workspaceId: string, authToken: string | null, filters: TaskFilters) {
  const searchParams = new URLSearchParams();

  if (filters.status) searchParams.set("status", filters.status);
  if (filters.assigneeId) searchParams.set("assigneeId", filters.assigneeId);
  if (filters.dueFrom) searchParams.set("dueFrom", filters.dueFrom);
  if (filters.dueTo) searchParams.set("dueTo", filters.dueTo);
  if (filters.search) searchParams.set("search", filters.search);

  const suffix = searchParams.toString();
  const path = suffix ? `/api/tasks?${suffix}` : "/api/tasks";

  const payload = await fetchApiJson<{ data: TaskDTO[] }>(path, {
    session: { workspaceId, authToken },
  });

  return payload.data;
}

export function useTasksQuery(filters: TaskFilters = {}) {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...tasksQueryKey(workspaceId), userId ?? "anonymous", filters],
    queryFn: () => fetchFilteredTasks(workspaceId, authToken, filters),
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
  });
}

export function useTaskDetailQuery(taskId: string | null) {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...tasksQueryKey(workspaceId), userId ?? "anonymous", "detail", taskId],
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: TaskDTO }>(`/api/tasks/${taskId}`, {
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId) && Boolean(taskId),
  });
}

export function useCreateTaskMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...tasksQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      assigneeId?: string;
      status?: TaskStatus;
      priority?: number;
      dueDate?: string;
      metadata?: Partial<TaskViewMetadata>;
    }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: TaskDTO }>("/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify(payload),
      });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TaskDTO[]>(queryKey);
      const optimisticTask: TaskDTO = {
        id: `optimistic-${Date.now()}`,
        title: payload.title,
        description: payload.description ?? null,
        assigneeId: payload.assigneeId ?? null,
        status: payload.status ?? "todo",
        priority: payload.priority ?? 2,
        dueDate: payload.dueDate ?? null,
        metadata: normalizeTaskViewMetadata(payload.metadata),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<TaskDTO[]>(queryKey, (current = []) => [optimisticTask, ...current]);

      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateTaskMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryPrefix = [...tasksQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: UpdateTaskPayload) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      const { id, ...body } = payload;

      return fetchApiJson<{ data: TaskDTO }>(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryPrefix });
    },
  });
}

export function useDeleteTaskMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryPrefix = [...tasksQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      await fetchApiJson<undefined>(`/api/tasks/${taskId}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });

      return taskId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryPrefix });
    },
  });
}

export function useUpdateTaskStatusMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryPrefix = [...tasksQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: { taskId: string; status: TaskStatus }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: TaskDTO }>(`/api/tasks/${payload.taskId}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify({ status: payload.status }),
      });
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryPrefix });

      const previous = queryClient.getQueryData<TaskDTO[]>(queryPrefix);

      queryClient.setQueriesData<TaskDTO[]>({ queryKey: queryPrefix }, (current = []) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );

      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueriesData({ queryKey: queryPrefix }, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryPrefix });
    },
  });
}

export function useAddTaskDependencyMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryPrefix = [...tasksQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: { taskId: string; dependsOnTaskId: string }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: { taskId: string; dependsOnTaskId: string } }>(
        `/api/tasks/${payload.taskId}/dependencies`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          session: { workspaceId, authToken },
          body: JSON.stringify({ dependsOnTaskId: payload.dependsOnTaskId }),
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryPrefix });
    },
  });
}

export function subscribeToTaskChanges(workspaceId: string, onChange: () => void) {
  if (!supabaseClient) {
    return () => undefined;
  }

  const channel = supabaseClient
    .channel(`workspace:${workspaceId}:tasks`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabaseClient?.removeChannel(channel);
  };
}
