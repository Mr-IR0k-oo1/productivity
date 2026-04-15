"use client";

import { useCallback } from "react";
import type { MouseEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { FlowchartNodeData } from "@/stores/flowchart-store";

type FlowchartNode = Node<FlowchartNodeData>;

interface FlowchartCanvasProps {
  nodes: FlowchartNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick?: (event: MouseEvent<Element, MouseEvent>, node: FlowchartNode) => void;
  onNodeDoubleClick?: (event: MouseEvent<Element, MouseEvent>, node: FlowchartNode) => void;
  nodeTypes: NodeTypes;
}

export function FlowchartCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  nodeTypes,
}: FlowchartCanvasProps) {
  const handleNodeClick = useCallback(
    (event: MouseEvent<Element, MouseEvent>, node: Node) => {
      onNodeClick?.(event, node as FlowchartNode);
    },
    [onNodeClick],
  );

  const handleNodeDoubleClick = useCallback(
    (event: MouseEvent<Element, MouseEvent>, node: Node) => {
      onNodeDoubleClick?.(event, node as FlowchartNode);
    },
    [onNodeDoubleClick],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
        }}
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
        />
        <Controls
          className="rounded-lg border border-zinc-800 bg-zinc-900"
          showZoom
          showFitView
          showInteractive={false}
        />
        <MiniMap
          className="rounded-lg border border-zinc-800 bg-zinc-900"
          nodeColor="#3f3f46"
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
