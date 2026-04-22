import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db } from "@/src/db";
import { taskDependencies, tasks } from "@/src/db/schema";
import type { TaskStatus } from "@/types/task-status";
import {
  mergeTaskViewMetadata,
  normalizeTaskViewMetadata,
  type TaskViewMetadata,
} from "@/types/task-view-metadata";

type CreateTaskInput = {
  workspaceId: string;
  creatorId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: number;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
};

type ListTaskFilters = {
  status?: TaskStatus;
  assigneeId?: string;
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
};

type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  status?: TaskStatus;
  priority?: number;
  dueDate?: Date | null;
  metadata?: Record<string, unknown>;
};

type TaskRow = typeof tasks.$inferSelect;

function taskMetadataFallback(task: Pick<TaskRow, "createdAt" | "dueDate">): Partial<TaskViewMetadata> {
  return {
    startDate: (task.createdAt ?? task.dueDate ?? new Date()).toISOString(),
  };
}

function normalizeTaskRecord(task: TaskRow): TaskRow {
  return {
    ...task,
    metadata: normalizeTaskViewMetadata(task.metadata, taskMetadataFallback(task)),
  };
}

function getStatusTimestamps(status: TaskStatus, current: Pick<TaskRow, "startedAt" | "completedAt">) {
  const now = new Date();
  const patch: Pick<TaskRow, "startedAt" | "completedAt"> = {
    startedAt: current.startedAt ?? null,
    completedAt: current.completedAt ?? null,
  };

  if (status === "in_progress" && !patch.startedAt) {
    patch.startedAt = now;
  }

  if (status === "done") {
    if (!patch.startedAt) {
      patch.startedAt = now;
    }
    patch.completedAt = now;
    return patch;
  }

  if (patch.completedAt) {
    patch.completedAt = null;
  }

  return patch;
}

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
    const searchClause = or(ilike(tasks.title, query), ilike(tasks.description, query));
    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...whereClauses))
    .orderBy(desc(tasks.createdAt));

  return rows.map(normalizeTaskRecord);
}

export async function createTask(input: CreateTaskInput) {
  const metadata = normalizeTaskViewMetadata(input.metadata, {
    startDate: input.dueDate?.toISOString() ?? new Date().toISOString(),
  });

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
      metadata,
    })
    .returning();

  return normalizeTaskRecord(task);
}

export async function getTaskById(taskId: string, workspaceId: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  return task ? normalizeTaskRecord(task) : null;
}

export async function updateTask(taskId: string, workspaceId: string, input: UpdateTaskInput) {
  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return null;
  }

  const metadata =
    input.metadata === undefined
      ? undefined
      : mergeTaskViewMetadata(existing.metadata, input.metadata, taskMetadataFallback(existing));

  const updatePatch: Partial<TaskRow> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updatePatch.title = input.title;
  if (input.description !== undefined) updatePatch.description = input.description;
  if (input.assigneeId !== undefined) updatePatch.assigneeId = input.assigneeId;
  if (input.status !== undefined) {
    updatePatch.status = input.status;
    Object.assign(updatePatch, getStatusTimestamps(input.status, existing));
  }
  if (input.priority !== undefined) updatePatch.priority = input.priority;
  if (input.dueDate !== undefined) updatePatch.dueDate = input.dueDate;
  if (metadata !== undefined) updatePatch.metadata = metadata;

  const [updated] = await db
    .update(tasks)
    .set(updatePatch)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  return updated ? normalizeTaskRecord(updated) : null;
}

export async function updateTaskStatus(taskId: string, workspaceId: string, status: TaskStatus) {
  const [existing] = await db
    .select({
      startedAt: tasks.startedAt,
      completedAt: tasks.completedAt,
      status: tasks.status,
    })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return null;
  }

  const [updated] = await db
    .update(tasks)
    .set({
      status,
      updatedAt: new Date(),
      ...getStatusTimestamps(status, existing),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  return updated ? normalizeTaskRecord(updated) : null;
}

export async function addTaskDependency(taskId: string, dependsOnTaskId: string) {
  const [dependency] = await db
    .insert(taskDependencies)
    .values({ taskId, dependsOnTaskId })
    .onConflictDoNothing()
    .returning();

  if (dependency) {
    return dependency;
  }

  const [existing] = await db
    .select()
    .from(taskDependencies)
    .where(and(eq(taskDependencies.taskId, taskId), eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)))
    .limit(1);

  return existing ?? null;
}
