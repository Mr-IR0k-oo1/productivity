import { describe, expect, it } from "vitest";

import { buildUpcoming } from "@/components/dashboard/upcoming";

const now = new Date("2026-10-30T09:00:00Z");

describe("buildUpcoming", () => {
  it("merges events and deadlines soonest first", () => {
    const items = buildUpcoming(
      [{ id: "e1", title: "Standup", startsAt: "2026-10-31T10:00:00Z" }],
      [{ id: "t1", title: "Ship pricing", dueDate: "2026-10-30T17:00:00Z", status: "todo" }],
      now,
    );
    expect(items.map((item) => [item.type, item.title])).toEqual([
      ["deadline", "Ship pricing"],
      ["event", "Standup"],
    ]);
  });

  it("ignores past items, items beyond the window, done issues and issues without due dates", () => {
    const items = buildUpcoming(
      [
        { id: "past", title: "Yesterday", startsAt: "2026-10-29T10:00:00Z" },
        { id: "far", title: "Next month", startsAt: "2026-11-20T10:00:00Z" },
      ],
      [
        { id: "done", title: "Finished", dueDate: "2026-10-31T10:00:00Z", status: "done" },
        { id: "nodate", title: "Someday", dueDate: null, status: "todo" },
      ],
      now,
    );
    expect(items).toEqual([]);
  });

  it("caps the number of items", () => {
    const events = Array.from({ length: 8 }, (_, i) => ({ id: `e${i}`, title: `E${i}`, startsAt: `2026-10-31T1${i}:00:00Z` }));
    expect(buildUpcoming(events, [], now, { limit: 3 })).toHaveLength(3);
  });
});
