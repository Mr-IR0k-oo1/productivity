"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { tasksQueryKey } from "@/hooks/useTasks";
import { fetchApiJson } from "@/lib/api/client";

export type SprintStatus = "planned" | "active" | "completed";

export type SprintDTO = {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  committedPoints: number | null;
  completedPoints: number | null;
  completedAt: string | null;
  issueCount: number;
  doneCount: number;
  totalPoints: number;
  donePoints: number;
};

export type BurndownPointDTO = { date: string; ideal: number; remaining: number | null };

export type VelocityDTO = {
  sprints: Array<{ name: string; committed: number; completed: number }>;
  average: number;
};

const sprintsQueryKey = (workspaceId: string) => ["sprints", workspaceId] as const;

function useSprintSession() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  return { session: { workspaceId, authToken }, workspaceId, enabled: isReady && Boolean(workspaceId) && Boolean(userId) };
}

export function useSprintsQuery() {
  const { session, workspaceId, enabled } = useSprintSession();

  return useQuery({
    queryKey: sprintsQueryKey(workspaceId),
    queryFn: async () => (await fetchApiJson<{ data: SprintDTO[] }>("/api/sprints", { session })).data,
    enabled,
  });
}

export function useBurndownQuery(sprintId: string | null) {
  const { session, workspaceId, enabled } = useSprintSession();

  return useQuery({
    queryKey: [...sprintsQueryKey(workspaceId), "burndown", sprintId],
    queryFn: async () =>
      (await fetchApiJson<{ data: BurndownPointDTO[] }>(`/api/sprints/${sprintId}/burndown`, { session })).data,
    enabled: enabled && Boolean(sprintId),
  });
}

export function useVelocityQuery() {
  const { session, workspaceId, enabled } = useSprintSession();

  return useQuery({
    queryKey: [...sprintsQueryKey(workspaceId), "velocity"],
    queryFn: async () => (await fetchApiJson<{ data: VelocityDTO }>("/api/sprints/velocity", { session })).data,
    enabled,
  });
}

type SprintAction =
  | { type: "create"; name?: string; goal?: string | null }
  | { type: "update"; id: string; name?: string; goal?: string | null; startDate?: string | null; endDate?: string | null }
  | { type: "start"; id: string; startDate?: string; endDate?: string }
  | { type: "complete"; id: string; moveIncompleteTo: "backlog" | string }
  | { type: "delete"; id: string };

function requestFor(action: SprintAction): { path: string; method: string; body?: unknown } {
  switch (action.type) {
    case "create":
      return { path: "/api/sprints", method: "POST", body: { name: action.name, goal: action.goal } };
    case "update": {
      const { id, type: _type, ...body } = action;
      return { path: `/api/sprints/${id}`, method: "PATCH", body };
    }
    case "start":
      return { path: `/api/sprints/${action.id}/start`, method: "POST", body: { startDate: action.startDate, endDate: action.endDate } };
    case "complete":
      return { path: `/api/sprints/${action.id}/complete`, method: "POST", body: { moveIncompleteTo: action.moveIncompleteTo } };
    case "delete":
      return { path: `/api/sprints/${action.id}`, method: "DELETE" };
  }
}

/** One mutation for every sprint action; refreshes sprints and issues afterwards. */
export function useSprintMutation() {
  const { session, workspaceId } = useSprintSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: SprintAction) => {
      const { path, method, body } = requestFor(action);
      return fetchApiJson<unknown>(path, {
        method,
        session,
        ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(workspaceId) });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey(workspaceId) });
    },
  });
}
