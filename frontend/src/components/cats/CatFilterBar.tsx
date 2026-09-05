import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  SORT_OPTIONS,
} from "../../lib/searchOptions";
import { toggleFilterValue } from "../../lib/catFilters";
import type { CatAgeGroup, CatSex, CatSize } from "../../types/cat";
import type { CatFilters, CatSortOption } from "../../types/search";

export interface CatFilterBarChange {
  ageGroup?: CatAgeGroup[];
  sex?: CatSex[];
  size?: CatSize[];
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

interface FilterChipGroupProps<T extends string> {
  legend: string;
  options: { value: T; label: string }[];
  values: readonly T[] | undefined;
  onToggle: (value: T) => void;
}

function FilterChipGroup<T extends string>({
  legend,
  options,
  values,
  onToggle,
}: FilterChipGroupProps<T>) {
  const selected = new Set(values ?? []);

  return (
    <fieldset className="min-w-0">
      <legend className="field-label mb-1.5 px-0">{legend}</legend>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={legend}>
        {options.map((option) => {
          const isActive = selected.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggle(option.value)}
              className={
                isActive
                  ? "focus-ring rounded-full border-2 border-blush-400 bg-blush-100 px-2.5 py-1 text-xs font-medium text-mauve-700"
                  : "focus-ring rounded-full border-2 border-blush-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-mauve-500 hover:border-blush-300 hover:text-mauve-700"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
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
    <div className="card rounded-[1.75rem] border-blush-50 p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterChipGroup
            legend="Age"
            options={AGE_GROUP_OPTIONS}
            values={filters.ageGroup}
            onToggle={(value) =>
              onChange({
                ageGroup: toggleFilterValue(
                  filters.ageGroup,
                  value,
                  AGE_GROUP_OPTIONS.map((option) => option.value),
                ),
              })
            }
          />
          <FilterChipGroup
            legend="Sex"
            options={SEX_OPTIONS}
            values={filters.sex}
            onToggle={(value) =>
              onChange({
                sex: toggleFilterValue(
                  filters.sex,
                  value,
                  SEX_OPTIONS.map((option) => option.value),
                ),
              })
            }
          />
          <FilterChipGroup
            legend="Size"
            options={SIZE_OPTIONS}
            values={filters.size}
            onToggle={(value) =>
              onChange({
                size: toggleFilterValue(
                  filters.size,
                  value,
                  SIZE_OPTIONS.map((option) => option.value),
                ),
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <div className="min-w-0 sm:col-span-1 lg:col-span-2">
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

          <div className="min-w-0 sm:col-span-1 lg:col-span-2">
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
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
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
