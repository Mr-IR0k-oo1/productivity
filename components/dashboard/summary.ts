import { buildSprintOrbit, pickActiveSprint } from "@/components/dashboard/sprint-orbit";
import type { SprintDTO } from "@/hooks/useSprints";
import type { TaskDTO } from "@/hooks/useTasks";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One plain sentence about today: what's due or late, and how long the sprint has left. */
export function summarizeDay(
  tasks: Pick<TaskDTO, "id" | "key" | "title" | "status" | "dueDate" | "assigneeId" | "sprintId">[],
  sprints: SprintDTO[],
  userId: string | null,
  now: Date,
): string {
  const open = tasks.filter((task) => task.status !== "done");
  const mine = userId ? open.filter((task) => task.assigneeId === userId) : [];
  const pool = mine.length > 0 ? mine : open;

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  let late = 0;
  let dueToday = 0;
  for (const task of pool) {
    if (!task.dueDate) continue;
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) continue;
    if (due < now) late += 1;
    else if (due <= endOfToday) dueToday += 1;
  }

  const parts: string[] = [];
  if (late > 0) parts.push(`${plural(late, "issue")} past due`);
  if (dueToday > 0) parts.push(`${dueToday} due today`);

  const sprint = pickActiveSprint(sprints);
  let sprintPart: string | null = null;
  if (sprint) {
    const { daysLeft } = buildSprintOrbit(sprint, [], now);
    if (daysLeft !== null && daysLeft > 0) sprintPart = `${sprint.name} ends in ${plural(daysLeft, "day")}`;
    else if (daysLeft === 0) sprintPart = `${sprint.name} ends today`;
    else if (daysLeft !== null) sprintPart = `${sprint.name} is past its end date`;
  }

  if (parts.length === 0) {
    const base = pool.length === 0 ? "Nothing open right now" : "Nothing due today";
    return sprintPart ? `${base}. ${sprintPart}.` : `${base}.`;
  }

  const sentence = parts.join(" and ");
  const capitalized = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return sprintPart ? `${capitalized}. ${sprintPart}.` : `${capitalized}.`;
}
