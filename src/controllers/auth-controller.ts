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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

export async function signUpWithWorkspace(input: SignUpInput) {
  const email = normalizeEmail(input.email);

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
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

  let userId = "";
  let workspaceId = "";

  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          authUserId: data.user.id,
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
    authUserId: data.user.id,
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
