"use client";

import type { NodeProps } from "@xyflow/react";
import { Lightbulb, ThumbsUp } from "lucide-react";
import React, { memo } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { Badge } from "@/components/ui/badge";
import type { OrbitNode } from "@/types/flowchart";

function IdeaCardNodeComponent({ data }: NodeProps<OrbitNode>) {
  if (data.type !== "idea_card") {
    return null;
  }

  const visibleTags = data.tags.slice(0, 2);
  const overflowCount = Math.max(data.tags.length - visibleTags.length, 0);

  return (
    <button
      type="button"
      className="group relative block min-h-[90px] min-w-[220px] rounded-2xl border border-amber-500/70 bg-[var(--color-surface)] p-4 text-left shadow-xl"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("orbit:open-idea", { detail: { ideaId: data.ideaId } }));
      }}
    >
      <NodeHandles />
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-300">
          <Lightbulb className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Idea</span>
        </div>
        <Badge variant="warning" className="capitalize">
          {data.ideaStatus}
        </Badge>
      </div>
      <div className="line-clamp-2 text-sm font-semibold text-[var(--color-text-primary)]">{data.ideaTitle}</div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
          {overflowCount > 0 ? <Badge variant="default">+{overflowCount}</Badge> : null}
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-strong)]"
          onClick={(event) => {
            event.stopPropagation();
            window.dispatchEvent(
              new CustomEvent("orbit:vote-idea-node", {
                detail: { ideaId: data.ideaId },
              }),
            );
          }}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {data.voteCount}
        </button>
      </div>
      <LockBadge locked={data.locked} />
    </button>
  );
}

const IdeaCardNode = memo(IdeaCardNodeComponent);

export default IdeaCardNode;
