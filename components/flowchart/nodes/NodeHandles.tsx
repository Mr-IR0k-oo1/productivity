"use client";

import { Handle, Position } from "@xyflow/react";

export default function NodeHandles() {
  return (
    <>
      <Handle
        type="source"
        position={Position.Top}
        className="!h-3 !w-3 !border-[var(--color-border-secondary)] !bg-[var(--color-background-secondary)] opacity-0 transition-opacity group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-[var(--color-border-secondary)] !bg-[var(--color-background-secondary)] opacity-0 transition-opacity group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-[var(--color-border-secondary)] !bg-[var(--color-background-secondary)] opacity-0 transition-opacity group-hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-[var(--color-border-secondary)] !bg-[var(--color-background-secondary)] opacity-0 transition-opacity group-hover:opacity-100"
      />
    </>
  );
}
