import { describe, expect, it } from "vitest";
import { ApiError } from "../lib/errors";
import { MockCatProvider } from "./MockCatProvider";

describe("MockCatProvider", () => {
  const provider = new MockCatProvider();

  it("returns only cats within the given radius, sorted closest-first", async () => {
    const result = await provider.searchCats({ zip: "91350", radiusMiles: 1 });

    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.cats.every((cat) => cat.location.zip === "91350")).toBe(true);
    expect(result.cats.every((cat) => cat.distanceMiles <= 1)).toBe(true);

    const distances = result.cats.map((cat) => cat.distanceMiles);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("includes farther cats once the radius is widened", async () => {
    const narrow = await provider.searchCats({ zip: "91350", radiusMiles: 1 });
    const wide = await provider.searchCats({ zip: "91350", radiusMiles: 500 });

    expect(wide.totalCount).toBeGreaterThan(narrow.totalCount);
  });

  it("throws a clear 404 ApiError for a ZIP with no mock location data", async () => {
    await expect(
      provider.searchCats({ zip: "00000", radiusMiles: 25 }),
    ).rejects.toMatchObject({
      status: 404,
      code: "unknown_zip",
    });
    await expect(
      provider.searchCats({ zip: "00000", radiusMiles: 25 }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("finds a cat by id", async () => {
    const cat = await provider.getCatById("mock:mochi");
    expect(cat?.name).toBe("Mochi");
  });

  it("returns undefined for an unknown id", async () => {
    const cat = await provider.getCatById("mock:does-not-exist");
    expect(cat).toBeUndefined();
  });
});
