"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FlowchartVersionSummary } from "@/types/flowchart";

type VersionHistoryPanelProps = {
  versions: FlowchartVersionSummary[];
  onRestore: (versionId: string) => void;
};

export default function VersionHistoryPanel({ versions, onRestore }: VersionHistoryPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Versions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-auto">
        {versions.length === 0 ? (
          <div className="text-sm text-[var(--color-text-secondary)]">No saved versions yet.</div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-3"
            >
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {version.label ?? "Manual checkpoint"}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {new Date(version.createdAt).toLocaleString()}
              </div>
              <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => onRestore(version.id)}>
                Restore
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
