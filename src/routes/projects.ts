import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { projects } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { requirePermission } from "@/src/middleware/permissions";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const createProjectSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "archived"]).default("active"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const updateProjectSchema = z
  .object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(["active", "completed", "archived"]).optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const projectsRoute = new Hono<WorkspaceBindings>();

projectsRoute.use("*", authMiddleware, workspaceMiddleware);

projectsRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));

  return c.json({ data: rows }, 200);
});

projectsRoute.post("/", requirePermission("manageProjects"), zValidator("json", createProjectSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: payload.name,
      description: payload.description,
      status: payload.status,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      endDate: payload.endDate ? new Date(payload.endDate) : null,
    })
    .returning();

  return c.json({ data: created }, 201);
});

projectsRoute.get("/:id", async (c) => {
  const projectId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .limit(1);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.json({ data: project }, 200);
});

projectsRoute.patch("/:id", requirePermission("manageProjects"), zValidator("json", updateProjectSchema), async (c) => {
  const projectId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [updated] = await db
    .update(projects)
    .set({
      name: payload.name,
      description: payload.description,
      status: payload.status,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.json({ data: updated }, 200);
});

projectsRoute.delete("/:id", requirePermission("manageProjects"), async (c) => {
  const projectId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .returning({ id: projects.id });

  if (!deleted) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.body(null, 204);
});

export default projectsRoute;
