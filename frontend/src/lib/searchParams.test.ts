import { describe, expect, it } from "vitest";
import {
  catSearchQueryToParams,
  parseCatSearchParams,
  parseMultiEnumParam,
  patchSearchParams,
  serializeMultiEnumParam,
} from "./searchParams";

describe("multi-select URL params", () => {
  it("serializes multi-select filters as stable comma-separated values", () => {
    const params = catSearchQueryToParams({
      zip: "91350",
      radiusMiles: 25,
      filters: {
        ageGroup: ["young", "adult"],
        sex: ["female", "male"],
        size: ["small"],
      },
      sort: "distance",
    });

    expect(params.get("zip")).toBe("91350");
    expect(params.get("radius")).toBe("25");
    expect(params.get("ageGroup")).toBe("young,adult");
    expect(params.get("sex")).toBe("female,male");
    expect(params.get("size")).toBe("small");
    expect(params.get("sort")).toBeNull();
  });

  it("parses comma-separated multi-select values and drops unknowns", () => {
    const parsed = parseCatSearchParams(
      new URLSearchParams(
        "zip=91350&radius=50&sex=female,male,nope&ageGroup=adult&size=small,large",
      ),
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.query.filters.sex).toEqual(["female", "male"]);
    expect(parsed.query.filters.ageGroup).toEqual(["adult"]);
    expect(parsed.query.filters.size).toEqual(["small", "large"]);
    expect(parsed.query.radiusMiles).toBe(50);
  });

  it("still accepts a single legacy value without commas", () => {
    expect(parseMultiEnumParam("female", ["female", "male"] as const)).toEqual([
      "female",
    ]);
    expect(serializeMultiEnumParam(["female"])).toBe("female");
    expect(serializeMultiEnumParam([])).toBeUndefined();
    expect(serializeMultiEnumParam(undefined)).toBeUndefined();
  });

  it("omits empty multi-select filters from the URL", () => {
    const params = catSearchQueryToParams({
      zip: "91350",
      radiusMiles: 25,
      filters: {},
      sort: "name",
    });
    expect(params.get("ageGroup")).toBeNull();
    expect(params.get("sex")).toBeNull();
    expect(params.get("size")).toBeNull();
    expect(params.get("sort")).toBe("name");
  });
});

describe("radius search params", () => {
  it("updates radius via patchSearchParams without changing zip", () => {
    const current = new URLSearchParams(
      "zip=91350&radius=25&sex=female,male&ageGroup=adult",
    );
    const next = patchSearchParams(current, { radius: "50" });

    expect(next.get("zip")).toBe("91350");
    expect(next.get("radius")).toBe("50");
    expect(next.get("sex")).toBe("female,male");
    expect(next.get("ageGroup")).toBe("adult");
  });

  it("clears every multi-select category when reset-patching filters", () => {
    const current = new URLSearchParams(
      "zip=91350&radius=25&sex=female,male&ageGroup=young,adult&size=small&org=org-1&sort=name",
    );
    const next = patchSearchParams(current, {
      ageGroup: undefined,
      sex: undefined,
      size: undefined,
      org: undefined,
      sort: undefined,
    });

    expect(next.get("zip")).toBe("91350");
    expect(next.get("radius")).toBe("25");
    expect(next.get("ageGroup")).toBeNull();
    expect(next.get("sex")).toBeNull();
    expect(next.get("size")).toBeNull();
    expect(next.get("org")).toBeNull();
    expect(next.get("sort")).toBeNull();
  });
});
