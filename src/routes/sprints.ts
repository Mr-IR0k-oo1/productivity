import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { sprintStatusValues, sprints, tasks } from "@/src/db/schema";
import { buildBurndown, computeVelocity, sumStoryPoints } from "@/src/lib/scrum";
import { authMiddleware } from "@/src/middleware/auth";
import { requirePermission } from "@/src/middleware/permissions";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const DEFAULT_SPRINT_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const createSprintSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  goal: z.string().trim().max(2000).nullable().optional(),
});

const updateSprintSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    goal: z.string().trim().max(2000).nullable().optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

const startSprintSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const completeSprintSchema = z.object({
  // Where unfinished issues go: the backlog, or another planned sprint.
  moveIncompleteTo: z.union([z.literal("backlog"), z.string().uuid()]).default("backlog"),
});

const listSprintsQuerySchema = z.object({
  status: z.enum(sprintStatusValues).optional(),
});

type SprintRow = typeof sprints.$inferSelect;

async function findSprint(sprintId: string, workspaceId: string) {
  const [sprint] = await db
    .select()
    .from(sprints)
    .where(and(eq(sprints.id, sprintId), eq(sprints.workspaceId, workspaceId)))
    .limit(1);

  return sprint ?? null;
}

async function loadSprintIssues(sprintIds: string[]) {
  if (sprintIds.length === 0) {
    return [];
  }

  return db
    .select({ sprintId: tasks.sprintId, status: tasks.status, storyPoints: tasks.storyPoints, completedAt: tasks.completedAt })
    .from(tasks)
    .where(inArray(tasks.sprintId, sprintIds));
}

function summarize(sprint: SprintRow, issues: Awaited<ReturnType<typeof loadSprintIssues>>) {
  const own = issues.filter((issue) => issue.sprintId === sprint.id);
  const done = own.filter((issue) => issue.status === "done");

  return {
    ...sprint,
    issueCount: own.length,
    doneCount: done.length,
    totalPoints: sumStoryPoints(own),
    donePoints: sumStoryPoints(done),
  };
}

const sprintsRoute = new Hono<WorkspaceBindings>();

sprintsRoute.use("*", authMiddleware, workspaceMiddleware, requirePermission("manageSprints", { writesOnly: true }));

sprintsRoute.get("/", zValidator("query", listSprintsQuerySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const { status } = c.req.valid("query");

  const rows = await db
    .select()
    .from(sprints)
    .where(status ? and(eq(sprints.workspaceId, workspaceId), eq(sprints.status, status)) : eq(sprints.workspaceId, workspaceId))
    .orderBy(asc(sprints.createdAt));

  const issues = await loadSprintIssues(rows.map((row) => row.id));
  return c.json({ data: rows.map((row) => summarize(row, issues)) }, 200);
});

sprintsRoute.get("/velocity", async (c) => {
  const workspaceId = c.get("workspaceId");

  const completed = await db
    .select()
    .from(sprints)
    .where(and(eq(sprints.workspaceId, workspaceId), eq(sprints.status, "completed")))
    .orderBy(desc(sprints.completedAt))
    .limit(6);

  return c.json({ data: computeVelocity(completed.reverse()) }, 200);
});

sprintsRoute.post("/", zValidator("json", createSprintSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [{ total }] = await db.select({ total: count() }).from(sprints).where(eq(sprints.workspaceId, workspaceId));

  const [created] = await db
    .insert(sprints)
    .values({
      workspaceId,
      name: payload.name ?? `Sprint ${total + 1}`,
      goal: payload.goal ?? null,
    })
    .returning();

  return c.json({ data: summarize(created, []) }, 201);
});

sprintsRoute.patch("/:id", zValidator("json", updateSprintSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");
  const sprint = await findSprint(c.req.param("id"), workspaceId);

  if (!sprint) {
    return c.json({ error: "Sprint not found" }, 404);
  }

  const startDate = payload.startDate === undefined ? sprint.startDate : payload.startDate ? new Date(payload.startDate) : null;
  const endDate = payload.endDate === undefined ? sprint.endDate : payload.endDate ? new Date(payload.endDate) : null;

  if (startDate && endDate && endDate <= startDate) {
    return c.json({ error: "End date must be after the start date" }, 400);
  }

  const [updated] = await db
    .update(sprints)
    .set({
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.goal !== undefined ? { goal: payload.goal } : {}),
      startDate,
      endDate,
      updatedAt: new Date(),
    })
    .where(eq(sprints.id, sprint.id))
    .returning();

  const issues = await loadSprintIssues([updated.id]);
  return c.json({ data: summarize(updated, issues) }, 200);
});

sprintsRoute.post("/:id/start", zValidator("json", startSprintSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");
  const sprint = await findSprint(c.req.param("id"), workspaceId);

  if (!sprint) {
    return c.json({ error: "Sprint not found" }, 404);
  }

  if (sprint.status !== "planned") {
    return c.json({ error: "Only planned sprints can be started" }, 409);
  }

  const [active] = await db
    .select({ id: sprints.id, name: sprints.name })
    .from(sprints)
    .where(and(eq(sprints.workspaceId, workspaceId), eq(sprints.status, "active")))
    .limit(1);

  if (active) {
    return c.json({ error: `Complete ${active.name} before starting another sprint` }, 409);
  }

  const startDate = payload.startDate ? new Date(payload.startDate) : sprint.startDate ?? new Date();
  const endDate = payload.endDate
    ? new Date(payload.endDate)
    : sprint.endDate ?? new Date(startDate.getTime() + DEFAULT_SPRINT_DAYS * DAY_MS);

  if (endDate <= startDate) {
    return c.json({ error: "End date must be after the start date" }, 400);
  }

  const issues = await loadSprintIssues([sprint.id]);

  const [updated] = await db
    .update(sprints)
    .set({
      status: "active",
      startDate,
      endDate,
      committedPoints: sumStoryPoints(issues),
      updatedAt: new Date(),
    })
    .where(eq(sprints.id, sprint.id))
    .returning();

  return c.json({ data: summarize(updated, issues) }, 200);
});

sprintsRoute.post("/:id/complete", zValidator("json", completeSprintSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const { moveIncompleteTo } = c.req.valid("json");
  const sprint = await findSprint(c.req.param("id"), workspaceId);

  if (!sprint) {
    return c.json({ error: "Sprint not found" }, 404);
  }

  if (sprint.status !== "active") {
    return c.json({ error: "Only the active sprint can be completed" }, 409);
  }

  let targetSprintId: string | null = null;

  if (moveIncompleteTo !== "backlog") {
    const target = await findSprint(moveIncompleteTo, workspaceId);

    if (!target || target.status !== "planned" || target.id === sprint.id) {
      return c.json({ error: "Unfinished issues can only move to a planned sprint" }, 400);
    }

    targetSprintId = target.id;
  }

  const issues = await loadSprintIssues([sprint.id]);
  const completedPoints = sumStoryPoints(issues.filter((issue) => issue.status === "done"));

  const updated = await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ sprintId: targetSprintId, updatedAt: new Date() })
      .where(and(eq(tasks.sprintId, sprint.id), ne(tasks.status, "done")));

    const [row] = await tx
      .update(sprints)
      .set({ status: "completed", completedAt: new Date(), completedPoints, updatedAt: new Date() })
      .where(eq(sprints.id, sprint.id))
      .returning();

    return row;
  });

  const remaining = await loadSprintIssues([updated.id]);
  return c.json({ data: summarize(updated, remaining) }, 200);
});

sprintsRoute.get("/:id/burndown", async (c) => {
  const workspaceId = c.get("workspaceId");
  const sprint = await findSprint(c.req.param("id"), workspaceId);

  if (!sprint) {
    return c.json({ error: "Sprint not found" }, 404);
  }

  if (!sprint.startDate || !sprint.endDate) {
    return c.json({ data: [] }, 200);
  }

  const issues = await loadSprintIssues([sprint.id]);
  const committedPoints = sprint.committedPoints ?? sumStoryPoints(issues);
  const points = buildBurndown(
    { startDate: sprint.startDate, endDate: sprint.endDate, committedPoints },
    issues.map((issue) => ({ storyPoints: issue.storyPoints, completedAt: issue.status === "done" ? issue.completedAt : null })),
  );

  return c.json({ data: points }, 200);
});

sprintsRoute.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const sprint = await findSprint(c.req.param("id"), workspaceId);

  if (!sprint) {
    return c.json({ error: "Sprint not found" }, 404);
  }

  if (sprint.status === "active") {
    return c.json({ error: "Complete the sprint before deleting it" }, 409);
  }

  // Issues fall back to the backlog via ON DELETE SET NULL.
  await db.delete(sprints).where(eq(sprints.id, sprint.id));
  return c.body(null, 204);
});

export default sprintsRoute;
