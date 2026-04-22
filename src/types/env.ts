import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "production") {
  // Mirror Next.js local precedence for API/server runtime.
  loadDotEnv({ path: ".env.local", override: false });
  loadDotEnv({ path: ".env", override: false });
}

function normalizeDatabaseUrl(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

const postgresUrlSchema = z
  .string()
  .min(1, "DATABASE_URL is required")
  .transform(normalizeDatabaseUrl)
  .refine((value) => {
    try {
      new URL(value.replace(/^postgresql:\/\//, "postgres://"));
      return true;
    } catch {
      return false;
    }
  }, "DATABASE_URL must be a valid postgres connection URL (check quotes and URL-encoding)");

const envSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  APP_URL: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().default("http://localhost:54321"),
  SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_URL: process.env.APP_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});
