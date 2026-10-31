import { describe, expect, it } from "vitest";

describe("Project Stats & Calculations", () => {
  it("calculates progress percentage correctly", () => {
    const computeProgress = (done: number, total: number) => {
      if (total <= 0) return 0;
      return Math.round((done / total) * 100);
    };

    expect(computeProgress(0, 0)).toBe(0);
    expect(computeProgress(3, 10)).toBe(30);
    expect(computeProgress(7, 7)).toBe(100);
    expect(computeProgress(2, 3)).toBe(67);
  });

  it("filters projects by status accurately", () => {
    const projects = [
      { id: "1", name: "Core Architecture", status: "active" as const },
      { id: "2", name: "Q1 Mobile App", status: "completed" as const },
      { id: "3", name: "Legacy Integration", status: "archived" as const },
      { id: "4", name: "Customer Portal", status: "active" as const },
    ];

    const active = projects.filter((p) => p.status === "active");
    const completed = projects.filter((p) => p.status === "completed");
    const archived = projects.filter((p) => p.status === "archived");

    expect(active.length).toBe(2);
    expect(completed.length).toBe(1);
    expect(archived.length).toBe(1);
  });

  it("generates a clean workspace slug from organization name", () => {
    const slugify = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    expect(slugify("Acme Technologies Inc.")).toBe("acme-technologies-inc");
    expect(slugify("ORBIT Labs")).toBe("orbit-labs");
    expect(slugify("  Special & Characters! ")).toBe("special-characters");
  });
});
