import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { db } from "@/src/db";
import { users, workspaceMembers } from "@/src/db/schema";
import type { WorkspaceBindings } from "@/src/types/bindings";

export const workspaceMiddleware = createMiddleware<WorkspaceBindings>(async (c, next) => {
  const authUserId = c.get("authUserId");
  const workspaceId = c.req.header("x-workspace-id");

  if (!authUserId || !workspaceId) {
    return c.json({ error: "Missing auth or workspace context" }, 400);
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const [member] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)),
    )
    .limit(1);

  if (!member) {
    return c.json({ error: "Workspace membership required" }, 403);
  }

  c.set("userId", user.id);
  c.set("workspaceId", workspaceId);
  await next();
});
