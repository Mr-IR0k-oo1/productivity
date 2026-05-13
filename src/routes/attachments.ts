import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { attachments, ideas, tasks } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const createAttachmentSchema = z.object({
  taskId: z.string().uuid().optional(),
  ideaId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1),
  mimeType: z.string().max(100).optional(),
  fileSize: z.number().int().positive(),
});

const attachmentsRoute = new Hono<WorkspaceBindings>();

attachmentsRoute.use("*", authMiddleware, workspaceMiddleware);

// Get attachments for a task or idea
attachmentsRoute.get("/", async (c) => {
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
      .from(attachments)
      .where(and(eq(attachments.taskId, taskId), eq(attachments.workspaceId, workspaceId)));
  } else if (ideaId) {
    rows = await db
      .select()
      .from(attachments)
      .where(and(eq(attachments.ideaId, ideaId), eq(attachments.workspaceId, workspaceId)));
  } else {
    return c.json({ error: "taskId or ideaId query param is required" }, 400);
  }

  return c.json({ data: rows }, 200);
});

// Create an attachment record
attachmentsRoute.post("/", zValidator("json", createAttachmentSchema), async (c) => {
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
    .insert(attachments)
    .values({
      workspaceId,
      uploaderId: userId,
      taskId: payload.taskId ?? null,
      ideaId: payload.ideaId ?? null,
      fileName: payload.fileName,
      filePath: payload.filePath,
      mimeType: payload.mimeType,
      fileSize: payload.fileSize,
    })
    .returning();

  return c.json({ data: created }, 201);
});

// Delete an attachment
attachmentsRoute.delete("/:id", async (c) => {
  const attachmentId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [existing] = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, attachmentId), eq(attachments.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Attachment not found" }, 404);
  }

  if (existing.uploaderId !== userId) {
    return c.json({ error: "You can only delete your own attachments" }, 403);
  }

  await db
    .delete(attachments)
    .where(eq(attachments.id, attachmentId));

  return c.body(null, 204);
});

export default attachmentsRoute;
