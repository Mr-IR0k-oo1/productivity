import { CheckCircle2, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type TaskItemProps = {
  title: string;
  assignee: string;
  done?: boolean;
};

export function TaskItem({ title, assignee, done }: TaskItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-900 bg-zinc-950/60 px-3 py-2.5 transition-colors hover:border-zinc-700">
      <div className="flex items-center gap-3">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Circle className="h-4 w-4 text-zinc-500" />
        )}
        <p className="text-sm text-zinc-200">{title}</p>
      </div>
      <Badge variant="default">{assignee}</Badge>
    </div>
  );
}
