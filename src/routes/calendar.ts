import { eq } from "drizzle-orm";
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

export default calendarRoute;
