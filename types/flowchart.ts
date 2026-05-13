import type { Edge, Node } from "@xyflow/react";

export type CanvasMode = "infinite" | "page";
export type NodeType =
  | "shape"
  | "text"
  | "sticky"
  | "image"
  | "task_card"
  | "idea_card"
  | "group"
  | "code";
export type ShapeVariant = "rectangle" | "diamond" | "circle" | "parallelogram" | "rounded_rect";
export type EdgeStyle = "straight" | "curved" | "orthogonal";
export type LineStyle = "solid" | "dashed" | "dotted";
export type ArrowType = "none" | "open" | "filled";
export type PortSide = "top" | "right" | "bottom" | "left";
export type StickyColor = "yellow" | "pink" | "blue" | "green" | "lavender";
export type DiagramType = "flowchart" | "mindmap" | "er" | "orgchart" | "swimlane" | "kanban";
export type AccessRole = "viewer" | "editor" | "owner";
export type PageSize = "a4" | "letter" | "custom";

export type ShapeNodeData = {
  type: "shape";
  variant: ShapeVariant;
  label: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  textAlign: "left" | "center" | "right";
  locked: boolean;
};

export type TextNodeData = {
  type: "text";
  content: string;
  fontSize: 12 | 16 | 24 | 32;
  fontWeight: 400 | 500 | 700;
  textAlign: "left" | "center" | "right";
  color: string;
  locked: boolean;
};

export type StickyNodeData = {
  type: "sticky";
  content: string;
  color: StickyColor;
  authorId: string;
  authorName: string;
  locked: boolean;
};

export type ImageNodeData = {
  type: "image";
  url: string;
  storageKey: string;
  caption: string;
  aspectRatio: number;
  locked: boolean;
};

export type TaskPriority = "critical" | "high" | "medium" | "low" | null;

export type TaskCardNodeData = {
  type: "task_card";
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  taskPriority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  dueDate: string | null;
  completionPct: number;
  locked: boolean;
};

export type IdeaCardNodeData = {
  type: "idea_card";
  ideaId: string;
  ideaTitle: string;
  ideaStatus: "draft" | "active" | "archived" | "converted";
  voteCount: number;
  tags: string[];
  locked: boolean;
};

export type GroupNodeData = {
  type: "group";
  label: string;
  fillOpacity: number;
  fill: string;
  collapsed: boolean;
  locked: boolean;
};

export type CodeNodeData = {
  type: "code";
  code: string;
  language: string;
  showLineNumbers: boolean;
  locked: boolean;
};

export type OrbitNodeData =
  | ShapeNodeData
  | TextNodeData
  | StickyNodeData
  | ImageNodeData
  | TaskCardNodeData
  | IdeaCardNodeData
  | GroupNodeData
  | CodeNodeData;

export type OrbitNode = Node<OrbitNodeData, NodeType>;

export type OrbitEdgeWaypoint = {
  x: number;
  y: number;
};

export type OrbitEdgeData = {
  style: EdgeStyle;
  lineStyle: LineStyle;
  color: string;
  strokeWidth: 1 | 2 | 3;
  label: string;
  arrowStart: ArrowType;
  arrowEnd: ArrowType;
  autoRouted: boolean;
  createsTaskDep: boolean;
  // Assumption: optional waypoints are stored in edge data to support client-side auto-routing.
  waypoints?: OrbitEdgeWaypoint[];
};

export type OrbitEdge = Edge<OrbitEdgeData>;

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasState = {
  nodes: OrbitNode[];
  edges: OrbitEdge[];
  viewport: Viewport;
};

export type CanvasOpType =
  | "NODE_ADD"
  | "NODE_UPDATE"
  | "NODE_DELETE"
  | "NODE_MOVE"
  | "EDGE_ADD"
  | "EDGE_UPDATE"
  | "EDGE_DELETE"
  | "VIEWPORT_CHANGE"
  | "CURSOR_MOVE"
  | "PRESENCE";

export type CanvasOp = {
  type: CanvasOpType;
  ts: number;
  userId: string;
  payload: unknown;
};

export type CursorPosition = {
  userId: string;
  userName: string;
  avatarColor: string;
  x: number;
  y: number;
};

export type Flowchart = {
  id: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  description: string | null;
  mode: CanvasMode;
  pageSize: PageSize | null;
  pageWidth: number | null;
  pageHeight: number | null;
  diagramType: DiagramType | null;
  canvasState: CanvasState;
  thumbnailUrl: string | null;
  isPublic: boolean;
  publicToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FlowchartVersion = {
  id: string;
  flowchartId: string;
  snapshot: CanvasState;
  label: string | null;
  createdBy: string;
  createdAt: string;
};

export type FlowchartVersionSummary = Omit<FlowchartVersion, "snapshot">;

export type FlowchartComment = {
  id: string;
  flowchartId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  x: number;
  y: number;
  resolved: boolean;
  createdAt: string;
  updatedAt?: string;
  replies?: FlowchartComment[];
};
