import { findMockCatById, mockCats } from "../data/mockCats";
import {
  getMockCoordinatesForZip,
  SAMPLE_KNOWN_ZIPS,
} from "../data/zipCoordinates";
import { ApiError } from "../lib/errors";
import { getDistanceInMiles } from "../lib/distance";
import type { Cat } from "../models/cat";
import type {
  CatProvider,
  CatSearchParams,
  CatSearchProviderResult,
} from "./CatProvider";

/**
 * Serves the local mock dataset, computing distance/radius the same way a
 * real geodistance search would. Used whenever DATA_PROVIDER=mock (the
 * default) so the app runs fully offline, with no external API key.
 */
export class MockCatProvider implements CatProvider {
  async searchCats({
    zip,
    radiusMiles,
  }: CatSearchParams): Promise<CatSearchProviderResult> {
    const origin = getMockCoordinatesForZip(zip);
    if (!origin) {
      throw new ApiError(
        `Mock mode doesn't have location data for ZIP "${zip}". Try one of these: ${SAMPLE_KNOWN_ZIPS.join(", ")}.`,
        404,
        "unknown_zip",
      );
    }

    const cats = mockCats
      .map((cat) => ({
        ...cat,
        distanceMiles: getDistanceInMiles(origin, cat.location),
      }))
      .filter((cat) => cat.distanceMiles <= radiusMiles)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    return { cats, totalCount: cats.length };
  }

  async getCatById(id: string): Promise<Cat | undefined> {
    return findMockCatById(id);
  }
}
