import { describe, expect, it } from "vitest";
import {
  formatResultsHeadline,
  formatRevealFooter,
} from "./searchResultsCopy";

describe("formatResultsHeadline", () => {
  it("uses the normal roommate copy for a complete result set", () => {
    expect(
      formatResultsHeadline({
        matchedCount: 350,
        fetchedCount: 350,
        totalCount: 350,
        radiusMiles: 25,
        hasActiveFilters: false,
      }),
    ).toBe("350 potential roommates within 25 miles");
  });

  it("surfaces truncated totals without calling it an error", () => {
    expect(
      formatResultsHeadline({
        matchedCount: 500,
        fetchedCount: 500,
        totalCount: 1171,
        radiusMiles: 25,
        hasActiveFilters: false,
      }),
    ).toBe("Showing the closest 500 of 1,171 cats within 25 miles");
  });

  it("uses filtered matched count when filters are active on a truncated set", () => {
    expect(
      formatResultsHeadline({
        matchedCount: 42,
        fetchedCount: 500,
        totalCount: 1171,
        radiusMiles: 25,
        hasActiveFilters: true,
      }),
    ).toBe("42 potential roommates within 25 miles");
  });

  it("singularizes roommate for a single match", () => {
    expect(
      formatResultsHeadline({
        matchedCount: 1,
        fetchedCount: 1,
        totalCount: 1,
        radiusMiles: 15,
        hasActiveFilters: false,
      }),
    ).toBe("1 potential roommate within 15 miles");
  });
});

describe("formatRevealFooter", () => {
  it("uses locally matched counts, not upstream totalCount", () => {
    expect(formatRevealFooter(24, 500)).toBe("Showing 24 of 500 cats");
    expect(formatRevealFooter(24, 42)).toBe("Showing 24 of 42 cats");
  });
});
