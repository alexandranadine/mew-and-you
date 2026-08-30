import type { CatAgeGroup, CatSex, CatSize } from "../types/cat";
import type {
  CatFilters,
  CatSearchQuery,
  CatSortOption,
} from "../types/search";
import { DEFAULT_RADIUS_MILES, RADIUS_OPTIONS_MILES } from "./searchOptions";
import { getCoordinatesForZip, isValidZipFormat } from "./zipLookup";

const AGE_GROUPS: readonly CatAgeGroup[] = ["baby", "young", "adult", "senior"];
const SEXES: readonly CatSex[] = ["male", "female"];
const SIZES: readonly CatSize[] = ["small", "medium", "large"];
const SORT_VALUES: readonly CatSortOption[] = ["distance", "name"];

export type CatSearchParamsError =
  | { code: "missing-zip" }
  | { code: "invalid-zip"; zip: string }
  | { code: "unknown-zip"; zip: string }
  | { code: "invalid-radius"; value: string };

export type ParseCatSearchParamsResult =
  | { ok: true; query: CatSearchQuery }
  | { ok: false; error: CatSearchParamsError };

function parseEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  if (value && (allowed as readonly string[]).includes(value))
    return value as T;
  return undefined;
}

/** Parses and validates `/cats?zip=...&radius=...` (plus filters/sort) into a typed query, or a specific error. */
export function parseCatSearchParams(
  searchParams: URLSearchParams,
): ParseCatSearchParamsResult {
  const zip = searchParams.get("zip")?.trim() ?? "";
  if (!zip) return { ok: false, error: { code: "missing-zip" } };
  if (!isValidZipFormat(zip))
    return { ok: false, error: { code: "invalid-zip", zip } };
  if (!getCoordinatesForZip(zip))
    return { ok: false, error: { code: "unknown-zip", zip } };

  const radiusParam = searchParams.get("radius");
  let radiusMiles: number = DEFAULT_RADIUS_MILES;
  if (radiusParam) {
    const parsedRadius = Number(radiusParam);
    if (!(RADIUS_OPTIONS_MILES as readonly number[]).includes(parsedRadius)) {
      return {
        ok: false,
        error: { code: "invalid-radius", value: radiusParam },
      };
    }
    radiusMiles = parsedRadius;
  }

  const filters: CatFilters = {
    ageGroup: parseEnumParam(searchParams.get("ageGroup"), AGE_GROUPS),
    sex: parseEnumParam(searchParams.get("sex"), SEXES),
    size: parseEnumParam(searchParams.get("size"), SIZES),
    organizationId: searchParams.get("org") ?? undefined,
  };

  const sort =
    parseEnumParam(searchParams.get("sort"), SORT_VALUES) ?? "distance";

  return { ok: true, query: { zip, radiusMiles, filters, sort } };
}

/** Builds the `/cats` results URL for a given search query. */
export function buildCatSearchUrl(query: CatSearchQuery): string {
  const params = catSearchQueryToParams(query);
  return `/cats?${params.toString()}`;
}

export function catSearchQueryToParams(query: CatSearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("zip", query.zip);
  params.set("radius", String(query.radiusMiles));
  if (query.filters.ageGroup) params.set("ageGroup", query.filters.ageGroup);
  if (query.filters.sex) params.set("sex", query.filters.sex);
  if (query.filters.size) params.set("size", query.filters.size);
  if (query.filters.organizationId)
    params.set("org", query.filters.organizationId);
  if (query.sort !== "distance") params.set("sort", query.sort);
  return params;
}

/**
 * Applies a partial patch (e.g. one changed filter) to existing URL search
 * params, removing keys whose new value is empty/undefined. Kept UI-agnostic
 * so both the results page and any future consumer can reuse it.
 */
export function patchSearchParams(
  current: URLSearchParams,
  patch: Record<string, string | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") next.delete(key);
    else next.set(key, value);
  }
  return next;
}
