import type { CatSearchQuery } from "../types/search";
import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  SORT_OPTIONS,
} from "./searchOptions";

/** Short human-readable summary of a search query (filters + sort). */
export function formatSearchSummary(query: CatSearchQuery): string {
  const parts: string[] = [
    `ZIP ${query.zip}`,
    `${query.radiusMiles} mi`,
  ];

  if (query.filters.ageGroup) {
    parts.push(
      AGE_GROUP_OPTIONS.find((option) => option.value === query.filters.ageGroup)
        ?.label ?? query.filters.ageGroup,
    );
  }
  if (query.filters.sex) {
    parts.push(
      SEX_OPTIONS.find((option) => option.value === query.filters.sex)?.label ??
        query.filters.sex,
    );
  }
  if (query.filters.size) {
    parts.push(
      SIZE_OPTIONS.find((option) => option.value === query.filters.size)
        ?.label ?? query.filters.size,
    );
  }
  if (query.filters.organizationId) {
    parts.push(`Org ${query.filters.organizationId}`);
  }
  if (query.sort !== "distance") {
    const sortLabel =
      SORT_OPTIONS.find((option) => option.value === query.sort)?.label ??
      query.sort;
    parts.push(`Sort: ${sortLabel}`);
  }

  return parts.join(" · ");
}

/** Default title when the user did not name the search. */
export function defaultSavedSearchTitle(query: CatSearchQuery): string {
  return `Cats near ${query.zip}`;
}
