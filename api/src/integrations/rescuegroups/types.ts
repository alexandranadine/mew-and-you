/**
 * RescueGroups v5 API shapes (JSON:API). Intentionally minimal — only the
 * fields the mapper actually reads. Nothing from this file should be
 * imported outside of src/integrations/rescuegroups/.
 */

export interface RgResourceRef {
  type: string;
  id: string;
}

export interface RgRelationship {
  data?: RgResourceRef | RgResourceRef[] | null;
}

export interface RgAnimalAttributes {
  name?: string | null;
  ageGroup?: string | null;
  ageString?: string | null;
  breedString?: string | null;
  breedPrimary?: string | null;
  isBreedMixed?: boolean | null;
  sex?: string | null;
  sizeGroup?: string | null;
  descriptionText?: string | null;
  descriptionHtml?: string | null;
  distance?: number | null;
  pictureThumbnailUrl?: string | null;
  url?: string | null;
  slug?: string | null;
  isDogsOk?: boolean | null;
  isCatsOk?: boolean | null;
  isKidsOk?: boolean | null;
  isHousetrained?: boolean | null;
}

export interface RgAnimalResource {
  type: "animals";
  id: string;
  attributes: RgAnimalAttributes;
  relationships?: {
    orgs?: RgRelationship;
    pictures?: RgRelationship;
    locations?: RgRelationship;
    breeds?: RgRelationship;
  };
}

export interface RgIncludedResource {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
}

export interface RgSearchMeta {
  count?: number;
  countReturned?: number;
  pageReturned?: number;
  limit?: number;
  pages?: number;
}

export interface RgSearchResponse {
  meta?: RgSearchMeta;
  data: RgAnimalResource[];
  included?: RgIncludedResource[];
}

export interface RgSingleAnimalResponse {
  data: RgAnimalResource;
  included?: RgIncludedResource[];
}

export interface RgOrgAttributes {
  name?: string | null;
  city?: string | null;
  state?: string | null;
  postalcode?: string | null;
  phone?: string | null;
  email?: string | null;
  url?: string | null;
  lat?: number | null;
  lon?: number | null;
}

export interface RgLocationAttributes {
  city?: string | null;
  state?: string | null;
  postalcode?: string | null;
  lat?: number | null;
  lon?: number | null;
}

export interface RgPictureAttributes {
  original?: { url: string } | null;
  large?: { url: string } | null;
  small?: { url: string } | null;
}
