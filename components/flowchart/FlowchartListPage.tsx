"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import DiagramTypeSelector from "@/components/flowchart/DiagramTypeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">Flowcharts</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {flowcharts.map((flowchart) => (
          <Card key={flowchart.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{flowchart.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-[var(--color-text-secondary)]">
                {flowchart.description ?? "No description yet."}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Updated {new Date(flowchart.updatedAt).toLocaleString()}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => router.push(`/flowcharts/${flowchart.id}`)}>
                  Open
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void duplicateFlowchart.mutateAsync(flowchart.id).then((copy) => {
                      toast.success("Flowchart duplicated");
                      router.push(`/flowcharts/${copy.id}`);
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void deleteFlowchart.mutateAsync(flowchart.id).then(() => {
                      toast.success("Flowchart deleted");
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {flowcharts.length === 0 && !flowchartsQuery.isLoading ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-[var(--color-text-secondary)]">
            No flowcharts yet. Create one to get started.
          </CardContent>
        </Card>
      ) : null}
      <DiagramTypeSelector open={diagramSelectorOpen} onSelect={handleCreate} />
    </div>
  );
}
