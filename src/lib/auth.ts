import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

import { db } from "@/src/db";
import { users, sessions, workspaces, workspaceMembers } from "@/src/db/schema";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createUser(email: string, password: string, fullName: string, workspaceName: string) {
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
    })
    .returning({ id: users.id, email: users.email });

  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Date.now().toString(36);

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: workspaceName,
      slug,
      ownerId: user.id,
    })
    .returning({ id: workspaces.id });

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  });

  return createSession(user.id);
}

export async function loginUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  return createSession(user.id);
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return { token, userId, expiresAt: expiresAt.toISOString() };
}

export async function validateSession(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      jobTitle: users.jobTitle,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user;
}

export async function logoutSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}