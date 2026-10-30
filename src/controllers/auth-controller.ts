import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users, workspaceInvites, workspaceMembers, workspaces } from "@/src/db/schema";
import { LOCAL_AUTH_USER_ID } from "@/src/lib/local-mode";
import { createUniqueWorkspaceSlug } from "@/src/lib/workspace-slug";

type DatabaseError = {
  code?: string;
  constraint?: string;
  message?: string;
};

type EnsureOAuthUserWorkspaceInput = {
  authUserId: string;
  email: string;
  fullName?: string | null;
  workspaceName?: string | null;
};

type EnsureOAuthUserWorkspaceResult = {
  userId: string;
  workspaceId: string;
  createdUser: boolean;
  createdWorkspace: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildDefaultWorkspaceName(fullName?: string | null) {
  const ownerName = fullName?.trim() || "My";
  return `${ownerName} Workspace`.slice(0, 120);
}

function isDatabaseUniqueViolation(error: unknown) {
  return (error as DatabaseError | undefined)?.code === "23505";
}

function isAuthUserUniqueViolation(error: unknown) {
  const constraint = (error as DatabaseError | undefined)?.constraint;
  return constraint === "users_auth_user_id_unique";
}

function isEmailUniqueViolation(error: unknown) {
  const constraint = (error as DatabaseError | undefined)?.constraint;
  return constraint === "users_email_unique";
}

async function ensureWorkspaceForUser(userId: string, preferredWorkspaceName: string) {
  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (membership) {
    return { workspaceId: membership.workspaceId, createdWorkspace: false };
  }

  const workspaceName = preferredWorkspaceName.trim() || "My Workspace";
  const slug = await createUniqueWorkspaceSlug(workspaceName);

  const workspace = await db.transaction(async (tx) => {
    const [createdWorkspace] = await tx
      .insert(workspaces)
      .values({
        name: workspaceName,
        slug,
        ownerId: userId,
      })
      .returning({ id: workspaces.id });

    await tx.insert(workspaceMembers).values({
      workspaceId: createdWorkspace.id,
      userId,
      role: "owner",
    });

    return createdWorkspace;
  });

  return { workspaceId: workspace.id, createdWorkspace: true };
}

/**
 * When login is first switched on, the first account to sign up takes over the built-in
 * local profile (and its workspace) instead of starting empty. Returns true if claimed.
 */
export async function claimLocalProfile(input: { authUserId: string; email: string; fullName?: string | null }) {
  const [claimed] = await db
    .update(users)
    .set({
      authUserId: input.authUserId,
      email: normalizeEmail(input.email),
      fullName: input.fullName?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(users.authUserId, LOCAL_AUTH_USER_ID))
    .returning({ id: users.id });

  return Boolean(claimed);
}

export async function ensureOAuthUserWorkspace(
  input: EnsureOAuthUserWorkspaceInput,
): Promise<EnsureOAuthUserWorkspaceResult> {
  const normalizedEmail = normalizeEmail(input.email);
  const workspaceName = (input.workspaceName?.trim() || buildDefaultWorkspaceName(input.fullName)).slice(0, 120);

  const [existingByAuthUserId] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, input.authUserId))
    .limit(1);

  if (existingByAuthUserId) {
    const workspace = await ensureWorkspaceForUser(existingByAuthUserId.id, workspaceName);
    return {
      userId: existingByAuthUserId.id,
      workspaceId: workspace.workspaceId,
      createdUser: false,
      createdWorkspace: workspace.createdWorkspace,
    };
  }

  const [existingByEmail] = await db
    .select({ id: users.id, authUserId: users.authUserId })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingByEmail && existingByEmail.authUserId !== input.authUserId) {
    throw new Error("An account with this email already exists. Please sign in with email/password.");
  }

  let userId = "";
  let createdUser = false;

  try {
    const [createdUserRow] = await db
      .insert(users)
      .values({
        authUserId: input.authUserId,
        email: normalizedEmail,
        fullName: input.fullName?.trim() || null,
      })
      .returning({ id: users.id });

    userId = createdUserRow.id;
    createdUser = true;
  } catch (error) {
    if (isDatabaseUniqueViolation(error) && isEmailUniqueViolation(error)) {
      throw new Error("An account with this email already exists. Please sign in with email/password.");
    }

    if (isDatabaseUniqueViolation(error) && isAuthUserUniqueViolation(error)) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.authUserId, input.authUserId))
        .limit(1);

      if (!existingUser) {
        throw error;
      }

      userId = existingUser.id;
    } else {
      throw error;
    }
  }

  if (!userId) {
    throw new Error("Failed to provision OAuth account.");
  }

  const workspace = await ensureWorkspaceForUser(userId, workspaceName);

  return {
    userId,
    workspaceId: workspace.workspaceId,
    createdUser,
    createdWorkspace: workspace.createdWorkspace,
  };
}

/** Turns pending invites for this email into memberships. Returns how many were accepted. */
export async function acceptPendingInvites(input: { authUserId: string; email: string }) {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.authUserId, input.authUserId)).limit(1);

  if (!user) {
    return 0;
  }

  return db.transaction(async (tx) => {
    const invites = await tx
      .delete(workspaceInvites)
      .where(eq(workspaceInvites.email, normalizeEmail(input.email)))
      .returning();

    for (const invite of invites) {
      await tx
        .insert(workspaceMembers)
        .values({ workspaceId: invite.workspaceId, userId: user.id, role: invite.role })
        .onConflictDoUpdate({
          target: [workspaceMembers.workspaceId, workspaceMembers.userId],
          set: { role: invite.role, isActive: true },
        });
    }

    return invites.length;
  });
}
