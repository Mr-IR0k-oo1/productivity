// Pure Scrum helpers shared by the API and the UI: issue keys, burndown and velocity.

const DAY_MS = 24 * 60 * 60 * 1000;
const ISSUE_KEY_PATTERN = /^([A-Z][A-Z0-9]{0,9})-(\d+)$/;

export function formatIssueKey(prefix: string, number: number | null | undefined) {
  return number ? `${prefix}-${number}` : null;
}

export function parseIssueKey(input: string) {
  const match = ISSUE_KEY_PATTERN.exec(input.trim().toUpperCase());

  if (!match) {
    return null;
  }

  return { prefix: match[1], number: Number(match[2]) };
}

export function isValidIssueKeyPrefix(prefix: string) {
  return /^[A-Z][A-Z0-9]{0,9}$/.test(prefix);
}

type PointedIssue = { storyPoints: number | null };

export function sumStoryPoints(issues: PointedIssue[]) {
  return issues.reduce((total, issue) => total + (issue.storyPoints ?? 0), 0);
}

export type BurndownPoint = {
  date: string;
  ideal: number;
  remaining: number | null;
};

type BurndownSprint = {
  startDate: Date;
  endDate: Date;
  committedPoints: number;
};

type BurndownIssue = PointedIssue & { completedAt: Date | null };

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * One point per day from sprint start to end. `ideal` falls linearly from the committed
 * points to zero; `remaining` subtracts points completed by the end of each day and is
 * null for days that have not happened yet.
 */
export function buildBurndown(sprint: BurndownSprint, issues: BurndownIssue[], now = new Date()): BurndownPoint[] {
  const firstDay = startOfUtcDay(sprint.startDate);
  const lastDay = startOfUtcDay(sprint.endDate);
  const dayCount = Math.max(1, Math.round((lastDay.getTime() - firstDay.getTime()) / DAY_MS));
  const today = startOfUtcDay(now);
  const points: BurndownPoint[] = [];

  for (let day = 0; day <= dayCount; day += 1) {
    const date = new Date(firstDay.getTime() + day * DAY_MS);
    const endOfDay = new Date(date.getTime() + DAY_MS);
    const completed = sumStoryPoints(
      issues.filter((issue) => issue.completedAt !== null && issue.completedAt < endOfDay),
    );
    const ideal = sprint.committedPoints * (1 - day / dayCount);

    points.push({
      date: date.toISOString().slice(0, 10),
      ideal: Math.round(ideal * 10) / 10,
      remaining: date > today ? null : Math.max(0, sprint.committedPoints - completed),
    });
  }

  return points;
}

type VelocitySprint = {
  name: string;
  committedPoints: number | null;
  completedPoints: number | null;
};

export function computeVelocity(completedSprints: VelocitySprint[]) {
  const sprints = completedSprints.map((sprint) => ({
    name: sprint.name,
    committed: sprint.committedPoints ?? 0,
    completed: sprint.completedPoints ?? 0,
  }));
  const average = sprints.length
    ? Math.round((sprints.reduce((total, sprint) => total + sprint.completed, 0) / sprints.length) * 10) / 10
    : 0;

  return { sprints, average };
}
