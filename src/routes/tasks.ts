import { and, eq, inArray } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import {
  addTaskDependency,
  createTask,
  getTaskById,
  listTasks,
  notifyAssignment,
  updateTask,
  updateTaskStatus,
} from "@/src/controllers/tasks-controller";
import { db } from "@/src/db";
import { issueTypeValues, sprints, tasks } from "@/src/db/schema";
import { canDeleteOwned } from "@/src/lib/permissions";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";
import { taskStatusValues } from "@/types/task-status";

const issueFieldsSchema = {
  issueType: z.enum(issueTypeValues).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sprintId: z.string().uuid().nullable().optional(),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
};

const createTaskSchema = z.object({
  ...issueFieldsSchema,
  title: z.string().min(2),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  dueDate: z.string().datetime().optional(),
  metadata: z.object({}).catchall(z.unknown()).optional(),
});

const listTaskQuerySchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  issueType: z.enum(issueTypeValues).optional(),
  parentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  sprintId: z.union([z.string().uuid(), z.literal("backlog")]).optional(),
  assigneeId: z.string().uuid().optional(),
  dueFrom: z.string().datetime().optional(),
  dueTo: z.string().datetime().optional(),
  search: z.string().trim().min(1).optional(),
});

const updateTaskSchema = z
  .object({
    ...issueFieldsSchema,
    title: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    assigneeId: z.string().uuid().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
    status: z.enum(taskStatusValues).optional(),
    priority: z.number().int().min(1).max(3).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    metadata: z.object({}).catchall(z.unknown()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const updateStatusSchema = z.object({
  status: z.enum(taskStatusValues),
});

const dependencySchema = z.object({
  dependsOnTaskId: z.string().uuid(),
});

/** Returns an error message when parent/sprint references point outside the workspace. */
async function validateIssueReferences(
  workspaceId: string,
  input: { parentId?: string | null; sprintId?: string | null },
  taskId?: string,
) {
  if (input.parentId) {
    if (input.parentId === taskId) {
      return "An issue cannot be its own parent";
    }

    const [parent] = await db
      .select({ id: tasks.id, issueType: tasks.issueType })
      .from(tasks)
      .where(and(eq(tasks.id, input.parentId), eq(tasks.workspaceId, workspaceId)))
      .limit(1);

    if (!parent) {
      return "Parent issue not found in this workspace";
    }

    if (parent.issueType !== "epic") {
      return "Only epics can be parents";
    }
  }

  if (input.sprintId) {
    const [sprint] = await db
      .select({ id: sprints.id, status: sprints.status })
      .from(sprints)
      .where(and(eq(sprints.id, input.sprintId), eq(sprints.workspaceId, workspaceId)))
      .limit(1);

    if (!sprint) {
      return "Sprint not found in this workspace";
    }

    if (sprint.status === "completed") {
      return "Cannot add issues to a completed sprint";
    }
  }

  return null;
}

const tasksRoute = new Hono<WorkspaceBindings>();

tasksRoute.use("*", authMiddleware, workspaceMiddleware);

tasksRoute.get("/", zValidator("query", listTaskQuerySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const query = c.req.valid("query");

  const rows = await listTasks(workspaceId, {
    status: query.status,
    assigneeId: query.assigneeId,
    dueFrom: query.dueFrom ? new Date(query.dueFrom) : undefined,
    dueTo: query.dueTo ? new Date(query.dueTo) : undefined,
    search: query.search,
    issueType: query.issueType,
    parentId: query.parentId,
    sprintId: query.sprintId,
  });

  return c.json({ data: rows }, 200);
});

tasksRoute.post("/", zValidator("json", createTaskSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const referenceError = await validateIssueReferences(workspaceId, payload);
  if (referenceError) {
    return c.json({ error: referenceError }, 400);
  }

  const task = await createTask({
    issueType: payload.issueType,
    parentId: payload.parentId,
    sprintId: payload.sprintId,
    storyPoints: payload.storyPoints,
    workspaceId,
    creatorId: userId,
    title: payload.title,
    description: payload.description,
    assigneeId: payload.assigneeId,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    metadata: payload.metadata,
  });

  await notifyAssignment({ workspaceId, actorUserId: userId, assigneeId: task.assigneeId, task });

  return c.json(
    {
      data: task,
      meta: {
        optimisticKey: `tasks:${workspaceId}`,
      },
    },
    201,
  );
});

tasksRoute.get("/:id", async (c) => {
  const taskId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  const task = await getTaskById(taskId, workspaceId);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ data: task }, 200);
});

tasksRoute.patch("/:id", zValidator("json", updateTaskSchema), async (c) => {
  const taskId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");
  const previous = payload.assigneeId === undefined ? null : await getTaskById(taskId, workspaceId);

  const referenceError = await validateIssueReferences(workspaceId, payload, taskId);
  if (referenceError) {
    return c.json({ error: referenceError }, 400);
  }

  const updated = await updateTask(taskId, workspaceId, {
    issueType: payload.issueType,
    parentId: payload.parentId,
    sprintId: payload.sprintId,
    storyPoints: payload.storyPoints,
    title: payload.title,
    description: payload.description,
    assigneeId: payload.assigneeId,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate === undefined ? undefined : payload.dueDate ? new Date(payload.dueDate) : null,
    metadata: payload.metadata,
  });

  if (!updated) {
    return c.json({ error: "Task not found" }, 404);
  }

  if (previous && previous.assigneeId !== updated.assigneeId) {
    await notifyAssignment({ workspaceId, actorUserId: c.get("userId"), assigneeId: updated.assigneeId, task: updated });
  }

  return c.json({ data: updated }, 200);
});

tasksRoute.patch("/:id/status", zValidator("json", updateStatusSchema), async (c) => {
  const taskId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const updated = await updateTaskStatus(taskId, workspaceId, payload.status);

  if (!updated) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ data: updated }, 200);
});

tasksRoute.post("/:id/dependencies", zValidator("json", dependencySchema), async (c) => {
  const taskId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  if (taskId === payload.dependsOnTaskId) {
    return c.json({ error: "A task cannot depend on itself" }, 400);
  }

  const relatedTaskIds = [taskId, payload.dependsOnTaskId];
  const relatedTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, relatedTaskIds)));

  const hasSourceTask = relatedTasks.some((task) => task.id === taskId);
  if (!hasSourceTask) {
    return c.json({ error: "Task not found" }, 404);
  }

  const hasDependencyTask = relatedTasks.some((task) => task.id === payload.dependsOnTaskId);
  if (!hasDependencyTask) {
    return c.json({ error: "Dependency task not found in this workspace" }, 400);
  }

  const dependency = await addTaskDependency(taskId, payload.dependsOnTaskId);
  return c.json({ data: dependency }, 201);
});

tasksRoute.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const taskId = c.req.param("id");

  const [existing] = await db
    .select({ creatorId: tasks.creatorId })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) return c.json({ error: "Task not found" }, 404);

  if (!canDeleteOwned(c.get("workspaceRole"), existing.creatorId, c.get("userId"))) {
    return c.json({ error: "Only the creator or an admin can delete this issue" }, 403);
  }

  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));

  return c.body(null, 204);
});

export default tasksRoute;
