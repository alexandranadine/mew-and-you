import type { Cat } from "../models/cat";
import type {
  CatSearchParams,
  CatSearchProviderResult,
} from "../providers/CatProvider";
import { getCatProvider } from "../providers";
import { logger } from "./logger";

/** Modest in-memory TTL so homepage refreshes reuse a candidate pool. */
export const HOMEPAGE_SAMPLE_TTL_MS = 12 * 60 * 1000;

/**
 * Candidate pool centers for homepage samples: Los Angeles + San Diego.
 * The `/api/cats/sample` query still accepts a ZIP for contract compatibility;
 * these fixed centers drive the pool, not the request ZIP.
 */
export const HOMEPAGE_SAMPLE_ZIPS = ["90012", "92101"] as const;

const MAPPER_UNNAMED_FALLBACK = /^unnamed cat$/i;

interface SamplePoolEntry {
  cats: Cat[];
  fetchedAt: number;
}

const samplePoolCache = new Map<string, SamplePoolEntry>();

export function resetHomepageSampleCache(): void {
  samplePoolCache.clear();
}

export function isEligibleHomepageSampleCat(cat: Cat): boolean {
  const name = cat.name?.trim() ?? "";
  if (!name || MAPPER_UNNAMED_FALLBACK.test(name)) {
    return false;
  }

  const photoUrl = cat.photos?.[0]?.url?.trim() ?? "";
  if (!photoUrl || !/^https?:\/\//i.test(photoUrl)) {
    return false;
  }

  return true;
}

export function pickRandomDistinct<T>(
  items: readonly T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const take = Math.min(Math.max(count, 0), items.length);
  if (take === 0) return [];

  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const current = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = current as T;
  }
  return copy.slice(0, take);
}

function poolCacheKey(radiusMiles: number): string {
  return `${HOMEPAGE_SAMPLE_ZIPS.join("+")}:${radiusMiles}`;
}

function eligibleUniqueCats(cats: Cat[]): Cat[] {
  const seen = new Set<string>();
  const eligible: Cat[] = [];
  for (const cat of cats) {
    if (seen.has(cat.id) || !isEligibleHomepageSampleCat(cat)) {
      continue;
    }
    seen.add(cat.id);
    eligible.push(cat);
  }
  return eligible;
}

export interface HomepageSampleParams {
  radiusMiles: number;
  count: number;
}

export interface HomepageSampleOptions {
  now?: () => number;
  random?: () => number;
  searchCats?: (params: CatSearchParams) => Promise<CatSearchProviderResult>;
}

async function fetchCombinedSamplePool(
  radiusMiles: number,
  searchCats: (params: CatSearchParams) => Promise<CatSearchProviderResult>,
): Promise<Cat[] | null> {
  const settled = await Promise.allSettled(
    HOMEPAGE_SAMPLE_ZIPS.map((zip) => searchCats({ zip, radiusMiles })),
  );

  const combined: Cat[] = [];
  let successCount = 0;

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const zip = HOMEPAGE_SAMPLE_ZIPS[i];
    if (outcome?.status === "fulfilled") {
      successCount += 1;
      combined.push(...outcome.value.cats);
    } else if (outcome?.status === "rejected") {
      logger.warn("Homepage sample ZIP search failed; continuing with others", {
        zip,
        radiusMiles,
      });
    }
  }

  if (successCount === 0) {
    return null;
  }

  return eligibleUniqueCats(combined);
}

export async function getHomepageSampleCats(
  params: HomepageSampleParams,
  options: HomepageSampleOptions = {},
): Promise<{ cats: Cat[] }> {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const searchCats =
    options.searchCats ??
    ((searchParams: CatSearchParams) =>
      getCatProvider().searchCats(searchParams));

  const key = poolCacheKey(params.radiusMiles);
  const cached = samplePoolCache.get(key);
  const cacheIsFresh =
    cached !== undefined && now() - cached.fetchedAt < HOMEPAGE_SAMPLE_TTL_MS;

  if (cacheIsFresh && cached) {
    return { cats: pickRandomDistinct(cached.cats, params.count, random) };
  }

  const pool = await fetchCombinedSamplePool(params.radiusMiles, searchCats);

  if (pool) {
    samplePoolCache.set(key, { cats: pool, fetchedAt: now() });
    return { cats: pickRandomDistinct(pool, params.count, random) };
  }

  if (cached) {
    logger.warn(
      "Homepage sample pool refresh failed; serving stale cached pool",
      {
        sampleZips: [...HOMEPAGE_SAMPLE_ZIPS],
        radiusMiles: params.radiusMiles,
      },
    );
    return { cats: pickRandomDistinct(cached.cats, params.count, random) };
  }

  logger.warn("Homepage sample request failed with no cached pool", {
    sampleZips: [...HOMEPAGE_SAMPLE_ZIPS],
    radiusMiles: params.radiusMiles,
  });
  return { cats: [] };
}
