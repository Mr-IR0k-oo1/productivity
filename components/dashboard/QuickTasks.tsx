import { TaskItem } from "@/components/common/TaskItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tasks = [
  { title: "Finalize onboarding checklist", assignee: "AK" },
  { title: "Refine investor pitch deck", assignee: "BM" },
  { title: "Ship realtime notifications", assignee: "CR", done: true },
  { title: "Backlog grooming with design", assignee: "DS" },
];

export function QuickTasks() {
  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader>
        <CardTitle>Quick Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.title} {...task} />
        ))}
      </CardContent>
    </Card>
  );
}
