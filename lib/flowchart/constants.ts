import type {
  CanvasState,
  CodeNodeData,
  GroupNodeData,
  IdeaCardNodeData,
  ImageNodeData,
  OrbitEdgeData,
  ShapeNodeData,
  StickyColor,
  StickyNodeData,
  TaskCardNodeData,
  TextNodeData,
} from "@/types/flowchart";

export const DEFAULT_VIEWPORT = {
  x: 0,
  y: 0,
  zoom: 1,
} as const;

export const DEFAULT_CANVAS_STATE: CanvasState = {
  nodes: [],
  edges: [],
  viewport: { ...DEFAULT_VIEWPORT },
};

export const DEFAULT_EDGE_DATA: OrbitEdgeData = {
  style: "curved",
  lineStyle: "solid",
  color: "var(--color-text-secondary)",
  strokeWidth: 1,
  label: "",
  arrowStart: "none",
  arrowEnd: "open",
  autoRouted: true,
  createsTaskDep: false,
};

export const DEFAULT_SHAPE_DATA: ShapeNodeData = {
  type: "shape",
  variant: "rectangle",
  label: "",
  fill: "var(--color-background-secondary)",
  stroke: "var(--color-border-secondary)",
  strokeWidth: 1,
  fontSize: 14,
  textAlign: "center",
  locked: false,
};

export const DEFAULT_TEXT_DATA: TextNodeData = {
  type: "text",
  content: "Text",
  fontSize: 16,
  fontWeight: 500,
  textAlign: "left",
  color: "var(--color-text-primary)",
  locked: false,
};

export const DEFAULT_STICKY_COLORS: Record<StickyColor, string> = {
  yellow: "#FEF3C7",
  pink: "#FCE7F3",
  blue: "#DBEAFE",
  green: "#D1FAE5",
  lavender: "#EDE9FE",
};

export const DEFAULT_STICKY_DATA: StickyNodeData = {
  type: "sticky",
  content: "New note",
  color: "yellow",
  authorId: "",
  authorName: "Unknown",
  locked: false,
};

export const DEFAULT_IMAGE_DATA: ImageNodeData = {
  type: "image",
  url: "",
  storageKey: "",
  caption: "",
  aspectRatio: 4 / 3,
  locked: false,
};

export const DEFAULT_TASK_CARD_DATA: TaskCardNodeData = {
  type: "task_card",
  taskId: "",
  taskTitle: "Linked task",
  taskStatus: "todo",
  taskPriority: null,
  assigneeId: null,
  assigneeName: null,
  assigneeAvatar: null,
  dueDate: null,
  completionPct: 0,
  locked: false,
};

export const DEFAULT_IDEA_CARD_DATA: IdeaCardNodeData = {
  type: "idea_card",
  ideaId: "",
  ideaTitle: "Linked idea",
  ideaStatus: "draft",
  voteCount: 0,
  tags: [],
  locked: false,
};

export const DEFAULT_GROUP_DATA: GroupNodeData = {
  type: "group",
  label: "Group",
  fillOpacity: 0.12,
  fill: "var(--color-background-secondary)",
  collapsed: false,
  locked: false,
};

export const DEFAULT_CODE_DATA: CodeNodeData = {
  type: "code",
  code: "const orbit = true;",
  language: "ts",
  showLineNumbers: true,
  locked: false,
};

export const DEFAULT_NODE_SIZE = {
  shape: { width: 160, height: 60 },
  text: { width: 200, height: 40 },
  sticky: { width: 200, height: 160 },
  image: { width: 240, height: 180 },
  task_card: { width: 240, height: 100 },
  idea_card: { width: 220, height: 90 },
  group: { width: 400, height: 300 },
  code: { width: 320, height: 200 },
} as const satisfies Record<
  "shape" | "text" | "sticky" | "image" | "task_card" | "idea_card" | "group" | "code",
  { width: number; height: number }
>;
