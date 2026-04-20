import { z } from "zod";

export const workspaceSettingsSectionKeys = [
  "general",
  "notifications",
  "tasks",
  "calendar",
  "reports",
  "integrations",
  "security",
  "appearance",
  "advanced",
] as const;

export type WorkspaceSettingsSectionKey = (typeof workspaceSettingsSectionKeys)[number];

const connectionStateSchema = z.enum(["connected", "disconnected"]);

const generalSettingsSchema = z.object({
  workspaceName: z.string().min(2).default("Orbit"),
  workspaceDescription: z.string().default("Execution stack for startup teams."),
  timezone: z.string().default("Asia/Kolkata"),
  dateFormat: z.enum(["12h", "24h"]).default("24h"),
  language: z.enum(["en", "ta", "hi"]).default("en"),
  theme: z.enum(["dark", "light"]).default("dark"),
  workspaceLogoDataUrl: z.string().nullable().default(null),
});

const notificationsSettingsSchema = z.object({
  taskAssigned: z.boolean().default(true),
  taskDueSoon: z.boolean().default(true),
  mentionedInComments: z.boolean().default(true),
  ideaConverted: z.boolean().default(true),
  weeklyDigest: z.boolean().default(false),
  inApp: z.boolean().default(true),
  push: z.boolean().default(false),
  slack: z.boolean().default(false),
  whatsapp: z.boolean().default(false),
});

const taskSettingsSchema = z.object({
  defaultTaskView: z.enum(["kanban", "list", "calendar"]).default("kanban"),
  defaultPriorityLevels: z.string().default("High, Medium, Low"),
  taskStatuses: z.string().default("To Do, In Progress, Review, Done"),
  recurringTaskTemplates: z.string().default("Daily Standup, Weekly Sprint Review"),
  notifyWhenCompleted: z.boolean().default(true),
  notifyWhenOverdue: z.boolean().default(true),
  enableBillableHours: z.boolean().default(true),
  defaultEstimateUnit: z.enum(["hours", "days"]).default("hours"),
});

const workingDaySchema = z.object({
  start: z.string().default("09:00"),
  end: z.string().default("18:00"),
});

const workingHoursSchema = z.object({
  Mon: workingDaySchema,
  Tue: workingDaySchema,
  Wed: workingDaySchema,
  Thu: workingDaySchema,
  Fri: workingDaySchema,
  Sat: workingDaySchema,
  Sun: workingDaySchema,
});

const calendarSettingsSchema = z.object({
  workingHours: workingHoursSchema.default({
    Mon: { start: "09:00", end: "18:00" },
    Tue: { start: "09:00", end: "18:00" },
    Wed: { start: "09:00", end: "18:00" },
    Thu: { start: "09:00", end: "18:00" },
    Fri: { start: "09:00", end: "18:00" },
    Sat: { start: "10:00", end: "14:00" },
    Sun: { start: "10:00", end: "14:00" },
  }),
  weekendHidden: z.boolean().default(true),
  timeOffTypes: z.string().default("Vacation, Sick, Personal"),
  googleCalendarSync: z.boolean().default(true),
  defaultEventDuration: z.enum(["30", "60"]).default("60"),
});

const reportsSettingsSchema = z.object({
  defaultReportPeriod: z.enum(["weekly", "monthly"]).default("weekly"),
  exportFormat: z.string().default("PDF, Excel, CSV"),
  showSensitiveData: z.boolean().default(true),
  dashboardWidgetPreferences: z.string().default("Total Tasks, Active Ideas, Hours Tracked, Completion Rate"),
});

const integrationsSettingsSchema = z.object({
  googleCalendar: connectionStateSchema.default("connected"),
  slack: connectionStateSchema.default("disconnected"),
  googleDrive: connectionStateSchema.default("disconnected"),
  zapier: connectionStateSchema.default("disconnected"),
  whatsappBusiness: connectionStateSchema.default("disconnected"),
});

const securitySettingsSchema = z.object({
  twoFactorAuthentication: z.boolean().default(false),
});

const appearanceSettingsSchema = z.object({
  workspaceColor: z.string().default("#22c55e"),
  sidebarDensity: z.enum(["compact", "normal"]).default("normal"),
  showActivityFeed: z.boolean().default(true),
  commandPaletteShortcuts: z.string().default("Ctrl+K"),
});

const advancedSettingsSchema = z.object({
  apiKey: z.string().default("pf_api_live_xxxxxxxxxxxxx"),
  webhookUrl: z.string().default("https://hooks.example.com/orbit"),
  webhookSecret: z.string().default("whsec_xxxxxx"),
  auditLog: z.string().default("Arun changed role from Member to Manager\nBala updated webhook settings"),
});

export const workspaceSettingsSchema = z.object({
  general: generalSettingsSchema,
  notifications: notificationsSettingsSchema,
  tasks: taskSettingsSchema,
  calendar: calendarSettingsSchema,
  reports: reportsSettingsSchema,
  integrations: integrationsSettingsSchema,
  security: securitySettingsSchema,
  appearance: appearanceSettingsSchema,
  advanced: advancedSettingsSchema,
});

export type WorkspaceSettingsDocument = z.infer<typeof workspaceSettingsSchema>;

export const defaultWorkspaceSettings: WorkspaceSettingsDocument = workspaceSettingsSchema.parse({});

export const workspaceSettingsPatchSchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("general"), data: generalSettingsSchema }),
  z.object({ section: z.literal("notifications"), data: notificationsSettingsSchema }),
  z.object({ section: z.literal("tasks"), data: taskSettingsSchema }),
  z.object({ section: z.literal("calendar"), data: calendarSettingsSchema }),
  z.object({ section: z.literal("reports"), data: reportsSettingsSchema }),
  z.object({ section: z.literal("integrations"), data: integrationsSettingsSchema }),
  z.object({ section: z.literal("security"), data: securitySettingsSchema }),
  z.object({ section: z.literal("appearance"), data: appearanceSettingsSchema }),
  z.object({ section: z.literal("advanced"), data: advancedSettingsSchema }),
]);

export type WorkspaceSettingsPatch = z.infer<typeof workspaceSettingsPatchSchema>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeWorkspaceSettings(raw: unknown, workspaceName?: string): WorkspaceSettingsDocument {
  const source = isPlainObject(raw) ? raw : {};
  const merged = {
    ...defaultWorkspaceSettings,
    ...source,
    general: {
      ...defaultWorkspaceSettings.general,
      ...(isPlainObject(source.general) ? source.general : {}),
      ...(workspaceName ? { workspaceName } : {}),
    },
    notifications: {
      ...defaultWorkspaceSettings.notifications,
      ...(isPlainObject(source.notifications) ? source.notifications : {}),
    },
    tasks: {
      ...defaultWorkspaceSettings.tasks,
      ...(isPlainObject(source.tasks) ? source.tasks : {}),
    },
    calendar: {
      ...defaultWorkspaceSettings.calendar,
      ...(isPlainObject(source.calendar) ? source.calendar : {}),
      workingHours: {
        ...defaultWorkspaceSettings.calendar.workingHours,
        ...(isPlainObject(source.calendar) && isPlainObject(source.calendar.workingHours) ? source.calendar.workingHours : {}),
      },
    },
    reports: {
      ...defaultWorkspaceSettings.reports,
      ...(isPlainObject(source.reports) ? source.reports : {}),
    },
    integrations: {
      ...defaultWorkspaceSettings.integrations,
      ...(isPlainObject(source.integrations) ? source.integrations : {}),
    },
    security: {
      ...defaultWorkspaceSettings.security,
      ...(isPlainObject(source.security) ? source.security : {}),
    },
    appearance: {
      ...defaultWorkspaceSettings.appearance,
      ...(isPlainObject(source.appearance) ? source.appearance : {}),
    },
    advanced: {
      ...defaultWorkspaceSettings.advanced,
      ...(isPlainObject(source.advanced) ? source.advanced : {}),
    },
  };

  return workspaceSettingsSchema.parse(merged);
}

export function updateWorkspaceSettingsDocument(
  current: WorkspaceSettingsDocument,
  patch: WorkspaceSettingsPatch,
  workspaceName?: string,
) {
  const next = { ...current };

  if (patch.section === "general") {
    next.general = {
      ...current.general,
      ...patch.data,
      ...(workspaceName ? { workspaceName } : {}),
    };
    return workspaceSettingsSchema.parse(next);
  }

  if (patch.section === "notifications") {
    next.notifications = { ...current.notifications, ...patch.data };
    return workspaceSettingsSchema.parse(next);
  }

  if (patch.section === "tasks") {
    next.tasks = { ...current.tasks, ...patch.data };
    return workspaceSettingsSchema.parse(next);
  }

  if (patch.section === "calendar") {
    next.calendar = { ...current.calendar, ...patch.data };
    return workspaceSettingsSchema.parse(next);
  }

  if (patch.section === "reports") {
    next.reports = { ...current.reports, ...patch.data };
    return workspaceSettingsSchema.parse(next);
  }

  if (patch.section === "integrations") {
    next.integrations = { ...current.integrations, ...patch.data };
    return workspaceSettingsSchema.parse(next);
  }

  if (patch.section === "security") {
    next.security = { ...current.security, ...patch.data };
    return workspaceSettingsSchema.parse(next);
  }

  if (patch.section === "appearance") {
    next.appearance = { ...current.appearance, ...patch.data };
    return workspaceSettingsSchema.parse(next);
  }

  next.advanced = { ...current.advanced, ...patch.data };
  return workspaceSettingsSchema.parse(next);
}

export function appendWorkspaceSettingsAuditEntry(settings: WorkspaceSettingsDocument, entry: string) {
  const entries = settings.advanced.auditLog
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const nextEntry = `[${new Date().toISOString()}] ${entry}`;

  return workspaceSettingsSchema.parse({
    ...settings,
    advanced: {
      ...settings.advanced,
      auditLog: [nextEntry, ...entries].slice(0, 25).join("\n"),
    },
  });
}

export function createWorkspaceSettingsDocument(workspaceName?: string) {
  return normalizeWorkspaceSettings({}, workspaceName);
}

export function generateWorkspaceSecret(prefix: string) {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomPart.replace(/-/g, "").slice(0, 24)}`;
}