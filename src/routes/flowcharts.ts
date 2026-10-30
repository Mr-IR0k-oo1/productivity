import { zValidator } from "@hono/zod-validator";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  InferSelectModel,
} from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import sharp from "sharp";
import { z } from "zod";

import { DEFAULT_CANVAS_STATE } from "@/lib/flowchart/constants";
import { normalizeCanvasState } from "@/lib/flowchart/normalize";
import {
  accessRoleSchema,
  canvasModeSchema,
  canvasStateSchema,
  diagramTypeSchema,
  flowchartCommentSchema,
  flowchartSchema,
  flowchartVersionSchema,
  pageSizeSchema,
} from "@/lib/flowchart/schemas";
import { db } from "@/src/db";
import {
  flowchartAccess,
  flowchartComments,
  flowchartNodes,
  flowchartVersions,
  flowcharts,
  users,
} from "@/src/db/schema";
import { checkFlowchartAccess } from "@/src/lib/flowchart/checkFlowchartAccess";
import { deleteLocalFile, isValidStorageKey, localFileUrl, readLocalFile, saveLocalFile } from "@/src/lib/local-files";
import { authMiddleware } from "@/src/middleware/auth";
import { workspaceMiddleware } from "@/src/middleware/workspace";
import type { WorkspaceBindings } from "@/src/types/bindings";
import type {
  CanvasState,
  Flowchart,
  FlowchartComment,
  FlowchartVersion,
  FlowchartVersionSummary,
  PageSize,
} from "@/types/flowchart";

const flowchartsRouter = new Hono<WorkspaceBindings>();

const flowchartsListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createFlowchartSchema = z.object({
  title: z.string().trim().min(1).max(200).default("Untitled flowchart"),
  mode: canvasModeSchema.default("infinite"),
  pageSize: pageSizeSchema.optional(),
  pageWidth: z.number().positive().optional(),
  pageHeight: z.number().positive().optional(),
  // Assumption: create accepts diagramType/canvasState so starter templates can be persisted in one round trip.
  diagramType: diagramTypeSchema.nullable().optional(),
  canvasState: canvasStateSchema.optional(),
});

const updateFlowchartSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    mode: canvasModeSchema.optional(),
    pageSize: pageSizeSchema.nullable().optional(),
    pageWidth: z.number().positive().nullable().optional(),
    pageHeight: z.number().positive().nullable().optional(),
    diagramType: diagramTypeSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const saveCanvasSchema = z.object({
  canvasState: canvasStateSchema,
});

const shareSchema = z.object({
  enabled: z.boolean(),
});

const createVersionSchema = z.object({
  label: z.string().trim().max(160).optional(),
});

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  x: z.number(),
  y: z.number(),
  parentId: z.string().uuid().optional(),
});

const exportQuerySchema = z.object({
  format: z.enum(["json", "png", "svg", "pdf"]).default("json"),
});

type FlowchartRow = InferSelectModel<typeof flowcharts>;
type FlowchartVersionRow = InferSelectModel<typeof flowchartVersions>;
type FlowchartCommentRow = InferSelectModel<typeof flowchartComments>;

type CommentWithAuthorRow = {
  comment: FlowchartCommentRow;
  authorName: string | null;
  authorAvatar: string | null;
};

function toIsoString(value: Date | string | null): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return new Date(value).toISOString();
  }

  return new Date(0).toISOString();
}

function normalizePageSize(mode: Flowchart["mode"], pageSize?: PageSize | null) {
  if (mode === "infinite") {
    return null;
  }

  return pageSize ?? "a4";
}

function serializeFlowchart(row: FlowchartRow): Flowchart {
  const flowchart = {
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    title: row.title,
    description: row.description,
    mode: row.mode,
    pageSize: row.pageSize,
    pageWidth: row.pageWidth,
    pageHeight: row.pageHeight,
    diagramType: row.diagramType,
    canvasState: normalizeCanvasState(row.canvasState),
    thumbnailUrl: row.thumbnailUrl,
    isPublic: row.isPublic,
    publicToken: row.publicToken,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };

  return flowchartSchema.parse(flowchart);
}

function serializeFlowchartVersion(row: FlowchartVersionRow): FlowchartVersion {
  return flowchartVersionSchema.parse({
    id: row.id,
    flowchartId: row.flowchartId,
    snapshot: normalizeCanvasState(row.snapshot),
    label: row.label,
    createdBy: row.createdBy,
    createdAt: toIsoString(row.createdAt),
  });
}

function serializeFlowchartVersionSummary(row: FlowchartVersionRow): FlowchartVersionSummary {
  const version = serializeFlowchartVersion(row);
  return {
    id: version.id,
    flowchartId: version.flowchartId,
    label: version.label,
    createdBy: version.createdBy,
    createdAt: version.createdAt,
  };
}

function serializeComment(row: CommentWithAuthorRow): FlowchartComment {
  return flowchartCommentSchema.parse({
    id: row.comment.id,
    flowchartId: row.comment.flowchartId,
    parentId: row.comment.parentId,
    authorId: row.comment.authorId,
    authorName: row.authorName ?? "Unknown user",
    authorAvatar: row.authorAvatar,
    content: row.comment.content,
    x: row.comment.x,
    y: row.comment.y,
    resolved: row.comment.resolved,
    createdAt: toIsoString(row.comment.createdAt),
    updatedAt: toIsoString(row.comment.updatedAt),
  });
}

function nestComments(rows: FlowchartComment[]): FlowchartComment[] {
  const map = new Map<string, FlowchartComment>();
  const roots: FlowchartComment[] = [];

  rows.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  map.forEach((comment) => {
    if (comment.parentId) {
      const parent = map.get(comment.parentId);
      if (parent) {
        const existingReplies = parent.replies ?? [];
        existingReplies.push(comment);
        parent.replies = existingReplies;
        return;
      }
    }

    roots.push(comment);
  });

  return roots.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function getShareOrigin(requestUrl: string): string {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envOrigin) {
    return envOrigin.replace(/\/+$/, "");
  }

  return new URL(requestUrl).origin;
}

async function assertFlowchartAccess(
  flowchartId: string,
  userId: string,
  workspaceId: string,
  requiredRole: "viewer" | "editor" | "owner",
): Promise<void> {
  const result = await checkFlowchartAccess(flowchartId, userId, workspaceId, requiredRole);

  if (result === "not_found") {
    throw new HTTPException(404, { message: "Flowchart not found" });
  }

  if (result === "forbidden") {
    throw new HTTPException(403, { message: "Forbidden" });
  }
}

async function getFlowchartById(flowchartId: string, workspaceId: string): Promise<FlowchartRow> {
  const [flowchart] = await db
    .select()
    .from(flowcharts)
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .limit(1);

  if (!flowchart) {
    throw new HTTPException(404, { message: "Flowchart not found" });
  }

  return flowchart;
}

async function syncFlowchartNodeIndex(flowchartId: string, canvasState: CanvasState): Promise<void> {
  const referencedNodes = canvasState.nodes
    .filter((node) => node.data.type === "task_card" || node.data.type === "idea_card")
    .map((node) => ({
      flowchartId,
      nodeType: node.data.type,
      taskId: node.data.type === "task_card" && node.data.taskId ? node.data.taskId : null,
      ideaId: node.data.type === "idea_card" && node.data.ideaId ? node.data.ideaId : null,
      x: node.position.x,
      y: node.position.y,
      width: node.width ?? 200,
      height: node.height ?? 80,
    }));

  await db.delete(flowchartNodes).where(eq(flowchartNodes.flowchartId, flowchartId));

  if (referencedNodes.length > 0) {
    await db.insert(flowchartNodes).values(referencedNodes);
  }
}

async function getCommentRows(flowchartId: string): Promise<CommentWithAuthorRow[]> {
  const rows = await db
    .select({
      comment: flowchartComments,
      authorName: users.fullName,
      authorAvatar: users.avatarUrl,
    })
    .from(flowchartComments)
    .leftJoin(users, eq(flowchartComments.authorId, users.id))
    .where(eq(flowchartComments.flowchartId, flowchartId))
    .orderBy(asc(flowchartComments.createdAt));

  return rows.map((row) => ({
    comment: row.comment,
    authorName: row.authorName,
    authorAvatar: row.authorAvatar,
  }));
}

flowchartsRouter.get("/public/:token", async (c) => {
  const token = c.req.param("token");

  const [flowchart] = await db
    .select()
    .from(flowcharts)
    .where(and(eq(flowcharts.publicToken, token), eq(flowcharts.isPublic, true)))
    .limit(1);

  if (!flowchart) {
    throw new HTTPException(404, { message: "Flowchart not found" });
  }

  const serialized = serializeFlowchart(flowchart);
  return c.json({
    flowchart: {
      id: serialized.id,
      workspaceId: serialized.workspaceId,
      ownerId: serialized.ownerId,
      title: serialized.title,
      description: serialized.description,
      mode: serialized.mode,
      pageSize: serialized.pageSize,
      pageWidth: serialized.pageWidth,
      pageHeight: serialized.pageHeight,
      diagramType: serialized.diagramType,
      canvasState: serialized.canvasState,
      thumbnailUrl: serialized.thumbnailUrl,
      isPublic: serialized.isPublic,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
    },
  });
});

// Image bytes are served without auth headers so <img> tags can load them; keys are random UUIDs.
flowchartsRouter.get("/files/:storageKey", async (c) => {
  const storageKey = decodeURIComponent(c.req.param("storageKey"));

  if (!isValidStorageKey(storageKey)) {
    throw new HTTPException(404, { message: "Image not found" });
  }

  try {
    const contents = await readLocalFile(storageKey);
    return c.body(new Uint8Array(contents), 200, {
      "content-type": "image/webp",
      "cache-control": "private, max-age=31536000, immutable",
    });
  } catch {
    throw new HTTPException(404, { message: "Image not found" });
  }
});

flowchartsRouter.use("*", authMiddleware, workspaceMiddleware);

flowchartsRouter.get("/", zValidator("query", flowchartsListQuerySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const query = c.req.valid("query");

  const whereClause = query.search
    ? and(eq(flowcharts.workspaceId, workspaceId), ilike(flowcharts.title, `%${query.search}%`))
    : eq(flowcharts.workspaceId, workspaceId);

  const [totalRow] = await db.select({ total: count() }).from(flowcharts).where(whereClause);
  const rows = await db
    .select()
    .from(flowcharts)
    .where(whereClause)
    .orderBy(desc(flowcharts.updatedAt))
    .limit(query.limit)
    .offset(query.offset);

  return c.json({
    flowcharts: rows.map(serializeFlowchart),
    total: totalRow?.total ?? 0,
  });
});

flowchartsRouter.post("/", zValidator("json", createFlowchartSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const payload = c.req.valid("json");

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(flowcharts)
      .values({
        workspaceId,
        ownerId: userId,
        title: payload.title,
        mode: payload.mode,
        pageSize: normalizePageSize(payload.mode, payload.pageSize),
        pageWidth: payload.mode === "page" ? payload.pageWidth ?? null : null,
        pageHeight: payload.mode === "page" ? payload.pageHeight ?? null : null,
        diagramType: payload.diagramType ?? null,
        canvasState: payload.canvasState ?? DEFAULT_CANVAS_STATE,
      })
      .returning();

    await tx.insert(flowchartAccess).values({
      flowchartId: row.id,
      userId,
      role: accessRoleSchema.parse("owner"),
      grantedBy: userId,
    });

    return row;
  });

  if ((payload.canvasState?.nodes.length ?? 0) > 0) {
    await syncFlowchartNodeIndex(created.id, payload.canvasState ?? DEFAULT_CANVAS_STATE);
  }

  return c.json({ flowchart: serializeFlowchart(created) }, 201);
});

flowchartsRouter.get("/:id", async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");
  const flowchart = await getFlowchartById(flowchartId, workspaceId);

  return c.json({ flowchart: serializeFlowchart(flowchart) });
});

flowchartsRouter.put("/:id", zValidator("json", updateFlowchartSchema), async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");

  const [updated] = await db
    .update(flowcharts)
    .set({
      title: payload.title,
      description: payload.description,
      mode: payload.mode,
      pageSize: payload.mode ? normalizePageSize(payload.mode, payload.pageSize) : payload.pageSize,
      pageWidth: payload.mode === "page" ? payload.pageWidth ?? null : payload.mode === "infinite" ? null : payload.pageWidth,
      pageHeight: payload.mode === "page" ? payload.pageHeight ?? null : payload.mode === "infinite" ? null : payload.pageHeight,
      diagramType: payload.diagramType,
      updatedAt: new Date(),
    })
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    throw new HTTPException(404, { message: "Flowchart not found" });
  }

  return c.json({ flowchart: serializeFlowchart(updated) });
});

flowchartsRouter.put("/:id/canvas", zValidator("json", saveCanvasSchema), async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(flowcharts)
      .set({
        canvasState: payload.canvasState,
        updatedAt: new Date(),
      })
      .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
      .returning({ id: flowcharts.id });

    if (!updated) {
      throw new HTTPException(404, { message: "Flowchart not found" });
    }

    await tx.delete(flowchartNodes).where(eq(flowchartNodes.flowchartId, flowchartId));

    const referencedNodes = payload.canvasState.nodes
      .filter((node) => node.data.type === "task_card" || node.data.type === "idea_card")
      .map((node) => ({
        flowchartId,
        nodeType: node.data.type,
        taskId: node.data.type === "task_card" && node.data.taskId ? node.data.taskId : null,
        ideaId: node.data.type === "idea_card" && node.data.ideaId ? node.data.ideaId : null,
        x: node.position.x,
        y: node.position.y,
        width: node.width ?? 200,
        height: node.height ?? 80,
      }));

    if (referencedNodes.length > 0) {
      await tx.insert(flowchartNodes).values(referencedNodes);
    }
  });

  return c.json({ ok: true });
});

flowchartsRouter.delete("/:id", async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "owner");

  const [deleted] = await db
    .delete(flowcharts)
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .returning({ id: flowcharts.id });

  if (!deleted) {
    throw new HTTPException(404, { message: "Flowchart not found" });
  }

  return c.json({ ok: true });
});

flowchartsRouter.post("/:id/duplicate", async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");
  const original = await getFlowchartById(flowchartId, workspaceId);

  const duplicated = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(flowcharts)
      .values({
        workspaceId,
        ownerId: userId,
        title: `Copy of ${original.title}`,
        description: original.description,
        mode: original.mode,
        pageSize: original.pageSize,
        pageWidth: original.pageWidth,
        pageHeight: original.pageHeight,
        diagramType: original.diagramType,
        canvasState: normalizeCanvasState(original.canvasState),
        isPublic: false,
        publicToken: null,
      })
      .returning();

    await tx.insert(flowchartAccess).values({
      flowchartId: created.id,
      userId,
      role: "owner",
      grantedBy: userId,
    });

    await syncFlowchartNodeIndex(created.id, normalizeCanvasState(original.canvasState));
    return created;
  });

  return c.json({ flowchart: serializeFlowchart(duplicated) }, 201);
});

flowchartsRouter.post("/:id/share", zValidator("json", shareSchema), async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "owner");

  const nextToken = payload.enabled ? crypto.randomUUID().replace(/-/g, "") : null;

  const [updated] = await db
    .update(flowcharts)
    .set({
      isPublic: payload.enabled,
      publicToken: nextToken,
      updatedAt: new Date(),
    })
    .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    throw new HTTPException(404, { message: "Flowchart not found" });
  }

  const shareUrl = updated.publicToken ? `${getShareOrigin(c.req.url)}/f/${updated.publicToken}` : null;
  return c.json({ shareUrl });
});

flowchartsRouter.post("/:id/versions", zValidator("json", createVersionSchema), async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");
  const flowchart = await getFlowchartById(flowchartId, workspaceId);

  const version = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(flowchartVersions)
      .values({
        flowchartId,
        snapshot: normalizeCanvasState(flowchart.canvasState),
        label: payload.label ?? null,
        createdBy: userId,
      })
      .returning();

    const existing = await tx
      .select({ id: flowchartVersions.id })
      .from(flowchartVersions)
      .where(eq(flowchartVersions.flowchartId, flowchartId))
      .orderBy(desc(flowchartVersions.createdAt));

    const overflowIds = existing.slice(100).map((row) => row.id);
    if (overflowIds.length > 0) {
      await tx.delete(flowchartVersions).where(inArray(flowchartVersions.id, overflowIds));
    }

    return created;
  });

  return c.json({ version: serializeFlowchartVersion(version) }, 201);
});

flowchartsRouter.get("/:id/versions", async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");

  const rows = await db
    .select()
    .from(flowchartVersions)
    .where(eq(flowchartVersions.flowchartId, flowchartId))
    .orderBy(desc(flowchartVersions.createdAt));

  return c.json({ versions: rows.map(serializeFlowchartVersionSummary) });
});

flowchartsRouter.get("/:id/versions/:versionId", async (c) => {
  const flowchartId = c.req.param("id");
  const versionId = c.req.param("versionId");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");

  const [version] = await db
    .select()
    .from(flowchartVersions)
    .where(and(eq(flowchartVersions.id, versionId), eq(flowchartVersions.flowchartId, flowchartId)))
    .limit(1);

  if (!version) {
    throw new HTTPException(404, { message: "Version not found" });
  }

  return c.json({ version: serializeFlowchartVersion(version) });
});

flowchartsRouter.post("/:id/versions/:versionId/restore", async (c) => {
  const flowchartId = c.req.param("id");
  const versionId = c.req.param("versionId");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");

  const restoredFlowchart = await db.transaction(async (tx) => {
    const [flowchart] = await tx
      .select()
      .from(flowcharts)
      .where(and(eq(flowcharts.id, flowchartId), eq(flowcharts.workspaceId, workspaceId)))
      .limit(1);

    if (!flowchart) {
      throw new HTTPException(404, { message: "Flowchart not found" });
    }

    const [version] = await tx
      .select()
      .from(flowchartVersions)
      .where(and(eq(flowchartVersions.id, versionId), eq(flowchartVersions.flowchartId, flowchartId)))
      .limit(1);

    if (!version) {
      throw new HTTPException(404, { message: "Version not found" });
    }

    await tx.insert(flowchartVersions).values({
      flowchartId,
      snapshot: normalizeCanvasState(flowchart.canvasState),
      label: "Before restore",
      createdBy: userId,
    });

    const [updated] = await tx
      .update(flowcharts)
      .set({
        canvasState: normalizeCanvasState(version.snapshot),
        updatedAt: new Date(),
      })
      .where(eq(flowcharts.id, flowchartId))
      .returning();

    if (!updated) {
      throw new HTTPException(404, { message: "Flowchart not found" });
    }

    await tx.delete(flowchartNodes).where(eq(flowchartNodes.flowchartId, flowchartId));
    const restoredCanvas = normalizeCanvasState(version.snapshot);
    const referencedNodes = restoredCanvas.nodes
      .filter((node) => node.data.type === "task_card" || node.data.type === "idea_card")
      .map((node) => ({
        flowchartId,
        nodeType: node.data.type,
        taskId: node.data.type === "task_card" && node.data.taskId ? node.data.taskId : null,
        ideaId: node.data.type === "idea_card" && node.data.ideaId ? node.data.ideaId : null,
        x: node.position.x,
        y: node.position.y,
        width: node.width ?? 200,
        height: node.height ?? 80,
      }));

    if (referencedNodes.length > 0) {
      await tx.insert(flowchartNodes).values(referencedNodes);
    }

    return updated;
  });

  return c.json({ flowchart: serializeFlowchart(restoredFlowchart) });
});

flowchartsRouter.get("/:id/comments", async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");
  const rows = await getCommentRows(flowchartId);

  return c.json({ comments: nestComments(rows.map(serializeComment)) });
});

flowchartsRouter.post("/:id/comments", zValidator("json", createCommentSchema), async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const payload = c.req.valid("json");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");

  if (payload.parentId) {
    const [parent] = await db
      .select({ id: flowchartComments.id })
      .from(flowchartComments)
      .where(and(eq(flowchartComments.id, payload.parentId), eq(flowchartComments.flowchartId, flowchartId)))
      .limit(1);

    if (!parent) {
      throw new HTTPException(404, { message: "Parent comment not found" });
    }
  }

  const [created] = await db
    .insert(flowchartComments)
    .values({
      flowchartId,
      parentId: payload.parentId ?? null,
      authorId: userId,
      content: payload.content,
      x: payload.x,
      y: payload.y,
    })
    .returning();

  const [author] = await db
    .select({
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return c.json({
    comment: serializeComment({
      comment: created,
      authorName: author?.fullName ?? null,
      authorAvatar: author?.avatarUrl ?? null,
    }),
  }, 201);
});

flowchartsRouter.delete("/:id/comments/:commentId", async (c) => {
  const flowchartId = c.req.param("id");
  const commentId = c.req.param("commentId");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const workspaceRole = c.get("workspaceRole");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");

  const [comment] = await db
    .select()
    .from(flowchartComments)
    .where(and(eq(flowchartComments.id, commentId), eq(flowchartComments.flowchartId, flowchartId)))
    .limit(1);

  if (!comment) {
    throw new HTTPException(404, { message: "Comment not found" });
  }

  const isPrivileged = workspaceRole === "admin" || workspaceRole === "owner";
  if (comment.authorId !== userId && !isPrivileged) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  await db.delete(flowchartComments).where(eq(flowchartComments.id, commentId));
  return c.json({ ok: true });
});

flowchartsRouter.put("/:id/comments/:commentId/resolve", async (c) => {
  const flowchartId = c.req.param("id");
  const commentId = c.req.param("commentId");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const workspaceRole = c.get("workspaceRole");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");

  const [existing] = await db
    .select()
    .from(flowchartComments)
    .where(and(eq(flowchartComments.id, commentId), eq(flowchartComments.flowchartId, flowchartId)))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: "Comment not found" });
  }

  const isPrivileged = workspaceRole === "admin" || workspaceRole === "owner";
  if (existing.authorId !== userId && !isPrivileged) {
    await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");
  }

  const [updated] = await db
    .update(flowchartComments)
    .set({
      resolved: !existing.resolved,
      updatedAt: new Date(),
    })
    .where(eq(flowchartComments.id, commentId))
    .returning();

  const [author] = await db
    .select({
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, updated.authorId))
    .limit(1);

  return c.json({
    comment: serializeComment({
      comment: updated,
      authorName: author?.fullName ?? null,
      authorAvatar: author?.avatarUrl ?? null,
    }),
  });
});

flowchartsRouter.post("/:id/images", async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new HTTPException(422, { message: "Validation failed" });
  }

  const arrayBuffer = await file.arrayBuffer();
  const compressedBuffer = await sharp(Buffer.from(arrayBuffer))
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const storageKey = `flowcharts/${flowchartId}/${crypto.randomUUID()}.webp`;
  try {
    await saveLocalFile(storageKey, compressedBuffer);
  } catch (error) {
    console.error("Flowchart image upload error", error);
    throw new HTTPException(500, { message: "Failed to upload image" });
  }

  return c.json({
    url: localFileUrl(storageKey),
    storageKey,
  }, 201);
});

flowchartsRouter.delete("/:id/images/:storageKey", async (c) => {
  const flowchartId = c.req.param("id");
  const rawStorageKey = c.req.param("storageKey");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "editor");

  const storageKey = decodeURIComponent(rawStorageKey);
  if (!storageKey.startsWith(`flowcharts/${flowchartId}/`)) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const flowchart = await getFlowchartById(flowchartId, workspaceId);
  const canvasState = normalizeCanvasState(flowchart.canvasState);
  const referenced = canvasState.nodes.some((node) => {
    return node.data.type === "image" && node.data.storageKey === storageKey;
  });

  if (!referenced) {
    throw new HTTPException(404, { message: "Image not found" });
  }

  try {
    await deleteLocalFile(storageKey);
  } catch (error) {
    console.error("Flowchart image delete error", error);
    throw new HTTPException(500, { message: "Failed to delete image" });
  }

  return c.json({ ok: true });
});

flowchartsRouter.get("/:id/export", zValidator("query", exportQuerySchema), async (c) => {
  const flowchartId = c.req.param("id");
  const userId = c.get("userId");
  const workspaceId = c.get("workspaceId");
  const query = c.req.valid("query");

  await assertFlowchartAccess(flowchartId, userId, workspaceId, "viewer");

  if (query.format !== "json") {
    throw new HTTPException(400, { message: "Only json export is supported by this endpoint" });
  }

  const flowchart = await getFlowchartById(flowchartId, workspaceId);
  const serialized = serializeFlowchart(flowchart);
  const fileName = `${serialized.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "flowchart"}.json`;

  c.header("Content-Type", "application/json; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="${fileName}"`);

  return c.body(JSON.stringify({ flowchart: serialized }, null, 2));
});

export default flowchartsRouter;
