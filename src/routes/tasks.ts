import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import {
  addTaskDependency,
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "@/src/controllers/tasks-controller";
import { db } from "@/src/db";
import { tasks } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "done", "blocked"]).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  dueDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const listTaskQuerySchema = z.object({
  status: z.enum(["backlog", "todo", "in_progress", "done", "blocked"]).optional(),
  assigneeId: z.string().uuid().optional(),
  dueFrom: z.string().datetime().optional(),
  dueTo: z.string().datetime().optional(),
  search: z.string().trim().min(1).optional(),
});

const updateTaskSchema = z
  .object({
    title: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    assigneeId: z.string().uuid().optional().nullable(),
    status: z.enum(["backlog", "todo", "in_progress", "done", "blocked"]).optional(),
    priority: z.number().int().min(1).max(3).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const updateStatusSchema = z.object({
  status: z.enum(["backlog", "todo", "in_progress", "done", "blocked"]),
});

const dependencySchema = z.object({
  dependsOnTaskId: z.string().uuid(),
});

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
  });

  return c.json({ data: rows }, 200);
});

tasksRoute.post("/", zValidator("json", createTaskSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const task = await createTask({
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

  const updated = await updateTask(taskId, workspaceId, {
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

  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!task) return c.json({ error: "Task not found" }, 404);

  const dependency = await addTaskDependency(taskId, payload.dependsOnTaskId);
  return c.json({ data: dependency }, 201);
});

tasksRoute.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const taskId = c.req.param("id");

  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning({ id: tasks.id });

  if (!deleted) return c.json({ error: "Task not found" }, 404);

  return c.body(null, 204);
});

export default tasksRoute;
