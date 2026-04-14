import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import {
  addTaskDependency,
  createTask,
  listTasks,
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
});

const updateStatusSchema = z.object({
  status: z.enum(["backlog", "todo", "in_progress", "done", "blocked"]),
});

const dependencySchema = z.object({
  dependsOnTaskId: z.string().uuid(),
});

const tasksRoute = new Hono<WorkspaceBindings>();

tasksRoute.use("*", authMiddleware, workspaceMiddleware);

tasksRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const rows = await listTasks(workspaceId);
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
