"use client";

import type { NodeProps } from "@xyflow/react";
import React, { memo, useState } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { OrbitNode } from "@/types/flowchart";

function ImageNodeComponent({ id, data }: NodeProps<OrbitNode>) {
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(data.type === "image" ? data.caption : "");

  if (data.type !== "image") {
    return null;
  }

  return (
    <div className="group relative min-w-[240px] overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] shadow-xl">
      <NodeHandles />
      {data.url ? (
        <img src={data.url} alt={caption || "Flowchart asset"} className="h-[180px] w-[240px] object-cover" />
      ) : (
        <div className="flex h-[180px] w-[240px] items-center justify-center text-sm text-[var(--color-text-secondary)]">
          Upload image
        </div>
      )}
      <div className="border-t border-[var(--color-border-secondary)] p-3" onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <input
            autoFocus
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            onBlur={() => {
              setIsEditing(false);
              updateNode(id, { caption });
            }}
            className="w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2 py-1 text-sm text-[var(--color-text-primary)] outline-none"
          />
        ) : (
          <div className="text-sm text-[var(--color-text-primary)]">{caption || "Image caption"}</div>
        )}
      </div>
      <LockBadge locked={data.locked} />
    </div>
  );
}

const ImageNode = memo(ImageNodeComponent);

export default ImageNode;
