import { describe, expect, it } from "vitest";

import {
  buildBurndown,
  computeVelocity,
  formatIssueKey,
  isValidIssueKeyPrefix,
  parseIssueKey,
  sumStoryPoints,
} from "@/src/lib/scrum";

describe("issue keys", () => {
  it("formats a key from prefix and number", () => {
    expect(formatIssueKey("ORB", 42)).toBe("ORB-42");
  });

  it("returns null for issues without a number", () => {
    expect(formatIssueKey("ORB", null)).toBeNull();
  });

  it("parses keys case-insensitively", () => {
    expect(parseIssueKey(" orb-7 ")).toEqual({ prefix: "ORB", number: 7 });
  });

  it("rejects text that is not a key", () => {
    expect(parseIssueKey("fix login")).toBeNull();
    expect(parseIssueKey("ORB-")).toBeNull();
    expect(parseIssueKey("7-ORB")).toBeNull();
  });

  it("validates prefixes", () => {
    expect(isValidIssueKeyPrefix("WEB2")).toBe(true);
    expect(isValidIssueKeyPrefix("2WEB")).toBe(false);
    expect(isValidIssueKeyPrefix("web")).toBe(false);
    expect(isValidIssueKeyPrefix("TOOLONGPREFIX")).toBe(false);
  });
});

describe("sumStoryPoints", () => {
  it("treats unestimated issues as zero", () => {
    expect(sumStoryPoints([{ storyPoints: 3 }, { storyPoints: null }, { storyPoints: 5 }])).toBe(8);
  });
});

describe("buildBurndown", () => {
  const sprint = {
    startDate: new Date("2026-10-01T09:00:00Z"),
    endDate: new Date("2026-10-05T17:00:00Z"),
    committedPoints: 10,
  };

  it("draws an ideal line from committed points to zero", () => {
    const points = buildBurndown(sprint, [], new Date("2026-10-10T00:00:00Z"));
    expect(points.map((p) => p.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"]);
    expect(points[0].ideal).toBe(10);
    expect(points[2].ideal).toBe(5);
    expect(points[4].ideal).toBe(0);
  });

  it("subtracts completed points by day and leaves future days empty", () => {
    const issues = [
      { storyPoints: 3, completedAt: new Date("2026-10-02T12:00:00Z") },
      { storyPoints: 5, completedAt: null },
      { storyPoints: 2, completedAt: new Date("2026-10-03T08:00:00Z") },
    ];
    const points = buildBurndown(sprint, issues, new Date("2026-10-03T15:00:00Z"));
    expect(points.map((p) => p.remaining)).toEqual([10, 7, 5, null, null]);
  });

  it("never reports negative remaining work", () => {
    const issues = [{ storyPoints: 20, completedAt: new Date("2026-10-01T10:00:00Z") }];
    const points = buildBurndown(sprint, issues, new Date("2026-10-01T12:00:00Z"));
    expect(points[0].remaining).toBe(0);
  });
});

describe("computeVelocity", () => {
  it("averages completed points across sprints", () => {
    const velocity = computeVelocity([
      { name: "Sprint 1", committedPoints: 20, completedPoints: 15 },
      { name: "Sprint 2", committedPoints: 18, completedPoints: 18 },
      { name: "Sprint 3", committedPoints: null, completedPoints: null },
    ]);
    expect(velocity.average).toBe(11);
    expect(velocity.sprints[2]).toEqual({ name: "Sprint 3", committed: 0, completed: 0 });
  });

  it("returns zero average with no history", () => {
    expect(computeVelocity([]).average).toBe(0);
  });
});
