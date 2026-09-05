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
    expect(cat.adoptionUrl).toBe("https://example.org/sunset-paws");
    expect(cat.adoptionUrlSource).toBe("organizationWebsite");
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

  it("decodes HTML entities in description text after stripping tags", () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: {
          descriptionText:
            "He&#39;s sweet. Hansel &amp; Gretel. you&rsquo;re home &mdash; forever.&nbsp;End.",
        },
      }),
      fullIncluded,
    );

    expect(cat.description).toBe(
      "He's sweet. Hansel & Gretel. you’re home — forever. End.",
    );
  });

  it("does not rewrite semantic content when cleaning descriptions", () => {
    // Upstream bios sometimes name the wrong animal; we only fix encoding.
    const cat = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: {
          name: "Willy",
          descriptionText: "Johnny&rsquo;s a sweet orange tabby.",
        },
      }),
      fullIncluded,
    );

    expect(cat.name).toBe("Willy");
    expect(cat.description).toBe("Johnny’s a sweet orange tabby.");
  });

  it("does not double-decode ordinary ampersands or already-decoded text", () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: {
          descriptionText: "Tom & Jerry — He's already fine.",
        },
      }),
      fullIncluded,
    );

    expect(cat.description).toBe("Tom & Jerry — He's already fine.");
  });

  it("strips HTML tags before decoding entities (no HTML rendering)", () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: {
          descriptionText: null,
          descriptionHtml:
            "<p>He&#39;s <strong>brave</strong> &amp; soft.</p><script>alert(1)</script>",
        },
      }),
      fullIncluded,
    );

    expect(cat.description).toBe("He's brave & soft.alert(1)");
    expect(cat.description).not.toContain("<");
  });

  it('falls back to an "Age unknown" label only when both ageString and ageGroup are missing', () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({ attributes: { ageString: null, ageGroup: null } }),
      fullIncluded,
    );
    expect(cat.age).toBe("Age unknown");
    expect(cat.ageGroup).toBe("unknown");
  });

  it("maps a live GET /public/animals/{id} record plus included org, location, and pictures", () => {
    const animal: RgAnimalResource = {
      type: "animals",
      id: "18134969",
      attributes: {
        name: "Willy",
        ageGroup: "Adult",
        ageString: "6 Years 1 Month",
        breedPrimary: "Tabby",
        sex: "Male",
        sizeGroup: "Large",
        descriptionText: "A sweet orange tabby.",
        url: "https://www.rescuesontherunway.org/animals/willy",
        pictureThumbnailUrl:
          "https://cdn.rescuegroups.org/5586/pictures/thumb.jpg",
      },
      relationships: {
        orgs: { data: { type: "orgs", id: "5586" } },
        pictures: { data: [{ type: "pictures", id: "94051916" }] },
        locations: { data: { type: "locations", id: "1" } },
      },
    };
    const included: RgIncludedResource[] = [
      {
        type: "orgs",
        id: "5586",
        attributes: {
          name: "Rescues On The Runway",
          city: "Santa Clarita",
          state: "CA",
          postalcode: "91387",
          phone: "(661) 305-5700",
          email: "hello@example.org",
          url: "http://www.rescuesontherunway.org",
          adoptionUrl: "http://www.rescuesontherunway.org/adopt",
          lat: 34.4247,
          lon: -118.41,
        },
      },
      {
        type: "locations",
        id: "1",
        attributes: {
          city: "Santa Clarita",
          state: "CA",
          postalcode: "91387",
          lat: 34.4247,
          lon: -118.41,
        },
      },
      {
        type: "pictures",
        id: "94051916",
        attributes: {
          large: {
            url: "https://cdn.rescuegroups.org/5586/pictures/large.jpg",
          },
          small: {
            url: "https://cdn.rescuegroups.org/5586/pictures/small.jpg",
          },
        },
      },
    ];

    const cat = mapRescueGroupsAnimal(animal, included);

    expect(cat).toMatchObject({
      id: "rescuegroups:18134969",
      name: "Willy",
      breed: "Tabby",
      age: "6 Years 1 Month",
      ageGroup: "adult",
      sex: "male",
      size: "large",
      description: "A sweet orange tabby.",
      adoptionUrl: "https://www.rescuesontherunway.org/animals/willy",
      adoptionUrlSource: "animal",
      organization: {
        id: "rescuegroups:5586",
        name: "Rescues On The Runway",
        city: "Santa Clarita",
        state: "CA",
        zip: "91387",
      },
      location: {
        zip: "91387",
        city: "Santa Clarita",
        state: "CA",
        lat: 34.4247,
        lng: -118.41,
      },
    });
    expect(cat.photos).toEqual([
      {
        url: "https://cdn.rescuegroups.org/5586/pictures/large.jpg",
        thumbnailUrl: "https://cdn.rescuegroups.org/5586/pictures/small.jpg",
      },
    ]);
  });

  it("maps documented Young Adult / X-Large values used on single-animal records", () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: { ageGroup: "Young Adult", sizeGroup: "X-Large" },
      }),
      fullIncluded,
    );

    expect(cat.ageGroup).toBe("young");
    expect(cat.size).toBe("large");
  });

  it("uses descriptionHtml when descriptionText is missing", () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: {
          descriptionText: null,
          descriptionHtml: "<p>Sweet&nbsp;girl.</p>",
        },
      }),
      fullIncluded,
    );

    expect(cat.description).toBe("Sweet girl.");
  });

  it("reads picture URLs whether RescueGroups returns strings or { url } objects", () => {
    const included: RgIncludedResource[] = [
      orgIncluded,
      locationIncluded,
      {
        type: "pictures",
        id: "200",
        attributes: {
          original: "https://example.org/photo-original.jpg",
          large: "https://example.org/photo-large.jpg",
          small: "https://example.org/photo-small.jpg",
        },
      },
    ];

    const cat = mapRescueGroupsAnimal(makeAnimal(), included);

    expect(cat.photos).toEqual([
      {
        url: "https://example.org/photo-large.jpg",
        thumbnailUrl: "https://example.org/photo-small.jpg",
      },
    ]);
  });

  it("uses animal attributes.url for adoptionUrl even when org adoptionUrl and website exist", () => {
    const cat = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: {
          url: "https://example.org/sunset-paws/cats/mochi",
        },
      }),
      [
        {
          ...orgIncluded,
          attributes: {
            ...orgIncluded.attributes,
            adoptionUrl: "https://example.org/sunset-paws/adopt",
            url: "https://example.org/sunset-paws",
          },
        },
        locationIncluded,
        pictureIncluded,
      ],
    );

    expect(cat.adoptionUrl).toBe("https://example.org/sunset-paws/cats/mochi");
    expect(cat.adoptionUrlSource).toBe("animal");
    expect(cat.adoptionUrl).not.toBe("https://example.org/sunset-paws/adopt");
    expect(cat.adoptionUrl).not.toBe("https://example.org/sunset-paws");
  });

  it("prefers the animal listing URL, then org adoptionUrl, then org website", () => {
    const animalUrl = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: { url: "https://example.org/sunset-paws/cats/mochi" },
      }),
      [
        {
          ...orgIncluded,
          attributes: {
            ...orgIncluded.attributes,
            adoptionUrl: "https://example.org/sunset-paws/adopt",
            url: "https://example.org/sunset-paws",
          },
        },
        locationIncluded,
        pictureIncluded,
      ],
    );
    const orgAdoptionUrl = mapRescueGroupsAnimal(makeAnimal(), [
      {
        ...orgIncluded,
        attributes: {
          ...orgIncluded.attributes,
          adoptionUrl: "https://example.org/sunset-paws/adopt",
          url: "https://example.org/sunset-paws",
        },
      },
      locationIncluded,
      pictureIncluded,
    ]);
    const orgWebsite = mapRescueGroupsAnimal(makeAnimal(), fullIncluded);
    const homepage = mapRescueGroupsAnimal(
      makeAnimal({ relationships: { orgs: undefined } }),
      [],
    );

    expect(animalUrl.adoptionUrl).toBe(
      "https://example.org/sunset-paws/cats/mochi",
    );
    expect(animalUrl.adoptionUrlSource).toBe("animal");
    expect(orgAdoptionUrl.adoptionUrl).toBe(
      "https://example.org/sunset-paws/adopt",
    );
    expect(orgAdoptionUrl.adoptionUrlSource).toBe("organizationAdoption");
    expect(orgWebsite.adoptionUrl).toBe("https://example.org/sunset-paws");
    expect(orgWebsite.adoptionUrlSource).toBe("organizationWebsite");
    expect(homepage.adoptionUrl).toBe("https://www.rescuegroups.org/");
    expect(homepage.adoptionUrlSource).toBe("fallback");
  });

  it("normalizes schemeless organization hostnames to https URLs", () => {
    const pawparent = mapRescueGroupsAnimal(makeAnimal(), [
      {
        ...orgIncluded,
        attributes: {
          ...orgIncluded.attributes,
          url: "pawparent.org",
          adoptionUrl: null,
        },
      },
      locationIncluded,
      pictureIncluded,
    ]);
    const lbsn = mapRescueGroupsAnimal(makeAnimal(), [
      {
        ...orgIncluded,
        attributes: {
          ...orgIncluded.attributes,
          url: "lbsn.org",
          adoptionUrl: undefined,
        },
      },
      locationIncluded,
      pictureIncluded,
    ]);

    expect(pawparent.adoptionUrl).toBe("https://pawparent.org");
    expect(pawparent.adoptionUrlSource).toBe("organizationWebsite");
    expect(pawparent.organization.website).toBe("https://pawparent.org");
    expect(lbsn.adoptionUrl).toBe("https://lbsn.org");
    expect(lbsn.organization.website).toBe("https://lbsn.org");
  });

  it("preserves http and https adoption URLs and rejects unsafe or malformed ones", () => {
    const httpsUrl = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: { url: "https://example.org/cats/mochi" },
      }),
      fullIncluded,
    );
    const httpUrl = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: { url: "http://example.org/cats/mochi" },
      }),
      fullIncluded,
    );
    const rejectsJavascript = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: { url: "javascript:alert(1)" },
      }),
      [
        {
          ...orgIncluded,
          attributes: {
            ...orgIncluded.attributes,
            adoptionUrl: "javascript:void(0)",
            url: "data:text/html,hi",
          },
        },
        locationIncluded,
        pictureIncluded,
      ],
    );
    const rejectsMalformed = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: { url: "not a url" },
      }),
      [
        {
          ...orgIncluded,
          attributes: {
            ...orgIncluded.attributes,
            adoptionUrl: "://broken",
            url: "",
          },
        },
        locationIncluded,
        pictureIncluded,
      ],
    );
    const skipsInvalidAnimalUrl = mapRescueGroupsAnimal(
      makeAnimal({
        attributes: { url: "javascript:evil()" },
      }),
      [
        {
          ...orgIncluded,
          attributes: {
            ...orgIncluded.attributes,
            adoptionUrl: "https://example.org/sunset-paws/adopt",
            url: "pawparent.org",
          },
        },
        locationIncluded,
        pictureIncluded,
      ],
    );

    expect(httpsUrl.adoptionUrl).toBe("https://example.org/cats/mochi");
    expect(httpUrl.adoptionUrl).toBe("http://example.org/cats/mochi");
    expect(rejectsJavascript.adoptionUrl).toBe("https://www.rescuegroups.org/");
    expect(rejectsJavascript.adoptionUrlSource).toBe("fallback");
    expect(rejectsJavascript.organization.website).toBeUndefined();
    expect(rejectsMalformed.adoptionUrl).toBe("https://www.rescuegroups.org/");
    expect(rejectsMalformed.adoptionUrlSource).toBe("fallback");
    // Invalid animal URL is skipped; hierarchy continues to org adoptionUrl.
    expect(skipsInvalidAnimalUrl.adoptionUrl).toBe(
      "https://example.org/sunset-paws/adopt",
    );
    expect(skipsInvalidAnimalUrl.adoptionUrlSource).toBe(
      "organizationAdoption",
    );
  });
});
