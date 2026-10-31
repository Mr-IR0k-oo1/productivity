"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/providers/SessionProvider";

export type GoalCategory = "company" | "team" | "personal";
export type GoalStatus = "on_track" | "at_risk" | "behind" | "completed";

export type KeyResultDTO = {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  progress: number; // 0 - 100
};

export type GoalDTO = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  category: GoalCategory;
  owner: string;
  period: string; // e.g. "Q4 2026"
  status: GoalStatus;
  progress: number; // 0 - 100
  keyResults: KeyResultDTO[];
  relatedProjectId?: string | null;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_GOALS: GoalDTO[] = [
  {
    id: "goal-1",
    workspaceId: "default",
    title: "Accelerate Product Delivery Velocity by 40%",
    description: "Streamline cross-team sprint workflows, reduce review cycle latency, and maintain 99.9% release stability.",
    category: "company",
    owner: "Alex Chen",
    period: "Q4 2026",
    status: "on_track",
    progress: 72,
    keyResults: [
      { id: "kr-1", title: "Decrease PR time-to-merge from 24h to 8h", current: 12, target: 8, unit: "hours", progress: 75 },
      { id: "kr-2", title: "Ship 12 completed sprint epics", current: 9, target: 12, unit: "epics", progress: 75 },
      { id: "kr-3", title: "Automate test suite coverage to 85%", current: 78, target: 85, unit: "%", progress: 65 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "goal-2",
    workspaceId: "default",
    title: "Launch Native Desktop Beta for Windows and macOS",
    description: "Deliver signed Tauri 2 desktop packages with native notifications and offline workspace caching.",
    category: "team",
    owner: "Sarah Lin",
    period: "Q4 2026",
    status: "on_track",
    progress: 85,
    keyResults: [
      { id: "kr-4", title: "Pass Tauri 2 multi-platform compilation", current: 3, target: 3, unit: "platforms", progress: 100 },
      { id: "kr-5", title: "Achieve sub-100ms startup launch time", current: 88, target: 100, unit: "ms", progress: 90 },
      { id: "kr-6", title: "Complete private beta with 50 pilot customers", current: 35, target: 50, unit: "teams", progress: 70 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "goal-3",
    workspaceId: "default",
    title: "Establish SOC2 & Enterprise Security Readiness",
    description: "Complete formal audit logging, encrypted token rotation, and single-tenant self-hosted isolation.",
    category: "company",
    owner: "David Miller",
    period: "Q4 2026",
    status: "at_risk",
    progress: 45,
    keyResults: [
      { id: "kr-7", title: "Immutable audit log event capture", current: 100, target: 100, unit: "%", progress: 100 },
      { id: "kr-8", title: "Third-party penetration testing resolution", current: 2, target: 5, unit: "remediations", progress: 40 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY_PREFIX = "orbit_goals_";

function loadGoals(workspaceId: string): GoalDTO[] {
  if (typeof window === "undefined") return DEFAULT_GOALS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workspaceId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_GOALS;
}

function saveGoals(workspaceId: string, goals: GoalDTO[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${workspaceId}`, JSON.stringify(goals));
  } catch {}
}

export function useGoalsQuery() {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";

  return useQuery({
    queryKey: ["goals", effectiveId],
    queryFn: async () => {
      return loadGoals(effectiveId);
    },
  });
}

export function useGoalQuery(goalId: string | undefined) {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";

  return useQuery({
    queryKey: ["goal", effectiveId, goalId],
    queryFn: async () => {
      if (!goalId) return null;
      const all = loadGoals(effectiveId);
      return all.find((g) => g.id === goalId) || null;
    },
    enabled: Boolean(goalId),
  });
}

export function useCreateGoalMutation() {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<GoalDTO, "id" | "workspaceId" | "createdAt" | "updatedAt">) => {
      const all = loadGoals(effectiveId);
      const newGoal: GoalDTO = {
        ...input,
        id: `goal-${Date.now()}`,
        workspaceId: effectiveId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newGoal, ...all];
      saveGoals(effectiveId, updated);
      return newGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", effectiveId] });
    },
  });
}

export function useUpdateKeyResultMutation() {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, krId, current }: { goalId: string; krId: string; current: number }) => {
      const all = loadGoals(effectiveId);
      const goalIndex = all.findIndex((g) => g.id === goalId);
      if (goalIndex === -1) throw new Error("Goal not found");

      const goal = all[goalIndex];
      const updatedKrs = goal.keyResults.map((kr) => {
        if (kr.id !== krId) return kr;
        const target = kr.target || 1;
        const progress = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
        return { ...kr, current, progress };
      });

      const avgProgress =
        updatedKrs.length > 0
          ? Math.round(updatedKrs.reduce((sum, kr) => sum + kr.progress, 0) / updatedKrs.length)
          : 0;

      const updatedGoal: GoalDTO = {
        ...goal,
        keyResults: updatedKrs,
        progress: avgProgress,
        status: avgProgress === 100 ? "completed" : avgProgress > 60 ? "on_track" : avgProgress > 30 ? "at_risk" : "behind",
        updatedAt: new Date().toISOString(),
      };

      all[goalIndex] = updatedGoal;
      saveGoals(effectiveId, all);
      return updatedGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals", effectiveId] });
      queryClient.invalidateQueries({ queryKey: ["goal", effectiveId, data.id] });
    },
  });
}
