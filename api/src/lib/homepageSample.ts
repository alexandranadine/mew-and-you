import type { Cat } from "../models/cat";
import type {
  CatSearchParams,
  CatSearchProviderResult,
} from "../providers/CatProvider";
import { getCatProvider } from "../providers";
import { logger } from "./logger";

/** Modest in-memory TTL so homepage refreshes reuse a candidate pool. */
export const HOMEPAGE_SAMPLE_TTL_MS = 12 * 60 * 1000;

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

function poolCacheKey(zip: string, radiusMiles: number): string {
  return `${zip}:${radiusMiles}`;
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
  zip: string;
  radiusMiles: number;
  count: number;
}

export interface HomepageSampleOptions {
  now?: () => number;
  random?: () => number;
  searchCats?: (params: CatSearchParams) => Promise<CatSearchProviderResult>;
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

  const key = poolCacheKey(params.zip, params.radiusMiles);
  const cached = samplePoolCache.get(key);
  const cacheIsFresh =
    cached !== undefined && now() - cached.fetchedAt < HOMEPAGE_SAMPLE_TTL_MS;

  if (cacheIsFresh && cached) {
    return { cats: pickRandomDistinct(cached.cats, params.count, random) };
  }

  try {
    const result = await searchCats({
      zip: params.zip,
      radiusMiles: params.radiusMiles,
    });
    const pool = eligibleUniqueCats(result.cats);
    samplePoolCache.set(key, { cats: pool, fetchedAt: now() });
    return { cats: pickRandomDistinct(pool, params.count, random) };
  } catch {
    if (cached) {
      logger.warn(
        "Homepage sample pool refresh failed; serving stale cached pool",
        { zip: params.zip, radiusMiles: params.radiusMiles },
      );
      return { cats: pickRandomDistinct(cached.cats, params.count, random) };
    }

    logger.warn("Homepage sample request failed with no cached pool", {
      zip: params.zip,
      radiusMiles: params.radiusMiles,
    });
    return { cats: [] };
  }
}
