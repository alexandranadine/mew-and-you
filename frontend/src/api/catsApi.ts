import { mockCats, findMockCatById } from "../data/mockCats";
import { searchCats } from "../lib/searchCats";
import type { Cat } from "../types/cat";
import type { CatSearchQuery, CatSearchResult } from "../types/search";

/** Simulated network latency so loading states are real to build/test against. */
const MOCK_NETWORK_DELAY_MS = 350;

/**
 * Stand-in for a real backend call. Swap the body of these functions for
 * `fetch('/api/cats?...')` once the backend exists — callers (the React
 * Query hooks) won't need to change.
 */
export function fetchCats(query: CatSearchQuery): Promise<CatSearchResult> {
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

export function fetchCatById(id: string): Promise<Cat | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(findMockCatById(id)), MOCK_NETWORK_DELAY_MS);
  });
}
