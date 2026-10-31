import { describe, expect, it } from "vitest";

import { summarizeDay } from "@/components/dashboard/summary";
import type { SprintDTO } from "@/hooks/useSprints";

const now = new Date("2026-10-31T10:00:00");
const task = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  key: null,
  title: id,
  status: "todo" as const,
  dueDate: null as string | null,
  assigneeId: "me" as string | null,
  sprintId: null as string | null,
  ...extra,
});
const sprint: SprintDTO = {
  id: "s1",
  name: "Sprint 4",
  goal: null,
  status: "active",
  startDate: "2026-10-26T00:00:00",
  endDate: "2026-11-03T00:00:00",
  committedPoints: null,
  completedPoints: null,
  completedAt: null,
  issueCount: 0,
  doneCount: 0,
  totalPoints: 0,
  donePoints: 0,
};

describe("summarizeDay", () => {
  it("counts late and due-today issues and adds the sprint", () => {
    const tasks = [
      task("a", { dueDate: "2026-10-30T09:00:00" }),
      task("b", { dueDate: "2026-10-31T17:00:00" }),
      task("c", { dueDate: "2026-10-31T18:00:00" }),
      task("d", { dueDate: "2026-10-29T09:00:00", status: "done" }),
    ];
    expect(summarizeDay(tasks, [sprint], "me", now)).toBe("1 issue past due and 2 due today. Sprint 4 ends in 3 days.");
  });

  it("says nothing is due when that is true", () => {
    expect(summarizeDay([task("a")], [], "me", now)).toBe("Nothing due today.");
    expect(summarizeDay([], [], "me", now)).toBe("Nothing open right now.");
  });

  it("uses all open issues when none are assigned to the viewer", () => {
    const tasks = [task("a", { assigneeId: null, dueDate: "2026-10-30T09:00:00" })];
    expect(summarizeDay(tasks, [], "me", now)).toBe("1 issue past due.");
  });

  it("handles a sprint ending today or overdue", () => {
    expect(summarizeDay([], [{ ...sprint, endDate: "2026-10-31T20:00:00" }], "me", now)).toBe(
      "Nothing open right now. Sprint 4 ends today.",
    );
    expect(summarizeDay([], [{ ...sprint, endDate: "2026-10-29T00:00:00" }], "me", now)).toBe(
      "Nothing open right now. Sprint 4 is past its end date.",
    );
  });
});
