import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/db";
import { flowcharts, users, workspaceMembers } from "@/src/db/schema";
import { supabaseAdmin } from "@/src/lib/supabase";
import { eq, and } from "drizzle-orm";

const isAuthBypassEnabled =
  process.env.ORBIT_DISABLE_AUTH === "true" || process.env.NEXT_PUBLIC_ORBIT_DISABLE_AUTH === "true";
const flowchartItemRouteDebugEnabled = process.env.NODE_ENV !== "production";
let cachedBypassAuthUserId: string | null = null;

function logFlowchartItemRoute(event: string, payload?: Record<string, unknown>) {
  if (!flowchartItemRouteDebugEnabled) {
    return;
  }

  if (payload) {
    console.log(`[api/flowcharts/:id] ${event}`, payload);
    return;
  }

  console.log(`[api/flowcharts/:id] ${event}`);
}

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  if (isAuthBypassEnabled) {
    const headerAuthUserId = request.headers.get("x-dev-auth-user-id")?.trim();

    if (headerAuthUserId) {
      return headerAuthUserId;
    }

    if (cachedBypassAuthUserId) {
      return cachedBypassAuthUserId;
    }

    const [user] = await db
      .select({ authUserId: users.authUserId })
      .from(users)
      .limit(1);

    cachedBypassAuthUserId = user?.authUserId ?? null;
    return cachedBypassAuthUserId;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data.user?.id ?? null;
  }
  return null;
}

async function getUserAndWorkspace(request: NextRequest) {
  const authUserId = await getAuthUserId(request);
  if (!authUserId) {
    logFlowchartItemRoute("auth:blocked", { reason: "missing-auth-user" });
    return null;
  }

  const workspaceId = request.headers.get("x-workspace-id");
  if (!workspaceId) {
    logFlowchartItemRoute("auth:blocked", {
      reason: "missing-workspace-id",
      authUserId,
    });
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (!user) {
    logFlowchartItemRoute("auth:blocked", {
      reason: "user-not-found",
      authUserId,
      workspaceId,
    });
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
    logFlowchartItemRoute("auth:blocked", {
      reason: "inactive-or-missing-membership",
      authUserId,
      workspaceId,
      userId: user.id,
      isMemberActive: member?.isActive ?? null,
    });
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
      logFlowchartItemRoute("get:not-found", {
        flowchartId: id,
        workspaceId: context.workspaceId,
      });
      return NextResponse.json({ error: "Flowchart not found" }, { status: 404 });
    }

    logFlowchartItemRoute("get:success", {
      flowchartId: id,
      workspaceId: context.workspaceId,
    });
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
      logFlowchartItemRoute("patch:not-found", {
        flowchartId: id,
        workspaceId: context.workspaceId,
      });
      return NextResponse.json({ error: "Flowchart not found" }, { status: 404 });
    }

    logFlowchartItemRoute("patch:success", {
      flowchartId: id,
      workspaceId: context.workspaceId,
      hasName: Boolean(body.name),
      hasData: Boolean(body.data),
    });
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
      logFlowchartItemRoute("delete:not-found", {
        flowchartId: id,
        workspaceId: context.workspaceId,
      });
      return NextResponse.json({ error: "Flowchart not found" }, { status: 404 });
    }

    logFlowchartItemRoute("delete:success", {
      flowchartId: id,
      workspaceId: context.workspaceId,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/flowcharts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
