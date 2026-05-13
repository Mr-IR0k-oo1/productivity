export type TaskViewMetadata = {
  labels: string[];
  subtasksDone: number;
  subtasksTotal: number;
  comments: number;
  estimateHours: number;
  progress: number;
  recurring: boolean;
  dependency: string | null;
  startDate: string;
  isMilestone: boolean;
  assigneeName: string | null;
};

type TaskViewMetadataInput = Partial<TaskViewMetadata> & Record<string, unknown>;

function getIsoNow() {
  return new Date().toISOString();
}

function asFiniteNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

function asNonNegativeInteger(value: unknown, fallback: number) {
  return Math.max(0, Math.round(asFiniteNumber(value, fallback)));
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asTrimmedString(value: unknown, fallback: string | null = null) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeLabels(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  const seen = new Set<string>();
  const labels: string[] = [];

  for (const label of value) {
    if (typeof label !== "string") {
      continue;
    }

    const normalized = label.trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    labels.push(normalized);
  }

  return labels;
}

function normalizeDate(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? fallback : next.toISOString();
}

function createDefaultTaskViewMetadata(startDate = getIsoNow()): TaskViewMetadata {
  return {
    labels: [],
    subtasksDone: 0,
    subtasksTotal: 0,
    comments: 0,
    estimateHours: 0,
    progress: 0,
    recurring: false,
    dependency: null,
    startDate,
    isMilestone: false,
    assigneeName: null,
  };
}

function asMetadataInput(value: unknown): TaskViewMetadataInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as TaskViewMetadataInput;
}

export function normalizeTaskViewMetadata(
  input: unknown,
  fallback: Partial<TaskViewMetadata> = {},
): TaskViewMetadata {
  const defaultTaskViewMetadata = createDefaultTaskViewMetadata(
    typeof fallback.startDate === "string" ? fallback.startDate : getIsoNow(),
  );
  const source = asMetadataInput(input);
  const startDateFallback = fallback.startDate ?? defaultTaskViewMetadata.startDate;
  const labels = normalizeLabels(source.labels ?? fallback.labels ?? defaultTaskViewMetadata.labels);

  const subtasksTotal = asNonNegativeInteger(
    source.subtasksTotal ?? fallback.subtasksTotal,
    defaultTaskViewMetadata.subtasksTotal,
  );
  const subtasksDone = Math.min(
    subtasksTotal,
    asNonNegativeInteger(source.subtasksDone ?? fallback.subtasksDone, defaultTaskViewMetadata.subtasksDone),
  );

  return {
    labels,
    subtasksDone,
    subtasksTotal,
    comments: asNonNegativeInteger(source.comments ?? fallback.comments, defaultTaskViewMetadata.comments),
    estimateHours: asNonNegativeInteger(source.estimateHours ?? fallback.estimateHours, defaultTaskViewMetadata.estimateHours),
    progress: Math.max(
      0,
      Math.min(100, asNonNegativeInteger(source.progress ?? fallback.progress, defaultTaskViewMetadata.progress)),
    ),
    recurring: asBoolean(source.recurring ?? fallback.recurring, defaultTaskViewMetadata.recurring),
    dependency: asTrimmedString(source.dependency ?? fallback.dependency, null),
    startDate: normalizeDate(source.startDate ?? fallback.startDate, startDateFallback),
    isMilestone: asBoolean(source.isMilestone ?? fallback.isMilestone, defaultTaskViewMetadata.isMilestone),
    assigneeName: asTrimmedString(source.assigneeName ?? fallback.assigneeName, null),
  };
}

export function mergeTaskViewMetadata(
  current: unknown,
  patch: unknown,
  fallback: Partial<TaskViewMetadata> = {},
) {
  const currentNormalized = normalizeTaskViewMetadata(current, fallback);
  const patchObject = asMetadataInput(patch);

  return normalizeTaskViewMetadata(
    {
      ...currentNormalized,
      ...patchObject,
    },
    fallback,
  );
}
