import { Hono } from "hono";

import { enabledProviders, identity, loginEnabled } from "@/src/lib/identity";
import { authMiddleware } from "@/src/middleware/auth";
import type { AuthBindings } from "@/src/types/bindings";

// Orbit-specific auth endpoints. Everything else under /api/auth/* (sign-in, sign-up,
// OAuth callbacks, sign-out) is handled by Better Auth in src/index.ts.
const auth = new Hono<AuthBindings>();

/** Lets the login page know whether login is on and which providers to show. */
auth.get("/config", (c) => c.json({ data: { loginEnabled, providers: enabledProviders } }, 200));

auth.get("/session", authMiddleware, async (c) => {
  return c.json({ data: { authUserId: c.get("authUserId") } }, 200);
});

auth.post("/logout", async (c) => {
  if (identity) {
    // Revokes the session and clears the cookie.
    return identity.handler(new Request(new URL("/api/auth/sign-out", c.req.url), {
      method: "POST",
      headers: c.req.raw.headers,
    }));
  }

  return c.json({ success: true }, 200);
});

export default auth;
