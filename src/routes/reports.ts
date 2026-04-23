import { and, count, eq, gte, lt, sql } from "drizzle-orm";
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

  // Task breakdown by status
  const taskBreakdown = await db
    .select({ status: tasks.status, count: count() })
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId))
    .groupBy(tasks.status);

  // Ideas breakdown by status
  const ideaBreakdown = await db
    .select({ status: ideas.status, count: count() })
    .from(ideas)
    .where(eq(ideas.workspaceId, workspaceId))
    .groupBy(ideas.status);

  // Time tracked total
  const [totalHours] = await db
    .select({
      value: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0) / 60`,
    })
    .from(timeEntries)
    .where(eq(timeEntries.workspaceId, workspaceId));

  // Time tracked this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [weeklyHours] = await db
    .select({
      value: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0) / 60`,
    })
    .from(timeEntries)
    .where(and(eq(timeEntries.workspaceId, workspaceId), gte(timeEntries.startedAt, weekAgo)));

  // Completed tasks count
  const [completedTasksCount] = await db
    .select({ count: count() })
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.status, "done")));

  // Tasks due today
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const [dueTodayCount] = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),
        gte(tasks.dueDate, today),
        lt(tasks.dueDate, tomorrow),
      ),
    );

  // Overdue tasks
  const [overdueCount] = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),
        lt(tasks.dueDate, today),
        sql`${tasks.status} != 'done'`,
      ),
    );

  return c.json(
    {
      data: {
        totalTasks: taskBreakdown.reduce((sum, t) => sum + Number(t.count), 0),
        taskBreakdown: taskBreakdown.map((t) => ({ status: t.status, count: Number(t.count) })),
        totalIdeas: ideaBreakdown.reduce((sum, i) => sum + Number(i.count), 0),
        ideaBreakdown: ideaBreakdown.map((i) => ({ status: i.status, count: Number(i.count) })),
        completedTasks: Number(completedTasksCount?.count ?? 0),
        hoursTrackedTotal: Number(totalHours?.value ?? 0),
        hoursTrackedThisWeek: Number(weeklyHours?.value ?? 0),
        tasksDueToday: Number(dueTodayCount?.count ?? 0),
        overdueTasks: Number(overdueCount?.count ?? 0),
      },
    },
    200,
  );
});

export default reportsRoute;
