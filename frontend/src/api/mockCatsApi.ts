import { findMockCatById, mockCats } from "../data/mockCats";
import { searchCats } from "../lib/searchCats";
import type { Cat } from "../types/cat";
import type { CatSearchQuery, CatSearchResult } from "../types/search";

/**
 * Optional development fallback — runs entirely against local mock data, no
 * network involved. Not wired into the default search/detail flow (which
 * calls the real backend in src/api/catsApi.ts); kept around for local UI
 * work without a running backend, and never used as a silent fallback if
 * the real API fails.
 */
const MOCK_NETWORK_DELAY_MS = 350;

export function fetchMockCats(query: CatSearchQuery): Promise<CatSearchResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(searchCats(mockCats, query));
      } catch (error) {
        reject(error);
      }
    }, MOCK_NETWORK_DELAY_MS);
  });
}

export function fetchMockCatById(id: string): Promise<Cat | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(findMockCatById(id)), MOCK_NETWORK_DELAY_MS);
  });
}
