"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";
import type { WorkspaceRole } from "@/src/lib/workspace-access";
import type { WorkspaceSettingsDocument, WorkspaceSettingsPatch } from "@/src/lib/workspace-settings";

export type WorkspaceMemberSummary = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    jobTitle: string | null;
    avatarUrl: string | null;
  };
  role: WorkspaceRole;
  isActive: boolean;
  joinedAt: string;
};

export type WorkspaceSettingsPayload = {
  data: {
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
    membership: {
      role: WorkspaceRole;
      isActive: boolean;
    };
    currentUserId: string;
    members: WorkspaceMemberSummary[];
    settings: WorkspaceSettingsDocument;
  };
};

export const workspaceSettingsQueryKey = (workspaceId: string) => ["workspace-settings", workspaceId] as const;

async function fetchWorkspaceSettings(workspaceId: string, authToken: string | null) {
  const payload = await fetchApiJson<WorkspaceSettingsPayload>("/api/settings", {
    session: { workspaceId, authToken },
  });

  return payload.data;
}

export function useWorkspaceSettingsQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...workspaceSettingsQueryKey(workspaceId), userId ?? "anonymous"],
    queryFn: () => fetchWorkspaceSettings(workspaceId, authToken),
    enabled: isReady && Boolean(workspaceId) && Boolean(userId) && Boolean(authToken),
    retry: false,
  });
}

export function useUpdateWorkspaceSettingsMutation() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const queryClient = useQueryClient();
  const queryKey = [...workspaceSettingsQueryKey(workspaceId), userId ?? "anonymous"];

  return useMutation({
    mutationFn: async (payload: WorkspaceSettingsPatch) => {
      if (!isReady || !userId || !authToken) {
        throw new Error("Authentication is required");
      }

      return fetchApiJson<WorkspaceSettingsPayload>("/api/settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryKey, response.data);
    },
  });
}