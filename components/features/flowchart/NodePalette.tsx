"use client";

import { Grip, Circle, Square, Diamond, ArrowRightLeft, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const nodeTypes = [
  { type: "start", label: "Start", icon: Circle, color: "bg-emerald-500", textColor: "text-emerald-400" },
  { type: "end", label: "End", icon: Circle, color: "bg-rose-500", textColor: "text-rose-400" },
  { type: "process", label: "Process", icon: Square, color: "bg-zinc-700", textColor: "text-zinc-300" },
  { type: "decision", label: "Decision", icon: Diamond, color: "bg-amber-600", textColor: "text-amber-400" },
  { type: "data", label: "Data", icon: ArrowRightLeft, color: "bg-blue-600", textColor: "text-blue-400" },
  { type: "delay", label: "Delay", icon: Clock, color: "bg-violet-600", textColor: "text-violet-400" },
];

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <Card className="m-4 w-48 shrink-0 border-zinc-800 bg-zinc-950/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">Add Nodes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nodeTypes.map(({ type, label, icon: Icon, color, textColor }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAddNode(type)}
            className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", color)}>
              <Icon className={cn("h-4 w-4", textColor)} />
            </div>
            <span className="text-zinc-300">{label}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
