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

const createTimeEntrySchema = z.object({
  taskId: z.string().uuid().optional(),
  description: z.string().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
});

const updateTimeEntrySchema = z
  .object({
    taskId: z.string().uuid().optional().nullable(),
    description: z.string().optional().nullable(),
    startedAt: z.string().datetime().optional(),
    endedAt: z.string().datetime().optional().nullable(),
    durationMinutes: z.number().int().positive().optional().nullable(),
    isRunning: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
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

// Create a time entry manually
timeRoute.post("/entries", zValidator("json", createTimeEntrySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(timeEntries)
    .values({
      workspaceId,
      userId,
      taskId: payload.taskId,
      description: payload.description,
      startedAt: new Date(payload.startedAt),
      endedAt: payload.endedAt ? new Date(payload.endedAt) : null,
      durationMinutes: payload.durationMinutes,
      isRunning: false,
    })
    .returning();

  return c.json({ data: created, entry: created }, 201);
});

const updateTimeEntryHandler = async (c: Parameters<typeof timeRoute.put>[2] extends (...args: infer T) => unknown ? T[0] : never) => {
  const entryId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [existing] = await db
    .select({ id: timeEntries.id, userId: timeEntries.userId })
    .from(timeEntries)
    .where(and(eq(timeEntries.id, entryId), eq(timeEntries.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Time entry not found" }, 404);
  }

  if (existing.userId !== userId) {
    return c.json({ error: "You can only edit your own time entries" }, 403);
  }

  const [updated] = await db
    .update(timeEntries)
    .set({
      taskId: payload.taskId,
      description: payload.description,
      startedAt: payload.startedAt ? new Date(payload.startedAt) : undefined,
      endedAt: payload.endedAt !== undefined ? (payload.endedAt ? new Date(payload.endedAt) : null) : undefined,
      durationMinutes: payload.durationMinutes,
      isRunning: payload.isRunning,
    })
    .where(eq(timeEntries.id, entryId))
    .returning();

  return c.json({ data: updated, entry: updated }, 200);
};

// Update a time entry (PUT endpoint required by API contract)
timeRoute.put("/entries/:id", zValidator("json", updateTimeEntrySchema), updateTimeEntryHandler);

// Update a time entry
timeRoute.patch("/entries/:id", zValidator("json", updateTimeEntrySchema), updateTimeEntryHandler);

// Delete a time entry
timeRoute.delete("/entries/:id", async (c) => {
  const entryId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [existing] = await db
    .select({ id: timeEntries.id, userId: timeEntries.userId })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.id, entryId),
        eq(timeEntries.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: "Time entry not found" }, 404);
  }

  if (existing.userId !== userId) {
    return c.json({ error: "You can only delete your own time entries" }, 403);
  }

  await db.delete(timeEntries).where(eq(timeEntries.id, entryId));

  return c.json({ success: true, deletedId: entryId }, 200);
});

// Get a single time entry
timeRoute.get("/entries/:id", async (c) => {
  const entryId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [entry] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.id, entryId),
        eq(timeEntries.workspaceId, workspaceId),
        eq(timeEntries.userId, userId),
      ),
    )
    .limit(1);

  if (!entry) {
    return c.json({ error: "Time entry not found" }, 404);
  }

  return c.json({ data: entry }, 200);
});

export default timeRoute;
