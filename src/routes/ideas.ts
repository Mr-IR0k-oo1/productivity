import { and, eq, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { ideaDependencies, ideaVotes, ideas, tasks } from "@/src/db/schema";
import { canDeleteOwned } from "@/src/lib/permissions";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";
import { taskStatusValues } from "@/types/task-status";

const ideaSchema = z.object({
  title: z.string().min(2),
  summary: z.string().optional(),
  content: z.string().optional(),
});

const updateIdeaSchema = z
  .object({
    title: z.string().min(2).optional(),
    summary: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    status: z.enum(["draft", "validated", "archived", "converted"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const ideaToTaskSchema = z.object({
  status: z.enum(taskStatusValues).default("todo"),
});

const ideasRoute = new Hono<WorkspaceBindings>();

ideasRoute.use("*", authMiddleware, workspaceMiddleware);

ideasRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const rows = await db.select().from(ideas).where(eq(ideas.workspaceId, workspaceId));
  return c.json({ data: rows }, 200);
});

ideasRoute.post("/", zValidator("json", ideaSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [created] = await db
    .insert(ideas)
    .values({
      workspaceId,
      authorId: userId,
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
    })
    .returning();

  return c.json({ data: created }, 201);
});

ideasRoute.get("/:id", async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  return c.json({ data: idea }, 200);
});

ideasRoute.patch("/:id", zValidator("json", updateIdeaSchema), async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [updated] = await db
    .update(ideas)
    .set({
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      status: payload.status,
      updatedAt: new Date(),
    })
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    return c.json({ error: "Idea not found" }, 404);
  }

  return c.json({ data: updated }, 200);
});

ideasRoute.delete("/:id", async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  const [existing] = await db
    .select({ authorId: ideas.authorId })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Idea not found" }, 404);
  }

  if (!canDeleteOwned(c.get("workspaceRole"), existing.authorId, c.get("userId"))) {
    return c.json({ error: "Only the author or an admin can delete this idea" }, 403);
  }

  await db.delete(ideas).where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)));

  return c.body(null, 204);
});

ideasRoute.post("/:id/convert", zValidator("json", ideaToTaskSchema), async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) return c.json({ error: "Idea not found" }, 404);

  if (idea.status === "converted" && idea.convertedTaskId) {
    return c.json({ error: "Idea already converted" }, 409);
  }

  const [task] = await db
    .insert(tasks)
    .values({
      workspaceId,
      creatorId: userId,
      title: idea.title,
      description: idea.content ?? idea.summary,
      status: payload.status,
      ideaId: idea.id,
    })
    .returning();

  await db
    .update(ideas)
    .set({ status: "converted", convertedTaskId: task.id, updatedAt: new Date() })
    .where(eq(ideas.id, idea.id));

  return c.json({ data: task }, 201);
});

ideasRoute.post("/:id/vote", async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [idea] = await db
    .select({ id: ideas.id, votes: ideas.votes })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  const [existingVote] = await db
    .select({ ideaId: ideaVotes.ideaId })
    .from(ideaVotes)
    .where(and(eq(ideaVotes.ideaId, ideaId), eq(ideaVotes.userId, userId)))
    .limit(1);

  let voted: boolean;
  let newVoteCount: number;

  if (existingVote) {
    await db
      .delete(ideaVotes)
      .where(and(eq(ideaVotes.ideaId, ideaId), eq(ideaVotes.userId, userId)));

    const [updated] = await db
      .update(ideas)
      .set({ votes: sql`GREATEST(${ideas.votes} - 1, 0)`, updatedAt: new Date() })
      .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
      .returning({ votes: ideas.votes });

    voted = false;
    newVoteCount = updated?.votes ?? 0;
  } else {
    await db.insert(ideaVotes).values({ ideaId, userId });

    const [updated] = await db
      .update(ideas)
      .set({ votes: sql`${ideas.votes} + 1`, updatedAt: new Date() })
      .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
      .returning({ votes: ideas.votes });

    voted = true;
    newVoteCount = updated?.votes ?? 0;
  }

  return c.json({ voted, voteCount: newVoteCount }, 200);
});

ideasRoute.delete("/:id/vote", async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [idea] = await db
    .select({ id: ideas.id })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  const [deleted] = await db
    .delete(ideaVotes)
    .where(and(eq(ideaVotes.ideaId, ideaId), eq(ideaVotes.userId, userId)))
    .returning({ ideaId: ideaVotes.ideaId });

  if (!deleted) {
    return c.json({ error: "Vote not found" }, 404);
  }

  await db
    .update(ideas)
    .set({ votes: sql`GREATEST(${ideas.votes} - 1, 0)`, updatedAt: new Date() })
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)));

  return c.body(null, 204);
});

// Get vote count for an idea
ideasRoute.get("/:id/votes", async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [idea] = await db
    .select({ id: ideas.id, votes: ideas.votes })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  const [userVote] = await db
    .select({ ideaId: ideaVotes.ideaId })
    .from(ideaVotes)
    .where(and(eq(ideaVotes.ideaId, ideaId), eq(ideaVotes.userId, userId)))
    .limit(1);

  return c.json({
    data: {
      total: idea.votes,
      userVoted: !!userVote,
      vote: userVote ? 1 : null,
    }
  }, 200);
});

ideasRoute.get("/:id/votes/me", async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [idea] = await db
    .select({ id: ideas.id })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  const [existingVote] = await db
    .select({ ideaId: ideaVotes.ideaId })
    .from(ideaVotes)
    .where(and(eq(ideaVotes.ideaId, ideaId), eq(ideaVotes.userId, userId)))
    .limit(1);

  return c.json({ voted: !!existingVote }, 200);
});

// Get dependencies for an idea
ideasRoute.get("/:id/dependencies", async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  // Verify idea exists
  const [idea] = await db
    .select({ id: ideas.id })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  // Get all dependent ideas
  const rows = await db
    .select({
      id: ideas.id,
      title: ideas.title,
      status: ideas.status,
    })
    .from(ideaDependencies)
    .innerJoin(ideas, eq(ideaDependencies.dependsOnIdeaId, ideas.id))
    .where(and(eq(ideaDependencies.ideaId, ideaId), eq(ideas.workspaceId, workspaceId)));

  return c.json({ data: rows }, 200);
});

// Add a dependency
ideasRoute.post("/:id/dependencies", zValidator("json", z.object({ dependsOnId: z.string().uuid() })), async (c) => {
  const ideaId = c.req.param("id");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");
  const { dependsOnId } = payload;

  // Prevent self-dependency
  if (ideaId === dependsOnId) {
    return c.json({ error: "An idea cannot depend on itself" }, 400);
  }

  // Verify both ideas exist in workspace
  const [currentIdea] = await db
    .select({ id: ideas.id })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!currentIdea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  const [dependsOnIdea] = await db
    .select({ id: ideas.id, title: ideas.title, status: ideas.status })
    .from(ideas)
    .where(and(eq(ideas.id, dependsOnId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!dependsOnIdea) {
    return c.json({ error: "Dependency idea not found" }, 404);
  }

  // Check if dependency already exists
  const [existing] = await db
    .select()
    .from(ideaDependencies)
    .where(and(eq(ideaDependencies.ideaId, ideaId), eq(ideaDependencies.dependsOnIdeaId, dependsOnId)))
    .limit(1);

  if (existing) {
    return c.json({ error: "Dependency already exists" }, 409);
  }

  await db.insert(ideaDependencies).values({
    ideaId,
    dependsOnIdeaId: dependsOnId,
  });

  return c.json({ data: dependsOnIdea }, 201);
});

// Remove a dependency
ideasRoute.delete("/:id/dependencies/:dependsOnId", async (c) => {
  const ideaId = c.req.param("id");
  const dependsOnId = c.req.param("dependsOnId");
  const workspaceId = c.get("workspaceId");

  // Verify idea exists
  const [idea] = await db
    .select({ id: ideas.id })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.workspaceId, workspaceId)))
    .limit(1);

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  const [deleted] = await db
    .delete(ideaDependencies)
    .where(and(eq(ideaDependencies.ideaId, ideaId), eq(ideaDependencies.dependsOnIdeaId, dependsOnId)))
    .returning({ ideaId: ideaDependencies.ideaId });

  if (!deleted) {
    return c.json({ error: "Dependency not found" }, 404);
  }

  return c.body(null, 204);
});

export default ideasRoute;
