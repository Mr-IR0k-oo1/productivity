"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/components/providers/SessionProvider";

export type DocumentDTO = {
  id: string;
  workspaceId: string;
  title: string;
  folder: string;
  author: string;
  content: string;
  updatedAt: string;
};

const DEFAULT_DOCS: DocumentDTO[] = [
  {
    id: "doc-1",
    workspaceId: "default",
    title: "Product Architecture & Engineering RFC",
    folder: "Engineering",
    author: "Alex Chen",
    content: "# Product Architecture & Engineering RFC\n\n## Overview\nOrbit provides a unified B2B execution system. The system leverages Next.js App Router for frontend presentation, Axum + Postgres for multi-tenant data consistency, and Tauri 2 for cross-platform desktop execution.\n\n## Core Principles\n- Zero latency interactions\n- Robust role-based access control\n- Unified task and project lineage",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-2",
    workspaceId: "default",
    title: "Q4 Roadmap & Feature Deliverables",
    folder: "Product",
    author: "Sarah Lin",
    content: "# Q4 Roadmap & Feature Deliverables\n\n### Strategic Priorities\n1. Multi-tenant workspace switcher\n2. Real-time notification inbox & triage\n3. OKR hierarchy tracking\n4. Tauri desktop installer signed builds",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-3",
    workspaceId: "default",
    title: "Company Onboarding & Employee Handbook",
    folder: "Operations",
    author: "David Miller",
    content: "# Company Onboarding & Employee Handbook\n\nWelcome to Orbit! This document outlines our company values, asynchronous communication guidelines, sprint cycles, and security standards.",
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY_PREFIX = "orbit_docs_";

function loadDocs(workspaceId: string): DocumentDTO[] {
  if (typeof window === "undefined") return DEFAULT_DOCS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workspaceId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_DOCS;
}

function saveDocs(workspaceId: string, docs: DocumentDTO[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${workspaceId}`, JSON.stringify(docs));
  } catch {}
}

export function useDocumentsQuery() {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";

  return useQuery({
    queryKey: ["documents", effectiveId],
    queryFn: async () => loadDocs(effectiveId),
  });
}

export function useDocumentQuery(docId: string | undefined) {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";

  return useQuery({
    queryKey: ["document", effectiveId, docId],
    queryFn: async () => {
      if (!docId) return null;
      const all = loadDocs(effectiveId);
      return all.find((d) => d.id === docId) || null;
    },
    enabled: Boolean(docId),
  });
}

export function useCreateDocumentMutation() {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, folder, author }: { title: string; folder: string; author: string }) => {
      const all = loadDocs(effectiveId);
      const newDoc: DocumentDTO = {
        id: `doc-${Date.now()}`,
        workspaceId: effectiveId,
        title,
        folder,
        author,
        content: `# ${title}\n\nStart writing document content here...`,
        updatedAt: new Date().toISOString(),
      };
      const updated = [newDoc, ...all];
      saveDocs(effectiveId, updated);
      return newDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", effectiveId] });
    },
  });
}

export function useUpdateDocumentMutation() {
  const { workspaceId } = useSessionContext();
  const effectiveId = workspaceId || "default";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title?: string; content?: string }) => {
      const all = loadDocs(effectiveId);
      const index = all.findIndex((d) => d.id === id);
      if (index === -1) throw new Error("Document not found");

      const existing = all[index];
      const updated: DocumentDTO = {
        ...existing,
        title: title ?? existing.title,
        content: content ?? existing.content,
        updatedAt: new Date().toISOString(),
      };
      all[index] = updated;
      saveDocs(effectiveId, all);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", effectiveId] });
      queryClient.invalidateQueries({ queryKey: ["document", effectiveId, data.id] });
    },
  });
}
