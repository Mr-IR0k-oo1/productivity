import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { identity } from "@/src/lib/identity";
import { LOCAL_AUTH_USER_ID } from "@/src/lib/local-mode";
import type { AuthBindings } from "@/src/types/bindings";

let cachedBypassAuthUserId: string | null = null;

/** Single-user mode: the built-in local user, or the first user of an existing database. */
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
  if (!identity) {
    const authUserId = await resolveBypassAuthUserId();

    if (!authUserId) {
      return c.json({ error: "No local user exists yet. Restart the API to create one." }, 500);
    }

    c.set("authUserId", authUserId);
    c.set("authToken", "local");
    await next();
    return;
  }

  // Better Auth reads its session cookie from the request headers.
  const session = await identity.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("authUserId", session.user.id);
  c.set("authToken", session.session.token);
  await next();
});
