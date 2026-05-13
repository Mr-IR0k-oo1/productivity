"use client";

import type { NodeProps } from "@xyflow/react";
import React, { memo, useState } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { OrbitNode } from "@/types/flowchart";

function TextNodeComponent({ id, data, selected }: NodeProps<OrbitNode>) {
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.type === "text" ? data.content : "");

  if (data.type !== "text") {
    return null;
  }

  return (
    <div
      className={`group relative min-w-[200px] rounded-xl border border-transparent px-3 py-2 ${selected ? "border-[var(--color-accent)] bg-[var(--color-surface)]/60" : ""}`}
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
          className="min-h-[80px] w-[220px] rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
        />
      ) : (
        <div
          className="whitespace-pre-wrap text-[var(--color-text-primary)]"
          style={{
            fontSize: `${data.fontSize}px`,
            fontWeight: data.fontWeight,
            color: data.color,
            textAlign: data.textAlign,
          }}
        >
          {content}
        </div>
      )}
      <LockBadge locked={data.locked} />
    </div>
  );
}

const TextNode = memo(TextNodeComponent);

export default TextNode;
