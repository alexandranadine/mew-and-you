/** How many result cards to mount at once (client-side reveal only). */
export const REVEAL_PAGE_SIZE = 24;

/**
 * Session browsing context for a specific Results URL (`searchKey` =
 * `URLSearchParams#toString()`). Carried in router location state — not the
 * public query string — so it survives Results ↔ Detail within the tab session.
 */
export type ResultsBrowsingState = {
  searchKey: string;
  visibleCount: number;
  scrollY: number;
};

export type ResultsLocationState = {
  resultsBrowsing?: ResultsBrowsingState;
};

export type CatDetailLocationState = {
  distanceMiles?: number;
  resultsBrowsing?: ResultsBrowsingState;
};

/** True when stored browsing state matches the Results URL currently shown. */
export function isResultsBrowsingForSearch(
  browsing: ResultsBrowsingState | null | undefined,
  searchKey: string,
): browsing is ResultsBrowsingState {
  return browsing != null && browsing.searchKey === searchKey;
}

/**
 * Clamp a restored reveal count to the current matched set.
 * Never exceeds `matchedLength`; never below a full first page unless the
 * matched set itself is smaller.
 */
export function clampRestoredVisibleCount(
  restoredCount: number,
  matchedLength: number,
  pageSize: number = REVEAL_PAGE_SIZE,
): number {
  if (matchedLength <= 0) return pageSize;
  const lower = Math.min(pageSize, matchedLength);
  return Math.min(Math.max(restoredCount, lower), matchedLength);
}

/** Build the Results href from a detail-page query string (no leading "?"). */
export function resultsHrefFromSearch(search: string): string {
  return search ? `/cats?${search}` : "/cats";
}

/**
 * Back target from a cat detail URL. Prefer the full carried search string so
 * radius/filters/sort round-trip; fall back to home when there is no ZIP.
 */
export function backHrefFromDetailSearchParams(
  searchParams: URLSearchParams,
): { href: string; hasResultsContext: boolean } {
  const zip = searchParams.get("zip")?.trim();
  if (!zip) {
    return { href: "/", hasResultsContext: false };
  }
  const search = searchParams.toString();
  return { href: resultsHrefFromSearch(search), hasResultsContext: true };
}
