import { z } from "zod";

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(10, "SUPABASE_ANON_KEY is missing or too short"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "SUPABASE_SERVICE_ROLE_KEY is missing or too short"),
  DATABASE_URL: z.string().min(10, "DATABASE_URL is missing"),

  // App
  APP_URL: z.string().url("APP_URL must be a valid URL")
    .optional()
    .default("http://localhost:3000"),

  // Auth bypass — must be false in production
  ORBIT_DISABLE_AUTH: z.string()
    .optional()
    .default("false")
    .refine(
      (v) => {
        // If running in production (Vercel sets NODE_ENV=production),
        // this MUST be false or missing.
        if (process.env.NODE_ENV === "production" && v === "true") return false;
        return true;
      },
      { message: "ORBIT_DISABLE_AUTH must not be 'true' in production" }
    ),
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
    console.log("[Orbit] ✅ Environment validated");
  }

  return result.data;
}
