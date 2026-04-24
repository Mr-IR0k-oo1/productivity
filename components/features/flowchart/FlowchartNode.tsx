"use client";

import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";

import { cn } from "@/lib/utils";
import type { FlowchartData, FlowchartNodeData } from "@/stores/flowchart-store";

const flowchartNodeTypeKeys = ["start", "end", "process", "decision", "data", "delay"] as const;

export type FlowchartNodeTypeKey = (typeof flowchartNodeTypeKeys)[number];
export type FlowchartNode = FlowchartData["nodes"][number];

const defaultNodeLabels: Record<FlowchartNodeTypeKey, string> = {
  start: "Start",
  end: "End",
  process: "Process",
  decision: "Decision",
  data: "Data",
  delay: "Delay",
};

const handleClassName =
  "!h-3 !w-3 !border-2 !border-zinc-950 !bg-sky-400 transition-colors group-hover:!bg-sky-300";

const nodeTypeStyles: Record<
  FlowchartNodeTypeKey,
  {
    className: string;
    style?: React.CSSProperties;
    labelClassName?: string;
    hasIncomingHandle: boolean;
    hasOutgoingHandle: boolean;
  }
> = {
  start: {
    className:
      "rounded-full border border-emerald-300/20 bg-emerald-500 px-6 py-4 text-white",
    hasIncomingHandle: false,
    hasOutgoingHandle: true,
  },
  end: {
    className:
      "rounded-full border border-rose-300/20 bg-rose-500 px-6 py-4 text-white",
    hasIncomingHandle: true,
    hasOutgoingHandle: false,
  },
  process: {
    className:
      "min-w-[140px] rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 py-3 text-zinc-100",
    hasIncomingHandle: true,
    hasOutgoingHandle: true,
  },
  decision: {
    className:
      "min-w-[140px] border-2 border-amber-500 bg-amber-950/60 px-5 py-4 text-center text-amber-200",
    style: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
    hasIncomingHandle: true,
    hasOutgoingHandle: true,
  },
  data: {
    className:
      "min-w-[140px] skew-x-[-12deg] rounded-lg border-2 border-blue-500 bg-blue-950/60 px-4 py-3 text-blue-200",
    labelClassName: "skew-x-[12deg]",
    hasIncomingHandle: true,
    hasOutgoingHandle: true,
  },
  delay: {
    className:
      "min-w-[140px] border-2 border-violet-500 bg-violet-950/60 px-4 py-3 text-center text-violet-200",
    style: { clipPath: "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)" },
    hasIncomingHandle: true,
    hasOutgoingHandle: true,
  },
};

export function isFlowchartNodeTypeKey(value: string | null | undefined): value is FlowchartNodeTypeKey {
  return typeof value === "string" && (flowchartNodeTypeKeys as readonly string[]).includes(value);
}

export function getFlowchartNodeTypeKey(
  input: { type?: string | null; data?: Partial<FlowchartNodeData> | null } | string,
): FlowchartNodeTypeKey {
  if (typeof input === "string") {
    return isFlowchartNodeTypeKey(input) ? input : "process";
  }

  if (isFlowchartNodeTypeKey(input.data?.nodeType)) {
    return input.data.nodeType;
  }

  return isFlowchartNodeTypeKey(input.type) ? input.type : "process";
}

export function createFlowchartNodeData(
  nodeTypeInput: { type?: string | null; data?: Partial<FlowchartNodeData> | null } | string,
  data?: Partial<FlowchartNodeData>,
): FlowchartNodeData {
  const nodeType = getFlowchartNodeTypeKey(nodeTypeInput);
  const providedLabel = typeof data?.label === "string" ? data.label.trim() : "";

  return {
    ...data,
    label: providedLabel || defaultNodeLabels[nodeType],
    nodeType,
  };
}

function FlowchartNodeComponent({ data, type, selected }: NodeProps<FlowchartNode>) {
  const nodeType = getFlowchartNodeTypeKey({ type, data });
  const nodeStyle = nodeTypeStyles[nodeType];
  const label = createFlowchartNodeData(nodeType, data).label;

  return (
    <div
      className={cn(
        "group relative text-sm font-medium shadow-lg shadow-black/25 transition-shadow",
        nodeStyle.className,
        selected && "ring-2 ring-sky-400/70 ring-offset-2 ring-offset-zinc-950",
      )}
      style={nodeStyle.style}
    >
      {nodeStyle.hasIncomingHandle ? (
        <Handle type="target" position={Position.Left} className={handleClassName} />
      ) : null}

      <div className={cn("relative z-10 whitespace-nowrap", nodeStyle.labelClassName)}>{label}</div>

      {nodeStyle.hasOutgoingHandle ? (
        <Handle type="source" position={Position.Right} className={handleClassName} />
      ) : null}
    </div>
  );
}

export const flowchartNodeTypes: NodeTypes = {
  start: FlowchartNodeComponent,
  end: FlowchartNodeComponent,
  process: FlowchartNodeComponent,
  decision: FlowchartNodeComponent,
  data: FlowchartNodeComponent,
  delay: FlowchartNodeComponent,
};
