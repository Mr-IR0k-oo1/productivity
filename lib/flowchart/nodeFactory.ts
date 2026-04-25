import {
  DEFAULT_CODE_DATA,
  DEFAULT_GROUP_DATA,
  DEFAULT_IDEA_CARD_DATA,
  DEFAULT_IMAGE_DATA,
  DEFAULT_NODE_SIZE,
  DEFAULT_SHAPE_DATA,
  DEFAULT_STICKY_DATA,
  DEFAULT_TASK_CARD_DATA,
  DEFAULT_TEXT_DATA,
} from "@/lib/flowchart/constants";
import type { OrbitNode, OrbitNodeData, ShapeVariant } from "@/types/flowchart";

type FactoryTool =
  | "shape"
  | "text"
  | "sticky"
  | "image"
  | "task_card"
  | "idea_card"
  | "group"
  | "code";

function buildNode(type: OrbitNode["type"], position: { x: number; y: number }, data: OrbitNodeData): OrbitNode {
  const size = DEFAULT_NODE_SIZE[type];

  return {
    id: crypto.randomUUID(),
    type,
    position,
    data,
    width: size.width,
    height: size.height,
  };
}

export function createNodeForTool(
  tool: FactoryTool,
  position: { x: number; y: number },
  options: { activeShapeVariant: ShapeVariant; authorId: string | null; authorName: string | null },
): OrbitNode {
  if (tool === "shape") {
    return buildNode("shape", position, {
      ...DEFAULT_SHAPE_DATA,
      variant: options.activeShapeVariant,
    });
  }

  if (tool === "text") {
    return buildNode("text", position, DEFAULT_TEXT_DATA);
  }

  if (tool === "sticky") {
    return buildNode("sticky", position, {
      ...DEFAULT_STICKY_DATA,
      authorId: options.authorId ?? "",
      authorName: options.authorName ?? "You",
    });
  }

  if (tool === "image") {
    return buildNode("image", position, DEFAULT_IMAGE_DATA);
  }

  if (tool === "task_card") {
    return buildNode("task_card", position, DEFAULT_TASK_CARD_DATA);
  }

  if (tool === "idea_card") {
    return buildNode("idea_card", position, DEFAULT_IDEA_CARD_DATA);
  }

  if (tool === "group") {
    return buildNode("group", position, DEFAULT_GROUP_DATA);
  }

  return buildNode("code", position, DEFAULT_CODE_DATA);
}
