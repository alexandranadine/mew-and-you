import {
  getAnimalById,
  RescueGroupsApiError,
  searchAvailableCats,
  unwrapSingleAnimal,
} from "../integrations/rescuegroups/client";
import { mapRescueGroupsAnimal } from "../integrations/rescuegroups/mapper";
import type {
  RgAnimalResource,
  RgIncludedResource,
} from "../integrations/rescuegroups/types";
import { ApiError } from "../lib/errors";
import { logger } from "../lib/logger";
import type { Cat } from "../models/cat";
import type {
  CatProvider,
  CatSearchParams,
  CatSearchProviderResult,
} from "./CatProvider";

const RESCUEGROUPS_ID_PREFIX = "rescuegroups:";

/** Default number of animals requested per upstream RescueGroups page. */
export const RESCUEGROUPS_PAGE_SIZE = 100;

/**
 * Sensible explicit safety cap for paginated upstream requests.
 * At 100 animals per page, 5 pages allows retrieving up to 500 animals per query.
 * This covers full metro-area radius searches (including ZIP 91351 / radius 25 with 348 cats)
 * while bounding upstream request volume, avoiding rate-limit exhaustion (HTTP 429),
 * and keeping search latency within ~1-2 seconds.
 */
export const RESCUEGROUPS_DEFAULT_MAX_PAGES = 5;

export interface RescueGroupsProviderOptions {
  pageSize?: number;
  maxPages?: number;
}

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
  private readonly pageSize: number;
  private readonly maxPages: number;

  constructor(options: RescueGroupsProviderOptions = {}) {
    this.pageSize = options.pageSize ?? RESCUEGROUPS_PAGE_SIZE;
    this.maxPages = options.maxPages ?? RESCUEGROUPS_DEFAULT_MAX_PAGES;
  }

  async searchCats({
    zip,
    radiusMiles,
  }: CatSearchParams): Promise<CatSearchProviderResult> {
    const firstPageResponse = await searchAvailableCats({
      postalcode: zip,
      miles: radiusMiles,
      limit: this.pageSize,
      page: 1,
    });

    const allAnimals: RgAnimalResource[] = Array.isArray(firstPageResponse.data)
      ? [...firstPageResponse.data]
      : [];
    const allIncluded: RgIncludedResource[] = firstPageResponse.included
      ? [...firstPageResponse.included]
      : [];

    const metaCount = firstPageResponse.meta?.count;
    const totalCount = metaCount ?? allAnimals.length;

    const upstreamPages =
      typeof firstPageResponse.meta?.pages === "number" &&
      firstPageResponse.meta.pages > 0
        ? firstPageResponse.meta.pages
        : typeof metaCount === "number" && metaCount > 0
          ? Math.ceil(metaCount / this.pageSize)
          : 1;

    const targetPages = Math.min(upstreamPages, this.maxPages);

    // Fetch subsequent pages sequentially to respect upstream rate limits
    if (allAnimals.length >= this.pageSize && targetPages > 1) {
      for (let page = 2; page <= targetPages; page++) {
        try {
          const pageResponse = await searchAvailableCats({
            postalcode: zip,
            miles: radiusMiles,
            limit: this.pageSize,
            page,
          });

          const pageAnimals = Array.isArray(pageResponse.data)
            ? pageResponse.data
            : [];
          if (pageResponse.included) {
            allIncluded.push(...pageResponse.included);
          }
          allAnimals.push(...pageAnimals);

          // Partial or empty page indicates no further records upstream
          if (pageAnimals.length < this.pageSize) {
            break;
          }
        } catch (error) {
          logger.warn(
            "RescueGroups pagination request failed; continuing with partial results",
            {
              zip,
              radiusMiles,
              failedPage: page,
              targetPages,
              retrievedAnimals: allAnimals.length,
              error: error instanceof Error ? error.message : String(error),
            },
          );
          break;
        }
      }
    }

    // Deduplicate animals by RescueGroups id
    const seenAnimalIds = new Set<string>();
    const deduplicatedAnimals: RgAnimalResource[] = [];
    for (const animal of allAnimals) {
      if (animal?.id && !seenAnimalIds.has(animal.id)) {
        seenAnimalIds.add(animal.id);
        deduplicatedAnimals.push(animal);
      }
    }

    // Deduplicate included resources by type:id
    const seenIncludedKeys = new Set<string>();
    const deduplicatedIncluded: RgIncludedResource[] = [];
    for (const item of allIncluded) {
      if (item?.type && item?.id) {
        const key = `${item.type}:${item.id}`;
        if (!seenIncludedKeys.has(key)) {
          seenIncludedKeys.add(key);
          deduplicatedIncluded.push(item);
        }
      }
    }

    // Apply normalized mapping and sort complete combined set by distance
    const cats = deduplicatedAnimals
      .map((animal) => ({
        ...mapRescueGroupsAnimal(animal, deduplicatedIncluded),
        distanceMiles:
          typeof animal.attributes?.distance === "number"
            ? animal.attributes.distance
            : radiusMiles,
      }))
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    return { cats, totalCount };
  }

  async getCatById(id: string): Promise<Cat | undefined> {
    const animalId = parseAnimalId(id);
    try {
      const response = await getAnimalById(animalId);
      const animal = unwrapSingleAnimal(response.data);
      if (!animal) return undefined;
      return mapRescueGroupsAnimal(animal, response.included ?? []);
    } catch (error) {
      if (error instanceof RescueGroupsApiError && error.status === 404)
        return undefined;
      throw error;
    }
  }
}
