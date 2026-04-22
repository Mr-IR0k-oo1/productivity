"use client";

import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type WorkspaceMemberDTO = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    jobTitle: string | null;
    avatarUrl: string | null;
  };
  role: "owner" | "admin" | "member";
  isActive: boolean;
  joinedAt: string;
};

export const workspaceMembersQueryKey = (workspaceId: string) =>
  ["workspace-members", workspaceId] as const;

export function useWorkspaceMembersQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: [...workspaceMembersQueryKey(workspaceId), userId ?? "anonymous"],
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: WorkspaceMemberDTO[] }>("/api/workspace/members", {
        session: { workspaceId, authToken },
      });

      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
  });
}
