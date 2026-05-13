import { Hono } from "hono";
import { eq, and, sql, count, sum } from "drizzle-orm";
import { db } from "../db";
import { tasks, timeEntries, ideas, workspaceMembers, users, projects } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceMiddleware } from "../middleware/workspace";

const reportsRoute = new Hono();

reportsRoute.get("/", authMiddleware, workspaceMiddleware, async (c) => {
  const wsId = c.get("workspaceId");
  const { from, to } = c.req.query();

  // Default to last 30 days if not provided
  const fromDate = from ?? new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const toDate   = to   ?? new Date().toISOString().slice(0, 10);
  const timeEntryDateRange = and(
    eq(timeEntries.workspaceId, wsId),
    sql`DATE(${timeEntries.startedAt}) >= ${fromDate}`,
    sql`DATE(${timeEntries.startedAt}) <= ${toDate}`
  );

  // ── 1. Summary stats ───────────────────────────────────────────────────────

  const [{ tasksCompleted }] = await db
    .select({ tasksCompleted: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, wsId),
        eq(tasks.status, "done"),
        sql`DATE(${tasks.updatedAt}) >= ${fromDate}`,
        sql`DATE(${tasks.updatedAt}) <= ${toDate}`
      )
    );

  const [{ totalTimeMinutes }] = await db
    .select({ totalTimeMinutes: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0)` })
    .from(timeEntries)
    .where(timeEntryDateRange);

  // Active members = members who logged at least one time entry in the period
  const activeMembersRows = await db
    .selectDistinct({ userId: timeEntries.userId })
    .from(timeEntries)
    .where(timeEntryDateRange);

  const [{ ideasConverted }] = await db
    .select({ ideasConverted: count() })
    .from(ideas)
    .where(
      and(
        eq(ideas.workspaceId, wsId),
        eq(ideas.status, "converted"),
        sql`DATE(${ideas.updatedAt}) >= ${fromDate}`,
        sql`DATE(${ideas.updatedAt}) <= ${toDate}`
      )
    );

  // ── 2. Tasks by day ────────────────────────────────────────────────────────

  const createdByDay = await db
    .select({
      date: sql<string>`DATE(${tasks.createdAt})`,
      created: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, wsId),
        sql`DATE(${tasks.createdAt}) >= ${fromDate}`,
        sql`DATE(${tasks.createdAt}) <= ${toDate}`
      )
    )
    .groupBy(sql`DATE(${tasks.createdAt})`);

  const completedByDay = await db
    .select({
      date: sql<string>`DATE(${tasks.updatedAt})`,
      completed: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, wsId),
        eq(tasks.status, "done"),
        sql`DATE(${tasks.updatedAt}) >= ${fromDate}`,
        sql`DATE(${tasks.updatedAt}) <= ${toDate}`
      )
    )
    .groupBy(sql`DATE(${tasks.updatedAt})`);

  // Merge into unified array indexed by date
  const dateMap: Record<string, { date: string; created: number; completed: number }> = {};
  createdByDay.forEach(({ date, created }) => {
    if (!dateMap[date]) dateMap[date] = { date, created: 0, completed: 0 };
    dateMap[date].created = created;
  });
  completedByDay.forEach(({ date, completed }) => {
    if (!dateMap[date]) dateMap[date] = { date, created: 0, completed: 0 };
    dateMap[date].completed = completed;
  });
  const tasksByDay = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  // ── 3. Time by project ─────────────────────────────────────────────────────

  const timeByProjectRows = await db
    .select({
      projectId: tasks.projectId,
      projectName: projects.name,
      minutes: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0)`,
    })
    .from(timeEntries)
    .leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(timeEntryDateRange)
    .groupBy(tasks.projectId, projects.name)
    .orderBy(sql`SUM(${timeEntries.durationMinutes}) DESC`)
    .limit(8);

  const timeByProject = timeByProjectRows.map((r) => ({
    name:    r.projectName ?? "Unlinked",
    minutes: Number(r.minutes),
    color:   "#6b7280",
  }));

  // ── 4. Velocity by week ────────────────────────────────────────────────────

  const velocityRows = await db
    .select({
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${tasks.updatedAt}), 'Mon DD')`,
      velocity: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, wsId),
        eq(tasks.status, "done"),
        sql`DATE(${tasks.updatedAt}) >= ${fromDate}`,
        sql`DATE(${tasks.updatedAt}) <= ${toDate}`
      )
    )
    .groupBy(sql`DATE_TRUNC('week', ${tasks.updatedAt})`)
    .orderBy(sql`DATE_TRUNC('week', ${tasks.updatedAt})`);

  const velocityByWeek = velocityRows.map((r) => ({
    week: r.week,
    velocity: r.velocity,
  }));

  // ── 5. Workload by member ──────────────────────────────────────────────────

  const workloadRows = await db
    .select({
      userId: tasks.assigneeId,
      name: users.fullName,
      taskCount: count(tasks.id),
      timeMinutes: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0)`,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .leftJoin(
      timeEntries,
      and(
        eq(timeEntries.userId, tasks.assigneeId),
        sql`DATE(${timeEntries.startedAt}) >= ${fromDate}`,
        sql`DATE(${timeEntries.startedAt}) <= ${toDate}`
      )
    )
    .where(
      and(
        eq(tasks.workspaceId, wsId),
        sql`DATE(${tasks.createdAt}) >= ${fromDate}`,
        sql`DATE(${tasks.createdAt}) <= ${toDate}`
      )
    )
    .groupBy(tasks.assigneeId, users.fullName)
    .orderBy(sql`COUNT(${tasks.id}) DESC`)
    .limit(10);

  const workloadByMember = workloadRows.map((r) => ({
    name:        r.name ?? "Unassigned",
    taskCount:   r.taskCount,
    timeMinutes: Number(r.timeMinutes),
  }));

  return c.json({
    summary: {
      tasksCompleted: Number(tasksCompleted),
      totalTimeMinutes: Number(totalTimeMinutes),
      activeMembers: activeMembersRows.length,
      ideasConverted: Number(ideasConverted),
    },
    tasksByDay,
    timeByProject,
    velocityByWeek,
    workloadByMember,
  });
});

export default reportsRoute;
