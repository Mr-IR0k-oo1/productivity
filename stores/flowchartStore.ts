"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { DEFAULT_CANVAS_STATE, DEFAULT_EDGE_DATA } from "@/lib/flowchart/constants";
import type {
  CanvasMode,
  CanvasState,
  CursorPosition,
  OrbitEdge,
  OrbitEdgeData,
  OrbitNode,
  OrbitNodeData,
  ShapeVariant,
  Viewport,
} from "@/types/flowchart";

type ActiveTool =
  | "select"
  | "hand"
  | "shape"
  | "text"
  | "sticky"
  | "image"
  | "task_card"
  | "idea_card"
  | "group"
  | "code"
  | "connector"
  | "comment";

export type FlowchartStore = {
  nodes: OrbitNode[];
  edges: OrbitEdge[];
  viewport: Viewport;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  activeTool: ActiveTool;
  activeShapeVariant: ShapeVariant;
  mode: CanvasMode;
  showComments: boolean;
  showVersions: boolean;
  showMinimap: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  history: CanvasState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  remoteUsers: Map<string, CursorPosition>;
  isDirty: boolean;
  lastSavedAt: Date | null;
  isSaving: boolean;
  setNodes: (nodes: OrbitNode[]) => void;
  setEdges: (edges: OrbitEdge[]) => void;
  setViewport: (viewport: Viewport) => void;
  addNode: (node: OrbitNode) => void;
  updateNode: (id: string, data: Partial<OrbitNodeData>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: OrbitEdge) => void;
  updateEdge: (id: string, data: Partial<OrbitEdgeData>) => void;
  deleteEdge: (id: string) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setActiveShapeVariant: (variant: ShapeVariant) => void;
  setMode: (mode: CanvasMode) => void;
  toggleComments: () => void;
  toggleVersions: () => void;
  toggleMinimap: () => void;
  toggleGrid: () => void;
  setSnapToGrid: (value: boolean) => void;
  setGridSize: (value: number) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: (state: CanvasState) => void;
  loadCanvas: (state: CanvasState, mode?: CanvasMode) => void;
  setRemoteCursor: (pos: CursorPosition) => void;
  removeRemoteCursor: (userId: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  markSaved: () => void;
  reset: () => void;
};

function cloneCanvasState(state: CanvasState): CanvasState {
  if (typeof structuredClone === "function") {
    return structuredClone(state);
  }

  return JSON.parse(JSON.stringify(state)) as CanvasState;
}

function snapshotFromStore(store: Pick<FlowchartStore, "nodes" | "edges" | "viewport">): CanvasState {
  return cloneCanvasState({
    nodes: store.nodes,
    edges: store.edges,
    viewport: store.viewport,
  });
}

function updateHistoryFlags(store: Pick<FlowchartStore, "history" | "historyIndex" | "canUndo" | "canRedo">): void {
  store.canUndo = store.historyIndex > 0;
  store.canRedo = store.historyIndex < store.history.length - 1;
}

export const useFlowchartStore = create<FlowchartStore>()(
  immer((set, get) => ({
    nodes: [],
    edges: [],
    viewport: { ...DEFAULT_CANVAS_STATE.viewport },
    selectedNodeIds: [],
    selectedEdgeIds: [],
    activeTool: "select",
    activeShapeVariant: "rectangle",
    mode: "infinite",
    showComments: true,
    showVersions: false,
    showMinimap: true,
    showGrid: true,
    snapToGrid: false,
    gridSize: 20,
    history: [cloneCanvasState(DEFAULT_CANVAS_STATE)],
    historyIndex: 0,
    canUndo: false,
    canRedo: false,
    remoteUsers: new Map<string, CursorPosition>(),
    isDirty: false,
    lastSavedAt: null,
    isSaving: false,
    setNodes: (nodes) =>
      set((state) => {
        state.nodes = nodes;
        state.isDirty = true;
      }),
    setEdges: (edges) =>
      set((state) => {
        state.edges = edges;
        state.isDirty = true;
      }),
    setViewport: (viewport) =>
      set((state) => {
        state.viewport = viewport;
        state.isDirty = true;
      }),
    addNode: (node) =>
      set((state) => {
        state.nodes.push(node);
        state.isDirty = true;
      }),
    updateNode: (id, data) =>
      set((state) => {
        const node = state.nodes.find((item) => item.id === id);
        if (!node) {
          return;
        }

        node.data = {
          ...node.data,
          ...data,
        } as OrbitNodeData;
        state.isDirty = true;
      }),
    deleteNode: (id) =>
      set((state) => {
        state.nodes = state.nodes.filter((node) => node.id !== id);
        state.edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
        state.selectedNodeIds = state.selectedNodeIds.filter((nodeId) => nodeId !== id);
        state.isDirty = true;
      }),
    addEdge: (edge) =>
      set((state) => {
        state.edges.push(edge);
        state.isDirty = true;
      }),
    updateEdge: (id, data) =>
      set((state) => {
        const edge = state.edges.find((item) => item.id === id);
        if (!edge) {
          return;
        }

        edge.data = {
          ...(edge.data ?? DEFAULT_EDGE_DATA),
          ...data,
        };
        state.isDirty = true;
      }),
    deleteEdge: (id) =>
      set((state) => {
        state.edges = state.edges.filter((edge) => edge.id !== id);
        state.selectedEdgeIds = state.selectedEdgeIds.filter((edgeId) => edgeId !== id);
        state.isDirty = true;
      }),
    setSelection: (nodeIds, edgeIds) =>
      set((state) => {
        state.selectedNodeIds = nodeIds;
        state.selectedEdgeIds = edgeIds;
      }),
    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
      }),
    setActiveShapeVariant: (variant) =>
      set((state) => {
        state.activeShapeVariant = variant;
      }),
    setMode: (mode) =>
      set((state) => {
        state.mode = mode;
        state.isDirty = true;
      }),
    toggleComments: () =>
      set((state) => {
        state.showComments = !state.showComments;
      }),
    toggleVersions: () =>
      set((state) => {
        state.showVersions = !state.showVersions;
      }),
    toggleMinimap: () =>
      set((state) => {
        state.showMinimap = !state.showMinimap;
      }),
    toggleGrid: () =>
      set((state) => {
        state.showGrid = !state.showGrid;
      }),
    setSnapToGrid: (value) =>
      set((state) => {
        state.snapToGrid = value;
      }),
    setGridSize: (value) =>
      set((state) => {
        state.gridSize = value;
      }),
    undo: () =>
      set((state) => {
        if (state.historyIndex <= 0) {
          return;
        }

        const nextIndex = state.historyIndex - 1;
        const snapshot = cloneCanvasState(state.history[nextIndex]);
        state.historyIndex = nextIndex;
        state.nodes = snapshot.nodes;
        state.edges = snapshot.edges;
        state.viewport = snapshot.viewport;
        state.isDirty = true;
        updateHistoryFlags(state);
      }),
    redo: () =>
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) {
          return;
        }

        const nextIndex = state.historyIndex + 1;
        const snapshot = cloneCanvasState(state.history[nextIndex]);
        state.historyIndex = nextIndex;
        state.nodes = snapshot.nodes;
        state.edges = snapshot.edges;
        state.viewport = snapshot.viewport;
        state.isDirty = true;
        updateHistoryFlags(state);
      }),
    pushHistory: (nextState) =>
      set((state) => {
        const snapshot = cloneCanvasState(nextState);
        const nextHistory = state.history.slice(0, state.historyIndex + 1);
        nextHistory.push(snapshot);
        state.history = nextHistory.slice(-100);
        state.historyIndex = state.history.length - 1;
        updateHistoryFlags(state);
      }),
    loadCanvas: (canvasState, mode = "infinite") =>
      set((state) => {
        const snapshot = cloneCanvasState(canvasState);
        state.nodes = snapshot.nodes;
        state.edges = snapshot.edges;
        state.viewport = snapshot.viewport;
        state.mode = mode;
        state.history = [snapshot];
        state.historyIndex = 0;
        state.selectedNodeIds = [];
        state.selectedEdgeIds = [];
        state.remoteUsers = new Map<string, CursorPosition>();
        state.isDirty = false;
        state.lastSavedAt = null;
        state.isSaving = false;
        updateHistoryFlags(state);
      }),
    setRemoteCursor: (pos) =>
      set((state) => {
        state.remoteUsers.set(pos.userId, pos);
      }),
    removeRemoteCursor: (userId) =>
      set((state) => {
        state.remoteUsers.delete(userId);
      }),
    setIsDirty: (dirty) =>
      set((state) => {
        state.isDirty = dirty;
      }),
    setIsSaving: (saving) =>
      set((state) => {
        state.isSaving = saving;
      }),
    markSaved: () =>
      set((state) => {
        state.isDirty = false;
        state.isSaving = false;
        state.lastSavedAt = new Date();
      }),
    reset: () =>
      set((state) => {
        const snapshot = cloneCanvasState(DEFAULT_CANVAS_STATE);
        state.nodes = [];
        state.edges = [];
        state.viewport = snapshot.viewport;
        state.selectedNodeIds = [];
        state.selectedEdgeIds = [];
        state.activeTool = "select";
        state.mode = "infinite";
        state.history = [snapshot];
        state.historyIndex = 0;
        state.remoteUsers = new Map<string, CursorPosition>();
        state.isDirty = false;
        state.lastSavedAt = null;
        state.isSaving = false;
        updateHistoryFlags(state);
      }),
  })),
);

export function getFlowchartCanvasSnapshot(): CanvasState {
  return snapshotFromStore(useFlowchartStore.getState());
}
