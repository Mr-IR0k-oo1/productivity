"use client";

import type { OrbitNode, ShapeNodeData, StickyNodeData, GroupNodeData, TextNodeData, ImageNodeData } from "@/types/flowchart";

import { ColorPicker } from "@/components/flowchart/ColorPicker";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useFlowchartStore } from "@/stores/flowchartStore";

type NodePanelProps = {
  node: OrbitNode;
};

export function NodeStylePanel({ node }: NodePanelProps) {
  const updateNode = useFlowchartStore((state) => state.updateNode);

  const handleUpdate = (key: string, value: unknown) => {
    updateNode(node.id, { [key]: value } as Partial<ShapeNodeData>);
  };

  const data = node.data;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Appearance</div>

        {"fill" in data && data.fill !== undefined && (
          <div className="space-y-1">
            <div className="text-xs text-[var(--color-text-secondary)]">Fill</div>
            <ColorPicker
              value={data.fill}
              onChange={(color) => handleUpdate("fill", color)}
            />
          </div>
        )}

        {"stroke" in data && data.stroke !== undefined && (
          <div className="space-y-1">
            <div className="text-xs text-[var(--color-text-secondary)]">Stroke</div>
            <ColorPicker
              value={data.stroke}
              onChange={(color) => handleUpdate("stroke", color)}
            />
          </div>
        )}

        {"strokeWidth" in data && data.strokeWidth !== undefined && (
          <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
            <span>Stroke Width</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={data.strokeWidth}
                onChange={(e) => handleUpdate("strokeWidth", Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--color-surface-strong)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)]"
              />
              <span className="w-8 text-xs">{data.strokeWidth}</span>
            </div>
          </label>
        )}
      </div>

      {"fontSize" in data && data.fontSize !== undefined && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Text</div>
          <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
            <span>Font Size</span>
            <div className="flex items-center gap-2">
              {[12, 14, 16, 20, 24, 32].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleUpdate("fontSize", size)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                    data.fontSize === size
                      ? "bg-[var(--color-accent)] text-[var(--color-text-on-accent)]"
                      : "bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </label>
          {"textAlign" in data && data.textAlign !== undefined && (
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => handleUpdate("textAlign", align)}
                  className={`flex-1 rounded-md py-1.5 text-xs capitalize ${
                    data.textAlign === align
                      ? "bg-[var(--color-accent)] text-[var(--color-text-on-accent)]"
                      : "bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {data.type === "group" && "fillOpacity" in data && (
        <Slider
          label="Fill Opacity"
          min={0}
          max={0.3}
          step={0.01}
          value={data.fillOpacity}
          onChange={(e) => handleUpdate("fillOpacity", Number(e.target.value))}
        />
      )}

      {data.type === "sticky" && "color" in data && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Color</div>
          <div className="flex gap-2">
            {(["yellow", "pink", "blue", "green", "lavender"] as const).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleUpdate("color", color)}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  data.color === color
                    ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface)]"
                    : "border-transparent"
                }`}
                style={{
                  backgroundColor:
                    color === "yellow"
                      ? "#FEF3C7"
                      : color === "pink"
                        ? "#FCE7F3"
                        : color === "blue"
                          ? "#DBEAFE"
                          : color === "green"
                            ? "#D1FAE5"
                            : "#EDE9FE",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {data.type === "code" && "language" in data && (
        <div className="space-y-1">
          <div className="text-xs text-[var(--color-text-secondary)]">Language</div>
          <select
            className="flex h-9 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-sm text-[var(--color-text-primary)]"
            value={data.language}
            onChange={(e) => handleUpdate("language", e.target.value)}
          >
            <option value="ts">TypeScript</option>
            <option value="js">JavaScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="json">JSON</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="sql">SQL</option>
          </select>
        </div>
      )}
    </div>
  );
}