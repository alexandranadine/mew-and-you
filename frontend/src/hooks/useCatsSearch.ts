import { useQuery } from "@tanstack/react-query";
import { fetchCats } from "../api/catsApi";
import type { CatSearchQuery } from "../types/search";

export function useCatsSearch(query: CatSearchQuery | undefined) {
  return useQuery({
    queryKey: ["cats", "search", query],
    queryFn: () => fetchCats(query as CatSearchQuery),
    enabled: query !== undefined,
  });
}
