"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_CANVAS_STATE } from "@/lib/flowchart/constants";
import type {
  CanvasState,
  Flowchart,
  FlowchartComment,
  FlowchartVersion,
} from "@/types/flowchart";

// ===== Configuration =====

type StorageMode = "database" | "localStorage";

// Set this to "localStorage" to use localStorage instead of database
const STORAGE_MODE: StorageMode = "localStorage";

// ===== localStorage keys =====

const FLOWCHART_KEY = "orbit-flowcharts";
const COMMENT_KEY = "orbit-flowchart-comments";
const VERSION_KEY = "orbit-flowchart-versions";
const ACCESS_KEY = "orbit-flowchart-access";

// ===== Helpers =====

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function loadFlowcharts(): Flowchart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FLOWCHART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFlowcharts(flowcharts: Flowchart[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FLOWCHART_KEY, JSON.stringify(flowcharts));
}

function loadComments(flowchartId: string): FlowchartComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${COMMENT_KEY}-${flowchartId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveComments(flowchartId: string, comments: FlowchartComment[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${COMMENT_KEY}-${flowchartId}`,
    JSON.stringify(comments),
  );
}

function loadVersions(flowchartId: string): FlowchartVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${VERSION_KEY}-${flowchartId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVersions(flowchartId: string, versions: FlowchartVersion[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${VERSION_KEY}-${flowchartId}`,
    JSON.stringify(versions),
  );
}

// ===== Hooks =====

export function useFlowcharts(search = "", limit = 20, offset = 0) {
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (STORAGE_MODE !== "localStorage") {
      setLoading(false);
      return;
    }

    const loaded = loadFlowcharts();
    let filtered = loaded;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = loaded.filter((fc) =>
        fc.title.toLowerCase().includes(lowerSearch),
      );
    }

    setTotal(filtered.length);
    setFlowcharts(filtered.slice(offset, offset + limit));
    setLoading(false);
  }, [search, limit, offset]);

  return { flowcharts, total, loading };
}

export function useFlowchart(id: string | null) {
  const [flowchart, setFlowchart] = useState<Flowchart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || STORAGE_MODE !== "localStorage") {
      setLoading(false);
      return;
    }

    const loaded = loadFlowcharts();
    const found = loaded.find((fc) => fc.id === id) || null;
    setFlowchart(found);
    setLoading(false);
  }, [id]);

  return { flowchart, loading };
}

export function useCreateFlowchart() {
  return useCallback((payload: {
    title: string;
    mode?: "infinite" | "page";
    pageSize?: "a4" | "letter" | "custom";
    canvasState?: CanvasState;
  }) => {
    if (STORAGE_MODE !== "localStorage") return null;

    const flowcharts = loadFlowcharts();
    const newFlowchart: Flowchart = {
      id: generateId(),
      workspaceId: "local",
      ownerId: "local-user",
      title: payload.title,
      description: null,
      mode: payload.mode ?? "infinite",
      pageSize: payload.pageSize ?? null,
      pageWidth: null,
      pageHeight: null,
      diagramType: null,
      canvasState: payload.canvasState ?? DEFAULT_CANVAS_STATE,
      thumbnailUrl: null,
      isPublic: false,
      publicToken: null,
      createdAt: now(),
      updatedAt: now(),
    };
    flowcharts.push(newFlowchart);
    saveFlowcharts(flowcharts);
    return newFlowchart;
  }, []);
}

export function useUpdateFlowchart() {
  return useCallback((id: string, updates: Partial<Flowchart>) => {
    if (STORAGE_MODE !== "localStorage") return null;

    const flowcharts = loadFlowcharts();
    const index = flowcharts.findIndex((fc) => fc.id === id);
    if (index === -1) return null;

    const updated = { ...flowcharts[index], ...updates, updatedAt: now() };
    flowcharts[index] = updated;
    saveFlowcharts(flowcharts);
    return updated;
  }, []);
}

export function useDeleteFlowchart() {
  return useCallback((id: string) => {
    if (STORAGE_MODE !== "localStorage") return false;

    const flowcharts = loadFlowcharts();
    const filtered = flowcharts.filter((fc) => fc.id !== id);
    if (filtered.length === flowcharts.length) return false;

    saveFlowcharts(filtered);

    // Also delete associated comments and versions
    window.localStorage.removeItem(`${COMMENT_KEY}-${id}`);
    window.localStorage.removeItem(`${VERSION_KEY}-${id}`);
    window.localStorage.removeItem(`${ACCESS_KEY}-${id}`);

    return true;
  }, []);
}

export function useSaveCanvas() {
  return useCallback((id: string, canvasState: CanvasState) => {
    if (STORAGE_MODE !== "localStorage") return null;

    const flowcharts = loadFlowcharts();
    const index = flowcharts.findIndex((fc) => fc.id === id);
    if (index === -1) return null;

    const updated = {
      ...flowcharts[index],
      canvasState,
      updatedAt: now(),
    };
    flowcharts[index] = updated;
    saveFlowcharts(flowcharts);
    return updated;
  }, []);
}

export function useFlowchartComments(flowchartId: string | null) {
  const [comments, setComments] = useState<FlowchartComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flowchartId || STORAGE_MODE !== "localStorage") {
      setLoading(false);
      return;
    }

    const loaded = loadComments(flowchartId);
    setComments(loaded);
    setLoading(false);
  }, [flowchartId]);

  return { comments, loading };
}

export function useAddComment() {
  return useCallback((flowchartId: string, comment: Omit<FlowchartComment, "id" | "createdAt" | "updatedAt">) => {
    if (STORAGE_MODE !== "localStorage") return null;

    const comments = loadComments(flowchartId);
    const newComment: FlowchartComment = {
      ...comment,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    comments.push(newComment);
    saveComments(flowchartId, comments);
    return newComment;
  }, []);
}

export function useDeleteComment() {
  return useCallback((flowchartId: string, commentId: string) => {
    if (STORAGE_MODE !== "localStorage") return false;

    const comments = loadComments(flowchartId);
    const filtered = comments.filter((c) => c.id !== commentId);
    if (filtered.length === comments.length) return false;

    saveComments(flowchartId, filtered);
    return true;
  }, []);
}

export function useFlowchartVersions(flowchartId: string | null) {
  const [versions, setVersions] = useState<FlowchartVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flowchartId || STORAGE_MODE !== "localStorage") {
      setLoading(false);
      return;
    }

    const loaded = loadVersions(flowchartId);
    setVersions(loaded);
    setLoading(false);
  }, [flowchartId]);

  return { versions, loading };
}

export function useCreateVersion() {
  return useCallback((flowchartId: string, label?: string) => {
    if (STORAGE_MODE !== "localStorage") return null;

    const flowcharts = loadFlowcharts();
    const flowchart = flowcharts.find((fc) => fc.id === flowchartId);
    if (!flowchart) return null;

    const versions = loadVersions(flowchartId);
    const newVersion: FlowchartVersion = {
      id: generateId(),
      flowchartId,
      snapshot: flowchart.canvasState,
      label: label ?? null,
      createdBy: "local-user",
      createdAt: now(),
    };
    versions.push(newVersion);

    // Keep only last 100 versions
    const trimmed = versions.slice(-100);
    saveVersions(flowchartId, trimmed);
    return newVersion;
  }, []);
}

export function useRestoreVersion() {
  return useCallback((flowchartId: string, versionId: string) => {
    if (STORAGE_MODE !== "localStorage") return null;

    const versions = loadVersions(flowchartId);
    const version = versions.find((v) => v.id === versionId);
    if (!version) return null;

    const flowcharts = loadFlowcharts();
    const index = flowcharts.findIndex((fc) => fc.id === flowchartId);
    if (index === -1) return null;

    const updated = {
      ...flowcharts[index],
      canvasState: version.snapshot,
      updatedAt: now(),
    };
    flowcharts[index] = updated;
    saveFlowcharts(flowcharts);
    return updated;
  }, []);
}
