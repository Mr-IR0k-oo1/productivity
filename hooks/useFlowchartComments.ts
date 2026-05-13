"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { flowchartKeys } from "@/hooks/useFlowchart";
import { fetchApiJson } from "@/lib/api/client";
import { flowchartCommentSchema } from "@/lib/flowchart/schemas";

const commentsResponseSchema = z.object({
  comments: z.array(flowchartCommentSchema),
});

const commentResponseSchema = z.object({
  comment: flowchartCommentSchema,
});

const okResponseSchema = z.object({
  ok: z.boolean(),
});

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

export function useComments(flowchartId: string | null) {
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useQuery({
    queryKey: flowchartKeys.comments(workspaceId, flowchartId),
    queryFn: async () => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/comments`, {
        session,
      });

      return commentsResponseSchema.parse(response).comments;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(flowchartId),
    retry: false,
  });
}

export function useAddComment(flowchartId: string) {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (payload: { content: string; x: number; y: number; parentId?: string }) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/comments`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session,
        body: JSON.stringify(payload),
      });

      return commentResponseSchema.parse(response).comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.comments(workspaceId, flowchartId) });
    },
  });
}

export function useDeleteComment(flowchartId: string) {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/comments/${commentId}`, {
        method: "DELETE",
        session,
      });

      return okResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.comments(workspaceId, flowchartId) });
    },
  });
}

export function useResolveComment(flowchartId: string) {
  const queryClient = useQueryClient();
  const { workspaceId, authToken, isReady } = useSessionContext();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const session = requireSession({ workspaceId, authToken, isReady });
      const response = await fetchApiJson<unknown>(`/api/flowcharts/${flowchartId}/comments/${commentId}/resolve`, {
        method: "PUT",
        session,
      });

      return commentResponseSchema.parse(response).comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowchartKeys.comments(workspaceId, flowchartId) });
    },
  });
}
