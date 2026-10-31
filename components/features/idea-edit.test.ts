import { describe, expect, it } from "vitest";

import { buildIdeaUpdate, diffIds } from "@/components/features/idea-edit";

const original = { title: "Dark mode", summary: "Theme toggle", content: "Details", status: "draft" as const };

describe("buildIdeaUpdate", () => {
  it("returns only changed fields, trimmed", () => {
    expect(buildIdeaUpdate(original, { ...original, title: "  Dark theme ", status: "validated" })).toEqual({
      changes: { title: "Dark theme", status: "validated" },
    });
  });

  it("returns null changes when nothing changed", () => {
    expect(buildIdeaUpdate(original, { ...original, summary: " Theme toggle " })).toEqual({ changes: null });
  });

  it("clears emptied text fields to null", () => {
    expect(buildIdeaUpdate(original, { ...original, summary: "", content: "  " })).toEqual({
      changes: { summary: null, content: null },
    });
  });

  it("rejects a title shorter than 2 characters", () => {
    expect(buildIdeaUpdate(original, { ...original, title: " a " })).toEqual({
      error: "Title needs at least 2 characters.",
    });
  });
});

describe("diffIds", () => {
  it("splits additions and removals", () => {
    expect(diffIds(["a", "b"], ["b", "c"])).toEqual({ toAdd: ["c"], toRemove: ["a"] });
  });

  it("is empty when the sets match", () => {
    expect(diffIds(["a", "b"], ["b", "a"])).toEqual({ toAdd: [], toRemove: [] });
  });
});
