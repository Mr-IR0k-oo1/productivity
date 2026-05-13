"use client";

import type { CursorPosition, Viewport } from "@/types/flowchart";

type RemoteCursorsProps = {
  cursors: CursorPosition[];
  viewport: Viewport;
};

export default function RemoteCursors({ cursors, viewport }: RemoteCursorsProps) {
  return (
    <>
      {cursors.map((cursor) => {
        const x = cursor.x * viewport.zoom + viewport.x;
        const y = cursor.y * viewport.zoom + viewport.y;

        return (
          <div
            key={cursor.userId}
            className="orbit-remote-cursor pointer-events-none absolute"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: cursor.avatarColor,
                }}
              />
              <div className="rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-primary)] shadow">
                {cursor.userName}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
