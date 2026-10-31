import { describe, expect, it } from "vitest";

import { featurePages, getFeaturePage, relatedFeaturePages } from "@/lib/marketing/features";

describe("feature pages content", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = featurePages.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("only links to related pages that exist, never to itself", () => {
    for (const page of featurePages) {
      for (const slug of page.related) {
        expect(getFeaturePage(slug), `${page.slug} -> ${slug}`).not.toBeNull();
        expect(slug).not.toBe(page.slug);
      }
    }
  });
});

describe("getFeaturePage", () => {
  it("finds a page by slug and returns null otherwise", () => {
    expect(getFeaturePage("sprints")?.name).toBe("Backlog and sprints");
    expect(getFeaturePage("nope")).toBeNull();
  });
});

describe("relatedFeaturePages", () => {
  it("resolves related slugs, skipping unknown ones and the page itself", () => {
    const page = { ...featurePages[0], related: ["board", "missing", featurePages[0].slug] };
    expect(relatedFeaturePages(page).map((p) => p.slug)).toEqual(["board"]);
  });
});
