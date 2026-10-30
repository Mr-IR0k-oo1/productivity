"use client";

import type { NodeProps } from "@xyflow/react";
import React, { memo, useEffect, useState } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { OrbitNode } from "@/types/flowchart";

function CodeNodeComponent({ id, data }: NodeProps<OrbitNode>) {
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(data.type === "code" ? data.code : "");
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (data.type !== "code") {
      return;
    }

    let isActive = true;

    void import("shiki")
      .then(({ codeToHtml }) => {
        return codeToHtml(code, {
          lang: data.language,
          theme: "github-dark",
        });
      })
      .then((html) => {
        if (isActive) {
          setHighlighted(html);
        }
      })
      .catch((error) => {
        console.error("Shiki render failed", error);
        if (isActive) {
          setHighlighted(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [code, data]);

  if (data.type !== "code") {
    return null;
  }

  return (
    <div
      className="group relative min-h-[200px] min-w-[320px] overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-zinc-950 text-zinc-100 shadow-2xl"
      onDoubleClick={() => setIsEditing(true)}
    >
      <NodeHandles />
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-xs text-zinc-400">
        <span>{data.language}</span>
        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-zinc-900"
          onClick={() => updateNode(id, { showLineNumbers: !data.showLineNumbers })}
        >
          {data.showLineNumbers ? "Lines on" : "Lines off"}
        </button>
      </div>
      {isEditing ? (
        <textarea
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onBlur={() => {
            setIsEditing(false);
            updateNode(id, { code });
          }}
          className="h-[168px] w-[320px] resize-none bg-zinc-950 p-4 font-mono text-sm text-zinc-100 outline-none"
        />
      ) : highlighted ? (
        <div
          className="max-h-[168px] overflow-auto p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre className="max-h-[168px] overflow-auto p-4 text-sm">{code}</pre>
      )}
      <LockBadge locked={data.locked} />
    </div>
  );
}

const CodeNode = memo(CodeNodeComponent);

export default CodeNode;
