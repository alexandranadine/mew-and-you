import type { Cat } from "../types/cat";
import type { CatSearchQuery, CatSearchResult } from "../types/search";
import { filterCats } from "./catFilters";
import { sortCats } from "./catSort";
import { getDistanceInMiles } from "./distance";
import { getCoordinatesForZip } from "./zipLookup";

export class UnknownZipError extends Error {
  zip: string;

  constructor(zip: string) {
    super(`No location data for ZIP "${zip}"`);
    this.zip = zip;
  }
}

/**
 * Pure search over a list of cats: geocodes the origin ZIP, attaches
 * distance to every cat, cuts off anything outside the radius, applies
 * attribute filters, then sorts. No UI or network concerns live here, so
 * this can run against mock data today and real API results later.
 */
export function searchCats(
  cats: Cat[],
  query: CatSearchQuery,
): CatSearchResult {
  const origin = getCoordinatesForZip(query.zip);
  if (!origin) {
    throw new UnknownZipError(query.zip);
  }

  const withDistance = cats.map((cat) => ({
    ...cat,
    distanceMiles: getDistanceInMiles(origin, cat.location),
  }));

  const withinRadius = withDistance.filter(
    (cat) => cat.distanceMiles <= query.radiusMiles,
  );
  const filtered = filterCats(withinRadius, query.filters);
  const sorted = sortCats(filtered, query.sort);

  return { cats: sorted, totalCount: sorted.length, query };
}
