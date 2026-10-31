"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { fetchApiJson } from "@/lib/api/client";

export type ProjectStatus = "active" | "completed" | "archived";

export type ProjectDTO = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
};

export type UpdateProjectInput = {
  id: string;
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
};

export const projectsQueryKey = (workspaceId: string) => ["projects", workspaceId] as const;
export const projectDetailQueryKey = (workspaceId: string, projectId: string) =>
  ["project", workspaceId, projectId] as const;

export function useProjectsQuery() {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: projectsQueryKey(workspaceId),
    queryFn: async () => {
      const payload = await fetchApiJson<{ data: ProjectDTO[] }>("/api/projects", {
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId),
  });
}

export function useProjectQuery(projectId: string | null | undefined) {
  const { workspaceId, authToken, userId, isReady } = useSessionContext();

  return useQuery({
    queryKey: projectDetailQueryKey(workspaceId, projectId ?? ""),
    queryFn: async () => {
      if (!projectId) return null;
      const payload = await fetchApiJson<{ data: ProjectDTO }>(`/api/projects/${projectId}`, {
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    enabled: isReady && Boolean(workspaceId) && Boolean(userId) && Boolean(projectId),
  });
}

export function useCreateProjectMutation() {
  const { workspaceId, authToken } = useSessionContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const payload = await fetchApiJson<{ data: ProjectDTO }>("/api/projects", {
        method: "POST",
        body: JSON.stringify(input),
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKey(workspaceId) });
    },
  });
}

export function useUpdateProjectMutation() {
  const { workspaceId, authToken } = useSessionContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProjectInput) => {
      const payload = await fetchApiJson<{ data: ProjectDTO }>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
        session: { workspaceId, authToken },
      });
      return payload.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKey(workspaceId) });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(workspaceId, data.id) });
      }
    },
  });
}

export function useDeleteProjectMutation() {
  const { workspaceId, authToken } = useSessionContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await fetchApiJson<{ success: boolean }>(`/api/projects/${id}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKey(workspaceId) });
      queryClient.removeQueries({ queryKey: projectDetailQueryKey(workspaceId, id) });
    },
  });
}
