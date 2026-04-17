"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Copy, Pencil, Search, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Flowchart } from "@/stores/flowchart-store";

interface FlowchartListProps {
  flowcharts: Flowchart[];
  onSelect: (flowchart: Flowchart) => void;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDuplicate: (flowchart: Flowchart) => void;
}

export function FlowchartList({ flowcharts, onSelect, onDelete, onRename, onDuplicate }: FlowchartListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFlowcharts = useMemo(() => {
    if (!searchQuery.trim()) return flowcharts;
    const query = searchQuery.toLowerCase();
    return flowcharts.filter((f) => f.name.toLowerCase().includes(query));
  }, [flowcharts, searchQuery]);

  if (flowcharts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-zinc-400">No flowcharts yet</p>
          <p className="mt-1 text-sm text-zinc-500">Create your first flowchart to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-4 border-b border-zinc-800 p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flowcharts..."
            className="pl-9"
          />
        </div>
        <span className="text-sm text-zinc-500">{filteredFlowcharts.length} flowchart{filteredFlowcharts.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredFlowcharts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg text-zinc-400">No flowcharts found</p>
              <p className="mt-1 text-sm text-zinc-500">Try a different search term</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFlowcharts.map((flowchart) => (
              <Card
                key={flowchart.id}
                className="group cursor-pointer border-zinc-800 bg-zinc-950/60 transition-colors hover:border-zinc-700"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1" onClick={() => onSelect(flowchart)}>
                      <h3 className="truncate text-base font-medium text-zinc-100">{flowchart.name}</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Updated {formatDistanceToNow(new Date(flowchart.updatedAt), { addSuffix: true })}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {flowchart.data.nodes.length} nodes, {flowchart.data.edges.length} connections
                      </p>
                    </div>
                    <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt("Enter new name:", flowchart.name);
                          if (newName && newName.trim()) {
                            onRename(flowchart.id, newName.trim());
                          }
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(flowchart);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-400 hover:bg-rose-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this flowchart?")) {
                            onDelete(flowchart.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
