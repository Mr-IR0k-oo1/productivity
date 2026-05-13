"use client";

import type { OrbitEdge, OrbitEdgeData } from "@/types/flowchart";

import { ColorPicker } from "@/components/flowchart/ColorPicker";
import { Input } from "@/components/ui/input";
import { useFlowchartStore } from "@/stores/flowchartStore";

type EdgePanelProps = {
  edge: OrbitEdge;
};

export function EdgeStylePanel({ edge }: EdgePanelProps) {
  const updateEdge = useFlowchartStore((state) => state.updateEdge);

  const handleUpdate = <K extends keyof OrbitEdgeData>(key: K, value: OrbitEdgeData[K]) => {
    updateEdge(edge.id, { [key]: value });
  };

  const data = edge.data;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Label</div>
        <Input
          value={data?.label ?? ""}
          onChange={(e) => handleUpdate("label", e.target.value)}
          placeholder="Edge label..."
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Style</div>
        <div className="grid grid-cols-3 gap-2">
          {(["straight", "curved", "orthogonal"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => handleUpdate("style", style)}
              className={`flex h-9 items-center justify-center rounded-md border text-xs capitalize ${
                (data?.style ?? "curved") === style
                  ? "border-[var(--color-accent)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Line Style
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["solid", "dashed", "dotted"] as const).map((lineStyle) => (
            <button
              key={lineStyle}
              type="button"
              onClick={() => handleUpdate("lineStyle", lineStyle)}
              className={`flex h-9 items-center justify-center rounded-md border text-xs capitalize ${
                (data?.lineStyle ?? "solid") === lineStyle
                  ? "border-[var(--color-accent)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
              }`}
            >
              {lineStyle}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Color</div>
        <ColorPicker
          value={data?.color ?? "var(--color-text-secondary)"}
          onChange={(color) => handleUpdate("color", color)}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Stroke Width
        </div>
        <div className="flex gap-1">
          {([1, 2, 3] as const).map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => handleUpdate("strokeWidth", width)}
              className={`flex h-9 flex-1 items-center justify-center rounded-md border text-xs ${
                (data?.strokeWidth ?? 1) === width
                  ? "border-[var(--color-accent)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
              }`}
            >
              {width}px
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Start Arrow</div>
        <div className="grid grid-cols-3 gap-2">
          {(["none", "open", "filled"] as const).map((arrow) => (
            <button
              key={arrow}
              type="button"
              onClick={() => handleUpdate("arrowStart", arrow)}
              className={`flex h-9 items-center justify-center rounded-md border text-xs capitalize ${
                (data?.arrowStart ?? "none") === arrow
                  ? "border-[var(--color-accent)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
              }`}
            >
              {arrow === "open" ? "Open" : arrow === "filled" ? "Filled" : "None"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">End Arrow</div>
        <div className="grid grid-cols-3 gap-2">
          {(["none", "open", "filled"] as const).map((arrow) => (
            <button
              key={arrow}
              type="button"
              onClick={() => handleUpdate("arrowEnd", arrow)}
              className={`flex h-9 items-center justify-center rounded-md border text-xs capitalize ${
                (data?.arrowEnd ?? "open") === arrow
                  ? "border-[var(--color-accent)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
              }`}
            >
              {arrow === "open" ? "Open" : arrow === "filled" ? "Filled" : "None"}
            </button>
          ))}
        </div>
      </div>

      {(data?.createsTaskDep ?? false) && (
        <div className="flex items-center gap-2 rounded-md bg-[var(--color-surface-strong)] p-2">
          <div className="text-xs text-[var(--color-text-secondary)]">
            This edge creates a task dependency when the flowchart is exported.
          </div>
        </div>
      )}
    </div>
  );
}