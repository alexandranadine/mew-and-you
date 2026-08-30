import { useQuery } from "@tanstack/react-query";
import { fetchCatById } from "../api/catsApi";
import { fetchMockCatById } from "../api/mockCatsApi";

/** Cats from the homepage teaser use mock ids ("mock-...") and are fetched locally; everything else goes through our backend. */
export function useCatDetail(catId: string | undefined) {
  const isMock = catId?.startsWith("mock-") ?? false;

  return useQuery({
    queryKey: ["cats", "detail", catId],
    queryFn: () => (isMock ? fetchMockCatById(catId as string) : fetchCatById(catId as string)),
    enabled: catId !== undefined,
  });
}
