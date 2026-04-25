"use client";

import type { NodeProps } from "@xyflow/react";
import React, { memo, useMemo, useState } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { DEFAULT_STICKY_COLORS } from "@/lib/flowchart/constants";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { OrbitNode } from "@/types/flowchart";

function StickyNodeComponent({ id, data }: NodeProps<OrbitNode>) {
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.type === "sticky" ? data.content : "");

  const background = useMemo(() => {
    if (data.type !== "sticky") {
      return DEFAULT_STICKY_COLORS.yellow;
    }

    return DEFAULT_STICKY_COLORS[data.color];
  }, [data]);

  if (data.type !== "sticky") {
    return null;
  }

  return (
    <div
      className="group relative min-h-[160px] min-w-[200px] rounded-2xl border border-black/10 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
      style={{ backgroundColor: background }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <NodeHandles />
      {isEditing ? (
        <textarea
          autoFocus
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onBlur={() => {
            setIsEditing(false);
            updateNode(id, { content });
          }}
          className="h-[110px] w-[170px] resize-none bg-transparent text-sm text-zinc-900 outline-none"
        />
      ) : (
        <div className="min-h-[110px] whitespace-pre-wrap text-sm text-zinc-900">{content}</div>
      )}
      <div className="mt-3 text-xs font-medium text-zinc-700">{data.authorName}</div>
      <LockBadge locked={data.locked} />
    </div>
  );
}

const StickyNode = memo(StickyNodeComponent);

export default StickyNode;
