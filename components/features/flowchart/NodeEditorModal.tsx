"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FlowchartNodeData, FlowchartData } from "@/stores/flowchart-store";

type FlowchartNode = FlowchartData["nodes"][number];

interface NodeEditorModalProps {
  node: FlowchartNode;
  onClose: () => void;
  onUpdate: (id: string, data: FlowchartNodeData) => void;
  onDelete: (id: string) => void;
}

export function NodeEditorModal({ node, onClose, onUpdate, onDelete }: NodeEditorModalProps) {
  const [label, setLabel] = useState(node.data.label);

  const handleSave = () => {
    onUpdate(node.id, { ...node.data, label });
  };

  const handleDelete = () => {
    onDelete(node.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Edit Node</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Node label"
              className="w-full"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Type:</span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300 capitalize">{node.data.nodeType || node.type}</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 p-4">
          <Button
            variant="ghost"
            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
