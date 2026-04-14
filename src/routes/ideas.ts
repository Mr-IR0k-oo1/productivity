import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { ideas, tasks } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const ideaSchema = z.object({
  title: z.string().min(2),
  summary: z.string().optional(),
  content: z.string().optional(),
});

const ideaToTaskSchema = z.object({
  status: z.enum(["todo", "in_progress", "done", "blocked", "backlog"]).default("todo"),
});

const ideasRoute = new Hono<WorkspaceBindings>();

ideasRoute.use("*", authMiddleware, workspaceMiddleware);

ideasRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const rows = await db.select().from(ideas).where(eq(ideas.workspaceId, workspaceId));
  return c.json({ data: rows }, 200);
});

ideasRoute.post("/", zValidator("json", ideaSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(ideas)
    .values({
      workspaceId,
      authorId: userId,
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
    })
    .returning();

  return c.json({ data: created }, 201);
});

ideasRoute.post("/:id/convert", zValidator("json", ideaToTaskSchema), async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) return c.json({ error: "Idea not found" }, 404);

  const [task] = await db
    .insert(tasks)
    .values({
      workspaceId,
      creatorId: userId,
      title: idea.title,
      description: idea.content ?? idea.summary,
      status: payload.status,
      ideaId: idea.id,
    })
    .returning();

  await db
    .update(ideas)
    .set({ status: "converted", convertedTaskId: task.id, updatedAt: new Date() })
    .where(eq(ideas.id, idea.id));

  return c.json({ data: task }, 201);
});

export default ideasRoute;
