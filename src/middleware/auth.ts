import { createMiddleware } from "hono/factory";

import type { AuthBindings } from "@/src/types/bindings";

export const authMiddleware = createMiddleware<AuthBindings>(async (c, next) => {
  const authUserIdFromHeader = c.req.header("x-auth-user-id")?.trim();
  const headerToken = c.req.header("authorization")?.replace("Bearer ", "").trim();

  if (!authUserIdFromHeader) {
    return c.json({ error: "x-auth-user-id header is required" }, 401);
  }

  c.set("authUserId", authUserIdFromHeader);
  c.set("authToken", headerToken ?? "");
  await next();
});
