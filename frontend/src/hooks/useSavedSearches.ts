import { useCallback, useSyncExternalStore } from "react";
import type { CatSearchQuery } from "../types/search";
import {
  findSavedSearchByQuery,
  readSavedSearches,
  removeSavedSearch,
  saveSearch,
  subscribeSavedSearches,
  type SavedSearch,
} from "../lib/savedSearchesStorage";

function getSavedSearchesSnapshot(): SavedSearch[] {
  return readSavedSearches();
}

/** Server / SSR snapshot — saved searches are client-only. */
function getServerSavedSearchesSnapshot(): SavedSearch[] {
  return [];
}

/** Reactive list of saved searches backed by localStorage. */
export function useSavedSearchList(): SavedSearch[] {
  return useSyncExternalStore(
    subscribeSavedSearches,
    getSavedSearchesSnapshot,
    getServerSavedSearchesSnapshot,
  );
}

export function useSavedSearches() {
  const searches = useSavedSearchList();

  const findByQuery = useCallback(
    (query: CatSearchQuery) => findSavedSearchByQuery(query, searches),
    [searches],
  );

  const save = useCallback((query: CatSearchQuery, name?: string) => {
    return saveSearch(query, name);
  }, []);

  const remove = useCallback((id: string) => {
    removeSavedSearch(id);
  }, []);

  return { searches, findByQuery, save, remove };
}
