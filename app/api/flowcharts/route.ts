import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/db";
import { flowcharts, users, workspaceMembers } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { validateSession } from "@/src/lib/auth";

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return validateSession(token);
}

async function getUserAndWorkspace(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return null;
  }

  const workspaceId = request.headers.get("x-workspace-id");
  if (!workspaceId) {
    return null;
  }

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, user.id)
    ))
    .limit(1);

  if (!member || !member.isActive) {
    return null;
  }

  return { userId: user.id, workspaceId };
}

export async function GET(request: NextRequest) {
  try {
    const context = await getUserAndWorkspace(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(flowcharts)
      .where(eq(flowcharts.workspaceId, context.workspaceId))
      .orderBy(flowcharts.updatedAt);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/flowcharts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserAndWorkspace(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(flowcharts)
      .values({
        workspaceId: context.workspaceId,
        creatorId: context.userId,
        name: body.name,
        data: body.data ?? { nodes: [], edges: [] },
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/flowcharts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}