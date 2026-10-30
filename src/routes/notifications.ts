import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/src/db";
import { notifications } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";

const notificationsRoute = new Hono<WorkspaceBindings>();

notificationsRoute.use("*", authMiddleware, workspaceMiddleware);

notificationsRoute.get("/", async (c) => {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, c.get("userId")), eq(notifications.workspaceId, c.get("workspaceId"))))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return c.json({ data: rows }, 200);
});

notificationsRoute.post("/read-all", async (c) => {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, c.get("userId")),
        eq(notifications.workspaceId, c.get("workspaceId")),
        eq(notifications.isRead, false),
      ),
    );

  return c.json({ success: true }, 200);
});

notificationsRoute.post("/:id/read", async (c) => {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, c.req.param("id")), eq(notifications.userId, c.get("userId"))))
    .returning({ id: notifications.id });

  if (!updated) {
    return c.json({ error: "Notification not found" }, 404);
  }

  return c.json({ success: true }, 200);
});

export default notificationsRoute;
