import { z } from "zod";

import { isLocalMode } from "@/src/lib/local-mode";

const envSchema = z.object({
  APP_URL: z.string().url("APP_URL must be a valid URL").optional().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
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
    console.log(`[Orbit] ✅ Environment validated (${database}, single user)`);
  }

  return result.data;
}
