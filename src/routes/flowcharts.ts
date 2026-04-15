import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { flowcharts } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const flowchartDataSchema = z.object({
  nodes: z.array(z.record(z.unknown())).default([]),
  edges: z.array(z.record(z.unknown())).default([]),
});

const createFlowchartSchema = z.object({
  name: z.string().min(1).max(200),
  data: flowchartDataSchema.optional(),
});

const updateFlowchartSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    data: flowchartDataSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const flowchartsRoute = new Hono<WorkspaceBindings>();

flowchartsRoute.use("*", authMiddleware, workspaceMiddleware);

flowchartsRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const rows = await db
    .select()
    .from(flowcharts)
    .where(eq(flowcharts.workspaceId, workspaceId))
    .orderBy(flowcharts.updatedAt);
  return c.json({ data: rows }, 200);
});

flowchartsRoute.post("/", zValidator("json", createFlowchartSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(flowcharts)
    .values({
      workspaceId,
      creatorId: userId,
      name: payload.name,
      data: payload.data ?? { nodes: [], edges: [] },
    })
    .returning();

  return c.json({ data: created }, 201);
});

flowchartsRoute.get("/:id", async (c) => {
  const flowchartId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  const [flowchart] = await db
    .select()
    .from(flowcharts)
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .limit(1);

  if (!flowchart) {
    return c.json({ error: "Flowchart not found" }, 404);
  }

  return c.json({ data: flowchart }, 200);
});

flowchartsRoute.patch("/:id", zValidator("json", updateFlowchartSchema), async (c) => {
  const flowchartId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [updated] = await db
    .update(flowcharts)
    .set({
      ...(payload.name && { name: payload.name }),
      ...(payload.data && { data: payload.data }),
      updatedAt: new Date(),
    })
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    return c.json({ error: "Flowchart not found" }, 404);
  }

  return c.json({ data: updated }, 200);
});

flowchartsRoute.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const flowchartId = c.req.param("id");

  const [deleted] = await db
    .delete(flowcharts)
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .returning({ id: flowcharts.id });

  if (!deleted) {
    return c.json({ error: "Flowchart not found" }, 404);
  }

  return c.body(null, 204);
});

export default flowchartsRoute;
