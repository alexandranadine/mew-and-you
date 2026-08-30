import type { CatAgeGroup, CatSex, CatSize } from "../types/cat";
import type { CatSortOption } from "../types/search";

export const RADIUS_OPTIONS_MILES = [5, 10, 25, 50, 100] as const;

export const DEFAULT_RADIUS_MILES = 25;

export const AGE_GROUP_OPTIONS: { value: CatAgeGroup; label: string }[] = [
  { value: "baby", label: "Baby" },
  { value: "young", label: "Young" },
  { value: "adult", label: "Adult" },
  { value: "senior", label: "Senior" },
];

export const SEX_OPTIONS: { value: CatSex; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

export const SIZE_OPTIONS: { value: CatSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export const SORT_OPTIONS: { value: CatSortOption; label: string }[] = [
  { value: "distance", label: "Distance" },
  { value: "name", label: "Name (A–Z)" },
];

export function ageGroupLabel(value: CatAgeGroup): string {
  return (
    AGE_GROUP_OPTIONS.find((option) => option.value === value)?.label ?? value
  );
}
