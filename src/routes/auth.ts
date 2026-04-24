import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authMiddleware } from "@/src/middleware/auth";
import { authRateLimiter } from "@/src/middleware/rateLimiter";
import { ensureOAuthUserWorkspace, loginWithPassword, signUpWithWorkspace } from "@/src/controllers/auth-controller";
import type { AuthBindings } from "@/src/types/bindings";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { supabaseAdmin, supabaseAnon } from "@/src/lib/supabase";
import { env } from "@/src/types/env";
import { setCookie } from "hono/cookie";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  workspaceName: z.string().min(2),
  jobTitle: z
    .string()
    .min(2)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional().default(true),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const magicLinkSchema = z.object({
  email: z.string().email(),
});

const oauthBootstrapSchema = z.object({
  session: z
    .object({
      access_token: z.string().min(1),
      refresh_token: z.string().min(1).optional(),
      token_type: z.string().optional(),
      expires_in: z.number().int().optional(),
      expires_at: z.number().int().optional(),
      provider_token: z.string().nullable().optional(),
      provider_refresh_token: z.string().nullable().optional(),
    })
    .optional(),
});

function resolveOAuthEmail(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null;
}) {
  const directEmail = user.email?.trim();

  if (directEmail) {
    return directEmail;
  }

  const metadataEmail = typeof user.user_metadata?.email === "string" ? user.user_metadata.email.trim() : "";

  if (metadataEmail) {
    return metadataEmail;
  }

  const identityEmail = user.identities
    ?.map((identity) => (typeof identity.identity_data?.email === "string" ? identity.identity_data.email.trim() : ""))
    .find((value) => Boolean(value));

  return identityEmail || null;
}

function getRegisterErrorStatus(message: string) {
  if (message.includes("already exists") || message.includes("already registered")) {
    return 409;
  }

  return 400;
}

const auth = new Hono<AuthBindings>();

auth.post("/signup", authRateLimiter, zValidator("json", signupSchema), async (c) => {
  const payload = c.req.valid("json");
  try {
    const result = await signUpWithWorkspace(payload);

    if (result.session) {
      setCookie(c, AUTH_COOKIE_NAME, JSON.stringify(result.session), {
        path: "/",
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return c.json({ data: result }, 201);
  } catch (error) {
    const message = (error as Error).message;
    return c.json({ error: message }, getRegisterErrorStatus(message));
  }
});

auth.post("/login", authRateLimiter, zValidator("json", loginSchema), async (c) => {
  const payload = c.req.valid("json");

  try {
    const result = await loginWithPassword(payload.email, payload.password);

    setCookie(c, AUTH_COOKIE_NAME, JSON.stringify(result.session), {
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

auth.post("/register", authRateLimiter, zValidator("json", signupSchema), async (c) => {
  const payload = c.req.valid("json");
  try {
    const result = await signUpWithWorkspace(payload);

    if (result.session) {
      setCookie(c, AUTH_COOKIE_NAME, JSON.stringify(result.session), {
        path: "/",
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return c.json({ data: result }, 201);
  } catch (error) {
    const message = (error as Error).message;
    return c.json({ error: message }, getRegisterErrorStatus(message));
  }
});

auth.post("/oauth/bootstrap", authMiddleware, zValidator("json", oauthBootstrapSchema), async (c) => {
  const authUserId = c.get("authUserId");
  const authToken = c.get("authToken");
  const payload = c.req.valid("json");

  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(authUserId);

    if (error || !data.user) {
      return c.json({ error: "Unable to load OAuth user profile" }, 401);
    }

    const email = resolveOAuthEmail({
      email: data.user.email,
      user_metadata: data.user.user_metadata as Record<string, unknown> | null,
      identities: (data.user.identities ?? []) as Array<{ identity_data?: Record<string, unknown> | null }>,
    });

    if (!email) {
      return c.json(
        {
          error:
            "OAuth account did not provide an email address. For GitHub, enable an email in GitHub Settings > Emails and retry.",
        },
        400,
      );
    }

    const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName =
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.name === "string"
          ? metadata.name
          : null;
    const preferredWorkspaceName = typeof metadata.workspace_name === "string" ? metadata.workspace_name : null;

    const result = await ensureOAuthUserWorkspace({
      authUserId,
      email,
      fullName,
      workspaceName: preferredWorkspaceName,
    });

    const sessionForCookie =
      payload.session && payload.session.access_token === authToken
        ? payload.session
        : {
            access_token: authToken,
          };

    setCookie(c, AUTH_COOKIE_NAME, JSON.stringify(sessionForCookie), {
      path: "/",
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });

    return c.json({ data: result }, 200);
  } catch (error) {
    const message = (error as Error).message;
    return c.json({ error: message }, getRegisterErrorStatus(message));
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

auth.post("/magic-link", zValidator("json", magicLinkSchema), async (c) => {
  const payload = c.req.valid("json");

  try {
    const redirectTo = `${env.APP_URL.replace(/\/$/, "")}/auth/callback`;
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email: payload.email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return c.json({ success: true, message: "If an account exists, a magic link has been sent." }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

auth.post("/logout", async (c) => {
  setCookie(c, AUTH_COOKIE_NAME, "", {
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
