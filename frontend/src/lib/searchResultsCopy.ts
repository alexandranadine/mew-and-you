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
  /** When false, omit "within N miles" (e.g. radius already shown nearby). Default true. */
  includeRadius?: boolean;
}): string {
  const {
    matchedCount,
    fetchedCount,
    totalCount,
    radiusMiles,
    hasActiveFilters,
    includeRadius = true,
  } = options;
  const radiusSuffix = includeRadius ? ` within ${radiusMiles} miles` : "";

  if (
    !hasActiveFilters &&
    fetchedCount < totalCount &&
    fetchedCount > 0
  ) {
    return `Showing the closest ${fetchedCount.toLocaleString("en-US")} of ${totalCount.toLocaleString("en-US")} cats${radiusSuffix}`;
  }

  const noun = matchedCount === 1 ? "roommate" : "roommates";
  return `${matchedCount} potential ${noun}${radiusSuffix}`;
}

/** Progressive reveal footer — always based on locally matched cats. */
export function formatRevealFooter(
  revealedCount: number,
  matchedCount: number,
): string {
  return `Showing ${revealedCount} of ${matchedCount} cats`;
}
