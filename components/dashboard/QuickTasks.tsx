import { TaskItem } from "@/components/common/TaskItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTasksQuery } from "@/hooks/useTasks";

export function QuickTasks() {
  const { data: tasks, isLoading } = useTasksQuery();

  const quickTasks = tasks?.slice(0, 4).map((task) => ({
    title: task.title,
    assignee: task.assigneeId?.slice(0, 2).toUpperCase() || "NA",
    done: task.status === "done",
  })) ?? [
    { title: "Finalize onboarding checklist", assignee: "AK" },
    { title: "Refine investor pitch deck", assignee: "BM" },
    { title: "Ship realtime notifications", assignee: "CR", done: true },
    { title: "Backlog grooming with design", assignee: "DS" },
  ];

  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader>
        <CardTitle>Quick Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : (
          quickTasks.map((task) => (
            <TaskItem key={task.title} {...task} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
