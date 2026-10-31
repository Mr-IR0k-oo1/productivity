"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type ApiKeyScope = "read" | "write";

export type ApiKeyDTO = {
  id: string;
  name: string;
  prefix: string;
  scope: ApiKeyScope;
  userId: string;
  ownerName: string | null;
  ownerEmail: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type CreateApiKeyInput = { name: string; scope: ApiKeyScope; expiresInDays: 30 | 90 | 365 | null };

const apiKeysQueryKey = (workspaceId: string) => ["api-keys", workspaceId] as const;

export function useApiKeysQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  return useQuery({
    queryKey: apiKeysQueryKey(workspaceId),
    queryFn: async () => (await fetchApiJson<{ data: ApiKeyDTO[] }>("/api/api-keys", { session: { workspaceId, authToken } })).data,
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
  });
}

export function useCreateApiKeyMutation() {
  const { workspaceId, authToken } = useSessionContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApiKeyInput) =>
      fetchApiJson<{ data: Pick<ApiKeyDTO, "id" | "name" | "prefix" | "scope" | "expiresAt" | "createdAt">; key: string }>(
        "/api/api-keys",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          session: { workspaceId, authToken },
          body: JSON.stringify(input),
        },
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: apiKeysQueryKey(workspaceId) }),
  });
}

export function useRevokeApiKeyMutation() {
  const { workspaceId, authToken } = useSessionContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApiJson<undefined>(`/api/api-keys/${id}/revoke`, { method: "POST", session: { workspaceId, authToken } }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: apiKeysQueryKey(workspaceId) }),
  });
}
