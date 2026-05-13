import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { tags, taskTags } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().max(20).optional(),
});

const updateTagSchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().max(20).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const setTaskTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
});

const tagsRoute = new Hono<WorkspaceBindings>();

tagsRoute.use("*", authMiddleware, workspaceMiddleware);

tagsRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");

  const rows = await db
    .select()
    .from(tags)
    .where(eq(tags.workspaceId, workspaceId));

  return c.json({ data: rows }, 200);
});

tagsRoute.post("/", zValidator("json", createTagSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(tags)
    .values({
      workspaceId,
      name: payload.name,
      color: payload.color,
    })
    .returning();

  return c.json({ data: created }, 201);
});

tagsRoute.patch("/:id", zValidator("json", updateTagSchema), async (c) => {
  const tagId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [updated] = await db
    .update(tags)
    .set({
      name: payload.name,
      color: payload.color,
    })
    .where(and(eq(tags.id, tagId), eq(tags.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    return c.json({ error: "Tag not found" }, 404);
  }

  return c.json({ data: updated }, 200);
});

tagsRoute.delete("/:id", async (c) => {
  const tagId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  const [deleted] = await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.workspaceId, workspaceId)))
    .returning({ id: tags.id });

  if (!deleted) {
    return c.json({ error: "Tag not found" }, 404);
  }

  return c.body(null, 204);
});

tagsRoute.post("/tasks/:taskId", zValidator("json", setTaskTagsSchema), async (c) => {
  const taskId = c.req.param("taskId");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  // Delete existing task-tag associations
  await db
    .delete(taskTags)
    .where(eq(taskTags.taskId, taskId));

  // Insert new associations
  if (payload.tagIds.length > 0) {
    await db
      .insert(taskTags)
      .values(
        payload.tagIds.map((tagId) => ({
          taskId,
          tagId,
        })),
      );
  }

  // Fetch updated tags
  const associatedTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(tags)
    .innerJoin(taskTags, eq(taskTags.tagId, tags.id))
    .where(eq(taskTags.taskId, taskId));

  return c.json({ data: associatedTags }, 200);
});

tagsRoute.get("/tasks/:taskId", async (c) => {
  const taskId = c.req.param("taskId");

  const associatedTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(tags)
    .innerJoin(taskTags, eq(taskTags.tagId, tags.id))
    .where(eq(taskTags.taskId, taskId));

  return c.json({ data: associatedTags }, 200);
});

export default tagsRoute;
