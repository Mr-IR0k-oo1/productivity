import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { db } from "@/src/db";
import { users, workspaceMembers } from "@/src/db/schema";
import type { WorkspaceBindings } from "@/src/types/bindings";
import { isMethodAllowedForScope } from "@/src/lib/api-keys";
import { isWriteAllowedForRole } from "@/src/lib/permissions";

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

  // An API key is pinned to the workspace it was created in, and a read key can only read.
  const apiKey = c.get("apiKey");
  if (apiKey) {
    if (requestedWorkspaceId && requestedWorkspaceId !== apiKey.workspaceId) {
      return c.json({ error: "This API key belongs to a different workspace" }, 403);
    }
    if (!isMethodAllowedForScope(apiKey.scope, c.req.method)) {
      return c.json({ error: "This API key is read-only" }, 403);
    }

    const [keyMember] = await db
      .select({ role: workspaceMembers.role, isActive: workspaceMembers.isActive })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, apiKey.workspaceId), eq(workspaceMembers.userId, user.id)))
      .limit(1);

    // Leaving the workspace switches the key off, even before it is revoked.
    if (!keyMember || !keyMember.isActive) {
      return c.json({ error: "Workspace membership required" }, 403);
    }

    c.set("userId", user.id);
    c.set("workspaceId", apiKey.workspaceId);
    c.set("workspaceRole", keyMember.role);
    if (!isWriteAllowedForRole(keyMember.role, c.req.method, c.req.path)) {
      return c.json({ error: "You have read-only access to this workspace" }, 403);
    }
    await next();
    return;
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

  // Without a (usable) workspace header, fall back to the user's first workspace.
  if (!requestedWorkspaceId) {
    return resolveAndSetContext();
  }

  const [member] = await db
    .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role, isActive: workspaceMembers.isActive })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, requestedWorkspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);

  if (!member || !member.isActive) {
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
