import {
  getAnimalById,
  RescueGroupsApiError,
  searchAvailableCats,
} from "../integrations/rescuegroups/client";
import { mapRescueGroupsAnimal } from "../integrations/rescuegroups/mapper";
import { ApiError } from "../lib/errors";
import type { Cat } from "../models/cat";
import type {
  CatProvider,
  CatSearchParams,
  CatSearchProviderResult,
} from "./CatProvider";

const RESCUEGROUPS_ID_PREFIX = "rescuegroups:";

/** Our normalized ids are namespaced, e.g. "rescuegroups:12345". */
function parseAnimalId(id: string): string {
  const raw = id.startsWith(RESCUEGROUPS_ID_PREFIX)
    ? id.slice(RESCUEGROUPS_ID_PREFIX.length)
    : id;
  if (!/^\d+$/.test(raw)) {
    throw new ApiError(`"${id}" is not a valid cat id.`, 400, "invalid_id");
  }
  return raw;
}

/** Wraps the RescueGroups integration behind the same CatProvider contract as MockCatProvider. */
export class RescueGroupsProvider implements CatProvider {
  async searchCats({
    zip,
    radiusMiles,
  }: CatSearchParams): Promise<CatSearchProviderResult> {
    const response = await searchAvailableCats({
      postalcode: zip,
      miles: radiusMiles,
      limit: 100,
    });
    const included = response.included ?? [];
    const animals = Array.isArray(response.data) ? response.data : [];

    const cats = animals
      .map((animal) => ({
        ...mapRescueGroupsAnimal(animal, included),
        distanceMiles:
          typeof animal.attributes?.distance === "number"
            ? animal.attributes.distance
            : radiusMiles,
      }))
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    return { cats, totalCount: response.meta?.count ?? cats.length };
  }

  async getCatById(id: string): Promise<Cat | undefined> {
    const animalId = parseAnimalId(id);
    try {
      const response = await getAnimalById(animalId);
      if (!response.data) return undefined;
      return mapRescueGroupsAnimal(response.data, response.included ?? []);
    } catch (error) {
      if (error instanceof RescueGroupsApiError && error.status === 404)
        return undefined;
      throw error;
    }
  }
}
