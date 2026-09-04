import { Link } from "react-router-dom";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { PageMeta } from "../components/seo/PageMeta";
import { savedSearchesSeo } from "../config/seo";
import { useSavedSearches } from "../hooks/useSavedSearches";
import {
  defaultSavedSearchTitle,
  formatSearchSummary,
} from "../lib/savedSearchLabels";
import { buildCatSearchUrl } from "../lib/searchParams";

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function SavedSearchesPage() {
  const { searches, remove } = useSavedSearches();
  const meta = savedSearchesSeo;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageMeta
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.canonicalPath}
        robots={meta.robots}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-mauve-700">Saved searches</h1>
        <p className="mt-1 text-mauve-400">
          Searches you&apos;ve saved on this device. Open one to run it again,
          or remove it anytime.
        </p>
      </div>

      {searches.length === 0 && (
        <SearchStateCard
          icon="🔍"
          title="No saved searches yet"
          message="On a results page, use Save search to keep the ZIP, radius, filters, and sort for later."
        >
          <Link to="/" className="btn-primary">
            Find a cat
          </Link>
        </SearchStateCard>
      )}

      {searches.length > 0 && (
        <ul className="flex flex-col gap-4" aria-label="Saved searches">
          {searches.map((search) => {
            const title = search.name || defaultSavedSearchTitle(search.query);
            const summary = formatSearchSummary(search.query);
            const savedAtLabel = formatSavedAt(search.savedAt);
            const runUrl = buildCatSearchUrl(search.query);

            return (
              <li key={search.id} className="card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-mauve-700">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm text-mauve-500">{summary}</p>
                    {savedAtLabel ? (
                      <p className="mt-2 text-xs text-mauve-400">
                        Saved {savedAtLabel}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link to={runUrl} className="btn-primary px-5 py-2.5 text-sm">
                      Run search
                    </Link>
                    <button
                      type="button"
                      className="btn-secondary px-5 py-2.5 text-sm"
                      onClick={() => remove(search.id)}
                      aria-label={`Delete saved search ${title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
