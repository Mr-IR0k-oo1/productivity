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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getUserAndWorkspace(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [flowchart] = await db
      .select()
      .from(flowcharts)
      .where(and(
        eq(flowcharts.id, id),
        eq(flowcharts.workspaceId, context.workspaceId)
      ))
      .limit(1);

    if (!flowchart) {
      return NextResponse.json({ error: "Flowchart not found" }, { status: 404 });
    }

    return NextResponse.json({ data: flowchart });
  } catch (error) {
    console.error("GET /api/flowcharts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getUserAndWorkspace(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(flowcharts)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.data && { data: body.data }),
        updatedAt: new Date(),
      })
      .where(and(
        eq(flowcharts.id, id),
        eq(flowcharts.workspaceId, context.workspaceId)
      ))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Flowchart not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/flowcharts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getUserAndWorkspace(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(flowcharts)
      .where(and(
        eq(flowcharts.id, id),
        eq(flowcharts.workspaceId, context.workspaceId)
      ))
      .returning({ id: flowcharts.id });

    if (!deleted) {
      return NextResponse.json({ error: "Flowchart not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/flowcharts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}