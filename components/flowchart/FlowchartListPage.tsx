"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import DiagramTypeSelector from "@/components/flowchart/DiagramTypeSelector";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useCreateFlowchart, useDeleteFlowchart, useDuplicateFlowchart, useFlowcharts } from "@/hooks/useFlowchart";
import { buildTemplateCanvas } from "@/lib/flowchart/templates";
import type { DiagramType } from "@/types/flowchart";

export default function FlowchartListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [diagramSelectorOpen, setDiagramSelectorOpen] = useState(false);
  const flowchartsQuery = useFlowcharts(search);
  const createFlowchart = useCreateFlowchart();
  const duplicateFlowchart = useDuplicateFlowchart();
  const deleteFlowchart = useDeleteFlowchart();

  const flowcharts = useMemo(() => flowchartsQuery.data?.flowcharts ?? [], [flowchartsQuery.data]);

  const handleCreate = async (diagramType: DiagramType | null) => {
    setDiagramSelectorOpen(false);

    const created = await createFlowchart.mutateAsync({
      title: diagramType ? `${diagramType[0].toUpperCase()}${diagramType.slice(1)} diagram` : "Untitled flowchart",
      mode: "infinite",
      diagramType,
      canvasState: buildTemplateCanvas(diagramType),
    });

    router.push(`/flowcharts/${created.id}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Flowcharts</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Build process maps, swimlanes, org charts, and idea boards in Orbit.
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search flowcharts"
            className="w-[260px]"
          />
          <Button type="button" onClick={() => setDiagramSelectorOpen(true)}>
            <Plus className="h-4 w-4" />
            New Flowchart
          </Button>
        </div>
      </div>
      <div className="stagger-children grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {flowcharts.map((flowchart) => (
          <div key={flowchart.id} className="orbit-card orbit-card-glow group relative flex flex-col p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{flowchart.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                {flowchart.description ?? "No description yet."}
              </p>
            </div>
            
            <div className="mb-6 text-xs font-medium text-[var(--muted)] opacity-70">
              Updated {new Date(flowchart.updatedAt).toLocaleDateString()}
            </div>
            
            <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-[color:var(--card-border)]">
              <Button type="button" variant="secondary" size="sm" onClick={() => router.push(`/flowcharts/${flowchart.id}`)} className="bg-[var(--surface-strong)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                Open
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  void duplicateFlowchart.mutateAsync(flowchart.id).then((copy) => {
                    toast.success("Flowchart duplicated");
                    router.push(`/flowcharts/${copy.id}`);
                  });
                }}
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Duplicate
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  void deleteFlowchart.mutateAsync(flowchart.id).then(() => {
                    toast.success("Flowchart deleted");
                  });
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {flowcharts.length === 0 && !flowchartsQuery.isLoading ? (
        <EmptyState
          title="No flowcharts yet"
          description="Create your first flowchart to start mapping out ideas visually."
          icon={<Plus className="h-8 w-8 text-[var(--muted)]" />}
          action={{
            label: "Create Flowchart",
            onClick: () => setDiagramSelectorOpen(true),
          }}
        />
      ) : null}
      <DiagramTypeSelector open={diagramSelectorOpen} onSelect={handleCreate} />
    </div>
  );
}
