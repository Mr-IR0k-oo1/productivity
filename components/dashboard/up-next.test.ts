import { describe, expect, it } from "vitest";

import { priorityLabel, selectUpNext } from "@/components/dashboard/up-next";

const base = { key: null, dueDate: null, assigneeId: null, status: "todo" as const, priority: 2 };

describe("selectUpNext", () => {
  const tasks = [
    { ...base, id: "a", title: "A", assigneeId: "me", priority: 3 },
    { ...base, id: "b", title: "B", assigneeId: "me", priority: 1, dueDate: "2026-11-03" },
    { ...base, id: "c", title: "C", assigneeId: "me", priority: 1, dueDate: "2026-11-01" },
    { ...base, id: "d", title: "D", assigneeId: "me", status: "done" as const, priority: 1 },
    { ...base, id: "e", title: "E", assigneeId: "other", priority: 1 },
  ];

  it("shows my open issues by priority, then due date", () => {
    const result = selectUpNext(tasks, "me");
    expect(result.scope).toBe("mine");
    expect(result.items.map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("falls back to every open issue when nothing is assigned to me", () => {
    const result = selectUpNext(tasks, "nobody");
    expect(result.scope).toBe("all");
    expect(result.items.map((t) => t.id)).toEqual(["c", "b", "e", "a"]);
  });

  it("respects the limit", () => {
    expect(selectUpNext(tasks, "me", 2).items).toHaveLength(2);
  });
});

describe("priorityLabel", () => {
  it("maps 1-3 and defaults to medium", () => {
    expect(priorityLabel(1)).toBe("High");
    expect(priorityLabel(2)).toBe("Medium");
    expect(priorityLabel(3)).toBe("Low");
    expect(priorityLabel(null)).toBe("Medium");
  });
});
