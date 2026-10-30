import { createMiddleware } from "hono/factory";

import { can, type Permission } from "@/src/lib/permissions";
import type { WorkspaceBindings } from "@/src/types/bindings";

/** Rejects requests whose workspace role lacks `permission`. Use after workspaceMiddleware. */
export function requirePermission(permission: Permission, options: { writesOnly?: boolean } = {}) {
  return createMiddleware<WorkspaceBindings>(async (c, next) => {
    const isRead = ["GET", "HEAD", "OPTIONS"].includes(c.req.method);

    if ((!options.writesOnly || !isRead) && !can(c.get("workspaceRole"), permission)) {
      return c.json({ error: "You don't have permission to do that in this workspace" }, 403);
    }

    await next();
  });
}
