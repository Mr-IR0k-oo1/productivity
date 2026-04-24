"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type IdeaDependencyDTO = {
  id: string;
  title: string;
  status: "draft" | "validated" | "archived" | "converted";
};

function ideaDependenciesQueryKey(ideaId: string) {
  return ["idea-dependencies", ideaId] as const;
}

export function useIdeaDependencies(ideaId: string) {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const qKey = ideaDependenciesQueryKey(ideaId);

  // Load dependencies
  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const res = await fetchApiJson<{ data: IdeaDependencyDTO[] }>(
        `/api/ideas/${ideaId}/dependencies`,
        {
          session: { workspaceId, authToken },
        }
      );
      return res.data;
    },
    enabled: isReady && !!userId && !!workspaceId && !!ideaId,
  });

  // Add dependency
  const { mutate: addDependency, isPending: isAdding } = useMutation({
    mutationFn: async (dependsOnId: string) => {
      const res = await fetchApiJson<{ data: IdeaDependencyDTO }>(
        `/api/ideas/${ideaId}/dependencies`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify({ dependsOnId }),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  // Remove dependency
  const { mutate: removeDependency, isPending: isRemoving } = useMutation({
    mutationFn: async (dependsOnId: string) => {
      await fetchApiJson<void>(
        `/api/ideas/${ideaId}/dependencies/${dependsOnId}`,
        {
          method: "DELETE",
          session: { workspaceId, authToken },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  return {
    dependencies: data ?? [],
    isLoading,
    addDependency,
    isAdding,
    removeDependency,
    isRemoving,
  };
}
