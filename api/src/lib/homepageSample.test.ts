import { afterEach, describe, expect, it, vi } from "vitest";
import type { Cat } from "../models/cat";
import type { CatSearchProviderResult } from "../providers/CatProvider";
import {
  getHomepageSampleCats,
  HOMEPAGE_SAMPLE_TTL_MS,
  HOMEPAGE_SAMPLE_ZIPS,
  isEligibleHomepageSampleCat,
  pickRandomDistinct,
  resetHomepageSampleCache,
} from "./homepageSample";

afterEach(() => {
  resetHomepageSampleCache();
  vi.restoreAllMocks();
});

function makeCat(overrides: Partial<Cat> = {}): Cat {
  return {
    id: "rescuegroups:1",
    source: "rescuegroups",
    name: "Miso",
    breed: "Domestic Short Hair",
    age: "2 years",
    ageGroup: "adult",
    sex: "female",
    size: "medium",
    description: "A sweet lap cat who loves sunny windows.",
    photos: [{ url: "https://example.com/miso.jpg" }],
    organization: {
      id: "rescuegroups:org-1",
      name: "Sunset Paws",
      city: "Los Angeles",
      state: "CA",
      zip: "90012",
    },
    location: {
      zip: "90012",
      city: "Los Angeles",
      state: "CA",
      lat: 34.05,
      lng: -118.24,
    },
    traits: {},
    adoptionUrl: "https://example.com/adopt/miso",
    adoptionUrlSource: "animal",
    ...overrides,
  };
}

function poolOf(count: number, idOffset = 0): Cat[] {
  return Array.from({ length: count }, (_, index) =>
    makeCat({
      id: `rescuegroups:${idOffset + index + 1}`,
      name: `Cat ${idOffset + index + 1}`,
      photos: [{ url: `https://example.com/cat-${idOffset + index + 1}.jpg` }],
    }),
  );
}

function searchByZip(
  responses: Record<string, CatSearchProviderResult | Error>,
) {
  return vi.fn(async ({ zip }: { zip: string; radiusMiles: number }) => {
    const response = responses[zip];
    if (response instanceof Error) {
      throw response;
    }
    if (!response) {
      throw new Error(`Unexpected sample ZIP: ${zip}`);
    }
    return response;
  });
}

describe("isEligibleHomepageSampleCat", () => {
  it("requires a usable name and a usable primary photo", () => {
    expect(isEligibleHomepageSampleCat(makeCat())).toBe(true);
    expect(isEligibleHomepageSampleCat(makeCat({ name: "  " }))).toBe(false);
    expect(
      isEligibleHomepageSampleCat(makeCat({ name: "Unnamed cat" })),
    ).toBe(false);
    expect(isEligibleHomepageSampleCat(makeCat({ photos: [] }))).toBe(false);
    expect(
      isEligibleHomepageSampleCat(
        makeCat({ photos: [{ url: "javascript:alert(1)" }] }),
      ),
    ).toBe(false);
  });

  it("does not require a description and keeps sparse municipal listings", () => {
    expect(
      isEligibleHomepageSampleCat(
        makeCat({
          id: "rescuegroups:kennel",
          name: "A1928701",
          description: "No description provided yet.",
          organization: {
            id: "rescuegroups:4483",
            name: "Los Angeles County Animal Control - Castaic",
            city: "Castaic",
            state: "CA",
            zip: "91384",
          },
        }),
      ),
    ).toBe(true);
  });
});

describe("getHomepageSampleCats", () => {
  it("searches both homepage sample ZIPs concurrently for the candidate pool", async () => {
    const searchCats = searchByZip({
      "90012": {
        cats: poolOf(2).map((cat) => ({ ...cat, distanceMiles: 1 })),
        totalCount: 2,
      },
      "92101": {
        cats: poolOf(2, 10).map((cat) => ({ ...cat, distanceMiles: 2 })),
        totalCount: 2,
      },
    });

    const started: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const gatedSearch = vi.fn(async (params: { zip: string; radiusMiles: number }) => {
      started.push(params.zip);
      await gate;
      return searchCats(params);
    });

    const pending = getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats: gatedSearch, random: () => 0 },
    );

    await vi.waitFor(() => {
      expect(started).toHaveLength(2);
    });
    expect(started).toEqual(expect.arrayContaining([...HOMEPAGE_SAMPLE_ZIPS]));
    release();

    const result = await pending;
    expect(result.cats).toHaveLength(3);
    expect(gatedSearch).toHaveBeenCalledTimes(2);
    expect(gatedSearch).toHaveBeenCalledWith({
      zip: "90012",
      radiusMiles: 50,
    });
    expect(gatedSearch).toHaveBeenCalledWith({
      zip: "92101",
      radiusMiles: 50,
    });
  });

  it("deduplicates cats that appear near both sample ZIPs by stable id", async () => {
    const shared = makeCat({
      id: "rescuegroups:shared",
      name: "Shared",
      photos: [{ url: "https://example.com/shared.jpg" }],
    });
    const searchCats = searchByZip({
      "90012": {
        cats: [
          { ...shared, distanceMiles: 1 },
          ...poolOf(1, 100).map((cat) => ({ ...cat, distanceMiles: 2 })),
        ],
        totalCount: 2,
      },
      "92101": {
        cats: [
          { ...shared, distanceMiles: 5 },
          ...poolOf(1, 200).map((cat) => ({ ...cat, distanceMiles: 6 })),
        ],
        totalCount: 2,
      },
    });

    const result = await getHomepageSampleCats(
      { radiusMiles: 50, count: 10 },
      { searchCats, random: () => 0 },
    );

    expect(result.cats).toHaveLength(3);
    expect(result.cats.filter((cat) => cat.id === "rescuegroups:shared")).toHaveLength(
      1,
    );
  });

  it("returns samples from the successful ZIP when the other ZIP fails", async () => {
    const searchCats = searchByZip({
      "90012": new Error("LA unavailable"),
      "92101": {
        cats: poolOf(4, 50).map((cat) => ({ ...cat, distanceMiles: 3 })),
        totalCount: 4,
      },
    });

    const result = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats, random: () => 0 },
    );

    expect(result.cats).toHaveLength(3);
    expect(result.cats.every((cat) => cat.id.startsWith("rescuegroups:5"))).toBe(
      true,
    );
  });

  it("returns at most the requested count of unique eligible cats", async () => {
    const searchCats = searchByZip({
      "90012": {
        cats: [
          ...poolOf(5).map((cat) => ({ ...cat, distanceMiles: 1 })),
          {
            ...makeCat({ id: "rescuegroups:1", name: "Duplicate" }),
            distanceMiles: 2,
          },
          {
            ...makeCat({
              id: "rescuegroups:no-photo",
              name: "Ghost",
              photos: [],
            }),
            distanceMiles: 3,
          },
        ],
        totalCount: 7,
      },
      "92101": {
        cats: poolOf(2, 20).map((cat) => ({ ...cat, distanceMiles: 4 })),
        totalCount: 2,
      },
    });

    const result = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats, random: () => 0 },
    );

    expect(result.cats).toHaveLength(3);
    expect(new Set(result.cats.map((cat) => cat.id)).size).toBe(3);
    expect(result.cats.every((cat) => cat.photos[0]?.url)).toBe(true);
    expect(result.cats.some((cat) => cat.id === "rescuegroups:no-photo")).toBe(
      false,
    );
  });

  it("returns however many eligible cats are available when fewer than requested", async () => {
    const searchCats = searchByZip({
      "90012": {
        cats: poolOf(1).map((cat) => ({ ...cat, distanceMiles: 1 })),
        totalCount: 1,
      },
      "92101": {
        cats: poolOf(1, 10).map((cat) => ({ ...cat, distanceMiles: 2 })),
        totalCount: 1,
      },
    });

    const result = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats },
    );

    expect(result.cats).toHaveLength(2);
  });

  it("reuses the cached candidate pool within the TTL and still samples randomly", async () => {
    const searchCats = searchByZip({
      "90012": {
        cats: poolOf(3).map((cat) => ({ ...cat, distanceMiles: 1 })),
        totalCount: 3,
      },
      "92101": {
        cats: poolOf(3, 10).map((cat) => ({ ...cat, distanceMiles: 2 })),
        totalCount: 3,
      },
    });

    let now = 1_000;
    const first = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats, now: () => now, random: () => 0 },
    );
    const second = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats, now: () => now + 60_000, random: () => 0.99 },
    );

    expect(searchCats).toHaveBeenCalledTimes(2);
    expect(first.cats).toHaveLength(3);
    expect(second.cats).toHaveLength(3);
    expect(first.cats.map((cat) => cat.id)).not.toEqual(
      second.cats.map((cat) => cat.id),
    );
  });

  it("serves the stale cached pool when a refresh fails for every sample ZIP", async () => {
    const searchCats = vi
      .fn()
      .mockImplementationOnce(async () => ({
        cats: poolOf(2).map((cat) => ({ ...cat, distanceMiles: 1 })),
        totalCount: 2,
      }))
      .mockImplementationOnce(async () => ({
        cats: poolOf(2, 10).map((cat) => ({ ...cat, distanceMiles: 2 })),
        totalCount: 2,
      }))
      .mockRejectedValueOnce(new Error("RescueGroups unavailable"))
      .mockRejectedValueOnce(new Error("RescueGroups unavailable"));

    let now = 1_000;
    const first = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats, now: () => now, random: () => 0 },
    );

    now += HOMEPAGE_SAMPLE_TTL_MS + 1;
    const stale = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats, now: () => now, random: () => 0 },
    );

    expect(searchCats).toHaveBeenCalledTimes(4);
    expect(first.cats).toHaveLength(3);
    expect(stale.cats).toHaveLength(3);
    expect(stale.cats.map((cat) => cat.id)).toEqual(
      first.cats.map((cat) => cat.id),
    );
  });

  it("returns an empty list when there is no cached pool and every ZIP fails", async () => {
    const searchCats = searchByZip({
      "90012": new Error("RescueGroups unavailable"),
      "92101": new Error("RescueGroups unavailable"),
    });

    const result = await getHomepageSampleCats(
      { radiusMiles: 50, count: 3 },
      { searchCats },
    );

    expect(result.cats).toEqual([]);
  });
});

describe("pickRandomDistinct", () => {
  it("never returns more items than requested or available", () => {
    expect(pickRandomDistinct([1, 2, 3], 2, () => 0)).toHaveLength(2);
    expect(pickRandomDistinct([1], 3, () => 0)).toEqual([1]);
  });
});
