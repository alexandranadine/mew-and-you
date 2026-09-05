/**
 * Client-side copy for search result counts.
 * Uses fetched vs upstream totals only when no attribute filters are active,
 * so totalCount is never presented as a filtered match count.
 */

export function formatResultsHeadline(options: {
  matchedCount: number;
  fetchedCount: number;
  totalCount: number;
  radiusMiles: number;
  hasActiveFilters: boolean;
}): string {
  const { matchedCount, fetchedCount, totalCount, radiusMiles, hasActiveFilters } =
    options;

  if (
    !hasActiveFilters &&
    fetchedCount < totalCount &&
    fetchedCount > 0
  ) {
    return `Showing the closest ${fetchedCount.toLocaleString("en-US")} of ${totalCount.toLocaleString("en-US")} cats within ${radiusMiles} miles`;
  }

  const noun = matchedCount === 1 ? "roommate" : "roommates";
  return `${matchedCount} potential ${noun} within ${radiusMiles} miles`;
}

/** Progressive reveal footer — always based on locally matched cats. */
export function formatRevealFooter(
  revealedCount: number,
  matchedCount: number,
): string {
  return `Showing ${revealedCount} of ${matchedCount} cats`;
}
