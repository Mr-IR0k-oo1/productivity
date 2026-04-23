"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";
import type { Flowchart, FlowchartData } from "@/stores/flowchart-store";

const flowchartsDebugEnabled = process.env.NODE_ENV !== "production";

function logFlowchartsDebug(event: string, payload?: Record<string, unknown>) {
  if (!flowchartsDebugEnabled) {
    return;
  }

  if (payload) {
    console.log(`[flowcharts] ${event}`, payload);
    return;
  }

  console.log(`[flowcharts] ${event}`);
}

export const flowchartsQueryKey = (workspaceId?: string) => ["flowcharts", workspaceId ?? "no-workspace"] as const;
export const flowchartsListQueryKey = (workspaceId?: string) => [...flowchartsQueryKey(workspaceId), "list"] as const;
export const flowchartDetailsQueryKey = (workspaceId?: string, flowchartId?: string | null) =>
  [...flowchartsQueryKey(workspaceId), flowchartId ?? "no-flowchart"] as const;

async function fetchFlowcharts(workspaceId: string, authToken: string | null) {
  const payload = await fetchApiJson<{ data: Flowchart[] }>("/api/flowcharts", {
    session: { workspaceId, authToken },
  });
  return payload.data;
}

export function useFlowchartsQuery() {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: flowchartsListQueryKey(workspaceId),
    queryFn: () => fetchFlowcharts(workspaceId!, authToken),
    enabled: isReady && Boolean(workspaceId),
    retry: false,
  });
}

export function useFlowchartQuery(flowchartId: string | null) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: flowchartDetailsQueryKey(workspaceId, flowchartId),
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
  const queryKey = flowchartsListQueryKey(workspaceId);

  return useMutation({
    mutationFn: async (payload: { name: string; data?: FlowchartData }) => {
      if (!isReady || !workspaceId) {
        logFlowchartsDebug("create:blocked", {
          isReady,
          hasWorkspaceId: Boolean(workspaceId),
        });
        throw new Error("Session not ready");
      }

      logFlowchartsDebug("create:start", {
        workspaceId,
        name: payload.name,
        nodes: payload.data?.nodes?.length ?? 0,
        edges: payload.data?.edges?.length ?? 0,
      });

      const response = await fetchApiJson<{ data: Flowchart }>("/api/flowcharts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify(payload),
      });

      return response;
    },
    onSuccess: (payload) => {
      logFlowchartsDebug("create:success", {
        workspaceId,
        flowchartId: payload.data.id,
      });
    },
    onError: (error, payload) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartsDebug("create:error", {
        workspaceId,
        name: payload.name,
        error: message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      logFlowchartsDebug("create:settled", {
        workspaceId,
      });
    },
  });
}

export function useUpdateFlowchartMutation() {
  const { workspaceId, authToken, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = flowchartsListQueryKey(workspaceId);

  return useMutation({
    mutationFn: async (payload: { id: string; name?: string; data?: FlowchartData }) => {
      if (!isReady || !workspaceId) {
        logFlowchartsDebug("update:blocked", {
          isReady,
          hasWorkspaceId: Boolean(workspaceId),
          flowchartId: payload.id,
        });
        throw new Error("Session not ready");
      }

      logFlowchartsDebug("update:start", {
        workspaceId,
        flowchartId: payload.id,
        hasName: Boolean(payload.name),
        hasData: Boolean(payload.data),
      });

      const { id, ...body } = payload;
      const response = await fetchApiJson<{ data: Flowchart }>(`/api/flowcharts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify(body),
      });

      return response;
    },
    onSuccess: (payload) => {
      logFlowchartsDebug("update:success", {
        workspaceId,
        flowchartId: payload.data.id,
      });
    },
    onError: (error, payload) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartsDebug("update:error", {
        workspaceId,
        flowchartId: payload.id,
        error: message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      logFlowchartsDebug("update:settled", {
        workspaceId,
      });
    },
  });
}

export function useDeleteFlowchartMutation() {
  const { workspaceId, authToken, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = flowchartsListQueryKey(workspaceId);

  return useMutation({
    mutationFn: async (flowchartId: string) => {
      if (!isReady || !workspaceId) {
        logFlowchartsDebug("delete:blocked", {
          isReady,
          hasWorkspaceId: Boolean(workspaceId),
          flowchartId,
        });
        throw new Error("Session not ready");
      }

      logFlowchartsDebug("delete:start", {
        workspaceId,
        flowchartId,
      });

      await fetchApiJson<undefined>(`/api/flowcharts/${flowchartId}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });
      return flowchartId;
    },
    onSuccess: (flowchartId) => {
      logFlowchartsDebug("delete:success", {
        workspaceId,
        flowchartId,
      });
    },
    onError: (error, flowchartId) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartsDebug("delete:error", {
        workspaceId,
        flowchartId,
        error: message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      logFlowchartsDebug("delete:settled", {
        workspaceId,
      });
    },
  });
}
