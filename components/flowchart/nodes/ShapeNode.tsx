"use client";

import type { NodeProps } from "@xyflow/react";
import React, { memo, useState } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { OrbitNode } from "@/types/flowchart";

function renderShape(variant: OrbitNode["data"] extends infer T ? T : never, fill: string, stroke: string, strokeWidth: number) {
  if (typeof variant !== "object" || !variant || variant.type !== "shape") {
    return null;
  }

  if (variant.variant === "diamond") {
    return <polygon points="80,6 154,30 80,54 6,30" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (variant.variant === "circle") {
    return <ellipse cx="80" cy="30" rx="74" ry="24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (variant.variant === "parallelogram") {
    return <polygon points="24,4 154,4 136,56 6,56" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (variant.variant === "rounded_rect") {
    return <rect x="4" y="4" width="152" height="52" rx="20" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  return <rect x="4" y="4" width="152" height="52" rx="8" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

function ShapeNodeComponent({ id, data, selected }: NodeProps<OrbitNode>) {
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.type === "shape" ? data.label : "");

  if (data.type !== "shape") {
    return null;
  }

  return (
    <div
      className={`group relative min-w-[160px] ${selected ? "drop-shadow-[0_0_0.75rem_rgba(59,130,246,0.18)]" : ""}`}
      onDoubleClick={() => setIsEditing(true)}
    >
      <NodeHandles />
      <svg viewBox="0 0 160 60" className="h-[60px] w-[160px] overflow-visible">
        {renderShape(data, data.fill, data.stroke, data.strokeWidth)}
        {!isEditing ? (
          <text
            x="80"
            y="34"
            textAnchor="middle"
            className="fill-[var(--color-text-primary)]"
            fontSize={data.fontSize}
          >
            {label || "Shape"}
          </text>
        ) : null}
      </svg>
      {isEditing ? (
        <input
          autoFocus
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onBlur={() => {
            setIsEditing(false);
            updateNode(id, { label });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="absolute inset-x-3 top-1/2 h-8 -translate-y-1/2 rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text-primary)] outline-none"
        />
      ) : null}
      <LockBadge locked={data.locked} />
    </div>
  );
}

const ShapeNode = memo(ShapeNodeComponent);

export default ShapeNode;
