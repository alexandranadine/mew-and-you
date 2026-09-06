import { useQuery } from "@tanstack/react-query";
import { fetchCatSample } from "../api/catsApi";

export const HOME_SAMPLE_ZIP = "90012";
export const HOME_SAMPLE_RADIUS_MILES = 50;
export const HOME_SAMPLE_COUNT = 3;

export function catsSampleQueryKey(
  zip: string,
  radiusMiles: number,
  count: number,
) {
  return ["cats", "sample", zip, radiusMiles, count] as const;
}

/** Fresh Home loads request a new random trio; the API caches the candidate pool. */
export function useHomeCatSample() {
  return useQuery({
    queryKey: catsSampleQueryKey(
      HOME_SAMPLE_ZIP,
      HOME_SAMPLE_RADIUS_MILES,
      HOME_SAMPLE_COUNT,
    ),
    queryFn: () =>
      fetchCatSample({
        zip: HOME_SAMPLE_ZIP,
        radiusMiles: HOME_SAMPLE_RADIUS_MILES,
        count: HOME_SAMPLE_COUNT,
      }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}
