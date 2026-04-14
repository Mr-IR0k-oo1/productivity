"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabaseClient } from "@/lib/supabase/client";

export type TaskDTO = {
  id: string;
  title: string;
  status: "backlog" | "todo" | "in_progress" | "done" | "blocked";
};

async function fetchTasks() {
  const response = await fetch("/api/tasks", {
    headers: {
      "x-workspace-id": "demo-workspace",
    },
  });

  if (!response.ok) throw new Error("Failed to load tasks");
  const payload = (await response.json()) as { data: TaskDTO[] };
  return payload.data;
}

export function useTasksQuery() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string }) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-workspace-id": "demo-workspace",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create task");
      return (await response.json()) as { data: TaskDTO };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previous = queryClient.getQueryData<TaskDTO[]>(["tasks"]);
      const optimisticTask: TaskDTO = {
        id: `optimistic-${Date.now()}`,
        title: payload.title,
        status: "todo",
      };

      queryClient.setQueryData<TaskDTO[]>(["tasks"], (current = []) => [optimisticTask, ...current]);

      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function subscribeToTaskChanges(workspaceId: string, onChange: () => void) {
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
    void supabaseClient.removeChannel(channel);
  };
}
