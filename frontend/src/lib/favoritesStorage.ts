/** localStorage key for persisted favorite cat IDs (no auth / backend). */
export const FAVORITES_STORAGE_KEY = "mew-and-you:favorites";

const CHANGE_EVENT = "mew-and-you:favorites-change";

let cachedIds: string[] = [];
let cachedRaw: string | null | undefined;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function sameIds(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

/** Parse and dedupe a stored favorites payload into a stable ID list. */
export function parseFavoriteIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const id = item.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}

/**
 * Snapshot for `useSyncExternalStore` — returns a referentially stable array
 * when the stored value has not changed.
 */
export function readFavoriteIds(): string[] {
  if (!isBrowser()) return cachedIds;
  let raw: string | null;
  try {
    raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  } catch {
    return cachedIds;
  }
  if (raw === cachedRaw) return cachedIds;
  const next = parseFavoriteIds(raw);
  cachedRaw = raw;
  if (sameIds(cachedIds, next)) return cachedIds;
  cachedIds = next;
  return cachedIds;
}

export function writeFavoriteIds(ids: string[]): void {
  if (!isBrowser()) return;
  const unique = parseFavoriteIds(JSON.stringify(ids));
  const serialized = JSON.stringify(unique);
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, serialized);
  } catch {
    // Quota / private mode — skip notifying listeners rather than throw.
    return;
  }
  cachedRaw = serialized;
  if (!sameIds(cachedIds, unique)) {
    cachedIds = unique;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function isFavoriteId(id: string, ids = readFavoriteIds()): boolean {
  return ids.includes(id);
}

/** Toggle `id` in storage. Returns whether it is favorited after the update. */
export function toggleFavoriteId(id: string): boolean {
  const trimmed = id.trim();
  if (!trimmed) return false;
  const current = readFavoriteIds();
  const exists = current.includes(trimmed);
  const next = exists
    ? current.filter((entry) => entry !== trimmed)
    : [...current, trimmed];
  writeFavoriteIds(next);
  return !exists;
}

export function removeFavoriteIds(idsToRemove: Iterable<string>): void {
  const remove = new Set(
    [...idsToRemove].map((id) => id.trim()).filter(Boolean),
  );
  if (remove.size === 0) return;
  writeFavoriteIds(readFavoriteIds().filter((id) => !remove.has(id)));
}

/**
 * Subscribe to favorite list changes in this tab (custom event) and across
 * tabs (`storage`). Returns an unsubscribe function.
 */
export function subscribeFavoriteIds(onStoreChange: () => void): () => void {
  if (!isBrowser()) return () => {};

  const onCustom = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY || event.key === null) {
      // Invalidate cache so the next snapshot re-reads localStorage.
      cachedRaw = undefined;
      onStoreChange();
    }
  };

  window.addEventListener(CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
