"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Link2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { TaskCardNodeData } from "@/types/flowchart";

type LinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  currentTaskId?: string;
  currentIdeaId?: string;
};

export default function NodeLinkDialog({
  open,
  onOpenChange,
  nodeId,
  currentTaskId,
  currentIdeaId,
}: LinkDialogProps) {
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const [query, setQuery] = useState("");
  const [linkType, setLinkType] = useState<"task" | "idea">("task");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const handleUnlink = () => {
    if (linkType === "task") {
      const clearData: Partial<TaskCardNodeData> = {
        taskId: "",
        taskTitle: "Linked task",
        taskStatus: "todo",
        taskPriority: null,
        assigneeId: null,
        assigneeName: null,
        assigneeAvatar: null,
        dueDate: null,
        completionPct: 0,
      };
      updateNode(nodeId, clearData);
    }
    toast.success(`Unlinked from ${linkType}`);
    onOpenChange(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="fixed left-1/2 top-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-[var(--color-border-secondary)] px-4 py-3">
        <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search tasks or ideas..."
          className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
        />
      </div>
      <div className="flex gap-2 border-b border-[var(--color-border-secondary)] px-4 py-2">
        <button
          type="button"
          onClick={() => setLinkType("task")}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
            linkType === "task"
              ? "bg-[var(--color-accent)] text-[var(--color-text-on-accent)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)]"
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          Tasks
        </button>
        <button
          type="button"
          onClick={() => setLinkType("idea")}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
            linkType === "idea"
              ? "bg-[var(--color-accent)] text-[var(--color-text-on-accent)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)]"
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          Ideas
        </button>
      </div>
      <ScrollArea className="max-h-[300px]">
        <Command.Empty className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
          {query ? `No ${linkType}s found for "${query}"` : `Type to search ${linkType}s`}
        </Command.Empty>
        <Command.Group
          heading={`Available ${linkType}s`}
          className="px-2 py-2 text-xs font-medium text-[var(--color-text-secondary)]"
        />
        <Command.Item
          onSelect={() => {
            handleUnlink();
          }}
          className="flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-strong)] data-[selected=true]:bg-[var(--color-surface-strong)]"
        >
          <CheckCircle className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <span>Unlink current {linkType}</span>
        </Command.Item>
        <Command.Separator className="my-2 h-px bg-[var(--color-border-secondary)]" />
        <Command.Item
          onSelect={() => {
            toast.info("Task linking requires search API - implement in Phase 2");
            onOpenChange(false);
          }}
          className="flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-strong)] data-[selected=true]:bg-[var(--color-surface-strong)]"
        >
          <Link2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <div className="flex flex-col">
            <span className="font-medium">Search for existing {linkType}s</span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Type above to search your workspace {linkType}s
            </span>
          </div>
        </Command.Item>
      </ScrollArea>
      <div className="flex items-center justify-between border-t border-[var(--color-border-secondary)] px-4 py-3">
        <div className="text-xs text-[var(--color-text-secondary)]">
          Press <kbd className="rounded border border-[var(--color-border-secondary)] px-1">Esc</kbd> to close
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUnlink}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            Unlink
          </button>
        </div>
      </div>
    </Command.Dialog>
  );
}