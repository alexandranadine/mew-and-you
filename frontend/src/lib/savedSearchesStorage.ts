import type { CatAgeGroup, CatSex, CatSize } from "../types/cat";
import type { CatFilters, CatSearchQuery, CatSortOption } from "../types/search";
import { DEFAULT_RADIUS_MILES, RADIUS_OPTIONS_MILES } from "./searchOptions";
import { catSearchQueryToParams } from "./searchParams";
import { isValidZipFormat } from "./zipLookup";

/** localStorage key for persisted saved searches (no auth / backend). */
export const SAVED_SEARCHES_STORAGE_KEY = "mew-and-you:saved-searches";

const CHANGE_EVENT = "mew-and-you:saved-searches-change";

const AGE_GROUPS: readonly CatAgeGroup[] = ["baby", "young", "adult", "senior"];
const SEXES: readonly CatSex[] = ["male", "female"];
const SIZES: readonly CatSize[] = ["small", "medium", "large"];
const SORT_VALUES: readonly CatSortOption[] = ["distance", "name"];

export interface SavedSearch {
  id: string;
  /** Optional display name; empty when the user left it blank. */
  name: string;
  savedAt: string;
  query: CatSearchQuery;
}

let cachedSearches: SavedSearch[] = [];
let cachedRaw: string | null | undefined;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isAgeGroup(value: unknown): value is CatAgeGroup {
  return typeof value === "string" && (AGE_GROUPS as readonly string[]).includes(value);
}

function isSex(value: unknown): value is CatSex {
  return typeof value === "string" && (SEXES as readonly string[]).includes(value);
}

function isSize(value: unknown): value is CatSize {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

function isSort(value: unknown): value is CatSortOption {
  return typeof value === "string" && (SORT_VALUES as readonly string[]).includes(value);
}

function parseFilters(raw: unknown): CatFilters {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const filters: CatFilters = {};
  if (isAgeGroup(source.ageGroup)) filters.ageGroup = source.ageGroup;
  if (isSex(source.sex)) filters.sex = source.sex;
  if (isSize(source.size)) filters.size = source.size;
  if (typeof source.organizationId === "string" && source.organizationId.trim()) {
    filters.organizationId = source.organizationId.trim();
  }
  return filters;
}

function parseQuery(raw: unknown): CatSearchQuery | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const zip = typeof source.zip === "string" ? source.zip.trim() : "";
  if (!isValidZipFormat(zip)) return null;

  const radiusMiles =
    typeof source.radiusMiles === "number" &&
    (RADIUS_OPTIONS_MILES as readonly number[]).includes(source.radiusMiles)
      ? source.radiusMiles
      : DEFAULT_RADIUS_MILES;

  return {
    zip,
    radiusMiles,
    filters: parseFilters(source.filters),
    sort: isSort(source.sort) ? source.sort : "distance",
  };
}

function parseSavedSearch(raw: unknown): SavedSearch | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const id = typeof source.id === "string" ? source.id.trim() : "";
  if (!id) return null;
  const query = parseQuery(source.query);
  if (!query) return null;
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const savedAt =
    typeof source.savedAt === "string" && source.savedAt
      ? source.savedAt
      : new Date(0).toISOString();
  return { id, name, savedAt, query };
}

function sameSearches(a: SavedSearch[], b: SavedSearch[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((entry, index) => {
    const other = b[index];
    return (
      other != null &&
      entry.id === other.id &&
      entry.name === other.name &&
      entry.savedAt === other.savedAt &&
      searchFingerprint(entry.query) === searchFingerprint(other.query)
    );
  });
}

/** Stable string for duplicate detection (ignores name / id / timestamps). */
export function searchFingerprint(query: CatSearchQuery): string {
  return catSearchQueryToParams(query).toString();
}

/** Parse and validate a stored saved-searches payload. */
export function parseSavedSearches(raw: string | null): SavedSearch[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seenIds = new Set<string>();
    const seenQueries = new Set<string>();
    const searches: SavedSearch[] = [];
    for (const item of parsed) {
      const search = parseSavedSearch(item);
      if (!search) continue;
      if (seenIds.has(search.id)) continue;
      const fingerprint = searchFingerprint(search.query);
      if (seenQueries.has(fingerprint)) continue;
      seenIds.add(search.id);
      seenQueries.add(fingerprint);
      searches.push(search);
    }
    return searches;
  } catch {
    return [];
  }
}

/**
 * Snapshot for `useSyncExternalStore` — returns a referentially stable array
 * when the stored value has not changed.
 */
export function readSavedSearches(): SavedSearch[] {
  if (!isBrowser()) return cachedSearches;
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY);
  } catch {
    return cachedSearches;
  }
  if (raw === cachedRaw) return cachedSearches;
  const next = parseSavedSearches(raw);
  cachedRaw = raw;
  if (sameSearches(cachedSearches, next)) return cachedSearches;
  cachedSearches = next;
  return cachedSearches;
}

export function writeSavedSearches(searches: SavedSearch[]): void {
  if (!isBrowser()) return;
  const unique = parseSavedSearches(JSON.stringify(searches));
  const serialized = JSON.stringify(unique);
  try {
    localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, serialized);
  } catch {
    // Quota / private mode — skip notifying listeners rather than throw.
    return;
  }
  cachedRaw = serialized;
  if (!sameSearches(cachedSearches, unique)) {
    cachedSearches = unique;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function findSavedSearchByQuery(
  query: CatSearchQuery,
  searches = readSavedSearches(),
): SavedSearch | undefined {
  const fingerprint = searchFingerprint(query);
  return searches.find((entry) => searchFingerprint(entry.query) === fingerprint);
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Persist a search if an equivalent query is not already saved.
 * Returns the existing or newly created entry, or null when the write failed.
 */
export function saveSearch(
  query: CatSearchQuery,
  name = "",
): SavedSearch | null {
  const current = readSavedSearches();
  const existing = findSavedSearchByQuery(query, current);
  if (existing) return existing;

  const entry: SavedSearch = {
    id: createId(),
    name: name.trim(),
    savedAt: new Date().toISOString(),
    query,
  };
  const next = [entry, ...current];
  writeSavedSearches(next);
  return findSavedSearchByQuery(query) ?? entry;
}

export function removeSavedSearch(id: string): void {
  const trimmed = id.trim();
  if (!trimmed) return;
  writeSavedSearches(readSavedSearches().filter((entry) => entry.id !== trimmed));
}

/**
 * Subscribe to saved-search list changes in this tab (custom event) and across
 * tabs (`storage`). Returns an unsubscribe function.
 */
export function subscribeSavedSearches(onStoreChange: () => void): () => void {
  if (!isBrowser()) return () => {};

  const onCustom = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === SAVED_SEARCHES_STORAGE_KEY || event.key === null) {
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
