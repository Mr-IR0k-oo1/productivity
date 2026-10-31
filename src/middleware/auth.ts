import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { db } from "@/src/db";
import { apiKeys, users } from "@/src/db/schema";
import {
  apiKeyUnusableReason,
  hashApiKey,
  isPathBlockedForApiKeys,
  readApiKeyFromHeader,
  shouldRecordLastUsed,
} from "@/src/lib/api-keys";
import { LOCAL_AUTH_USER_ID } from "@/src/lib/local-mode";
import type { AuthBindings } from "@/src/types/bindings";

let cachedBypassAuthUserId: string | null = null;

/** The built-in local user, or the first user of an existing database. */
async function resolveBypassAuthUserId() {
  if (cachedBypassAuthUserId) {
    return cachedBypassAuthUserId;
  }

  const [local] = await db
    .select({ authUserId: users.authUserId })
    .from(users)
    .where(eq(users.authUserId, LOCAL_AUTH_USER_ID))
    .limit(1);
  const [first] = local ? [local] : await db.select({ authUserId: users.authUserId }).from(users).limit(1);

  cachedBypassAuthUserId = first?.authUserId ?? null;
  return cachedBypassAuthUserId;
}

export const authMiddleware = createMiddleware<AuthBindings>(async (c, next) => {
  // API keys (`Authorization: Bearer orb_…`) are checked first, in every mode.
  const rawKey = readApiKeyFromHeader(c.req.header("authorization"));
  if (rawKey) {
    if (isPathBlockedForApiKeys(c.req.path)) {
      return c.json({ error: "API keys can't be used for this endpoint" }, 403);
    }

    const [key] = await db
      .select({
        id: apiKeys.id,
        workspaceId: apiKeys.workspaceId,
        scope: apiKeys.scope,
        revokedAt: apiKeys.revokedAt,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        authUserId: users.authUserId,
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(eq(apiKeys.keyHash, hashApiKey(rawKey)))
      .limit(1);

    if (!key || !key.authUserId || apiKeyUnusableReason(key)) {
      return c.json({ error: "Invalid, expired or revoked API key" }, 401);
    }

    if (shouldRecordLastUsed(key.lastUsedAt)) {
      // Best effort: a failed timestamp write must not fail the request.
      void db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, key.id))
        .catch(() => undefined);
    }

    c.set("authUserId", key.authUserId);
    c.set("authToken", "api-key");
    c.set("apiKey", { id: key.id, workspaceId: key.workspaceId, scope: key.scope });
    await next();
    return;
  }

  // There is no login: every other request runs as the local user.
  const authUserId = await resolveBypassAuthUserId();

  if (!authUserId) {
    return c.json({ error: "No local user exists yet. Restart the API to create one." }, 500);
  }

  c.set("authUserId", authUserId);
  c.set("authToken", "local");
  await next();
});
