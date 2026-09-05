import { describe, expect, it } from "vitest";
import {
  formatCatCardMetadata,
  getCatDetailAttributes,
  hasRealDescription,
  missingBioMessage,
} from "./catDisplay";
import { makeCat } from "../test/catFixture";

describe("hasRealDescription", () => {
  it("treats empty and whitespace-only descriptions as missing", () => {
    expect(hasRealDescription("")).toBe(false);
    expect(hasRealDescription("   ")).toBe(false);
  });

  it("treats the backend placeholder as missing", () => {
    expect(hasRealDescription("No description provided yet.")).toBe(false);
    expect(hasRealDescription("no description provided yet")).toBe(false);
  });

  it("keeps real bios", () => {
    expect(hasRealDescription("Loves laser pointers.")).toBe(true);
  });
});

describe("missingBioMessage", () => {
  it("names the cat in the soft fallback copy", () => {
    expect(missingBioMessage("Willow")).toBe(
      "This shelter hasn’t added a bio for Willow yet.",
    );
  });
});

describe("formatCatCardMetadata", () => {
  it("joins known age, sex, and size with middots", () => {
    expect(formatCatCardMetadata(makeCat())).toBe("2 years · Female · Medium");
  });

  it("omits unknown age alone and keeps separators correct", () => {
    expect(
      formatCatCardMetadata(
        makeCat({ age: "Age unknown", ageGroup: "unknown" }),
      ),
    ).toBe("Female · Medium");
  });

  it("omits unknown sex alone and keeps separators correct", () => {
    expect(formatCatCardMetadata(makeCat({ sex: "unknown" }))).toBe(
      "2 years · Medium",
    );
  });

  it("omits unknown size alone and keeps separators correct", () => {
    expect(formatCatCardMetadata(makeCat({ size: "unknown" }))).toBe(
      "2 years · Female",
    );
  });

  it("omits multiple unknowns without trailing or doubled separators", () => {
    expect(
      formatCatCardMetadata(
        makeCat({
          age: "Age unknown",
          ageGroup: "unknown",
          sex: "unknown",
          size: "unknown",
        }),
      ),
    ).toBe("");
    expect(
      formatCatCardMetadata(
        makeCat({ age: "Age unknown", ageGroup: "unknown", size: "unknown" }),
      ),
    ).toBe("Female");
  });

  it("still shows a concrete age string when ageGroup is unknown", () => {
    expect(
      formatCatCardMetadata(
        makeCat({ age: "3 years", ageGroup: "unknown", sex: "male" }),
      ),
    ).toBe("3 years · Male · Medium");
  });

  it("does not invent values from the name or description", () => {
    expect(
      formatCatCardMetadata(
        makeCat({
          name: "Senior Tom",
          description: "This large male kitten is actually an adult.",
          age: "Age unknown",
          ageGroup: "unknown",
          sex: "unknown",
          size: "unknown",
        }),
      ),
    ).toBe("");
  });
});

describe("getCatDetailAttributes", () => {
  it("includes known age, sex, and size", () => {
    expect(getCatDetailAttributes(makeCat())).toEqual([
      { key: "age", label: "Age", value: "2 years", subvalue: "Adult" },
      { key: "sex", label: "Sex", value: "Female" },
      { key: "size", label: "Size", value: "Medium" },
    ]);
  });

  it("omits unknown age, sex, or size individually", () => {
    expect(
      getCatDetailAttributes(
        makeCat({ age: "Age unknown", ageGroup: "unknown" }),
      ).map((a) => a.key),
    ).toEqual(["sex", "size"]);

    expect(
      getCatDetailAttributes(makeCat({ sex: "unknown" })).map((a) => a.key),
    ).toEqual(["age", "size"]);

    expect(
      getCatDetailAttributes(makeCat({ size: "unknown" })).map((a) => a.key),
    ).toEqual(["age", "sex"]);
  });

  it("omits all attribute cells when age, sex, and size are unknown", () => {
    expect(
      getCatDetailAttributes(
        makeCat({
          age: "Age unknown",
          ageGroup: "unknown",
          sex: "unknown",
          size: "unknown",
        }),
      ),
    ).toEqual([]);
  });

  it("does not surface Unknown labels", () => {
    const attrs = getCatDetailAttributes(
      makeCat({
        age: "Age unknown",
        ageGroup: "unknown",
        sex: "unknown",
        size: "unknown",
      }),
    );
    const text = JSON.stringify(attrs).toLowerCase();
    expect(text).not.toContain("unknown");
  });
});
