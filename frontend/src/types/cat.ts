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
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface CatBreedInfo {
  primary: string;
  secondary?: string;
  mixed?: boolean;
}

/** Identifies which adapter produced a `Cat` record. Extend as sources are added. */
export type CatSource = "rescuegroups";

export interface Cat {
  /** Normalized id, namespaced by source, e.g. `rescuegroups:98765`. */
  id: string;
  source: CatSource;
  name: string;
  breeds: CatBreedInfo;
  age: CatAgeGroup;
  sex: CatSex;
  size?: CatSize;
  color?: string;
  photos: CatPhoto[];
  description?: string;
  /** Short attribute tags, e.g. "Good with kids", "Litter trained". */
  traits: string[];
  /** Distance from the searched location, in miles, when a location search was performed. */
  distanceMiles?: number;
  organization: CatOrganization;
  /** Link back to the source listing where a user can start an adoption inquiry. */
  adoptionUrl: string;
  status?: string;
  publishedAt?: string;
}

export interface CatSearchParams {
  /** ZIP code or free-text location string entered by the user. */
  location: string;
  radiusMiles: number;
  page?: number;
}

export interface CatSearchResult {
  cats: Cat[];
  totalCount: number;
  page: number;
  pageSize: number;
}
