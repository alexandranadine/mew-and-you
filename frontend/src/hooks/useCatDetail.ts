import { useQuery } from "@tanstack/react-query";
import { fetchCatById } from "../api/catsApi";

export function useCatDetail(catId: string | undefined) {
  return useQuery({
    queryKey: ["cats", "detail", catId],
    queryFn: () => fetchCatById(catId as string),
    enabled: catId !== undefined,
  });
}
