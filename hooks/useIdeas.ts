"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";
import type { TaskStatus } from "@/types/task-status";

export type IdeaDTO = {
  id: string;
  title: string;
  summary: string | null;
  content: Record<string, unknown> | string | null;
  status: "draft" | "validated" | "archived" | "converted";
  authorId: string;
  createdAt: string;
  convertedTaskId: string | null;
};

export type UpdateIdeaPayload = {
  id: string;
  title?: string;
  summary?: string | null;
  content?: Record<string, unknown> | string | null;
  status?: IdeaDTO["status"];
};

export const ideasQueryKey = (workspaceId: string) => ["ideas", workspaceId] as const;

async function fetchIdeas(workspaceId: string, authToken: string | null) {
  const payload = await fetchApiJson<{ data: IdeaDTO[] }>("/api/ideas", {
    session: { workspaceId, authToken },
  });

  return payload.data;
}

export function useIdeasQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...ideasQueryKey(workspaceId), userId ?? "anonymous"],
    queryFn: () => fetchIdeas(workspaceId, authToken),
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
    retry: false,
  });
}

export function useIdeaDetailQuery(ideaId: string | null) {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...ideasQueryKey(workspaceId), userId ?? "anonymous", "detail", ideaId],
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: IdeaDTO }>(`/api/ideas/${ideaId}`, {
        session: { workspaceId, authToken },
      });

      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId) && Boolean(ideaId),
    retry: false,
  });
}

export function useCreateIdeaMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...ideasQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: { title: string; summary?: string; content?: string }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: IdeaDTO }>("/api/ideas", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify(payload),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useConvertIdeaMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...ideasQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: { ideaId: string; status?: TaskStatus }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<{ data: { id: string } }>(`/api/ideas/${payload.ideaId}/convert`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify({ status: payload.status ?? "todo" }),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateIdeaMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryPrefix = [...ideasQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: UpdateIdeaPayload) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      const { id, ...body } = payload;

      return fetchApiJson<{ data: IdeaDTO }>(`/api/ideas/${id}`, {
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

export function useDeleteIdeaMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryPrefix = [...ideasQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (ideaId: string) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      await fetchApiJson<undefined>(`/api/ideas/${ideaId}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });

      return ideaId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryPrefix });
    },
  });
}

export function useVoteIdeaMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryPrefix = [...ideasQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: { ideaId: string; vote: boolean }) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      if (payload.vote) {
        // Add vote - POST without body (always upvote)
        return fetchApiJson<{ data: { id: string }; voteCount: number }>(`/api/ideas/${payload.ideaId}/vote`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          session: { workspaceId, authToken },
          body: JSON.stringify({}),
        });
      } else {
        // Remove vote - DELETE
        return fetchApiJson<undefined>(`/api/ideas/${payload.ideaId}/vote`, {
          method: "DELETE",
          session: { workspaceId, authToken },
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryPrefix });
    },
  });
}
