import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCats } from "./catsApi";
import { makeCat } from "../test/catFixture";
import type { CatWithDistance } from "../types/search";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function catWithDistance(
  overrides: Partial<CatWithDistance> = {},
): CatWithDistance {
  return {
    ...makeCat(overrides),
    distanceMiles: overrides.distanceMiles ?? 1.2,
  };
}

describe("fetchCats totalCount", () => {
  it("preserves the API-provided totalCount when results are truncated", async () => {
    const cats = Array.from({ length: 3 }, (_, i) =>
      catWithDistance({
        id: `rescuegroups:${i}`,
        name: `Cat ${i}`,
        distanceMiles: i + 1,
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cats, totalCount: 1171 }),
      }),
    );

    const result = await fetchCats({
      zip: "91766",
      radiusMiles: 25,
      filters: {},
      sort: "distance",
    });

    expect(result.cats).toHaveLength(3);
    expect(result.totalCount).toBe(1171);
  });

  it("preserves totalCount when it matches the fetched set", async () => {
    const cats = [
      catWithDistance({ id: "rescuegroups:1", name: "Miso", distanceMiles: 2 }),
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cats, totalCount: 1 }),
      }),
    );

    const result = await fetchCats({
      zip: "91351",
      radiusMiles: 25,
      filters: {},
      sort: "distance",
    });

    expect(result.cats).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });
});
