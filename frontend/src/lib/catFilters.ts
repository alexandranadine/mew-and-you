import type { Cat } from "../types/cat";
import type { CatFilters } from "../types/search";

/** Pure filtering, independent of any UI. Species is implicitly "cat" — every record here already is one. */
export function filterCats<T extends Cat>(cats: T[], filters: CatFilters): T[] {
  return cats.filter((cat) => {
    if (filters.ageGroup && cat.ageGroup !== filters.ageGroup) return false;
    if (filters.sex && cat.sex !== filters.sex) return false;
    if (filters.size && cat.size !== filters.size) return false;
    if (
      filters.organizationId &&
      cat.organization.id !== filters.organizationId
    )
      return false;
    return true;
  });
}
