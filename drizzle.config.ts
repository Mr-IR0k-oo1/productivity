import { defineConfig } from "drizzle-kit";

// Migrations are applied automatically at API startup (see src/db/index.ts).
// `db:push` is only needed when pointing DATABASE_URL at an external Postgres.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(process.env.DATABASE_URL ? { dbCredentials: { url: process.env.DATABASE_URL } } : {}),
});
