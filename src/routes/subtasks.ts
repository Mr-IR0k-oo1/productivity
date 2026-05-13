import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { subtasks, tasks } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const createSubtaskSchema = z.object({
  title: z.string().min(2).max(200),
  isDone: z.boolean().default(false),
  position: z.number().int().default(0),
});

const updateSubtaskSchema = z
  .object({
    title: z.string().min(2).max(200).optional(),
    isDone: z.boolean().optional(),
    position: z.number().int().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const subtasksRoute = new Hono<WorkspaceBindings>();

subtasksRoute.use("*", authMiddleware, workspaceMiddleware);

// Get all subtasks for a task
subtasksRoute.get("/tasks/:taskId", async (c) => {
  const taskId = c.req.param("taskId");
  const workspaceId = c.get("workspaceId");

  // Verify task belongs to workspace
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const rows = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(subtasks.position);

  return c.json({ data: rows }, 200);
});

// Create a subtask
subtasksRoute.post("/tasks/:taskId", zValidator("json", createSubtaskSchema), async (c) => {
  const taskId = c.req.param("taskId");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  // Verify task belongs to workspace
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const [created] = await db
    .insert(subtasks)
    .values({
      taskId,
      title: payload.title,
      isDone: payload.isDone,
      position: payload.position,
    })
    .returning();

  return c.json({ data: created }, 201);
});

// Update a subtask
subtasksRoute.patch("/:id", zValidator("json", updateSubtaskSchema), async (c) => {
  const subtaskId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  // Verify subtask belongs to a task in this workspace
  const [existing] = await db
    .select({ id: subtasks.id })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
    .where(and(eq(subtasks.id, subtaskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Subtask not found" }, 404);
  }

  const [updated] = await db
    .update(subtasks)
    .set({
      title: payload.title,
      isDone: payload.isDone,
      position: payload.position,
    })
    .where(eq(subtasks.id, subtaskId))
    .returning();

  return c.json({ data: updated }, 200);
});

// Delete a subtask
subtasksRoute.delete("/:id", async (c) => {
  const subtaskId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  // Verify subtask belongs to a task in this workspace
  const [existing] = await db
    .select({ id: subtasks.id })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
    .where(and(eq(subtasks.id, subtaskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Subtask not found" }, 404);
  }

  await db
    .delete(subtasks)
    .where(eq(subtasks.id, subtaskId));

  return c.body(null, 204);
});

export default subtasksRoute;
