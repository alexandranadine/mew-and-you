import { describe, expect, it } from "vitest";
import {
  backHrefFromDetailSearchParams,
  clampRestoredVisibleCount,
  isResultsBrowsingForSearch,
  REVEAL_PAGE_SIZE,
  resultsHrefFromSearch,
} from "./resultsBrowsing";

describe("clampRestoredVisibleCount", () => {
  it("clamps a restored count that exceeds the matched set", () => {
    expect(clampRestoredVisibleCount(72, 50)).toBe(50);
  });

  it("keeps a restored count within the matched set", () => {
    expect(clampRestoredVisibleCount(48, 50)).toBe(48);
  });

  it("does not drop below the first page when the set is large enough", () => {
    expect(clampRestoredVisibleCount(10, 50)).toBe(REVEAL_PAGE_SIZE);
  });

  it("allows a count below the page size when the matched set is smaller", () => {
    expect(clampRestoredVisibleCount(48, 10)).toBe(10);
  });

  it("returns the page size when there are no matches yet", () => {
    expect(clampRestoredVisibleCount(48, 0)).toBe(REVEAL_PAGE_SIZE);
  });
});

describe("isResultsBrowsingForSearch", () => {
  it("accepts browsing state only for the exact search key", () => {
    const browsing = {
      searchKey: "zip=91350&radius=50&sex=female",
      visibleCount: 48,
      scrollY: 400,
    };
    expect(
      isResultsBrowsingForSearch(browsing, "zip=91350&radius=50&sex=female"),
    ).toBe(true);
    expect(
      isResultsBrowsingForSearch(browsing, "zip=91350&radius=25&sex=female"),
    ).toBe(false);
    expect(isResultsBrowsingForSearch(undefined, browsing.searchKey)).toBe(
      false,
    );
  });
});

describe("backHrefFromDetailSearchParams", () => {
  it("rebuilds the full results URL from detail search params", () => {
    const params = new URLSearchParams(
      "zip=91350&radius=50&ageGroup=adult&sex=female,male&size=small&org=org-1&sort=name",
    );
    const result = backHrefFromDetailSearchParams(params);
    expect(result.hasResultsContext).toBe(true);
    expect(result.href.startsWith("/cats?")).toBe(true);
    expect(result.href).toContain("zip=91350");
    expect(result.href).toContain("radius=50");
    expect(result.href).toContain("ageGroup=adult");
    expect(result.href).toContain("sex=female");
    expect(result.href).toContain("male");
    expect(result.href).toContain("size=small");
    expect(result.href).toContain("org=org-1");
    expect(result.href).toContain("sort=name");
  });

  it("falls back to home when there is no ZIP context", () => {
    expect(backHrefFromDetailSearchParams(new URLSearchParams())).toEqual({
      href: "/",
      hasResultsContext: false,
    });
  });

  it("treats blank ZIP as missing results context", () => {
    expect(
      backHrefFromDetailSearchParams(new URLSearchParams("zip=%20")),
    ).toEqual({
      href: "/",
      hasResultsContext: false,
    });
  });
});

describe("resultsHrefFromSearch", () => {
  it("prefixes the search string", () => {
    expect(resultsHrefFromSearch("zip=91350&radius=25")).toBe(
      "/cats?zip=91350&radius=25",
    );
  });
});
