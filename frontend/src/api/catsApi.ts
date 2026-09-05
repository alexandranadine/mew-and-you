import { filterCats, hasActiveFilters } from "../lib/catFilters";
import { sortCats } from "../lib/catSort";
import type { Cat } from "../types/cat";
import type {
  CatFilters,
  CatSearchQuery,
  CatSearchResult,
  CatWithDistance,
} from "../types/search";

/**
 * Talks to our own backend only — never to RescueGroups (or any other
 * source) directly. The backend already filters by ZIP/radius and
 * "available cats"; attribute filters (age/sex/size) and sorting are
 * applied here since the backend doesn't handle those yet.
 */

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

interface CatsSearchResponseBody {
  cats: CatWithDistance[];
  totalCount: number;
}

interface CatDetailResponseBody {
  cat: Cat;
}

interface ApiErrorResponseBody {
  error?: { code?: string; message?: string };
}

function normalizeFilters(filters: CatFilters): CatFilters {
  return {
    ageGroup: filters.ageGroup?.length ? filters.ageGroup : undefined,
    sex: filters.sex?.length ? filters.sex : undefined,
    size: filters.size?.length ? filters.size : undefined,
    organizationId: filters.organizationId?.trim() || undefined,
  };
}

async function parseErrorResponse(response: Response): Promise<never> {
  const body = (await response.json().catch(() => undefined)) as
    | ApiErrorResponseBody
    | undefined;
  throw new ApiRequestError(
    body?.error?.message ?? "Something went wrong. Please try again.",
    response.status,
    body?.error?.code,
  );
}

export async function fetchCats(
  query: CatSearchQuery,
): Promise<CatSearchResult> {
  const params = new URLSearchParams({
    zip: query.zip,
    radius: String(query.radiusMiles),
  });
  const response = await fetch(`/api/cats?${params.toString()}`);

  if (!response.ok) {
    await parseErrorResponse(response);
  }

  const body = (await response.json()) as CatsSearchResponseBody;
  const cats = Array.isArray(body.cats) ? body.cats : [];
  // Preserve upstream total (may exceed cats.length when RescueGroups is capped).
  const totalCount =
    typeof body.totalCount === "number" && Number.isFinite(body.totalCount)
      ? body.totalCount
      : cats.length;
  const filters = normalizeFilters(query.filters);
  const filtered = hasActiveFilters(filters)
    ? filterCats(cats, filters)
    : cats;
  const sorted = sortCats(filtered, query.sort);

  return { cats: sorted, totalCount, query };
}

export async function fetchCatById(id: string): Promise<Cat | undefined> {
  const response = await fetch(`/api/cats/${encodeURIComponent(id)}`);

  if (response.status === 404) return undefined;
  if (!response.ok) {
    await parseErrorResponse(response);
  }

  const body = (await response.json()) as CatDetailResponseBody;
  return body.cat;
}
