import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

interface TaskStub {
  id: string;
  title: string;
  lane: "Backlog" | "In progress" | "Done";
}

const taskStubs: TaskStub[] = [
  { id: "task-001", title: "Wire shell layout", lane: "Done" },
  { id: "task-002", title: "Add route-level data hooks", lane: "Backlog" },
  { id: "task-003", title: "Define report exports", lane: "In progress" },
];

export default function TasksPage() {
  return (
    <WorkspaceShellPage title="Tasks" subtitle="Track delivery work and open task detail stubs.">
      <RouteStubCard title="Task board" description="Open a task to view route-level shell integration.">
        <ul className="space-y-2">
          {taskStubs.map((task) => (
            <li key={task.id}>
              <Link
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-2 text-sm transition-colors hover:bg-[#161616]"
              >
                <span className="font-medium text-white">{task.title}</span>
                <span className="flex items-center gap-2 text-neutral-400">
                  {task.lane}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </RouteStubCard>
    </WorkspaceShellPage>
  );
}
