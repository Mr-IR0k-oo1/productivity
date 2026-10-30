import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import type { AuthBindings } from "@/src/types/bindings";

// Avatars are stored inline as small data URLs (the app has no file host), or as https links.
const MAX_AVATAR_LENGTH = 700_000;
const avatarSchema = z
  .string()
  .max(MAX_AVATAR_LENGTH, "Photo must be smaller than 500 KB")
  .refine(
    (value) => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) || /^https:\/\/\S+$/.test(value),
    "Photo must be a PNG, JPEG or WebP image",
  );

const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, "Name is required").max(120),
    jobTitle: z.string().trim().max(120).nullable(),
    avatarUrl: avatarSchema.nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" });

const profileColumns = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  jobTitle: users.jobTitle,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
};

const profileRoute = new Hono<AuthBindings>();

profileRoute.use("*", authMiddleware);

profileRoute.get("/", async (c) => {
  const [profile] = await db.select(profileColumns).from(users).where(eq(users.authUserId, c.get("authUserId"))).limit(1);

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json({ data: profile }, 200);
});

profileRoute.patch("/", zValidator("json", updateProfileSchema), async (c) => {
  const payload = c.req.valid("json");

  const [profile] = await db
    .update(users)
    .set({
      ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
      ...(payload.jobTitle !== undefined ? { jobTitle: payload.jobTitle || null } : {}),
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.authUserId, c.get("authUserId")))
    .returning(profileColumns);

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json({ data: profile }, 200);
});

export default profileRoute;
