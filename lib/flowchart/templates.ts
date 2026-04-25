import type { CanvasState, DiagramType, OrbitEdge, OrbitNode, OrbitNodeData, NodeType } from "@/types/flowchart";
import {
  DEFAULT_CANVAS_STATE,
  DEFAULT_EDGE_DATA,
  DEFAULT_GROUP_DATA,
  DEFAULT_NODE_SIZE,
  DEFAULT_SHAPE_DATA,
  DEFAULT_TASK_CARD_DATA,
  DEFAULT_TEXT_DATA,
} from "@/lib/flowchart/constants";

function createNode<TData extends OrbitNodeData>(
  type: NodeType,
  position: { x: number; y: number },
  data: TData,
  size: { width: number; height: number },
): OrbitNode {
  return {
    id: crypto.randomUUID(),
    type,
    position,
    data,
    width: size.width,
    height: size.height,
  };
}

function createEdge(source: string, target: string, label = ""): OrbitEdge {
  return {
    id: crypto.randomUUID(),
    source,
    target,
    type: "orbit",
    data: { ...DEFAULT_EDGE_DATA, label },
  };
}

export function buildTemplateCanvas(diagramType: DiagramType | null): CanvasState {
  if (!diagramType) {
    return { ...DEFAULT_CANVAS_STATE, viewport: { ...DEFAULT_CANVAS_STATE.viewport } };
  }

  if (diagramType === "flowchart") {
    const start = createNode(
      "shape",
      { x: 80, y: 60 },
      { ...DEFAULT_SHAPE_DATA, label: "Start", variant: "rounded_rect" },
      DEFAULT_NODE_SIZE.shape,
    );
    const stepOne = createNode(
      "shape",
      { x: 80, y: 180 },
      { ...DEFAULT_SHAPE_DATA, label: "Process A" },
      DEFAULT_NODE_SIZE.shape,
    );
    const stepTwo = createNode(
      "shape",
      { x: 80, y: 300 },
      { ...DEFAULT_SHAPE_DATA, label: "Process B" },
      DEFAULT_NODE_SIZE.shape,
    );

    return {
      nodes: [start, stepOne, stepTwo],
      edges: [createEdge(start.id, stepOne.id), createEdge(stepOne.id, stepTwo.id)],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  }

  if (diagramType === "mindmap") {
    const center = createNode(
      "text",
      { x: 260, y: 180 },
      { ...DEFAULT_TEXT_DATA, content: "Main Idea", fontSize: 24, textAlign: "center" },
      DEFAULT_NODE_SIZE.text,
    );
    const satellites = [
      createNode("shape", { x: 60, y: 60 }, { ...DEFAULT_SHAPE_DATA, label: "Branch 1" }, DEFAULT_NODE_SIZE.shape),
      createNode("shape", { x: 460, y: 60 }, { ...DEFAULT_SHAPE_DATA, label: "Branch 2" }, DEFAULT_NODE_SIZE.shape),
      createNode("shape", { x: 60, y: 300 }, { ...DEFAULT_SHAPE_DATA, label: "Branch 3" }, DEFAULT_NODE_SIZE.shape),
      createNode("shape", { x: 460, y: 300 }, { ...DEFAULT_SHAPE_DATA, label: "Branch 4" }, DEFAULT_NODE_SIZE.shape),
    ];

    return {
      nodes: [center, ...satellites],
      edges: satellites.map((node) => createEdge(center.id, node.id)),
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  }

  if (diagramType === "er") {
    return {
      nodes: [
        createNode("group", { x: 40, y: 80 }, { ...DEFAULT_GROUP_DATA, label: "Entity1" }, DEFAULT_NODE_SIZE.group),
        createNode("group", { x: 520, y: 80 }, { ...DEFAULT_GROUP_DATA, label: "Entity2" }, DEFAULT_NODE_SIZE.group),
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 0.9 },
    };
  }

  if (diagramType === "orgchart") {
    const root = createNode(
      "task_card",
      { x: 260, y: 40 },
      { ...DEFAULT_TASK_CARD_DATA, taskTitle: "Leader" },
      DEFAULT_NODE_SIZE.task_card,
    );
    const childOne = createNode(
      "task_card",
      { x: 80, y: 220 },
      { ...DEFAULT_TASK_CARD_DATA, taskTitle: "Team A" },
      DEFAULT_NODE_SIZE.task_card,
    );
    const childTwo = createNode(
      "task_card",
      { x: 440, y: 220 },
      { ...DEFAULT_TASK_CARD_DATA, taskTitle: "Team B" },
      DEFAULT_NODE_SIZE.task_card,
    );

    return {
      nodes: [root, childOne, childTwo],
      edges: [createEdge(root.id, childOne.id), createEdge(root.id, childTwo.id)],
      viewport: { x: 0, y: 0, zoom: 0.95 },
    };
  }

  if (diagramType === "swimlane" || diagramType === "kanban") {
    const labels = ["Backlog", "In Progress", "Done"] as const;
    const lanes = labels.map((label, index) =>
      createNode(
        "group",
        { x: 40 + index * 420, y: 40 },
        { ...DEFAULT_GROUP_DATA, label },
        DEFAULT_NODE_SIZE.group,
      ),
    );

    const tasks =
      diagramType === "kanban"
        ? [
            createNode(
              "task_card",
              { x: 70, y: 90 },
              { ...DEFAULT_TASK_CARD_DATA, taskTitle: "Card 1" },
              DEFAULT_NODE_SIZE.task_card,
            ),
            createNode(
              "task_card",
              { x: 70, y: 210 },
              { ...DEFAULT_TASK_CARD_DATA, taskTitle: "Card 2" },
              DEFAULT_NODE_SIZE.task_card,
            ),
          ]
        : [];

    return {
      nodes: [...lanes, ...tasks],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 0.8 },
    };
  }

  return { ...DEFAULT_CANVAS_STATE, viewport: { ...DEFAULT_CANVAS_STATE.viewport } };
}
