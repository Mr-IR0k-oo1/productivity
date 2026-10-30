import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { db } from "@/src/db";
import { users, workspaceMembers } from "@/src/db/schema";
import type { WorkspaceBindings } from "@/src/types/bindings";
import { isAuthBypassEnabled as resolveAuthBypass } from "@/src/lib/local-mode";
import { isWriteAllowedForRole } from "@/src/lib/permissions";

const isAuthBypassEnabled = resolveAuthBypass();

async function resolveFirstActiveMembership(userId: string) {
  const [member] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.isActive, true)))
    .limit(1);

  return member ?? null;
}

export const workspaceMiddleware = createMiddleware<WorkspaceBindings>(async (c, next) => {
  const authUserId = c.get("authUserId");
  const requestedWorkspaceId = c.req.header("x-workspace-id")?.trim() ?? "";

  if (!authUserId) {
    return c.json({ error: "Missing auth context" }, 400);
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const resolveAndSetContext = async () => {
    const fallbackMembership = await resolveFirstActiveMembership(user.id);

    if (!fallbackMembership) {
      return c.json({ error: "Workspace membership required" }, 403);
    }

    c.set("userId", user.id);
    c.set("workspaceId", fallbackMembership.workspaceId);
    c.set("workspaceRole", fallbackMembership.role);
    if (!isWriteAllowedForRole(c.get("workspaceRole"), c.req.method, c.req.path)) {
      return c.json({ error: "You have read-only access to this workspace" }, 403);
    }
    await next();
  };

  if (!requestedWorkspaceId) {
    if (!isAuthBypassEnabled) {
      return c.json({ error: "Missing workspace context" }, 400);
    }

    return resolveAndSetContext();
  }

  const [member] = await db
    .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role, isActive: workspaceMembers.isActive })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, requestedWorkspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);

  if (!member || !member.isActive) {
    if (!isAuthBypassEnabled) {
      return c.json({ error: "Workspace membership required" }, 403);
    }

    return resolveAndSetContext();
  }

  c.set("userId", user.id);
  c.set("workspaceId", requestedWorkspaceId);
  c.set("workspaceRole", member.role);
  if (!isWriteAllowedForRole(c.get("workspaceRole"), c.req.method, c.req.path)) {
    return c.json({ error: "You have read-only access to this workspace" }, 403);
  }
  await next();
});
