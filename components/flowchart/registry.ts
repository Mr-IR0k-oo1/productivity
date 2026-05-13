import type { ComponentType } from "react";
import type { EdgeProps, NodeProps } from "@xyflow/react";

import OrbitEdgeComponent from "@/components/flowchart/edges/OrbitEdge";
import CodeNode from "@/components/flowchart/nodes/CodeNode";
import GroupNode from "@/components/flowchart/nodes/GroupNode";
import IdeaCardNode from "@/components/flowchart/nodes/IdeaCardNode";
import ImageNode from "@/components/flowchart/nodes/ImageNode";
import ShapeNode from "@/components/flowchart/nodes/ShapeNode";
import StickyNode from "@/components/flowchart/nodes/StickyNode";
import TaskCardNode from "@/components/flowchart/nodes/TaskCardNode";
import TextNode from "@/components/flowchart/nodes/TextNode";
import type { NodeType, OrbitEdge, OrbitNode } from "@/types/flowchart";

export const NODE_TYPES = {
  shape: ShapeNode,
  text: TextNode,
  sticky: StickyNode,
  image: ImageNode,
  task_card: TaskCardNode,
  idea_card: IdeaCardNode,
  group: GroupNode,
  code: CodeNode,
} as const satisfies Record<NodeType, ComponentType<NodeProps<OrbitNode>>>;

export const EDGE_TYPES = {
  orbit: OrbitEdgeComponent,
} as const satisfies Record<"orbit", ComponentType<EdgeProps<OrbitEdge>>>;
