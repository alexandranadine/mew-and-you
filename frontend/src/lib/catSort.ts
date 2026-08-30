import type { CatSortOption } from "../types/search";

interface SortableCat {
  name: string;
  distanceMiles?: number;
}

/** Pure sorting, independent of any UI. */
export function sortCats<T extends SortableCat>(
  cats: T[],
  sortBy: CatSortOption,
): T[] {
  const sorted = [...cats];

  if (sortBy === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort(
      (a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity),
    );
  }

  return sorted;
}
