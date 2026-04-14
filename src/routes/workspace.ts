import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { users, workspaceMembers, workspaces } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import type { AuthBindings } from "@/src/types/bindings";

const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

const workspace = new Hono<AuthBindings>();

workspace.use("*", authMiddleware);

workspace.get("/", async (c) => {
  const authUserId = c.get("authUserId");
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const memberships = await db
    .select({ workspace: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, user.id));

  return c.json({ data: memberships.map((m) => m.workspace) }, 200);
});

workspace.post("/", zValidator("json", createWorkspaceSchema), async (c) => {
  const authUserId = c.get("authUserId");
  const payload = c.req.valid("json");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const [created] = await db
    .insert(workspaces)
    .values({
      ownerId: user.id,
      name: payload.name,
      slug: payload.slug,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    userId: user.id,
    workspaceId: created.id,
    role: "owner",
  });

  return c.json({ data: created }, 201);
});

workspace.post("/switch/:id", async (c) => {
  const authUserId = c.get("authUserId");
  const workspaceId = c.req.param("id");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);

  if (!member) return c.json({ error: "No access to workspace" }, 403);

  return c.json({ data: { workspaceId } }, 200);
});

export default workspace;
