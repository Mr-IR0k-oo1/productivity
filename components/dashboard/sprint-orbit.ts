import type { SprintDTO } from "@/hooks/useSprints";
import type { TaskDTO } from "@/hooks/useTasks";
import type { TaskStatus } from "@/types/task-status";

export type OrbitDot = {
  id: string;
  key: string | null;
  title: string;
  status: TaskStatus;
  /** Position on the ring in degrees, 0 at twelve o'clock, clockwise. */
  angle: number;
};

export type SprintOrbit = {
  sprint: SprintDTO;
  dots: OrbitDot[];
  counts: Record<TaskStatus, number>;
  /** Share of the sprint's calendar time that has passed, 0–1, or null without dates. */
  elapsed: number | null;
  /** Whole days until the end date (0 on the last day, negative once overdue), or null. */
  daysLeft: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Done work sits first on the ring, then review, in progress and to do, so progress reads clockwise. */
const STATUS_ORDER: TaskStatus[] = ["done", "review", "in_progress", "todo"];

export function pickActiveSprint(sprints: SprintDTO[]): SprintDTO | null {
  return sprints.find((sprint) => sprint.status === "active") ?? null;
}

export function buildSprintOrbit(
  sprint: SprintDTO,
  tasks: Pick<TaskDTO, "id" | "key" | "title" | "status" | "sprintId">[],
  now = new Date(),
): SprintOrbit {
  const issues = tasks
    .filter((task) => task.sprintId === sprint.id)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const step = issues.length > 0 ? 360 / issues.length : 0;
  const dots = issues.map((task, index) => ({
    id: task.id,
    key: task.key ?? null,
    title: task.title,
    status: task.status,
    angle: index * step,
  }));

  const counts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
  for (const task of issues) counts[task.status] += 1;

  const start = sprint.startDate ? new Date(sprint.startDate).getTime() : NaN;
  const end = sprint.endDate ? new Date(sprint.endDate).getTime() : NaN;

  let elapsed: number | null = null;
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    elapsed = Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
  }

  let daysLeft: number | null = null;
  if (Number.isFinite(end)) {
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    daysLeft = Math.round((endDay.getTime() - today.getTime()) / DAY_MS);
  }

  return { sprint, dots, counts, elapsed, daysLeft };
}

/** Point on a circle for an angle measured clockwise from twelve o'clock. */
export function polar(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) };
}

export function describeDaysLeft(daysLeft: number | null): string {
  if (daysLeft === null) return "No end date";
  if (daysLeft < 0) return `Ended ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? "day" : "days"} ago`;
  if (daysLeft === 0) return "Ends today";
  return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
}
