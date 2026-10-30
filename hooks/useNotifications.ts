"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const notificationsQueryKey = (workspaceId: string) => ["notifications", workspaceId] as const;

export function useNotificationsQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: notificationsQueryKey(workspaceId),
    queryFn: async () =>
      (await fetchApiJson<{ data: NotificationDTO[] }>("/api/notifications", { session: { workspaceId, authToken } })).data,
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
    // Light polling keeps the bell current without a realtime server.
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const { workspaceId, authToken } = useSessionContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string | "all") =>
      fetchApiJson<unknown>(notificationId === "all" ? "/api/notifications/read-all" : `/api/notifications/${notificationId}/read`, {
        method: "POST",
        session: { workspaceId, authToken },
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey(workspaceId) }),
  });
}
