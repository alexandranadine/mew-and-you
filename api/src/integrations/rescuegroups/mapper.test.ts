import { describe, expect, it } from "vitest";
import { mapRescueGroupsAnimal } from "./mapper";
import type { RgAnimalResource, RgIncludedResource } from "./types";

function makeAnimal(
  overrides: Partial<RgAnimalResource> = {},
): RgAnimalResource {
  return {
    type: "animals",
    id: "12345",
    attributes: {
      name: "Mochi",
      ageGroup: "Young",
      ageString: "1 Year",
      breedPrimary: "Domestic Shorthair",
      isBreedMixed: true,
      sex: "Female",
      sizeGroup: "Medium",
      descriptionText: "A sweet, playful cat.",
      distance: 4.2,
      isDogsOk: true,
      isCatsOk: true,
      isKidsOk: true,
      isHousetrained: true,
      ...overrides.attributes,
    },
    relationships: {
      orgs: { data: { type: "orgs", id: "100" } },
      pictures: { data: [{ type: "pictures", id: "200" }] },
      locations: { data: { type: "locations", id: "300" } },
      ...overrides.relationships,
    },
  };
}

const orgIncluded: RgIncludedResource = {
  type: "orgs",
  id: "100",
  attributes: {
    name: "Sunset Paws Adoption Center",
    city: "Los Angeles",
    state: "CA",
    postalcode: "90026",
    phone: "(213) 555-0142",
    email: "hello@example.org",
    url: "https://example.org/sunset-paws",
    lat: 34.09,
    lon: -118.27,
  },
};

const locationIncluded: RgIncludedResource = {
  type: "locations",
  id: "300",
  attributes: {
    city: "Los Angeles",
    state: "CA",
    postalcode: "90026",
    lat: 34.09,
    lon: -118.27,
  },
};

const pictureIncluded: RgIncludedResource = {
  type: "pictures",
  id: "200",
  attributes: {
    original: { url: "https://example.org/photo-original.jpg" },
    large: { url: "https://example.org/photo-large.jpg" },
    small: { url: "https://example.org/photo-small.jpg" },
  },
};

const fullIncluded = [orgIncluded, locationIncluded, pictureIncluded];

describe("mapRescueGroupsAnimal", () => {
  it("maps a complete animal record", () => {
    const cat = mapRescueGroupsAnimal(makeAnimal(), fullIncluded);

    expect(cat.id).toBe("rescuegroups:12345");
    expect(cat.source).toBe("rescuegroups");
    expect(cat.name).toBe("Mochi");
    expect(cat.breed).toBe("Domestic Shorthair Mix");
    expect(cat.age).toBe("1 Year");
    expect(cat.ageGroup).toBe("young");
    expect(cat.sex).toBe("female");
    expect(cat.size).toBe("medium");
    expect(cat.description).toBe("A sweet, playful cat.");
    expect(cat.photos).toEqual([
      {
        url: "https://example.org/photo-large.jpg",
        thumbnailUrl: "https://example.org/photo-small.jpg",
      },
    ]);
    expect(cat.organization).toMatchObject({
      name: "Sunset Paws Adoption Center",
      city: "Los Angeles",
      state: "CA",
      zip: "90026",
    });
    expect(cat.location).toEqual({
      zip: "90026",
      city: "Los Angeles",
      state: "CA",
      lat: 34.09,
      lng: -118.27,
    });
    expect(cat.traits).toEqual({
      goodWithDogs: true,
      goodWithCats: true,
      goodWithChildren: true,
      houseTrained: true,
    });
  });

  it("falls back to a placeholder icon-friendly empty array when photos are missing", () => {
    const animal = makeAnimal({ relationships: { pictures: { data: [] } } });
    const cat = mapRescueGroupsAnimal(animal, [orgIncluded, locationIncluded]);

    expect(cat.photos).toEqual([]);
  });

  it("uses pictureThumbnailUrl as a fallback photo when no pictures are included", () => {
    const animal = makeAnimal({
      attributes: { pictureThumbnailUrl: "https://example.org/thumb.jpg" },
      relationships: { pictures: { data: [] } },
    });
    const cat = mapRescueGroupsAnimal(animal, [orgIncluded, locationIncluded]);

    expect(cat.photos).toEqual([
      {
        url: "https://example.org/thumb.jpg",
        thumbnailUrl: "https://example.org/thumb.jpg",
      },
    ]);
  });

  it('falls back to "Breed unknown" when no breed fields are present', () => {
    const animal = makeAnimal({
      attributes: { breedPrimary: null, breedString: null },
    });
    const cat = mapRescueGroupsAnimal(animal, fullIncluded);

    expect(cat.breed).toBe("Breed unknown");
  });

  it("uses breedString when breedPrimary is missing", () => {
    const animal = makeAnimal({
      attributes: { breedPrimary: null, breedString: "Tabby mix" },
    });
    const cat = mapRescueGroupsAnimal(animal, fullIncluded);

    expect(cat.breed).toBe("Tabby mix");
  });

  it('maps an unrecognized or missing sex to "unknown"', () => {
    const missing = mapRescueGroupsAnimal(
      makeAnimal({ attributes: { sex: null } }),
      fullIncluded,
    );
    const unrecognized = mapRescueGroupsAnimal(
      makeAnimal({ attributes: { sex: "Unknown" } }),
      fullIncluded,
    );

    expect(missing.sex).toBe("unknown");
    expect(unrecognized.sex).toBe("unknown");
  });

  it("falls back to a default organization when the orgs relationship is missing entirely", () => {
    const animal = makeAnimal({ relationships: { orgs: undefined } });
    const cat = mapRescueGroupsAnimal(animal, []);

    expect(cat.organization.name).toBe("Unknown organization");
    expect(cat.organization.id).toContain("unknown-org");
  });

  it('falls back to zeroed coordinates and "Unknown" city when location and org data are both missing', () => {
    const animal = makeAnimal({
      relationships: { orgs: undefined, locations: undefined },
    });
    const cat = mapRescueGroupsAnimal(animal, []);

    expect(cat.location).toEqual({
      zip: "",
      city: "Unknown",
      state: "",
      lat: 0,
      lng: 0,
    });
  });

  it("cleans up incomplete/messy descriptions and provides a fallback when blank", () => {
    const messy = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: {
          descriptionText: "  Sweet girl.&nbsp;&nbsp;Loves naps.  ",
        },
      }),
      fullIncluded,
    );
    const blank = mapRescueGroupsAnimal(
      makeAnimal({ attributes: { descriptionText: "" } }),
      fullIncluded,
    );
    const nullDescription = mapRescueGroupsAnimal(
      makeAnimal({ attributes: { descriptionText: null } }),
      fullIncluded,
    );

    expect(messy.description).toBe("Sweet girl. Loves naps.");
    expect(blank.description).toBe("No description provided yet.");
    expect(nullDescription.description).toBe("No description provided yet.");
  });

  it('falls back to an "Age unknown" label only when both ageString and ageGroup are missing', () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({ attributes: { ageString: null, ageGroup: null } }),
      fullIncluded,
    );
    expect(cat.age).toBe("Age unknown");
    expect(cat.ageGroup).toBe("unknown");
  });
});
