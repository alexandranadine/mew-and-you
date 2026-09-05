import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  RgAnimalResource,
  RgSearchResponse,
  RgSingleAnimalResponse,
} from "../integrations/rescuegroups/types";

vi.mock("../integrations/rescuegroups/client", () => {
  class RescueGroupsApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return {
    RescueGroupsApiError,
    searchAvailableCats: vi.fn(),
    getAnimalById: vi.fn(),
  };
});

import {
  getAnimalById,
  RescueGroupsApiError,
  searchAvailableCats,
} from "../integrations/rescuegroups/client";
import { RescueGroupsProvider } from "./RescueGroupsProvider";

function makeAnimal(
  overrides: Partial<RgAnimalResource> = {},
): RgAnimalResource {
  return {
    type: "animals",
    id: "999",
    attributes: { name: "Test Cat", distance: 3.5, ...overrides.attributes },
    relationships: {},
    ...overrides,
  } as RgAnimalResource;
}

describe("RescueGroupsProvider", () => {
  const provider = new RescueGroupsProvider();

  beforeEach(() => {
    vi.mocked(searchAvailableCats).mockReset();
    vi.mocked(getAnimalById).mockReset();
  });

  it("searches via the RescueGroups client and maps the results, using RescueGroups' own distance", async () => {
    const response: RgSearchResponse = {
      meta: { count: 42 },
      data: [
        makeAnimal({
          id: "2",
          attributes: { name: "Farther Cat", distance: 8 },
        }),
        makeAnimal({
          id: "1",
          attributes: { name: "Closer Cat", distance: 1.5 },
        }),
      ],
      included: [],
    };
    vi.mocked(searchAvailableCats).mockResolvedValue(response);

    const result = await provider.searchCats({ zip: "91350", radiusMiles: 25 });

    expect(searchAvailableCats).toHaveBeenCalledWith({
      postalcode: "91350",
      miles: 25,
      limit: 100,
    });
    expect(result.totalCount).toBe(42);
    expect(result.cats).toHaveLength(2);
    expect(result.cats.map((cat) => cat.name)).toEqual([
      "Closer Cat",
      "Farther Cat",
    ]);
    expect(result.cats[0].distanceMiles).toBe(1.5);
  });

  it("falls back to the search radius when RescueGroups omits a distance", async () => {
    const response: RgSearchResponse = {
      data: [
        makeAnimal({
          attributes: { name: "No Distance Cat", distance: undefined },
        }),
      ],
    };
    vi.mocked(searchAvailableCats).mockResolvedValue(response);

    const result = await provider.searchCats({ zip: "91350", radiusMiles: 25 });

    expect(result.cats[0].distanceMiles).toBe(25);
  });

  it("treats a missing data array as an empty result set", async () => {
    vi.mocked(searchAvailableCats).mockResolvedValue({
      meta: { count: 0 },
    } as RgSearchResponse);

    const result = await provider.searchCats({ zip: "91350", radiusMiles: 25 });

    expect(result.cats).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("returns a mapped cat by id", async () => {
    const response: RgSingleAnimalResponse = {
      data: makeAnimal({ id: "12345" }),
      included: [],
    };
    vi.mocked(getAnimalById).mockResolvedValue(response);

    const cat = await provider.getCatById("rescuegroups:12345");

    expect(getAnimalById).toHaveBeenCalledWith("12345");
    expect(cat?.id).toBe("rescuegroups:12345");
  });

  it("returns undefined when RescueGroups responds 404", async () => {
    vi.mocked(getAnimalById).mockRejectedValue(
      new RescueGroupsApiError("not found", 404),
    );

    const cat = await provider.getCatById("rescuegroups:404404");

    expect(cat).toBeUndefined();
  });

  it("rejects an id that isn't a valid RescueGroups animal id", async () => {
    await expect(provider.getCatById("not-a-number")).rejects.toMatchObject({
      status: 400,
      code: "invalid_id",
    });
  });

  it("re-throws non-404 errors from RescueGroups", async () => {
    vi.mocked(getAnimalById).mockRejectedValue(
      new RescueGroupsApiError("rate limited", 429),
    );

    await expect(provider.getCatById("rescuegroups:1")).rejects.toThrow(
      "rate limited",
    );
  });
});
