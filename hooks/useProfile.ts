"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type ProfileDTO = {
  id: string;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type UpdateProfilePayload = Partial<Pick<ProfileDTO, "fullName" | "jobTitle" | "avatarUrl">>;

const profileQueryKey = (userId: string | null) => ["profile", userId ?? "anonymous"] as const;

export function useProfileQuery() {
  const { userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: async () => (await fetchApiJson<{ data: ProfileDTO }>("/api/profile", { session: {} })).data,
    enabled: isReady && Boolean(userId),
  });
}

export function useUpdateProfileMutation() {
  const { userId } = useSessionContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) =>
      (
        await fetchApiJson<{ data: ProfileDTO }>("/api/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          session: {},
          body: JSON.stringify(payload),
        })
      ).data,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(userId), profile);
    },
  });
}
