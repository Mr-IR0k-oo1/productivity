import { eq, sql } from "drizzle-orm";

import { db } from "@/src/db";
import { users, workspaceMembers, workspaces } from "@/src/db/schema";
import { supabaseAnon } from "@/src/lib/supabase";
import { createUniqueWorkspaceSlug } from "@/src/lib/workspace-slug";

type DatabaseError = {
  code?: string;
  constraint?: string;
  message?: string;
};

type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  workspaceName: string;
  jobTitle?: string;
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

export async function signUpWithWorkspace(input: SignUpInput) {
  const email = normalizeEmail(input.email);

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new Error("An account with this email already exists. Please sign in instead.");
  }

  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        ...(input.jobTitle ? { job_title: input.jobTitle } : {}),
      },
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to sign up");
  }

  const authUserId = data.user.id;

  let userId = "";
  let workspaceId = "";

  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          authUserId,
          email,
          fullName: input.fullName,
          jobTitle: input.jobTitle,
        })
        .returning({ id: users.id });

      const slug = await createUniqueWorkspaceSlug(input.workspaceName);

      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: input.workspaceName,
          slug,
          ownerId: user.id,
        })
        .returning({ id: workspaces.id });

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
      });

      userId = user.id;
      workspaceId = workspace.id;
    });
  } catch (error) {
    if (isDatabaseUniqueViolation(error) && (isEmailUniqueViolation(error) || isAuthUserUniqueViolation(error))) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    throw error;
  }

  return {
    userId,
    workspaceId,
    authUserId,
    session: data.session ?? null,
  };
}

export async function loginWithPassword(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email: normalizedEmail, password });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Invalid credentials");
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName, jobTitle: users.jobTitle })
    .from(users)
    .where(eq(users.authUserId, data.user.id))
    .limit(1);

  return {
    session: data.session,
    user,
  };
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
