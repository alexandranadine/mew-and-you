import { describe, expect, it } from "vitest";
import {
  filterCats,
  hasActiveFilters,
  toggleFilterValue,
} from "./catFilters";
import { makeCat } from "../test/catFixture";

const cats = [
  makeCat({
    id: "1",
    name: "Fiona",
    sex: "female",
    ageGroup: "young",
    size: "small",
  }),
  makeCat({
    id: "2",
    name: "Max",
    sex: "male",
    ageGroup: "adult",
    size: "medium",
  }),
  makeCat({
    id: "3",
    name: "Luna",
    sex: "female",
    ageGroup: "adult",
    size: "large",
  }),
  makeCat({
    id: "4",
    name: "Mystery",
    sex: "unknown",
    ageGroup: "unknown",
    size: "unknown",
  }),
];

describe("filterCats multi-select", () => {
  it("uses OR logic within one category", () => {
    const result = filterCats(cats, { sex: ["female", "male"] });
    expect(result.map((cat) => cat.id)).toEqual(["1", "2", "3"]);
  });

  it("combines categories with AND logic", () => {
    const result = filterCats(cats, {
      sex: ["female", "male"],
      ageGroup: ["young", "adult"],
      size: ["small"],
    });
    expect(result.map((cat) => cat.id)).toEqual(["1"]);
  });

  it("treats an empty selection as all / no filter for that category", () => {
    expect(filterCats(cats, { sex: [] }).map((cat) => cat.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(filterCats(cats, {}).map((cat) => cat.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("does not match unknown values against selected known values", () => {
    const bySex = filterCats(cats, { sex: ["female"] });
    expect(bySex.map((cat) => cat.id)).toEqual(["1", "3"]);

    const byAge = filterCats(cats, { ageGroup: ["adult"] });
    expect(byAge.map((cat) => cat.id)).toEqual(["2", "3"]);

    const bySize = filterCats(cats, { size: ["medium"] });
    expect(bySize.map((cat) => cat.id)).toEqual(["2"]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for empty multi-select arrays and missing fields", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ ageGroup: [], sex: [], size: [] })).toBe(false);
  });

  it("is true when any multi-select or org filter is set", () => {
    expect(hasActiveFilters({ sex: ["female"] })).toBe(true);
    expect(hasActiveFilters({ organizationId: "org-1" })).toBe(true);
  });
});

describe("toggleFilterValue", () => {
  const order = ["female", "male"] as const;

  it("adds, removes, and clears back to undefined (all)", () => {
    expect(toggleFilterValue(undefined, "female", order)).toEqual(["female"]);
    expect(toggleFilterValue(["female"], "male", order)).toEqual([
      "female",
      "male",
    ]);
    expect(toggleFilterValue(["female", "male"], "female", order)).toEqual([
      "male",
    ]);
    expect(toggleFilterValue(["male"], "male", order)).toBeUndefined();
  });
});
