"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { FlowchartData } from "@/stores/flowchart-store";

type FlowchartNode = FlowchartData["nodes"][number];
type FlowchartEdge = FlowchartData["edges"][number];

interface FlowchartCanvasProps {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick?: NodeMouseHandler<FlowchartNode>;
  onNodeDoubleClick?: NodeMouseHandler<FlowchartNode>;
  onEdgeClick?: (event: React.MouseEvent, edge: FlowchartEdge) => void;
  nodeTypes: NodeTypes;
  showMinimap?: boolean;
}

export function FlowchartCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  nodeTypes,
  showMinimap = true,
}: FlowchartCanvasProps) {
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
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
        {showMinimap && (
          <MiniMap
            className="rounded-lg border border-zinc-800 bg-zinc-900"
            nodeColor="#3f3f46"
            maskColor="rgba(0, 0, 0, 0.8)"
          />
        )}
      </ReactFlow>
    </div>
  );
}
