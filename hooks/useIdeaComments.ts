"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type CommentDTO = {
  id: string;
  workspaceId: string;
  taskId: string | null;
  ideaId: string | null;
  parentId: string | null;
  authorId: string;
  body: string;
  editedAt: string | null;
  createdAt: string;
};

function commentsQueryKey(ideaId: string) {
  return ["comments", "idea", ideaId] as const;
}

export function useIdeaComments(ideaId: string) {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const qKey = commentsQueryKey(ideaId);

  // Load comments
  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const res = await fetchApiJson<{ data: CommentDTO[] }>(
        `/api/comments?ideaId=${ideaId}`,
        {
          session: { workspaceId, authToken },
        }
      );
      return res.data;
    },
    enabled: isReady && !!userId && !!workspaceId,
  });

  // Add comment
  const { mutate: addComment, isPending: isAdding } = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetchApiJson<{ data: CommentDTO }>(
        "/api/comments",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify({ ideaId, body: content }),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  // Delete comment
  const { mutate: deleteComment, isPending: isDeleting } = useMutation({
    mutationFn: async (commentId: string) => {
      await fetchApiJson<void>(`/api/comments/${commentId}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  // Update comment
  const { mutate: updateComment, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: { commentId: string; body: string }) => {
      const res = await fetchApiJson<{ data: CommentDTO }>(
        `/api/comments/${payload.commentId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify({ body: payload.body }),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  return {
    comments: data ?? [],
    isLoading,
    addComment,
    isAdding,
    deleteComment,
    isDeleting,
    updateComment,
    isUpdating,
  };
}
