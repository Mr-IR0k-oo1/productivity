import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { comments, ideas, tasks } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const createCommentSchema = z.object({
  taskId: z.string().uuid().optional(),
  ideaId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  body: z.string().min(1),
});

const updateCommentSchema = z.object({
  body: z.string().min(1),
});

const commentsRoute = new Hono<WorkspaceBindings>();

commentsRoute.use("*", authMiddleware, workspaceMiddleware);

// Get comments for a task or idea
commentsRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const taskId = c.req.query("taskId");
  const ideaId = c.req.query("ideaId");

  if (!taskId && !ideaId) {
    return c.json({ error: "taskId or ideaId query param is required" }, 400);
  }

  let rows;
  if (taskId) {
    rows = await db
      .select()
      .from(comments)
      .where(and(eq(comments.taskId, taskId), eq(comments.workspaceId, workspaceId)))
      .orderBy(comments.createdAt);
  } else {
    rows = await db
      .select()
      .from(comments)
      .where(and(eq(comments.ideaId, ideaId), eq(comments.workspaceId, workspaceId)))
      .orderBy(comments.createdAt);
  }

  return c.json({ data: rows }, 200);
});

// Create a comment
commentsRoute.post("/", zValidator("json", createCommentSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  if (!payload.taskId && !payload.ideaId) {
    return c.json({ error: "taskId or ideaId is required" }, 400);
  }

  // Verify task or idea belongs to workspace
  if (payload.taskId) {
    const [task] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, payload.taskId), eq(tasks.workspaceId, workspaceId)))
      .limit(1);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
  }

  if (payload.ideaId) {
    const [idea] = await db
      .select({ id: ideas.id })
      .from(ideas)
      .where(and(eq(ideas.id, payload.ideaId), eq(ideas.workspaceId, workspaceId)))
      .limit(1);
    if (!idea) {
      return c.json({ error: "Idea not found" }, 404);
    }
  }

  const [created] = await db
    .insert(comments)
    .values({
      workspaceId,
      authorId: userId,
      taskId: payload.taskId ?? null,
      ideaId: payload.ideaId ?? null,
      parentId: payload.parentId,
      body: payload.body,
    })
    .returning();

  return c.json({ data: created }, 201);
});

// Update a comment
commentsRoute.patch("/:id", zValidator("json", updateCommentSchema), async (c) => {
  const commentId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [existing] = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Comment not found" }, 404);
  }

  if (existing.authorId !== userId) {
    return c.json({ error: "You can only edit your own comments" }, 403);
  }

  const [updated] = await db
    .update(comments)
    .set({
      body: payload.body,
      editedAt: new Date(),
    })
    .where(eq(comments.id, commentId))
    .returning();

  return c.json({ data: updated }, 200);
});

// Delete a comment
commentsRoute.delete("/:id", async (c) => {
  const commentId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [existing] = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Comment not found" }, 404);
  }

  if (existing.authorId !== userId) {
    return c.json({ error: "You can only delete your own comments" }, 403);
  }

  await db
    .delete(comments)
    .where(eq(comments.id, commentId));

  return c.body(null, 204);
});

export default commentsRoute;
