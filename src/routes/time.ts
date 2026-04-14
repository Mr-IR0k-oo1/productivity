import { and, eq, isNull } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { timeEntries, timesheets } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const startTimerSchema = z.object({
  taskId: z.string().uuid().optional(),
  description: z.string().optional(),
});

const stopTimerSchema = z.object({
  entryId: z.string().uuid(),
});

const createTimesheetSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

const timeRoute = new Hono<WorkspaceBindings>();
timeRoute.use("*", authMiddleware, workspaceMiddleware);

timeRoute.get("/entries", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const rows = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.workspaceId, workspaceId), eq(timeEntries.userId, userId)));

  return c.json({ data: rows }, 200);
});

timeRoute.post("/timer/start", zValidator("json", startTimerSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [runningEntry] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.workspaceId, workspaceId),
        eq(timeEntries.userId, userId),
        eq(timeEntries.isRunning, true),
      ),
    )
    .limit(1);

  if (runningEntry) return c.json({ error: "A timer is already running" }, 409);

  const [created] = await db
    .insert(timeEntries)
    .values({
      workspaceId,
      userId,
      taskId: payload.taskId,
      description: payload.description,
      startedAt: new Date(),
      isRunning: true,
    })
    .returning();

  return c.json({ data: created }, 201);
});

timeRoute.post("/timer/stop", zValidator("json", stopTimerSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [entry] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.id, payload.entryId),
        eq(timeEntries.workspaceId, workspaceId),
        eq(timeEntries.userId, userId),
        eq(timeEntries.isRunning, true),
      ),
    )
    .limit(1);

  if (!entry) return c.json({ error: "Running entry not found" }, 404);

  const endedAt = new Date();
  const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - entry.startedAt.getTime()) / 60000));

  const [updated] = await db
    .update(timeEntries)
    .set({ endedAt, durationMinutes, isRunning: false })
    .where(eq(timeEntries.id, entry.id))
    .returning();

  return c.json({ data: updated }, 200);
});

timeRoute.post("/timesheets", zValidator("json", createTimesheetSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(timesheets)
    .values({
      workspaceId,
      userId,
      periodStart: new Date(payload.periodStart),
      periodEnd: new Date(payload.periodEnd),
    })
    .returning();

  await db
    .update(timeEntries)
    .set({ timesheetId: created.id })
    .where(
      and(
        eq(timeEntries.workspaceId, workspaceId),
        eq(timeEntries.userId, userId),
        isNull(timeEntries.timesheetId),
      ),
    );

  return c.json({ data: created }, 201);
});

export default timeRoute;
