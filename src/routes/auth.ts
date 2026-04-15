import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authMiddleware } from "@/src/middleware/auth";
import { loginWithPassword, signUpWithWorkspace } from "@/src/controllers/auth-controller";
import type { AuthBindings } from "@/src/types/bindings";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/session";
import { supabaseAnon } from "@/src/lib/supabase";
import { env } from "@/src/types/env";
import { setCookie } from "hono/cookie";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  workspaceName: z.string().min(2),
  jobTitle: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional().default(true),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const auth = new Hono<AuthBindings>();

auth.post("/signup", zValidator("json", signupSchema), async (c) => {
  const payload = c.req.valid("json");
  try {
    const result = await signUpWithWorkspace(payload);

    if (result.session) {
      setCookie(c, AUTH_SESSION_STORAGE_KEY, JSON.stringify(result.session), {
        path: "/",
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return c.json({ data: result }, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const payload = c.req.valid("json");

  try {
    const result = await loginWithPassword(payload.email, payload.password);

    setCookie(c, AUTH_SESSION_STORAGE_KEY, JSON.stringify(result.session), {
      path: "/",
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: payload.rememberMe ? AUTH_COOKIE_MAX_AGE_SECONDS : undefined,
    });

    return c.json({ data: result }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 401);
  }
});

auth.post("/register", zValidator("json", signupSchema), async (c) => {
  const payload = c.req.valid("json");
  try {
    const result = await signUpWithWorkspace(payload);

    if (result.session) {
      setCookie(c, AUTH_SESSION_STORAGE_KEY, JSON.stringify(result.session), {
        path: "/",
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return c.json({ data: result }, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

auth.post("/reset-password", zValidator("json", resetPasswordSchema), async (c) => {
  const payload = c.req.valid("json");

  try {
    const redirectTo = `${env.APP_URL.replace(/\/$/, "")}/auth/update-password`;
    const { error } = await supabaseAnon.auth.resetPasswordForEmail(payload.email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }

    return c.json({ success: true, message: "If an account exists, a reset link has been sent." }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

auth.post("/logout", async (c) => {
  setCookie(c, AUTH_SESSION_STORAGE_KEY, "", {
    path: "/",
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

auth.get("/session", authMiddleware, async (c) => {
  return c.json({ data: { authUserId: c.get("authUserId") } }, 200);
});

export default auth;
