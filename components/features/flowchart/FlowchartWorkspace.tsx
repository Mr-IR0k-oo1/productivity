"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { NodeTypes, OnConnect, OnEdgesChange, OnNodesChange } from "@xyflow/react";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";

import {
  ArrowLeft,
  Check,
  Download,
  ImageIcon,
  Minimize2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  Maximize2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionContext } from "@/components/providers/SessionProvider";
import {
  useFlowchartsQuery,
  useCreateFlowchartMutation,
  useUpdateFlowchartMutation,
  useDeleteFlowchartMutation,
} from "@/hooks/useFlowcharts";
import type { Flowchart, FlowchartData, FlowchartNodeData } from "@/stores/flowchart-store";
import type { Edge as FlowchartEdge } from "@xyflow/react";

import { FlowchartCanvas } from "./FlowchartCanvas";
import { FlowchartList } from "./FlowchartList";
import { NodeEditorModal } from "./NodeEditorModal";
import { NodePalette } from "./NodePalette";
import { EdgeEditorModal } from "./EdgeEditorModal";

type FlowchartNode = FlowchartData["nodes"][number];
type FlowchartPersistOptions = {
  source: string;
  silent?: boolean;
};

const flowchartDebugEnabled = process.env.NODE_ENV !== "production";
const autoSaveDelayMs = 350;

const nodeTypes: NodeTypes = {
  start: (props) => <div {...props} className="rounded-full bg-emerald-500 px-6 py-4 text-sm font-medium text-white" />,
  end: (props) => <div {...props} className="rounded-full bg-rose-500 px-6 py-4 text-sm font-medium text-white" />,
  process: (props) => <div {...props} className="min-w-[120px] rounded-lg border-2 border-zinc-600 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-100" />,
  decision: (props) => (
    <div
      {...props}
      className="min-w-[100px] rounded-lg border-2 border-amber-500 bg-amber-950/50 px-4 py-3 text-center text-sm font-medium text-amber-200"
      style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
    />
  ),
  data: (props) => (
    <div {...props} className="min-w-[120px] skew-x-[-10deg] rounded border-2 border-blue-500 bg-blue-950/50 px-4 py-3 text-sm font-medium text-blue-200" />
  ),
  delay: (props) => (
    <div {...props} className="min-w-[100px] rounded-sm border-2 border-violet-500 bg-violet-950/50 px-4 py-3 text-center text-sm font-medium text-violet-200" style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }} />
  ),
};

const nodeTypeDefaults: Record<string, Partial<FlowchartNode>> = {
  start: { data: { label: "Start", nodeType: "start" } },
  end: { data: { label: "End", nodeType: "end" } },
  process: { data: { label: "Process", nodeType: "process" } },
  decision: { data: { label: "Decision", nodeType: "decision" } },
  data: { data: { label: "Data", nodeType: "data" } },
  delay: { data: { label: "Delay", nodeType: "delay" } },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateImportedFlowchartData(value: unknown): { data?: FlowchartData; error?: string } {
  if (!isRecord(value)) {
    return { error: "Flowchart file content must be a JSON object." };
  }

  const nodes = value.nodes;
  const edges = value.edges;

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return { error: "Flowchart file must contain both nodes and edges arrays." };
  }

  const hasInvalidNode = nodes.some((node) => {
    if (!isRecord(node)) {
      return true;
    }

    const position = node.position;
    return (
      typeof node.id !== "string" ||
      !isRecord(position) ||
      typeof position.x !== "number" ||
      typeof position.y !== "number"
    );
  });

  if (hasInvalidNode) {
    return { error: "Each node must include id and position fields." };
  }

  const hasInvalidEdge = edges.some((edge) => {
    if (!isRecord(edge)) {
      return true;
    }

    return (
      typeof edge.id !== "string" ||
      typeof edge.source !== "string" ||
      typeof edge.target !== "string"
    );
  });

  if (hasInvalidEdge) {
    return { error: "Each edge must include id, source, and target fields." };
  }

  return {
    data: {
      nodes: nodes as FlowchartData["nodes"],
      edges: edges as FlowchartData["edges"],
    },
  };
}

function resolveFlowchartCanvas() {
  const flowRoot = document.querySelector(".react-flow");

  if (!flowRoot) {
    return { canvas: null, error: "Flowchart canvas container not found." };
  }

  const canvas = flowRoot.querySelector("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return { canvas: null, error: "Flowchart canvas element not found." };
  }

  return { canvas, error: null };
}

export function FlowchartWorkspace() {
  const { workspaceId, isReady } = useSessionContext();
  const { data: flowcharts = [], isLoading } = useFlowchartsQuery();
  const createMutation = useCreateFlowchartMutation();
  const updateMutation = useUpdateFlowchartMutation();
  const deleteMutation = useDeleteFlowchartMutation();

  const [activeFlowchart, setActiveFlowchart] = useState<Flowchart | null>(null);
  const [nodes, setNodes] = useState<FlowchartNode[]>([]);
  const [edges, setEdges] = useState<FlowchartEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<FlowchartNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<FlowchartEdge | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFlowchartRef = useRef<Flowchart | null>(null);
  const nodesRef = useRef<FlowchartNode[]>([]);
  const edgesRef = useRef<FlowchartEdge[]>([]);
  const autoSaveTimeoutRef = useRef<number | null>(null);

  const logFlowchartDebug = useCallback((event: string, payload?: Record<string, unknown>) => {
    if (!flowchartDebugEnabled) {
      return;
    }

    if (payload) {
      console.log(`[flowchart] ${event}`, payload);
      return;
    }

    console.log(`[flowchart] ${event}`);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const clearPendingAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    activeFlowchartRef.current = activeFlowchart;
    clearPendingAutoSave();

    if (activeFlowchart) {
      setNodes(activeFlowchart.data.nodes);
      setEdges(activeFlowchart.data.edges);
      nodesRef.current = activeFlowchart.data.nodes;
      edgesRef.current = activeFlowchart.data.edges;
      setEditName(activeFlowchart.name);
      setShowList(false);
    } else {
      setNodes([]);
      setEdges([]);
      nodesRef.current = [];
      edgesRef.current = [];
      setShowList(true);
    }
  }, [activeFlowchart, clearPendingAutoSave]);

  useEffect(() => {
    return () => clearPendingAutoSave();
  }, [clearPendingAutoSave]);

  const createBlockedReason = useMemo(() => {
    if (createMutation.isPending) {
      return "Flowchart creation is already in progress.";
    }

    if (!isReady) {
      return "Session is still loading. Please wait.";
    }

    if (!workspaceId) {
      return "No workspace selected.";
    }

    return null;
  }, [createMutation.isPending, isReady, workspaceId]);

  const saveBlockedReason = useMemo(() => {
    if (isSaving) {
      return "Save is already in progress.";
    }

    if (!isReady) {
      return "Session is still loading. Please wait.";
    }

    if (!workspaceId) {
      return "No workspace selected.";
    }

    if (!activeFlowchart) {
      return "No active flowchart selected.";
    }

    return null;
  }, [activeFlowchart, isReady, isSaving, workspaceId]);

  const persistFlowchartUpdate = useCallback(
    (nextNodes: FlowchartNode[], nextEdges: FlowchartEdge[], options: FlowchartPersistOptions) => {
      const flowchart = activeFlowchartRef.current;

      if (!flowchart) {
        logFlowchartDebug("persist:skipped", {
          source: options.source,
          reason: "no-active-flowchart",
        });
        return;
      }

      const silent = options.silent ?? true;
      logFlowchartDebug("persist:start", {
        source: options.source,
        flowchartId: flowchart.id,
        nodes: nextNodes.length,
        edges: nextEdges.length,
      });

      updateMutation.mutate(
        { id: flowchart.id, data: { nodes: nextNodes, edges: nextEdges } },
        {
          onSuccess: () => {
            logFlowchartDebug("persist:success", {
              source: options.source,
              flowchartId: flowchart.id,
            });
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : "Unknown error";
            logFlowchartDebug("persist:error", {
              source: options.source,
              flowchartId: flowchart.id,
              error: message,
            });

            if (!silent) {
              showToast("Failed to update flowchart", "error");
            }
          },
        },
      );
    },
    [logFlowchartDebug, showToast, updateMutation],
  );

  const scheduleAutoSave = useCallback(
    (nextNodes: FlowchartNode[], nextEdges: FlowchartEdge[], source: string) => {
      nodesRef.current = nextNodes;
      edgesRef.current = nextEdges;

      clearPendingAutoSave();
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        autoSaveTimeoutRef.current = null;
        persistFlowchartUpdate(nodesRef.current, edgesRef.current, { source });
      }, autoSaveDelayMs);
    },
    [clearPendingAutoSave, persistFlowchartUpdate],
  );

  const onNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      if (changes.length === 0) {
        return;
      }

      setNodes((currentNodes) => {
        const updatedNodes = applyNodeChanges(changes, currentNodes) as FlowchartNode[];
        nodesRef.current = updatedNodes;

        const shouldPersist = changes.some((change) => change.type !== "select");
        if (shouldPersist) {
          scheduleAutoSave(updatedNodes, edgesRef.current, "nodes:change");
        }

        return updatedNodes;
      });
    },
    [scheduleAutoSave],
  );

  const onEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      if (changes.length === 0) {
        return;
      }

      setEdges((currentEdges) => {
        const updatedEdges = applyEdgeChanges(changes, currentEdges);
        edgesRef.current = updatedEdges;

        const shouldPersist = changes.some((change) => change.type !== "select");
        if (shouldPersist) {
          scheduleAutoSave(nodesRef.current, updatedEdges, "edges:change");
        }

        return updatedEdges;
      });
    },
    [scheduleAutoSave],
  );

  const onConnect = useCallback<OnConnect>(
    (params) => {
      if (!params.source || !params.target) {
        logFlowchartDebug("connect:blocked", {
          reason: "missing-source-or-target",
          source: params.source,
          target: params.target,
        });
        return;
      }

      const newEdge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        animated: true,
        style: { stroke: "#60a5fa", strokeWidth: 2 },
      };

      logFlowchartDebug("connect:add-edge", {
        source: params.source,
        target: params.target,
        edgeId: newEdge.id,
      });

      setEdges((currentEdges) => {
        const updatedEdges = [...currentEdges, newEdge];
        edgesRef.current = updatedEdges;
        scheduleAutoSave(nodesRef.current, updatedEdges, "edges:connect");
        return updatedEdges;
      });
    },
    [logFlowchartDebug, scheduleAutoSave],
  );

  const handleSave = useCallback(async () => {
    const flowchart = activeFlowchartRef.current;
    if (!flowchart) {
      return;
    }

    if (!isReady || !workspaceId) {
      logFlowchartDebug("save:blocked", {
        isReady,
        hasWorkspaceId: Boolean(workspaceId),
      });
      showToast("Session is not ready for saving.", "error");
      return;
    }

    clearPendingAutoSave();
    setIsSaving(true);
    logFlowchartDebug("save:start", {
      flowchartId: flowchart.id,
      nodes: nodesRef.current.length,
      edges: edgesRef.current.length,
    });

    try {
      await updateMutation.mutateAsync({
        id: flowchart.id,
        data: { nodes: nodesRef.current, edges: edgesRef.current },
      });
      logFlowchartDebug("save:success", { flowchartId: flowchart.id });
      showToast("Flowchart saved successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("save:error", { flowchartId: flowchart.id, error: message });
      showToast(`Failed to save flowchart: ${message}`, "error");
    } finally {
      setIsSaving(false);
    }
  }, [clearPendingAutoSave, isReady, logFlowchartDebug, showToast, updateMutation, workspaceId]);

  const handleAddNode = useCallback((type: string) => {
    const defaultNode = nodeTypeDefaults[type];
    const newNode: FlowchartNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: defaultNode.data || { label: type },
    };

    const updatedNodes = [...nodesRef.current, newNode];
    nodesRef.current = updatedNodes;
    setNodes(updatedNodes);
    logFlowchartDebug("node:add", { type, nodeId: newNode.id });
    persistFlowchartUpdate(updatedNodes, edgesRef.current, { source: "node:add" });
  }, [logFlowchartDebug, persistFlowchartUpdate]);

  const handleNodeClick = useCallback((_: unknown, node: FlowchartNode) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDoubleClick = useCallback((_: unknown, node: FlowchartNode) => {
    setSelectedNode(node);
  }, []);

  const handleUpdateNode = useCallback((id: string, data: FlowchartNodeData) => {
    const updatedNodes = nodesRef.current.map((node) => (node.id === id ? { ...node, data } : node));
    nodesRef.current = updatedNodes;
    setNodes(updatedNodes);
    logFlowchartDebug("node:update", { nodeId: id, label: data.label });
    persistFlowchartUpdate(updatedNodes, edgesRef.current, { source: "node:update" });
    setSelectedNode(null);
  }, [logFlowchartDebug, persistFlowchartUpdate]);

  const handleEdgeClick = useCallback((_: unknown, edge: FlowchartEdge) => {
    setSelectedEdge(edge);
  }, []);

  const handleUpdateEdge = useCallback((id: string, data: { label?: string }) => {
    const updatedEdges = edgesRef.current.map((edge) =>
      edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge,
    );
    edgesRef.current = updatedEdges;
    setEdges(updatedEdges);
    logFlowchartDebug("edge:update", { edgeId: id, label: data.label ?? "" });
    persistFlowchartUpdate(nodesRef.current, updatedEdges, { source: "edge:update" });
    setSelectedEdge(null);
  }, [logFlowchartDebug, persistFlowchartUpdate]);

  const handleDeleteEdge = useCallback((id: string) => {
    const updatedEdges = edgesRef.current.filter((edge) => edge.id !== id);
    edgesRef.current = updatedEdges;
    setEdges(updatedEdges);
    logFlowchartDebug("edge:delete", { edgeId: id });
    persistFlowchartUpdate(nodesRef.current, updatedEdges, { source: "edge:delete", silent: false });
    setSelectedEdge(null);
    showToast("Connection deleted");
  }, [logFlowchartDebug, persistFlowchartUpdate, showToast]);

  const handleDeleteNode = useCallback((id: string) => {
    const updatedNodes = nodesRef.current.filter((node) => node.id !== id);
    const updatedEdges = edgesRef.current.filter((edge) => edge.source !== id && edge.target !== id);

    nodesRef.current = updatedNodes;
    edgesRef.current = updatedEdges;
    setNodes(updatedNodes);
    setEdges(updatedEdges);

    logFlowchartDebug("node:delete", { nodeId: id });
    persistFlowchartUpdate(updatedNodes, updatedEdges, { source: "node:delete", silent: false });
    setSelectedNode(null);
    showToast("Node deleted");
  }, [logFlowchartDebug, persistFlowchartUpdate, showToast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeFlowchartRef.current) {
        return;
      }

      if (event.key === "Delete" && selectedNode) {
        handleDeleteNode(selectedNode.id);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        void handleSave();
      }

      if (event.key === "Escape" && selectedNode) {
        setSelectedNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteNode, handleSave, selectedNode]);

  const handleCreate = useCallback(async () => {
    logFlowchartDebug("create:click", {
      isReady,
      hasWorkspaceId: Boolean(workspaceId),
      isPending: createMutation.isPending,
    });

    if (createBlockedReason) {
      logFlowchartDebug("create:blocked", { reason: createBlockedReason });
      showToast(createBlockedReason, "error");
      return;
    }

    try {
      logFlowchartDebug("create:start", { workspaceId });
      const result = await createMutation.mutateAsync({ name: "Untitled Flowchart" });

      if (result?.data) {
        logFlowchartDebug("create:success", {
          flowchartId: result.data.id,
          name: result.data.name,
        });
        setActiveFlowchart(result.data);
        showToast("Flowchart created");
      } else {
        logFlowchartDebug("create:error", { reason: "no-data-returned" });
        showToast("Failed to create flowchart: No data returned", "error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("create:error", { error: message });
      showToast(`Failed to create flowchart: ${message}`, "error");
    }
  }, [createBlockedReason, createMutation, isReady, logFlowchartDebug, showToast, workspaceId]);

  const handleRename = useCallback(async () => {
    const flowchart = activeFlowchartRef.current;
    const nextName = editName.trim();

    if (!flowchart || !nextName) {
      return;
    }

    try {
      logFlowchartDebug("rename:start", { flowchartId: flowchart.id, name: nextName });
      await updateMutation.mutateAsync({ id: flowchart.id, name: nextName });
      setActiveFlowchart((current) => (current ? { ...current, name: nextName } : current));
      setIsEditing(false);
      logFlowchartDebug("rename:success", { flowchartId: flowchart.id, name: nextName });
      showToast("Flowchart renamed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("rename:error", { flowchartId: flowchart.id, error: message });
      showToast(`Failed to rename flowchart: ${message}`, "error");
    }
  }, [editName, logFlowchartDebug, showToast, updateMutation]);

  const handleDelete = useCallback(async () => {
    const flowchart = activeFlowchartRef.current;
    if (!flowchart) {
      return;
    }

    if (confirm("Are you sure you want to delete this flowchart?")) {
      try {
        clearPendingAutoSave();
        logFlowchartDebug("delete:start", { flowchartId: flowchart.id });
        await deleteMutation.mutateAsync(flowchart.id);
        logFlowchartDebug("delete:success", { flowchartId: flowchart.id });
        setSelectedNode(null);
        setSelectedEdge(null);
        setActiveFlowchart(null);
        showToast("Flowchart deleted");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logFlowchartDebug("delete:error", { flowchartId: flowchart.id, error: message });
        showToast(`Failed to delete flowchart: ${message}`, "error");
      }
    }
  }, [clearPendingAutoSave, deleteMutation, logFlowchartDebug, showToast]);

  const handleDuplicate = useCallback(async (flowchart: Flowchart) => {
    try {
      logFlowchartDebug("duplicate:start", { flowchartId: flowchart.id });
      const result = await createMutation.mutateAsync({ name: `${flowchart.name} (Copy)`, data: flowchart.data });
      if (result?.data) {
        logFlowchartDebug("duplicate:success", {
          sourceId: flowchart.id,
          newId: result.data.id,
        });
        showToast("Flowchart duplicated");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("duplicate:error", { flowchartId: flowchart.id, error: message });
      showToast(`Failed to duplicate flowchart: ${message}`, "error");
    }
  }, [createMutation, logFlowchartDebug, showToast]);

  const handleBack = useCallback(() => {
    clearPendingAutoSave();
    setSelectedNode(null);
    setSelectedEdge(null);
    setActiveFlowchart(null);
    logFlowchartDebug("back-to-list");
  }, [clearPendingAutoSave, logFlowchartDebug]);

  const handleExport = useCallback(() => {
    const flowchart = activeFlowchartRef.current;
    if (!flowchart) {
      return;
    }

    const data = JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flowchart.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logFlowchartDebug("export:json", {
      flowchartId: flowchart.id,
      nodes: nodesRef.current.length,
      edges: edgesRef.current.length,
    });
    showToast("Exported as JSON");
  }, [logFlowchartDebug, showToast]);

  const handleExportPng = useCallback(async () => {
    const flowchart = activeFlowchartRef.current;
    if (!flowchart) {
      return;
    }

    setIsExportingPng(true);
    logFlowchartDebug("export:png:start", { flowchartId: flowchart.id });

    try {
      const { canvas, error } = resolveFlowchartCanvas();

      if (!canvas) {
        logFlowchartDebug("export:png:blocked", { reason: error ?? "canvas-not-found" });
        showToast(error ?? "Canvas not found", "error");
        return;
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((canvasBlob) => {
          if (canvasBlob) {
            resolve(canvasBlob);
            return;
          }

          reject(new Error("Failed to generate image blob from canvas"));
        }, "image/png");
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${flowchart.name}.png`;
      a.click();
      URL.revokeObjectURL(url);

      logFlowchartDebug("export:png:success", { flowchartId: flowchart.id });
      showToast("Exported as PNG");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("export:png:error", { flowchartId: flowchart.id, error: message });
      showToast(`Failed to export PNG: ${message}`, "error");
    } finally {
      setIsExportingPng(false);
    }
  }, [logFlowchartDebug, showToast]);

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    logFlowchartDebug("import:file-selected", {
      fileName: file.name,
      size: file.size,
      type: file.type,
    });

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const raw = loadEvent.target?.result;

        if (typeof raw !== "string") {
          showToast("Imported file could not be read as text", "error");
          logFlowchartDebug("import:error", { reason: "file-reader-non-string" });
          return;
        }

        const parsed = JSON.parse(raw) as unknown;
        const validation = validateImportedFlowchartData(parsed);

        if (!validation.data) {
          const errorMessage = validation.error ?? "Invalid flowchart file";
          showToast(errorMessage, "error");
          logFlowchartDebug("import:validation-error", { error: errorMessage });
          return;
        }

        const importedNodes = validation.data.nodes as FlowchartNode[];
        const importedEdges = validation.data.edges as FlowchartEdge[];

        setNodes(importedNodes);
        setEdges(importedEdges);
        nodesRef.current = importedNodes;
        edgesRef.current = importedEdges;

        const flowchart = activeFlowchartRef.current;
        if (!flowchart) {
          logFlowchartDebug("import:skipped", { reason: "no-active-flowchart" });
          return;
        }

        updateMutation.mutate(
          {
            id: flowchart.id,
            data: { nodes: importedNodes, edges: importedEdges },
          },
          {
            onSuccess: () => {
              logFlowchartDebug("import:success", {
                flowchartId: flowchart.id,
                nodes: importedNodes.length,
                edges: importedEdges.length,
              });
              showToast("Imported successfully");
            },
            onError: (error) => {
              const message = error instanceof Error ? error.message : "Unknown error";
              logFlowchartDebug("import:error", {
                flowchartId: flowchart.id,
                error: message,
              });
              showToast(`Failed to import flowchart: ${message}`, "error");
            },
          },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logFlowchartDebug("import:parse-error", { error: message });
        showToast(`Invalid flowchart file: ${message}`, "error");
      }
    };

    reader.onerror = () => {
      logFlowchartDebug("import:error", { reason: "file-reader-failed" });
      showToast("Failed to read flowchart file", "error");
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [logFlowchartDebug, showToast, updateMutation]);

  const handleDeleteFromList = useCallback(async (id: string) => {
    try {
      logFlowchartDebug("list:delete:start", { flowchartId: id });
      await deleteMutation.mutateAsync(id);
      logFlowchartDebug("list:delete:success", { flowchartId: id });
      showToast("Flowchart deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("list:delete:error", { flowchartId: id, error: message });
      showToast(`Failed to delete flowchart: ${message}`, "error");
    }
  }, [deleteMutation, logFlowchartDebug, showToast]);

  const handleRenameFromList = useCallback(async (id: string, name: string) => {
    try {
      logFlowchartDebug("list:rename:start", { flowchartId: id, name });
      await updateMutation.mutateAsync({ id, name });
      logFlowchartDebug("list:rename:success", { flowchartId: id, name });
      showToast("Flowchart renamed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("list:rename:error", { flowchartId: id, error: message });
      showToast(`Failed to rename flowchart: ${message}`, "error");
    }
  }, [logFlowchartDebug, showToast, updateMutation]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (showList || !activeFlowchart) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 p-4">
          <h1 className="text-xl font-semibold text-zinc-100">Flowcharts</h1>
          <Button
            onClick={handleCreate}
            disabled={Boolean(createBlockedReason)}
            title={createBlockedReason ?? undefined}
          >
            {createMutation.isPending ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {createMutation.isPending ? "Creating..." : "New Flowchart"}
          </Button>
        </div>
        <FlowchartList
          flowcharts={flowcharts}
          onSelect={setActiveFlowchart}
          onDelete={handleDeleteFromList}
          onRename={handleRenameFromList}
          onDuplicate={handleDuplicate}
        />
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 ${toast.type === "success" ? "bg-emerald-900/90 text-emerald-200" : "bg-red-900/90 text-red-200"}`}>
            {toast.type === "success" ? <Check className="h-4 w-4" /> : null}
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 w-64"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
              <Button size="sm" onClick={handleRename}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-100">{activeFlowchart.name}</h1>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMinimap(!showMinimap)}
            title={showMinimap ? "Hide minimap" : "Show minimap"}
          >
            {showMinimap ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportPng} disabled={isExportingPng}>
            <ImageIcon className="mr-2 h-4 w-4" />
            {isExportingPng ? "Exporting..." : "PNG"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <label>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button variant="secondary" size="sm" asChild>
              <span><Upload className="mr-2 h-4 w-4" />Import</span>
            </Button>
          </label>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={Boolean(saveBlockedReason)}
            title={saveBlockedReason ?? undefined}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-rose-400 hover:bg-rose-500/10">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <NodePalette onAddNode={handleAddNode} />

        <div className="flex-1">
          <FlowchartCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            showMinimap={showMinimap}
          />
        </div>
      </div>

      {selectedNode && (
        <NodeEditorModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
        />
      )}

      {selectedEdge && (
        <EdgeEditorModal
          edge={selectedEdge}
          onClose={() => setSelectedEdge(null)}
          onUpdate={handleUpdateEdge}
          onDelete={handleDeleteEdge}
        />
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 ${toast.type === "success" ? "bg-emerald-900/90 text-emerald-200" : "bg-red-900/90 text-red-200"}`}>
          {toast.type === "success" ? <Check className="h-4 w-4" /> : null}
          {toast.message}
        </div>
      )}
    </div>
  );
}
