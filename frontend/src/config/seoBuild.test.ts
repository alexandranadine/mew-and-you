import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { siteOrigin, transformSeoIndexHtml } from "../../vite.config";

const indexHtml = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../index.html"),
  "utf8",
);

describe("siteOrigin", () => {
  it("normalizes a bare hostname to https", () => {
    expect(siteOrigin({ VITE_SITE_URL: "mewandyou.com" })).toBe(
      "https://mewandyou.com",
    );
  });

  it("preserves an explicit http(s) origin and strips a trailing slash", () => {
    expect(siteOrigin({ VITE_SITE_URL: "https://mewandyou.com/" })).toBe(
      "https://mewandyou.com",
    );
    expect(siteOrigin({ VITE_SITE_URL: "http://localhost:5173" })).toBe(
      "http://localhost:5173",
    );
  });
});

describe("transformSeoIndexHtml", () => {
  it("absolutizes og:url with the production site origin", () => {
    const origin = siteOrigin({ VITE_SITE_URL: "https://mewandyou.com" });
    const html = transformSeoIndexHtml(indexHtml, origin);

    expect(html).toContain(
      '<meta property="og:url" content="https://mewandyou.com/" />',
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://mewandyou.com/" />',
    );
  });

  it("normalizes a bare production hostname in crawler fallback URLs", () => {
    const origin = siteOrigin({ VITE_SITE_URL: "mewandyou.com" });
    const html = transformSeoIndexHtml(indexHtml, origin);

    expect(html).toContain(
      '<meta property="og:url" content="https://mewandyou.com/" />',
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://mewandyou.com/" />',
    );
    expect(html).toContain(
      'content="https://mewandyou.com/images/mew-and-you-cat-peek.png"',
    );
  });

  it("keeps og:url aligned with the injected canonical for any origin", () => {
    const origin = siteOrigin({ VITE_SITE_URL: "https://mew-and-you.pages.dev" });
    const html = transformSeoIndexHtml(indexHtml, origin);
    const expected = `${origin}/`;

    expect(html).toContain(`<meta property="og:url" content="${expected}" />`);
    expect(html).toContain(`<link rel="canonical" href="${expected}" />`);
  });
});

describe("index.html crawler fallback", () => {
  it("includes a relative og:url placeholder for build-time absolutization", () => {
    expect(indexHtml).toContain('<meta property="og:url" content="/" />');
  });
});
