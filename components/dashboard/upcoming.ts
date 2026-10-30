import type { CalendarEventDTO } from "@/hooks/useCalendar";
import type { TaskDTO } from "@/hooks/useTasks";

export type UpcomingItem = {
  id: string;
  title: string;
  at: Date;
  type: "event" | "deadline";
  href: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar events and open issue due dates in the next `days`, soonest first. */
export function buildUpcoming(
  events: Pick<CalendarEventDTO, "id" | "title" | "startsAt">[],
  tasks: Pick<TaskDTO, "id" | "title" | "dueDate" | "status">[],
  now = new Date(),
  { days = 7, limit = 5 } = {},
): UpcomingItem[] {
  const end = now.getTime() + days * DAY_MS;
  const inWindow = (date: Date) => date.getTime() >= now.getTime() && date.getTime() <= end;

  const eventItems: UpcomingItem[] = events
    .map((event) => ({ id: `event-${event.id}`, title: event.title, at: new Date(event.startsAt), type: "event" as const, href: "/calendar" }))
    .filter((item) => inWindow(item.at));

  const deadlineItems: UpcomingItem[] = tasks
    .filter((task): task is typeof task & { dueDate: string } => Boolean(task.dueDate) && task.status !== "done")
    .map((task) => ({ id: `task-${task.id}`, title: task.title, at: new Date(task.dueDate), type: "deadline" as const, href: `/tasks?taskId=${task.id}` }))
    .filter((item) => inWindow(item.at));

  return [...eventItems, ...deadlineItems].sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, limit);
}
