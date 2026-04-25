import { z } from "zod";

import type { FlowchartComment } from "@/types/flowchart";

export const canvasModeSchema = z.enum(["infinite", "page"]);
export const pageSizeSchema = z.enum(["a4", "letter", "custom"]);
export const nodeTypeSchema = z.enum(["shape", "text", "sticky", "image", "task_card", "idea_card", "group", "code"]);
export const shapeVariantSchema = z.enum(["rectangle", "diamond", "circle", "parallelogram", "rounded_rect"]);
export const edgeStyleSchema = z.enum(["straight", "curved", "orthogonal"]);
export const lineStyleSchema = z.enum(["solid", "dashed", "dotted"]);
export const arrowTypeSchema = z.enum(["none", "open", "filled"]);
export const stickyColorSchema = z.enum(["yellow", "pink", "blue", "green", "lavender"]);
export const diagramTypeSchema = z.enum(["flowchart", "mindmap", "er", "orgchart", "swimlane", "kanban"]);
export const accessRoleSchema = z.enum(["viewer", "editor", "owner"]);

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

const shapeNodeDataSchema = z.object({
  type: z.literal("shape"),
  variant: shapeVariantSchema,
  label: z.string(),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number(),
  fontSize: z.number(),
  textAlign: z.enum(["left", "center", "right"]),
  locked: z.boolean(),
});

const textNodeDataSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
  fontSize: z.union([z.literal(12), z.literal(16), z.literal(24), z.literal(32)]),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(700)]),
  textAlign: z.enum(["left", "center", "right"]),
  color: z.string(),
  locked: z.boolean(),
});

const stickyNodeDataSchema = z.object({
  type: z.literal("sticky"),
  content: z.string(),
  color: stickyColorSchema,
  authorId: z.string(),
  authorName: z.string(),
  locked: z.boolean(),
});

const imageNodeDataSchema = z.object({
  type: z.literal("image"),
  url: z.string(),
  storageKey: z.string(),
  caption: z.string(),
  aspectRatio: z.number(),
  locked: z.boolean(),
});

const taskCardNodeDataSchema = z.object({
  type: z.literal("task_card"),
  taskId: z.string(),
  taskTitle: z.string(),
  taskStatus: z.string(),
  taskPriority: z.union([z.literal("critical"), z.literal("high"), z.literal("medium"), z.literal("low"), z.null()]),
  assigneeId: z.string().nullable(),
  assigneeName: z.string().nullable(),
  assigneeAvatar: z.string().nullable(),
  dueDate: z.string().nullable(),
  completionPct: z.number(),
  locked: z.boolean(),
});

const ideaCardNodeDataSchema = z.object({
  type: z.literal("idea_card"),
  ideaId: z.string(),
  ideaTitle: z.string(),
  ideaStatus: z.enum(["draft", "active", "archived", "converted"]),
  voteCount: z.number(),
  tags: z.array(z.string()),
  locked: z.boolean(),
});

const groupNodeDataSchema = z.object({
  type: z.literal("group"),
  label: z.string(),
  fillOpacity: z.number(),
  fill: z.string(),
  collapsed: z.boolean(),
  locked: z.boolean(),
});

const codeNodeDataSchema = z.object({
  type: z.literal("code"),
  code: z.string(),
  language: z.string(),
  showLineNumbers: z.boolean(),
  locked: z.boolean(),
});

const orbitNodeDataSchema = z.discriminatedUnion("type", [
  shapeNodeDataSchema,
  textNodeDataSchema,
  stickyNodeDataSchema,
  imageNodeDataSchema,
  taskCardNodeDataSchema,
  ideaCardNodeDataSchema,
  groupNodeDataSchema,
  codeNodeDataSchema,
]);

export const orbitNodeSchema = z
  .object({
    id: z.string(),
    type: nodeTypeSchema,
    position: positionSchema,
    data: orbitNodeDataSchema,
    width: z.number().optional(),
    height: z.number().optional(),
    selected: z.boolean().optional(),
    dragging: z.boolean().optional(),
    parentId: z.string().optional(),
    extent: z
      .union([z.literal("parent"), z.tuple([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number()])])])
      .optional(),
  })
  .passthrough();

export const orbitEdgeDataSchema = z.object({
  style: edgeStyleSchema,
  lineStyle: lineStyleSchema,
  color: z.string(),
  strokeWidth: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  label: z.string(),
  arrowStart: arrowTypeSchema,
  arrowEnd: arrowTypeSchema,
  autoRouted: z.boolean(),
  createsTaskDep: z.boolean(),
  waypoints: z.array(positionSchema).optional(),
});

export const orbitEdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional(),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
    selected: z.boolean().optional(),
    label: z.string().optional(),
    data: orbitEdgeDataSchema,
  })
  .passthrough();

export const canvasStateSchema = z.object({
  nodes: z.array(orbitNodeSchema),
  edges: z.array(orbitEdgeSchema),
  viewport: viewportSchema,
});

export const flowchartSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  mode: canvasModeSchema,
  pageSize: pageSizeSchema.nullable(),
  pageWidth: z.number().nullable(),
  pageHeight: z.number().nullable(),
  diagramType: diagramTypeSchema.nullable(),
  canvasState: canvasStateSchema,
  thumbnailUrl: z.string().nullable(),
  isPublic: z.boolean(),
  publicToken: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const flowchartVersionSchema = z.object({
  id: z.string(),
  flowchartId: z.string(),
  snapshot: canvasStateSchema,
  label: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
});

export const flowchartVersionSummarySchema = flowchartVersionSchema.omit({
  snapshot: true,
});

export const flowchartCommentSchema: z.ZodType<FlowchartComment> = z.lazy(() =>
  z.object({
    id: z.string(),
    flowchartId: z.string(),
    parentId: z.string().nullable(),
    authorId: z.string(),
    authorName: z.string(),
    authorAvatar: z.string().nullable(),
    content: z.string(),
    x: z.number(),
    y: z.number(),
    resolved: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    replies: z.array(flowchartCommentSchema).optional(),
  }),
);
