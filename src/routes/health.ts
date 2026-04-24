import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db";

const healthRouter = new Hono();

// GET /api/health — basic liveness check
healthRouter.get("/", (c) =>
  c.json({ status: "ok", ts: new Date().toISOString() }, 200)
);

// GET /api/health/db — checks database connectivity
healthRouter.get("/db", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ status: "ok", db: "connected", ts: new Date().toISOString() }, 200);
  } catch (err) {
    console.error("[Health] DB check failed:", err);
    return c.json({ status: "error", db: "unreachable" }, 503);
  }
});

export { healthRouter };

// Structured request logger middleware
export const structuredLogger = async (c: any, next: any) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(
    JSON.stringify({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms,
      ts: new Date().toISOString(),
    })
  );
};
