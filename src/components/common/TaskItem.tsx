import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TaskRow {
  id: string;
  title: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  completed?: boolean;
}

const priorityStyles: Record<TaskRow["priority"], string> = {
  Low: "border-neutral-700 text-neutral-300",
  Medium: "border-amber-800/70 text-amber-300",
  High: "border-orange-700/70 text-orange-300",
  Urgent: "border-red-700/70 text-red-300",
};

export function TaskItem({ title, dueDate, priority, completed }: TaskRow) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#121212] p-3 transition-colors hover:border-white/20">
      <div className="flex items-center gap-3">
        <input
          aria-label={`Toggle task ${title}`}
          type="checkbox"
          defaultChecked={completed}
          className="h-4 w-4 cursor-pointer rounded border-neutral-600 bg-[#0f0f0f] accent-white"
        />
        <span className={cn("text-sm font-medium text-neutral-100", completed && "line-through text-neutral-500")}>
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
            priorityStyles[priority],
          )}
        >
          {priority}
        </span>
        <span className="hidden items-center gap-1 text-xs text-neutral-400 sm:inline-flex">
          <CalendarDays className="h-3.5 w-3.5" />
          {dueDate}
        </span>
      </div>
    </div>
  );
}
