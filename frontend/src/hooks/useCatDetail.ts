import { useQuery } from "@tanstack/react-query";
import { fetchCatById } from "../api/catsApi";

export function useCatDetail(catId: string | undefined) {
  return useQuery({
    queryKey: ["cats", "detail", catId],
    queryFn: async () => {
      // 404 returns undefined; map to null so TanStack Query keeps success+empty.
      const cat = await fetchCatById(catId as string);
      return cat ?? null;
    },
    enabled: catId !== undefined,
  });
}
