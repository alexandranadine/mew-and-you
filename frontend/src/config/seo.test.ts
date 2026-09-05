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

  it("uses a friendly display name for ALL-CAPS cats in title copy", () => {
    const meta = catDetailSeo(makeCat({ name: "TRAVIE", description: "" }));
    expect(meta.title).toMatch(/^Travie —/);
    expect(meta.description).toContain("Travie is an adoptable cat");
    expect(meta.title).not.toMatch(/^TRAVIE/);
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

  it("keeps the raw source name in structured data", () => {
    const ld = catJsonLd(
      makeCat({ name: "ROOTY TOOTY" }),
      "https://example.com/cats/1",
    );
    expect(ld.name).toBe("ROOTY TOOTY");
  });
});
