import { and, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/src/db";
import { issueTypeValues, notifications, taskDependencies, tasks, workspaces } from "@/src/db/schema";
import { formatIssueKey, parseIssueKey } from "@/src/lib/scrum";
import type { TaskStatus } from "@/types/task-status";
import {
  mergeTaskViewMetadata,
  normalizeTaskViewMetadata,
  type TaskViewMetadata,
} from "@/types/task-view-metadata";

export type IssueType = (typeof issueTypeValues)[number];

type IssueFields = {
  issueType?: IssueType;
  parentId?: string | null;
  sprintId?: string | null;
  storyPoints?: number | null;
};

type CreateTaskInput = IssueFields & {
  workspaceId: string;
  creatorId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: number;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
};

type ListTaskFilters = {
  status?: TaskStatus;
  issueType?: IssueType;
  parentId?: string;
  projectId?: string;
  /** A sprint id, or "backlog" for issues not in any sprint. */
  sprintId?: string;
  assigneeId?: string;
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
};

type UpdateTaskInput = IssueFields & {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  projectId?: string | null;
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

function normalizeTaskRecord(task: TaskRow, issueKeyPrefix: string) {
  return {
    ...task,
    key: formatIssueKey(issueKeyPrefix, task.number),
    metadata: normalizeTaskViewMetadata(task.metadata, taskMetadataFallback(task)),
  };
}

export async function getIssueKeyPrefix(workspaceId: string) {
  const [workspace] = await db
    .select({ prefix: workspaces.issueKeyPrefix })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  return workspace?.prefix ?? "ORB";
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

  if (filters.issueType) {
    whereClauses.push(eq(tasks.issueType, filters.issueType));
  }

  if (filters.parentId) {
    whereClauses.push(eq(tasks.parentId, filters.parentId));
  }

  if (filters.projectId) {
    whereClauses.push(eq(tasks.projectId, filters.projectId));
  }

  if (filters.sprintId === "backlog") {
    whereClauses.push(isNull(tasks.sprintId));
  } else if (filters.sprintId) {
    whereClauses.push(eq(tasks.sprintId, filters.sprintId));
  }

  if (filters.dueFrom) {
    whereClauses.push(gte(tasks.dueDate, filters.dueFrom));
  }

  if (filters.dueTo) {
    whereClauses.push(lte(tasks.dueDate, filters.dueTo));
  }

  const prefix = await getIssueKeyPrefix(workspaceId);

  if (filters.search) {
    const query = `%${filters.search}%`;
    const issueKey = parseIssueKey(filters.search);
    const searchClause = or(
      ilike(tasks.title, query),
      // description is jsonb; search its text form.
      ilike(sql`${tasks.description}::text`, query),
      issueKey && issueKey.prefix === prefix ? eq(tasks.number, issueKey.number) : undefined,
    );
    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...whereClauses))
    .orderBy(desc(tasks.createdAt));

  return rows.map((row) => normalizeTaskRecord(row, prefix));
}

export async function createTask(input: CreateTaskInput) {
  const metadata = normalizeTaskViewMetadata(input.metadata, {
    startDate: input.dueDate?.toISOString() ?? new Date().toISOString(),
  });

  const { task, prefix } = await db.transaction(async (tx) => {
    // Atomically reserve the next issue number for this workspace.
    const [workspace] = await tx
      .update(workspaces)
      .set({ issueCounter: sql`${workspaces.issueCounter} + 1` })
      .where(eq(workspaces.id, input.workspaceId))
      .returning({ number: workspaces.issueCounter, prefix: workspaces.issueKeyPrefix });

    const [created] = await tx
      .insert(tasks)
      .values({
        workspaceId: input.workspaceId,
        creatorId: input.creatorId,
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        projectId: input.projectId,
        status: input.status ?? "todo",
        priority: input.priority,
        dueDate: input.dueDate,
        number: workspace?.number,
        issueType: input.issueType,
        parentId: input.parentId,
        sprintId: input.sprintId,
        storyPoints: input.storyPoints,
        metadata,
      })
      .returning();

    return { task: created, prefix: workspace?.prefix ?? "ORB" };
  });

  return normalizeTaskRecord(task, prefix);
}

export async function getTaskById(taskId: string, workspaceId: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  return task ? normalizeTaskRecord(task, await getIssueKeyPrefix(workspaceId)) : null;
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
  if (input.projectId !== undefined) updatePatch.projectId = input.projectId;
  if (input.status !== undefined) {
    updatePatch.status = input.status;
    Object.assign(updatePatch, getStatusTimestamps(input.status, existing));
  }
  if (input.priority !== undefined) updatePatch.priority = input.priority;
  if (input.dueDate !== undefined) updatePatch.dueDate = input.dueDate;
  if (metadata !== undefined) updatePatch.metadata = metadata;
  if (input.issueType !== undefined) updatePatch.issueType = input.issueType;
  if (input.parentId !== undefined) updatePatch.parentId = input.parentId;
  if (input.sprintId !== undefined) updatePatch.sprintId = input.sprintId;
  if (input.storyPoints !== undefined) updatePatch.storyPoints = input.storyPoints;

  const [updated] = await db
    .update(tasks)
    .set(updatePatch)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  return updated ? normalizeTaskRecord(updated, await getIssueKeyPrefix(workspaceId)) : null;
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

  return updated ? normalizeTaskRecord(updated, await getIssueKeyPrefix(workspaceId)) : null;
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

/** Notifies a user that an issue was assigned to them (never for self-assignment). */
export async function notifyAssignment(input: {
  workspaceId: string;
  actorUserId: string;
  assigneeId: string | null | undefined;
  task: { id: string; title: string; key: string | null };
}) {
  if (!input.assigneeId || input.assigneeId === input.actorUserId) {
    return;
  }

  await db.insert(notifications).values({
    workspaceId: input.workspaceId,
    userId: input.assigneeId,
    type: "assignment",
    title: `${input.task.key ? `${input.task.key} ` : ""}assigned to you`,
    body: input.task.title,
    link: `/tasks?taskId=${input.task.id}`,
  });
}
