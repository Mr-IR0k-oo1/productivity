import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuickTask = {
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueLabel: string;
};

const tasks: QuickTask[] = [
  { title: "Review Q1 roadmap", priority: "high", dueLabel: "Today" },
  { title: "Update team documentation", priority: "medium", dueLabel: "Tomorrow" },
  { title: "Fix login bug", priority: "urgent", dueLabel: "Today" },
  { title: "Design new dashboard", priority: "low", dueLabel: "Next week" },
];

function priorityClasses(priority: QuickTask["priority"]) {
  if (priority === "urgent") return "border-rose-900 bg-rose-950/60 text-rose-300";
  if (priority === "high") return "border-amber-900 bg-amber-950/60 text-amber-300";
  if (priority === "medium") return "border-emerald-900 bg-emerald-950/60 text-emerald-300";
  return "border-zinc-800 bg-zinc-900 text-zinc-300";
}

export function QuickTasksList() {
  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader>
        <CardTitle>Quick Tasks</CardTitle>
        <p className="text-sm text-zinc-400">Your immediate priorities</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.title}
            className="flex items-center justify-between rounded-lg border border-zinc-900 bg-zinc-950/60 px-3 py-2.5 transition-colors hover:border-zinc-700"
          >
            <div className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 rounded border-zinc-700 bg-zinc-950" aria-label={task.title} />
              <p className="text-sm text-zinc-200">{task.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${priorityClasses(task.priority)}`}
              >
                {task.priority}
              </span>
              <span className="text-xs text-zinc-500">{task.dueLabel}</span>
            </div>
          </div>
        ))}
        <div className="pt-1">
          <Link href="/tasks" className="text-sm font-medium text-zinc-300 underline-offset-4 hover:text-zinc-100 hover:underline">
            View all tasks
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
