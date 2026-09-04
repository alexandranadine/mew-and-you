import { brand } from "./brand";
import type { Cat } from "../types/cat";

/** Default share image — the existing brand illustration in `public/`. */
export const DEFAULT_SHARE_IMAGE_PATH = "/images/mew-and-you-cat-peek.png";

export const DEFAULT_SHARE_IMAGE_ALT =
  "Illustrated calico kitten peeking over an edge, surrounded by flowers and yarn";

export function getSiteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function toAbsoluteUrl(pathOrUrl: string, origin = getSiteOrigin()): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return origin ? `${origin}${path}` : path;
}

export function truncateMetaDescription(
  text: string,
  maxLength = 160,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = lastSpace > 80 ? slice.slice(0, lastSpace) : slice;
  return `${clipped.trimEnd()}…`;
}

export const homeSeo = {
  title: `${brand.name} — Adoptable Cats in LA County`,
  description: brand.description,
  canonicalPath: "/",
} as const;

export const aboutSeo = {
  title: `About ${brand.name}`,
  description: `${brand.name} is a cozy search for adoptable cats in ${brand.serviceArea}, gathered from local shelters and rescues so you can browse in one place.`,
  canonicalPath: "/about",
} as const;

export const favoritesSeo = {
  title: `Favorites — ${brand.name}`,
  description: `Cats you've saved on this device while browsing adoptable listings on ${brand.name}.`,
  canonicalPath: "/favorites",
  robots: "noindex, follow",
} as const;

export const savedSearchesSeo = {
  title: `Saved searches — ${brand.name}`,
  description: `Search presets you've saved on this device for adoptable cats on ${brand.name}.`,
  canonicalPath: "/saved-searches",
  robots: "noindex, follow",
} as const;

export const notFoundSeo = {
  title: `Page not found — ${brand.name}`,
  description: `That page doesn't exist. Head back to search for adoptable cats in ${brand.serviceArea}.`,
  robots: "noindex, follow",
} as const;

export function searchSeo(zip?: string): {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
} {
  if (zip) {
    return {
      title: `Cats near ${zip} — ${brand.name}`,
      description: `Adoptable cats near ${zip} in ${brand.serviceArea}, aggregated from local shelters and rescues.`,
      canonicalPath: `/cats?zip=${encodeURIComponent(zip)}`,
    };
  }

  return {
    title: `Search adoptable cats — ${brand.name}`,
    description: `Search adoptable cats from shelters and rescues across ${brand.serviceArea}. Enter a ZIP code to see who is nearby.`,
    canonicalPath: "/cats",
    robots: "noindex, follow",
  };
}

export function invalidSearchSeo(): {
  title: string;
  description: string;
  canonicalPath: string;
  robots: string;
} {
  return {
    title: `Search adoptable cats — ${brand.name}`,
    description: `That search isn't valid. Try a 5-digit ZIP code to find adoptable cats in ${brand.serviceArea}.`,
    canonicalPath: "/cats",
    robots: "noindex, follow",
  };
}

export function catDetailLoadingSeo(catId: string | undefined): {
  title: string;
  description: string;
  canonicalPath: string;
} {
  return {
    title: `Cat profile — ${brand.name}`,
    description: `An adoptable cat listing on ${brand.name}.`,
    canonicalPath: catId ? `/cats/${encodeURIComponent(catId)}` : "/cats",
  };
}

export function catDetailMissingSeo(catId: string | undefined): {
  title: string;
  description: string;
  canonicalPath: string;
  robots: string;
} {
  return {
    title: `Cat not found — ${brand.name}`,
    description: `This listing may have been adopted already, or the link might be incorrect.`,
    canonicalPath: catId ? `/cats/${encodeURIComponent(catId)}` : "/cats",
    robots: "noindex, follow",
  };
}

export function catDetailSeo(cat: Cat): {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  imageAlt: string;
} {
  const locationLabel = [cat.organization.city, cat.organization.state]
    .filter(Boolean)
    .join(", ");
  const fallbackDescription = [
    `${cat.name} is an adoptable cat`,
    locationLabel ? `in ${locationLabel}` : `in ${brand.serviceArea}`,
    cat.organization.name ? `listed by ${cat.organization.name}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const descriptionSource = cat.description.trim() || fallbackDescription;

  return {
    title: `${cat.name} — Adoptable cat${locationLabel ? ` in ${locationLabel}` : ""} | ${brand.name}`,
    description: truncateMetaDescription(descriptionSource),
    canonicalPath: `/cats/${encodeURIComponent(cat.id)}`,
    image: cat.photos[0]?.url,
    imageAlt: cat.photos[0] ? `Photo of ${cat.name}` : DEFAULT_SHARE_IMAGE_ALT,
  };
}

export function websiteJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    description: brand.description,
    url: origin ? `${origin}/` : "/",
  };
}

/**
 * Schema.org has no Cat type. Describe the adoption listing as a WebPage
 * using only existing fields that are valid on Thing/WebPage.
 */
export function catJsonLd(cat: Cat, pageUrl: string) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: cat.name,
    url: pageUrl,
  };

  const description = cat.description.trim();
  if (description) data.description = description;

  const image = cat.photos[0]?.url;
  if (image) data.image = image;

  if (cat.adoptionUrl) {
    data.sameAs = cat.adoptionUrl;
  }

  return data;
}
