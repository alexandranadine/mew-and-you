import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCats } from "../api/catsApi";
import type { CatSearchQuery } from "../types/search";

/** Cache by ZIP + radius only — attribute filters/sort are client-side. */
export function catsSearchQueryKey(zip: string, radiusMiles: number) {
  return ["cats", "search", zip, radiusMiles] as const;
}

export function useCatsSearch(query: CatSearchQuery | undefined) {
  return useQuery({
    queryKey: query
      ? catsSearchQueryKey(query.zip, query.radiusMiles)
      : (["cats", "search", "disabled"] as const),
    // Always fetch the unfiltered radius result; pages apply filters/sort locally
    // so changing them doesn't flash a full loading state or refetch the API.
    queryFn: () =>
      fetchCats({
        zip: (query as CatSearchQuery).zip,
        radiusMiles: (query as CatSearchQuery).radiusMiles,
        filters: {},
        sort: "distance",
      }),
    enabled: query !== undefined,
    // Keep prior ZIP+radius results visible while a new radius fetch settles.
    placeholderData: keepPreviousData,
  });
}
