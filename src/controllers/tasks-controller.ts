import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { taskDependencies, tasks } from "@/src/db/schema";

type CreateTaskInput = {
  workspaceId: string;
  creatorId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  status?: "backlog" | "todo" | "in_progress" | "done" | "blocked";
};

export async function listTasks(workspaceId: string) {
  return db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId));
}

export async function createTask(input: CreateTaskInput) {
  const [task] = await db
    .insert(tasks)
    .values({
      workspaceId: input.workspaceId,
      creatorId: input.creatorId,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      status: input.status ?? "todo",
    })
    .returning();

  return task;
}

export async function updateTaskStatus(taskId: string, workspaceId: string, status: CreateTaskInput["status"]) {
  const [updated] = await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  return updated;
}

export async function addTaskDependency(taskId: string, dependsOnTaskId: string) {
  const [dependency] = await db
    .insert(taskDependencies)
    .values({ taskId, dependsOnTaskId })
    .returning();

  return dependency;
}
