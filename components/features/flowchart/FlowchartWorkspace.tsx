"use client";

import { useCallback, useEffect, useState } from "react";
import type { Edge, Node, NodeTypes, OnConnect, OnEdgesChange, OnNodesChange } from "@xyflow/react";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Grip,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useFlowchartStore, type FlowchartNodeData, type Flowchart } from "@/stores/flowchart-store";

import { FlowchartCanvas } from "./FlowchartCanvas";
import { FlowchartList } from "./FlowchartList";
import { NodeEditorModal } from "./NodeEditorModal";
import { NodePalette } from "./NodePalette";

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

const nodeTypeDefaults: Record<string, Partial<Node<FlowchartNodeData>>> = {
  start: { data: { label: "Start", nodeType: "start" } },
  end: { data: { label: "End", nodeType: "end" } },
  process: { data: { label: "Process", nodeType: "process" } },
  decision: { data: { label: "Decision", nodeType: "decision" } },
  data: { data: { label: "Data", nodeType: "data" } },
  delay: { data: { label: "Delay", nodeType: "delay" } },
};

export function FlowchartWorkspace() {
  const {
    flowcharts,
    activeFlowchart,
    isLoading,
    loadFlowcharts,
    createFlowchart,
    saveFlowchart,
    renameFlowchart,
    deleteFlowchart,
    setActiveFlowchart,
  } = useFlowchartStore();

  const [nodes, setNodes] = useState<Node<FlowchartNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<FlowchartNodeData> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    loadFlowcharts();
  }, [loadFlowcharts]);

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

  const onNodesChange = useCallback<OnNodesChange>((changes) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);

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
    (nds: Node<FlowchartNodeData>[], eds: Edge[]) => {
      if (activeFlowchart) {
        saveFlowchart(activeFlowchart.id, { nodes: nds, edges: eds });
      }
    },
    [activeFlowchart, saveFlowchart]
  );

  const handleSave = async () => {
    if (!activeFlowchart) return;
    setIsSaving(true);
    await saveFlowchart(activeFlowchart.id, { nodes, edges });
    setIsSaving(false);
  };

  const handleAddNode = (type: string) => {
    const defaultNode = nodeTypeDefaults[type];
    const newNode: Node<FlowchartNodeData> = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: defaultNode.data || { label: type },
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    if (activeFlowchart) {
      saveFlowchart(activeFlowchart.id, { nodes: updated, edges });
    }
  };

  const handleNodeClick = (_: React.MouseEvent<Element, MouseEvent>, node: Node<FlowchartNodeData>) => {
    setSelectedNode(node);
  };

  const handleNodeDoubleClick = (_: React.MouseEvent<Element, MouseEvent>, node: Node<FlowchartNodeData>) => {
    setSelectedNode(node);
  };

  const handleUpdateNode = (id: string, data: FlowchartNodeData) => {
    const updated = nodes.map((node: Node<FlowchartNodeData>) => (node.id === id ? { ...node, data } : node));
    setNodes(updated);
    if (activeFlowchart) {
      saveFlowchart(activeFlowchart.id, { nodes: updated, edges });
    }
    setSelectedNode(null);
  };

  const handleDeleteNode = (id: string) => {
    const updated = nodes.filter((node: Node<FlowchartNodeData>) => node.id !== id);
    const updatedEdges = edges.filter((edge: Edge) => edge.source !== id && edge.target !== id);
    setNodes(updated);
    setEdges(updatedEdges);
    if (activeFlowchart) {
      saveFlowchart(activeFlowchart.id, { nodes: updated, edges: updatedEdges });
    }
    setSelectedNode(null);
  };

  const handleCreate = async () => {
    const flowchart = await createFlowchart("Untitled Flowchart");
    if (flowchart) {
      setActiveFlowchart(flowchart);
    }
  };

  const handleRename = async () => {
    if (!activeFlowchart || !editName.trim()) return;
    await renameFlowchart(activeFlowchart.id, editName.trim());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!activeFlowchart) return;
    if (confirm("Are you sure you want to delete this flowchart?")) {
      await deleteFlowchart(activeFlowchart.id);
      setActiveFlowchart(null);
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
            saveFlowchart(activeFlowchart.id, data);
          }
        }
      } catch {
        alert("Invalid flowchart file");
      }
    };
    reader.readAsText(file);
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
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Flowchart
          </Button>
        </div>
        <FlowchartList
          flowcharts={flowcharts}
          onSelect={setActiveFlowchart}
          onDelete={deleteFlowchart}
        />
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
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <label>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
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
            nodeTypes={nodeTypes}
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
    </div>
  );
}
