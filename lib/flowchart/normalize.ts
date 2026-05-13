import { DEFAULT_CANVAS_STATE } from "@/lib/flowchart/constants";
import {
  canvasStateSchema,
  flowchartCommentSchema,
  flowchartSchema,
  flowchartVersionSchema,
  flowchartVersionSummarySchema,
  orbitEdgeSchema,
  orbitNodeSchema,
} from "@/lib/flowchart/schemas";
import type { CanvasState, Flowchart, FlowchartComment, FlowchartVersion, FlowchartVersionSummary } from "@/types/flowchart";

export function normalizeCanvasState(input: unknown): CanvasState {
  const parsed = canvasStateSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  const legacyObject =
    typeof input === "object" && input !== null
      ? input
      : {};

  const legacyNodes =
    "nodes" in legacyObject && Array.isArray((legacyObject as { nodes?: unknown[] }).nodes)
      ? (legacyObject as { nodes: unknown[] }).nodes
      : [];
  const legacyEdges =
    "edges" in legacyObject && Array.isArray((legacyObject as { edges?: unknown[] }).edges)
      ? (legacyObject as { edges: unknown[] }).edges
      : [];

  return {
    nodes: legacyNodes.filter((node): node is CanvasState["nodes"][number] => orbitNodeSchema.safeParse(node).success),
    edges: legacyEdges.filter((edge): edge is CanvasState["edges"][number] => orbitEdgeSchema.safeParse(edge).success),
    viewport: { ...DEFAULT_CANVAS_STATE.viewport },
  };
}

export function normalizeFlowchart(input: unknown): Flowchart {
  const candidate = typeof input === "object" && input !== null ? input : {};
  const flowchartInput = {
    ...candidate,
    canvasState: normalizeCanvasState((candidate as { canvasState?: unknown; data?: unknown }).canvasState ?? (candidate as { data?: unknown }).data),
    title:
      typeof (candidate as { title?: unknown }).title === "string"
        ? (candidate as { title: string }).title
        : typeof (candidate as { name?: unknown }).name === "string"
          ? (candidate as { name: string }).name
          : "Untitled flowchart",
    ownerId:
      typeof (candidate as { ownerId?: unknown }).ownerId === "string"
        ? (candidate as { ownerId: string }).ownerId
        : typeof (candidate as { creatorId?: unknown }).creatorId === "string"
          ? (candidate as { creatorId: string }).creatorId
          : "",
    diagramType:
      typeof (candidate as { diagramType?: unknown }).diagramType === "string"
        ? (candidate as { diagramType: Flowchart["diagramType"] }).diagramType
        : "flowchart",
  };

  const parsed = flowchartSchema.safeParse(flowchartInput);
  if (!parsed.success) {
    throw new Error("Invalid flowchart payload");
  }

  return parsed.data;
}

export function normalizeFlowchartVersion(input: unknown): FlowchartVersion {
  const parsed = flowchartVersionSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid flowchart version payload");
  }
  return parsed.data;
}

export function normalizeFlowchartVersionSummary(input: unknown): FlowchartVersionSummary {
  const parsed = flowchartVersionSummarySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid flowchart version summary payload");
  }
  return parsed.data;
}

export function normalizeFlowchartComment(input: unknown): FlowchartComment {
  const parsed = flowchartCommentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid flowchart comment payload");
  }
  return parsed.data;
}
