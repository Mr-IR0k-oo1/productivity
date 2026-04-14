import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authMiddleware } from "@/src/middleware/auth";
import { loginWithPassword, signUpWithWorkspace } from "@/src/controllers/auth-controller";
import type { AuthBindings } from "@/src/types/bindings";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).optional(),
  workspaceName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const auth = new Hono<AuthBindings>();

auth.post("/signup", zValidator("json", signupSchema), async (c) => {
  const payload = c.req.valid("json");
  try {
    const result = await signUpWithWorkspace(payload);
    return c.json({ data: result }, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const payload = c.req.valid("json");

  try {
    const result = await loginWithPassword(payload.email, payload.password);
    return c.json({ data: result }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 401);
  }
});

auth.get("/session", authMiddleware, async (c) => {
  return c.json({ data: { authUserId: c.get("authUserId") } }, 200);
});

export default auth;
