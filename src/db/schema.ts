import {
  AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { taskStatusValues } from "@/types/task-status";

export const memberRoleValues = ["owner", "admin", "member", "viewer"] as const;
export const memberRoleEnum = pgEnum("member_role", memberRoleValues);
export const taskStatusEnum = pgEnum("task_status", taskStatusValues);
export const ideaStatusEnum = pgEnum("idea_status", ["draft", "validated", "archived", "converted"]);
export const issueTypeValues = ["epic", "story", "task", "bug"] as const;
export const issueTypeEnum = pgEnum("issue_type", issueTypeValues);
export const sprintStatusValues = ["planned", "active", "completed"] as const;
export const sprintStatusEnum = pgEnum("sprint_status", sprintStatusValues);
export const canvasModeEnum = pgEnum("canvas_mode", ["infinite", "page"]);
export const pageSizeEnum = pgEnum("page_size", ["a4", "letter", "custom"]);
export const nodeTypeEnum = pgEnum("node_type", ["shape", "text", "sticky", "image", "task_card", "idea_card", "group", "code"]);
export const shapeVariantEnum = pgEnum("shape_variant", ["rectangle", "diamond", "circle", "parallelogram", "rounded_rect"]);
export const edgeStyleEnum = pgEnum("edge_style", ["straight", "curved", "orthogonal"]);
export const lineStyleEnum = pgEnum("line_style", ["solid", "dashed", "dotted"]);
export const arrowTypeEnum = pgEnum("arrow_type", ["none", "open", "filled"]);
export const portEnum = pgEnum("port", ["top", "right", "bottom", "left", "custom"]);
export const accessRoleEnum = pgEnum("fc_access_role", ["viewer", "editor", "owner"]);

const defaultCanvasState = {
  nodes: [],
  edges: [],
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: uuid("auth_user_id").notNull().unique(),
    fullName: varchar("full_name", { length: 120 }),
    jobTitle: varchar("job_title", { length: 120 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    authUserIdIdx: index("idx_users_auth_user_id").on(table.authUserId),
  }),
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    // Issue keys are `${issueKeyPrefix}-${tasks.number}`, e.g. ORB-42.
    issueKeyPrefix: varchar("issue_key_prefix", { length: 10 }).default("ORB").notNull(),
    issueCounter: integer("issue_counter").default(0).notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("idx_workspaces_slug").on(table.slug),
    ownerIdIdx: index("idx_workspaces_owner_id").on(table.ownerId),
  }),
);

export const workspaceSettings = pgTable("workspace_settings", {
  workspaceId: uuid("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  settings: jsonb("settings").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("member").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
    memberWorkspaceIdx: index("workspace_members_workspace_idx").on(table.workspaceId),
    memberUserIdx: index("idx_workspace_members_user_id").on(table.userId),
  }),
);

export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    summary: text("summary"),
    content: jsonb("content"),
    votes: integer("votes").default(0).notNull(),
    status: ideaStatusEnum("status").default("draft").notNull(),
    convertedTaskId: uuid("converted_task_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("ideas_workspace_idx").on(table.workspaceId),
    authorIdx: index("ideas_author_idx").on(table.authorId),
  }),
);

export const ideaDependencies = pgTable(
  "idea_dependencies",
  {
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    dependsOnIdeaId: uuid("depends_on_idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ideaId, table.dependsOnIdeaId] }),
    dependsOnIdx: index("idx_idea_dependencies_depends_on").on(table.dependsOnIdeaId),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    number: integer("number"),
    issueType: issueTypeEnum("issue_type").default("task").notNull(),
    // Epic (or other parent issue) this issue rolls up into.
    parentId: uuid("parent_id").references((): AnyPgColumn => tasks.id, { onDelete: "set null" }),
    sprintId: uuid("sprint_id").references((): AnyPgColumn => sprints.id, { onDelete: "set null" }),
    storyPoints: integer("story_points"),
    title: varchar("title", { length: 200 }).notNull(),
    description: jsonb("description"),
    status: taskStatusEnum("status").default("todo").notNull(),
    priority: integer("priority").default(2).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    position: integer("position").default(0).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceStatusIdx: index("tasks_workspace_status_idx").on(table.workspaceId, table.status),
    assigneeIdx: index("tasks_assignee_idx").on(table.assigneeId),
    dueDateIdx: index("idx_tasks_due_date").on(table.dueDate),
    workspaceCreatorIdx: index("idx_tasks_workspace_creator").on(table.workspaceId, table.creatorId),
    projectIdIdx: index("idx_tasks_project_id").on(table.projectId),
    sprintIdx: index("idx_tasks_sprint_id").on(table.sprintId),
    parentIdx: index("idx_tasks_parent_id").on(table.parentId),
    workspaceNumberUnique: unique("tasks_workspace_number_unique").on(table.workspaceId, table.number),
  }),
);

export const sprints = pgTable(
  "sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    goal: text("goal"),
    status: sprintStatusEnum("status").default("planned").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    // Story points in the sprint at the moment it started; the burndown starts from here.
    committedPoints: integer("committed_points"),
    completedPoints: integer("completed_points"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceStatusIdx: index("sprints_workspace_status_idx").on(table.workspaceId, table.status),
  }),
);

export const subtasks = pgTable(
  "subtasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    isDone: boolean("is_done").default(false).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    taskIdx: index("subtasks_task_idx").on(table.taskId),
  }),
);

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.dependsOnTaskId] }),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }), // for threading
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    taskIdIdx: index("idx_comments_task_id").on(table.taskId),
    ideaIdIdx: index("idx_comments_idea_id").on(table.ideaId),
    parentIdIdx: index("idx_comments_parent_id").on(table.parentId),
  }),
);

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const timesheets = pgTable(
  "timesheets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceUserIdx: index("timesheets_workspace_user_idx").on(table.workspaceId, table.userId),
  }),
);

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    timesheetId: uuid("timesheet_id").references(() => timesheets.id, { onDelete: "set null" }),
    description: text("description"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    isRunning: boolean("is_running").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceUserIdx: index("time_entries_workspace_user_idx").on(table.workspaceId, table.userId),
    userIdIdx: index("idx_time_entries_user_id").on(table.userId),
    taskIdIdx: index("idx_time_entries_task_id").on(table.taskId),
    workspacePeriodIdx: index("idx_time_entries_workspace_period").on(table.workspaceId, table.startedAt),
  }),
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    kind: varchar("kind", { length: 30 }), // meeting, focus, deadline, review, travel
    project: varchar("project", { length: 200 }),
    location: varchar("location", { length: 150 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceStartIdx: index("calendar_events_workspace_start_idx").on(table.workspaceId, table.startsAt),
    creatorIdx: index("idx_calendar_events_creator").on(table.creatorId),
    kindIdx: index("idx_calendar_events_kind").on(table.kind),
  }),
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: uuid("entity_id"),
    action: varchar("action", { length: 100 }).notNull(),
    payload: jsonb("payload").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("activity_log_workspace_idx").on(table.workspaceId),
    entityIdx: index("idx_activity_log_workspace_entity").on(table.workspaceId, table.entityType, table.entityId),
    actorIdIdx: index("idx_activity_log_actor_id").on(table.actorId),
    createdAtIdx: index("idx_activity_log_created_at").on(table.createdAt),
  }),
);

export const flowcharts = pgTable(
  "flowcharts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled flowchart"),
    description: text("description"),
    mode: canvasModeEnum("mode").notNull().default("infinite"),
    pageSize: pageSizeEnum("page_size"),
    pageWidth: real("page_width"),
    pageHeight: real("page_height"),
    diagramType: text("diagram_type"),
    canvasState: jsonb("canvas_state").default(defaultCanvasState).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    isPublic: boolean("is_public").default(false).notNull(),
    publicToken: text("public_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("flowcharts_workspace_idx").on(table.workspaceId),
    ownerIdx: index("flowcharts_owner_idx").on(table.ownerId),
  }),
);

export const flowchartNodes = pgTable(
  "flowchart_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flowchartId: uuid("flowchart_id")
      .notNull()
      .references(() => flowcharts.id, { onDelete: "cascade" }),
    nodeType: nodeTypeEnum("node_type").notNull(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "set null" }),
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),
    width: real("width").notNull().default(200),
    height: real("height").notNull().default(80),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    flowchartIdx: index("fc_nodes_flowchart_idx").on(table.flowchartId),
    taskIdx: index("fc_nodes_task_idx").on(table.taskId),
    ideaIdx: index("fc_nodes_idea_idx").on(table.ideaId),
  }),
);

export const flowchartVersions = pgTable(
  "flowchart_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flowchartId: uuid("flowchart_id")
      .notNull()
      .references(() => flowcharts.id, { onDelete: "cascade" }),
    snapshot: jsonb("snapshot").notNull(),
    label: text("label"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    flowchartIdx: index("fc_versions_flowchart_idx").on(table.flowchartId),
  }),
);

export const flowchartComments = pgTable(
  "flowchart_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flowchartId: uuid("flowchart_id")
      .notNull()
      .references(() => flowcharts.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => flowchartComments.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    x: real("x").notNull(),
    y: real("y").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    flowchartIdx: index("fc_comments_flowchart_idx").on(table.flowchartId),
  }),
);

export const flowchartAccess = pgTable(
  "flowchart_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flowchartId: uuid("flowchart_id")
      .notNull()
      .references(() => flowcharts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: accessRoleEnum("role").notNull().default("viewer"),
    grantedBy: uuid("granted_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserAccess: unique("fc_access_unique").on(table.flowchartId, table.userId),
    flowchartIdx: index("fc_access_flowchart_idx").on(table.flowchartId),
    userIdx: index("fc_access_user_idx").on(table.userId),
  }),
);

// API keys: each belongs to one user in one workspace and acts with that user's role,
// narrowed by its scope. Only a SHA-256 hash of the key is stored.
export const apiKeyScopeValues = ["read", "write"] as const;
export const apiKeyScopeEnum = pgEnum("api_key_scope", apiKeyScopeValues);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    /** First characters of the key, shown in the UI so people can tell keys apart. */
    prefix: varchar("prefix", { length: 16 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    scope: apiKeyScopeEnum("scope").default("read").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    keyHashIdx: uniqueIndex("idx_api_keys_key_hash").on(table.keyHash),
    workspaceUserIdx: index("idx_api_keys_workspace_user").on(table.workspaceId, table.userId),
  }),
);

// ==================== NEW TABLES ====================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // mention, assignment, comment, deadline, etc.
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    link: text("link"), // navigation path
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_notifications_user_id").on(table.userId, table.isRead),
    workspaceIdIdx: index("idx_notifications_workspace_id").on(table.workspaceId),
    createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 30 }).default("active").notNull(), // active, completed, archived
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdIdx: index("idx_projects_workspace_id").on(table.workspaceId),
    statusIdx: index("idx_projects_status").on(table.status),
  }),
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 20 }), // hex color code
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdIdx: index("idx_tags_workspace_id").on(table.workspaceId),
    nameIdx: index("idx_tags_name").on(table.workspaceId, table.name),
  }),
);

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.tagId] }),
    tagIdIdx: index("idx_task_tags_tag_id").on(table.tagId),
  }),
);

export const ideaVotes = pgTable(
  "idea_votes",
  {
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ideaId, table.userId] }),
    ideaIdx: index("idx_idea_votes_idea_id").on(table.ideaId),
    userIdx: index("idx_idea_votes_user_id").on(table.userId),
  }),
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 30 }).notNull(), // comment, task, idea
    entityId: uuid("entity_id").notNull(),
    emoji: varchar("emoji", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    entityIdIdx: index("idx_reactions_entity").on(table.entityType, table.entityId),
    userIdIdx: index("idx_reactions_user_id").on(table.userId),
    uniqueReaction: index("idx_unique_reaction").on(table.entityType, table.entityId, table.userId, table.emoji),
  }),
);

// ===== Former login tables (login was removed; kept so existing rows are not dropped) =====
// Field names follow Better Auth's core schema. ids are UUIDs so users.authUserId can reference them.

export const authUsers = pgTable("auth_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("auth_sessions_user_idx").on(table.userId),
  }),
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("auth_accounts_user_idx").on(table.userId),
  }),
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    identifierIdx: index("auth_verifications_identifier_idx").on(table.identifier),
  }),
);

// Pending invitations for people who don't have an account yet; accepted on sign-up.
export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: memberRoleEnum("role").default("member").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceEmailUnique: unique("workspace_invites_workspace_email_unique").on(table.workspaceId, table.email),
    emailIdx: index("workspace_invites_email_idx").on(table.email),
  }),
);
