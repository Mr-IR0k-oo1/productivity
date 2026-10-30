import { and, desc, eq, ilike, or } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { getIssueKeyPrefix } from "@/src/controllers/tasks-controller";
import { db } from "@/src/db";
import { flowcharts, ideas, tasks } from "@/src/db/schema";
import { formatIssueKey, parseIssueKey } from "@/src/lib/scrum";
import { toLikePattern } from "@/src/lib/search-pattern";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const RESULT_LIMIT = 8;

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});

const searchRoute = new Hono<WorkspaceBindings>();

searchRoute.use("*", authMiddleware, workspaceMiddleware);

searchRoute.get("/", zValidator("query", searchQuerySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const { q } = c.req.valid("query");
  const pattern = toLikePattern(q);
  const prefix = await getIssueKeyPrefix(workspaceId);
  const issueKey = parseIssueKey(q);

  const [issueRows, ideaRows, flowchartRows] = await Promise.all([
    db
      .select({ id: tasks.id, title: tasks.title, number: tasks.number, issueType: tasks.issueType, status: tasks.status })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          or(ilike(tasks.title, pattern), issueKey && issueKey.prefix === prefix ? eq(tasks.number, issueKey.number) : undefined),
        ),
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(RESULT_LIMIT),
    db
      .select({ id: ideas.id, title: ideas.title, status: ideas.status })
      .from(ideas)
      .where(and(eq(ideas.workspaceId, workspaceId), or(ilike(ideas.title, pattern), ilike(ideas.summary, pattern))))
      .orderBy(desc(ideas.updatedAt))
      .limit(RESULT_LIMIT),
    db
      .select({ id: flowcharts.id, title: flowcharts.title })
      .from(flowcharts)
      .where(and(eq(flowcharts.workspaceId, workspaceId), ilike(flowcharts.title, pattern)))
      .orderBy(desc(flowcharts.updatedAt))
      .limit(RESULT_LIMIT),
  ]);

  return c.json(
    {
      data: {
        issues: issueRows.map((row) => ({ ...row, key: formatIssueKey(prefix, row.number) })),
        ideas: ideaRows,
        flowcharts: flowchartRows,
      },
    },
    200,
  );
});

export default searchRoute;
