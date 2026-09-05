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
    unwrapSingleAnimal: (data: unknown) =>
      Array.isArray(data) ? data[0] : (data ?? undefined),
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
      page: 1,
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

  it("paginates through multiple upstream pages and ranks closer cats from later pages ahead of page 1 cats", async () => {
    // Simulates the 91351 scenario where page 1 contains farther animals (~24 mi)
    // and page 2 contains a closer animal (~11.87 mi, org 4483 Castaic).
    const page1Animals = Array.from({ length: 100 }, (_, index) =>
      makeAnimal({
        id: `p1-${index}`,
        attributes: { name: `Page 1 Cat ${index}`, distance: 24.0 },
      }),
    );
    const page1Response: RgSearchResponse = {
      meta: { count: 150, pages: 2, limit: 100, pageReturned: 1 },
      data: page1Animals,
      included: [
        {
          type: "orgs",
          id: "10683",
          attributes: { name: "Stray No More", city: "Van Nuys", state: "CA" },
        },
      ],
    };

    const castaicAnimal = makeAnimal({
      id: "22666940",
      attributes: { name: "Rooty Tooty", distance: 11.87 },
      relationships: { orgs: { data: { type: "orgs", id: "4483" } } },
    });
    const page2Response: RgSearchResponse = {
      meta: { count: 150, pages: 2, limit: 100, pageReturned: 2 },
      data: [castaicAnimal],
      included: [
        {
          type: "orgs",
          id: "4483",
          attributes: {
            name: "Los Angeles County Animal Control - Castaic",
            city: "Castaic",
            state: "CA",
            postalcode: "91384",
          },
        },
      ],
    };

    vi.mocked(searchAvailableCats)
      .mockResolvedValueOnce(page1Response)
      .mockResolvedValueOnce(page2Response);

    const result = await provider.searchCats({ zip: "91351", radiusMiles: 25 });

    expect(searchAvailableCats).toHaveBeenCalledTimes(2);
    expect(searchAvailableCats).toHaveBeenNthCalledWith(1, {
      postalcode: "91351",
      miles: 25,
      limit: 100,
      page: 1,
    });
    expect(searchAvailableCats).toHaveBeenNthCalledWith(2, {
      postalcode: "91351",
      miles: 25,
      limit: 100,
      page: 2,
    });

    expect(result.totalCount).toBe(150);
    expect(result.cats).toHaveLength(101);

    // Castaic animal from page 2 (11.87 mi) ranks first, ahead of all 24.0 mi animals from page 1!
    expect(result.cats[0].id).toBe("rescuegroups:22666940");
    expect(result.cats[0].name).toBe("Rooty Tooty");
    expect(result.cats[0].distanceMiles).toBe(11.87);
    expect(result.cats[0].organization.id).toBe("rescuegroups:4483");
    expect(result.cats[0].organization.name).toBe(
      "Los Angeles County Animal Control - Castaic",
    );
  });

  it("deduplicates animals and included resources across multiple pages", async () => {
    const page1Animal1 = makeAnimal({
      id: "101",
      attributes: { name: "Duplicate Cat", distance: 5 },
      relationships: { orgs: { data: { type: "orgs", id: "org-1" } } },
    });
    const page1Animals = [
      page1Animal1,
      ...Array.from({ length: 99 }, (_, i) =>
        makeAnimal({
          id: `p1-${i}`,
          attributes: { name: `Cat ${i}`, distance: 10 },
        }),
      ),
    ];

    const page2Animals = [
      makeAnimal({
        id: "101", // duplicate id from page 1
        attributes: { name: "Duplicate Cat (Page 2)", distance: 5 },
        relationships: { orgs: { data: { type: "orgs", id: "org-1" } } },
      }),
      makeAnimal({
        id: "102",
        attributes: { name: "Unique Page 2 Cat", distance: 7 },
        relationships: { orgs: { data: { type: "orgs", id: "org-2" } } },
      }),
    ];

    vi.mocked(searchAvailableCats)
      .mockResolvedValueOnce({
        meta: { count: 102, pages: 2 },
        data: page1Animals,
        included: [{ type: "orgs", id: "org-1", attributes: { name: "Org 1" } }],
      })
      .mockResolvedValueOnce({
        meta: { count: 102, pages: 2 },
        data: page2Animals,
        included: [
          { type: "orgs", id: "org-1", attributes: { name: "Org 1" } },
          { type: "orgs", id: "org-2", attributes: { name: "Org 2" } },
        ],
      });

    const result = await provider.searchCats({ zip: "91350", radiusMiles: 25 });

    expect(result.cats).toHaveLength(101); // 100 from page 1 + 1 unique from page 2 (duplicate removed)
    const duplicateInstances = result.cats.filter(
      (cat) => cat.id === "rescuegroups:101",
    );
    expect(duplicateInstances).toHaveLength(1);
    expect(duplicateInstances[0].name).toBe("Duplicate Cat"); // preserves first occurrence
  });

  it("safely handles partial pagination failure by returning retrieved pages", async () => {
    const page1Animals = Array.from({ length: 100 }, (_, i) =>
      makeAnimal({
        id: `p1-${i}`,
        attributes: { name: `Cat ${i}`, distance: 10 },
      }),
    );

    vi.mocked(searchAvailableCats)
      .mockResolvedValueOnce({
        meta: { count: 348, pages: 4 },
        data: page1Animals,
        included: [],
      })
      .mockRejectedValueOnce(
        new RescueGroupsApiError("Upstream timeout on page 2", 502),
      );

    const result = await provider.searchCats({ zip: "91351", radiusMiles: 25 });

    // Does not throw — returns page 1 results with totalCount preserved from page 1 meta
    expect(result.cats).toHaveLength(100);
    expect(result.totalCount).toBe(348);
  });

  it("respects the explicit safety cap on maximum pages fetched", async () => {
    // 10 pages reported by upstream, but default safety cap is 5
    const pageAnimals = Array.from({ length: 100 }, (_, i) =>
      makeAnimal({
        id: `animal-${i}`,
        attributes: { name: `Cat ${i}`, distance: 5 },
      }),
    );

    vi.mocked(searchAvailableCats).mockResolvedValue({
      meta: { count: 1000, pages: 10 },
      data: pageAnimals,
      included: [],
    });

    const result = await provider.searchCats({ zip: "91350", radiusMiles: 50 });

    // Exactly 5 requests made (pages 1 to 5)
    expect(searchAvailableCats).toHaveBeenCalledTimes(5);
    expect(searchAvailableCats).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1 }),
    );
    expect(searchAvailableCats).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({ page: 5 }),
    );
    expect(result.totalCount).toBe(1000);
  });

  it("stops fetching when an upstream page returns fewer animals than the page size", async () => {
    const page1Animals = Array.from({ length: 100 }, (_, i) =>
      makeAnimal({
        id: `p1-${i}`,
        attributes: { name: `Cat ${i}`, distance: 10 },
      }),
    );
    // Page 2 returns only 20 animals despite meta.pages saying 4
    const page2Animals = Array.from({ length: 20 }, (_, i) =>
      makeAnimal({
        id: `p2-${i}`,
        attributes: { name: `Cat p2-${i}`, distance: 12 },
      }),
    );

    vi.mocked(searchAvailableCats)
      .mockResolvedValueOnce({
        meta: { count: 348, pages: 4 },
        data: page1Animals,
        included: [],
      })
      .mockResolvedValueOnce({
        meta: { count: 348, pages: 4 },
        data: page2Animals,
        included: [],
      });

    const result = await provider.searchCats({ zip: "91350", radiusMiles: 25 });

    // Stops after page 2 because it returned a partial page (< 100)
    expect(searchAvailableCats).toHaveBeenCalledTimes(2);
    expect(result.cats).toHaveLength(120);
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

  it("unwraps the live GET /public/animals/{id} one-element data array", async () => {
    const response: RgSingleAnimalResponse = {
      data: [
        makeAnimal({
          id: "18134969",
          attributes: { name: "Willy", breedPrimary: "Tabby", sex: "Male" },
          relationships: { orgs: { data: { type: "orgs", id: "5586" } } },
        }),
      ],
      included: [
        {
          type: "orgs",
          id: "5586",
          attributes: {
            name: "Rescues On The Runway",
            city: "Santa Clarita",
            state: "CA",
            postalcode: "91387",
            url: "http://www.rescuesontherunway.org",
            adoptionUrl: "http://www.rescuesontherunway.org/adopt",
          },
        },
      ],
    };
    vi.mocked(getAnimalById).mockResolvedValue(response);

    const cat = await provider.getCatById("rescuegroups:18134969");

    expect(cat?.id).toBe("rescuegroups:18134969");
    expect(cat?.name).toBe("Willy");
    expect(cat?.breed).toBe("Tabby");
    expect(cat?.sex).toBe("male");
    expect(cat?.organization.name).toBe("Rescues On The Runway");
    expect(cat?.location.city).toBe("Santa Clarita");
    expect(cat?.adoptionUrl).toBe("http://www.rescuesontherunway.org/adopt");
  });

  it("returns undefined when GET /public/animals/{id} has an empty data array", async () => {
    vi.mocked(getAnimalById).mockResolvedValue({
      data: [],
      included: [],
    });

    const cat = await provider.getCatById("rescuegroups:1");

    expect(cat).toBeUndefined();
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
