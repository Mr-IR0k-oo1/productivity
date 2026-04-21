import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { supabaseAdmin } from "@/src/lib/supabase";
import type { AuthBindings } from "@/src/types/bindings";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

const isAuthBypassEnabled =
  process.env.ORBIT_DISABLE_AUTH === "true" || process.env.NEXT_PUBLIC_ORBIT_DISABLE_AUTH === "true";
let cachedBypassAuthUserId: string | null = null;

function readCookieSessionToken(cookieValue: string | undefined) {
  if (!cookieValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(cookieValue) as { access_token?: string } | null;
    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

async function resolveBypassAuthUserId() {
  if (cachedBypassAuthUserId) {
    return cachedBypassAuthUserId;
  }

  const [user] = await db
    .select({ authUserId: users.authUserId })
    .from(users)
    .limit(1);

  cachedBypassAuthUserId = user?.authUserId ?? null;
  return cachedBypassAuthUserId;
}

export const authMiddleware = createMiddleware<AuthBindings>(async (c, next) => {
  const headerToken = c.req.header("authorization")?.replace("Bearer ", "").trim();
  const cookieToken = readCookieSessionToken(getCookie(c, AUTH_COOKIE_NAME));
  const token = headerToken || cookieToken;

  if (isAuthBypassEnabled) {
    const headerAuthUserId = c.req.header("x-dev-auth-user-id")?.trim();
    const fallbackAuthUserId = await resolveBypassAuthUserId();
    const authUserId = headerAuthUserId || fallbackAuthUserId;

    if (!authUserId) {
      return c.json(
        {
          error: "Auth bypass is enabled but no users exist in public.users. Create at least one user first.",
        },
        500,
      );
    }

    c.set("authUserId", authUserId);
    c.set("authToken", token || "dev-auth-bypass");
    await next();
    return;
  }

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ error: "Invalid auth token" }, 401);
  }

  c.set("authUserId", data.user.id);
  c.set("authToken", token);
  await next();
});
