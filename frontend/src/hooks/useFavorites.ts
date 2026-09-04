import { useCallback, useSyncExternalStore } from "react";
import {
  readFavoriteIds,
  removeFavoriteIds,
  subscribeFavoriteIds,
  toggleFavoriteId,
} from "../lib/favoritesStorage";

function getFavoriteIdsSnapshot(): string[] {
  return readFavoriteIds();
}

/** Server / SSR snapshot — favorites are client-only. */
function getServerFavoriteIdsSnapshot(): string[] {
  return [];
}

/** Reactive list of favorited cat IDs backed by localStorage. */
export function useFavoriteIds(): string[] {
  return useSyncExternalStore(
    subscribeFavoriteIds,
    getFavoriteIdsSnapshot,
    getServerFavoriteIdsSnapshot,
  );
}

export function useIsFavorite(catId: string): boolean {
  const ids = useFavoriteIds();
  return ids.includes(catId);
}

export function useFavorites() {
  const ids = useFavoriteIds();

  const isFavorite = useCallback(
    (catId: string) => ids.includes(catId),
    [ids],
  );

  const toggleFavorite = useCallback((catId: string) => {
    return toggleFavoriteId(catId);
  }, []);

  const removeFavorites = useCallback((catIds: Iterable<string>) => {
    removeFavoriteIds(catIds);
  }, []);

  return { ids, isFavorite, toggleFavorite, removeFavorites };
}
