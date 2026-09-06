import { afterEach, describe, expect, it, vi } from "vitest";
import type { Cat } from "../models/cat";
import type { CatSearchProviderResult } from "../providers/CatProvider";
import {
  getHomepageSampleCats,
  HOMEPAGE_SAMPLE_TTL_MS,
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

function poolOf(count: number): Cat[] {
  return Array.from({ length: count }, (_, index) =>
    makeCat({
      id: `rescuegroups:${index + 1}`,
      name: `Cat ${index + 1}`,
      photos: [{ url: `https://example.com/cat-${index + 1}.jpg` }],
    }),
  );
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
  it("returns at most the requested count of unique eligible cats", async () => {
    const searchCats = vi.fn(async (): Promise<CatSearchProviderResult> => ({
      cats: [
        ...poolOf(5).map((cat) => ({ ...cat, distanceMiles: 1 })),
        {
          ...makeCat({ id: "rescuegroups:1", name: "Duplicate" }),
          distanceMiles: 2,
        },
        {
          ...makeCat({ id: "rescuegroups:no-photo", name: "Ghost", photos: [] }),
          distanceMiles: 3,
        },
      ],
      totalCount: 7,
    }));

    const result = await getHomepageSampleCats(
      { zip: "90012", radiusMiles: 50, count: 3 },
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
    const searchCats = vi.fn(async (): Promise<CatSearchProviderResult> => ({
      cats: poolOf(2).map((cat) => ({ ...cat, distanceMiles: 1 })),
      totalCount: 2,
    }));

    const result = await getHomepageSampleCats(
      { zip: "90012", radiusMiles: 50, count: 3 },
      { searchCats },
    );

    expect(result.cats).toHaveLength(2);
  });

  it("reuses the cached candidate pool within the TTL and still samples randomly", async () => {
    const searchCats = vi.fn(async (): Promise<CatSearchProviderResult> => ({
      cats: poolOf(6).map((cat) => ({ ...cat, distanceMiles: 1 })),
      totalCount: 6,
    }));

    let now = 1_000;
    const first = await getHomepageSampleCats(
      { zip: "90012", radiusMiles: 50, count: 3 },
      { searchCats, now: () => now, random: () => 0 },
    );
    const second = await getHomepageSampleCats(
      { zip: "90012", radiusMiles: 50, count: 3 },
      { searchCats, now: () => now + 60_000, random: () => 0.99 },
    );

    expect(searchCats).toHaveBeenCalledTimes(1);
    expect(first.cats).toHaveLength(3);
    expect(second.cats).toHaveLength(3);
    expect(first.cats.map((cat) => cat.id)).not.toEqual(
      second.cats.map((cat) => cat.id),
    );
  });

  it("serves the stale cached pool when a refresh fails", async () => {
    const searchCats = vi
      .fn()
      .mockResolvedValueOnce({
        cats: poolOf(4).map((cat) => ({ ...cat, distanceMiles: 1 })),
        totalCount: 4,
      })
      .mockRejectedValueOnce(new Error("RescueGroups unavailable"));

    let now = 1_000;
    const first = await getHomepageSampleCats(
      { zip: "90012", radiusMiles: 50, count: 3 },
      { searchCats, now: () => now, random: () => 0 },
    );

    now += HOMEPAGE_SAMPLE_TTL_MS + 1;
    const stale = await getHomepageSampleCats(
      { zip: "90012", radiusMiles: 50, count: 3 },
      { searchCats, now: () => now, random: () => 0 },
    );

    expect(searchCats).toHaveBeenCalledTimes(2);
    expect(first.cats).toHaveLength(3);
    expect(stale.cats).toHaveLength(3);
    expect(stale.cats.map((cat) => cat.id)).toEqual(
      first.cats.map((cat) => cat.id),
    );
  });

  it("returns an empty list when there is no cached pool and the request fails", async () => {
    const searchCats = vi.fn(async () => {
      throw new Error("RescueGroups unavailable");
    });

    const result = await getHomepageSampleCats(
      { zip: "90012", radiusMiles: 50, count: 3 },
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
