/**
 * Normalized data model, mirroring frontend/src/types/cat.ts. The frontend
 * never sees RescueGroups-specific shapes — only this.
 */

export type CatSex = "male" | "female" | "unknown";

export type CatAgeGroup = "baby" | "young" | "adult" | "senior" | "unknown";

export type CatSize = "small" | "medium" | "large" | "unknown";

export interface CatPhoto {
  url: string;
  thumbnailUrl?: string;
}

export interface CatOrganization {
  id: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface CatLocation {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface CatTraits {
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
  goodWithChildren?: boolean;
  spayedNeutered?: boolean;
  houseTrained?: boolean;
}

export type CatSource = "rescuegroups" | "mock";

export interface Cat {
  id: string;
  source: CatSource;
  name: string;
  breed: string;
  age: string;
  ageGroup: CatAgeGroup;
  sex: CatSex;
  size: CatSize;
  description: string;
  photos: CatPhoto[];
  organization: CatOrganization;
  location: CatLocation;
  traits: CatTraits;
  adoptionUrl: string;
}

export interface CatWithDistance extends Cat {
  distanceMiles: number;
}
