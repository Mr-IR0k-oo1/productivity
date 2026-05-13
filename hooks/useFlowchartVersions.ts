"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { flowchartKeys } from "@/hooks/useFlowchart";
import { fetchApiJson } from "@/lib/api/client";
import { flowchartVersionSchema, flowchartVersionSummarySchema } from "@/lib/flowchart/schemas";
import { useFlowchartStore } from "@/stores/flowchartStore";

const versionsResponseSchema = z.object({
  versions: z.array(flowchartVersionSummarySchema),
});

const versionResponseSchema = z.object({
  version: flowchartVersionSchema,
});

const restoreResponseSchema = z.object({
  flowchart: z.object({
    id: z.string(),
  }).passthrough(),
});

const AUTO_VERSION_INTERVAL_MS = 5 * 60 * 1000;

type Session = {
  workspaceId: string | undefined;
  authToken: string | null;
  isReady: boolean;
};

function requireSession(session: Session): { workspaceId: string; authToken: string | null } {
  if (!session.isReady || !session.workspaceId) {
    throw new Error("Session not ready");
  }

  return {
    workspaceId: session.workspaceId,
    authToken: session.authToken,
  };
}

export function useVersions(flowchartId: string | null) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: flowchartKeys.versions(workspaceId, flowchartId),
    queryFn: async () => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/versions`, {
        session,
      });

      return versionsResponseSchema.parse(response).versions;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(flowchartId),
    retry: false,
  });
}

export function useSaveVersion(flowchartId: string) {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (label?: string) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/versions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session,
        body: JSON.stringify({ label }),
      });

      return versionResponseSchema.parse(response).version;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.versions(workspaceId, flowchartId) });
    },
  });
}

export function useRestoreVersion(flowchartId: string) {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/versions/${versionId}/restore`, {
        method: "POST",
        session,
      });

      return restoreResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.detail(workspaceId, flowchartId) });
      queryClient.invalidateQueries({ queryKey: flowchartKeys.versions(workspaceId, flowchartId) });
    },
  });
}

export function useAutoSaveVersion(flowchartId: string | null) {
  const isDirty = useFlowchartStore((state) => state.isDirty);
  const saveVersion = useSaveVersion(flowchartId ?? "");

  useEffect(() => {
    if (!flowchartId || !isDirty) {
      return;
    }

    const interval = setInterval(() => {
      void saveVersion.mutateAsync("Autosave");
    }, AUTO_VERSION_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [flowchartId, isDirty, saveVersion]);
}
