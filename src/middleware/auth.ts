import { createMiddleware } from "hono/factory";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import type { AuthBindings } from "@/src/types/bindings";

function readJwtSubject(token: string | undefined) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const decodedPayload = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed = JSON.parse(decodedPayload) as { sub?: string } | null;

    return typeof parsed?.sub === "string" ? parsed.sub : null;
  } catch {
    return null;
  }
}

export const authMiddleware = createMiddleware<AuthBindings>(async (c, next) => {
  const authUserIdFromHeader = c.req.header("x-auth-user-id")?.trim();
  const headerToken = c.req.header("authorization")?.replace("Bearer ", "").trim();
  const authUserIdFromToken = readJwtSubject(headerToken);
  let authUserId = authUserIdFromHeader || authUserIdFromToken;

  if (!authUserId) {
    const [defaultUser] = await db.select({ authUserId: users.authUserId }).from(users).limit(1);
    authUserId = defaultUser?.authUserId ?? null;

    if (!authUserId) {
      return c.json({ error: "User not found" }, 404);
    }
  }

  c.set("authUserId", authUserId);
  c.set("authToken", headerToken ?? "");
  await next();
});
