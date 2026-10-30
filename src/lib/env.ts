import { z } from "zod";

import { isLocalMode, isLoginEnabled } from "@/src/lib/local-mode";

const envSchema = z
  .object({
    APP_URL: z.string().url("APP_URL must be a valid URL").optional().default("http://localhost:3000"),
    DATABASE_URL: z.string().optional(),
    BETTER_AUTH_SECRET: z
      .string()
      .optional()
      .refine((value) => !value || value.trim().length >= 32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    ORBIT_DISABLE_AUTH: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    // An external database may be shared by several people, so it needs real accounts.
    if (value.DATABASE_URL?.trim() && !value.BETTER_AUTH_SECRET?.trim() && value.ORBIT_DISABLE_AUTH !== "true") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["BETTER_AUTH_SECRET"],
        message: "Set BETTER_AUTH_SECRET to enable login when using an external DATABASE_URL (or ORBIT_DISABLE_AUTH=true for a private database)",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ✗ ${i.path.join(".")}: ${i.message}`)
      .join("\n");

    console.error("\n[Orbit] ❌ Environment validation failed:\n" + issues + "\n");
    console.error("[Orbit] Fix the above variables in .env.local and restart.\n");
    process.exit(1);
  }

  if (process.env.NODE_ENV !== "test") {
    const database = isLocalMode() ? "local database" : "external database";
    const login = isLoginEnabled() ? "login on" : "single-user, no login";
    console.log(`[Orbit] ✅ Environment validated (${database}, ${login})`);
  }

  return result.data;
}
