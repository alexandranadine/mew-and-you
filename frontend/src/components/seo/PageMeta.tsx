import { useLayoutEffect } from "react";
import {
  DEFAULT_SHARE_IMAGE_ALT,
  DEFAULT_SHARE_IMAGE_PATH,
  getSiteOrigin,
  toAbsoluteUrl,
} from "../../config/seo";
import { brand } from "../../config/brand";

const JSON_LD_SCRIPT_ID = "page-json-ld";
const ROUTE_IMAGE_PRELOAD_ID = "route-image-preload";

export interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
  image?: string;
  imageAlt?: string;
  /** When set, injects a high-priority image preload for this route only. */
  preloadImage?: string;
  jsonLd?: Record<string, unknown> | null;
}

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function upsertJsonLd(data: Record<string, unknown> | null | undefined) {
  const existing = document.getElementById(JSON_LD_SCRIPT_ID);
  if (!data) {
    existing?.remove();
    return;
  }

  const script =
    existing instanceof HTMLScriptElement
      ? existing
      : document.createElement("script");
  script.id = JSON_LD_SCRIPT_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
  if (!existing) document.head.appendChild(script);
}

function syncImagePreload(href: string | undefined) {
  const existing = document.getElementById(ROUTE_IMAGE_PRELOAD_ID);
  if (!href) {
    existing?.remove();
    return;
  }

  const link =
    existing instanceof HTMLLinkElement
      ? existing
      : document.createElement("link");
  link.id = ROUTE_IMAGE_PRELOAD_ID;
  link.rel = "preload";
  link.as = "image";
  link.href = href;
  link.setAttribute("fetchpriority", "high");
  if (!existing) document.head.appendChild(link);
}

/** Sets document title and social/SEO tags for the current route. Renders nothing. */
export function PageMeta({
  title,
  description,
  canonicalPath,
  robots = "index, follow",
  image,
  imageAlt,
  preloadImage,
  jsonLd,
}: PageMetaProps) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useLayoutEffect(() => {
    const origin = getSiteOrigin();
    const canonicalUrl = toAbsoluteUrl(canonicalPath, origin);
    const imageUrl = toAbsoluteUrl(image || DEFAULT_SHARE_IMAGE_PATH, origin);
    const alt = imageAlt || DEFAULT_SHARE_IMAGE_ALT;
    const parsedJsonLd = jsonLdKey
      ? (JSON.parse(jsonLdKey) as Record<string, unknown>)
      : null;

    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertLink("canonical", canonicalUrl);

    upsertMeta("property", "og:site_name", brand.name);
    upsertMeta("property", "og:locale", "en_US");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:alt", alt);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:image:alt", alt);

    upsertJsonLd(parsedJsonLd);
    syncImagePreload(preloadImage);

    return () => {
      if (preloadImage) syncImagePreload(undefined);
    };
  }, [
    title,
    description,
    canonicalPath,
    robots,
    image,
    imageAlt,
    preloadImage,
    jsonLdKey,
  ]);

  return null;
}
