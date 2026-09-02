import type { Cat, CatWithDistance } from "../models/cat";

export interface CatSearchParams {
  zip: string;
  radiusMiles: number;
}

export interface CatSearchProviderResult {
  cats: CatWithDistance[];
  totalCount: number;
}

/**
 * Anything that can answer "cats near this ZIP" and "one cat by id" can be a
 * provider. Swapping providers (mock <-> RescueGroups <-> a future source)
 * never touches routes/cats.ts or the frontend.
 */
export interface CatProvider {
  searchCats(params: CatSearchParams): Promise<CatSearchProviderResult>;
  getCatById(id: string): Promise<Cat | undefined>;
}
