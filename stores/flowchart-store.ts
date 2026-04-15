import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

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
};

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
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/flowcharts");
      if (!res.ok) throw new Error("Failed to load flowcharts");
      const json = await res.json();
      set({ flowcharts: json.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error", isLoading: false });
    }
  },

  createFlowchart: async (name: string) => {
    try {
      const res = await fetch("/api/flowcharts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data: { nodes: [], edges: [] } }),
      });
      if (!res.ok) throw new Error("Failed to create flowchart");
      const json = await res.json();
      const flowchart = json.data;
      set((state) => ({ flowcharts: [flowchart, ...state.flowcharts] }));
      return flowchart;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
      return null;
    }
  },

  saveFlowchart: async (id: string, data: FlowchartData) => {
    try {
      const res = await fetch(`/api/flowcharts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error("Failed to save flowchart");
      const json = await res.json();
      set((state) => ({
        flowcharts: state.flowcharts.map((f) => (f.id === id ? json.data : f)),
        activeFlowchart: state.activeFlowchart?.id === id ? json.data : state.activeFlowchart,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  renameFlowchart: async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/flowcharts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename flowchart");
      const json = await res.json();
      set((state) => ({
        flowcharts: state.flowcharts.map((f) => (f.id === id ? json.data : f)),
        activeFlowchart: state.activeFlowchart?.id === id ? json.data : state.activeFlowchart,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },

  deleteFlowchart: async (id: string) => {
    try {
      const res = await fetch(`/api/flowcharts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete flowchart");
      set((state) => ({
        flowcharts: state.flowcharts.filter((f) => f.id !== id),
        activeFlowchart: state.activeFlowchart?.id === id ? null : state.activeFlowchart,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  },
}));
