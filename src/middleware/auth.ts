import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

import { supabaseAdmin } from "@/src/lib/supabase";
import type { AuthBindings } from "@/src/types/bindings";
import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/session";

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

export const authMiddleware = createMiddleware<AuthBindings>(async (c, next) => {
  const headerToken = c.req.header("authorization")?.replace("Bearer ", "").trim();
  const cookieToken = readCookieSessionToken(getCookie(c, AUTH_SESSION_STORAGE_KEY));
  const token = headerToken || cookieToken;

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ error: "Invalid auth token" }, 401);
  }

  c.set("authUserId", data.user.id);
  await next();
});
