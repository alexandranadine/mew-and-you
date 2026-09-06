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

function imagePreload() {
  return document.head.querySelector(
    'link#route-image-preload[rel="preload"][as="image"]',
  );
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

describe("PageMeta image preload", () => {
  it("injects a high-priority image preload when requested", () => {
    render(
      <PageMeta
        title="Home"
        description="Browse adoptable cats."
        canonicalPath="/"
        preloadImage="/images/mew-and-you-cat-peek.png"
      />,
    );

    const link = imagePreload();
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/images/mew-and-you-cat-peek.png");
    expect(link).toHaveAttribute("fetchpriority", "high");
  });

  it("does not preload the hero image on routes that omit preloadImage", () => {
    render(
      <PageMeta
        title="About"
        description="About this site."
        canonicalPath="/about"
      />,
    );

    expect(imagePreload()).toBeNull();
  });

  it("removes the preload when leaving a route that requested it", () => {
    const { unmount } = render(
      <PageMeta
        title="Home"
        description="Browse adoptable cats."
        canonicalPath="/"
        preloadImage="/images/mew-and-you-cat-peek.png"
      />,
    );

    expect(imagePreload()).not.toBeNull();
    unmount();
    expect(imagePreload()).toBeNull();
  });
});
