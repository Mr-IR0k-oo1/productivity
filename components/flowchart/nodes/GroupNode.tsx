"use client";

import type { NodeProps } from "@xyflow/react";
import { NodeResizer } from "@xyflow/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { memo, useMemo, useState } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { OrbitNode } from "@/types/flowchart";

function GroupNodeComponent({ id, data, selected }: NodeProps<OrbitNode>) {
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.type === "group" ? data.label : "");

  const backgroundColor = useMemo(() => {
    if (data.type !== "group") {
      return "transparent";
    }

    if (data.fill.startsWith("var(")) {
      return `color-mix(in srgb, ${data.fill} ${Math.round(data.fillOpacity * 100)}%, transparent)`;
    }

    return data.fill;
  }, [data]);

  if (data.type !== "group") {
    return null;
  }

  return (
    <div
      className={`group relative h-full w-full rounded-2xl border border-dashed border-[var(--color-border-secondary)] ${selected ? "ring-1 ring-[var(--color-accent)]" : ""}`}
      style={{
        backgroundColor,
        opacity: data.collapsed ? 0.95 : 1,
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <NodeResizer
        minWidth={220}
        minHeight={40}
        isVisible={selected}
        lineClassName="border-[var(--color-accent)]"
        handleClassName="!border-[var(--color-accent)] !bg-[var(--color-surface)]"
      />
      <NodeHandles />
      <div className="flex h-10 items-center justify-between rounded-t-2xl border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/70 px-3">
        {isEditing ? (
          <input
            autoFocus
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onBlur={() => {
              setIsEditing(false);
              updateNode(id, { label });
            }}
            className="w-full bg-transparent text-sm font-medium text-[var(--color-text-primary)] outline-none"
          />
        ) : (
          <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
        )}
        <button
          type="button"
          className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)]"
          onClick={() => {
            updateNode(id, {
              collapsed: !data.collapsed,
            });
          }}
        >
          {data.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {!data.collapsed ? (
        <div className="pointer-events-none h-[calc(100%-40px)] rounded-b-2xl" />
      ) : (
        <div className="h-0 overflow-hidden" />
      )}
      <LockBadge locked={data.locked} />
    </div>
  );
}

const GroupNode = memo(GroupNodeComponent);

export default GroupNode;
