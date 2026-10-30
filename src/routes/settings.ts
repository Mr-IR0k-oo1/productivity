import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { db } from "@/src/db";
import { users, workspaceMembers, workspaceSettings, workspaces } from "@/src/db/schema";
import { authMiddleware } from "@/src/middleware/auth";
import { requirePermission } from "@/src/middleware/permissions";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";
import {
  appendWorkspaceSettingsAuditEntry,
  createWorkspaceSettingsDocument,
  normalizeWorkspaceSettings,
  updateWorkspaceSettingsDocument,
  workspaceSettingsPatchSchema,
} from "@/src/lib/workspace-settings";

const settingsRoute = new Hono<WorkspaceBindings>();

settingsRoute.use("*", authMiddleware, workspaceMiddleware);

settingsRoute.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const workspaceRole = c.get("workspaceRole");
  const authUserId = c.get("authUserId");

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  const [settingsRow] = await db
    .select({ settings: workspaceSettings.settings })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.workspaceId, workspaceId))
    .limit(1);

  const settings = settingsRow ? normalizeWorkspaceSettings(settingsRow.settings, workspace.name) : createWorkspaceSettingsDocument(workspace.name);

  if (!settingsRow) {
    await db.insert(workspaceSettings).values({ workspaceId, settings });
  }

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
      data: {
        workspace,
        membership: {
          role: workspaceRole,
          isActive: true,
        },
        currentUserId: authUserId,
        members: members.map((member) => ({
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
        settings,
      },
    },
    200,
  );
});

settingsRoute.patch("/", requirePermission("manageSettings"), zValidator("json", workspaceSettingsPatchSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  const [settingsRow] = await db
    .select({ settings: workspaceSettings.settings })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.workspaceId, workspaceId))
    .limit(1);

  const currentSettings = settingsRow ? normalizeWorkspaceSettings(settingsRow.settings, workspace.name) : createWorkspaceSettingsDocument(workspace.name);
  const nextWorkspaceName = payload.section === "general" ? payload.data.workspaceName.trim() || workspace.name : workspace.name;
  let nextSettings = updateWorkspaceSettingsDocument(currentSettings, payload, nextWorkspaceName);

  if (payload.section === "general" && nextWorkspaceName !== workspace.name) {
    await db
      .update(workspaces)
      .set({ name: nextWorkspaceName, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  }

  const updatedWorkspace = payload.section === "general" ? { ...workspace, name: nextWorkspaceName } : workspace;

  nextSettings = appendWorkspaceSettingsAuditEntry(nextSettings, `${payload.section} settings updated`);

  await db
    .insert(workspaceSettings)
    .values({ workspaceId, settings: nextSettings })
    .onConflictDoUpdate({
      target: workspaceSettings.workspaceId,
      set: { settings: nextSettings, updatedAt: new Date() },
    });

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
      data: {
        workspace: updatedWorkspace,
        membership: {
          role: c.get("workspaceRole"),
          isActive: true,
        },
        currentUserId: c.get("authUserId"),
        members: members.map((member) => ({
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
        settings: nextSettings,
      },
    },
    200,
  );
});

export default settingsRoute;