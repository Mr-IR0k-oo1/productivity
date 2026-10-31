import { describe, expect, it } from "vitest";

import { buildSprintOrbit, describeDaysLeft, pickActiveSprint, polar } from "@/components/dashboard/sprint-orbit";
import type { SprintDTO } from "@/hooks/useSprints";

function sprint(overrides: Partial<SprintDTO> = {}): SprintDTO {
  return {
    id: "s1",
    name: "Sprint 4",
    goal: null,
    status: "active",
    startDate: "2026-10-26T00:00:00",
    endDate: "2026-11-05T00:00:00",
    committedPoints: null,
    completedPoints: null,
    completedAt: null,
    issueCount: 0,
    doneCount: 0,
    totalPoints: 0,
    donePoints: 0,
    ...overrides,
  };
}

const now = new Date("2026-10-31T12:00:00");

describe("pickActiveSprint", () => {
  it("returns the active sprint or null", () => {
    expect(pickActiveSprint([sprint({ id: "a", status: "planned" }), sprint({ id: "b" })])?.id).toBe("b");
    expect(pickActiveSprint([sprint({ status: "completed" })])).toBeNull();
  });
});

describe("buildSprintOrbit", () => {
  const tasks = [
    { id: "t1", key: "ORB-1", title: "A", status: "todo" as const, sprintId: "s1" },
    { id: "t2", key: "ORB-2", title: "B", status: "done" as const, sprintId: "s1" },
    { id: "t3", key: null, title: "C", status: "in_progress" as const, sprintId: "s1" },
    { id: "t4", key: "ORB-4", title: "D", status: "done" as const, sprintId: "other" },
  ];

  it("places only this sprint's issues, done first, evenly around the ring", () => {
    const orbit = buildSprintOrbit(sprint(), tasks, now);
    expect(orbit.dots.map((d) => d.id)).toEqual(["t2", "t3", "t1"]);
    expect(orbit.dots.map((d) => d.angle)).toEqual([0, 120, 240]);
    expect(orbit.counts).toEqual({ todo: 1, in_progress: 1, review: 0, done: 1 });
  });

  it("measures elapsed time and days left", () => {
    const orbit = buildSprintOrbit(sprint(), tasks, now);
    expect(orbit.elapsed).toBeCloseTo(0.55, 2);
    expect(orbit.daysLeft).toBe(5);
  });

  it("clamps elapsed and handles missing dates", () => {
    expect(buildSprintOrbit(sprint(), [], new Date("2026-12-01")).elapsed).toBe(1);
    const undated = buildSprintOrbit(sprint({ startDate: null, endDate: null }), [], now);
    expect(undated.elapsed).toBeNull();
    expect(undated.daysLeft).toBeNull();
    expect(undated.dots).toEqual([]);
  });
});

describe("describeDaysLeft", () => {
  it("phrases each case", () => {
    expect(describeDaysLeft(null)).toBe("No end date");
    expect(describeDaysLeft(0)).toBe("Ends today");
    expect(describeDaysLeft(1)).toBe("1 day left");
    expect(describeDaysLeft(4)).toBe("4 days left");
    expect(describeDaysLeft(-2)).toBe("Ended 2 days ago");
  });
});

describe("polar", () => {
  it("puts 0 degrees at twelve o'clock and 90 at three", () => {
    const top = polar(50, 50, 10, 0);
    const right = polar(50, 50, 10, 90);
    expect(top.x).toBeCloseTo(50);
    expect(top.y).toBeCloseTo(40);
    expect(right.x).toBeCloseTo(60);
    expect(right.y).toBeCloseTo(50);
  });
});
