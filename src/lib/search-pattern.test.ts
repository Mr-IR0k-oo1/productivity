import { describe, expect, it } from "vitest";

import { toLikePattern } from "@/src/lib/search-pattern";

describe("toLikePattern", () => {
  it("wraps the query for a contains match", () => {
    expect(toLikePattern("login")).toBe("%login%");
  });

  it("escapes LIKE wildcards so they match literally", () => {
    expect(toLikePattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });
});
