import { describe, expect, it } from "vitest";

describe("Goals & Key Results Calculations", () => {
  it("calculates overall objective progress from key results", () => {
    const computeGoalProgress = (keyResults: Array<{ current: number; target: number }>) => {
      if (!keyResults.length) return 0;
      const totalPct = keyResults.reduce((acc, kr) => {
        const pct = Math.min(100, Math.max(0, (kr.current / (kr.target || 1)) * 100));
        return acc + pct;
      }, 0);
      return Math.round(totalPct / keyResults.length);
    };

    expect(computeGoalProgress([])).toBe(0);
    expect(
      computeGoalProgress([
        { current: 50, target: 100 },
        { current: 100, target: 100 },
      ])
    ).toBe(75);
    expect(
      computeGoalProgress([
        { current: 10, target: 100 },
        { current: 20, target: 100 },
        { current: 30, target: 100 },
      ])
    ).toBe(20);
  });

  it("determines health status based on expected progress", () => {
    const assessGoalHealth = (progress: number, elapsedQuarterPct: number) => {
      if (progress >= 100) return "completed";
      const delta = progress - elapsedQuarterPct;
      if (delta >= -5) return "on_track";
      if (delta >= -20) return "at_risk";
      return "behind";
    };

    expect(assessGoalHealth(100, 50)).toBe("completed");
    expect(assessGoalHealth(55, 50)).toBe("on_track");
    expect(assessGoalHealth(40, 50)).toBe("at_risk");
    expect(assessGoalHealth(20, 50)).toBe("behind");
  });
});

describe("Documents & Knowledge Base Utilities", () => {
  it("computes word count and reading time correctly", () => {
    const calculateReadingMetrics = (content: string) => {
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
      return { words, readingTimeMinutes };
    };

    const empty = calculateReadingMetrics("");
    expect(empty.words).toBe(0);
    expect(empty.readingTimeMinutes).toBe(1);

    const sampleText = Array(450).fill("test").join(" ");
    const metrics = calculateReadingMetrics(sampleText);
    expect(metrics.words).toBe(450);
    expect(metrics.readingTimeMinutes).toBe(3); // 450 / 200 = 2.25 -> ceil 3
  });

  it("filters documents by folder and search term", () => {
    const docs = [
      { id: "1", title: "API Architecture RFC", folder: "Engineering", tags: ["backend", "api"] },
      { id: "2", title: "Brand Identity Guidelines", folder: "Design", tags: ["ui", "brand"] },
      { id: "3", title: "Onboarding Handbook", folder: "People & HR", tags: ["culture", "people"] },
      { id: "4", title: "Security Playbook", folder: "Engineering", tags: ["security", "compliance"] },
    ];

    const filterDocs = (selectedFolder: string, query: string) => {
      return docs.filter((d) => {
        const matchesFolder = selectedFolder === "all" || d.folder === selectedFolder;
        const matchesQuery =
          !query ||
          d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
        return matchesFolder && matchesQuery;
      });
    };

    expect(filterDocs("Engineering", "").length).toBe(2);
    expect(filterDocs("all", "security").length).toBe(1);
    expect(filterDocs("Design", "api").length).toBe(0);
  });
});
