import type { Cat } from "../types/cat";

/** Minimal adoptable cat fixture for display/SEO tests. */
export function makeCat(overrides: Partial<Cat> = {}): Cat {
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
      zip: "90026",
    },
    location: {
      zip: "90026",
      city: "Los Angeles",
      state: "CA",
      lat: 34.07,
      lng: -118.26,
    },
    traits: {},
    adoptionUrl: "https://example.com/adopt/miso",
    adoptionUrlSource: "animal",
    ...overrides,
  };
}
