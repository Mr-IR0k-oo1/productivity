"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  getNodesBounds,
  getViewportForBounds,
  type Edge as FlowchartEdge,
  type EdgeMouseHandler,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from "@xyflow/react";
import { toBlob } from "html-to-image";
import {
  ArrowLeft,
  Check,
  Download,
  ImageIcon,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateFlowchartMutation,
  useDeleteFlowchartMutation,
  useFlowchartQuery,
  useFlowchartsQuery,
  useUpdateFlowchartMutation,
} from "@/hooks/useFlowcharts";
import type { Flowchart, FlowchartData, FlowchartNodeData } from "@/stores/flowchart-store";

import { EdgeEditorModal } from "./EdgeEditorModal";
import { FlowchartCanvas } from "./FlowchartCanvas";
import { FlowchartList } from "./FlowchartList";
import {
  createFlowchartNodeData,
  flowchartNodeTypes,
  getFlowchartNodeTypeKey,
  type FlowchartNode,
} from "./FlowchartNode";
import { NodeEditorModal } from "./NodeEditorModal";
import { NodePalette } from "./NodePalette";

type FlowchartPersistOptions = {
  source: string;
  silent?: boolean;
};

type FlowchartWorkspaceProps = {
  flowchartId?: string;
};

const autoSaveDelayMs = 350;
const flowchartDebugEnabled = process.env.NODE_ENV !== "production";
const defaultEdgeStyle = { stroke: "#60a5fa", strokeWidth: 2 };
const exportBackgroundColor = "#0a0a0a";
const minimumExportWidth = 1200;
const minimumExportHeight = 800;
const exportPadding = 0.2;
const exportMinZoom = 0.5;
const exportMaxZoom = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEditableEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function sanitizeDownloadName(name: string) {
  const trimmedName = name.trim() || "flowchart";
  return trimmedName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
}

function getEdgeLabel(edge: Pick<FlowchartEdge, "label" | "data">) {
  if (typeof edge.label === "string" && edge.label.trim()) {
    return edge.label.trim();
  }

  const dataLabel = isRecord(edge.data) ? edge.data.label : undefined;
  return typeof dataLabel === "string" ? dataLabel.trim() : "";
}

function normalizeFlowchartNode(node: FlowchartNode): FlowchartNode {
  const nodeType = getFlowchartNodeTypeKey(node);
  return {
    ...node,
    type: nodeType,
    data: createFlowchartNodeData(nodeType, isRecord(node.data) ? (node.data as Partial<FlowchartNodeData>) : undefined),
  };
}

function normalizeFlowchartEdge(edge: FlowchartEdge): FlowchartEdge {
  const label = getEdgeLabel(edge);
  const existingData = isRecord(edge.data) ? edge.data : undefined;

  return {
    ...edge,
    animated: edge.animated ?? true,
    style: { ...defaultEdgeStyle, ...(edge.style ?? {}) },
    label: label || undefined,
    data: {
      ...(existingData ?? {}),
      label,
    },
  };
}

function normalizeFlowchartData(data: FlowchartData): FlowchartData {
  return {
    nodes: data.nodes.map((node) => normalizeFlowchartNode(node as FlowchartNode)),
    edges: data.edges.map((edge) => normalizeFlowchartEdge(edge as FlowchartEdge)),
  };
}

function normalizeFlowchart(flowchart: Flowchart): Flowchart {
  return {
    ...flowchart,
    data: normalizeFlowchartData(flowchart.data),
  };
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
    data: normalizeFlowchartData({
      nodes: nodes as FlowchartData["nodes"],
      edges: edges as FlowchartData["edges"],
    }),
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function exportViewportAsPng(container: HTMLDivElement, nodes: FlowchartNode[]) {
  if (nodes.length === 0) {
    throw new Error("Add at least one node before exporting PNG.");
  }

  const viewportElement = container.querySelector(".react-flow__viewport");
  if (!(viewportElement instanceof HTMLElement)) {
    throw new Error("Flowchart viewport not found.");
  }

  const containerBounds = container.getBoundingClientRect();
  const exportWidth = Math.max(minimumExportWidth, Math.ceil(containerBounds.width));
  const exportHeight = Math.max(minimumExportHeight, Math.ceil(containerBounds.height));
  const nodesBounds = getNodesBounds(nodes);
  const canFitBounds = nodesBounds.width > 0 && nodesBounds.height > 0;
  const viewport = canFitBounds
    ? getViewportForBounds(nodesBounds, exportWidth, exportHeight, exportMinZoom, exportMaxZoom, exportPadding)
    : null;

  const blob = await toBlob(viewportElement, {
    backgroundColor: exportBackgroundColor,
    cacheBust: true,
    pixelRatio: 2,
    width: exportWidth,
    height: exportHeight,
    style: {
      width: `${exportWidth}px`,
      height: `${exportHeight}px`,
      ...(viewport
        ? {
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
          }
        : {}),
    },
  });

  if (!blob) {
    throw new Error("Failed to generate PNG.");
  }

  return blob;
}

export function FlowchartWorkspace({ flowchartId }: FlowchartWorkspaceProps) {
  const router = useRouter();
  const { workspaceId, isReady } = useSessionContext();
  const flowchartsQuery = useFlowchartsQuery();
  const flowchartQuery = useFlowchartQuery(flowchartId ?? null);
  const createMutation = useCreateFlowchartMutation();
  const updateMutation = useUpdateFlowchartMutation();
  const deleteMutation = useDeleteFlowchartMutation();
  const isEditorRoute = Boolean(flowchartId);

  const flowcharts = useMemo(
    () => (flowchartsQuery.data ?? []).map((flowchart) => normalizeFlowchart(flowchart)),
    [flowchartsQuery.data],
  );
  const routeFlowchart = useMemo(
    () => (flowchartQuery.data ? normalizeFlowchart(flowchartQuery.data) : null),
    [flowchartQuery.data],
  );

  const [activeFlowchart, setActiveFlowchart] = useState<Flowchart | null>(null);
  const [nodes, setNodes] = useState<FlowchartNode[]>([]);
  const [edges, setEdges] = useState<FlowchartEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const activeFlowchartRef = useRef<Flowchart | null>(null);
  const nodesRef = useRef<FlowchartNode[]>([]);
  const edgesRef = useRef<FlowchartEdge[]>([]);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const selectionSnapshotRef = useRef<{ nodeId: string | null; edgeId: string | null }>({
    nodeId: null,
    edgeId: null,
  });

  const editingNode = useMemo(
    () => (editingNodeId ? nodes.find((node) => node.id === editingNodeId) ?? null : null),
    [editingNodeId, nodes],
  );
  const editingEdge = useMemo(
    () => (editingEdgeId ? edges.find((edge) => edge.id === editingEdgeId) ?? null : null),
    [editingEdgeId, edges],
  );

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
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const clearPendingAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = null;
  }, []);

  const applyEditorGraph = useCallback((nextNodes: FlowchartNode[], nextEdges: FlowchartEdge[]) => {
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
    setActiveFlowchart((current) =>
      current
        ? {
            ...current,
            data: {
              nodes: nextNodes,
              edges: nextEdges,
            },
          }
        : current,
    );
  }, []);

  useEffect(() => {
    activeFlowchartRef.current = activeFlowchart;
  }, [activeFlowchart]);

  useEffect(() => () => clearPendingAutoSave(), [clearPendingAutoSave]);

  useEffect(() => {
    if (!isEditorRoute || !routeFlowchart) {
      return;
    }

    clearPendingAutoSave();
    selectionSnapshotRef.current = { nodeId: null, edgeId: null };
    activeFlowchartRef.current = routeFlowchart;
    nodesRef.current = routeFlowchart.data.nodes;
    edgesRef.current = routeFlowchart.data.edges;
    setActiveFlowchart(routeFlowchart);
    setNodes(routeFlowchart.data.nodes);
    setEdges(routeFlowchart.data.edges);
    setEditName(routeFlowchart.name);
    setIsEditingName(false);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEditingNodeId(null);
    setEditingEdgeId(null);
    logFlowchartDebug("editor:loaded", {
      flowchartId: routeFlowchart.id,
      nodes: routeFlowchart.data.nodes.length,
      edges: routeFlowchart.data.edges.length,
    });
  }, [clearPendingAutoSave, isEditorRoute, logFlowchartDebug, routeFlowchart]);

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
        setActiveFlowchart((current) =>
          current
            ? {
                ...current,
                data: { nodes: updatedNodes, edges: edgesRef.current },
              }
            : current,
        );

        if (changes.some((change) => change.type !== "select")) {
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
        const updatedEdges = applyEdgeChanges(changes, currentEdges).map((edge) =>
          normalizeFlowchartEdge(edge as FlowchartEdge),
        );
        edgesRef.current = updatedEdges;
        setActiveFlowchart((current) =>
          current
            ? {
                ...current,
                data: { nodes: nodesRef.current, edges: updatedEdges },
              }
            : current,
        );

        if (changes.some((change) => change.type !== "select")) {
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

      const isDuplicateConnection = edgesRef.current.some(
        (edge) =>
          edge.source === params.source &&
          edge.target === params.target &&
          edge.sourceHandle === params.sourceHandle &&
          edge.targetHandle === params.targetHandle,
      );

      if (isDuplicateConnection) {
        logFlowchartDebug("connect:blocked", {
          reason: "duplicate-connection",
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle ?? null,
          targetHandle: params.targetHandle ?? null,
        });
        showToast("That connection already exists.", "error");
        return;
      }

      const newEdge = normalizeFlowchartEdge({
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
      } as FlowchartEdge);

      logFlowchartDebug("connect:add-edge", {
        source: params.source,
        target: params.target,
        edgeId: newEdge.id,
      });

      const updatedEdges = [...edgesRef.current, newEdge];
      applyEditorGraph(nodesRef.current, updatedEdges);
      scheduleAutoSave(nodesRef.current, updatedEdges, "edges:connect");
    },
    [applyEditorGraph, logFlowchartDebug, scheduleAutoSave, showToast],
  );

  const handleSelectionChange = useCallback<OnSelectionChangeFunc<FlowchartNode, FlowchartEdge>>(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      const nextNodeId = selectedNodes[0]?.id ?? null;
      const nextEdgeId = selectedEdges[0]?.id ?? null;
      const previousSelection = selectionSnapshotRef.current;

      if (
        previousSelection.nodeId === nextNodeId &&
        previousSelection.edgeId === nextEdgeId &&
        selectedNodes.length <= 1 &&
        selectedEdges.length <= 1
      ) {
        return;
      }

      selectionSnapshotRef.current = { nodeId: nextNodeId, edgeId: nextEdgeId };
      setSelectedNodeId(nextNodeId);
      setSelectedEdgeId(nextEdgeId);
      logFlowchartDebug("selection:change", {
        nodeId: nextNodeId,
        edgeId: nextEdgeId,
        nodeCount: selectedNodes.length,
        edgeCount: selectedEdges.length,
      });
    },
    [logFlowchartDebug],
  );

  const handlePaneClick = useCallback(() => {
    const previousSelection = selectionSnapshotRef.current;

    selectionSnapshotRef.current = { nodeId: null, edgeId: null };
    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    if (previousSelection.nodeId || previousSelection.edgeId) {
      logFlowchartDebug("selection:clear", {
        source: "pane",
        previousNodeId: previousSelection.nodeId,
        previousEdgeId: previousSelection.edgeId,
      });
    }
  }, [logFlowchartDebug]);

  const handleNodeClick = useCallback((_: unknown, node: FlowchartNode) => {
    logFlowchartDebug("node:select", { nodeId: node.id });
  }, [logFlowchartDebug]);

  const handleNodeDoubleClick = useCallback((_: unknown, node: FlowchartNode) => {
    setSelectedNodeId(node.id);
    setEditingNodeId(node.id);
    logFlowchartDebug("node:edit-open", { nodeId: node.id });
  }, [logFlowchartDebug]);

  const handleEdgeClick = useCallback<EdgeMouseHandler<FlowchartEdge>>((_, edge) => {
    logFlowchartDebug("edge:select", { edgeId: edge.id });
  }, [logFlowchartDebug]);

  const handleEdgeDoubleClick = useCallback<EdgeMouseHandler<FlowchartEdge>>((_, edge) => {
    setSelectedEdgeId(edge.id);
    setEditingEdgeId(edge.id);
    logFlowchartDebug("edge:edit-open", { edgeId: edge.id });
  }, [logFlowchartDebug]);

  const handleUpdateNode = useCallback((id: string, data: FlowchartNodeData) => {
    const updatedNodes = nodesRef.current.map((node) =>
      node.id === id
        ? {
            ...node,
            type: getFlowchartNodeTypeKey(node),
            data: createFlowchartNodeData(node, data),
          }
        : node,
    );

    applyEditorGraph(updatedNodes, edgesRef.current);
    logFlowchartDebug("node:edit-save", { nodeId: id, label: data.label });
    persistFlowchartUpdate(updatedNodes, edgesRef.current, { source: "node:update" });
    setEditingNodeId(null);
  }, [applyEditorGraph, logFlowchartDebug, persistFlowchartUpdate]);

  const handleUpdateEdge = useCallback((id: string, data: { label?: string }) => {
    const updatedEdges = edgesRef.current.map((edge) =>
      edge.id === id
        ? normalizeFlowchartEdge({
            ...edge,
            label: data.label,
            data: {
              ...(isRecord(edge.data) ? edge.data : {}),
              label: data.label ?? "",
            },
          })
        : edge,
    );

    applyEditorGraph(nodesRef.current, updatedEdges);
    logFlowchartDebug("edge:edit-save", { edgeId: id, label: data.label ?? "" });
    persistFlowchartUpdate(nodesRef.current, updatedEdges, { source: "edge:update" });
    setEditingEdgeId(null);
  }, [applyEditorGraph, logFlowchartDebug, persistFlowchartUpdate]);

  const handleDeleteEdge = useCallback((id: string) => {
    const updatedEdges = edgesRef.current.filter((edge) => edge.id !== id);
    applyEditorGraph(nodesRef.current, updatedEdges);
    selectionSnapshotRef.current = {
      nodeId: selectionSnapshotRef.current.nodeId,
      edgeId: selectionSnapshotRef.current.edgeId === id ? null : selectionSnapshotRef.current.edgeId,
    };
    setSelectedEdgeId((current) => (current === id ? null : current));
    setEditingEdgeId((current) => (current === id ? null : current));
    logFlowchartDebug("edge:delete", { edgeId: id });
    persistFlowchartUpdate(nodesRef.current, updatedEdges, { source: "edge:delete", silent: false });
    showToast("Connection deleted");
  }, [applyEditorGraph, logFlowchartDebug, persistFlowchartUpdate, showToast]);

  const handleDeleteNode = useCallback((id: string) => {
    const updatedNodes = nodesRef.current.filter((node) => node.id !== id);
    const updatedEdges = edgesRef.current.filter((edge) => edge.source !== id && edge.target !== id);

    applyEditorGraph(updatedNodes, updatedEdges);
    selectionSnapshotRef.current = {
      nodeId: selectionSnapshotRef.current.nodeId === id ? null : selectionSnapshotRef.current.nodeId,
      edgeId: selectionSnapshotRef.current.edgeId,
    };
    setSelectedNodeId((current) => (current === id ? null : current));
    setEditingNodeId((current) => (current === id ? null : current));
    logFlowchartDebug("node:delete", {
      nodeId: id,
      removedEdges: edgesRef.current.length - updatedEdges.length,
    });
    persistFlowchartUpdate(updatedNodes, updatedEdges, { source: "node:delete", silent: false });
    showToast("Node deleted");
  }, [applyEditorGraph, logFlowchartDebug, persistFlowchartUpdate, showToast]);

  const handleDeleteSelection = useCallback(() => {
    if (selectedEdgeId) {
      handleDeleteEdge(selectedEdgeId);
      return;
    }

    if (selectedNodeId) {
      handleDeleteNode(selectedNodeId);
      return;
    }

    logFlowchartDebug("selection:delete-blocked", { reason: "nothing-selected" });
  }, [handleDeleteEdge, handleDeleteNode, logFlowchartDebug, selectedEdgeId, selectedNodeId]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeFlowchartRef.current || isEditableEventTarget(event.target)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        handleDeleteSelection();
        return;
      }

      if (event.key === "Escape") {
        if (editingNodeId) {
          setEditingNodeId(null);
          logFlowchartDebug("node:edit-close", { source: "escape", nodeId: editingNodeId });
          return;
        }

        if (editingEdgeId) {
          setEditingEdgeId(null);
          logFlowchartDebug("edge:edit-close", { source: "escape", edgeId: editingEdgeId });
          return;
        }

        handlePaneClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingEdgeId,
    editingNodeId,
    handleDeleteSelection,
    handlePaneClick,
    handleSave,
    logFlowchartDebug,
  ]);

  const handleAddNode = useCallback((type: string) => {
    const nodeType = getFlowchartNodeTypeKey(type);
    const newNode: FlowchartNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: { x: Math.random() * 420 + 80, y: Math.random() * 320 + 80 },
      data: createFlowchartNodeData(nodeType),
    };

    const updatedNodes = [...nodesRef.current, newNode];
    applyEditorGraph(updatedNodes, edgesRef.current);
    logFlowchartDebug("node:add", { type: nodeType, nodeId: newNode.id });
    persistFlowchartUpdate(updatedNodes, edgesRef.current, { source: "node:add" });
  }, [applyEditorGraph, logFlowchartDebug, persistFlowchartUpdate]);

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

      if (!result?.data) {
        logFlowchartDebug("create:error", { reason: "no-data-returned" });
        showToast("Failed to create flowchart: No data returned", "error");
        return;
      }

      logFlowchartDebug("create:success", {
        flowchartId: result.data.id,
        name: result.data.name,
      });
      router.push(`/flowcharts/${result.data.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("create:error", { error: message });
      showToast(`Failed to create flowchart: ${message}`, "error");
    }
  }, [createBlockedReason, createMutation, isReady, logFlowchartDebug, router, showToast, workspaceId]);

  const handleSelectFlowchart = useCallback((flowchart: Flowchart) => {
    logFlowchartDebug("list:select", { flowchartId: flowchart.id });
    router.push(`/flowcharts/${flowchart.id}`);
  }, [logFlowchartDebug, router]);

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
      setIsEditingName(false);
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

    if (!confirm("Are you sure you want to delete this flowchart?")) {
      return;
    }

    try {
      clearPendingAutoSave();
      logFlowchartDebug("delete:start", { flowchartId: flowchart.id });
      await deleteMutation.mutateAsync(flowchart.id);
      logFlowchartDebug("delete:success", { flowchartId: flowchart.id });
      router.push("/flowcharts");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logFlowchartDebug("delete:error", { flowchartId: flowchart.id, error: message });
      showToast(`Failed to delete flowchart: ${message}`, "error");
    }
  }, [clearPendingAutoSave, deleteMutation, logFlowchartDebug, router, showToast]);

  const handleDuplicate = useCallback(async (flowchart: Flowchart) => {
    try {
      logFlowchartDebug("duplicate:start", { flowchartId: flowchart.id });
      const result = await createMutation.mutateAsync({
        name: `${flowchart.name} (Copy)`,
        data: normalizeFlowchartData(flowchart.data),
      });

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
    logFlowchartDebug("editor:back-to-list");
    router.push("/flowcharts");
  }, [logFlowchartDebug, router]);

  const handleToggleMinimap = useCallback(() => {
    setShowMinimap((current) => {
      const next = !current;
      logFlowchartDebug("minimap:toggle", { visible: next });
      return next;
    });
  }, [logFlowchartDebug]);

  const handleExport = useCallback(() => {
    const flowchart = activeFlowchartRef.current;
    if (!flowchart) {
      return;
    }

    const fileName = `${sanitizeDownloadName(flowchart.name)}.json`;
    const blob = new Blob([JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current }, null, 2)], {
      type: "application/json",
    });

    downloadBlob(blob, fileName);
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

    const container = canvasContainerRef.current;
    if (!container) {
      logFlowchartDebug("export:png:blocked", { reason: "missing-canvas-container" });
      showToast("Flowchart canvas container not found.", "error");
      return;
    }

    setIsExportingPng(true);
    logFlowchartDebug("export:png:start", { flowchartId: flowchart.id });

    try {
      const blob = await exportViewportAsPng(container, nodesRef.current);
      downloadBlob(blob, `${sanitizeDownloadName(flowchart.name)}.png`);
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
        const flowchart = activeFlowchartRef.current;

        if (!flowchart) {
          logFlowchartDebug("import:skipped", { reason: "no-active-flowchart" });
          return;
        }

        clearPendingAutoSave();
        applyEditorGraph(importedNodes, importedEdges);
        selectionSnapshotRef.current = { nodeId: null, edgeId: null };
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setEditingNodeId(null);
        setEditingEdgeId(null);

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
  }, [applyEditorGraph, clearPendingAutoSave, logFlowchartDebug, showToast, updateMutation]);

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

  if (!isEditorRoute && flowchartsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isEditorRoute) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 p-4">
          <h1 className="text-xl font-semibold text-zinc-100">Flowcharts</h1>
          <Button onClick={handleCreate} disabled={Boolean(createBlockedReason)} title={createBlockedReason ?? undefined}>
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
          onSelect={handleSelectFlowchart}
          onDelete={handleDeleteFromList}
          onRename={handleRenameFromList}
          onDuplicate={handleDuplicate}
        />
        {toast && (
          <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 ${
              toast.type === "success" ? "bg-emerald-900/90 text-emerald-200" : "bg-red-900/90 text-red-200"
            }`}
          >
            {toast.type === "success" ? <Check className="h-4 w-4" /> : null}
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  if (flowchartQuery.isLoading && !activeFlowchart) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!activeFlowchart) {
    const errorMessage = flowchartQuery.error instanceof Error ? flowchartQuery.error.message : null;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">Flowchart Not Found</h1>
        <p className="max-w-md text-sm text-zinc-400">
          {errorMessage || "The selected flowchart could not be loaded. It may have been deleted or you may not have access to it."}
        </p>
        <Button onClick={() => router.push("/flowcharts")}>Back To Flowcharts</Button>
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
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="h-8 w-64"
                autoFocus
                onKeyDown={(event) => event.key === "Enter" && void handleRename()}
              />
              <Button size="sm" onClick={() => void handleRename()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-100">{activeFlowchart.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  logFlowchartDebug("rename:open", { flowchartId: activeFlowchart.id });
                  setIsEditingName(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMinimap}
            title={showMinimap ? "Hide minimap" : "Show minimap"}
          >
            {showMinimap ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleExportPng()} disabled={isExportingPng}>
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
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </span>
            </Button>
          </label>
          <Button size="sm" onClick={() => void handleSave()} disabled={Boolean(saveBlockedReason)} title={saveBlockedReason ?? undefined}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void handleDelete()} className="text-rose-400 hover:bg-rose-500/10">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <NodePalette onAddNode={handleAddNode} />

        <div className="flex-1">
          <FlowchartCanvas
            containerRef={canvasContainerRef}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onEdgeClick={handleEdgeClick}
            onEdgeDoubleClick={handleEdgeDoubleClick}
            onPaneClick={handlePaneClick}
            onSelectionChange={handleSelectionChange}
            nodeTypes={flowchartNodeTypes}
            showMinimap={showMinimap}
          />
        </div>
      </div>

      {editingNode && (
        <NodeEditorModal
          node={editingNode}
          onClose={() => {
            logFlowchartDebug("node:edit-close", { source: "close-button", nodeId: editingNode.id });
            setEditingNodeId(null);
          }}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
        />
      )}

      {editingEdge && (
        <EdgeEditorModal
          edge={editingEdge}
          onClose={() => {
            logFlowchartDebug("edge:edit-close", { source: "close-button", edgeId: editingEdge.id });
            setEditingEdgeId(null);
          }}
          onUpdate={handleUpdateEdge}
          onDelete={handleDeleteEdge}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 ${
            toast.type === "success" ? "bg-emerald-900/90 text-emerald-200" : "bg-red-900/90 text-red-200"
          }`}
        >
          {toast.type === "success" ? <Check className="h-4 w-4" /> : null}
          {toast.message}
        </div>
      )}
    </div>
  );
}
