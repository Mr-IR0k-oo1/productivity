import { count, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/src/db";
import { ideas, tasks, timeEntries } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const reportsRoute = new Hono<WorkspaceBindings>();
reportsRoute.use("*", authMiddleware, workspaceMiddleware);

reportsRoute.get("/stats", async (c) => {
  const workspaceId = c.get("workspaceId");

  const [taskCount] = await db
    .select({ value: count() })
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId));

  const [ideaCount] = await db
    .select({ value: count() })
    .from(ideas)
    .where(eq(ideas.workspaceId, workspaceId));

  const [hours] = await db
    .select({
      value: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0) / 60`,
    })
    .from(timeEntries)
    .where(eq(timeEntries.workspaceId, workspaceId));

  return c.json(
    {
      data: {
        totalTasks: taskCount?.value ?? 0,
        activeIdeas: ideaCount?.value ?? 0,
        hoursTracked: Number(hours?.value ?? 0),
      },
    },
    200,
  );
});

export default reportsRoute;
