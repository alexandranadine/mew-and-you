import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  SORT_OPTIONS,
} from "../../lib/searchOptions";
import type { CatAgeGroup, CatSex, CatSize } from "../../types/cat";
import type { CatFilters, CatSortOption } from "../../types/search";

export interface CatFilterBarChange {
  ageGroup?: CatAgeGroup;
  sex?: CatSex;
  size?: CatSize;
  organizationId?: string;
  sort?: CatSortOption;
}

interface CatFilterBarProps {
  filters: CatFilters;
  sort: CatSortOption;
  organizationOptions: { id: string; name: string }[];
  onChange: (patch: CatFilterBarChange) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function CatFilterBar({
  filters,
  sort,
  organizationOptions,
  onChange,
  onReset,
  hasActiveFilters,
}: CatFilterBarProps) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <label htmlFor="filter-age" className="field-label">
            Age
          </label>
          <select
            id="filter-age"
            className="field-input"
            value={filters.ageGroup ?? ""}
            onChange={(event) =>
              onChange({
                ageGroup: (event.target.value || undefined) as
                  | CatAgeGroup
                  | undefined,
              })
            }
          >
            <option value="">All ages</option>
            {AGE_GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-sex" className="field-label">
            Sex
          </label>
          <select
            id="filter-sex"
            className="field-input"
            value={filters.sex ?? ""}
            onChange={(event) =>
              onChange({
                sex: (event.target.value || undefined) as CatSex | undefined,
              })
            }
          >
            <option value="">Any sex</option>
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-size" className="field-label">
            Size
          </label>
          <select
            id="filter-size"
            className="field-input"
            value={filters.size ?? ""}
            onChange={(event) =>
              onChange({
                size: (event.target.value || undefined) as CatSize | undefined,
              })
            }
          >
            <option value="">Any size</option>
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-org" className="field-label">
            Organization
          </label>
          <select
            id="filter-org"
            className="field-input"
            value={filters.organizationId ?? ""}
            onChange={(event) =>
              onChange({ organizationId: event.target.value || undefined })
            }
          >
            <option value="">All organizations</option>
            {organizationOptions.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort" className="field-label">
            Sort by
          </label>
          <select
            id="filter-sort"
            className="field-input"
            value={sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as CatSortOption })
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="focus-ring inline-block py-1 text-sm font-medium text-mauve-500 underline-offset-2 hover:text-mauve-700 hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
