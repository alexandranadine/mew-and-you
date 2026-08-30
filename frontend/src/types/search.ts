import type { Cat, CatAgeGroup, CatSex, CatSize } from "./cat";

export type CatSortOption = "distance" | "name";

export interface CatFilters {
  ageGroup?: CatAgeGroup;
  sex?: CatSex;
  size?: CatSize;
  organizationId?: string;
}

export interface CatSearchQuery {
  zip: string;
  radiusMiles: number;
  filters: CatFilters;
  sort: CatSortOption;
}

export interface CatWithDistance extends Cat {
  distanceMiles: number;
}

export interface CatSearchResult {
  cats: CatWithDistance[];
  totalCount: number;
  query: CatSearchQuery;
}
