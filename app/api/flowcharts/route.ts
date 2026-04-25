import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/db";
import { flowcharts, users, workspaceMembers } from "@/src/db/schema";
import { supabaseAdmin } from "@/src/lib/supabase";
import { eq, and } from "drizzle-orm";

const isAuthBypassEnabled =
  process.env.ORBIT_DISABLE_AUTH === "true" || process.env.NEXT_PUBLIC_ORBIT_DISABLE_AUTH === "true";
const flowchartRouteDebugEnabled = process.env.NODE_ENV !== "production";
let cachedBypassAuthUserId: string | null = null;

function logFlowchartsRoute(event: string, payload?: Record<string, unknown>) {
  if (!flowchartRouteDebugEnabled) {
    return;
  }

  if (payload) {
    console.log(`[api/flowcharts] ${event}`, payload);
    return;
  }

  console.log(`[api/flowcharts] ${event}`);
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

export async function GET(request: NextRequest) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      logFlowchartsRoute("get:blocked", { reason: "missing-auth-user" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = request.headers.get("x-workspace-id");
    if (!workspaceId) {
      logFlowchartsRoute("get:blocked", {
        reason: "missing-workspace-id",
        authUserId,
      });
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (!user) {
      logFlowchartsRoute("get:blocked", {
        reason: "user-not-found",
        authUserId,
        workspaceId,
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: flowcharts.id,
        workspaceId: flowcharts.workspaceId,
        creatorId: flowcharts.ownerId,
        name: flowcharts.title,
        description: flowcharts.description,
        data: flowcharts.canvasState,
        createdAt: flowcharts.createdAt,
        updatedAt: flowcharts.updatedAt,
      })
      .from(flowcharts)
      .where(eq(flowcharts.workspaceId, workspaceId))
      .orderBy(flowcharts.updatedAt);

    logFlowchartsRoute("get:success", {
      authUserId,
      workspaceId,
      count: rows.length,
    });

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
      logFlowchartsRoute("post:blocked", { reason: "missing-auth-user" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = request.headers.get("x-workspace-id");
    if (!workspaceId) {
      logFlowchartsRoute("post:blocked", {
        reason: "missing-workspace-id",
        authUserId,
      });
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== "string") {
      logFlowchartsRoute("post:blocked", {
        reason: "invalid-name",
        authUserId,
        workspaceId,
      });
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (!user) {
      logFlowchartsRoute("post:blocked", {
        reason: "user-not-found",
        authUserId,
        workspaceId,
      });
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
      logFlowchartsRoute("post:blocked", {
        reason: "workspace-membership-required",
        authUserId,
        workspaceId,
        userId: user.id,
        isMemberActive: member?.isActive ?? null,
      });
      return NextResponse.json({ error: "Workspace membership required" }, { status: 403 });
    }

    const [created] = await db
      .insert(flowcharts)
      .values({
        workspaceId,
        ownerId: user.id,
        title: body.name,
        canvasState: body.data ?? { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      })
      .returning({
        id: flowcharts.id,
        workspaceId: flowcharts.workspaceId,
        creatorId: flowcharts.ownerId,
        name: flowcharts.title,
        data: flowcharts.canvasState,
        createdAt: flowcharts.createdAt,
        updatedAt: flowcharts.updatedAt,
      });

    logFlowchartsRoute("post:success", {
      authUserId,
      workspaceId,
      userId: user.id,
      flowchartId: created.id,
      name: created.name,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/flowcharts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
