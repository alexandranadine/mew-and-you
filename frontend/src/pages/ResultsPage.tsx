import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CatCard } from "../components/cats/CatCard";
import { CatCardSkeleton } from "../components/cats/CatCardSkeleton";
import {
  CatFilterBar,
  type CatFilterBarChange,
} from "../components/cats/CatFilterBar";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { PageMeta } from "../components/seo/PageMeta";
import { useCatsSearch } from "../hooks/useCatsSearch";
import { filterCats, hasActiveFilters } from "../lib/catFilters";
import { sortCats } from "../lib/catSort";
import {
  formatResultsHeadline,
  formatRevealFooter,
} from "../lib/searchResultsCopy";
import { RADIUS_OPTIONS_MILES } from "../lib/searchOptions";
import {
  parseCatSearchParams,
  patchSearchParams,
  serializeMultiEnumParam,
  type CatSearchParamsError,
} from "../lib/searchParams";
import { invalidSearchSeo, searchSeo } from "../config/seo";
import type { CatSearchQuery } from "../types/search";

/** How many result cards to mount at once (client-side reveal only). */
const REVEAL_PAGE_SIZE = 24;

/** Identity for ZIP / radius / filters — sort changes do not reset reveal. */
export function revealResetKeyForQuery(query: CatSearchQuery | undefined): string {
  if (!query) return "";
  return [
    query.zip,
    query.radiusMiles,
    serializeMultiEnumParam(query.filters.ageGroup) ?? "",
    serializeMultiEnumParam(query.filters.sex) ?? "",
    serializeMultiEnumParam(query.filters.size) ?? "",
    query.filters.organizationId ?? "",
  ].join("|");
}

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const parsed = useMemo(
    () => parseCatSearchParams(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const query = parsed.ok ? parsed.query : undefined;

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
    isPlaceholderData,
  } = useCatsSearch(query);

  const organizationOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const cat of data?.cats ?? []) {
      if (!byId.has(cat.organization.id)) {
        byId.set(cat.organization.id, {
          id: cat.organization.id,
          name: cat.organization.name,
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data]);

  const matchedCats = useMemo(() => {
    if (!data || !query) return [];
    const filtered = filterCats(data.cats, query.filters);
    return sortCats(filtered, query.sort);
  }, [data, query]);

  const revealResetKey = revealResetKeyForQuery(query);
  const [visibleCount, setVisibleCount] = useState(REVEAL_PAGE_SIZE);
  const [prevRevealResetKey, setPrevRevealResetKey] = useState(revealResetKey);

  // Reset progressive reveal when ZIP, radius, or filters change (not sort).
  if (revealResetKey !== prevRevealResetKey) {
    setPrevRevealResetKey(revealResetKey);
    setVisibleCount(REVEAL_PAGE_SIZE);
  }

  const revealedCount = Math.min(visibleCount, matchedCats.length);
  const revealedCats = matchedCats.slice(0, revealedCount);
  const hasMoreToReveal = revealedCount < matchedCats.length;

  function updateParams(patch: Record<string, string | undefined>) {
    setSearchParams((prev) => patchSearchParams(prev, patch), {
      replace: true,
    });
  }

  if (!parsed.ok) {
    const meta =
      parsed.error.code === "missing-zip" ? searchSeo() : invalidSearchSeo();
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
          robots={meta.robots}
        />
        <SearchErrorState error={parsed.error} />
      </div>
    );
  }

  const { query: activeQuery } = parsed;
  const filtersActive = hasActiveFilters(activeQuery.filters);

  function handleFilterChange(patch: CatFilterBarChange) {
    // Only patch keys the bar actually changed — spreading every field as
    // undefined would wipe the other active filters via patchSearchParams.
    const next: Record<string, string | undefined> = {};
    if ("ageGroup" in patch) {
      next.ageGroup = serializeMultiEnumParam(patch.ageGroup);
    }
    if ("sex" in patch) next.sex = serializeMultiEnumParam(patch.sex);
    if ("size" in patch) next.size = serializeMultiEnumParam(patch.size);
    if ("organizationId" in patch) next.org = patch.organizationId;
    if ("sort" in patch) {
      next.sort = patch.sort === "distance" ? undefined : patch.sort;
    }
    updateParams(next);
  }

  function handleResetFilters() {
    updateParams({
      ageGroup: undefined,
      sex: undefined,
      size: undefined,
      org: undefined,
      sort: undefined,
    });
  }

  function handleRadiusChange(radiusMiles: number) {
    updateParams({ radius: String(radiusMiles) });
  }

  const detailQuery = `zip=${encodeURIComponent(activeQuery.zip)}`;
  const meta = searchSeo(activeQuery.zip);
  const showInitialLoading = isPending && !data;
  const showUpdating = isFetching && isPlaceholderData;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageMeta
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.canonicalPath}
      />
      <div className="mb-6">
        <Link
          to="/"
          className="focus-ring inline-block py-1 text-sm font-medium text-mauve-500 hover:text-mauve-700"
        >
          ← New search
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className="text-3xl font-semibold text-mauve-700">
            Cats near {activeQuery.zip}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-mauve-400" aria-hidden="true">
              within
            </span>
            <label htmlFor="results-radius" className="sr-only">
              Search radius
            </label>
            <select
              id="results-radius"
              className="field-input w-auto min-w-0 py-1.5 pl-3 pr-8 text-sm"
              value={activeQuery.radiusMiles}
              onChange={(event) =>
                handleRadiusChange(Number(event.target.value))
              }
            >
              {RADIUS_OPTIONS_MILES.map((miles) => (
                <option key={miles} value={miles}>
                  {miles} miles
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-1.5 text-mauve-400" aria-live="polite">
          {showInitialLoading
            ? `Searching within ${activeQuery.radiusMiles} miles\u2026`
            : showUpdating
              ? `Updating results within ${activeQuery.radiusMiles} miles\u2026`
              : data
                ? formatResultsHeadline({
                    matchedCount: matchedCats.length,
                    fetchedCount: data.cats.length,
                    totalCount: data.totalCount,
                    radiusMiles: activeQuery.radiusMiles,
                    hasActiveFilters: filtersActive,
                  })
                : ""}
        </p>
      </div>

      <div className="mb-8">
        <CatFilterBar
          filters={activeQuery.filters}
          sort={activeQuery.sort}
          organizationOptions={organizationOptions}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          hasActiveFilters={filtersActive}
        />
      </div>

      <h2 className="sr-only">Search results</h2>

      {showInitialLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CatCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!showInitialLoading && isError && !data && (
        <SearchStateCard
          icon="⚠️"
          title="Something went wrong"
          message={
            error instanceof Error
              ? error.message
              : "We couldn't load cats for this search. Please try again."
          }
        >
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-primary"
          >
            {isFetching ? "Retrying…" : "Try again"}
          </button>
        </SearchStateCard>
      )}

      {!showInitialLoading && !isError && data && matchedCats.length === 0 && (
        <SearchStateCard
          icon="🔍"
          title="No cats matched your search"
          message="Try a larger radius or fewer filters — new cats are added often."
        >
          {filtersActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-secondary"
            >
              Reset filters
            </button>
          )}
          <Link to="/" className="btn-primary">
            Try a new search
          </Link>
        </SearchStateCard>
      )}

      {!showInitialLoading && data && matchedCats.length > 0 && (
        <>
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-live="polite"
          >
            {revealedCats.map((cat) => (
              <CatCard
                key={cat.id}
                cat={cat}
                distanceMiles={cat.distanceMiles}
                detailQuery={detailQuery}
              />
            ))}
          </div>

          {hasMoreToReveal && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-sm text-mauve-400">
                {formatRevealFooter(revealedCount, matchedCats.length)}
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setVisibleCount((count) => count + REVEAL_PAGE_SIZE)
                }
              >
                Show more cats
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchErrorState({ error }: { error: CatSearchParamsError }) {
  if (error.code === "missing-zip") {
    return (
      <SearchStateCard
        icon="🐾"
        title="Start a search to see cats"
        message="Head back home and enter a ZIP code to find adoptable cats nearby."
      >
        <Link to="/" className="btn-primary">
          Go to search
        </Link>
      </SearchStateCard>
    );
  }

  if (error.code === "invalid-zip") {
    return (
      <SearchStateCard
        icon="⚠️"
        title="That doesn't look like a ZIP code"
        message={`"${error.zip}" isn't a valid 5-digit ZIP code. Please try again.`}
      >
        <Link to="/" className="btn-primary">
          Back to search
        </Link>
      </SearchStateCard>
    );
  }

  return (
    <SearchStateCard
      icon="⚠️"
      title="Invalid search radius"
      message={`"${error.value}" isn't a supported search radius.`}
    >
      <Link to="/" className="btn-primary">
        Back to search
      </Link>
    </SearchStateCard>
  );
}
