import { and, desc, eq, isNull } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { apiKeys, users } from "@/src/db/schema";
import { generateApiKey } from "@/src/lib/api-keys";
import { can, canCreateApiKeyScope, canManageApiKey } from "@/src/lib/permissions";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const MAX_ACTIVE_KEYS_PER_USER = 25;

const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  scope: z.enum(["read", "write"]).default("read"),
  /** Days until the key stops working; null for no expiry. */
  expiresInDays: z.union([z.literal(30), z.literal(90), z.literal(365), z.null()]).default(90),
});

const apiKeysRoute = new Hono<WorkspaceBindings>();

// API keys can't reach these routes (see isPathBlockedForApiKeys), so only signed-in people manage keys.
apiKeysRoute.use("*", authMiddleware, workspaceMiddleware);

const publicColumns = {
  id: apiKeys.id,
  name: apiKeys.name,
  prefix: apiKeys.prefix,
  scope: apiKeys.scope,
  userId: apiKeys.userId,
  ownerName: users.fullName,
  ownerEmail: users.email,
  lastUsedAt: apiKeys.lastUsedAt,
  expiresAt: apiKeys.expiresAt,
  revokedAt: apiKeys.revokedAt,
  createdAt: apiKeys.createdAt,
};

// Your own keys; admins and owners see every key in the workspace.
apiKeysRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const seeAll = can(c.get("workspaceRole"), "manageMembers");

  const rows = await db
    .select(publicColumns)
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(seeAll ? eq(apiKeys.workspaceId, workspaceId) : and(eq(apiKeys.workspaceId, workspaceId), eq(apiKeys.userId, userId)))
    .orderBy(desc(apiKeys.createdAt));

  return c.json({ data: rows }, 200);
});

apiKeysRoute.post("/", zValidator("json", createApiKeySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  if (!canCreateApiKeyScope(c.get("workspaceRole"), payload.scope)) {
    return c.json({ error: "Your role can only create read-only keys" }, 403);
  }

  const active = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.workspaceId, workspaceId), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));
  if (active.length >= MAX_ACTIVE_KEYS_PER_USER) {
    return c.json({ error: `You can have up to ${MAX_ACTIVE_KEYS_PER_USER} active keys. Revoke one first.` }, 409);
  }

  const { key, hash, prefix } = generateApiKey();
  const expiresAt = payload.expiresInDays ? new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000) : null;

  const [created] = await db
    .insert(apiKeys)
    .values({ workspaceId, userId, name: payload.name, scope: payload.scope, prefix, keyHash: hash, expiresAt })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scope: apiKeys.scope,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    });

  // The only time the full key leaves the server.
  return c.json({ data: created, key }, 201);
});

apiKeysRoute.post("/:id/revoke", async (c) => {
  const workspaceId = c.get("workspaceId");
  const keyId = c.req.param("id");

  if (!z.string().uuid().safeParse(keyId).success) {
    return c.json({ error: "API key not found" }, 404);
  }

  const [key] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.workspaceId, workspaceId)))
    .limit(1);

  if (!key || !canManageApiKey(c.get("workspaceRole"), key.userId, c.get("userId"))) {
    return c.json({ error: "API key not found" }, 404);
  }

  if (!key.revokedAt) {
    await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, key.id));
  }

  return c.body(null, 204);
});

export default apiKeysRoute;
