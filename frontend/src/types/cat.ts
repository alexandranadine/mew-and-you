/**
 * Normalized data model shared by the whole frontend. Every adapter on the
 * backend (RescueGroups today, others later) maps its source-specific
 * response into this shape, so UI code never depends on a particular API.
 */

export type CatSex = "male" | "female" | "unknown";

export type CatAgeGroup = "baby" | "young" | "adult" | "senior" | "unknown";

export type CatSize = "small" | "medium" | "large" | "unknown";

export interface CatPhoto {
  /** Full-size image URL. */
  url: string;
  /** Smaller image URL for cards/lists, falls back to `url` if absent. */
  thumbnailUrl?: string;
}

export interface CatOrganization {
  /** Normalized org id, namespaced by source, e.g. `rescuegroups:1234`. */
  id: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  website?: string;
}

/** Where the cat can be met, used for distance calculations. */
export interface CatLocation {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

/** Tri-state (true/false/unknown) behavioral traits, common to shelter data. */
export interface CatTraits {
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
  goodWithChildren?: boolean;
  spayedNeutered?: boolean;
  houseTrained?: boolean;
}

/** Identifies which adapter produced a `Cat` record. Extend as sources are added. */
export type CatSource = "rescuegroups";

/**
 * Which URL won the adoption CTA fallback chain (animal listing → org
 * adoption page → org website → hard-coded fallback).
 */
export type AdoptionUrlSource =
  | "animal"
  | "organizationAdoption"
  | "organizationWebsite"
  | "fallback";

export interface Cat {
  /** Normalized id, namespaced by source, e.g. `rescuegroups:98765`. */
  id: string;
  source: CatSource;
  name: string;
  breed: string;
  /** Human-readable age, e.g. "2 years". Use `ageGroup` for filtering/sorting. */
  age: string;
  ageGroup: CatAgeGroup;
  sex: CatSex;
  size: CatSize;
  description: string;
  photos: CatPhoto[];
  organization: CatOrganization;
  location: CatLocation;
  traits: CatTraits;
  /** Link back to the source listing where a user can start an adoption inquiry. */
  adoptionUrl: string;
  /** Which fallback step produced `adoptionUrl`, for CTA labeling. */
  adoptionUrlSource: AdoptionUrlSource;
}
