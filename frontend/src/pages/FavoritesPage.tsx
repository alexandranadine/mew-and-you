import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchCatById } from "../api/catsApi";
import { CatCard } from "../components/cats/CatCard";
import { CatCardSkeleton } from "../components/cats/CatCardSkeleton";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { PageMeta } from "../components/seo/PageMeta";
import { favoritesSeo } from "../config/seo";
import { useFavorites } from "../hooks/useFavorites";
import type { Cat } from "../types/cat";

export function FavoritesPage() {
  const { ids, removeFavorites } = useFavorites();
  const meta = favoritesSeo;

  const queries = useQueries({
    queries: ids.map((catId) => ({
      queryKey: ["cats", "detail", catId] as const,
      queryFn: () => fetchCatById(catId),
    })),
  });

  const isPending = ids.length > 0 && queries.some((query) => query.isPending);
  const isFetching = queries.some((query) => query.isFetching);

  const cats: Cat[] = [];
  const missingIds: string[] = [];
  const failedIds: string[] = [];
  let settledCount = 0;

  ids.forEach((catId, index) => {
    const query = queries[index];
    if (!query || query.isPending) return;
    settledCount += 1;
    if (query.isError) {
      failedIds.push(catId);
      return;
    }
    if (!query.data) {
      missingIds.push(catId);
      return;
    }
    cats.push(query.data);
  });

  const allSettled = ids.length > 0 && settledCount === ids.length;
  const allFailed = allSettled && failedIds.length === ids.length;

  function refetchFailed() {
    for (const query of queries) {
      if (query.isError) void query.refetch();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageMeta
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.canonicalPath}
        robots={meta.robots}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-mauve-700">Favorites</h1>
        <p className="mt-1 text-mauve-400">
          Cats you&apos;ve saved on this device. Favorites stay here until you
          remove them.
        </p>
      </div>

      {ids.length === 0 && (
        <SearchStateCard
          icon="💕"
          title="No favorites yet"
          message="Tap the heart on a cat card or profile to save them here for later."
        >
          <Link to="/" className="btn-primary">
            Find a cat
          </Link>
        </SearchStateCard>
      )}

      {ids.length > 0 && isPending && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(ids.length, 6) }).map((_, index) => (
            <CatCardSkeleton key={index} />
          ))}
        </div>
      )}

      {ids.length > 0 && allSettled && allFailed && (
        <SearchStateCard
          icon="⚠️"
          title="Couldn't load favorites"
          message="We couldn't reach the listings right now. Please try again in a moment."
        >
          <button
            type="button"
            className="btn-primary"
            onClick={refetchFailed}
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Try again"}
          </button>
          <Link to="/" className="btn-secondary">
            Back to search
          </Link>
        </SearchStateCard>
      )}

      {ids.length > 0 &&
        allSettled &&
        !allFailed &&
        cats.length === 0 &&
        missingIds.length > 0 && (
          <SearchStateCard
            icon="🙀"
            title="Those cats are no longer listed"
            message="Saved listings can disappear when a cat is adopted. Clear them and try a new search."
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => removeFavorites(missingIds)}
            >
              Clear unavailable
            </button>
            <Link to="/" className="btn-primary">
              Find a cat
            </Link>
          </SearchStateCard>
        )}

      {ids.length > 0 && allSettled && !allFailed && cats.length > 0 && (
        <>
          {failedIds.length > 0 && (
            <div
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blush-100 bg-blush-50/80 px-4 py-3 text-sm text-mauve-500"
              role="status"
            >
              <p>
                {failedIds.length === 1
                  ? "1 favorite couldn't be loaded."
                  : `${failedIds.length} favorites couldn't be loaded.`}
              </p>
              <button
                type="button"
                className="focus-ring font-medium text-mauve-600 underline-offset-2 hover:underline"
                onClick={refetchFailed}
                disabled={isFetching}
              >
                {isFetching ? "Retrying…" : "Retry"}
              </button>
            </div>
          )}
          {missingIds.length > 0 && (
            <div
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blush-100 bg-blush-50/80 px-4 py-3 text-sm text-mauve-500"
              role="status"
            >
              <p>
                {missingIds.length === 1
                  ? "1 saved cat is no longer available."
                  : `${missingIds.length} saved cats are no longer available.`}
              </p>
              <button
                type="button"
                className="focus-ring font-medium text-mauve-600 underline-offset-2 hover:underline"
                onClick={() => removeFavorites(missingIds)}
              >
                Remove unavailable
              </button>
            </div>
          )}
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-live="polite"
          >
            {cats.map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
