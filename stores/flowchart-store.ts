import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

import { fetchApiJson } from "@/lib/api/client";
import { useSessionContext } from "@/components/providers/SessionProvider";

export type FlowchartNodeData = {
  label: string;
  nodeType?: string;
};

export type FlowchartData = {
  nodes: Node<FlowchartNodeData>[];
  edges: Edge[];
};

export type Flowchart = {
  id: string;
  workspaceId: string;
  creatorId: string;
  name: string;
  data: FlowchartData;
  createdAt: string;
  updatedAt: string;
};

type FlowchartState = {
  flowcharts: Flowchart[];
  activeFlowchart: Flowchart | null;
  isLoading: boolean;
  error: string | null;

  setFlowcharts: (flowcharts: Flowchart[]) => void;
  setActiveFlowchart: (flowchart: Flowchart | null) => void;
  addFlowchart: (flowchart: Flowchart) => void;
  updateFlowchartInStore: (id: string, updates: Partial<Flowchart>) => void;
  removeFlowchart: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  loadFlowcharts: () => Promise<void>;
  createFlowchart: (name: string) => Promise<Flowchart | null>;
  saveFlowchart: (id: string, data: FlowchartData) => Promise<void>;
  renameFlowchart: (id: string, name: string) => Promise<void>;
  deleteFlowchart: (id: string) => Promise<void>;
  duplicateFlowchart: (flowchart: Flowchart) => Promise<Flowchart | null>;
};

function getSessionContext() {
  try {
    const context = useSessionContext();
    return {
      workspaceId: context.workspaceId,
      authToken: context.authToken,
      isReady: context.isReady,
    };
  } catch {
    return {
      workspaceId: undefined,
      authToken: null,
      isReady: false,
    };
  }
}

export const useFlowchartStore = create<FlowchartState>((set, get) => ({
  flowcharts: [],
  activeFlowchart: null,
  isLoading: false,
  error: null,

  setFlowcharts: (flowcharts) => set({ flowcharts }),
  setActiveFlowchart: (flowchart) => set({ activeFlowchart: flowchart }),
  addFlowchart: (flowchart) => set((state) => ({ flowcharts: [flowchart, ...state.flowcharts] })),
  updateFlowchartInStore: (id, updates) =>
    set((state) => ({
      flowcharts: state.flowcharts.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      activeFlowchart: state.activeFlowchart?.id === id ? { ...state.activeFlowchart, ...updates } : state.activeFlowchart,
    })),
  removeFlowchart: (id) =>
    set((state) => ({
      flowcharts: state.flowcharts.filter((f) => f.id !== id),
      activeFlowchart: state.activeFlowchart?.id === id ? null : state.activeFlowchart,
    })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  loadFlowcharts: async () => {
    const { workspaceId, authToken, isReady } = getSessionContext();
    if (!isReady || !workspaceId) {
      set({ error: "Session not ready", isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const json = await fetchApiJson<{ data: Flowchart[] }>("/api/flowcharts", {
        session: { workspaceId, authToken },
      });
      set({ flowcharts: json.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error", isLoading: false });
    }
  },

  createFlowchart: async (name: string) => {
    const { workspaceId, authToken, isReady } = getSessionContext();
    if (!isReady || !workspaceId) {
      set({ error: "Session not ready" });
      return null;
    }

    try {
      const json = await fetchApiJson<{ data: Flowchart }>("/api/flowcharts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify({ name, data: { nodes: [], edges: [] } }),
      });
      const flowchart = json.data;
      set((state) => ({ flowcharts: [flowchart, ...state.flowcharts] }));
      return flowchart;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
      return null;
    }
  },

  saveFlowchart: async (id: string, data: FlowchartData) => {
    const { workspaceId, authToken, isReady } = getSessionContext();
    if (!isReady || !workspaceId) return;

    try {
      const json = await fetchApiJson<{ data: Flowchart }>(`/api/flowcharts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify({ data }),
      });
      set((state) => ({
        flowcharts: state.flowcharts.map((f) => (f.id === id ? json.data : f)),
        activeFlowchart: state.activeFlowchart?.id === id ? json.data : state.activeFlowchart,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  renameFlowchart: async (id: string, name: string) => {
    const { workspaceId, authToken, isReady } = getSessionContext();
    if (!isReady || !workspaceId) return;

    try {
      const json = await fetchApiJson<{ data: Flowchart }>(`/api/flowcharts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify({ name }),
      });
      set((state) => ({
        flowcharts: state.flowcharts.map((f) => (f.id === id ? json.data : f)),
        activeFlowchart: state.activeFlowchart?.id === id ? json.data : state.activeFlowchart,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  deleteFlowchart: async (id: string) => {
    const { workspaceId, authToken, isReady } = getSessionContext();
    if (!isReady || !workspaceId) return;

    try {
      await fetchApiJson<undefined>(`/api/flowcharts/${id}`, {
        method: "DELETE",
        session: { workspaceId, authToken },
      });
      set((state) => ({
        flowcharts: state.flowcharts.filter((f) => f.id !== id),
        activeFlowchart: state.activeFlowchart?.id === id ? null : state.activeFlowchart,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  duplicateFlowchart: async (flowchart: Flowchart) => {
    const { workspaceId, authToken, isReady } = getSessionContext();
    if (!isReady || !workspaceId) return null;

    try {
      const newName = `${flowchart.name} (Copy)`;
      const json = await fetchApiJson<{ data: Flowchart }>("/api/flowcharts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        session: { workspaceId, authToken },
        body: JSON.stringify({ name: newName, data: flowchart.data }),
      });
      const duplicated = json.data;
      set((state) => ({ flowcharts: [duplicated, ...state.flowcharts] }));
      return duplicated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
      return null;
    }
  },
}));
