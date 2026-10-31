import { Hono } from "hono";

import { authMiddleware } from "@/src/middleware/auth";
import type { AuthBindings } from "@/src/types/bindings";

// There is no login: every request runs as the local user. The UI asks for the
// session only to learn that user's id.
const auth = new Hono<AuthBindings>();

auth.get("/session", authMiddleware, async (c) => {
  return c.json({ data: { authUserId: c.get("authUserId") } }, 200);
});

export default auth;
