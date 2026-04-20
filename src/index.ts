import "dotenv/config";

import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";

import authRoute from "@/src/routes/auth";
import workspaceRoute from "@/src/routes/workspace";
import settingsRoute from "@/src/routes/settings";
import ideasRoute from "@/src/routes/ideas";
import tasksRoute from "@/src/routes/tasks";
import flowchartsRoute from "@/src/routes/flowcharts";
import calendarRoute from "@/src/routes/calendar";
import timeRoute from "@/src/routes/time";
import reportsRoute from "@/src/routes/reports";

const app = new Hono();

app.use("*", cors());

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.get("/", (c) => c.json({ ok: true, service: "Orbit API" }));
app.get("/health", (c) => c.json({ ok: true }));

app.route("/api/auth", authRoute);
app.route("/api/workspace", workspaceRoute);
app.route("/api/settings", settingsRoute);
app.route("/api/ideas", ideasRoute);
app.route("/api/tasks", tasksRoute);
app.route("/api/flowcharts", flowchartsRoute);
app.route("/api/calendar", calendarRoute);
app.route("/api/time", timeRoute);
app.route("/api/reports", reportsRoute);

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
