import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/src/db";
import { users, workspaceMembers, workspaces } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import {
  canAddWorkspaceMember,
  canDeleteWorkspace,
  canDeactivateWorkspaceMember,
  canManageWorkspaceMember,
  canUpdateWorkspaceMemberRole,
  type WorkspaceRole,
} from "@/src/lib/workspace-access";
import { createUniqueWorkspaceSlug } from "@/src/lib/workspace-slug";
import type { AuthBindings } from "@/src/types/bindings";

const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
});

const memberRoleSchema = z.enum(["owner", "admin", "member"]);

const addMemberSchema = z.object({
  email: z.string().email(),
  role: memberRoleSchema.default("member"),
});

const updateMemberSchema = z
  .object({
    role: memberRoleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.isActive !== undefined, {
    message: "At least one field must be provided",
  });

const workspace = new Hono<AuthBindings>();

workspace.use("*", authMiddleware);

workspace.get("/me", workspaceMiddleware, async (c) => {
  const authUserId = c.get("authUserId");
  const workspaceId = c.get("workspaceId");
  const workspaceRole = c.get("workspaceRole") as WorkspaceRole;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      jobTitle: users.jobTitle,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const [workspaceRecord] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspaceRecord) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json(
    {
      data: {
        user,
        workspace: workspaceRecord,
        membership: {
          role: workspaceRole,
          isActive: true,
        },
      },
    },
    200,
  );
});

workspace.get("/members", workspaceMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId");

  const members = await db
    .select({
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      jobTitle: users.jobTitle,
      avatarUrl: users.avatarUrl,
      role: workspaceMembers.role,
      isActive: workspaceMembers.isActive,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return c.json(
    {
      data: members.map((member) => ({
        user: {
          id: member.userId,
          email: member.email,
          fullName: member.fullName,
          jobTitle: member.jobTitle,
          avatarUrl: member.avatarUrl,
        },
        role: member.role,
        isActive: member.isActive,
        joinedAt: member.joinedAt,
      })),
    },
    200,
  );
});

workspace.get("/", async (c) => {
  const authUserId = c.get("authUserId");
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const memberships = await db
    .select({ workspace: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, user.id));

  return c.json({ data: memberships.map((m) => m.workspace) }, 200);
});

workspace.post("/", zValidator("json", createWorkspaceSchema), async (c) => {
  const authUserId = c.get("authUserId");
  const payload = c.req.valid("json");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const slugInput = payload.slug?.trim() || payload.name;
  const slug = await createUniqueWorkspaceSlug(slugInput);

  const [created] = await db
    .insert(workspaces)
    .values({
      ownerId: user.id,
      name: payload.name,
      slug,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    userId: user.id,
    workspaceId: created.id,
    role: "owner",
  });

  return c.json({ data: created }, 201);
});

workspace.post("/switch/:id", async (c) => {
  const authUserId = c.get("authUserId");
  const workspaceId = c.req.param("id");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);

  if (!member) return c.json({ error: "No access to workspace" }, 403);

  return c.json({ data: { workspaceId } }, 200);
});

workspace.post("/members", workspaceMiddleware, zValidator("json", addMemberSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const actorRole = c.get("workspaceRole");
  const payload = c.req.valid("json");

  if (!canAddWorkspaceMember(actorRole, payload.role)) {
    return c.json({ error: "You do not have permission to add members" }, 403);
  }

  const [targetUser] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      jobTitle: users.jobTitle,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (!targetUser) {
    return c.json({ error: "No account exists for that email yet" }, 404);
  }

  const [membership] = await db
    .insert(workspaceMembers)
    .values({
      workspaceId,
      userId: targetUser.id,
      role: payload.role,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      set: {
        role: payload.role,
        isActive: true,
      },
    })
    .returning({
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      isActive: workspaceMembers.isActive,
      joinedAt: workspaceMembers.joinedAt,
    });

  return c.json(
    {
      data: {
        user: targetUser,
        membership,
      },
    },
    201,
  );
});

workspace.patch("/members/:userId", workspaceMiddleware, zValidator("json", updateMemberSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const actorRole = c.get("workspaceRole");
  const actorUserId = c.get("userId");
  const targetUserId = c.req.param("userId");
  const payload = c.req.valid("json");

  const [currentMembership] = await db
    .select({ role: workspaceMembers.role, isActive: workspaceMembers.isActive })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)))
    .limit(1);

  if (!currentMembership) {
    return c.json({ error: "Member not found" }, 404);
  }

  if (payload.role && !canUpdateWorkspaceMemberRole(actorRole, currentMembership.role, payload.role)) {
    return c.json({ error: "You do not have permission to change this member role" }, 403);
  }

  if (payload.isActive === false && !canDeactivateWorkspaceMember(actorRole, currentMembership.role, actorUserId, targetUserId)) {
    return c.json({ error: "You do not have permission to remove this member" }, 403);
  }

  if (payload.isActive === true && !canManageWorkspaceMember(actorRole)) {
    return c.json({ error: "You do not have permission to reactivate this member" }, 403);
  }

  const [updated] = await db
    .update(workspaceMembers)
    .set({
      role: payload.role ?? currentMembership.role,
      isActive: payload.isActive ?? currentMembership.isActive,
    })
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)))
    .returning({
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      isActive: workspaceMembers.isActive,
      joinedAt: workspaceMembers.joinedAt,
    });

  return c.json({ data: updated }, 200);
});

workspace.delete("/members/:userId", workspaceMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId");
  const actorRole = c.get("workspaceRole");
  const actorUserId = c.get("userId");
  const targetUserId = c.req.param("userId");

  const [currentMembership] = await db
    .select({ role: workspaceMembers.role, isActive: workspaceMembers.isActive })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)))
    .limit(1);

  if (!currentMembership) {
    return c.json({ error: "Member not found" }, 404);
  }

  if (!canDeactivateWorkspaceMember(actorRole, currentMembership.role, actorUserId, targetUserId)) {
    return c.json({ error: "You do not have permission to remove this member" }, 403);
  }

  const [updated] = await db
    .update(workspaceMembers)
    .set({ isActive: false })
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)))
    .returning({
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      isActive: workspaceMembers.isActive,
      joinedAt: workspaceMembers.joinedAt,
    });

  return c.json({ data: updated }, 200);
});

workspace.delete("/", workspaceMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId");
  const actorRole = c.get("workspaceRole");

  if (!canDeleteWorkspace(actorRole)) {
    return c.json({ error: "You do not have permission to delete this workspace" }, 403);
  }

  const [deleted] = await db
    .delete(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .returning({ id: workspaces.id });

  if (!deleted) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.body(null, 204);
});

export default workspace;
