import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type TaskCardProps = {
  title: string;
  description?: string | Record<string, unknown>;
  assignee?: string;
  initials?: string;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
  labels?: string[];
  subtasksDone?: number;
  subtasksTotal?: number;
  comments?: number;
  selected?: boolean;
  overdue?: boolean;
  className?: string;
  onClick?: () => void;
};

export function TaskCard({
  title,
  description,
  assignee,
  initials,
  dueDate,
  priority,
  labels = [],
  subtasksDone,
  subtasksTotal,
  comments,
  selected = false,
  overdue = false,
  className,
  onClick,
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer border-zinc-900 bg-zinc-950/60 transition-all hover:-translate-y-0.5 hover:border-zinc-700",
        selected && "border-zinc-700 ring-1 ring-zinc-700",
        className,
      )}
      onClick={onClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-5">{title}</CardTitle>
          {priority ? (
            <Badge variant={priority === "High" ? "warning" : priority === "Low" ? "default" : "success"}>
              {priority}
            </Badge>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-zinc-400">
            {typeof description === "string" ? description : "Rich text description"}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          {assignee && assignee !== "Unassigned" ? (
            <div className="flex items-center gap-2 text-zinc-300">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{initials ?? assignee.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span>{assignee}</span>
            </div>
          ) : null}
          {dueDate && !Number.isNaN(new Date(dueDate).getTime()) ? (
            <span className={cn(overdue && "text-rose-500")}>Due {format(new Date(dueDate), "MMM d")}</span>
          ) : null}
        </div>

        {labels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <Badge key={label} variant="default">
                {label}
              </Badge>
            ))}
          </div>
        ) : null}

        {typeof subtasksDone === "number" && typeof subtasksTotal === "number" ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Subtasks</span>
              <span>
                {subtasksDone}/{subtasksTotal}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-900">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0}%` }}
              />
            </div>
          </div>
        ) : null}

        {typeof comments === "number" ? (
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Comments</span>
            <span>{comments}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
