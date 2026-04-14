"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type IdeaDTO = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  status: "draft" | "validated" | "archived" | "converted";
  authorId: string;
  createdAt: string;
  convertedTaskId: string | null;
};

function buildHeaders() {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("pf-token") : null;

  return {
    "content-type": "application/json",
    "x-workspace-id": "demo-workspace",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchIdeas() {
  const response = await fetch("/api/ideas", {
    headers: {
      "x-workspace-id": "demo-workspace",
      ...(() => {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("pf-token") : null;
        return token ? { authorization: `Bearer ${token}` } : {};
      })(),
    },
  });

  if (!response.ok) throw new Error("Failed to load ideas");
  const payload = (await response.json()) as { data: IdeaDTO[] };
  return payload.data;
}

export function useIdeasQuery() {
  return useQuery({
    queryKey: ["ideas"],
    queryFn: fetchIdeas,
    retry: false,
  });
}

export function useCreateIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; summary?: string; content?: string }) => {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create idea");
      return (await response.json()) as { data: IdeaDTO };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useConvertIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { ideaId: string; status?: "todo" | "in_progress" | "done" | "blocked" | "backlog" }) => {
      const response = await fetch(`/api/ideas/${payload.ideaId}/convert`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ status: payload.status ?? "todo" }),
      });

      if (!response.ok) throw new Error("Failed to convert idea");
      return (await response.json()) as { data: { id: string } };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}
