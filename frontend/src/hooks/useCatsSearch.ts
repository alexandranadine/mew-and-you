import { useQuery } from "@tanstack/react-query";
import { fetchCats } from "../api/catsApi";
import type { CatSearchQuery } from "../types/search";

export function catsSearchQueryKey(query: CatSearchQuery) {
  return [
    "cats",
    "search",
    query.zip,
    query.radiusMiles,
    query.filters.ageGroup ?? null,
    query.filters.sex ?? null,
    query.filters.size ?? null,
    query.filters.organizationId ?? null,
    query.sort,
  ] as const;
}

export function useCatsSearch(query: CatSearchQuery | undefined) {
  return useQuery({
    queryKey: query
      ? catsSearchQueryKey(query)
      : (["cats", "search", "disabled"] as const),
    queryFn: () => fetchCats(query as CatSearchQuery),
    enabled: query !== undefined,
  });
}
