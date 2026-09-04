import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CatCard } from "../components/cats/CatCard";
import { CatCardSkeleton } from "../components/cats/CatCardSkeleton";
import {
  CatFilterBar,
  type CatFilterBarChange,
} from "../components/cats/CatFilterBar";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { SaveSearchPanel } from "../components/search/SaveSearchPanel";
import { PageMeta } from "../components/seo/PageMeta";
import { useCatsSearch } from "../hooks/useCatsSearch";
import { filterCats } from "../lib/catFilters";
import { sortCats } from "../lib/catSort";
import {
  parseCatSearchParams,
  patchSearchParams,
  type CatSearchParamsError,
} from "../lib/searchParams";
import { invalidSearchSeo, searchSeo } from "../config/seo";

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const parsed = useMemo(
    () => parseCatSearchParams(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const query = parsed.ok ? parsed.query : undefined;

  const { data, isPending, isError, error, refetch, isFetching } =
    useCatsSearch(query);

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

  const visibleCats = useMemo(() => {
    if (!data || !query) return [];
    const filtered = filterCats(data.cats, query.filters);
    return sortCats(filtered, query.sort);
  }, [data, query]);

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
  const hasActiveFilters = Boolean(
    activeQuery.filters.ageGroup ||
      activeQuery.filters.sex ||
      activeQuery.filters.size ||
      activeQuery.filters.organizationId,
  );

  function handleFilterChange(patch: CatFilterBarChange) {
    // Only patch keys the bar actually changed — spreading every field as
    // undefined would wipe the other active filters via patchSearchParams.
    const next: Record<string, string | undefined> = {};
    if ("ageGroup" in patch) next.ageGroup = patch.ageGroup;
    if ("sex" in patch) next.sex = patch.sex;
    if ("size" in patch) next.size = patch.size;
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

  const detailQuery = `zip=${encodeURIComponent(activeQuery.zip)}`;
  const meta = searchSeo(activeQuery.zip);

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
        <h1 className="mt-2 text-3xl font-semibold text-mauve-700">
          Cats near {activeQuery.zip}
        </h1>
        <p className="mt-1 text-mauve-400" aria-live="polite">
          {isPending
            ? `Searching within ${activeQuery.radiusMiles} miles\u2026`
            : data
              ? `${visibleCats.length} potential roommate${visibleCats.length === 1 ? "" : "s"} within ${activeQuery.radiusMiles} miles`
              : ""}
        </p>
        <SaveSearchPanel query={activeQuery} />
      </div>

      <div className="mb-8">
        <CatFilterBar
          filters={activeQuery.filters}
          sort={activeQuery.sort}
          organizationOptions={organizationOptions}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <h2 className="sr-only">Search results</h2>

      {isPending && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CatCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isPending && isError && (
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

      {!isPending && !isError && data && visibleCats.length === 0 && (
        <SearchStateCard
          icon="🔍"
          title="No cats matched your search"
          message="Try a larger radius or fewer filters — new cats are added often."
        >
          {hasActiveFilters && (
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

      {!isPending && !isError && data && visibleCats.length > 0 && (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-live="polite"
        >
          {visibleCats.map((cat) => (
            <CatCard
              key={cat.id}
              cat={cat}
              distanceMiles={cat.distanceMiles}
              detailQuery={detailQuery}
            />
          ))}
        </div>
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
