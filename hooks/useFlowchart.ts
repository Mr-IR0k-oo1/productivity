"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { flowchartSchema, pageSizeSchema } from "@/lib/flowchart/schemas";
import { fetchApiJson } from "@/lib/api/client";
import type { CanvasMode, CanvasState, DiagramType, PageSize } from "@/types/flowchart";

const flowchartListResponseSchema = z.object({
  flowcharts: z.array(flowchartSchema),
  total: z.number(),
});

const flowchartResponseSchema = z.object({
  flowchart: flowchartSchema,
});

const saveCanvasResponseSchema = z.object({
  ok: z.boolean(),
});

const imageResponseSchema = z.object({
  url: z.string(),
  storageKey: z.string(),
});

const shareResponseSchema = z.object({
  shareUrl: z.string().nullable(),
});

const publicFlowchartResponseSchema = z.object({
  flowchart: z.unknown(),
});

export const flowchartKeys = {
  all: ["flowcharts"] as const,
  list: (workspaceId: string | undefined, search = "", limit = 20, offset = 0) =>
    [...flowchartKeys.all, workspaceId ?? "no-workspace", "list", search, limit, offset] as const,
  detail: (workspaceId: string | undefined, flowchartId: string | null | undefined) =>
    [...flowchartKeys.all, workspaceId ?? "no-workspace", "detail", flowchartId ?? "no-flowchart"] as const,
  versions: (workspaceId: string | undefined, flowchartId: string | null | undefined) =>
    [...flowchartKeys.all, workspaceId ?? "no-workspace", "versions", flowchartId ?? "no-flowchart"] as const,
  comments: (workspaceId: string | undefined, flowchartId: string | null | undefined) =>
    [...flowchartKeys.all, workspaceId ?? "no-workspace", "comments", flowchartId ?? "no-flowchart"] as const,
};

type CreateFlowchartInput = {
  title: string;
  mode: CanvasMode;
  pageSize?: PageSize;
  pageWidth?: number;
  pageHeight?: number;
  diagramType?: DiagramType | null;
  canvasState?: CanvasState;
};

type UpdateFlowchartInput = Partial<{
  title: string;
  description: string | null;
  mode: CanvasMode;
  pageSize: PageSize | null;
  pageWidth: number | null;
  pageHeight: number | null;
  diagramType: DiagramType | null;
}>;

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

export function useFlowcharts(search = "", limit = 20, offset = 0) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: flowchartKeys.list(workspaceId, search, limit, offset),
    queryFn: async () => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const query = new URLSearchParams({
        search,
        limit: String(limit),
        offset: String(offset),
      });
      const response = await fetchApiJson<unknown>(`/api/flowcharts?${query.toString()}`, {
        session,
      });

      return flowchartListResponseSchema.parse(response);
    },
    enabled: isReady && Boolean(workspaceId),
    retry: false,
  });
}

export function useFlowchart(flowchartId: string | null) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: flowchartKeys.detail(workspaceId, flowchartId),
    queryFn: async () => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}`, {
        session,
      });

      return flowchartResponseSchema.parse(response).flowchart;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(flowchartId),
    retry: false,
  });
}

export function usePublicFlowchart(token: string | null) {
  return useQuery({
    queryKey: [...flowchartKeys.all, "public", token ?? "no-token"] as const,
    queryFn: async () => {
      const response = await fetchApiJson<unknown>(`/api/flowcharts/public/${token}`, {
        session: {},
      });

      const parsed = publicFlowchartResponseSchema.parse(response).flowchart;
      const flowchartPayload = typeof parsed === "object" && parsed !== null ? parsed : {};
      return flowchartSchema.parse({
        ...flowchartPayload,
        publicToken: null,
      });
    },
    enabled: Boolean(token),
    retry: false,
  });
}

export function useCreateFlowchart() {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (payload: CreateFlowchartInput) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>("/api/flowcharts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session,
        body: JSON.stringify({
          ...payload,
          pageSize: payload.pageSize ? pageSizeSchema.parse(payload.pageSize) : undefined,
        }),
      });

      return flowchartResponseSchema.parse(response).flowchart;
    },
    onSuccess: (flowchart) => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.list(workspaceId) });
      queryClient.setQueryData(flowchartKeys.detail(workspaceId, flowchart.id), flowchart);
    },
  });
}

export function useUpdateFlowchart(flowchartId: string) {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (payload: UpdateFlowchartInput) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        session,
        body: JSON.stringify(payload),
      });

      return flowchartResponseSchema.parse(response).flowchart;
    },
    onSuccess: (flowchart) => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.list(workspaceId) });
      queryClient.setQueryData(flowchartKeys.detail(workspaceId, flowchartId), flowchart);
    },
  });
}

export function useSaveCanvas(flowchartId: string) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (canvasState: CanvasState) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/canvas`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        session,
        body: JSON.stringify({ canvasState }),
      });

      return saveCanvasResponseSchema.parse(response);
    },
  });
}

export function useDeleteFlowchart() {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (flowchartId: string) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}`, {
        method: "DELETE",
        session,
      });

      return {
        flowchartId,
        ok: saveCanvasResponseSchema.parse(response).ok,
      };
    },
    onSuccess: ({ flowchartId }) => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.list(workspaceId) });
      queryClient.removeQueries({ queryKey: flowchartKeys.detail(workspaceId, flowchartId) });
    },
  });
}

export function useDuplicateFlowchart() {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (flowchartId: string) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/duplicate`, {
        method: "POST",
        session,
      });

      return flowchartResponseSchema.parse(response).flowchart;
    },
    onSuccess: (flowchart) => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.list(workspaceId) });
      queryClient.setQueryData(flowchartKeys.detail(workspaceId, flowchart.id), flowchart);
    },
  });
}

export function useShareFlowchart(flowchartId: string) {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session,
        body: JSON.stringify({ enabled }),
      });

      return shareResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.detail(workspaceId, flowchartId) });
      queryClient.invalidateQueries({ queryKey: flowchartKeys.list(workspaceId) });
    },
  });
}

export function useUploadFlowchartImage(flowchartId: string) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (file: File) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/images`, {
        method: "POST",
        session,
        body: formData,
      });

      return imageResponseSchema.parse(response);
    },
  });
}

export function useDeleteFlowchartImage(flowchartId: string) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (storageKey: string) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(
        `/api/flowcharts/${flowchartId}/images/${encodeURIComponent(storageKey)}`,
        {
          method: "DELETE",
          session,
        },
      );

      return saveCanvasResponseSchema.parse(response);
    },
  });
}
