import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useSavedSearches } from "../../hooks/useSavedSearches";
import { searchFingerprint } from "../../lib/savedSearchesStorage";
import type { CatSearchQuery } from "../../types/search";

interface SaveSearchPanelProps {
  query: CatSearchQuery;
}

/**
 * Lightweight localStorage save control for the current results URL state.
 * Duplicates (same ZIP/radius/filters/sort) are blocked.
 */
export function SaveSearchPanel({ query }: SaveSearchPanelProps) {
  const nameId = useId();
  const statusId = useId();
  const { findByQuery, save } = useSavedSearches();
  const existing = findByQuery(query);
  const [name, setName] = useState("");
  const [justSavedFingerprint, setJustSavedFingerprint] = useState<
    string | null
  >(null);
  const fingerprint = searchFingerprint(query);
  const justSaved = justSavedFingerprint === fingerprint;

  if (existing) {
    return (
      <div
        className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mauve-500"
        role="status"
        aria-live="polite"
      >
        <span>
          {justSaved
            ? "Search saved on this device."
            : "This search is already saved."}
        </span>
        <Link
          to="/saved-searches"
          className="focus-ring font-medium text-mauve-600 underline-offset-2 hover:underline"
        >
          View saved searches
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const result = save(query, name);
        if (result) {
          setName("");
          setJustSavedFingerprint(fingerprint);
        }
      }}
      aria-describedby={statusId}
    >
      <div className="min-w-0 flex-1">
        <label htmlFor={nameId} className="field-label">
          Save this search
        </label>
        <input
          id={nameId}
          type="text"
          className="field-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name (optional)"
          maxLength={80}
          autoComplete="off"
        />
      </div>
      <button type="submit" className="btn-secondary shrink-0 px-5 py-2.5">
        Save search
      </button>
      <p id={statusId} className="sr-only">
        Saves the current ZIP, radius, filters, and sort on this device.
      </p>
    </form>
  );
}
