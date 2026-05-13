"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiagramType } from "@/types/flowchart";

type DiagramTypeSelectorProps = {
  open: boolean;
  onSelect: (diagramType: DiagramType | null) => void;
};

const OPTIONS: Array<{ id: DiagramType | null; title: string; description: string }> = [
  { id: "flowchart", title: "Flowchart", description: "Start node plus connected process steps." },
  { id: "mindmap", title: "Mind Map", description: "A central idea with four starter branches." },
  { id: "er", title: "ER Diagram", description: "Two starter entities for schema sketching." },
  { id: "orgchart", title: "Org Chart", description: "One leader card with two reports." },
  { id: "swimlane", title: "Swimlane", description: "Three horizontal lanes for process work." },
  { id: "kanban", title: "Kanban", description: "Three lanes with two starter cards." },
  { id: null, title: "Blank Canvas", description: "Start with an empty canvas." },
];

export default function DiagramTypeSelector({ open, onSelect }: DiagramTypeSelectorProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Choose a Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {OPTIONS.map((option) => (
              <button
                key={option.title}
                type="button"
                className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-4 text-left transition hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]"
                onClick={() => onSelect(option.id)}
              >
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">{option.title}</div>
                <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{option.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
