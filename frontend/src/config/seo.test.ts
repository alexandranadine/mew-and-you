import { describe, expect, it } from "vitest";
import { catDetailSeo, catJsonLd } from "./seo";
import { missingBioMessage } from "../lib/catDisplay";
import { makeCat } from "../test/catFixture";

describe("catDetailSeo", () => {
  it("uses a generic fallback when description is empty", () => {
    const meta = catDetailSeo(makeCat({ description: "" }));
    expect(meta.description).toContain("Miso is an adoptable cat");
    expect(meta.description).not.toBe(missingBioMessage("Miso"));
    expect(meta.description).not.toContain("hasn’t added a bio");
  });

  it("uses a generic fallback for the backend placeholder description", () => {
    const meta = catDetailSeo(
      makeCat({ description: "No description provided yet." }),
    );
    expect(meta.description).toContain("Miso is an adoptable cat");
    expect(meta.description).not.toContain("No description provided yet");
    expect(meta.description).not.toContain("hasn’t added a bio");
  });

  it("uses the real bio when present", () => {
    const meta = catDetailSeo(
      makeCat({ description: "Loves cardboard boxes and quiet evenings." }),
    );
    expect(meta.description).toContain("Loves cardboard boxes");
  });
});

describe("catJsonLd", () => {
  it("omits description when the bio is missing or a placeholder", () => {
    expect(
      catJsonLd(makeCat({ description: "" }), "https://example.com/cats/1"),
    ).not.toHaveProperty("description");
    expect(
      catJsonLd(
        makeCat({ description: "No description provided yet." }),
        "https://example.com/cats/1",
      ),
    ).not.toHaveProperty("description");
  });
});
