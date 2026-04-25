"use client";

import type { NodeProps } from "@xyflow/react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import React, { memo } from "react";

import LockBadge from "@/components/flowchart/nodes/LockBadge";
import NodeHandles from "@/components/flowchart/nodes/NodeHandles";
import { Badge } from "@/components/ui/badge";
import type { OrbitNode } from "@/types/flowchart";

function priorityBorder(priority: OrbitNode["data"] extends infer T ? T : never) {
  if (typeof priority !== "object" || !priority || priority.type !== "task_card") {
    return "var(--color-border-secondary)";
  }

  if (priority.taskPriority === "critical") {
    return "#ef4444";
  }

  if (priority.taskPriority === "high") {
    return "#f59e0b";
  }

  if (priority.taskPriority === "medium") {
    return "#3b82f6";
  }

  if (priority.taskPriority === "low") {
    return "#6b7280";
  }

  return "var(--color-border-secondary)";
}

function statusVariant(status: string) {
  if (status === "done" || status === "completed") {
    return "success" as const;
  }

  if (status === "in_progress" || status === "doing") {
    return "default" as const;
  }

  return "warning" as const;
}

function TaskCardNodeComponent({ data }: NodeProps<OrbitNode>) {
  if (data.type !== "task_card") {
    return null;
  }

  return (
    <button
      type="button"
      className="group relative block min-h-[90px] min-w-[220px] rounded-2xl border bg-[var(--color-surface)] p-4 text-left shadow-xl"
      style={{ borderColor: priorityBorder(data) }}
      onClick={() => {
        window.dispatchEvent(new CustomEvent("orbit:open-task", { detail: { taskId: data.taskId } }));
      }}
    >
      <NodeHandles />
      <div className="mb-2 flex items-start justify-between gap-3">
        <Badge variant={data.taskPriority ? "warning" : "default"} className="capitalize">
          {data.taskPriority ?? "task"}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(data.taskStatus)} className="capitalize">
            {data.taskStatus.replaceAll("_", " ")}
          </Badge>
          <button
            type="button"
            className="rounded-md p-1 text-[var(--color-text-secondary)] opacity-0 transition-opacity hover:bg-[var(--color-surface-strong)] group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("orbit:refresh-task-node", {
                  detail: { taskId: data.taskId },
                }),
              );
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="line-clamp-2 text-sm font-semibold text-[var(--color-text-primary)]">{data.taskTitle}</div>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-strong)] text-[10px]">
            {(data.assigneeName ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <span>{data.assigneeName ?? "Unassigned"}</span>
        </div>
        <span>{data.dueDate ? format(new Date(data.dueDate), "MMM d") : "No due date"}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-strong)]">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${data.completionPct}%` }} />
      </div>
      <LockBadge locked={data.locked} />
    </button>
  );
}

const TaskCardNode = memo(TaskCardNodeComponent);

export default TaskCardNode;
