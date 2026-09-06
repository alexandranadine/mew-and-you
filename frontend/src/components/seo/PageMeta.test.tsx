import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getSiteOrigin, toAbsoluteUrl } from "../../config/seo";
import { PageMeta } from "./PageMeta";

afterEach(() => {
  cleanup();
});

function metaContent(attribute: "name" | "property", key: string) {
  return document.head
    .querySelector(`meta[${attribute}="${key}"]`)
    ?.getAttribute("content");
}

function canonicalHref() {
  return document.head
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href");
}

describe("PageMeta og:url", () => {
  it("matches the resolved canonical URL on the homepage", () => {
    render(
      <PageMeta
        title="Home"
        description="Browse adoptable cats."
        canonicalPath="/"
      />,
    );

    const expected = toAbsoluteUrl("/", getSiteOrigin());
    expect(canonicalHref()).toBe(expected);
    expect(metaContent("property", "og:url")).toBe(expected);
  });

  it("matches the resolved canonical URL on a non-root route", () => {
    render(
      <PageMeta
        title="About"
        description="About this site."
        canonicalPath="/about"
      />,
    );

    const expected = toAbsoluteUrl("/about", getSiteOrigin());
    expect(canonicalHref()).toBe(expected);
    expect(metaContent("property", "og:url")).toBe(expected);
  });
});
