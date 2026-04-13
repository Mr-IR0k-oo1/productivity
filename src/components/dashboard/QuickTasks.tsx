import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskItem, TaskRow } from "@/components/common/TaskItem";

const tasks: TaskRow[] = [
  { id: "task-1", title: "Review Q1 roadmap", priority: "High", dueDate: "Due today" },
  { id: "task-2", title: "Update team documentation", priority: "Medium", dueDate: "Due tomorrow" },
  { id: "task-3", title: "Fix login bug", priority: "Urgent", dueDate: "Due today" },
  { id: "task-4", title: "Design new dashboard", priority: "Low", dueDate: "Due next week" },
];

export function QuickTasks() {
  return (
    <Card className="border-white/10 bg-[#111111]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-white">Quick Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} {...task} />
        ))}
      </CardContent>
    </Card>
  );
}
