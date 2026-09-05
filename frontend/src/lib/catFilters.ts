import type { Cat } from "../types/cat";
import type { CatFilters } from "../types/search";

/** True when any client-side attribute filter is narrowing results. */
export function hasActiveFilters(filters: CatFilters): boolean {
  return Boolean(
    (filters.ageGroup?.length ?? 0) > 0 ||
      (filters.sex?.length ?? 0) > 0 ||
      (filters.size?.length ?? 0) > 0 ||
      filters.organizationId,
  );
}

/**
 * Pure filtering, independent of any UI. Species is implicitly "cat" — every
 * record here already is one.
 *
 * Within a multi-select category, values combine with OR. Categories combine
 * with AND. Empty/undefined for a category means no filter. Unknown/missing
 * attribute values only match when explicitly selected (they never match a
 * selected known value by accident).
 */
export function filterCats<T extends Cat>(cats: T[], filters: CatFilters): T[] {
  return cats.filter((cat) => {
    if (
      filters.ageGroup?.length &&
      !filters.ageGroup.includes(cat.ageGroup)
    ) {
      return false;
    }
    if (filters.sex?.length && !filters.sex.includes(cat.sex)) {
      return false;
    }
    if (filters.size?.length && !filters.size.includes(cat.size)) {
      return false;
    }
    if (
      filters.organizationId &&
      cat.organization.id !== filters.organizationId
    ) {
      return false;
    }
    return true;
  });
}

/** Toggle a value in a multi-select list; empty result becomes undefined (“all”). */
export function toggleFilterValue<T extends string>(
  current: readonly T[] | undefined,
  value: T,
  allowedOrder: readonly T[],
): T[] | undefined {
  const selected = new Set(current ?? []);
  if (selected.has(value)) selected.delete(value);
  else selected.add(value);
  const next = allowedOrder.filter((item) => selected.has(item));
  return next.length > 0 ? next : undefined;
}
