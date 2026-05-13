import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Hono } from "hono";
import { sql } from "drizzle-orm";

// Validate environment variables on startup
import { validateEnv } from "@/src/lib/env";
validateEnv();

import workspaceRoute from "@/src/routes/workspace";
import authRoute from "@/src/routes/auth";
import settingsRoute from "@/src/routes/settings";
import ideasRoute from "@/src/routes/ideas";
import tasksRoute from "@/src/routes/tasks";
import calendarRoute from "@/src/routes/calendar";
import timeRoute from "@/src/routes/time";
import reportsRoute from "@/src/routes/reports";
import projectsRoute from "@/src/routes/projects";
import tagsRoute from "@/src/routes/tags";
import subtasksRoute from "@/src/routes/subtasks";
import commentsRoute from "@/src/routes/comments";
import attachmentsRoute from "@/src/routes/attachments";
import { healthRouter, structuredLogger } from "@/src/routes/health";
import { db } from "@/src/db";

const app = new Hono();

app.use("*", cors());
app.use("*", structuredLogger);

// Global error handler
app.onError((error, c) => {
  console.error("[Orbit API Error]", error);

  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }

  // Zod validation errors from @hono/zod-validator
  if (error.name === "ZodError") {
    return c.json(
      { error: "Validation failed", details: JSON.parse(error.message) },
      422,
    );
  }

  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.get("/", (c) => c.json({ ok: true, service: "Orbit API" }));

app.route("/api/health", healthRouter);
app.route("/api/auth", authRoute);
app.route("/api/workspace", workspaceRoute);
app.route("/api/settings", settingsRoute);
app.route("/api/ideas", ideasRoute);
app.route("/api/tasks", tasksRoute);
app.route("/api/calendar", calendarRoute);
app.route("/api/time", timeRoute);
app.route("/api/reports", reportsRoute);
app.route("/api/projects", projectsRoute);
app.route("/api/tags", tagsRoute);
app.route("/api/subtasks", subtasksRoute);
app.route("/api/comments", commentsRoute);
app.route("/api/attachments", attachmentsRoute);

export default app;

if (process.env.NODE_ENV !== "production") {
  serve(
    {
      fetch: app.fetch,
      port: 8787,
    },
    (info) => {
      console.log(`Orbit API running on http://localhost:${info.port}`);
    },
  );
}
