"use client";

import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { FlowchartComment, Viewport } from "@/types/flowchart";

type CommentPinProps = {
  comment: FlowchartComment;
  viewport: Viewport;
};

export default function CommentPin({ comment, viewport }: CommentPinProps) {
  const x = comment.x * viewport.zoom + viewport.x;
  const y = comment.y * viewport.zoom + viewport.y;

  return (
    <div
      className="orbit-comment-pin pointer-events-auto absolute"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div className="rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2 shadow-lg">
        <MessageSquare className="h-4 w-4 text-[var(--color-text-primary)]" />
      </div>
      <div className="mt-2 max-w-[220px] rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 shadow-xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-[var(--color-text-primary)]">{comment.authorName}</div>
          {comment.resolved ? <Badge variant="success">Resolved</Badge> : null}
        </div>
        <div className="text-xs text-[var(--color-text-secondary)]">{comment.content}</div>
      </div>
    </div>
  );
}
