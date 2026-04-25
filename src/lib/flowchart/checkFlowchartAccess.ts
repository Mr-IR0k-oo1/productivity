import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { flowchartAccess, flowcharts, workspaceMembers } from "@/src/db/schema";
import type { AccessRole } from "@/types/flowchart";

export async function checkFlowchartAccess(
  flowchartId: string,
  userId: string,
  workspaceId: string,
  requiredRole: AccessRole,
): Promise<"ok" | "not_found" | "forbidden"> {
  const [flowchart] = await db
    .select({
      id: flowcharts.id,
      ownerId: flowcharts.ownerId,
    })
    .from(flowcharts)
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .limit(1);

  if (!flowchart) {
    return "not_found";
  }

  const [membership] = await db
    .select({
      role: workspaceMembers.role,
      isActive: workspaceMembers.isActive,
    })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (membership?.isActive && (membership.role === "admin" || membership.role === "owner")) {
    return "ok";
  }

  if (requiredRole === "viewer" || requiredRole === "editor") {
    if (membership?.isActive) {
      return "ok";
    }
  }

  if (requiredRole === "owner") {
    if (flowchart.ownerId === userId) {
      return "ok";
    }

    const [access] = await db
      .select({
        role: flowchartAccess.role,
      })
      .from(flowchartAccess)
      .where(and(eq(flowchartAccess.flowchartId, flowchartId), eq(flowchartAccess.userId, userId)))
      .limit(1);

    if (access?.role === "owner") {
      return "ok";
    }

    return "forbidden";
  }

  const [access] = await db
    .select({
      role: flowchartAccess.role,
    })
    .from(flowchartAccess)
    .where(and(eq(flowchartAccess.flowchartId, flowchartId), eq(flowchartAccess.userId, userId)))
    .limit(1);

  if (!access) {
    return "forbidden";
  }

  if (requiredRole === "viewer") {
    return "ok";
  }

  if (requiredRole === "editor" && (access.role === "editor" || access.role === "owner")) {
    return "ok";
  }

  return "forbidden";
}
