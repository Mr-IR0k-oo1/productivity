import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/db";
import { flowcharts, users, workspaceMembers } from "@/src/db/schema";
import { supabaseAdmin } from "@/src/lib/supabase";
import { eq, and } from "drizzle-orm";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data.user?.id ?? null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = request.headers.get("x-workspace-id");
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(flowcharts)
      .where(eq(flowcharts.workspaceId, workspaceId))
      .orderBy(flowcharts.updatedAt);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/flowcharts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = request.headers.get("x-workspace-id");
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Workspace membership required" }, { status: 403 });
    }

    const [created] = await db
      .insert(flowcharts)
      .values({
        workspaceId,
        creatorId: user.id,
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
