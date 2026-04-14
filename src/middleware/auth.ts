import { createMiddleware } from "hono/factory";

import { supabaseAdmin } from "@/src/lib/supabase";
import type { AuthBindings } from "@/src/types/bindings";

export const authMiddleware = createMiddleware<AuthBindings>(async (c, next) => {
  const token = c.req.header("authorization")?.replace("Bearer ", "").trim();

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
