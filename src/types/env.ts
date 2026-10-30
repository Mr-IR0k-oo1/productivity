import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "production") {
  // Mirror Next.js local precedence for API/server runtime.
  loadDotEnv({ path: ".env.local", override: false });
  loadDotEnv({ path: ".env", override: false });
}

function resolveAppUrl() {
  const appUrl = process.env.APP_URL?.trim() || "";
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

  const isLocalhostUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
    } catch {
      return false;
    }
  };

  if (appUrl && publicAppUrl) {
    if (isLocalhostUrl(appUrl) && !isLocalhostUrl(publicAppUrl)) {
      return publicAppUrl;
    }

    return appUrl;
  }

  return publicAppUrl || appUrl || "http://localhost:3000";
}

function normalizeDatabaseUrl(value: string) {
  return value.trim();
}

const postgresUrlSchema = z
  .string()
  .min(1, "DATABASE_URL is required")
  .transform(normalizeDatabaseUrl)
  .refine((value) => !/^database_url=/i.test(value), "DATABASE_URL must be value-only (remove the DATABASE_URL= prefix)")
  .refine(
    (value) =>
      !(
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ),
    "DATABASE_URL must not be wrapped in quotes",
  )
  .refine((value) => {
    try {
      const parsed = new URL(value.replace(/^postgresql:\/\//, "postgres://"));
      return (parsed.protocol === "postgres:" || parsed.protocol === "postgresql:") && Boolean(parsed.username) && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }, "DATABASE_URL must be a valid postgres connection URL (check quotes and URL-encoding)");

const envSchema = z.object({
  // Optional: when unset, Orbit uses the embedded local database (see src/lib/local-mode.ts).
  DATABASE_URL: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), postgresUrlSchema.optional()),
  APP_URL: z.string().default(resolveAppUrl()),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_URL: process.env.APP_URL,
});
