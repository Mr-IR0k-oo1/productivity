"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (activeFlowchart) {
      setNodes(activeFlowchart.data.nodes);
      setEdges(activeFlowchart.data.edges);
      setEditName(activeFlowchart.name);
      setShowList(false);
    } else {
      setNodes([]);
      setEdges([]);
      setShowList(true);
    }
  }, [activeFlowchart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeFlowchart) return;

      if (e.key === "Delete" && selectedNode) {
        handleDeleteNode(selectedNode.id);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }

      if (e.key === "Escape" && selectedNode) {
        setSelectedNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFlowchart, selectedNode]);

  const onNodesChange = useCallback<OnNodesChange>((changes) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds) as typeof nodes;

      const positionChanges = changes.filter((change) => change.type === "position" && change.position);
      if (positionChanges.length > 0) {
        autoSave(updated, edges);
      }

      return updated;
    });
  }, [edges]);

  const onEdgesChange = useCallback<OnEdgesChange>((changes) => {
    setEdges((eds) => {
      const updated = applyEdgeChanges(changes, eds);

      if (changes.some((change) => change.type === "remove")) {
        autoSave(nodes, updated);
      }

      return updated;
    });
  }, [nodes]);

  const onConnect = useCallback<OnConnect>((params) => {
      if (!params.source || !params.target) {
        return;
      }

      const newEdge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        animated: true,
        style: { stroke: "#60a5fa", strokeWidth: 2 },
      };
      setEdges((eds) => {
        const updated = [...eds, newEdge];
        autoSave(nodes, updated);
        return updated;
      });
    },
    [nodes]
  );

  const autoSave = useCallback(
    (nds: FlowchartNode[], eds: FlowchartEdge[]) => {
      if (activeFlowchart) {
        updateMutation.mutate({ id: activeFlowchart.id, data: { nodes: nds, edges: eds } });
      }
    },
    [activeFlowchart, updateMutation]
  );

  const handleSave = async () => {
    if (!activeFlowchart) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({ id: activeFlowchart.id, data: { nodes, edges } });
      showToast("Flowchart saved successfully");
    } catch {
      showToast("Failed to save flowchart", "error");
    }
    setIsSaving(false);
  };

  const handleAddNode = (type: string) => {
    const defaultNode = nodeTypeDefaults[type];
    const newNode: FlowchartNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: defaultNode.data || { label: type },
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    if (activeFlowchart) {
      updateMutation.mutate({ id: activeFlowchart.id, data: { nodes: updated, edges } });
    }
  };

  const handleNodeClick = (_: unknown, node: FlowchartNode) => {
    setSelectedNode(node);
  };

  const handleNodeDoubleClick = (_: unknown, node: FlowchartNode) => {
    setSelectedNode(node);
  };

  const handleUpdateNode = (id: string, data: FlowchartNodeData) => {
    const updated = nodes.map((node) => (node.id === id ? { ...node, data } : node));
    setNodes(updated);
    if (activeFlowchart) {
      updateMutation.mutate({ id: activeFlowchart.id, data: { nodes: updated, edges } });
    }
    setSelectedNode(null);
  };

  const handleEdgeClick = (_: unknown, edge: FlowchartEdge) => {
    setSelectedEdge(edge);
  };

  const handleUpdateEdge = (id: string, data: { label?: string }) => {
    const updated = edges.map((edge) => (edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge));
    setEdges(updated);
    if (activeFlowchart) {
      updateMutation.mutate({ id: activeFlowchart.id, data: { nodes, edges: updated } });
    }
    setSelectedEdge(null);
  };

  const handleDeleteEdge = (id: string) => {
    const updated = edges.filter((edge) => edge.id !== id);
    setEdges(updated);
    if (activeFlowchart) {
      updateMutation.mutate({ id: activeFlowchart.id, data: { nodes, edges: updated } });
    }
    setSelectedEdge(null);
    showToast("Connection deleted");
  };

  const handleDeleteNode = (id: string) => {
    const updated = nodes.filter((node) => node.id !== id);
    const updatedEdges = edges.filter((edge) => edge.source !== id && edge.target !== id);
    setNodes(updated);
    setEdges(updatedEdges);
    if (activeFlowchart) {
      updateMutation.mutate({ id: activeFlowchart.id, data: { nodes: updated, edges: updatedEdges } });
    }
    setSelectedNode(null);
    showToast("Node deleted");
  };

  const handleCreate = async () => {
    if (createMutation.isPending) {
      return;
    }
    try {
      const result = await createMutation.mutateAsync({ name: "Untitled Flowchart" });
      if (result?.data) {
        setActiveFlowchart(result.data);
        showToast("Flowchart created");
      } else {
        showToast("Failed to create flowchart: No data returned", "error");
      }
    } catch (error) {
      showToast(`Failed to create flowchart: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    }
  };

  const handleRename = async () => {
    if (!activeFlowchart || !editName.trim()) return;
    try {
      await updateMutation.mutateAsync({ id: activeFlowchart.id, name: editName.trim() });
      setActiveFlowchart({ ...activeFlowchart, name: editName.trim() });
      setIsEditing(false);
      showToast("Flowchart renamed");
    } catch {
      showToast("Failed to rename flowchart", "error");
    }
  };

  const handleDelete = async () => {
    if (!activeFlowchart) return;
    if (confirm("Are you sure you want to delete this flowchart?")) {
      try {
        await deleteMutation.mutateAsync(activeFlowchart.id);
        setActiveFlowchart(null);
        showToast("Flowchart deleted");
      } catch {
        showToast("Failed to delete flowchart", "error");
      }
    }
  };

  const handleDuplicate = async (flowchart: Flowchart) => {
    try {
      const result = await createMutation.mutateAsync({ name: `${flowchart.name} (Copy)`, data: flowchart.data });
      if (result?.data) {
        showToast("Flowchart duplicated");
      }
    } catch {
      showToast("Failed to duplicate flowchart", "error");
    }
  };

  const handleBack = () => {
    setActiveFlowchart(null);
  };

  const handleExport = () => {
    if (!activeFlowchart) return;
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeFlowchart.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported as JSON");
  };

  const handleExportPng = async () => {
    if (!activeFlowchart) return;
    setIsExportingPng(true);
    try {
      const canvas = document.querySelector(".react-flow canvas") as HTMLCanvasElement;
      if (canvas) {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create blob"));
          }, "image/png");
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeFlowchart.name}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Exported as PNG");
      } else {
        showToast("Canvas not found", "error");
      }
    } catch {
      showToast("Failed to export PNG", "error");
    }
    setIsExportingPng(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          if (activeFlowchart) {
            updateMutation.mutate({ id: activeFlowchart.id, data });
            showToast("Imported successfully");
          }
        }
      } catch {
        showToast("Invalid flowchart file", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteFromList = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showToast("Flowchart deleted");
    } catch {
      showToast("Failed to delete flowchart", "error");
    }
  };

  const handleRenameFromList = async (id: string, name: string) => {
    try {
      await updateMutation.mutateAsync({ id, name });
      showToast("Flowchart renamed");
    } catch {
      showToast("Failed to rename flowchart", "error");
    }
  };

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
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            New Flowchart
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
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
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
