"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";
import type { Flowchart, FlowchartData } from "@/stores/flowchart-store";

export const flowchartsQueryKey = (workspaceId: string) => ["flowcharts", workspaceId] as const;

async function fetchFlowcharts(workspaceId: string, authToken: string | null) {
  const payload = await fetchApiJson<{ data: Flowchart[] }>("/api/flowcharts", {
    session: { workspaceId, authToken },
  });
  return payload.data;
}

export function useFlowchartsQuery() {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...flowchartsQueryKey(workspaceId ?? ""), "list"],
    queryFn: () => fetchFlowcharts(workspaceId!, authToken),
    enabled: isReady && Boolean(workspaceId),
    retry: false,
  });
}

export function useFlowchartQuery(flowchartId: string | null) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...flowchartsQueryKey(workspaceId ?? ""), flowchartId],
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: Flowchart }>(`/api/flowcharts/${flowchartId}`, {
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(flowchartId),
    retry: false,
  });
}

export function useCreateFlowchartMutation() {
  const { workspaceId, authToken, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...flowchartsQueryKey(workspaceId ?? ""), "list"];

  return useMutation({
    mutationFn: async (payload: { name: string; data?: FlowchartData }) => {
      if (!isReady || !workspaceId) {
        throw new Error("Session not ready");
      }

      return fetchApiJson<{ data: Flowchart }>("/api/flowcharts", {
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

export function useUpdateFlowchartMutation() {
  const { workspaceId, authToken, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...flowchartsQueryKey(workspaceId ?? ""), "list"];

  return useMutation({
    mutationFn: async (payload: { id: string; name?: string; data?: FlowchartData }) => {
      if (!isReady || !workspaceId) {
        throw new Error("Session not ready");
      }

      const { id, ...body } = payload;
      return fetchApiJson<{ data: Flowchart }>(`/api/flowcharts/${id}`, {
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

export function useDeleteFlowchartMutation() {
  const { workspaceId, authToken, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...flowchartsQueryKey(workspaceId ?? ""), "list"];

  return useMutation({
    mutationFn: async (flowchartId: string) => {
      if (!isReady || !workspaceId) {
        throw new Error("Session not ready");
      }

      await fetchApiJson<undefined>(`/api/flowcharts/${flowchartId}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });
      return flowchartId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
