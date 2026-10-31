import type { TaskDTO } from "@/hooks/useTasks";

type UpNextTask = Pick<TaskDTO, "id" | "key" | "title" | "status" | "priority" | "dueDate" | "assigneeId">;

/**
 * Open issues for the dashboard: the viewer's own first; if nothing is assigned to them,
 * every open issue, so a single-user workspace still shows its work.
 * Sorted by priority (1 is highest), then soonest due date.
 */
export function selectUpNext<T extends UpNextTask>(
  tasks: T[],
  userId: string | null,
  limit = 6,
): { items: T[]; scope: "mine" | "all" } {
  const open = tasks.filter((task) => task.status !== "done");
  const mine = userId ? open.filter((task) => task.assigneeId === userId) : [];
  const scope = mine.length > 0 ? "mine" : "all";
  const pool = scope === "mine" ? mine : open;

  const due = (task: T) => (task.dueDate ? new Date(task.dueDate).getTime() : Number.POSITIVE_INFINITY);
  const items = [...pool]
    .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2) || due(a) - due(b))
    .slice(0, limit);

  return { items, scope };
}

export function priorityLabel(priority: number | null | undefined): "High" | "Medium" | "Low" {
  if (priority === 1) return "High";
  if (priority === 3) return "Low";
  return "Medium";
}
