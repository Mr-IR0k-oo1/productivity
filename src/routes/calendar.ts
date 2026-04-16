import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { calendarEvents } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  taskId: z.string().uuid().optional(),
  kind: z.enum(["meeting", "focus", "deadline", "review", "travel"]).optional(),
  project: z.string().optional(),
  location: z.string().optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  taskId: z.string().uuid().optional().nullable(),
  kind: z.enum(["meeting", "focus", "deadline", "review", "travel"]).optional(),
  project: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

const calendarRoute = new Hono<WorkspaceBindings>();
calendarRoute.use("*", authMiddleware, workspaceMiddleware);

calendarRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.workspaceId, workspaceId));
  return c.json({ data: rows }, 200);
});

calendarRoute.post("/", zValidator("json", createEventSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const creatorId = c.get("userId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(calendarEvents)
    .values({
      workspaceId,
      creatorId,
      title: payload.title,
      description: payload.description,
      startsAt: new Date(payload.startsAt),
      endsAt: new Date(payload.endsAt),
      taskId: payload.taskId,
    })
    .returning();

  return c.json({ data: created }, 201);
});

calendarRoute.patch("/:id", zValidator("json", updateEventSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const eventId = c.req.param("id");
  const payload = c.req.valid("json");

  const updateData: Record<string, unknown> = {};
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.startsAt !== undefined) updateData.startsAt = new Date(payload.startsAt);
  if (payload.endsAt !== undefined) updateData.endsAt = new Date(payload.endsAt);
  if (payload.taskId !== undefined) updateData.taskId = payload.taskId;
  if (payload.kind !== undefined) updateData.kind = payload.kind;
  if (payload.project !== undefined) updateData.project = payload.project;
  if (payload.location !== undefined) updateData.location = payload.location;

  const [updated] = await db
    .update(calendarEvents)
    .set(updateData)
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    return c.json({ error: "Event not found" }, 404);
  }

  return c.json({ data: updated }, 200);
});

calendarRoute.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const eventId = c.req.param("id");

  const [deleted] = await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.workspaceId, workspaceId)))
    .returning({ id: calendarEvents.id });

  if (!deleted) {
    return c.json({ error: "Event not found" }, 404);
  }

  return c.body(null, 204);
});

export default calendarRoute;
