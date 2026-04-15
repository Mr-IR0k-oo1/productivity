import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";

import { db } from "@/src/db";
import { taskDependencies, tasks } from "@/src/db/schema";

type CreateTaskInput = {
  workspaceId: string;
  creatorId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  status?: "backlog" | "todo" | "in_progress" | "done" | "blocked";
  priority?: number;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
};

type ListTaskFilters = {
  status?: "backlog" | "todo" | "in_progress" | "done" | "blocked";
  assigneeId?: string;
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
};

type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  status?: "backlog" | "todo" | "in_progress" | "done" | "blocked";
  priority?: number;
  dueDate?: Date | null;
  metadata?: Record<string, unknown>;
};

export async function listTasks(workspaceId: string, filters: ListTaskFilters = {}) {
  const whereClauses = [eq(tasks.workspaceId, workspaceId)];

  if (filters.status) {
    whereClauses.push(eq(tasks.status, filters.status));
  }

  if (filters.assigneeId) {
    whereClauses.push(eq(tasks.assigneeId, filters.assigneeId));
  }

  if (filters.dueFrom) {
    whereClauses.push(gte(tasks.dueDate, filters.dueFrom));
  }

  if (filters.dueTo) {
    whereClauses.push(lte(tasks.dueDate, filters.dueTo));
  }

  if (filters.search) {
    const query = `%${filters.search}%`;
    whereClauses.push(ilike(tasks.title, query));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...whereClauses))
    .orderBy(desc(tasks.createdAt));
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
      priority: input.priority,
      dueDate: input.dueDate,
      metadata: input.metadata,
    })
    .returning();

  return task;
}

export async function getTaskById(taskId: string, workspaceId: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  return task;
}

export async function updateTask(taskId: string, workspaceId: string, input: UpdateTaskInput) {
  const [updated] = await db
    .update(tasks)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  return updated;
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
