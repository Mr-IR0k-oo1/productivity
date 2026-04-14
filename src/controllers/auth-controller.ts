import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users, workspaceMembers, workspaces } from "@/src/db/schema";
import { supabaseAnon } from "@/src/lib/supabase";

type SignUpInput = {
  email: string;
  password: string;
  fullName?: string;
  workspaceName: string;
};

export async function signUpWithWorkspace(input: SignUpInput) {
  const { data, error } = await supabaseAnon.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to sign up");
  }

  const [user] = await db
    .insert(users)
    .values({
      authUserId: data.user.id,
      email: input.email,
      fullName: input.fullName,
    })
    .returning({ id: users.id });

  const slug = input.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: input.workspaceName,
      slug,
      ownerId: user.id,
    })
    .returning({ id: workspaces.id });

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  });

  return {
    userId: user.id,
    workspaceId: workspace.id,
    authUserId: data.user.id,
  };
}

export async function loginWithPassword(email: string, password: string) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Invalid credentials");
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.authUserId, data.user.id))
    .limit(1);

  return {
    session: data.session,
    user,
  };
}
